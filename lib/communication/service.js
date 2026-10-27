import { db } from '@/db';
import {
  users,
  groups,
  userGroups,
  communicationChannels,
  messages,
  channelMembers,
  messageMentions,
} from '@/db/schema';
import { eq, ne, gt, and, inArray, desc, asc, isNull, or, sql } from 'drizzle-orm';

/**
 * Validates that a user exists and is active.
 */
export async function getActiveUser(userId) {
  if (!userId) return null;
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      companyId: users.companyId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userList[0];
  if (!user || user.status === 'suspended' || user.status === 'revoked') {
    return null;
  }
  return user;
}

/**
 * Ensures a 1:1 communication channel exists for a given group.
 */
export async function ensureGroupChannel(group) {
  // Check if channel already exists for this group
  const existing = await db
    .select()
    .from(communicationChannels)
    .where(eq(communicationChannels.groupId, group.id))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Atomically create the 1:1 channel with groupId
  try {
    const [newChannel] = await db
      .insert(communicationChannels)
      .values({
        companyId: group.companyId,
        workspaceId: null, // Left null to avoid legacy workspace foreign key conflicts in DMS
        groupId: group.id,
        name: group.name,
        description: group.description,
        type: 'public',
        visibility: 'internal',
        createdBy: group.createdBy,
        lastActivityAt: new Date(),
      })
      .returning();

    return newChannel;
  } catch (err) {
    // In case of race condition / unique constraint collision, fetch existing
    const retry = await db
      .select()
      .from(communicationChannels)
      .where(eq(communicationChannels.groupId, group.id))
      .limit(1);
    if (retry.length > 0) return retry[0];
    throw err;
  }
}

/**
 * Fetches all groups authorized for the user, ensuring their corresponding channels exist.
 */
