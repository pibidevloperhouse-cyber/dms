import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, saveBidInDB, computeBiddingKPIs, getBidForBuyer } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'super_admin';
    const dealId = searchParams.get('dealId') || searchParams.get('projectId');
    const buyerId = searchParams.get('buyerId') || 'b';

    const store = await loadBiddingStoreAsync(dealId);
    const kpis = computeBiddingKPIs(store);

    if (role === 'super_admin') {
      // Ensure only unique bids keyed by bid.id are returned, sorted by latest updated_at descending
      const uniqueBids = {};
      const sortedBids = Object.values(store.bids || {}).sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.updated_at || a.history?.[a.history?.length - 1]?.date || 0).getTime();
        const timeB = new Date(b.updatedAt || b.updated_at || b.history?.[b.history?.length - 1]?.date || 0).getTime();
        return timeB - timeA;
      });
      for (const b of sortedBids) {
        if (b && b.id && !uniqueBids[b.id]) {
          uniqueBids[b.id] = b;
        }
      }
      return NextResponse.json({
        success: true,
        bids: uniqueBids,
        kpis,
        round: store.round
      });
    }

    const myBid = getBidForBuyer(store, buyerId);

    return NextResponse.json({
      success: true,
      myBid,
      round: store.round
    });
  } catch (error) {
    console.error('Error in /api/bidding/bids GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Buyer submits initial or revised bid
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      dealId,
      buyerId = '3e5cac9b-e809-4a2a-a95d-35e9baa6eddf',
      buyerName = 'Naga Tech',
      offerAmount,
      closeDate,
      cashPercent = 70,
      financingType = 'Private Equity / Cash',
      contingencies = '',
      note = '',
      requesterRole = 'guest_admin',
      documents
    } = body;

    const store = await loadBiddingStoreAsync(dealId);

    const numOffer = Number(offerAmount) || 10000000;
    const askPrice = store.round?.askingPrice || 10000000;
    const vsAskPct = Math.round(((numOffer - askPrice) / askPrice) * 100);
    const vsAskStr = vsAskPct === 0 ? '±0%' : `${vsAskPct > 0 ? '+' : ''}${vsAskPct}%`;
    const vsColor = vsAskPct >= 0 ? '#16a34a' : '#dc2626';

    const stockPercent = 100 - Number(cashPercent);
    const offerFormatted = `$${(numOffer / 1000000).toFixed(1)}M`;

    const now = new Date();
    const formattedNow = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    // Target existing or create new bid
    const existing = store.bids[buyerId] || 
      Object.values(store.bids).find(b => b.buyerId === buyerId || b.id === buyerId) || {
      id: buyerId,
      roundId: store.round?.id || 'c7330177-a8ab-47a2-933c-af0be1d1246f',
      dealId: buyerId,
      buyerId: buyerId,
      name: buyerName,
      mark: buyerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'NT',
      type: 'Venture Capital (VC)',
      buyerRole: 'guest_admin',
      views: 12,
      documents: [{ name: 'Letter of Intent — signed.pdf', size: '2.1 MB', type: 'pdf' }],
      history: []
    };

    const updatedBid = {
      ...existing,
      offerAmount: numOffer,
      offer: offerFormatted,
      vsAsk: vsAskStr,
      vsColor,
      cash: `${cashPercent}%`,
      stock: `${stockPercent}%`,
      close: closeDate ? new Date(closeDate).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Dec 2026',
      expectedCloseDate: closeDate || '2026-12-15',
      financingType,
      contingencies,
      note,
      documents: Array.isArray(documents) ? documents : (existing.documents || []),
      status: 'Under review',
      submittedAt: formattedNow,
      history: [
        ...(existing.history || []),
        {
          event: existing.history?.length > 0 ? 'Bid Revised' : 'Initial Bid Submitted',
          amount: offerFormatted,
          date: `${formattedNow}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`,
          note: note || `Offer revised with ${cashPercent}% cash / ${stockPercent}% stock`
        }
      ]
    };

    if (updatedBid.counterOffer) {
      delete updatedBid.counterOffer;
    }

    await saveBidInDB(updatedBid);

    return NextResponse.json({
      success: true,
      message: 'Bid submitted successfully',
      bid: updatedBid
    });
  } catch (error) {
    console.error('Error in /api/bidding/bids POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
