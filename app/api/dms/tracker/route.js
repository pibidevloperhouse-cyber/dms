import { db } from '../../../../db';
import { dmsDealProposals, dmsTeasers, dmsProjects, users, dmsDeals, companies } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');
    const role = searchParams.get('role');

    if (!buyerId && !role) {
      return NextResponse.json({ error: 'Missing buyerId' }, { status: 400 });
    }

    // Fetch proposals for the buyer, join with teasers, projects, users, companies and dmsDeals to get ndaStatus
    const query = db.select({
      id: dmsDealProposals.id,
      status: dmsDealProposals.status,
      dateSubmitted: dmsDealProposals.createdAt,
      message: dmsDealProposals.message,
      projectName: dmsProjects.name,
      projectId: dmsProjects.id,
      projectDescription: dmsProjects.description,
      projectType: dmsProjects.projectType,
      dealId: dmsDeals.id,
      dealName: dmsDeals.dealName,
      dealProjectId: dmsDeals.projectId,
      fullName: users.name,
      email: users.email,
      company: companies.name,
      jobTitle: users.jobTitle,
      investorType: companies.operationType,
      ndaStatus: dmsDeals.ndaStatus,
      teaserIndustry: dmsTeasers.industry,
      teaserGeography: dmsTeasers.headquarters,
      teaserOverview: dmsTeasers.businessSummary,
      teaserRevenue: dmsTeasers.revenue,
      teaserEbitda: dmsTeasers.ebitdaBand,
      teaserDealType: dmsTeasers.businessModel
    })
      .from(dmsDealProposals)
      .leftJoin(dmsTeasers, eq(dmsDealProposals.teaserId, dmsTeasers.id))
      .leftJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
      .leftJoin(users, eq(dmsDealProposals.buyerId, users.id))
      .leftJoin(companies, eq(users.companyId, companies.id))
      .leftJoin(dmsDeals, eq(dmsDeals.proposalId, dmsDealProposals.id));

    let proposals;
    if (buyerId && role !== 'admin') {
      proposals = await query.where(eq(dmsDealProposals.buyerId, buyerId)).orderBy(desc(dmsDealProposals.createdAt));
    } else {
      proposals = await query.orderBy(desc(dmsDealProposals.createdAt));
    }

    // Format the date to match what the UI expects (e.g. 'Oct 24, 2023')
    const formattedProposals = proposals.map(p => ({
      ...p,
      projectId: p.projectId || p.dealProjectId,
      projectName: p.projectName || p.dealName || 'Confidential Deal',
      fullName: p.fullName || 'Anonymous Buyer',
      company: p.company || 'Private Investor',
      investorType: p.investorType || 'Direct Buyer',
      industry: p.teaserIndustry || 'Technology / SaaS',
      geography: p.teaserGeography || 'Tamil Nadu',
      overview: p.teaserOverview || p.projectDescription || 'A comprehensive M&A and investment platform designed to connect business owners, buyers, investors, private equity firms, and...',
      revenue: p.teaserRevenue || '₹5 Crore annually',
      ebitda: p.teaserEbitda || '₹1.5 Crore',
      dealType: p.teaserDealType || p.projectType || 'Majority Acquisition',
      dateSubmitted: p.dateSubmitted 
        ? new Date(p.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently',
      ndaStatus: p.ndaStatus || 'pending'
    }));

    return NextResponse.json({ requests: formattedProposals }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch tracker requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
