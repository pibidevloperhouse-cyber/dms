import { db } from '../../../../db';
import { dmsDealProposals, dmsTeasers, users, dmsDeals, companies, buyerProfiles } from '../../../../db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Find the teaser(s) for this project
    const teasers = await db.select().from(dmsTeasers)
      .where(or(eq(dmsTeasers.projectId, projectId), eq(dmsTeasers.id, projectId)));
    
    if (!teasers || teasers.length === 0) {
      return NextResponse.json({ proposals: [] }, { status: 200 });
    }

    const teaserIds = teasers.map(t => t.id);

    // Now get proposals and join with users and buyerProfiles to get buyer details
    const proposals = await db.select({
      id: dmsDealProposals.id,
      status: dmsDealProposals.status,
      message: dmsDealProposals.message,
      createdAt: dmsDealProposals.createdAt,
      buyerId: users.id,
      fullName: users.name,
      email: users.email,
      company: companies.name,
      jobTitle: users.jobTitle,
      investorType: companies.operationType,
      investmentRange: users.investmentRange,
      companyDescription: buyerProfiles.companyDescription,
      foundedYear: buyerProfiles.foundedYear,
      headquarters: buyerProfiles.headquarters,
      teamSize: buyerProfiles.teamSize,
      dealBreakers: buyerProfiles.dealBreakers,
      timelineToCloseDays: buyerProfiles.timelineToCloseDays,
    })
    .from(dmsDealProposals)
    .where(inArray(dmsDealProposals.teaserId, teaserIds))
    .leftJoin(users, eq(dmsDealProposals.buyerId, users.id))
    .leftJoin(companies, eq(users.companyId, companies.id))
    .leftJoin(buyerProfiles, eq(users.id, buyerProfiles.userId));

    return NextResponse.json({ proposals }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { proposalId, action, projectId } = data;

    if (!proposalId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if ((action === 'accept' || action === 'revoke') && !projectId) {
      return NextResponse.json({ error: 'projectId is required for accept/revoke actions' }, { status: 400 });
    }

    let newStatus = 'rejected';
    if (action === 'accept') newStatus = 'approved';
    else if (action === 'revoke') newStatus = 'revoked';
    else if (action === 'withdraw') newStatus = 'withdrawn';

    // Update proposal status
    const [updatedProposal] = await db.update(dmsDealProposals)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(dmsDealProposals.id, proposalId))
      .returning();

    if (!updatedProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // If accepted, auto-create the Deal in 'pending_approval' status and request vault from Business Owner!
    if (action === 'accept') {
      const [buyer] = await db.select().from(users).where(eq(users.id, updatedProposal.buyerId));
      const companyName = buyer?.companyName || buyer?.name || 'Unknown Buyer';

      const storagePlan = data.storagePlan || 'Pro Deal Vault (50 GB)';
      const storageLimitMb = Number(data.storageLimitMb) || 51200;
      const sellerName = data.sellerName || 'Seller Admin';
      const sellerEmail = data.sellerEmail || 'seller@vdr.com';
      const projectName = data.projectName || 'Project';

      // Check if deal already exists to prevent duplicates
      const [existingDeal] = await db.select().from(dmsDeals)
        .where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.buyerId, updatedProposal.buyerId)));
      
      let dealId;
      if (!existingDeal) {
        const [insertedDeal] = await db.insert(dmsDeals).values({
          projectId,
          buyerId: updatedProposal.buyerId,
          proposalId: updatedProposal.id,
          dealName: `${companyName} Deal`,
          ndaStatus: 'pending',
          status: 'pending_approval' // <-- Initial status is pending Business Owner approval!
        }).returning();
        dealId = insertedDeal.id;
      } else {
        dealId = existingDeal.id;
        await db.update(dmsDeals)
          .set({ 
            proposalId: updatedProposal.id, 
            status: 'pending_approval',
            updatedAt: new Date() 
          })
          .where(eq(dmsDeals.id, existingDeal.id));
      }

      // Submit Deal Vault Request to Business Owner Command Center
      try {
        const { createDealVaultRequest } = require('@/services/workspaceService');
        await createDealVaultRequest({
          dealId,
          projectId,
          projectName,
          dealName: `${companyName} Deal`,
          companyName,
          sellerName,
          sellerEmail,
          planName: storagePlan,
          storageLimitMb,
          applicantName: buyer?.name || companyName,
          applicantEmail: buyer?.email || ''
        });
      } catch (err) {
        console.error("Failed to create deal vault request in workspaceService:", err);
      }
    } else if (action === 'revoke') {
      // If revoked, also revoke the associated deal if it exists
      await db.update(dmsDeals)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.proposalId, proposalId)));
    } else if (action === 'reject') {
      // If rejected, completely delete the associated deal if it exists
      await db.delete(dmsDeals)
        .where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.proposalId, proposalId)));
    }

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });
  } catch (error) {
    console.error('Failed to update proposal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
