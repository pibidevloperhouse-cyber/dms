import { NextResponse } from 'next/server';
import { db } from '@/db';
import { invitations, groups, companies, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET: Validate invite token
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const inviteRecords = await db.select({
      invite: invitations,
      group: groups,
      company: companies
    })
    .from(invitations)
    .leftJoin(groups, eq(invitations.groupId, groups.id))
    .leftJoin(companies, eq(groups.companyId, companies.id))
    .where(eq(invitations.token, token))
    .limit(1);

    const record = inviteRecords[0];

    if (!record || !record.invite) {
      return NextResponse.json({ error: 'Invitation not found or expired.' }, { status: 404 });
    }

    if (record.invite.status !== 'pending') {
      return NextResponse.json({ error: 'This invitation has already been used.' }, { status: 400 });
    }

    // Format response to match expected Supabase structure
    const inviteData = {
      ...record.invite,
      groups: {
        company_id: record.group?.companyId,
        workspace_id: record.group?.workspaceId,
        role: record.group?.role,
      }
    };

    const companyData = {
      id: record.company?.id,
      name: record.company?.name,
    };

    return NextResponse.json({ invite: inviteData, company: companyData }, { status: 200 });
  } catch (error) {
    console.error('API /auth/register/invite GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, companyId, name, email, password, requiresNda, role } = await req.json();

    if (!userId || !companyId || !name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const assignedNdaStatus = requiresNda ? 'pending' : 'not_required';
    const targetRole = role || 'user';

    await db.insert(users).values({
      id: userId,
      companyId: companyId,
      name: name.trim(),
      email: email,
      passwordHash: password,
      role: targetRole,
      status: 'active',
      ndaStatus: assignedNdaStatus,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('API /auth/register/invite POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user account.' }, { status: 500 });
  }
}
