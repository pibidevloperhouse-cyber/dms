import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsProjects, dmsDeals, dmsTeasers } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    // 1. Matching Opportunities (Active marketplace teasers)
    const teasers = await db.select().from(dmsTeasers).where(eq(dmsTeasers.status, 'active'));
    const opportunitiesCount = teasers.length;

    // 2. Active Projects / Pipelines
    let projects = [];
    if (companyId) {
      projects = await db.select().from(dmsProjects).where(eq(dmsProjects.companyId, companyId));
    } else {
      projects = await db.select().from(dmsProjects);
    }
    const projectIds = projects.map(p => p.id);

    // 3. Deals in scope
    let deals = [];
    if (role === 'buyer' && userId) {
      deals = await db.select().from(dmsDeals).where(eq(dmsDeals.buyerId, userId));
    } else if (projectIds.length > 0) {
      deals = await db.select().from(dmsDeals).where(inArray(dmsDeals.projectId, projectIds));
    } else {
      deals = await db.select().from(dmsDeals);
    }

    // Filter out trashed deals
    const activeDeals = deals.filter(d => d.status !== 'trashed');

    // 4. Exact NDA status counts from dms_deals
    const pendingNdaCount = activeDeals.filter(d => d.ndaStatus === 'pending').length;
    const completedNdaCount = activeDeals.filter(d => d.ndaStatus === 'signed').length;
    const activePipelinesCount = projects.length || activeDeals.length;

    return NextResponse.json({
      opportunitiesCount,
      activePipelinesCount,
      pendingNdaCount,
      completedNdaCount,
      deals: activeDeals,
      projects
    }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch overview metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
