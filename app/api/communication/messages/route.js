import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users, communicationChannels } from '@/db/schema';
import { eq, asc, and, isNull } from 'drizzle-orm';
import { verifyChannelAccess } from '@/lib/communication/service';

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
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(eq(messages.channelId, channelId), isNull(messages.deletedAt)))
      .orderBy(asc(messages.createdAt));

    const formattedMessages = channelMessages.map((msg) => ({
      ...msg,
      isMine: msg.senderId === userId,
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

    // 3. Update channel activity timestamp
    try {
      await db
        .update(communicationChannels)
        .set({ lastActivityAt: new Date() })
        .where(eq(communicationChannels.id, channelId));
    } catch (e) {
      console.warn('Failed to update channel lastActivityAt:', e);
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
      },
    });
  } catch (error) {
    console.error('Send Message API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