export async function getAuthorizedGroupChannels(userId, workspaceId = null) {
  const user = await getActiveUser(userId);
  if (!user) {
    return { error: 'Unauthorized: User not found or inactive', status: 401 };
  }

  let authorizedGroups = [];

  if (user.role === 'super_admin') {
    // Super admin can access all company groups (scoped to workspace if supplied)
    let conditions = [eq(groups.companyId, user.companyId)];
    if (workspaceId) {
      conditions.push(or(eq(groups.workspaceId, workspaceId), isNull(groups.workspaceId)));
    }
    authorizedGroups = await db
      .select()
      .from(groups)
      .where(and(...conditions))
      .orderBy(desc(groups.createdAt));
  } else {
    // Authoritative check: user must belong to group via user_groups
    const ugRows = await db
      .select({ groupId: userGroups.groupId })
      .from(userGroups)
      .where(eq(userGroups.userId, user.id));

    const groupIds = ugRows.map((r) => r.groupId);

    if (groupIds.length === 0) {
      return { channels: [], user };
    }

    let conditions = [
      inArray(groups.id, groupIds),
      eq(groups.companyId, user.companyId),
    ];
    if (workspaceId) {
      conditions.push(or(eq(groups.workspaceId, workspaceId), isNull(groups.workspaceId)));
    }

    authorizedGroups = await db
      .select()
      .from(groups)
      .where(and(...conditions))
      .orderBy(desc(groups.createdAt));
  }

  // Filter out any type === 'individual' if only group conversations are desired
  authorizedGroups = authorizedGroups.filter((g) => g.type !== 'individual');

  const groupIds = authorizedGroups.map((g) => g.id);
  if (groupIds.length === 0) {
    return { channels: [], user };
  }

  // 1. Batch fetch all existing channels for authorized groups
  const existingChannels = await db
    .select()
    .from(communicationChannels)
    .where(inArray(communicationChannels.groupId, groupIds));

  const channelByGroupId = new Map();
  existingChannels.forEach((ch) => channelByGroupId.set(ch.groupId, ch));

  // Ensure any group without a channel gets created
  for (const group of authorizedGroups) {
    if (!channelByGroupId.has(group.id)) {
      const newCh = await ensureGroupChannel(group);
      channelByGroupId.set(group.id, newCh);
    }
  }

  const allChannels = authorizedGroups.map((g) => channelByGroupId.get(g.id)).filter(Boolean);
  const channelIds = allChannels.map((c) => c.id);

  // 2. Batch fetch member counts and user read timestamps in parallel
  const [allUserGroups, allMemberRecs] = await Promise.all([
    db
      .select({ groupId: userGroups.groupId })
      .from(userGroups)
      .where(inArray(userGroups.groupId, groupIds)),
    channelIds.length > 0
      ? db
          .select({ channelId: channelMembers.channelId, lastReadAt: channelMembers.lastReadAt })
          .from(channelMembers)
          .where(and(inArray(channelMembers.channelId, channelIds), eq(channelMembers.userId, user.id)))
      : Promise.resolve([]),
  ]);

  const memberCountByGroupId = new Map();
  allUserGroups.forEach((ug) => {
    memberCountByGroupId.set(ug.groupId, (memberCountByGroupId.get(ug.groupId) || 0) + 1);
  });

  const lastReadByChannelId = new Map();
  allMemberRecs.forEach((mr) => {
    lastReadByChannelId.set(mr.channelId, mr.lastReadAt);
  });

  // 3. Resolve channels in parallel with fast-path unread evaluation
  const channelPromises = authorizedGroups.map(async (group) => {
    const channel = channelByGroupId.get(group.id);
    if (!channel) return null;

    const lastReadAt = lastReadByChannelId.get(channel.id) || null;

    // Fetch latest message preview
    const latestMessages = await db
      .select({
        id: messages.id,
        messageText: messages.messageText,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(and(eq(messages.channelId, channel.id), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const latestMsg = latestMessages[0] || null;

    let unreadCount = 0;
    let unreadMentionsCount = 0;

    // Fast path: if no messages, sender is current user, or latest message <= lastReadAt, unread is 0
    const hasNewActivity =
      latestMsg &&
      latestMsg.senderId !== user.id &&
      (!lastReadAt || new Date(latestMsg.createdAt) > new Date(lastReadAt));

    if (hasNewActivity) {
      try {
        const queryConditions = [
          eq(messages.channelId, channel.id),
          ne(messages.senderId, user.id),
          isNull(messages.deletedAt),
        ];
        if (lastReadAt) {
          queryConditions.push(gt(messages.createdAt, lastReadAt));
        }

        const unreadRows = await db
          .select({ id: messages.id, metadata: messages.metadata })
          .from(messages)
          .where(and(...queryConditions))
          .limit(50);

        const activeUnread = unreadRows.filter((m) => {
          const meta = m.metadata || {};
          const delFor = Array.isArray(meta.deletedFor) ? meta.deletedFor : [];
          return !delFor.includes(user.id);
        });

        unreadCount = activeUnread.length;

        if (unreadCount > 0) {
          const mentionRows = await db
            .select({ id: messageMentions.id })
            .from(messageMentions)
            .innerJoin(messages, eq(messageMentions.messageId, messages.id))
            .where(
              and(
                eq(messages.channelId, channel.id),
                eq(messageMentions.userId, user.id),
                eq(messageMentions.isRead, false)
              )
            );
          unreadMentionsCount = mentionRows.length;
        }
      } catch (countErr) {
        console.warn('Failed to calculate channel unread count:', countErr);
      }
    }

    return {
      id: channel.id,
      groupId: group.id,
      name: group.name,
      description: group.description,
      department: group.department || 'General',
      role: group.role,
      type: channel.type,
      memberCount: memberCountByGroupId.get(group.id) || 0,
      lastActivityAt: channel.lastActivityAt || group.updatedAt,
      latestMessage: latestMsg,
      unreadCount,
      unreadMentionsCount,
    };
  });

  const rawResults = await Promise.all(channelPromises);
  const resultChannels = rawResults.filter(Boolean);

  // Sort channels by last activity
  resultChannels.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));

  return { channels: resultChannels, user };
}

/**
 * Verifies that a user is authorized to access a channel and its associated group.
 */
export async function verifyChannelAccess(userId, channelId, workspaceId = null) {
  const user = await getActiveUser(userId);
  if (!user) {
    return { authorized: false, error: 'Unauthorized: User not found or inactive', status: 401 };
  }

  const channelRows = await db
    .select()
    .from(communicationChannels)
    .where(eq(communicationChannels.id, channelId))
    .limit(1);

  if (channelRows.length === 0) {
    return { authorized: false, error: 'Channel not found', status: 404 };
  }

  const channel = channelRows[0];

  // Group channel verification
  if (!channel.groupId) {
    // Non-group channel (e.g. legacy workspace channel)
    if (channel.companyId !== user.companyId) {
      return { authorized: false, error: 'Forbidden: Channel belongs to another company', status: 403 };
    }
    return { authorized: true, user, channel, group: null };
  }

  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.id, channel.groupId))
    .limit(1);

  if (groupRows.length === 0) {
    return { authorized: false, error: 'Group associated with channel not found', status: 404 };
  }

  const group = groupRows[0];

  // Verify company scope
  if (group.companyId !== user.companyId) {
    return { authorized: false, error: 'Forbidden: Group belongs to another company', status: 403 };
  }

  // Verify workspace scope if specified and group is workspace-scoped
  if (workspaceId && group.workspaceId && group.workspaceId !== workspaceId) {
    return { authorized: false, error: 'Forbidden: Group belongs to another workspace', status: 403 };
  }

  // Super admin has company-wide access
  if (user.role === 'super_admin') {
    return { authorized: true, user, channel, group };
  }

  // Authoritative check: verify membership in user_groups
  const membership = await db
    .select()
    .from(userGroups)
    .where(and(eq(userGroups.userId, user.id), eq(userGroups.groupId, group.id)))
    .limit(1);

  if (membership.length === 0) {
    return { authorized: false, error: 'Forbidden: You are not authorized to access this conversation', status: 403 };
  }

  return { authorized: true, user, channel, group };
}

