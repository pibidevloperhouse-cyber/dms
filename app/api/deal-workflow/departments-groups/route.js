import { NextResponse } from 'next/server';
import { db } from '@/db';
import { groups, userGroups, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    let allGroupsQuery = db.select().from(groups);
    if (companyId) {
      allGroupsQuery = allGroupsQuery.where(eq(groups.companyId, companyId));
    }
    const dbGroups = await allGroupsQuery;

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
      })
      .from(users);

    // Build map of group name -> member names
    const groupMembersMap = {};
    for (const g of dbGroups) {
      const userIdsInGroup = dbUserGroups
        .filter((ug) => ug.groupId === g.id)
        .map((ug) => ug.userId);

      let members = allUsers.filter((u) => userIdsInGroup.includes(u.id));

      if (members.length === 0) {
        // If createdBy is set, include creator
        if (g.createdBy) {
          const creator = allUsers.find((u) => u.id === g.createdBy);
          if (creator) members.push(creator);
        }
        // If still empty, include all company users or active users
        if (members.length === 0) {
          const companyUsers = allUsers.filter((u) => !companyId || u.companyId === companyId);
          members = companyUsers.length > 0 ? companyUsers : allUsers;
        }
      }

      const memberNames = Array.from(new Set(members.map((m) => m.name)));
      groupMembersMap[g.name] = memberNames;
      groupMembersMap[g.id] = memberNames;
    }

    // Collect all departments from groups
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
