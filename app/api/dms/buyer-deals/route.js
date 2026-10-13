import { db } from '../../../../db';
import { dmsDeals, dmsProjects } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId');

    if (!buyerId) {
      return NextResponse.json({ error: 'Missing buyerId' }, { status: 400 });
    }

    const rawDeals = await db.select({
      id: dmsDeals.id,
      status: dmsDeals.status,
      ndaStatus: dmsDeals.ndaStatus,
      proposalId: dmsDeals.proposalId,
      createdAt: dmsDeals.createdAt,
      projectId: dmsProjects.id,
      name: dmsProjects.name, // The buyer sees the actual project name
    })
    .from(dmsDeals)
    .where(eq(dmsDeals.buyerId, buyerId))
    .innerJoin(dmsProjects, eq(dmsDeals.projectId, dmsProjects.id));

    const uniqueProjectsMap = new Map();
    for (const deal of rawDeals) {
      if (!uniqueProjectsMap.has(deal.projectId)) {
        uniqueProjectsMap.set(deal.projectId, deal);
      }
    }
    const deals = Array.from(uniqueProjectsMap.values());

    return NextResponse.json({ deals }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch buyer deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
