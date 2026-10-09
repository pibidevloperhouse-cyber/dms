import { db } from '../../../../db';
import { dmsTeasers, dmsProjects, users, companies } from '../../../../db/schema';
import { eq, or, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const activeTeasersPromise = db
      .select({
        id: dmsTeasers.id,
        projectId: dmsTeasers.projectId,
        projectName: dmsProjects.name,
        name: dmsTeasers.businessSummary,
        sector: dmsTeasers.industry,
        geography: dmsTeasers.headquarters,
        overview: dmsTeasers.businessSummary,
        revenue: dmsTeasers.revenue,
        ebitda: dmsTeasers.ebitdaBand,
        growth: dmsTeasers.growthRatePercent,
        employees: dmsTeasers.employees,
        status: dmsTeasers.status
      })
      .from(dmsTeasers)
      .innerJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
      .where(or(eq(dmsTeasers.status, 'active'), eq(dmsTeasers.status, 'Active')));

    const activeBuyersPromise = db
      .select({
        id: users.id,
        name: users.name,
        companyName: companies.name,
        investorType: companies.operationType,
        investmentRange: users.investmentRange,
        companyType: companies.companyType,
        jobTitle: users.jobTitle,
        verificationStatus: users.verificationStatus,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .where(
        and(
          or(eq(companies.dmsRole, 'buyer'), eq(companies.dmsRole, 'Buyer')),
          eq(users.role, 'guest_admin')
        )
      );

    const [activeTeasers, activeBuyers] = await Promise.all([activeTeasersPromise, activeBuyersPromise]);

    return NextResponse.json({ teasers: activeTeasers, buyers: activeBuyers }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch marketplace deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
