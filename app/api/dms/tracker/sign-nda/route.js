import { db } from '../../../../../db';
import { dmsDeals } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { proposalId, dealId, projectId, buyerId, signatureData } = body;

    if (!signatureData || (!proposalId && !dealId && (!projectId || !buyerId))) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let signatureUrl = signatureData; // fallback

    // If it's a base64 image
    if (signatureData.startsWith('data:image')) {
      const matches = signatureData.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageType = matches[1]; 
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fileName = `signature_${dealId || proposalId || Date.now()}_${Date.now()}.${imageType}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from('nda-signatures')
            .upload(fileName, buffer, {
              contentType: `image/${imageType}`,
              upsert: false
            });
            
          if (!uploadError) {
            // Get public URL
            const { data } = supabase.storage.from('nda-signatures').getPublicUrl(fileName);
            if (data?.publicUrl) {
              signatureUrl = data.publicUrl;
            }
          }
        } catch (uploadErr) {
          console.warn("Storage upload exception, fallback to raw signature:", uploadErr);
        }
      }
    }

    let updatedDeal = null;

    if (dealId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          updatedAt: new Date()
        })
        .where(eq(dmsDeals.id, dealId))
        .returning();
      updatedDeal = deal;
    }

    if (!updatedDeal && proposalId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          updatedAt: new Date()
        })
        .where(eq(dmsDeals.proposalId, proposalId))
        .returning();
      updatedDeal = deal;
    }

    if (!updatedDeal && projectId && buyerId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          updatedAt: new Date()
        })
        .where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.buyerId, buyerId)))
        .returning();
      updatedDeal = deal;
    }

    if (!updatedDeal) {
      return NextResponse.json({ error: 'Deal not found for signing NDA' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal: updatedDeal }, { status: 200 });
  } catch (error) {
    console.error('Failed to sign NDA:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

