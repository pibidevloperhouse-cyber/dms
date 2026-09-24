import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsProjects, dmsDeals, userGroups, groups } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    if (role === 'super_admin' || !userId) {
      // Super admin sees all projects
      const projects = await db.select().from(dmsProjects).where(eq(dmsProjects.companyId, companyId));
      return NextResponse.json({ projects }, { status: 200 });
    }

    // For other roles, find which workspaces they have access to
    const userGroupsQuery = await db.select().from(userGroups).where(eq(userGroups.userId, userId));
    const groupIds = userGroupsQuery.map(ug => ug.groupId);

    if (groupIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    const groupsQuery = await db.select().from(groups).where(inArray(groups.id, groupIds));
    const workspaceIds = groupsQuery.map(g => g.workspaceId).filter(id => id != null);

    if (workspaceIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    // Find the deals for those workspaces (since active_workspace_id = deal.id)
    const deals = await db.select().from(dmsDeals).where(inArray(dmsDeals.id, workspaceIds));
    const projectIds = deals.map(d => d.projectId);

    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    // Fetch only those projects
    const projects = await db.select()
      .from(dmsProjects)
      .where(
        and(
          eq(dmsProjects.companyId, companyId),
          inArray(dmsProjects.id, projectIds)
        )
      );

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, companyId } = await req.json();

    if (!name || !companyId) {
      return NextResponse.json({ error: 'Missing name or companyId' }, { status: 400 });
    }

    const [newProject] = await db.insert(dmsProjects).values({
      name,
      companyId,
      status: 'ACTIVE'
    }).returning();

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
