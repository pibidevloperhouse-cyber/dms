import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, computeBiddingKPIs } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || 'super_admin';
    const buyerId = searchParams.get('buyerId') || 'b'; // default buyer is XYZ Capital

    const store = await loadBiddingStoreAsync();
    const kpis = computeBiddingKPIs(store);

    // If role is super_admin (Seller Super Admin) -> returns all bids, full KPI ledger, and termSheet
    if (role === 'super_admin') {
      return NextResponse.json({
        success: true,
        role: 'super_admin',
        round: store.round,
        kpis,
        bids: store.bids,
        termSheet: store.termSheet,
        activeStage: 'Negotiation / Bidding'
      });
    }

    // If role is guest_admin (Buyer Guest Admin) -> returns their specific bid & public overview
    const myBid = store.bids[buyerId] || store.bids['b'];
    return NextResponse.json({
      success: true,
      role: 'guest_admin',
      round: {
        dealName: store.round.dealName,
        askingPriceFormatted: store.round.askingPriceFormatted,
        deadlineDisplay: store.round.deadlineDisplay,
        sector: store.round.sector,
        arr: store.round.arr,
        employees: store.round.employees,
        financialHealth: store.round.financialHealth,
        sellerAdvisor: store.round.sellerAdvisor,
        status: store.round.status
      },
      myBid,
      termSheet: store.termSheet.acceptedBidId === buyerId ? store.termSheet : null
    });
  } catch (error) {
    console.error('Error in /api/bidding GET:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
