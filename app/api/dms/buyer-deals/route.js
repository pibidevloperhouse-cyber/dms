import { db } from '../../../../db';
import { dmsDeals, dmsProjects, dmsDealProposals, dmsTeasers } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');
    const role = searchParams.get('role');

    if (!buyerId && !role) {
      return NextResponse.json({ error: 'Missing buyerId' }, { status: 400 });
    }

    // A buyer's workspace ONLY shows projects that exist in the buyer's tracker requests (dmsDealProposals)
    const query = db.select({
      id: dmsDealProposals.id,
      status: dmsDealProposals.status,
      createdAt: dmsDealProposals.createdAt,
      projectName: dmsProjects.name,
      projectId: dmsProjects.id,
      projectType: dmsProjects.projectType,
      dealId: dmsDeals.id,
      dealName: dmsDeals.dealName,
      dealProjectId: dmsDeals.projectId,
      dealStatus: dmsDeals.status,
      ndaStatus: dmsDeals.ndaStatus,
      teaserDealType: dmsTeasers.businessModel
    })
      .from(dmsDealProposals)
      .leftJoin(dmsTeasers, eq(dmsDealProposals.teaserId, dmsTeasers.id))
      .leftJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
      .leftJoin(dmsDeals, eq(dmsDeals.proposalId, dmsDealProposals.id));

    let proposals;
    if (buyerId && role !== 'admin') {
      proposals = await query.where(eq(dmsDealProposals.buyerId, buyerId)).orderBy(desc(dmsDealProposals.createdAt));
    } else {
      proposals = await query.orderBy(desc(dmsDealProposals.createdAt));
    }

    const uniqueProjectsMap = new Map();
    for (const p of proposals) {
      const pid = p.projectId || p.dealProjectId;
      if (!pid || uniqueProjectsMap.has(pid)) continue;

      const pStatus = (p.status || 'pending').toLowerCase();
      let status = 'inactive'; // Default for pending proposals
      if (pStatus === 'approved' || pStatus === 'accepted') {
        status = 'active'; // Approved -> ACTIVE in workspace
      } else if (pStatus === 'rejected') {
        status = 'rejected';
      }

      uniqueProjectsMap.set(pid, {
        id: p.dealId || p.id,
        projectId: pid,
        name: p.projectName || p.dealName || 'Confidential Project',
        dealType: p.teaserDealType || p.projectType || 'M&A',
        status: status,
        ndaStatus: p.ndaStatus || 'pending',
        proposalId: p.id,
        createdAt: p.createdAt,
        pendingProposalsCount: 0,
        approvedDealsCount: (pStatus === 'approved' || pStatus === 'accepted') ? 1 : 0
      });
    }

    const deals = Array.from(uniqueProjectsMap.values());

    return NextResponse.json({ deals }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch buyer deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


