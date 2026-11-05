import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateTermSheetInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = await loadBiddingStoreAsync();
    return NextResponse.json({
      success: true,
      comments: store.termSheet.counselComments || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sender, role, message, avatar } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Comment message is required' }, { status: 400 });
    }

    const store = await loadBiddingStoreAsync();

    const now = new Date();
    const formattedTimestamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newComment = {
      id: `c-${Date.now()}`,
      sender: sender || (role === 'super_admin' ? 'Linklane LLP (seller counsel)' : 'You (Buyer Counsel)'),
      role: role || 'buyer',
      avatar: avatar || (role === 'super_admin' ? 'LC' : 'RO'),
      message: message.trim(),
      timestamp: formattedTimestamp
    };

    const existingComments = store.termSheet.counselComments || [];
    const updatedComments = [...existingComments, newComment];

    const updatedTermSheet = await updateTermSheetInDB({
      counselComments: updatedComments
    });

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      comments: updatedTermSheet.counselComments
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/comments POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
