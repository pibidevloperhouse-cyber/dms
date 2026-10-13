import { NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, userGroups, users, companies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    // Query all groups joined with their company
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        department: groups.department,
        role: groups.role,
        type: groups.type,
        companyId: groups.companyId,
        createdBy: groups.createdBy,
        companyName: companies.name,
        companyRole: companies.dmsRole,
      })
      .from(groups)
      .leftJoin(companies, eq(groups.companyId, companies.id));

    // Determine active side based on companyId
    let currentCompanyRole = 'seller';
    if (companyId) {
      try {
        const compRows = await db
          .select({ dmsRole: companies.dmsRole })
          .from(companies)
          .where(eq(companies.id, companyId))
          .limit(1);
        if (compRows.length > 0 && compRows[0].dmsRole?.toLowerCase() === 'buyer') {
          currentCompanyRole = 'buyer';
        }
      } catch (cErr) {
        console.error('Error fetching company role:', cErr);
      }
    }
    const otherRole = currentCompanyRole === 'seller' ? 'buyer' : 'seller';

    // Internal vs External group separation
    let dbGroups = [];
    let dbExternalGroups = [];

    if (companyId) {
      dbGroups = allGroups.filter((g) => g.companyId === companyId);
      dbExternalGroups = allGroups.filter((g) => g.companyId !== companyId);
    } else {
      dbGroups = allGroups.filter((g) => (g.companyRole?.toLowerCase() === currentCompanyRole || !g.companyRole));
      dbExternalGroups = allGroups.filter((g) => g.companyRole?.toLowerCase() === otherRole);
    }

    // Fetch user_groups mappings
    const dbUserGroups = await db.select().from(userGroups);

    // Fetch users for member resolution joined with companies table (dmsRole moved to companies)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        companyName: companies.name,
        dmsRole: companies.dmsRole,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id));

    // Build map of group name -> member names for all groups (internal + external)
    const groupMembersMap = {};
    for (const g of allGroups) {
      const userIdsInGroup = dbUserGroups
        .filter((ug) => ug.groupId === g.id)
        .map((ug) => ug.userId);

      let members = allUsers.filter((u) => userIdsInGroup.includes(u.id));

      if (members.length === 0) {
        if (g.createdBy) {
          const creator = allUsers.find((u) => u.id === g.createdBy);
          if (creator) members.push(creator);
        }
        if (members.length === 0) {
          const companyUsers = allUsers.filter((u) => u.companyId === g.companyId);
          members = companyUsers.length > 0 ? companyUsers : allUsers;
        }
      }

      const memberNames = Array.from(new Set(members.map((m) => m.name)));
      groupMembersMap[g.name] = memberNames;
      groupMembersMap[g.id] = memberNames;
    }

    // Collect departments from internal and external groups
    const internalDepartments = Array.from(
      new Set(dbGroups.map((g) => g.department).filter(Boolean))
    );
    const externalDepartments = Array.from(
      new Set(dbExternalGroups.map((g) => g.department).filter(Boolean))
    );

    return NextResponse.json({
      success: true,
      groups: dbGroups.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department || 'General',
        role: g.role,
        type: g.type,
        side: currentCompanyRole,
        company: g.companyName || '',
        members: groupMembersMap[g.name] || [],
      })),
      externalGroups: dbExternalGroups.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department || 'General',
        role: g.role,
        type: g.type,
        side: otherRole,
        company: g.companyName || '',
        members: groupMembersMap[g.name] || [],
      })),
      departments: internalDepartments.length > 0 ? internalDepartments : ['Finance', 'Legal', 'Operations', 'General'],
      externalDepartments: externalDepartments.length > 0 ? externalDepartments : ['Legal', 'Finance', 'Operations', 'General'],
      groupMembersMap,
      users: allUsers.map((u) => ({
        ...u,
        side: u.dmsRole?.toLowerCase() === 'buyer' ? 'buyer' : 'seller',
        company: u.companyName || '',
      })),
    });
  } catch (error) {
    console.error('Error fetching departments and groups:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
