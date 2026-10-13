import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, buyerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userRecord = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyId: users.companyId,
      verificationStatus: users.verificationStatus,
      phoneNumber: users.phoneNumber,
      companyType: companies.companyType,
      companyName: companies.name,
      investmentRange: users.investmentRange,
      companyDescription: buyerProfiles.companyDescription,
      foundedYear: buyerProfiles.foundedYear,
      headquarters: buyerProfiles.headquarters,
      teamSize: buyerProfiles.teamSize,
      dealBreakers: buyerProfiles.dealBreakers,
      timelineToCloseDays: buyerProfiles.timelineToCloseDays,
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .leftJoin(buyerProfiles, eq(users.id, buyerProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userRecord[0];

    // Fallback: If buyer profile details were not linked by userId, try companyId
    if ((!userData.companyDescription && !userData.headquarters && !userData.dealBreakers) && userData.companyId) {
      const [bpByCompany] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.companyId, userData.companyId)).limit(1);
      if (bpByCompany) {
        userData.companyDescription = userData.companyDescription || bpByCompany.companyDescription;
        userData.foundedYear = userData.foundedYear || bpByCompany.foundedYear;
        userData.headquarters = userData.headquarters || bpByCompany.headquarters;
        userData.teamSize = userData.teamSize || bpByCompany.teamSize;
        userData.dealBreakers = userData.dealBreakers || bpByCompany.dealBreakers;
        userData.timelineToCloseDays = userData.timelineToCloseDays ?? bpByCompany.timelineToCloseDays;
      }
    }

    return NextResponse.json({ data: userData }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
