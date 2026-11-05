import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateTermSheetInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { signerRole, signerName, signatureDataUrl } = body;

    const store = await loadBiddingStoreAsync();
    const termSheet = store.termSheet;

    const now = new Date();
    const formattedTimestamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    const signatures = termSheet.signatures ? { ...termSheet.signatures } : { buyer: null, seller: null };
    let newStatus = termSheet.status;
    let newStage = termSheet.stage;

    if (signerRole === 'guest_admin' || signerRole === 'buyer') {
      signatures.buyer = {
        signer: signerName || 'Arjun Mehta',
        role: 'Buyer Guest Admin',
        signedAt: formattedTimestamp,
        signatureDataUrl: signatureDataUrl || null
      };
      newStatus = 'signed_by_buyer';
    } else if (signerRole === 'super_admin' || signerRole === 'seller') {
      signatures.seller = {
        signer: signerName || 'Ravi Shankar',
        role: 'Seller Super Admin',
        signedAt: formattedTimestamp,
        signatureDataUrl: signatureDataUrl || null
      };

      if (signatures.buyer) {
        newStatus = 'executed';
        newStage = 'Stage 6 of 6 · Closed';
      }
    }

    const updatedTermSheet = await updateTermSheetInDB({
      signatures,
      status: newStatus,
      stage: newStage
    });

    return NextResponse.json({
      success: true,
      message: 'Term sheet signed successfully',
      signatures: updatedTermSheet.signatures,
      status: updatedTermSheet.status
    });
  } catch (error) {
    console.error('Error in /api/bidding/term-sheet/sign POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
