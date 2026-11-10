import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateTermSheetInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId') || searchParams.get('projectId') || null;
    const store = await loadBiddingStoreAsync(dealId);

    return NextResponse.json({
      success: true,
      comments: store.termSheet?.counselComments || []
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/comments GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { dealId, sender, role, message, avatar } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Comment message is required' }, { status: 400 });
    }

    const store = await loadBiddingStoreAsync(dealId || null);

    const isSeller =
      role === 'super_admin' ||
      role === 'seller' ||
      role === 'seller_counsel' ||
      sender?.includes('Super Admin') ||
      sender?.includes('Seller');

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedTimestamp = `${day} ${month}, ${time}`;

    const newComment = {
      id: `c-${Date.now()}`,
      sender: sender || (isSeller ? (store.dealMeta?.sellerName || 'Seller Admin') : (store.dealMeta?.buyerName || 'Buyer')),
      role: isSeller ? 'seller' : 'buyer',
      avatar: avatar || (isSeller ? 'SA' : 'BA'),
      message: message.trim(),
      timestamp: formattedTimestamp,
      createdAt: now.toISOString()
    };

    const existingComments = Array.isArray(store.termSheet?.counselComments)
      ? store.termSheet.counselComments
      : [];
    const updatedComments = [...existingComments, newComment];

    await updateTermSheetInDB(
      { counselComments: updatedComments },
      dealId || store.round?.id || null
    );

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      comments: updatedComments
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/comments POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
