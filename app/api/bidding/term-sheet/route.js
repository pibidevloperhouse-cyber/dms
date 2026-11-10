import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateTermSheetInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId') || searchParams.get('projectId');

    const store = await loadBiddingStoreAsync(dealId);
    return NextResponse.json({
      success: true,
      termSheet: store.termSheet,
      round: store.round,
      dealMeta: store.dealMeta
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { dealId, action, keyTerms, changedFields, requesterRole } = body;

    const targetRoundId = dealId || null;
    const store = await loadBiddingStoreAsync(targetRoundId);
    const resolvedRoundId = targetRoundId || store.round?.id || store.dealMeta?.roundId || null;
    const termSheet = store.termSheet;

    const updates = {};

    if (keyTerms) {
      updates.keyTerms = { ...termSheet.keyTerms, ...keyTerms };
    }

    if (changedFields) {
      updates.changedFields = { ...termSheet.changedFields, ...changedFields };
    }

    if (action === 'SEND_TO_BUYER') {
      updates.status = 'sent_to_buyer';
      updates.version = 'Draft v1 · sent for signature';
      updates.lastUpdated = `${new Date().getDate()} ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`;
    } else if (action === 'SAVE_DRAFT' || action === 'RESET_DRAFT') {
      if (action === 'RESET_DRAFT') {
        updates.status = 'draft';
        updates.signatures = { buyer: null, seller: null };
      }
      updates.lastUpdated = `${new Date().getDate()} ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`;
    }

    const updatedTermSheet = await updateTermSheetInDB(updates, resolvedRoundId);

    return NextResponse.json({
      success: true,
      message: 'Term sheet updated successfully',
      termSheet: updatedTermSheet
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet PATCH:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
