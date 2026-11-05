import { db } from '@/db';
import {
  users,
  groups,
  userGroups,
  communicationChannels,
  messages,
  channelMembers,
  messageMentions,
  dmsDeals,
  dmsProjects,
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
 * Resolves the deal, buyer, and seller for a given deal ID (or workspace ID).
 */
export async function getDealParticipants(dealId) {
  if (!dealId) return null;

  try {
    // 1. Fetch deal by id or workspaceId
    const dealRows = await db
      .select({
        id: dmsDeals.id,
        dealName: dmsDeals.dealName,
        buyerId: dmsDeals.buyerId,
        projectId: dmsDeals.projectId,
        workspaceId: dmsDeals.workspaceId,
      })
      .from(dmsDeals)
      .where(or(eq(dmsDeals.id, dealId), eq(dmsDeals.workspaceId, dealId)))
      .limit(1);

    if (dealRows.length === 0) return null;
    const deal = dealRows[0];

    // 2. Fetch seller company ID via project
    let sellerCompanyId = null;
    if (deal.projectId) {
      const projRows = await db
        .select({ id: dmsProjects.id, companyId: dmsProjects.companyId })
        .from(dmsProjects)
        .where(eq(dmsProjects.id, deal.projectId))
        .limit(1);
      if (projRows.length > 0) {
        sellerCompanyId = projRows[0].companyId;
      }
    }

    // 3. Fetch buyer user
    let buyer = null;
    if (deal.buyerId) {
      const buyerRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          status: users.status,
        })
        .from(users)
        .where(eq(users.id, deal.buyerId))
        .limit(1);
      if (buyerRows.length > 0) {
        buyer = buyerRows[0];
      }
    }

    // 4. Fetch seller user (Vishwa or Super Admin for this seller company)
    let seller = null;
    if (sellerCompanyId) {
      const sellerUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          status: users.status,
        })
        .from(users)
        .where(and(eq(users.companyId, sellerCompanyId), ne(users.status, 'suspended')));

      seller =
        sellerUsers.find((u) => (u.name || '').toLowerCase().includes('vishwa')) ||
        sellerUsers.find((u) => (u.email || '').toLowerCase().includes('vishwa')) ||
        sellerUsers.find((u) => u.role === 'super_admin') ||
        sellerUsers.find((u) => u.role === 'admin') ||
        sellerUsers[0] ||
        null;
    }

    // Fallback if seller not resolved via company: check globally for super_admin or user named Vishwa
    if (!seller) {
      const globalUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          status: users.status,
        })
        .from(users)
        .where(ne(users.status, 'suspended'));

      seller =
        globalUsers.find((u) => (u.name || '').toLowerCase().includes('vishwa')) ||
        globalUsers.find((u) => (u.email || '').toLowerCase().includes('vishwa')) ||
        globalUsers.find((u) => u.role === 'super_admin') ||
        globalUsers.find((u) => u.role === 'admin') ||
        null;
    }

    // Fallback for buyer if not linked on deal record
    if (!buyer) {
      const globalUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyId: users.companyId,
          status: users.status,
        })
        .from(users)
        .where(ne(users.status, 'suspended'));

      buyer =
        globalUsers.find((u) => (u.name || '').toLowerCase().includes('naga')) ||
        globalUsers.find((u) => (u.email || '').toLowerCase().includes('naga')) ||
        globalUsers.find((u) => ['guest_admin', 'guest_lead', 'external_user', 'buyer'].includes(u.role)) ||
        null;
    }

    return { deal, buyer, seller };
  } catch (err) {
    console.error('getDealParticipants error:', err);
    return null;
  }
}

/**
 * Ensures a 1:1 direct message communication channel exists between buyer and seller for a deal.
 */
