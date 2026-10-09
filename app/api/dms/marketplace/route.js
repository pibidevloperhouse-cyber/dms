import { db } from '../../../../db';
import { dmsTeasers, dmsProjects, users } from '../../../../db/schema';
import { eq, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const activeTeasers = await db
      .select({
        id: dmsTeasers.id,
        projectId: dmsTeasers.projectId,
        projectName: dmsProjects.name,
        name: dmsTeasers.dealName,
        sector: dmsTeasers.sector,
        geography: dmsTeasers.geography,
        overview: dmsTeasers.companyOverview,
        revenue: dmsTeasers.revenue,
        ebitda: dmsTeasers.ebitda,
        growth: dmsTeasers.yoyGrowth,
        employees: dmsTeasers.employees,
        status: dmsTeasers.status
      })
      .from(dmsTeasers)
      .innerJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
      .where(or(eq(dmsTeasers.status, 'active'), eq(dmsTeasers.status, 'Active')));

    const activeBuyers = await db
      .select({
        id: users.id,
        name: users.name,
        companyName: users.companyName,
        investorType: users.investorType,
        investmentRange: users.investmentRange,
        companyType: users.companyType,
        jobTitle: users.jobTitle,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .where(or(eq(users.dmsRole, 'buyer'), eq(users.dmsRole, 'Buyer')));

    return NextResponse.json({ teasers: activeTeasers, buyers: activeBuyers }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch marketplace deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
