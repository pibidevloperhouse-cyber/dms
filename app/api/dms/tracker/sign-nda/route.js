import { db } from '../../../../../db';
import { dmsDeals, dmsDealProposals, dmsTeasers, users, dmsProjects } from '../../../../../db/schema';
import { eq, and, or } from 'drizzle-orm';
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
    
    let targetProjectId = projectId;
    let targetBuyerId = buyerId;
    let targetDealName = 'Deal';

    // If proposalId is available, look up proposal details to ensure targetProjectId and targetBuyerId are resolved
    if (proposalId) {
      try {
        const [prop] = await db.select({
          buyerId: dmsDealProposals.buyerId,
          projectId: dmsTeasers.projectId,
          projectName: dmsProjects.name
        })
        .from(dmsDealProposals)
        .leftJoin(dmsTeasers, eq(dmsDealProposals.teaserId, dmsTeasers.id))
        .leftJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
        .where(eq(dmsDealProposals.id, proposalId));

        if (prop) {
          if (!targetBuyerId) targetBuyerId = prop.buyerId;
          if (!targetProjectId) targetProjectId = prop.projectId;
          if (prop.projectName) targetDealName = `${prop.projectName} Deal`;
        }
      } catch (err) {
        console.warn("Could not lookup proposal details:", err);
      }
    }

    let signatureUrl = signatureData; // fallback

    // If it's a base64 image
    if (signatureData && signatureData.startsWith('data:image')) {
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

    // 1. Try finding and updating by dealId
    if (dealId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          ...(proposalId ? { proposalId } : {}),
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(dmsDeals.id, dealId))
        .returning();
      updatedDeal = deal;
    }

    // 2. Try finding and updating by proposalId
    if (!updatedDeal && proposalId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(dmsDeals.proposalId, proposalId))
        .returning();
      updatedDeal = deal;
    }

    // 3. Try finding and updating by projectId and buyerId
    if (!updatedDeal && targetProjectId && targetBuyerId) {
      const [deal] = await db.update(dmsDeals)
        .set({ 
          ndaStatus: 'signed', 
          ndaSignature: signatureUrl,
          ...(proposalId ? { proposalId } : {}),
          status: 'active',
          updatedAt: new Date()
        })
        .where(and(eq(dmsDeals.projectId, targetProjectId), eq(dmsDeals.buyerId, targetBuyerId)))
        .returning();
      updatedDeal = deal;
    }

    // 4. If no deal existed, auto-insert it so the buyer has an active deal with signed NDA!
    if (!updatedDeal && targetProjectId && targetBuyerId) {
      const [deal] = await db.insert(dmsDeals).values({
        projectId: targetProjectId,
        buyerId: targetBuyerId,
        proposalId: proposalId || null,
        dealName: targetDealName,
        ndaStatus: 'signed',
        ndaSignature: signatureUrl,
        status: 'active'
      }).returning();
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

