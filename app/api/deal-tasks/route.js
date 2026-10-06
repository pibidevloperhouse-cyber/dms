import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dealTasks, groups, userGroups, users } from '@/db/schema';
import { eq, desc, and, or, ilike } from 'drizzle-orm';
import { formatTask } from '@/lib/dealTasksHelper';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId');
    const workspaceId = searchParams.get('workspaceId');
    const status = searchParams.get('status');
    const department = searchParams.get('department') || searchParams.get('workstream');
    const priority = searchParams.get('priority');
    const visibility = searchParams.get('visibility');
    const dealStage = searchParams.get('dealStage');
    const userSide = searchParams.get('userSide'); // 'seller' | 'buyer'
    const search = searchParams.get('search');

    const conditions = [];

    if (dealId) {
      conditions.push(eq(dealTasks.dealId, dealId));
    }

    if (workspaceId) {
      conditions.push(eq(dealTasks.workspaceId, workspaceId));
    }

    if (status && status !== 'ALL') {
      conditions.push(eq(dealTasks.status, status));
    }

    if (department && department !== 'ALL') {
      conditions.push(
        or(
          eq(dealTasks.department, department),
          eq(dealTasks.workstream, department)
        )
      );
    }

    if (priority && priority !== 'ALL') {
      conditions.push(eq(dealTasks.priority, priority));
    }

    if (visibility && visibility !== 'ALL') {
      conditions.push(eq(dealTasks.visibility, visibility));
    }

    if (dealStage && dealStage !== 'ALL') {
      conditions.push(eq(dealTasks.dealStage, dealStage));
    }

    // Two-sided visibility rule:
    // If userSide is 'seller': sees all seller tasks + external tasks
    // If userSide is 'buyer': sees all buyer tasks + external tasks
    if (userSide) {
      conditions.push(
        or(
          eq(dealTasks.creatorSide, userSide),
          eq(dealTasks.targetSide, userSide),
          eq(dealTasks.visibility, 'EXTERNAL')
        )
      );
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(dealTasks.title, s),
          ilike(dealTasks.description, s),
          ilike(dealTasks.taskId, s),
          ilike(dealTasks.workstream, s)
        )
      );
    }

    let query = db.select().from(dealTasks).orderBy(desc(dealTasks.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query;
    const tasks = rows.map((t) => formatTask(t));

    // Fetch DB groups, userGroups, and users for dynamic member assignment
    let dbGroups = [];
    let groupMembersMap = {};
    let dbAllUsers = [];
    let departments = [];

    try {
      dbGroups = await db.select().from(groups);
      const dbUserGroups = await db.select().from(userGroups);
      dbAllUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
        })
        .from(users);

      for (const g of dbGroups) {
        const userIdsInGroup = dbUserGroups
          .filter((ug) => ug.groupId === g.id)
          .map((ug) => ug.userId);

        let members = dbAllUsers.filter((u) => userIdsInGroup.includes(u.id));
        if (members.length === 0 && g.createdBy) {
          const creator = dbAllUsers.find((u) => u.id === g.createdBy);
          if (creator) members.push(creator);
        }
        if (members.length === 0) {
          members = dbAllUsers;
        }
        const memberNames = Array.from(new Set(members.map((m) => m.name)));
        groupMembersMap[g.name] = memberNames;
        groupMembersMap[g.id] = memberNames;
      }

      departments = Array.from(
        new Set(dbGroups.map((g) => g.department).filter(Boolean))
      );
    } catch (dbErr) {
      console.error('Error fetching groups/users in deal-tasks:', dbErr);
    }

    return NextResponse.json({
      success: true,
      tasks,
      groups: dbGroups.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department || 'General',
        role: g.role,
        type: g.type,
        members: groupMembersMap[g.name] || [],
      })),
      departments: departments.length > 0 ? departments : ['Finance', 'Legal', 'Operations', 'General'],
      groupMembersMap,
      users: dbAllUsers,
    });
  } catch (error) {
    console.error('Fetch deal tasks error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const {
      title,
      description,
      dealId,
      workspaceId,
      visibility = 'INTERNAL',
      assigned_to_group,
      assigned_to_user = null,
      department,
      workstream = 'General',
      priority = 'Medium',
      deal_stage = 'Preparation',
      due_date,
      claimable_by_role = true,
      creator_side = 'seller',
      creator_company = 'ABC Textiles',
      target_side,
      target_company,
      created_by = 'User',
      creator_role = 'Admin',
      subtasks = [],
      ipAddress = '127.0.0.1',
      is_enabled,
      isEnabled,
    } = payload;

    const finalIsEnabled = is_enabled !== undefined
      ? Boolean(is_enabled)
      : isEnabled !== undefined
      ? Boolean(isEnabled)
      : true;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const resolvedDept = department || workstream || 'General';
    const resolvedCreatorSide = creator_side || 'seller';
    const resolvedTargetSide = target_side || (visibility === 'EXTERNAL' ? (resolvedCreatorSide === 'seller' ? 'buyer' : 'seller') : resolvedCreatorSide);
    const resolvedTargetCompany = target_company || (resolvedCreatorSide === 'seller' ? 'ABC Textiles' : 'XYZ Capital');
    const resolvedAssignedGroup = assigned_to_group || (resolvedTargetSide === 'seller' ? 'Seller Finance Team' : 'Buyer Legal Team');
    const resolvedCreatedBy = created_by || 'Admin';

    const existingTasks = await db.select({ taskId: dealTasks.taskId }).from(dealTasks);
    let maxNum = 1000;
    for (const row of existingTasks) {
      const match = row.taskId?.match(/TSK-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const taskId = `TSK-${maxNum + 1}`;

    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const initialAudit = [
      {
        action: visibility === 'EXTERNAL' ? 'External Task Created & Dispatched' : 'Internal Task Created',
        performed_by: resolvedCreatedBy,
        role: creator_role,
        timestamp: formattedDate,
        ip: ipAddress,
      },
    ];

    const [newTask] = await db
      .insert(dealTasks)
      .values({
        taskId,
        dealId: dealId || null,
        workspaceId: workspaceId || null,
        title: title.trim(),
        description: description ? description.trim() : null,
        status: 'TO_DO',
        priority,
        department: resolvedDept,
        workstream: resolvedDept,
        dealStage: deal_stage,
        dueDate: due_date || null,
        visibility,
        creatorSide: resolvedCreatorSide,
        creatorCompany: creator_company,
        targetSide: resolvedTargetSide,
        targetCompany: resolvedTargetCompany,
        assignedToGroup: resolvedAssignedGroup,
        assignedToUser: assigned_to_user || null,
        claimableByRole: claimable_by_role,
        isEnabled: finalIsEnabled,
        createdBy: resolvedCreatedBy,
        creatorRole: creator_role,
        subtasks: subtasks || [],
        auditTrail: initialAudit,
        comments: [],
      })
      .returning();

    return NextResponse.json({
      success: true,
      task: formatTask(newTask),
    });
  } catch (error) {
    console.error('Create deal task error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
