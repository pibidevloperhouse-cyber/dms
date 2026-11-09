import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateSpaInDB, updateRoundInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { signerRole, signerName, signatureDataUrl } = body;

    const store = await loadBiddingStoreAsync();
    const spa = store.spa;

    const now = new Date();
    const formattedTimestamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    const signatures = spa.signatures ? { ...spa.signatures } : { seller: null, buyer: null };

    // Buyer signs the definitive Share Purchase Agreement
    signatures.buyer = {
      signer: signerName || spa.buyerName || 'Vijay',
      role: 'Buyer Lead Principal & Authorized Signatory',
      company: spa.buyerCompany || 'Vijay Strategic Holdings LLC',
      signedAt: formattedTimestamp,
      signatureDataUrl: signatureDataUrl || null
    };

    // Ensure seller signature is also endorsed
    if (!signatures.seller) {
      signatures.seller = {
        signer: 'Vishwa Raj',
        company: 'VDR Sell Technologies Inc.',
        role: 'Seller Super Admin & Authorized Officer',
        signedAt: formattedTimestamp,
        endorsed: true
      };
    }

    const newStatus = 'executed';

    const updatedSpa = await updateSpaInDB({
      signatures,
      status: newStatus
    });

    // Update round status to Deal Executed & Closed
    try {
      await updateRoundInDB({
        status: 'closed',
        statusLabel: 'Deal Executed & Closed'
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Share Purchase Agreement executed and deal successfully closed!',
      signatures: updatedSpa.signatures,
      status: updatedSpa.status
    });
  } catch (error) {
    console.error('Error in /api/bidding/spa/sign POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

