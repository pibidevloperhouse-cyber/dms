import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'User ID and status are required' }, { status: 400 });
    }

    if (!['verified', 'failed', 'unverified'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updateData = {
      verificationStatus: status,
      verifiedAt: status === 'verified' ? new Date() : null,
    };

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, id));

    return NextResponse.json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update verification status' }, { status: 500 });
  }
}
