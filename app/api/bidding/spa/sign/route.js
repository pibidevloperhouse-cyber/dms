import { NextResponse } from 'next/server';
import { loadBiddingStoreAsync, updateSpaInDB, updateRoundInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { dealId, signerName, signatureDataUrl } = body;

    const store = await loadBiddingStoreAsync(dealId || null);
    const targetRoundId = dealId || store.round?.id || store.dealMeta?.roundId || null;
    const spa = store.spa;

    const now = new Date();
    const formattedTimestamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST`;

    const signatures = spa.signatures ? { ...spa.signatures } : { seller: null, buyer: null };

    // Buyer signs the definitive Share Purchase Agreement
    signatures.buyer = {
      signer: signerName || store.dealMeta?.buyerName || spa.buyerName || 'Buyer',
      role: 'Buyer Lead Principal & Authorized Signatory',
      company: store.dealMeta?.buyerCompany || spa.buyerCompany || '',
      signedAt: formattedTimestamp,
      signatureDataUrl: signatureDataUrl || null
    };

    // Ensure seller signature is also endorsed from DB deal seller
    if (!signatures.seller) {
      signatures.seller = {
        signer: store.dealMeta?.sellerName || spa.sellerName || 'Seller Admin',
        company: store.dealMeta?.sellerCompany || spa.sellerCompany || '',
        role: 'Seller Super Admin & Authorized Officer',
        signedAt: formattedTimestamp,
        endorsed: true
      };
    }

    const updatedSpa = await updateSpaInDB(
      {
        signatures,
        status: 'executed'
      },
      targetRoundId
    );

    try {
      await updateRoundInDB(
        {
          status: 'closed',
          statusLabel: 'Deal Executed & Closed'
        },
        targetRoundId
      );
    } catch (err) {
      console.error('Error closing round after SPA execution:', err);
    }

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
