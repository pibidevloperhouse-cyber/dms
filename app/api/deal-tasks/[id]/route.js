import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { dealTasks, folders, documents } from '@/db/schema';
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
        if (currentSubtasks.length > 0 && currentSubtasks.some((st) => st.status !== 'DONE')) {
          return NextResponse.json({
            success: false,
            error: 'All subtasks must be completed before submitting the task for review.',
          }, { status: 400 });
        }
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
        if (currentSubtasks.length > 0 && currentSubtasks.some((st) => st.status !== 'DONE')) {
          return NextResponse.json({
            success: false,
            error: 'All subtasks must be completed before marking the task as Done.',
          }, { status: 400 });
        }
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

      case 'attach_files': {
        const incomingFiles = Array.isArray(payload.files) ? payload.files : (payload.file ? [payload.file] : []);
        if (incomingFiles.length === 0) {
          return NextResponse.json({ success: false, error: 'No files provided to attach' }, { status: 400 });
        }
        const currentAttachments = Array.isArray(task.attachments) ? [...task.attachments] : [];
        const userName = user.name || 'Assignee';

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'deal-tasks');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const newFormattedFiles = incomingFiles.map((f, i) => {
          const rawName = f.name || `Attachment_${Date.now()}`;
          const safeName = rawName.replace(/[^\w.-]/g, '_');
          let savedDiskPath = null;
          let viewUrl = `/api/deal-tasks/view-attachment?taskId=${task.taskId}&fileName=${encodeURIComponent(rawName)}`;

          // If dataUrl or base64 was sent, save directly to disk
          if (f.dataUrl && f.dataUrl.includes(',')) {
            try {
              const base64Data = f.dataUrl.split(',')[1];
              const diskPath = path.join(uploadsDir, `${task.taskId}_${Date.now()}_${safeName}`);
              fs.writeFileSync(diskPath, Buffer.from(base64Data, 'base64'));
              savedDiskPath = diskPath;
              viewUrl = `/api/deal-tasks/view-attachment?taskId=${task.taskId}&fileName=${encodeURIComponent(rawName)}`;
            } catch (err) {
              console.error('Error saving attached file to disk:', err);
            }
          }

          return {
            id: f.id || `att_${Date.now()}_${i}`,
            name: rawName,
            size: f.size || (f.fileSizeBytes ? `${Math.round(f.fileSizeBytes / 1024)} KB` : '1.2 MB'),
            fileSizeBytes: f.fileSizeBytes || (typeof f.size === 'number' ? f.size : 102400),
            mimeType: f.mimeType || f.type || 'application/pdf',
            filePath: f.filePath || savedDiskPath || null,
            savedPath: savedDiskPath,
            url: viewUrl,
            uploadedBy: userName,
            uploadedAt: formattedDate,
          };
        });

        const combinedAttachments = [...currentAttachments, ...newFormattedFiles];
        updatedFields = {
          ...updatedFields,
          attachments: combinedAttachments,
          auditTrail: [
            ...currentAudit,
            {
              action: `${newFormattedFiles.length} Deliverable File(s) Attached`,
              performed_by: userName,
              role: user.role || 'Member',
              timestamp: formattedDate,
              ip: ipAddress,
              details: newFormattedFiles.map(f => f.name).join(', '),
            },
          ],
        };
        break;
      }

      case 'remove_attachment': {
        const { fileId, fileName, index } = payload;
        const currentAttachments = Array.isArray(task.attachments) ? [...task.attachments] : [];
        const filtered = currentAttachments.filter((f, idx) => {
          if (fileId && f.id === fileId) return false;
          if (fileName && f.name === fileName) return false;
          if (index !== undefined && idx === index) return false;
          return true;
        });
        const userName = user.name || 'Assignee';
        updatedFields = {
          ...updatedFields,
          attachments: filtered,
          auditTrail: [
            ...currentAudit,
            {
              action: `Deliverable File Removed (${fileName || 'File'})`,
              performed_by: userName,
              role: user.role || 'Member',
              timestamp: formattedDate,
              ip: ipAddress,
            },
          ],
        };
        break;
      }

      case 'move_to_documents': {
        // Collect all attachments from task and subtasks
        const allAtts = [];
        if (Array.isArray(task.attachments)) {
          task.attachments.forEach((a) => allAtts.push(a));
        }
        if (Array.isArray(task.subtasks)) {
          task.subtasks.forEach((st) => {
            if (Array.isArray(st.attachments)) {
              st.attachments.forEach((a) => allAtts.push(a));
            }
          });
        }

        if (Array.isArray(payload.files)) {
          payload.files.forEach((f) => {
            if (!allAtts.some((existing) => (existing.name || existing) === (f.name || f))) {
              allAtts.push(f);
            }
          });
        }

        const userName = user.name || 'Sub Admin';
        const userCompanyId = user.company_id || user.companyId || 'cffc94a1-9a95-403e-a7c1-5740402880dd';

        // 1. Resolve target folder in documents
        let targetFolderId = task.subfolderId || task.folderId;
        let targetFolderName = task.subfolderName || task.folderName;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetFolderId || '');
        if (!isUuid && targetFolderName) {
          const matching = await db.select().from(folders).where(eq(folders.name, targetFolderName)).limit(1);
          if (matching.length > 0) {
            targetFolderId = matching[0].id;
          }
        }

        if (!targetFolderId && targetFolderName) {
          const folMatch = await db.select().from(folders).where(eq(folders.name, targetFolderName)).limit(1);
          if (folMatch.length > 0) {
            targetFolderId = folMatch[0].id;
          }
        }

        if (!targetFolderId) {
          targetFolderName = targetFolderName || `${task.department || 'Preparation'} Documents`;
          const [newFolder] = await db.insert(folders).values({
            name: targetFolderName,
            companyId: userCompanyId,
            workspaceId: task.workspaceId || null,
            dealStage: 'Preparation',
            createdBy: user.id || null,
          }).returning();
          targetFolderId = newFolder.id;
        }

        // 2. Insert documents into documents table
        const movedDocs = [];
        for (const att of allAtts) {
          const fileName = att.name || att;
          if (!fileName) continue;

          const safeFileName = fileName.replace(/[^\w.-]/g, '_');
          const timestamp = Date.now();
          const compIdStr = userCompanyId;
          const originalPath = `${compIdStr}/original_${timestamp}_${safeFileName}`;
          const securePath = `${compIdStr}/secure_${timestamp}_${safeFileName}`;

          const fileExt = fileName.split('.').pop()?.toLowerCase();
          const mime = fileExt === 'pdf' ? 'application/pdf' :
            ['xlsx', 'xls'].includes(fileExt) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            ['docx', 'doc'].includes(fileExt) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
            ['png', 'jpg', 'jpeg'].includes(fileExt) ? `image/${fileExt}` :
            'application/octet-stream';

          const sizeBytes = att.fileSizeBytes || (typeof att.size === 'number' ? att.size : 153600);

          const [newDoc] = await db.insert(documents).values({
            companyId: compIdStr,
            workspaceId: task.workspaceId || null,
            folderId: targetFolderId,
            uploadedBy: user.id || null,
            name: fileName,
            filePath: securePath,
            originalFilePath: originalPath,
            mimeType: mime,
            fileSizeBytes: sizeBytes,
            dekRef: 'FernetDEKRef',
            security: 'Fernet Encrypted',
            version: 1,
            dealStage: 'Preparation',
            uploadComment: `Moved directly from Preparation task ${task.taskId} (${task.title}) by ${userName}`,
          }).returning();

          movedDocs.push(newDoc);
        }

        // 3. Mark task as DONE
        updatedFields = {
          ...updatedFields,
          status: 'DONE',
          completedBy: userName,
          completedAt: formattedDate,
          auditTrail: [
            ...currentAudit,
            {
              action: 'Files Moved to Documents Section & Marked as Done',
              performed_by: userName,
              role: user.role || 'Sub Admin',
              timestamp: formattedDate,
              ip: ipAddress,
              details: `Successfully uploaded ${movedDocs.length} deliverable file(s) directly into Documents folder "${targetFolderName}". Task approved.`,
            },
          ],
        };
        break;
      }

      case 'inform_query':
      case 'send_back': {
        const userName = user.name || 'Sub Admin';
        const queryText = payload.queryText || payload.reason || 'Revisions requested by reviewer';
        const newComment = {
          id: `comm_${Date.now()}`,
          author: userName,
          company: user.company || 'ABC Textiles',
          scope: 'INTERNAL',
          text: `Review Query: ${queryText}`,
          timestamp: formattedDate,
        };

        const reopenedSubtasks = currentSubtasks.map((st) => ({
          ...st,
          status: 'TO_DO',
          completedAt: null,
        }));

        updatedFields = {
          ...updatedFields,
          status: 'IN_PROGRESS',
          comments: [...currentComments, newComment],
          ...(reopenedSubtasks.length > 0 ? { subtasks: reopenedSubtasks } : {}),
          auditTrail: [
            ...currentAudit,
            {
              action: 'Review Query Raised by Sub Admin',
              performed_by: userName,
              role: user.role || 'Sub Admin',
              timestamp: formattedDate,
              ip: ipAddress,
              details: queryText,
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

        // RULE: Only when ALL subtasks are complete does the main task advance to REVIEW
        const allCompleted = updatedSubtasksList.length > 0 && updatedSubtasksList.every((st) => st.status === 'DONE');
        const hasIncomplete = updatedSubtasksList.some((st) => st.status !== 'DONE');

        let nextStatus = task.status;
        const auditEntries = [...currentAudit];

        if (allCompleted && task.status === 'IN_PROGRESS') {
          nextStatus = 'REVIEW';
          auditEntries.push({
            action: 'All Subtasks Completed — Main Task Advanced to Review',
            performed_by: user.name || 'Assignees',
            role: user.role || 'Member',
            timestamp: formattedDate,
            ip: ipAddress,
          });
        } else if (hasIncomplete && task.status === 'REVIEW') {
          nextStatus = 'IN_PROGRESS';
          auditEntries.push({
            action: 'Subtask Reopened — Main Task Returned to In Progress',
            performed_by: user.name || 'Assignee',
            role: user.role || 'Member',
            timestamp: formattedDate,
            ip: ipAddress,
          });
        }

        updatedFields = {
          ...updatedFields,
          subtasks: updatedSubtasksList,
          status: nextStatus,
          auditTrail: auditEntries,
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

      case 'toggle_enable': {
        const nextEnabled = payload.isEnabled !== undefined ? payload.isEnabled : !task.isEnabled;
        updatedFields.isEnabled = nextEnabled;
        const userName = user.name || 'Task Creator';
        updatedFields.auditTrail = [
          ...currentAudit,
          {
            action: nextEnabled ? `Task Enabled for Active ${task.dealStage || ''} Stage` : `Task Disabled / Staged`,
            performed_by: userName,
            role: user.role || 'Creator',
            timestamp: formattedDate,
            ip: ipAddress,
          },
        ];
        break;
      }

      case 'edit_task':
      case 'update_task':
      default: {
        // Generic fields update
        if (payload.isEnabled !== undefined) updatedFields.isEnabled = payload.isEnabled;
        if (payload.is_enabled !== undefined) updatedFields.isEnabled = payload.is_enabled;
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

        const effectiveStage = updatedFields.dealStage || task.dealStage || 'Preparation';
        const isPrep = String(effectiveStage).trim().toLowerCase().includes('prep');
        if (isPrep) {
          updatedFields.visibility = 'INTERNAL';
        }

        if (payload.targetSide !== undefined) updatedFields.targetSide = payload.targetSide;
        if (payload.target_side !== undefined) updatedFields.targetSide = payload.target_side;
        if (payload.targetCompany !== undefined) updatedFields.targetCompany = payload.targetCompany;
        if (payload.target_company !== undefined) updatedFields.targetCompany = payload.target_company;
        if (payload.status !== undefined) updatedFields.status = payload.status;
        if (payload.subtasks !== undefined) updatedFields.subtasks = payload.subtasks;
        if (payload.attachments !== undefined) updatedFields.attachments = payload.attachments;

        if (payload.folderId !== undefined) updatedFields.folderId = payload.folderId;
        if (payload.folder_id !== undefined) updatedFields.folderId = payload.folder_id;
        if (payload.folderName !== undefined) updatedFields.folderName = payload.folderName;
        if (payload.folder_name !== undefined) updatedFields.folderName = payload.folder_name;
        if (payload.assigned_folder !== undefined) updatedFields.folderName = payload.assigned_folder;
        if (payload.subfolderId !== undefined) updatedFields.subfolderId = payload.subfolderId;
        if (payload.subfolder_id !== undefined) updatedFields.subfolderId = payload.subfolder_id;
        if (payload.subfolderName !== undefined) updatedFields.subfolderName = payload.subfolderName;
        if (payload.subfolder_name !== undefined) updatedFields.subfolderName = payload.subfolder_name;
        if (payload.assigned_subfolder !== undefined) updatedFields.subfolderName = payload.assigned_subfolder;

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
