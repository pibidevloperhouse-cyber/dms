import { NextResponse } from 'next/server';
import { db } from '../../../../db/index.js';
import { dmsInboxMessages, users } from '../../../../db/schema.js';
import { eq, desc, or, and } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const messages = await db
      .select({
        id: dmsInboxMessages.id,
        senderId: dmsInboxMessages.senderId,
        senderName: dmsInboxMessages.senderName,
        senderRole: dmsInboxMessages.senderRole,
        recipientId: dmsInboxMessages.recipientId,
        recipientName: dmsInboxMessages.recipientName,
        text: dmsInboxMessages.text,
        timestamp: dmsInboxMessages.timestamp,
        isRead: dmsInboxMessages.isRead,
      })
      .from(dmsInboxMessages)
      .where(or(eq(dmsInboxMessages.recipientId, userId), eq(dmsInboxMessages.senderId, userId)))
      .orderBy(desc(dmsInboxMessages.timestamp));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { senderId, senderName, senderRole, recipientId, recipientName, text } = body;

    if (!senderId || !recipientId || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMessage = await db.insert(dmsInboxMessages).values({
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      text,
      timestamp: new Date()
    }).returning();

    return NextResponse.json({ success: true, message: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { messageIds, userId } = body;

    if (messageIds && Array.isArray(messageIds)) {
      for (const id of messageIds) {
        await db.update(dmsInboxMessages).set({ isRead: true }).where(eq(dmsInboxMessages.id, id));
      }
    } else if (userId) {
      // For fallback matching if recipientId doesn't exactly match but recipientName does,
      // it's safest to just mark all unread where recipientId matches for this MVP.
      await db.update(dmsInboxMessages).set({ isRead: true }).where(eq(dmsInboxMessages.recipientId, userId));
    } else {
      return NextResponse.json({ error: 'Missing messageIds or userId' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const partnerId = searchParams.get('partnerId');

    if (!userId || !partnerId) {
      return NextResponse.json({ error: 'Missing userId or partnerId' }, { status: 400 });
    }

    await db.delete(dmsInboxMessages).where(
      or(
        and(eq(dmsInboxMessages.senderId, userId), eq(dmsInboxMessages.recipientId, partnerId)),
        and(eq(dmsInboxMessages.senderId, partnerId), eq(dmsInboxMessages.recipientId, userId))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
