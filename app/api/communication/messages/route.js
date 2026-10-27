import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users, communicationChannels } from '@/db/schema';
import { eq, asc, and, isNull } from 'drizzle-orm';
import { verifyChannelAccess, markChannelAsRead, recordMessageMentions } from '@/lib/communication/service';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId') || null;

    if (!channelId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Channel ID and User ID are required' },
        { status: 400 }
      );
    }

    // 1. Authoritative access check
    const authResult = await verifyChannelAccess(userId, channelId, workspaceId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 403 }
      );
    }

    // 2. Query persistent messages with sender info
    const channelMessages = await db
      .select({
        id: messages.id,
        channelId: messages.channelId,
        senderId: messages.senderId,
        senderName: users.name,
        senderEmail: users.email,
        senderRole: users.role,
        messageText: messages.messageText,
        messageType: messages.messageType,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        isEdited: messages.isEdited,
        metadata: messages.metadata,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.channelId, channelId), isNull(messages.deletedAt)))
      .orderBy(asc(messages.createdAt));

    // Filter out messages deleted specifically for this user ("Delete for me")
    const activeMessages = channelMessages.filter((msg) => {
      const meta = msg.metadata || {};
      const deletedFor = Array.isArray(meta.deletedFor) ? meta.deletedFor : [];
      return !deletedFor.includes(userId);
    });

    const formattedMessages = activeMessages.map((msg) => ({
      ...msg,
      isMine: msg.senderId === userId,
      isEdited: Boolean(msg.isEdited),
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      text: msg.messageText,
    }));

    return NextResponse.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error('Fetch Messages API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const {
      channelId,
      messageText,
      userId: directUserId,
      session,
      messageType = 'text',
      attachments = [],
      workspaceId = null,
    } = payload;

    const userId = directUserId || session?.id;

    if (!channelId || !userId || !messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Channel ID, User ID, and Message Text are required' },
        { status: 400 }
      );
    }

    // 1. Authoritative access check
    const authResult = await verifyChannelAccess(userId, channelId, workspaceId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 403 }
      );
    }

    const verifiedUser = authResult.user;

    // 2. Persist message with server-derived sender ID
    const [newMessage] = await db
      .insert(messages)
      .values({
        channelId,
        senderId: verifiedUser.id,
        messageText: messageText.trim(),
        messageType,
        attachments,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 3. Update channel activity timestamp & record mentions & sender read status
    try {
      await db
        .update(communicationChannels)
        .set({ lastActivityAt: new Date() })
        .where(eq(communicationChannels.id, channelId));

      await markChannelAsRead(verifiedUser.id, channelId);
      await recordMessageMentions(newMessage.id, channelId, verifiedUser.id, messageText);
    } catch (e) {
      console.warn('Failed to update channel lastActivityAt or mentions:', e);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        channelId: newMessage.channelId,
        senderId: verifiedUser.id,
        senderName: verifiedUser.name,
        senderEmail: verifiedUser.email,
        senderRole: verifiedUser.role,
        messageText: newMessage.messageText,
        text: newMessage.messageText,
        messageType: newMessage.messageType,
        attachments: newMessage.attachments,
        createdAt: newMessage.createdAt,
        timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMine: true,
        isEdited: false,
      },
    });
  } catch (error) {
    console.error('Send Message API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Edit a message (sender only)
 */
export async function PATCH(req) {
  try {
    const payload = await req.json();
    const {
      messageId,
      messageText,
      userId: directUserId,
      session,
      workspaceId = null,
    } = payload;

    const userId = directUserId || session?.id;

    if (!messageId || !userId || !messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message ID, User ID, and new Message Text are required' },
        { status: 400 }
      );
    }

    // 1. Fetch message
    const msgRows = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (msgRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    const targetMessage = msgRows[0];

    // 2. Verify channel access
    const authResult = await verifyChannelAccess(userId, targetMessage.channelId, workspaceId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 403 }
      );
    }

    // 3. Sender authorization check: only the sender can edit
    if (targetMessage.senderId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the sender can edit this message' },
        { status: 403 }
      );
    }

    // 4. Update message
    const [updated] = await db
      .update(messages)
      .set({
        messageText: messageText.trim(),
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    return NextResponse.json({
      success: true,
      message: {
        id: updated.id,
        channelId: updated.channelId,
        messageText: updated.messageText,
        text: updated.messageText,
        isEdited: true,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Edit Message API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Delete a message
 * - type='everyone': soft delete for everyone (sender or admin)
 * - type='me': hide message only for the requesting user
 */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'me'; // 'me' or 'everyone'
    const workspaceId = searchParams.get('workspaceId') || null;

    if (!messageId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Message ID and User ID are required' },
        { status: 400 }
      );
    }

    // 1. Fetch message
    const msgRows = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (msgRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    const targetMessage = msgRows[0];

    // 2. Verify channel access
    const authResult = await verifyChannelAccess(userId, targetMessage.channelId, workspaceId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 403 }
      );
    }

    const currentUser = authResult.user;

    // 3. Process deletion based on type
    if (type === 'everyone') {
      const isSender = targetMessage.senderId === userId;
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

      if (!isSender && !isAdmin) {
        return NextResponse.json(
          { success: false, error: 'You are not authorized to delete this message for everyone' },
          { status: 403 }
        );
      }

      // Soft delete for everyone
      await db
        .update(messages)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      return NextResponse.json({
        success: true,
        deleteType: 'everyone',
        messageId,
      });
    } else {
      // Delete for ME: add userId to metadata.deletedFor
      const currentMeta = targetMessage.metadata || {};
      const deletedFor = Array.isArray(currentMeta.deletedFor)
        ? [...currentMeta.deletedFor]
        : [];

      if (!deletedFor.includes(userId)) {
        deletedFor.push(userId);
      }

      await db
        .update(messages)
        .set({
          metadata: { ...currentMeta, deletedFor },
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      return NextResponse.json({
        success: true,
        deleteType: 'me',
        messageId,
      });
    }
  } catch (error) {
    console.error('Delete Message API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
