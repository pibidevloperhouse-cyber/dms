import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, appendMessageInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId') || searchParams.get('projectId');
    const buyerId = searchParams.get('buyerId');

    const store = await loadBiddingStoreAsync(dealId);
    const messages = store.messages || {};

    if (buyerId) {
      const match = messages[buyerId] || 
        Object.values(messages).find(m => m.buyerId === buyerId || m.buyerUserId === buyerId) ||
        Object.values(messages)[0];
      return NextResponse.json({ conversation: match });
    }

    return NextResponse.json({ conversations: messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { dealId, buyerId, text, sender, senderRole, category } = body;

    if (!buyerId || !text) {
      return NextResponse.json({ error: 'buyerId and text are required' }, { status: 400 });
    }

    const isMe = senderRole === 'seller' || sender === 'You';
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = {
      id: 'm-' + Date.now(),
      sender: sender || (isMe ? 'You' : 'Buyer'),
      senderRole: senderRole || (isMe ? 'seller' : 'buyer'),
      isMe,
      text: text.trim(),
      category: category || 'General',
      timestamp
    };

    const targetRoundId = dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f';
    const updatedConversation = await appendMessageInDB(buyerId, newMsg, targetRoundId);

    return NextResponse.json({
      success: true,
      message: newMsg,
      conversation: updatedConversation
    });
  } catch (err) {
    console.error('Error posting message:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
