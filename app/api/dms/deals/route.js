import { db } from '../../../../db';
import { dmsDeals, users, userGroups, groups } from '../../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const buyerId = searchParams.get('buyerId');

    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    let query = db.select({
      id: dmsDeals.id,
      status: dmsDeals.status,
      ndaStatus: dmsDeals.ndaStatus,
      createdAt: dmsDeals.createdAt,
      buyerId: users.id,
      name: dmsDeals.dealName,
      featureQa: dmsDeals.featureQa,
      featureBidding: dmsDeals.featureBidding,
      featureTasks: dmsDeals.featureTasks,
    })
    .from(dmsDeals)
    .leftJoin(users, eq(dmsDeals.buyerId, users.id));

    let conditions = [eq(dmsDeals.projectId, projectId)];

    const targetBuyerId = buyerId || ((role === 'buyer' || role === 'guest_admin') ? userId : null);

    if (targetBuyerId) {
      conditions.push(eq(dmsDeals.buyerId, targetBuyerId));
    } else if (role && !['super_admin', 'external_user', 'guest_admin', 'buyer'].includes(role) && userId) {
      // Filter for internal non-super admins based on their assigned deals (workspaces)
      const userGroupsQuery = await db.select().from(userGroups).where(eq(userGroups.userId, userId));
      const groupIds = userGroupsQuery.map(ug => ug.groupId);
      
      if (groupIds.length === 0) {
        return NextResponse.json({ deals: [] }, { status: 200 });
      }

      const groupsQuery = await db.select().from(groups).where(inArray(groups.id, groupIds));
      const workspaceIds = groupsQuery.map(g => g.workspaceId).filter(id => id != null);
      
      if (workspaceIds.length === 0) {
        return NextResponse.json({ deals: [] }, { status: 200 });
      }

      conditions.push(inArray(dmsDeals.id, workspaceIds));
    }

    query = query.where(and(...conditions));

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
