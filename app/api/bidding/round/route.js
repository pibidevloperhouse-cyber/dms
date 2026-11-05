import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateRoundInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const store = await loadBiddingStoreAsync();
    return NextResponse.json({ success: true, round: store.round });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { action, askingPrice, deadline, status, requesterRole } = body;

    // Only Seller Super Admin can modify the bidding round
    if (requesterRole && requesterRole !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only Seller Super Admin can update bidding round.' }, { status: 403 });
    }

    const updates = {};

    if (action === 'CLOSE_ROUND') {
      updates.status = 'closed';
      updates.statusLabel = 'Bidding Round Closed';
    } else {
      if (askingPrice !== undefined) {
        const numPrice = Number(askingPrice);
        updates.askingPrice = numPrice;
        updates.askingPriceFormatted = `$${(numPrice / 1000000).toFixed(1)}M`;
      }
      if (deadline) {
        updates.deadline = deadline;
      }
      if (status) {
        updates.status = status;
      }
    }

    const updatedRound = await updateRoundInDB(updates);

    return NextResponse.json({
      success: true,
      message: 'Bidding round updated successfully',
      round: updatedRound
    });
  } catch (error) {
    console.error('Error in /api/bidding/round PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
