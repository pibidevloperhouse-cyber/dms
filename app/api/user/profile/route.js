import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, buyerProfiles } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const companyId = searchParams.get('companyId');

    if (!userId && !email && !companyId) {
      return NextResponse.json({ error: 'User identifier is required' }, { status: 400 });
    }

    // 1. Find user by userId, email, or companyId
    let userRecord = [];
    if (userId) {
      try {
        userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      } catch (err) {
        console.warn('Query users by userId failed:', err.message);
      }
    }
    if (userRecord.length === 0 && email) {
      userRecord = await db.select().from(users).where(eq(users.email, email)).limit(1);
    }
    if (userRecord.length === 0 && companyId) {
      try {
        userRecord = await db.select().from(users).where(eq(users.companyId, companyId)).limit(1);
      } catch (err) {
        console.warn('Query users by companyId failed:', err.message);
      }
    }

    const user = userRecord[0] || null;

    // 2. Find company details
    let company = null;
    const effectiveCompanyId = user?.companyId || companyId;
    if (effectiveCompanyId) {
      try {
        const [comp] = await db.select().from(companies).where(eq(companies.id, effectiveCompanyId)).limit(1);
        company = comp;
      } catch (e) {}
    }
    if (!company && (user?.email || email)) {
      const [comp] = await db.select().from(companies).where(eq(companies.email, user?.email || email)).limit(1);
      company = comp;
    }

    // 3. Find buyer profile from buyer_profiles table
    let bp = null;
    // Try by user id
    if (user?.id) {
      const [bpByUser] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, user.id)).limit(1);
      if (bpByUser) bp = bpByUser;
    }
    // Try by company id
    if (!bp && (company?.id || effectiveCompanyId)) {
      const targetCompId = company?.id || effectiveCompanyId;
      try {
        const [bpByComp] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.companyId, targetCompId)).limit(1);
        if (bpByComp) bp = bpByComp;
      } catch (e) {}
    }
    // Try direct userId parameter match
    if (!bp && userId) {
      try {
        const [bpRaw] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);
        if (bpRaw) bp = bpRaw;
      } catch (e) {}
    }

    const userData = {
      id: user?.id || userId,
      name: user?.name || '',
      email: user?.email || email || '',
      role: user?.role || 'guest_admin',
      companyId: company?.id || user?.companyId || null,
      verificationStatus: user?.verificationStatus || 'unverified',
      phoneNumber: user?.phoneNumber || '',
      companyType: company?.companyType || user?.companyType || '',
      companyName: company?.name || '',
      investmentRange: user?.investmentRange || '$5M - $20M',
      companyDescription: bp?.companyDescription || '',
      foundedYear: bp?.foundedYear || '',
      foundedDate: bp?.foundedYear || '',
      headquarters: bp?.headquarters || '',
      teamSize: bp?.teamSize || '',
      dealBreakers: bp?.dealBreakers || '',
      timelineToCloseDays: bp?.timelineToCloseDays ?? null,
    };

    return NextResponse.json({ data: userData }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
