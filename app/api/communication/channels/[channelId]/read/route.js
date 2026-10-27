import { NextResponse } from 'next/server';
import { markChannelAsRead } from '@/lib/communication/service';

export async function POST(req, { params }) {
  try {
    const { channelId } = await params;
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);

    const userId = body.userId || searchParams.get('userId');

    if (!userId || !channelId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Channel ID are required' },
        { status: 400 }
      );
    }

    const result = await markChannelAsRead(userId, channelId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to mark channel as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lastReadAt: result.lastReadAt });
  } catch (error) {
    console.error('Mark Read API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
