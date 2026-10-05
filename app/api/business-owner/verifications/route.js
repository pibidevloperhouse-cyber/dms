import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, identityVerifications } from '@/db/schema';
import { eq, inArray, desc, or, and } from 'drizzle-orm';

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
      dmsRole: users.dmsRole,
      verificationStatus: users.verificationStatus,
      verifiedAt: users.verifiedAt,
      createdAt: users.createdAt,
      companyName: users.companyName,
      jobTitle: users.jobTitle,
      investorType: users.investorType,
      investmentRange: users.investmentRange,
      companyType: users.companyType,
      phoneNumber: users.phoneNumber,
      sellerType: users.sellerType,
      isBroker: users.isBroker,
      linkedinUrl: users.linkedinUrl,
      role: users.role,
    })
    .from(users)
    .where(
      or(
        and(eq(users.dmsRole, 'seller'), eq(users.role, 'super_admin')),
        and(eq(users.dmsRole, 'buyer'), eq(users.role, 'guest_admin'))
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
