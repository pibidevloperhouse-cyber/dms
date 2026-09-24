import { db } from '../../../../db';
import { dmsDeals, users } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const buyerId = searchParams.get('buyerId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    let query = db.select({
      id: dmsDeals.id,
      status: dmsDeals.status,
      ndaStatus: dmsDeals.ndaStatus,
      createdAt: dmsDeals.createdAt,
      buyerId: users.id,
      name: dmsDeals.dealName, // Use the stored dealName
      featureQa: dmsDeals.featureQa,
      featureBidding: dmsDeals.featureBidding,
      featureTasks: dmsDeals.featureTasks,
    })
    .from(dmsDeals)
    .leftJoin(users, eq(dmsDeals.buyerId, users.id));

    if (buyerId) {
      query = query.where(and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.buyerId, buyerId)));
    } else {
      query = query.where(eq(dmsDeals.projectId, projectId));
    }

    const deals = await query;

    return NextResponse.json({ deals }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { projectId, buyerId, dealName } = data;

    if (!projectId || !buyerId || !dealName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newDeal = await db.insert(dmsDeals).values({
      projectId,
      buyerId,
      dealName,
      status: 'active'
    }).returning();

    return NextResponse.json({ deal: newDeal[0], success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('id');

    if (!dealId) {
      return NextResponse.json({ error: 'Missing deal ID' }, { status: 400 });
    }

    await db.update(dmsDeals).set({ status: 'trashed' }).where(eq(dmsDeals.id, dealId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
