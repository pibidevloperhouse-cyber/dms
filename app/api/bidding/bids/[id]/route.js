import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, saveBidInDB, updateTermSheetInDB, saveBiddingStore } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const store = await loadBiddingStoreAsync();
    const bid = store.bids[id];

    if (!bid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bid,
      round: store.round
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, counterAmount, counterNote, requesterRole } = body;

    const store = await loadBiddingStoreAsync();
    const bid = store.bids[id];

    if (!bid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
    }

    const now = new Date();
    const formattedNow = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    // 1. Seller Counter Offer
    if (action === 'COUNTER') {
      if (requesterRole && requesterRole !== 'super_admin') {
        return NextResponse.json({ success: false, error: 'Only Seller Super Admin can counter-offer.' }, { status: 403 });
      }

      const numCounter = Number(counterAmount) || 100000000;
      const counterFormatted = `$${(numCounter / 1000000).toFixed(1)}M`;

      bid.status = 'Countered';
      bid.counterOffer = {
        amount: numCounter,
        amountFormatted: counterFormatted,
        note: counterNote || `The seller board is requesting ${counterFormatted} valuation.`,
        counteredAt: formattedNow
      };

      if (!bid.history) bid.history = [];
      bid.history.push({
        event: 'Seller Counter-Offer Sent',
        amount: counterFormatted,
        date: formattedNow,
        note: counterNote || 'Seller sent counter proposal'
      });

      await saveBidInDB(bid);
    }

    // 2. Seller Decline Bid
    else if (action === 'DECLINE') {
      if (requesterRole && requesterRole !== 'super_admin') {
        return NextResponse.json({ success: false, error: 'Only Seller Super Admin can decline a bid.' }, { status: 403 });
      }

      bid.status = 'Declined';
      if (!bid.history) bid.history = [];
      bid.history.push({
        event: 'Bid Declined by Seller',
        date: formattedNow,
        note: 'Bid declined by seller board'
      });

      await saveBidInDB(bid);
    }

    // 3. Seller Accept Bid & Move to Term Sheet
    else if (action === 'ACCEPT') {
      if (requesterRole && requesterRole !== 'super_admin') {
        return NextResponse.json({ success: false, error: 'Only Seller Super Admin can accept a bid.' }, { status: 403 });
      }

      bid.status = 'Accepted';
      if (!bid.history) bid.history = [];
      bid.history.push({
        event: 'Bid Accepted by Seller',
        amount: bid.offer,
        date: formattedNow,
        note: 'Moved to Term Sheet Drafting & Negotiation'
      });

      await saveBidInDB(bid);

      // Update term sheet in DB to reflect the accepted buyer
      const updatedTermSheet = {
        ...store.termSheet,
        acceptedBidId: id,
        buyerName: bid.name,
        buyerMark: bid.mark,
        buyerType: bid.type,
        status: 'draft',
        keyTerms: {
          ...(store.termSheet.keyTerms || {}),
          purchasePrice: `$${(bid.offerAmount).toLocaleString()}`,
          structure: `${bid.cash} cash at close / ${bid.stock} acquirer stock, 12-month vest`,
          expectedClose: bid.expectedCloseDate ? `${new Date(bid.expectedCloseDate).getDate()} ${new Date(bid.expectedCloseDate).toLocaleString('default', { month: 'long', year: 'numeric' })}` : "15 December 2026"
        }
      };

      await updateTermSheetInDB(updatedTermSheet);
      store.termSheet = updatedTermSheet;
    }

    // 4. Buyer Match Counter
    else if (action === 'MATCH_COUNTER') {
      if (bid.counterOffer) {
        const matchedAmount = bid.counterOffer.amount;
        bid.offerAmount = matchedAmount;
        bid.offer = bid.counterOffer.amountFormatted;
        bid.vsAsk = '±0%';
        bid.vsColor = '#16a34a';
        bid.status = 'Under review';
        delete bid.counterOffer;

        if (!bid.history) bid.history = [];
        bid.history.push({
          event: 'Counter-Offer Matched by Buyer',
          amount: bid.offer,
          date: formattedNow,
          note: 'Buyer matched seller counter-offer at asking price'
        });

        await saveBidInDB(bid);
      }
    }

    // 5. Shortlist
    else if (action === 'SHORTLIST') {
      bid.status = 'Shortlisted';
      if (!bid.history) bid.history = [];
      bid.history.push({
        event: 'Bid Shortlisted by Seller',
        date: formattedNow,
        note: 'Bid shortlisted for final consideration'
      });
      await saveBidInDB(bid);
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed successfully`,
      bid,
      termSheet: store.termSheet
    });
  } catch (error) {
    console.error('Error in /api/bidding/bids/[id] PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
