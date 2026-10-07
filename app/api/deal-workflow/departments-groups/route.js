import { NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, userGroups, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    let allGroups = await db.select().from(groups);
    let dbGroups = companyId ? allGroups.filter((g) => g.companyId === companyId) : allGroups;
    let dbExternalGroups = companyId ? allGroups.filter((g) => g.companyId !== companyId) : [];

    // Fetch user_groups mappings
    const dbUserGroups = await db.select().from(userGroups);

    // Fetch users for member resolution
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        dmsRole: users.dmsRole,
      })
      .from(users);

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

    // Collect all departments from internal groups (plus General)
    const departments = Array.from(
      new Set(dbGroups.map((g) => g.department).filter(Boolean))
    );

    return NextResponse.json({
      success: true,
      groups: dbGroups.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department || 'General',
        role: g.role,
        type: g.type,
        side: 'seller',
        members: groupMembersMap[g.name] || [],
      })),
      externalGroups: dbExternalGroups.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department || 'General',
        role: g.role,
        type: g.type,
        side: 'buyer',
        members: groupMembersMap[g.name] || [],
      })),
      departments,
      groupMembersMap,
      users: allUsers,
    });
  } catch (error) {
    console.error('Error fetching departments and groups:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