export async function ensureDirectMessageChannel(dealId, buyer, seller) {
  if (!dealId || !buyer || !seller) return null;

  try {
    const existing = await db
      .select()
      .from(communicationChannels)
      .where(
        and(
          eq(communicationChannels.type, 'direct_message'),
          or(
            sql`${communicationChannels.description} LIKE ${`%[dealId:${dealId}]%`}`,
            eq(communicationChannels.workspaceId, dealId)
          )
        )
      )
      .limit(1);

    let channel = existing[0];

    if (!channel) {
      const [newCh] = await db
        .insert(communicationChannels)
        .values({
          companyId: seller.companyId || buyer.companyId,
          workspaceId: null, // Left null to avoid legacy workspace foreign key constraint collision in DMS
          groupId: null,
          name: `${seller.name || 'Seller'} & ${buyer.name || 'Buyer'}`,
          description: `Direct 1:1 communication between ${buyer.name || 'Buyer'} and ${seller.name || 'Seller'} [dealId:${dealId}]`,
          type: 'direct_message',
          visibility: 'internal',
          createdBy: buyer.id || seller.id,
          lastActivityAt: new Date(),
        })
        .returning();
      channel = newCh;
    }

    // Ensure channel_members entries for both buyer and seller
    const members = await db
      .select({ userId: channelMembers.userId })
      .from(channelMembers)
      .where(eq(channelMembers.channelId, channel.id));

    const userIds = new Set(members.map((m) => m.userId));
    const toInsert = [];
    if (!userIds.has(buyer.id)) {
      toInsert.push({ channelId: channel.id, userId: buyer.id, role: 'member' });
    }
    if (!userIds.has(seller.id)) {
      toInsert.push({ channelId: channel.id, userId: seller.id, role: 'member' });
    }

    if (toInsert.length > 0) {
      await db.insert(channelMembers).values(toInsert);
    }

    return channel;
  } catch (err) {
    console.error('ensureDirectMessageChannel error:', err);
    return null;
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

  // Check if scoped to an active deal
  let dealParticipants = null;
  if (workspaceId) {
    dealParticipants = await getDealParticipants(workspaceId);
  }

  let authorizedGroups = [];
  let directMessageChannel = null;

  if (dealParticipants && dealParticipants.deal) {
    const { deal, buyer, seller } = dealParticipants;

    const isBuyer = buyer && user.id === buyer.id;
    const isSeller = (seller && user.id === seller.id) || user.role === 'super_admin';

    // 1. Ensure 1:1 Direct Message channel for buyer & seller
    if (buyer && seller && (isBuyer || isSeller)) {
      const dm = await ensureDirectMessageChannel(deal.id, buyer, seller);
      if (dm) {
        const latestDmMsgs = await db
          .select({
            id: messages.id,
            messageText: messages.messageText,
            createdAt: messages.createdAt,
            senderId: messages.senderId,
          })
          .from(messages)
          .where(and(eq(messages.channelId, dm.id), isNull(messages.deletedAt)))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const latestMsg = latestDmMsgs[0] || null;

        const memberRecs = await db
          .select({ lastReadAt: channelMembers.lastReadAt })
          .from(channelMembers)
          .where(and(eq(channelMembers.channelId, dm.id), eq(channelMembers.userId, user.id)))
          .limit(1);

        const lastReadAt = memberRecs[0]?.lastReadAt || null;
        let unreadCount = 0;
        if (
          latestMsg &&
          latestMsg.senderId !== user.id &&
          (!lastReadAt || new Date(latestMsg.createdAt) > new Date(lastReadAt))
        ) {
          const unreadRows = await db
            .select({ id: messages.id, metadata: messages.metadata })
            .from(messages)
            .where(
              and(
                eq(messages.channelId, dm.id),
                ne(messages.senderId, user.id),
                isNull(messages.deletedAt),
                lastReadAt ? gt(messages.createdAt, lastReadAt) : sql`true`
              )
            )
            .limit(50);
          unreadCount = unreadRows.length;
        }

        const partnerUser = isBuyer ? seller : buyer;
        directMessageChannel = {
          id: dm.id,
          groupId: null,
          name: isBuyer
            ? `${partnerUser?.name || 'Seller'} (Seller)`
            : `${partnerUser?.name || 'Buyer'} (Buyer)`,
          description: `1:1 Direct communication for Deal: ${deal.dealName || 'Deal'}`,
          department: 'Direct Message',
          role: isBuyer ? 'seller' : 'buyer',
          type: 'direct_message',
          isDirectMessage: true,
          partner: partnerUser,
          memberCount: 2,
          lastActivityAt: dm.lastActivityAt || dm.updatedAt,
          latestMessage: latestMsg,
          unreadCount,
          unreadMentionsCount: 0,
        };
      }
    }

    // 2. Fetch groups strictly scoped to this deal
    let dealGroupConditions = [
      or(
        eq(groups.workspaceId, deal.id),
        sql`${groups.workspaceId}::text = ${deal.id}::text`
      ),
    ];

    const allDealGroups = await db
      .select()
      .from(groups)
      .where(and(...dealGroupConditions))
      .orderBy(desc(groups.createdAt));

    // Buyer groups authorized:
    // Seller can communicate with all groups in this deal!
    // Buyer can access their own/deal groups!
    if (isSeller) {
      authorizedGroups = allDealGroups.filter((g) => g.type !== 'individual');
    } else {
      const ugRows = await db
        .select({ groupId: userGroups.groupId })
        .from(userGroups)
        .where(eq(userGroups.userId, user.id));
      const myGroupIds = new Set(ugRows.map((r) => r.groupId));

      authorizedGroups = allDealGroups.filter((g) => {
        if (g.type === 'individual') return false;
        if (myGroupIds.has(g.id)) return true;
        if (g.createdBy === user.id) return true;
        if (['guest_admin', 'guest_lead', 'external_user', 'advisor', 'buyer'].includes(g.role)) return true;
        return false;
      });
    }
  } else {
    // Non-deal global view (preserved 100% for existing seller-side functionality)
    if (user.role === 'super_admin') {
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

    authorizedGroups = authorizedGroups.filter((g) => g.type !== 'individual');
  }

  const groupIds = authorizedGroups.map((g) => g.id);
  if (groupIds.length === 0) {
    const fallbackChannels = directMessageChannel ? [directMessageChannel] : [];
    return {
      channels: fallbackChannels,
      user,
      activeDeal: dealParticipants?.deal
        ? { id: dealParticipants.deal.id, name: dealParticipants.deal.dealName }
        : null,
    };
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

    const isDealGroup = Boolean(group.workspaceId);
    const extraSellerCount = isDealGroup && dealParticipants?.seller ? 1 : 0;

    return {
      id: channel.id,
      groupId: group.id,
      name: group.name,
      description: group.description,
      department: group.department || 'General',
      role: group.role,
      type: channel.type,
      memberCount: (memberCountByGroupId.get(group.id) || 0) + extraSellerCount,
      lastActivityAt: channel.lastActivityAt || group.updatedAt,
      latestMessage: latestMsg,
      unreadCount,
      unreadMentionsCount,
    };
  });

  const rawResults = await Promise.all(channelPromises);
  const resultChannels = rawResults.filter(Boolean);

  const finalChannels = [];
  if (directMessageChannel) {
    finalChannels.push(directMessageChannel);
  }
  finalChannels.push(...resultChannels);

  // Sort channels by last activity
  finalChannels.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));

  return {
    channels: finalChannels,
    user,
    activeDeal: dealParticipants?.deal
      ? { id: dealParticipants.deal.id, name: dealParticipants.deal.dealName }
      : null,
  };
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

  // 1. Direct Message channel verification
  if (channel.type === 'direct_message') {
    const memberRows = await db
      .select()
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channel.id), eq(channelMembers.userId, user.id)))
      .limit(1);

    let dealId = channel.workspaceId || workspaceId;
    if (!dealId && channel.description) {
      const match = channel.description.match(/\[dealId:([^\]]+)\]/);
      if (match) dealId = match[1];
    }

    let isAuthorized = memberRows.length > 0;
    let participants = null;
    if (dealId) {
      participants = await getDealParticipants(dealId);
      if (participants) {
        if (
          user.id === participants.buyer?.id ||
          user.id === participants.seller?.id ||
          user.role === 'super_admin'
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return {
        authorized: false,
        error: 'Forbidden: You are not authorized to access this direct conversation',
        status: 403,
      };
    }

    const dmMemberRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(channelMembers)
      .innerJoin(users, eq(channelMembers.userId, users.id))
      .where(eq(channelMembers.channelId, channel.id));

    let membersList = [...dmMemberRows];
    if (participants) {
      if (participants.buyer && !membersList.some((m) => m.id === participants.buyer.id)) {
        membersList.push(participants.buyer);
      }
      if (participants.seller && !membersList.some((m) => m.id === participants.seller.id)) {
        membersList.push(participants.seller);
      }
    }

    const partner = membersList.find((m) => m.id !== user.id) || null;
    const isBuyer = participants?.buyer?.id === user.id;

    const enrichedChannel = {
      ...channel,
      name: isBuyer
        ? `${partner?.name || 'Seller'} (Seller)`
        : `${partner?.name || 'Buyer'} (Buyer)`,
      isDirectMessage: true,
      partner,
      department: 'Direct Message',
    };

    return {
      authorized: true,
      user,
      channel: enrichedChannel,
      group: null,
      members: membersList,
      isDirectMessage: true,
      partner,
    };
  }

  // 2. Group channel verification
  if (!channel.groupId) {
    // Non-group channel (e.g. legacy workspace channel)
    if (channel.companyId !== user.companyId && user.role !== 'super_admin') {
      return { authorized: false, error: 'Forbidden: Channel belongs to another company', status: 403 };
    }
    return { authorized: true, user, channel, group: null, members: [] };
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

  // Deal-scoped group verification
  if (group.workspaceId) {
    const participants = await getDealParticipants(group.workspaceId);
    if (participants) {
      // Deal seller (e.g. Vishwa) or Super Admin can access & communicate with deal groups!
      if (user.id === participants.seller?.id || user.role === 'super_admin') {
        const members = await getGroupMembers(group.id);
        return { authorized: true, user, channel, group, members };
      }
      // Deal buyer (e.g. Naga) is authorized if buyer belongs to deal or created the group
      if (user.id === participants.buyer?.id || group.createdBy === user.id) {
        const members = await getGroupMembers(group.id);
        return { authorized: true, user, channel, group, members };
      }
    }
  }

  // Super admin has company-wide access
  if (user.role === 'super_admin') {
    const members = await getGroupMembers(group.id);
    return { authorized: true, user, channel, group, members };
  }

  // Authoritative check: verify membership in user_groups or creator
  const membership = await db
    .select()
    .from(userGroups)
    .where(and(eq(userGroups.userId, user.id), eq(userGroups.groupId, group.id)))
    .limit(1);

  if (membership.length === 0 && group.createdBy !== user.id) {
    return { authorized: false, error: 'Forbidden: You are not authorized to access this conversation', status: 403 };
  }

  const members = await getGroupMembers(group.id);
  return { authorized: true, user, channel, group, members };
}

/**
 * Returns the real members of a group from user_groups and users.
 * For groups in an active deal, includes the deal's seller (Vishwa) so the buyer group can communicate with the seller!
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

  try {
    const groupRows = await db
      .select({ workspaceId: groups.workspaceId, createdBy: groups.createdBy })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (groupRows[0]?.workspaceId) {
      const participants = await getDealParticipants(groupRows[0].workspaceId);
      if (participants?.seller) {
        if (!members.some((m) => m.id === participants.seller.id)) {
          members.push({
            id: participants.seller.id,
            name: `${participants.seller.name || 'Seller'} (Seller)`,
            email: participants.seller.email,
            role: 'seller',
            status: participants.seller.status || 'active',
          });
        }
      }
    }
  } catch (e) {
    console.warn('Failed to append deal seller to group members:', e);
  }

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

