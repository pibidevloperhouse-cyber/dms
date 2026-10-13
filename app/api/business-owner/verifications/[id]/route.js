import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'User ID and status are required' }, { status: 400 });
    }

    if (!['verified', 'failed', 'unverified', 'pending'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    // Update associated company status directly (Option 1 - Company Verification)
    const [user] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, id)).limit(1);
    if (user?.companyId) {
      const companyStatus = status === 'verified' ? 'active' : status === 'failed' ? 'rejected' : 'pending';
      await db.update(companies)
        .set({
          status: companyStatus,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, user.companyId));
    }

    return NextResponse.json({ success: true, message: `Company status updated to ${status}` });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update verification status' }, { status: 500 });
  }
}
