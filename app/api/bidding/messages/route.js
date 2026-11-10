import { NextResponse } from 'next/server';
import {
  loadBiddingStoreAsync,
  getMessageForBuyer,
  appendMessageInDB
} from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId') || searchParams.get('projectId') || null;
    const buyerId = searchParams.get('buyerId') || null;

    const store = await loadBiddingStoreAsync(dealId);
    const conversations = store.messages || {};

    if (buyerId) {
      const match = getMessageForBuyer(store, buyerId) || null;
      return NextResponse.json({
        success: true,
        conversation: match,
        dealMeta: store.dealMeta
      });
    }

    return NextResponse.json({
      success: true,
      conversations,
      dealMeta: store.dealMeta
    });
  } catch (err) {
    console.error('Error fetching bidding messages from DB:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { dealId, buyerId, text, sender, senderRole, category } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    const store = await loadBiddingStoreAsync(dealId || null);
    const effectiveBuyerId = buyerId || store.dealMeta?.buyerId || store.dealMeta?.dealId;
    if (!effectiveBuyerId) {
      return NextResponse.json({ error: 'Missing buyerId for bidding message' }, { status: 400 });
    }

    const isSeller = senderRole === 'seller' || sender?.includes('Super Admin') || sender?.includes('Seller');
    const now = new Date();
    const timestamp =
      now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = {
      id: 'm-' + Date.now(),
      sender: sender || (isSeller ? (store.dealMeta?.sellerName || 'Seller Admin') : (store.dealMeta?.buyerName || 'Buyer')),
      senderRole: isSeller ? 'seller' : 'buyer',
      isMe: isSeller,
      text: text.trim(),
      category: category || 'General',
      timestamp,
      createdAt: now.toISOString()
    };

    const updatedConversation = await appendMessageInDB(
      effectiveBuyerId,
      newMsg,
      dealId || store.round?.id || null
    );

    return NextResponse.json({
      success: true,
      message: newMsg,
      conversation: updatedConversation
    });
  } catch (err) {
    console.error('Error posting message to DB:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
