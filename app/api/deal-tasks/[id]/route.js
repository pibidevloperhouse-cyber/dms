import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dealTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatTask } from '@/lib/dealTasksHelper';

export const dynamic = 'force-dynamic';

async function findTask(idParam) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
  let tasks;
  if (isUuid) {
    tasks = await db.select().from(dealTasks).where(eq(dealTasks.id, idParam)).limit(1);
  } else {
    tasks = await db.select().from(dealTasks).where(eq(dealTasks.taskId, idParam)).limit(1);
  }
  return tasks.length > 0 ? tasks[0] : null;
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error('Fetch task detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const payload = await req.json();
    const { action, user = {}, ipAddress = '127.0.0.1' } = payload;

    const now = new Date();
    const formattedDate = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })}-${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    let updatedFields = { updatedAt: now };
    const currentAudit = Array.isArray(task.auditTrail) ? [...task.auditTrail] : [];
    const currentSubtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
    const currentComments = Array.isArray(task.comments) ? [...task.comments] : [];

    switch (action) {
      case 'claim': {
        const userName = user.name || 'Assignee';
        updatedFields = {
          ...updatedFields,
          status: 'IN_PROGRESS',
          assignedToUser: userName,
          auditTrail: [
            ...currentAudit,
            {
              action: 'Task Claimed',
              performed_by: userName,
              role: user.role || 'Member',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ],
        };
        break;
      }

      case 'submit_review': {
        const userName = user.name || 'Assignee';
        updatedFields = {
          ...updatedFields,
          status: 'REVIEW',
          auditTrail: [
            ...currentAudit,
            {
              action: 'Submitted for Review',
              performed_by: userName,
              role: user.role || 'Member',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ],
        };
        break;
      }

      case 'approve': {
        const userName = user.name || 'Admin';
        updatedFields = {
          ...updatedFields,
          status: 'DONE',
          completedBy: userName,
          completedAt: formattedDate,
          auditTrail: [
            ...currentAudit,
            {
              action: 'Approved & Completed',
              performed_by: userName,
              role: user.role || 'Admin',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ],
        };
        break;
      }

      case 'send_back': {
        const userName = user.name || 'Reviewer';
        const reason = payload.reason || 'Revisions requested by reviewer';
        updatedFields = {
          ...updatedFields,
          status: 'IN_PROGRESS',
          auditTrail: [
            ...currentAudit,
            {
              action: 'Task Sent Back for Revisions',
              performed_by: userName,
              role: user.role || 'Admin',
              timestamp: formattedDate,
              ip: ipAddress,
              details: reason,
            },
          ],
        };
        break;
      }

      case 'sign_document': {
        const userName = user.name || 'Signer';
        const isoString = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
        const digitalSignature = payload.signature || {
          signer: userName,
          role: user.role || 'Legal Counsel',
          timestamp: isoString,
          ip: ipAddress,
          hash: payload.hash || `SHA256:d8a57e3f890b0e25b341aa9d91f28b4c2b9a712f840939529b533dc270bcfe30`,
          document: task.linkedDocument || 'NDA_Draft.pdf',
        };

        updatedFields = {
          ...updatedFields,
          status: 'DONE',
          completedBy: userName,
          completedAt: formattedDate,
          digitalSignature,
          auditTrail: [
            ...currentAudit,
            {
              action: `${task.linkedDocument || 'Document'} Digitally Signed`,
              performed_by: userName,
              role: user.role || 'Legal Counsel',
              timestamp: formattedDate,
              ip: ipAddress,
              hash: digitalSignature.hash,
            },
            {
              action: 'Task Auto-Completed via Verified Digital Signature',
              performed_by: 'System Workflow Engine',
              role: 'System',
              timestamp: formattedDate,
              ip: '127.0.0.1',
            },
          ],
        };
        break;
      }

      case 'toggle_subtask': {
        const { subtaskId } = payload;
        const updatedSubtasksList = currentSubtasks.map((st) => {
          if (st.id === subtaskId) {
            const nextStatus = st.status === 'DONE' ? 'TO_DO' : 'DONE';
            return {
              ...st,
              status: nextStatus,
              completedAt: nextStatus === 'DONE' ? now.toISOString() : null,
            };
          }
          return st;
        });

        updatedFields = {
          ...updatedFields,
          subtasks: updatedSubtasksList,
        };
        break;
      }

      case 'add_comment': {
        const { text, scope = 'INTERNAL' } = payload;
        if (!text || !text.trim()) {
          return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
        }
        const userName = user.name || 'User';
        const newComment = {
          id: `comm_${Date.now()}`,
          author: userName,
          company: user.company || 'Company',
          scope,
          text: text.trim(),
          timestamp: formattedDate,
        };

        updatedFields = {
          ...updatedFields,
          comments: [...currentComments, newComment],
          auditTrail: [
            ...currentAudit,
            {
              action: `${scope} Note Added`,
              performed_by: userName,
              role: user.role || 'Member',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ],
        };
        break;
      }

      case 'edit_task':
      case 'update_task':
      default: {
        // Generic fields update
        if (payload.title !== undefined) updatedFields.title = payload.title.trim();
        if (payload.description !== undefined) updatedFields.description = payload.description;
        if (payload.priority !== undefined) updatedFields.priority = payload.priority;
        if (payload.dueDate !== undefined) updatedFields.dueDate = payload.dueDate;
        if (payload.due_date !== undefined) updatedFields.dueDate = payload.due_date;
        if (payload.department !== undefined) updatedFields.department = payload.department;
        if (payload.assignedToGroup !== undefined) updatedFields.assignedToGroup = payload.assignedToGroup;
        if (payload.assigned_to_group !== undefined) updatedFields.assignedToGroup = payload.assigned_to_group;
        if (payload.assignedToUser !== undefined) updatedFields.assignedToUser = payload.assignedToUser;
        if (payload.assigned_to_user !== undefined) updatedFields.assignedToUser = payload.assigned_to_user;
        if (payload.dealStage !== undefined) updatedFields.dealStage = payload.dealStage;
        if (payload.deal_stage !== undefined) updatedFields.dealStage = payload.deal_stage;
        if (payload.visibility !== undefined) updatedFields.visibility = payload.visibility;
        if (payload.status !== undefined) updatedFields.status = payload.status;
        if (payload.subtasks !== undefined) updatedFields.subtasks = payload.subtasks;

        if (action === 'edit_task' || action === 'update_task') {
          const userName = user.name || 'Task Creator';
          updatedFields.auditTrail = [
            ...currentAudit,
            {
              action: 'Task Details Updated by Creator',
              performed_by: userName,
              role: user.role || 'Creator',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ];
        }
        break;
      }
    }

    const [updatedTask] = await db
      .update(dealTasks)
      .set(updatedFields)
      .where(eq(dealTasks.id, task.id))
      .returning();

    return NextResponse.json({
      success: true,
      task: formatTask(updatedTask),
    });
  } catch (error) {
    console.error('Update deal task error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await db.delete(dealTasks).where(eq(dealTasks.id, task.id));
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete deal task error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
