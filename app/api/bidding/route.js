import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, computeBiddingKPIs, getBidForBuyer } from '@/lib/biddingFlowService';

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
      return NextResponse.json({
        success: true,
        role: 'super_admin',
        round: store.round,
        kpis,
        bids: store.bids,
        termSheet: store.termSheet,
        dealMeta: store.dealMeta,
        activeStage: 'Negotiation / Bidding'
      });
    }

    const effectiveBuyerId = buyerId || store.dealMeta?.buyerId || null;
    const myBid = getBidForBuyer(store, effectiveBuyerId);
    return NextResponse.json({
      success: true,
      role: 'guest_admin',
      round: {
        id: store.round?.id,
        dealId: store.round?.dealId,
        dealName: store.round?.dealName,
        askingPrice: store.round?.askingPrice,
        askingPriceFormatted: store.round?.askingPriceFormatted,
        deadline: store.round?.deadline,
        deadlineDisplay: store.round?.deadlineDisplay,
        sector: store.round?.sector,
        arr: store.round?.arr,
        employees: store.round?.employees,
        financialHealth: store.round?.financialHealth,
        sellerAdvisor: store.round?.sellerAdvisor,
        status: store.round?.status
      },
      myBid,
      dealMeta: store.dealMeta,
      termSheet: store.termSheet?.acceptedBidId === effectiveBuyerId ? store.termSheet : null
    });
  } catch (error) {
    console.error('Error in /api/bidding GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
