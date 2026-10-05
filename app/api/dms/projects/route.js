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
    const { 
      name, companyId, projectType, dealType, description, industry, revenue, ebitda, mandate 
    } = await req.json();

    if (!name || !companyId) {
      return NextResponse.json({ error: 'Missing name or companyId' }, { status: 400 });
    }

    const [newProject] = await db.insert(dmsProjects).values({
      name,
      companyId,
      projectType,
      status: 'ACTIVE'
    }).returning();

    // Also create a teaser with the collected details
    try {
      const { dmsTeasers } = require('@/db/schema');
      await db.insert(dmsTeasers).values({
        projectId: newProject.id,
        dealName: name,
        sector: industry || '',
        companyOverview: description || '',
        revenue: revenue || '',
        ebitda: ebitda || '',
        publicDesc: mandate || '',
        status: 'Active'
      });
    } catch(teaserErr) {
      console.error('Failed to create initial teaser:', teaserErr);
    }

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing project id' }, { status: 400 });
    }

    // Since there are foreign key constraints, we must delete child records first.
    // Dynamic import to avoid missing dependencies
    const { dmsTeasers, dmsDeals, dmsDealProposals, riskIssues, approvals, auditLogs } = require('@/db/schema');
    
    // First, find teasers for this project to delete deal proposals attached to them
    const teasers = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, id));
    if (teasers.length > 0) {
      const teaserIds = teasers.map(t => t.id);
      await db.delete(dmsDealProposals).where(inArray(dmsDealProposals.teaserId, teaserIds));
    }

    // Now delete all related records that reference projectId
    if (dmsDeals) await db.delete(dmsDeals).where(eq(dmsDeals.projectId, id));
    if (riskIssues) await db.delete(riskIssues).where(eq(riskIssues.projectId, id));
    if (approvals) await db.delete(approvals).where(eq(approvals.projectId, id));
    if (auditLogs) await db.delete(auditLogs).where(eq(auditLogs.projectId, id));
    if (dmsTeasers) await db.delete(dmsTeasers).where(eq(dmsTeasers.projectId, id));

    // Finally, delete the project
    await db.delete(dmsProjects).where(eq(dmsProjects.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
