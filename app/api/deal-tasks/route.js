import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dealTasks } from '@/db/schema';
import { eq, desc, and, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId');
    const status = searchParams.get('status');
    const workstream = searchParams.get('workstream');
    const priority = searchParams.get('priority');
    const visibility = searchParams.get('visibility');
    const dealStage = searchParams.get('dealStage');
    const userSide = searchParams.get('userSide'); // 'seller' | 'buyer'
    const search = searchParams.get('search');

    const conditions = [];

    if (dealId) {
      conditions.push(eq(dealTasks.dealId, dealId));
    }

    if (status && status !== 'ALL') {
      conditions.push(eq(dealTasks.status, status));
    }

    if (workstream && workstream !== 'ALL') {
      conditions.push(eq(dealTasks.workstream, workstream));
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

    const tasks = rows.map((t) => ({
      id: t.id,
      task_id: t.taskId,
      deal_id: t.dealId,
      workspace_id: t.workspaceId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      workstream: t.workstream,
      deal_stage: t.dealStage,
      due_date: t.dueDate,
      visibility: t.visibility,
      creator_side: t.creatorSide,
      target_side: t.targetSide,
      target_company: t.targetCompany,
      assigned_to_group: t.assignedToGroup,
      assigned_to_user: t.assignedToUser,
      claimable_by_role: t.claimableByRole,
      linked_document: t.linkedDocument,
      digital_signature: t.digitalSignature,
      created_by: t.createdBy,
      creator_role: t.creatorRole,
      creator_company: t.creatorCompany,
      completed_by: t.completedBy,
      completed_at: t.completedAt,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      subtasks: t.subtasks || [],
      audit_trail: t.auditTrail || [],
      comments: t.comments || [],
    }));

    return NextResponse.json({ success: true, tasks });
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
    } = payload;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const resolvedCreatorSide = creator_side || 'seller';
    const resolvedTargetSide = target_side || (visibility === 'EXTERNAL' ? (resolvedCreatorSide === 'seller' ? 'buyer' : 'seller') : resolvedCreatorSide);
    const resolvedTargetCompany = target_company || (resolvedCreatorSide === 'seller' ? 'ABC Textiles' : 'XYZ Capital');
    const resolvedAssignedGroup = assigned_to_group || (resolvedTargetSide === 'seller' ? 'Seller Finance Team' : 'Buyer Legal Team');
    const resolvedCreatedBy = created_by || 'Admin';

    const existingCount = await db.select().from(dealTasks);
    const taskId = `TSK-${1000 + existingCount.length + 1}`;

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
        workstream,
        dealStage: deal_stage,
        dueDate: due_date || null,
        visibility,
        creatorSide: resolvedCreatorSide,
        creatorCompany: creator_company,
        targetSide: resolvedTargetSide,
        targetCompany: resolvedTargetCompany,
        assignedToGroup: resolvedAssignedGroup,
        assignedToUser: null,
        claimableByRole: claimable_by_role,
        createdBy: resolvedCreatedBy,
        creatorRole: creator_role,
        subtasks: subtasks || [],
        auditTrail: initialAudit,
        comments: [],
      })
      .returning();


    return NextResponse.json({
      success: true,
      task: {
        id: newTask.id,
        task_id: newTask.taskId,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        workstream: newTask.workstream,
        deal_stage: newTask.dealStage,
        due_date: newTask.dueDate,
        visibility: newTask.visibility,
        creator_side: newTask.creatorSide,
        target_side: newTask.targetSide,
        assigned_to_group: newTask.assignedToGroup,
        assigned_to_user: null,
        subtasks: newTask.subtasks,
        audit_trail: newTask.auditTrail,
        comments: [],
      },
    });
  } catch (error) {
    console.error('Create deal task error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