/**
 * Returns the real members of a group from user_groups and users.
 */
export async function getGroupMembers(groupId) {
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(userGroups)
    .innerJoin(users, eq(userGroups.userId, users.id))
    .where(eq(userGroups.groupId, groupId));

  return members;
}

/**
 * Marks a channel as read for a given user and marks any pending mentions as read.
 */
export async function markChannelAsRead(userId, channelId) {
  if (!userId || !channelId) {
    return { success: false, error: 'User ID and Channel ID are required' };
  }
  const now = new Date();

  try {
    const existing = await db
      .select({ id: channelMembers.id })
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(channelMembers)
        .set({ lastReadAt: now })
        .where(eq(channelMembers.id, existing[0].id));
    } else {
      await db
        .insert(channelMembers)
        .values({
          channelId,
          userId,
          lastReadAt: now,
        });
    }

    // Mark any mentions for this user in this channel as read
    const channelMsgs = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.channelId, channelId));

    const msgIds = channelMsgs.map((m) => m.id);
    if (msgIds.length > 0) {
      await db
        .update(messageMentions)
        .set({ isRead: true })
        .where(
          and(
            eq(messageMentions.userId, userId),
            inArray(messageMentions.messageId, msgIds),
            eq(messageMentions.isRead, false)
          )
        );
    }

    return { success: true, lastReadAt: now };
  } catch (err) {
    console.error('markChannelAsRead error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Parses mentions from messageText and records unread messageMentions rows for group members.
 */
export async function recordMessageMentions(messageId, channelId, senderId, messageText) {
  if (!messageId || !channelId || !messageText) return [];

  try {
    const channelRows = await db
      .select({ groupId: communicationChannels.groupId })
      .from(communicationChannels)
      .where(eq(communicationChannels.id, channelId))
      .limit(1);

    if (!channelRows[0]?.groupId) return [];
    const groupId = channelRows[0].groupId;

    const groupMembers = await getGroupMembers(groupId);
    const eligibleMembers = groupMembers.filter((m) => m.id !== senderId);
    if (eligibleMembers.length === 0) return [];

    const lowerText = messageText.toLowerCase();
    const mentionedUserIds = new Set();

    if (lowerText.includes('@everyone')) {
      eligibleMembers.forEach((m) => mentionedUserIds.add(m.id));
    } else {
      const matches = messageText.match(/@([a-zA-Z0-9._-]+)/g) || [];
      for (const match of matches) {
        const token = match.substring(1).toLowerCase();
        for (const member of eligibleMembers) {
          const memName = (member.name || '').toLowerCase();
          const memEmail = (member.email || '').toLowerCase();
          const memFirst = memName.split(' ')[0] || '';
          if (
            memName.includes(token) ||
            memFirst === token ||
            memEmail.includes(token)
          ) {
            mentionedUserIds.add(member.id);
          }
        }
      }
    }

    const records = [];
    for (const targetUserId of mentionedUserIds) {
      const [rec] = await db
        .insert(messageMentions)
        .values({
          messageId,
          userId: targetUserId,
          isRead: false,
        })
        .returning();
      records.push(rec);
    }

    return records;
  } catch (err) {
    console.warn('recordMessageMentions error:', err);
    return [];
  }
}

