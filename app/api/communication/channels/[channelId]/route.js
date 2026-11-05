import { NextResponse } from 'next/server';
import { verifyChannelAccess, getGroupMembers } from '@/lib/communication/service';

export async function GET(req, { params }) {
  try {
    const { channelId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId') || null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for channel access' },
        { status: 401 }
      );
    }

    const authResult = await verifyChannelAccess(userId, channelId, workspaceId);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 403 }
      );
    }

    const { channel, group } = authResult;
    let members = authResult.members || [];
    if (group && members.length === 0) {
      members = await getGroupMembers(group.id);
    }

    return NextResponse.json({
      success: true,
      channel: {
        ...channel,
        groupId: group?.id || null,
        groupName: group?.name || channel.name,
        department: group?.department || (channel.type === 'direct_message' ? 'Direct Message' : 'General'),
        description: group?.description || channel.description,
        isDirectMessage: Boolean(channel.isDirectMessage || channel.type === 'direct_message'),
        partner: authResult.partner || null,
      },
      group,
      members,
    });
  } catch (error) {
    console.error('Channel Detail API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
