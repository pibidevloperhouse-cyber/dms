import { NextResponse } from 'next/server';
import { getAuthorizedGroupChannels, verifyChannelAccess, getGroupMembers } from '@/lib/communication/service';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId') || null;
    const channelId = searchParams.get('channelId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for authorized channels' },
        { status: 401 }
      );
    }

    // Single channel details request
    if (channelId) {
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
    }

    // List authorized channels for user
    const result = await getAuthorizedGroupChannels(userId, workspaceId);
    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      channels: result.channels,
      activeDeal: result.activeDeal || null,
    });
  } catch (error) {
    console.error('Fetch Channels API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
