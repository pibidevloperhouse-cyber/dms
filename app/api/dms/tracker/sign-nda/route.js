import { db } from '../../../../../db';
import { dmsDeals } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { proposalId, signatureData } = body;

    if (!proposalId || !signatureData) {
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
        
        const fileName = `signature_${proposalId}_${Date.now()}.${imageType}`;
        
        const { error: uploadError } = await supabase.storage
          .from('nda-signatures')
          .upload(fileName, buffer, {
            contentType: `image/${imageType}`,
            upsert: false
          });
          
        if (uploadError) {
          console.error("Supabase Upload Error:", uploadError);
          return NextResponse.json({ error: 'Failed to upload signature image' }, { status: 500 });
        }
        
        // Get public URL
        const { data } = supabase.storage.from('nda-signatures').getPublicUrl(fileName);
        signatureUrl = data.publicUrl;
      }
    }

    // Update the deal matching the proposalId
    const [updatedDeal] = await db.update(dmsDeals)
      .set({ 
        ndaStatus: 'signed', 
        ndaSignature: signatureUrl,
        updatedAt: new Date()
      })
      .where(eq(dmsDeals.proposalId, proposalId))
      .returning();

    if (!updatedDeal) {
      return NextResponse.json({ error: 'Deal not found for this proposal' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal: updatedDeal }, { status: 200 });
  } catch (error) {
    console.error('Failed to sign NDA:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
