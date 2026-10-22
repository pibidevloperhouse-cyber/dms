import { db } from '@/db';
import {
  users,
  groups,
  userGroups,
  communicationChannels,
  messages,
  channelMembers
} from '@/db/schema';
import { eq, and, inArray, desc, asc, isNull, or, sql } from 'drizzle-orm';

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

  // Ensure each authorized group has a 1:1 communication_channels record
  const resultChannels = [];
  for (const group of authorizedGroups) {
    const channel = await ensureGroupChannel(group);

    // Get group member count
    const memberRows = await db
      .select({ userId: userGroups.userId })
      .from(userGroups)
      .where(eq(userGroups.groupId, group.id));

    // Get latest message preview
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

    resultChannels.push({
      id: channel.id,
      groupId: group.id,
      name: group.name,
      description: group.description,
      department: group.department || 'General',
      role: group.role,
      type: channel.type,
      memberCount: memberRows.length,
      lastActivityAt: channel.lastActivityAt || group.updatedAt,
      latestMessage: latestMessages[0] || null,
    });
  }

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
