import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, sellerProfiles, buyerProfiles, identityVerifications } from '@/db/schema';
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
      phoneNumber: users.phoneNumber,
      role: users.role,
      verificationStatus: users.verificationStatus,
      verifiedAt: users.verifiedAt,
      createdAt: users.createdAt,
      
      // Company details
      dmsRole: companies.dmsRole,
      companyName: companies.name,
      operationType: companies.operationType,
      companyType: companies.companyType,
      websiteUrl: companies.websiteUrl,
      linkedinUrl: companies.linkedinUrl,
      country: companies.country,
      stateRegion: companies.stateRegion,
      city: companies.city,
      
      // Seller Profile details (fallback to companies if legacy)
      sellerRole: sellerProfiles.sellerRole,
      subRole: companies.subRole,
      licenseNumber: sellerProfiles.licenseNumber,
      proofOfAuthorityUrl: sellerProfiles.proofOfAuthorityUrl,
      additionalDocumentUrl: sellerProfiles.additionalDocumentUrl,

      // Legacy fallbacks for existing seller records
      companyLicenseNumber: companies.licenseNumber,
      companyProofOfAuthorityUrl: companies.proofOfAuthorityUrl,
      companyAdditionalDocumentUrl: companies.additionalDocumentUrl,

      // Buyer Profile details
      buyerRole: buyerProfiles.buyerRole,
      secId: buyerProfiles.secId,
      aumStatementUrl: buyerProfiles.aumStatementUrl,
      secRegistrationUrl: buyerProfiles.secRegistrationUrl,
      companyDescription: buyerProfiles.companyDescription,
      foundedYear: buyerProfiles.foundedYear,
      headquarters: buyerProfiles.headquarters,
      capitalValue: buyerProfiles.capitalValue,
      teamSize: buyerProfiles.teamSize,
      keyPartners: buyerProfiles.keyPartners,
      fundingSource: buyerProfiles.fundingSource,
      targetIndustries: buyerProfiles.targetIndustries,
      revenueRange: buyerProfiles.revenueRange,
      ebitdaRange: buyerProfiles.ebitdaRange,
      equityRange: buyerProfiles.equityRange,
      geography: buyerProfiles.geography,
      ownershipStakeSought: buyerProfiles.ownershipStakeSought,
      businessTraitsWanted: buyerProfiles.businessTraitsWanted,
      managementPreference: buyerProfiles.managementPreference,
      financingMethods: buyerProfiles.financingMethods,
      timelineToCloseDays: buyerProfiles.timelineToCloseDays,
      dealBreakers: buyerProfiles.dealBreakers,
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .leftJoin(sellerProfiles, eq(users.id, sellerProfiles.userId))
    .leftJoin(buyerProfiles, eq(users.id, buyerProfiles.userId))
    .where(
      or(
        and(eq(companies.dmsRole, 'seller'), eq(users.role, 'super_admin')),
        and(eq(companies.dmsRole, 'buyer'), eq(users.role, 'guest_admin'))
      )
    )
    .orderBy(desc(users.createdAt));

    // Consolidate legacy seller fields if profile table was empty
    const sanitizedUsers = dmsUsers.map(u => ({
      ...u,
      licenseNumber: u.licenseNumber || u.companyLicenseNumber,
      proofOfAuthorityUrl: u.proofOfAuthorityUrl || u.companyProofOfAuthorityUrl,
      additionalDocumentUrl: u.additionalDocumentUrl || u.companyAdditionalDocumentUrl,
    }));

    return NextResponse.json({ success: true, data: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}
