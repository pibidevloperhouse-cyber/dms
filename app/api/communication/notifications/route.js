import { NextResponse } from 'next/server';
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
import { eq, ne, gt, and, inArray, desc, isNull, or } from 'drizzle-orm';
import { getActiveUser } from '@/lib/communication/service';

function formatTimeAgo(dateInput) {
  if (!dateInput) return '';
  const now = new Date();
  const date = new Date(dateInput);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await getActiveUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine authorized groups
    let groupIds = [];
    if (user.role === 'admin' || user.role === 'super_admin') {
      const gConditions = [eq(groups.companyId, user.companyId)];
      if (workspaceId) {
        gConditions.push(or(eq(groups.workspaceId, workspaceId), isNull(groups.workspaceId)));
      }
      const adminGroups = await db
        .select({ id: groups.id })
        .from(groups)
        .where(and(...gConditions));
      groupIds = adminGroups.map((g) => g.id);
    } else {
      const ugRows = await db
        .select({ groupId: userGroups.groupId })
        .from(userGroups)
        .where(eq(userGroups.userId, user.id));
      groupIds = ugRows.map((r) => r.groupId);
    }

    if (groupIds.length === 0) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        unreadMentionsCount: 0,
      });
    }

    // Fetch channels for authorized groups
    const chRows = await db
      .select({
        id: communicationChannels.id,
        groupId: communicationChannels.groupId,
        groupName: groups.name,
        department: groups.department,
      })
      .from(communicationChannels)
      .innerJoin(groups, eq(communicationChannels.groupId, groups.id))
      .where(inArray(communicationChannels.groupId, groupIds));

    if (chRows.length === 0) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unreadCount: 0,
        unreadMentionsCount: 0,
      });
    }

    const channelMap = new Map();
    const channelIds = chRows.map((c) => {
      channelMap.set(c.id, c);
      return c.id;
    });

    // Fetch member read timestamps for current user
    const memberRecs = await db
      .select({
        channelId: channelMembers.channelId,
        lastReadAt: channelMembers.lastReadAt,
      })
      .from(channelMembers)
      .where(and(inArray(channelMembers.channelId, channelIds), eq(channelMembers.userId, user.id)));

    const lastReadMap = new Map();
    memberRecs.forEach((m) => {
      lastReadMap.set(m.channelId, m.lastReadAt);
    });

    // Fetch user mentions to identify mention-type notifications
    const mentions = await db
      .select({
        messageId: messageMentions.messageId,
        isRead: messageMentions.isRead,
      })
      .from(messageMentions)
      .where(eq(messageMentions.userId, user.id));

    const mentionMap = new Map();
    mentions.forEach((m) => {
      mentionMap.set(m.messageId, m.isRead);
    });

    // Fetch recent messages across user's channels (exclude messages sent by user and deleted messages)
    const recentMessages = await db
      .select({
        id: messages.id,
        channelId: messages.channelId,
        senderId: messages.senderId,
        senderName: users.name,
        senderEmail: users.email,
        senderRole: users.role,
        messageText: messages.messageText,
        messageType: messages.messageType,
        metadata: messages.metadata,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        and(
          inArray(messages.channelId, channelIds),
          ne(messages.senderId, user.id),
          isNull(messages.deletedAt)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(40);

    // Filter out messages deleted specifically for this user
    const activeMessages = recentMessages.filter((msg) => {
      const meta = msg.metadata || {};
      const delFor = Array.isArray(meta.deletedFor) ? meta.deletedFor : [];
      return !delFor.includes(user.id);
    });

    let totalUnreadCount = 0;
    let totalMentionsCount = 0;

    const notifications = activeMessages.map((msg) => {
      const ch = channelMap.get(msg.channelId) || {};
      const lastReadAt = lastReadMap.get(msg.channelId);
      const isUnread = !lastReadAt || new Date(msg.createdAt) > new Date(lastReadAt);
      const isMention = mentionMap.has(msg.id);

      if (isUnread) totalUnreadCount += 1;
      if (isMention && mentionMap.get(msg.id) === false) totalMentionsCount += 1;

      const senderName = msg.senderName || msg.senderEmail?.split('@')[0] || 'A group member';
      const channelName = ch.groupName || 'Group Chat';

      return {
        id: msg.id,
        channelId: msg.channelId,
        channelName,
        department: ch.department || 'General',
        senderId: msg.senderId,
        senderName,
        senderEmail: msg.senderEmail,
        senderRole: msg.senderRole,
        messageText: msg.messageText,
        createdAt: msg.createdAt,
        timeAgo: formatTimeAgo(msg.createdAt),
        isUnread,
        isMention,
        type: isMention ? 'mention' : 'message',
        title: isMention
          ? `${senderName} mentioned you`
          : `${senderName} in #${channelName}`,
        description: isMention
          ? `In "${channelName}": ${msg.messageText}`
          : msg.messageText,
      };
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: totalUnreadCount,
      unreadMentionsCount: totalMentionsCount,
    });
  } catch (error) {
    console.error('Failed to fetch communication notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Mark all as read
export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const user = await getActiveUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    const now = new Date();

    // 1. Update lastReadAt for all user channel memberships
    await db
      .update(channelMembers)
      .set({ lastReadAt: now })
      .where(eq(channelMembers.userId, user.id));

    // 2. Mark all mentions as read
    await db
      .update(messageMentions)
      .set({ isRead: true })
      .where(eq(messageMentions.userId, user.id));

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      markedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
