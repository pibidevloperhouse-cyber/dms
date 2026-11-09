import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateSpaInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId') || searchParams.get('projectId');

    const store = await loadBiddingStoreAsync(dealId);
    return NextResponse.json({
      success: true,
      spa: store.spa,
      termSheet: store.termSheet,
      round: store.round
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { dealId, action, articles, changedFields, requesterRole } = body;

    const targetRoundId = dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f';
    const store = await loadBiddingStoreAsync(targetRoundId);
    const spa = store.spa;

    const updates = {};

    if (articles) {
      updates.articles = { ...(spa.articles || {}), ...articles };
    }

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    if (action === 'DISPATCH_TO_BUYER') {
      updates.status = 'dispatched';
      updates.version = 'v1.0 Definitive Execution Copy';
      updates.lastUpdated = formattedDate;
    } else if (action === 'SAVE_DRAFT') {
      updates.lastUpdated = formattedDate;
    } else if (action === 'RESET_DRAFT') {
      updates.status = 'draft';
      updates.signatures = {
        seller: {
          signer: 'Vishwa Raj',
          company: 'VDR Sell Technologies Inc.',
          role: 'Seller Super Admin & Authorized Officer',
          signedAt: `${formattedDate}, 04:00 PM IST`,
          endorsed: true
        },
        buyer: null
      };
      updates.lastUpdated = formattedDate;
    }

    const updatedSpa = await updateSpaInDB(updates, targetRoundId);

    return NextResponse.json({
      success: true,
      message: 'SPA updated successfully',
      spa: updatedSpa
    });
  } catch (error) {
    console.error('Error in /api/bidding/spa PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

