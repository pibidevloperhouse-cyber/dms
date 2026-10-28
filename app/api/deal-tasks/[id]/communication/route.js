import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dealTasks, groups, userGroups, users, communicationChannels, messages } from '@/db/schema';
import { eq, or, and, isNull, desc, asc, sql, ilike } from 'drizzle-orm';
import { ensureGroupChannel } from '@/lib/communication/service';

export const dynamic = 'force-dynamic';

function normalizeString(str) {
  return (str || '').trim().toLowerCase();
}

function matchesMember(candidate, target) {
  if (!candidate || !target) return false;
  const c = normalizeString(candidate);
  const t = normalizeString(target);
  if (c === t) return true;
  if (c.split('@')[0] === t.split('@')[0]) return true;
  if (c.includes(t) || t.includes(c)) return true;
  return false;
}

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

async function resolveSenderUser(userId, userEmail, userName) {
  if (userId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (isUuid) {
      const u = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (u.length > 0) return u[0];
    }
  }
  if (userEmail) {
    const u = await db.select().from(users).where(ilike(users.email, userEmail.trim())).limit(1);
    if (u.length > 0) return u[0];
  }
  if (userName) {
    const u = await db.select().from(users).where(ilike(users.name, userName.trim())).limit(1);
    if (u.length > 0) return u[0];
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');
    const requestedTargetMember = searchParams.get('targetMember');

    // 1. Resolve current user identity and permissions
    const currentUser = await resolveSenderUser(userId, userEmail, userName);
    const callerName = currentUser?.name || userName || '';
    const callerEmail = currentUser?.email || userEmail || '';
    const callerRole = (currentUser?.role || searchParams.get('userRole') || '').toLowerCase();

    const isSuperAdmin = callerRole === 'super_admin';
    const isAdmin = isSuperAdmin || callerRole === 'admin';
    const isSubAdmin = callerRole === 'sub_admin';
    const isCreator = matchesMember(callerName, task.createdBy) || matchesMember(callerEmail, task.createdBy);
    const isAdminOrCreator = isSuperAdmin || isAdmin || isSubAdmin || isCreator;

    // 2. Locate the assigned group and channel
    const assignedGroupName = task.assignedToGroup;
    let group = null;
    let channel = null;

    if (assignedGroupName) {
      const groupRows = await db
        .select()
        .from(groups)
        .where(ilike(groups.name, assignedGroupName.trim()))
        .limit(1);
      if (groupRows.length > 0) {
        group = groupRows[0];
        channel = await ensureGroupChannel(group);
      }
    }

    if (!channel) {
      const defaultChannels = await db.select().from(communicationChannels).limit(1);
      if (defaultChannels.length > 0) {
        channel = defaultChannels[0];
      }
    }

    // 3. Resolve all specific assignees (from subtasks and task.assigned_to_user)
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const specificAssigneesMap = new Map();

    // Check main task assignee
    if (task.assignedToUser && task.assignedToUser.trim()) {
      const key = normalizeString(task.assignedToUser);
      specificAssigneesMap.set(key, {
        name: task.assignedToUser.trim(),
        subtaskTitle: 'Main Task Assignment',
        isMainTaskAssignee: true,
      });
    }

    // Check subtask assignees (e.g. Laxmi in AI group, Abhishek in AI group)
    subtasks.forEach((st) => {
      const m = (st.assignedMember || st.assigned_to_user || '').trim();
      if (m) {
        const key = normalizeString(m);
        if (!specificAssigneesMap.has(key)) {
          specificAssigneesMap.set(key, {
            name: m,
            subtaskTitle: st.title || 'Assigned Subtask',
            subtaskId: st.id,
            isSubtaskAssignee: true,
          });
        }
      }
    });

    const specificAssigneesList = Array.from(specificAssigneesMap.values());
    const hasSpecificAssignments = specificAssigneesList.length > 0;

    // Check if caller is one of the specific assignees
    const callerAsAssignee = specificAssigneesList.find(
      (a) => matchesMember(callerName, a.name) || matchesMember(callerEmail, a.name)
    );

    // If task has specific subtask/member assignments and caller is neither Admin/Creator NOR an assigned member, deny access
    if (hasSpecificAssignments && !isAdminOrCreator && !callerAsAssignee) {
      return NextResponse.json({
        success: false,
        error: 'Access restricted: Only assigned members and administrators can participate in this task communication.',
      }, { status: 403 });
    }

    // If caller is an assigned member (e.g. Laxmi or Abhishek) AND NOT the Task Creator:
    // They are STRICTLY locked to their own thread!
    const isDirectAssignee = Boolean(callerAsAssignee && !isCreator);

    // 4. Determine Active Thread Target Member
    // RULE:
    // If caller is an assigned member, they are STRICTLY locked to their own thread with Admin!
    // If caller is Admin/Creator (e.g. Vishwa), they can choose which member thread to view (defaults to requested or first assignee).
    let activeTargetMember = null;
    let activeTargetMemberInfo = null;

    if (hasSpecificAssignments) {
      if (isDirectAssignee) {
        activeTargetMember = callerAsAssignee.name;
        activeTargetMemberInfo = callerAsAssignee;
      } else {
        if (requestedTargetMember) {
          const found = specificAssigneesList.find((a) => matchesMember(requestedTargetMember, a.name));
          if (found) {
            activeTargetMember = found.name;
            activeTargetMemberInfo = found;
          }
        }
        if (!activeTargetMember && specificAssigneesList.length > 0) {
          activeTargetMember = specificAssigneesList[0].name;
          activeTargetMemberInfo = specificAssigneesList[0];
        }
      }
    }

    // 5. Build Threads List for Admin Navigation
    // Admins will see separate threads: e.g. [Abhishek K J], [Laxmi]
    // Members only see their own thread!
    const availableThreads = hasSpecificAssignments
      ? (!isDirectAssignee
          ? specificAssigneesList.map((a) => ({
              memberName: a.name,
              subtaskTitle: a.subtaskTitle,
              isActive: matchesMember(activeTargetMember, a.name),
            }))
          : [
              {
                memberName: callerAsAssignee.name,
                subtaskTitle: callerAsAssignee.subtaskTitle,
                isActive: true,
              },
            ])
      : [];

    // 6. Resolve Creator Info
    const creatorName = task.createdBy || 'Admin';

    // 7. Fetch Messages for this Task and Thread
    let formattedMessages = [];
    if (channel) {
      const dbMsgs = await db
        .select({
          id: messages.id,
          channelId: messages.channelId,
          senderId: messages.senderId,
          senderName: users.name,
          senderEmail: users.email,
          senderRole: users.role,
          messageText: messages.messageText,
          messageType: messages.messageType,
          attachments: messages.attachments,
          metadata: messages.metadata,
          isEdited: messages.isEdited,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            eq(messages.channelId, channel.id),
            isNull(messages.deletedAt),
            or(
              sql`${messages.metadata}->>'taskId' = ${task.id}`,
              sql`${messages.metadata}->>'taskId' = ${task.taskId}`,
              sql`${messages.metadata}->>'taskCode' = ${task.taskId}`
            )
          )
        )
        .orderBy(asc(messages.createdAt));

      formattedMessages = dbMsgs
        .filter((m) => {
          // 1. Check if deleted for me
          const meta = m.metadata || {};
          const deletedFor = Array.isArray(meta.deletedFor) ? meta.deletedFor : [];
          if (
            (userId && deletedFor.includes(userId)) ||
            (callerEmail && deletedFor.includes(callerEmail)) ||
            (callerName && deletedFor.includes(callerName))
          ) {
            return false;
          }

          // 2. If task has specific subtask assignments, FILTER strictly by activeTargetMember!
          if (activeTargetMember) {
            const msgTarget = m.metadata?.targetMember;
            const senderName = m.senderName || '';
            const senderEmail = m.senderEmail || '';

            // Message belongs to this thread if:
            // 1. metadata.targetMember matches activeTargetMember
            if (msgTarget && matchesMember(msgTarget, activeTargetMember)) {
              return true;
            }
            // 2. Or message is from the activeTargetMember directly
            if (matchesMember(senderName, activeTargetMember) || matchesMember(senderEmail, activeTargetMember)) {
              return true;
            }
            return false;
          }
          return true;
        })
        .map((m) => {
          const isCurrentSender =
            (userId && m.senderId === userId) ||
            (callerEmail && m.senderEmail?.toLowerCase() === callerEmail.toLowerCase()) ||
            (callerName && m.senderName?.toLowerCase() === callerName.toLowerCase());

          return {
            id: m.id,
            senderId: m.senderId,
            senderName: m.senderName || 'Team Member',
            senderEmail: m.senderEmail || '',
            senderRole: m.senderRole || 'Member',
            text: m.messageText,
            messageText: m.messageText,
            messageType: m.messageType,
            attachments: m.attachments || [],
            targetMember: m.metadata?.targetMember || null,
            createdAt: m.createdAt,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isMine: Boolean(isCurrentSender),
            isEdited: Boolean(m.isEdited),
          };
        });
    }

    // Fallback: If no db messages found, check legacy task comments for this thread
    if (formattedMessages.length === 0 && Array.isArray(task.comments) && task.comments.length > 0) {
      formattedMessages = task.comments
        .filter((c) => {
          if (c.isDeleted) return false;
          const deletedFor = Array.isArray(c.deletedFor) ? c.deletedFor : [];
          if (
            (userId && deletedFor.includes(userId)) ||
            (callerEmail && deletedFor.includes(callerEmail)) ||
            (callerName && deletedFor.includes(callerName))
          ) {
            return false;
          }
          if (activeTargetMember) {
            if (c.targetMember) return matchesMember(c.targetMember, activeTargetMember);
            if (matchesMember(c.author, activeTargetMember)) return true;
            // Admin comments without targetMember show on all threads
            if (matchesMember(c.author, creatorName)) return true;
            return false;
          }
          return true;
        })
        .map((c, idx) => ({
          id: c.id || `comment_${idx}`,
          senderId: c.authorId || null,
          senderName: c.author || 'Team Member',
          senderEmail: c.authorEmail || '',
          senderRole: c.authorRole || 'Member',
          text: c.text,
          messageText: c.text,
          messageType: 'text',
          attachments: [],
          targetMember: c.targetMember || null,
          createdAt: c.createdAt || new Date().toISOString(),
          timestamp: c.timestamp || 'Just now',
          isMine:
            (userId && c.authorId === userId) ||
            (callerName && matchesMember(c.author, callerName)) ||
            (callerEmail && matchesMember(c.authorEmail, callerEmail)),
          isEdited: Boolean(c.isEdited),
        }));
    }

    // 8. Participants for the Active Thread (strictly 1-on-1 between Admin and the assigned member)
    const threadParticipants = [];
    threadParticipants.push({
      name: creatorName,
      role: task.creatorRole || 'Admin',
      participantType: 'Admin / Task Creator',
      isCreator: true,
      isOnline: true,
    });

    if (activeTargetMember) {
      threadParticipants.push({
        name: activeTargetMember,
        role: 'Subtask Assignee',
        participantType: 'Assigned Member',
        isCreator: false,
        isOnline: true,
      });
    } else {
      // General group participants
      threadParticipants.push({
        name: assignedGroupName || 'Group Members',
        role: 'Team',
        participantType: 'Assigned Group',
        isCreator: false,
        isOnline: true,
      });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        priority: task.priority,
        department: task.department,
        assignedToGroup: task.assignedToGroup,
        assignedToUser: task.assignedToUser,
        createdBy: task.createdBy,
        creatorRole: task.creatorRole,
        subtasks: task.subtasks || [],
      },
      hasSpecificAssignments,
      activeTargetMember,
      availableThreads,
      isAdminOrCreator,
      participants: threadParticipants,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error('Task communication GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const payload = await req.json();
    const {
      userId,
      userEmail,
      userName,
      userRole,
      messageText,
      attachments = [],
      targetMember: passedTargetMember,
      session,
    } = payload;

    if (!messageText || !messageText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message text cannot be empty' },
        { status: 400 }
      );
    }

    // Resolve sender user
    const resolvedUser = await resolveSenderUser(
      userId || session?.id,
      userEmail || session?.email,
      userName || session?.name
    );

    const senderId = resolvedUser ? resolvedUser.id : (userId || session?.id);
    const senderName = resolvedUser ? resolvedUser.name : (userName || session?.name || 'User');
    const senderEmail = resolvedUser ? resolvedUser.email : (userEmail || session?.email || '');
    const senderRole = resolvedUser ? resolvedUser.role : (userRole || session?.role || 'Member');

    // Resolve specific assignees for this task
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const specificAssigneesMap = new Map();
    if (task.assignedToUser && task.assignedToUser.trim()) {
      specificAssigneesMap.set(normalizeString(task.assignedToUser), task.assignedToUser.trim());
    }
    subtasks.forEach((st) => {
      const m = (st.assignedMember || st.assigned_to_user || '').trim();
      if (m) specificAssigneesMap.set(normalizeString(m), m);
    });

    const isCallerCreator = matchesMember(senderName, task.createdBy) || matchesMember(senderEmail, task.createdBy);
    const callerAsAssignee = Array.from(specificAssigneesMap.values()).find(
      (m) => matchesMember(senderName, m) || matchesMember(senderEmail, m)
    );

    // Resolve the target member thread:
    // If sender is an assigned member (and NOT the Task Creator), they are strictly locked to their own thread!
    // If sender is Task Creator / Admin, targetMember is the passed targetMember
    let resolvedTargetMember = null;
    if (callerAsAssignee && !isCallerCreator) {
      resolvedTargetMember = callerAsAssignee;
    } else {
      resolvedTargetMember = passedTargetMember ? passedTargetMember.trim() : (Array.from(specificAssigneesMap.values())[0] || null);
    }

    // 1. Locate assigned group & ensure channel
    let channel = null;
    if (task.assignedToGroup) {
      const groupRows = await db
        .select()
        .from(groups)
        .where(ilike(groups.name, task.assignedToGroup.trim()))
        .limit(1);
      if (groupRows.length > 0) {
        channel = await ensureGroupChannel(groupRows[0]);
      }
    }

    if (!channel) {
      const defaultChannels = await db.select().from(communicationChannels).limit(1);
      if (defaultChannels.length > 0) {
        channel = defaultChannels[0];
      }
    }

    if (!channel) {
      return NextResponse.json(
        { success: false, error: 'No communication channel available for this group' },
        { status: 500 }
      );
    }

    // 2. Prepare message metadata linking directly to this task and specific member thread
    const messageMetadata = {
      taskId: task.id,
      taskCode: task.taskId,
      taskTitle: task.title,
      groupName: task.assignedToGroup,
      targetMember: resolvedTargetMember || null,
      assignedTo: resolvedTargetMember || null,
      createdBy: task.createdBy,
    };

    // 3. Persist to central messages table
    let savedMessage = null;
    if (senderId) {
      try {
        const [inserted] = await db
          .insert(messages)
          .values({
            channelId: channel.id,
            senderId: senderId,
            messageText: messageText.trim(),
            messageType: 'task',
            attachments: attachments || [],
            metadata: messageMetadata,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        savedMessage = inserted;

        await db
          .update(communicationChannels)
          .set({ lastActivityAt: new Date() })
          .where(eq(communicationChannels.id, channel.id));
      } catch (insertErr) {
        console.warn('Failed to insert into messages table, falling back:', insertErr);
      }
    }

    // 4. Also append to dealTasks.comments for 100% backward compatibility
    const now = new Date();
    const formattedTimestamp = `${now.getDate()}-${now.toLocaleString('default', { month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const commentRecord = {
      id: savedMessage?.id || `msg_${Date.now()}`,
      author: senderName,
      authorEmail: senderEmail,
      authorRole: senderRole,
      authorId: senderId,
      text: messageText.trim(),
      attachments: attachments || [],
      targetMember: resolvedTargetMember || null,
      timestamp: formattedTimestamp,
      scope: 'INTERNAL',
      createdAt: now.toISOString(),
    };

    const currentComments = Array.isArray(task.comments) ? [...task.comments] : [];
    currentComments.push(commentRecord);

    await db
      .update(dealTasks)
      .set({
        comments: currentComments,
        updatedAt: now,
      })
      .where(eq(dealTasks.id, task.id));

    return NextResponse.json({
      success: true,
      message: {
        id: savedMessage?.id || commentRecord.id,
        senderId,
        senderName,
        senderEmail,
        senderRole,
        text: messageText.trim(),
        messageType: 'task',
        attachments: attachments || [],
        targetMember: resolvedTargetMember || null,
        createdAt: now.toISOString(),
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
      },
    });
  } catch (error) {
    console.error('Task communication POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/deal-tasks/[id]/communication
 * Edit a task message (sender only)
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const payload = await req.json();
    const { messageId, messageText, userId, userEmail, userName } = payload;

    if (!messageId || !messageText?.trim()) {
      return NextResponse.json(
        { success: false, error: 'messageId and messageText are required' },
        { status: 400 }
      );
    }

    const trimmedText = messageText.trim();
    const now = new Date();

    // 1. Update in messages table
    await db
      .update(messages)
      .set({
        messageText: trimmedText,
        isEdited: true,
        updatedAt: now,
      })
      .where(eq(messages.id, messageId));

    // 2. Also update in dealTasks.comments array if present
    if (Array.isArray(task.comments) && task.comments.length > 0) {
      let commentUpdated = false;
      const updatedComments = task.comments.map((c) => {
        if (c.id === messageId) {
          commentUpdated = true;
          return {
            ...c,
            text: trimmedText,
            isEdited: true,
            updatedAt: now.toISOString(),
          };
        }
        return c;
      });

      if (commentUpdated) {
        await db
          .update(dealTasks)
          .set({
            comments: updatedComments,
            updatedAt: now,
          })
          .where(eq(dealTasks.id, task.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        text: trimmedText,
        messageText: trimmedText,
        isEdited: true,
        updatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Task communication PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/deal-tasks/[id]/communication
 * Delete message:
 * - type='everyone': soft delete for everyone
 * - type='me': hide message only for requesting user
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const task = await findTask(id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');
    const userName = searchParams.get('userName');
    const type = searchParams.get('type') || 'me';

    if (!messageId) {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
    }

    const callerKey = userId || userEmail || userName || 'unknown';
    const now = new Date();

    if (type === 'everyone') {
      // 1. Soft-delete in messages table
      await db
        .update(messages)
        .set({
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(messages.id, messageId));

      // 2. In dealTasks.comments array: mark isDeleted = true
      if (Array.isArray(task.comments) && task.comments.length > 0) {
        const updatedComments = task.comments.map((c) => {
          if (c.id === messageId) {
            return { ...c, isDeleted: true, deletedAt: now.toISOString() };
          }
          return c;
        });

        await db
          .update(dealTasks)
          .set({
            comments: updatedComments,
            updatedAt: now,
          })
          .where(eq(dealTasks.id, task.id));
      }

      return NextResponse.json({
        success: true,
        deleteType: 'everyone',
        messageId,
      });
    } else {
      // Delete for ME: add caller key to metadata.deletedFor
      const msgRows = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (msgRows.length > 0) {
        const currentMeta = msgRows[0].metadata || {};
        const deletedFor = Array.isArray(currentMeta.deletedFor)
          ? [...currentMeta.deletedFor]
          : [];

        if (!deletedFor.includes(callerKey)) deletedFor.push(callerKey);
        if (userId && !deletedFor.includes(userId)) deletedFor.push(userId);
        if (userEmail && !deletedFor.includes(userEmail)) deletedFor.push(userEmail);

        await db
          .update(messages)
          .set({
            metadata: {
              ...currentMeta,
              deletedFor,
            },
            updatedAt: now,
          })
          .where(eq(messages.id, messageId));
      }

      // In dealTasks.comments:
      if (Array.isArray(task.comments) && task.comments.length > 0) {
        const updatedComments = task.comments.map((c) => {
          if (c.id === messageId) {
            const currentDeletedFor = Array.isArray(c.deletedFor) ? [...c.deletedFor] : [];
            if (!currentDeletedFor.includes(callerKey)) currentDeletedFor.push(callerKey);
            if (userId && !currentDeletedFor.includes(userId)) currentDeletedFor.push(userId);
            if (userEmail && !currentDeletedFor.includes(userEmail)) currentDeletedFor.push(userEmail);
            return { ...c, deletedFor: currentDeletedFor };
          }
          return c;
        });

        await db
          .update(dealTasks)
          .set({
            comments: updatedComments,
            updatedAt: now,
          })
          .where(eq(dealTasks.id, task.id));
      }

      return NextResponse.json({
        success: true,
        deleteType: 'me',
        messageId,
      });
    }
  } catch (error) {
    console.error('Task communication DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

