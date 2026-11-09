import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateSpaInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const store = await loadBiddingStoreAsync();
    return NextResponse.json({
      success: true,
      comments: store.spa?.counselComments || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { sender, role, avatar, message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const store = await loadBiddingStoreAsync();
    const comments = store.spa?.counselComments || [];

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newComment = {
      id: `spa-c-${Date.now()}`,
      sender: sender || 'Legal Counsel',
      role: role || 'counsel',
      avatar: avatar || 'LC',
      message: message.trim(),
      timestamp: `${day} ${month}, ${time}`
    };

    const updatedComments = [...comments, newComment];
    await updateSpaInDB({ counselComments: updatedComments });

    return NextResponse.json({
      success: true,
      comment: newComment,
      comments: updatedComments
    });
  } catch (error) {
    console.error('Error in /api/bidding/spa/comments POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

