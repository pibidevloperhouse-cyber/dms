import { db } from '../../../../db';
import { dmsDealProposals, dmsTeasers, users, dmsDeals, companies, buyerProfiles } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // First find the teaser for this project
    const [teaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, projectId));
    
    if (!teaser) {
      return NextResponse.json({ proposals: [] }, { status: 200 });
    }

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
    .where(eq(dmsDealProposals.teaserId, teaser.id))
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

    // If accepted, auto-create the Deal!
    if (action === 'accept') {
      const [buyer] = await db.select().from(users).where(eq(users.id, updatedProposal.buyerId));
      const companyName = buyer?.companyName || buyer?.name || 'Unknown Buyer';

      // Check if deal already exists to prevent duplicates
      const [existingDeal] = await db.select().from(dmsDeals)
        .where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.buyerId, updatedProposal.buyerId)));
      
      if (!existingDeal) {
        await db.insert(dmsDeals).values({
          projectId,
          buyerId: updatedProposal.buyerId,
          proposalId: updatedProposal.id,
          dealName: `${companyName} Deal`,
          ndaStatus: 'pending',
          status: 'active'
        });
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
