import { NextResponse } from 'next/server';
import {
  loadBiddingStoreAsync,
  saveBidInDB,
  computeBiddingKPIs,
  getBidForBuyer,
  getDealContextFromDB
} from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'super_admin';
    const dealId = searchParams.get('dealId') || searchParams.get('projectId') || null;
    const buyerId = searchParams.get('buyerId') || null;

    const store = await loadBiddingStoreAsync(dealId);
    const kpis = computeBiddingKPIs(store);

    if (role === 'super_admin') {
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
        round: store.round,
        dealMeta: store.dealMeta
      });
    }

    const effectiveBuyerId = buyerId || store.dealMeta?.buyerId || null;
    const myBid = getBidForBuyer(store, effectiveBuyerId);

    return NextResponse.json({
      success: true,
      myBid,
      round: store.round,
      dealMeta: store.dealMeta
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
      buyerId: rawBuyerId,
      buyerName: rawBuyerName,
      offerAmount,
      closeDate,
      expectedCloseDate,
      cashPercent = 70,
      financingType = '',
      contingencies = '',
      note = '',
      documents
    } = body;

    const store = await loadBiddingStoreAsync(dealId);
    const dealCtx = await getDealContextFromDB(dealId, rawBuyerId);
    const buyerId = rawBuyerId || dealCtx.buyerId;
    if (!buyerId) {
      return NextResponse.json({ success: false, error: 'Missing buyerId for bid submission' }, { status: 400 });
    }

    const buyerName = rawBuyerName || dealCtx.buyerCompany || dealCtx.buyerName || 'Buyer';
    const targetCloseDate = expectedCloseDate || closeDate || '';

    const numOffer = Number(offerAmount) || 0;
    const askPrice = Number(store.round?.askingPrice) || 0;
    const vsAskPct = askPrice > 0 ? Math.round(((numOffer - askPrice) / askPrice) * 100) : 0;
    const vsAskStr = vsAskPct === 0 ? '±0%' : `${vsAskPct > 0 ? '+' : ''}${vsAskPct}%`;
    const vsColor = vsAskPct >= 0 ? '#16a34a' : '#dc2626';

    const stockPercent = 100 - Number(cashPercent);
    const offerFormatted = `$${(numOffer / 1000000).toFixed(1)}M`;

    const now = new Date();
    const formattedNow = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    const existing =
      store.bids[buyerId] ||
      Object.values(store.bids).find(b => b.buyerId === buyerId || b.id === buyerId) || {
        id: buyerId,
        roundId: store.round?.id || dealCtx.roundId || null,
        dealId: dealCtx.dealId || buyerId,
        buyerId,
        name: buyerName,
        mark: buyerName.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'B',
        type: [dealCtx.buyerType, dealCtx.buyerCountry].filter(Boolean).join(' · ') || 'Strategic Buyer',
        buyerRole: 'guest_admin',
        leadName: dealCtx.buyerName || buyerName,
        advisorName: store.round?.sellerAdvisor || dealCtx.sellerName || '',
        ndaSignedDate: dealCtx.ndaSignedDate || '',
        views: 0,
        documents: [],
        history: []
      };

    const updatedBid = {
      ...existing,
      roundId: existing.roundId || store.round?.id || dealCtx.roundId || null,
      offerAmount: numOffer,
      offer: offerFormatted,
      vsAsk: vsAskStr,
      vsColor,
      cash: `${cashPercent}%`,
      stock: `${stockPercent}%`,
      close: targetCloseDate
        ? new Date(targetCloseDate).toLocaleString('default', { month: 'short', year: 'numeric' })
        : '',
      expectedCloseDate: targetCloseDate,
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
          note: note || `Offer submitted with ${cashPercent}% cash / ${stockPercent}% stock`
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
