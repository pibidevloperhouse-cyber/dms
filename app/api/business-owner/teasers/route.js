import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsTeasers, dmsProjects, companies } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all teasers joined with projects and companies
    const rawData = await db.select()
    .from(dmsTeasers)
    .innerJoin(dmsProjects, eq(dmsTeasers.projectId, dmsProjects.id))
    .innerJoin(companies, eq(dmsProjects.companyId, companies.id))
    .orderBy(desc(dmsTeasers.createdAt));

    const teasersData = rawData.map(row => ({
      ...row.dms_teasers,
      projectName: row.dms_projects.name,
      projectType: row.dms_projects.projectType,
      projectDescription: row.dms_projects.description,
      companyName: row.companies.name,
    }));

    return NextResponse.json({ teasers: teasersData }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch teasers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { teaserId, projectId, status } = await req.json();

    if (!teaserId || !projectId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update teaser status
    await db.update(dmsTeasers)
      .set({ status })
      .where(eq(dmsTeasers.id, teaserId));

    // Also update project status to match
    await db.update(dmsProjects)
      .set({ status })
      .where(eq(dmsProjects.id, projectId));

    return NextResponse.json({ success: true, status }, { status: 200 });
  } catch (error) {
    console.error('Failed to update teaser status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
