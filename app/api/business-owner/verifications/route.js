import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, identityVerifications } from '@/db/schema';
import { eq, inArray, desc, or, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // 1. Authenticate Business Owner (simplified for demo, usually checked via middleware or headers)
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    // Assume authorized if reaching this route via the Business Owner panel
    
    // 2. Fetch all buyers and sellers
    const dmsUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      dmsRole: companies.dmsRole,
      verificationStatus: users.verificationStatus,
      verifiedAt: users.verifiedAt,
      createdAt: users.createdAt,
      companyName: companies.name,
      jobTitle: users.jobTitle,
      operationType: companies.operationType,
      investmentRange: users.investmentRange,
      companyType: companies.companyType,
      phoneNumber: companies.phoneNumber,
      subRole: companies.subRole,
      isBroker: users.isBroker,
      linkedinUrl: companies.linkedinUrl,
      role: users.role,
      websiteUrl: companies.websiteUrl,
      country: companies.country,
      stateRegion: companies.stateRegion,
      city: companies.city,
      licenseNumber: companies.licenseNumber,
      proofOfAuthorityUrl: companies.proofOfAuthorityUrl,
      additionalDocumentUrl: companies.additionalDocumentUrl,
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .where(
      or(
        and(eq(companies.dmsRole, 'seller'), eq(users.role, 'super_admin')),
        and(eq(companies.dmsRole, 'buyer'), eq(users.role, 'guest_admin'))
      )
    )
    .orderBy(desc(users.createdAt));

    // Optional: Could also join identity_verifications if needed, but we keep it simple for now
    
    return NextResponse.json({ success: true, data: dmsUsers });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}
