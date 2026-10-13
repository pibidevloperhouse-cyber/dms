import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, sellerProfiles, buyerProfiles, dmsDealInvitations, dmsDeals } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role required for backend storage
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const password = formData.get('password');
    const dealType = formData.get('dealType');
    const participantType = formData.get('participantType');
    const companyType = formData.get('companyType');
    const companyName = formData.get('companyName');
    const inviteToken = formData.get('inviteToken');
    const projectId = formData.get('projectId');
    
    // Extracted additional fields
    const phoneNumber = formData.get('phoneNumber');
    const linkedinUrl = formData.get('linkedinUrl');
    const licenseNumber = formData.get('licenseNumber');
    const websiteUrl = formData.get('websiteUrl');
    const country = formData.get('country');
    const stateRegion = formData.get('stateRegion');
    const city = formData.get('city');
    const sellerRole = formData.get('sellerRole'); // 'owner', 'advisor', 'broker'
    const buyerType = formData.get('buyerType'); // investor type / registering as
    const buyerSubRole = formData.get('buyerSubRole');
    
    // Seller Documents
    const proofOfAuthorityFile = formData.get('proofOfAuthority');
    const additionalDocumentFile = formData.get('additionalDocument');

    // Buyer Regulatory Documents & Profile Fields
    const secIdNumber = formData.get('secIdNumber');
    const aumDocumentFile = formData.get('aumDocument');
    const secRegistrationDocumentFile = formData.get('secRegistrationDocument');
    const companyDescription = formData.get('companyDescription');
    const foundedYear = formData.get('foundedYear');
    const headquarters = formData.get('headquarters');
    const companyCapitalValue = formData.get('companyCapitalValue');
    const teamSize = formData.get('teamSize');
    const keyPartners = formData.get('keyPartners');
    const fundingSource = formData.get('fundingSource');
    const targetIndustries = formData.get('targetIndustries');
    const revenueRange = formData.get('revenueRange');
    const ebitdaRange = formData.get('ebitdaRange');
    const equityRange = formData.get('equityRange');
    const geography = formData.get('geography');
    const ownershipStake = formData.get('ownershipStake');
    const businessTraits = formData.get('businessTraits');
    const managementPreference = formData.get('managementPreference');
    const financingMethods = formData.get('financingMethods');
    const timelineToClose = formData.get('timelineToClose');
    const dealBreakers = formData.get('dealBreakers');

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine role (Buyer or Seller) based on participantType
    const roleToSet = participantType || 'Buyer';

    // Store plain password as requested
    const passwordHash = password;

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`;

    // Handle File Uploads
    let proofOfAuthorityUrl = null;
    let additionalDocumentUrl = null;
    let aumDocumentUrl = null;
    let secRegistrationUrl = null;

    const safeCompanyName = (companyName || fullName).replace(/[^a-zA-Z0-9]/g, '-');

    if (proofOfAuthorityFile && typeof proofOfAuthorityFile.name === 'string') {
      const bytes = await proofOfAuthorityFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeCompanyName}-${Date.now()}-poa-${proofOfAuthorityFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, buffer, { contentType: proofOfAuthorityFile.type || 'application/octet-stream', upsert: false });
        
      if (!uploadError) {
        const { data } = supabase.storage.from('verification-documents').getPublicUrl(fileName);
        proofOfAuthorityUrl = data.publicUrl;
      } else {
        console.error("Supabase storage error (poa):", uploadError);
      }
    }

    if (additionalDocumentFile && typeof additionalDocumentFile.name === 'string') {
      const bytes = await additionalDocumentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeCompanyName}-${Date.now()}-doc-${additionalDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, buffer, { contentType: additionalDocumentFile.type || 'application/octet-stream', upsert: false });
        
      if (!uploadError) {
        const { data } = supabase.storage.from('verification-documents').getPublicUrl(fileName);
        additionalDocumentUrl = data.publicUrl;
      } else {
        console.error("Supabase storage error (additional doc):", uploadError);
      }
    }

    if (aumDocumentFile && typeof aumDocumentFile.name === 'string') {
      const bytes = await aumDocumentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeCompanyName}-${Date.now()}-aum-${aumDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, buffer, { contentType: aumDocumentFile.type || 'application/octet-stream', upsert: false });
        
      if (!uploadError) {
        const { data } = supabase.storage.from('verification-documents').getPublicUrl(fileName);
        aumDocumentUrl = data.publicUrl;
      } else {
        console.error("Supabase storage error (aum):", uploadError);
      }
    }

    if (secRegistrationDocumentFile && typeof secRegistrationDocumentFile.name === 'string') {
      const bytes = await secRegistrationDocumentFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeCompanyName}-${Date.now()}-sec-${secRegistrationDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, buffer, { contentType: secRegistrationDocumentFile.type || 'application/octet-stream', upsert: false });
        
      if (!uploadError) {
        const { data } = supabase.storage.from('verification-documents').getPublicUrl(fileName);
        secRegistrationUrl = data.publicUrl;
      } else {
        console.error("Supabase storage error (sec):", uploadError);
      }
    }

    let finalCompanyId = null;
    const effectiveCompanyName = companyName || (buyerType === 'individual' ? `${fullName} (Individual)` : `${fullName}'s Firm`);

    if (effectiveCompanyName) {
      // Check if company already exists
      const existingCompany = await db.select().from(companies).where(eq(companies.email, email)).limit(1);
      
      if (existingCompany.length > 0) {
        finalCompanyId = existingCompany[0].id;
      } else {
        // Create a new Company profile for the user (pending platform verification)
        const [newCompany] = await db.insert(companies).values({
          name: effectiveCompanyName,
          email: email, // use user's email for the company for now
          status: 'pending',
          phoneNumber,
          companyType,
          websiteUrl,
          linkedinUrl,
          operationType: dealType || null,
          country,
          stateRegion,
          city,
          dmsRole: roleToSet.toLowerCase(),
          subRole: sellerRole || buyerSubRole || null,
        }).returning({ id: companies.id });
        
        finalCompanyId = newCompany.id;
      }
    }

    // Insert user into database (role acts as VDR Role)
    const [newUser] = await db.insert(users).values({
      name: fullName,
      email,
      passwordHash,
      phoneNumber,
      companyId: finalCompanyId, // Link to the company
      role: roleToSet.toLowerCase() === 'seller' ? 'super_admin' : 'guest_admin',
      status: 'active',
    }).returning({ id: users.id });

    // Safe JSON parser helper
    const safeParseJson = (val, fallback = []) => {
      if (!val) return fallback;
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        return fallback;
      }
    };

    // Insert into respective Profile table
    if (finalCompanyId) {
      if (roleToSet.toLowerCase() === 'seller') {
        await db.insert(sellerProfiles).values({
          userId: newUser.id,
          companyId: finalCompanyId,
          sellerRole: sellerRole || null,
          licenseNumber: licenseNumber || null,
          proofOfAuthorityUrl: proofOfAuthorityUrl || null,
          additionalDocumentUrl: additionalDocumentUrl || null,
        });
      } else if (roleToSet.toLowerCase() === 'buyer') {
        await db.insert(buyerProfiles).values({
          userId: newUser.id,
          companyId: finalCompanyId,
          buyerRole: buyerSubRole || buyerType || null,
          secId: secIdNumber || null,
          aumStatementUrl: aumDocumentUrl,
          secRegistrationUrl: secRegistrationUrl,
          companyDescription: companyDescription || null,
          foundedYear: foundedYear || null,
          headquarters: headquarters || null,
          capitalValue: companyCapitalValue || null,
          teamSize: teamSize || null,
          keyPartners: safeParseJson(keyPartners, []),
          fundingSource: fundingSource || null,
          targetIndustries: safeParseJson(targetIndustries, []),
          revenueRange: revenueRange || null,
          ebitdaRange: ebitdaRange || null,
          equityRange: equityRange || null,
          geography: geography || null,
          ownershipStakeSought: safeParseJson(ownershipStake, []),
          businessTraitsWanted: businessTraits || null,
          managementPreference: safeParseJson(managementPreference, []),
          financingMethods: safeParseJson(financingMethods, []),
          timelineToCloseDays: timelineToClose ? parseInt(timelineToClose, 10) : null,
          dealBreakers: dealBreakers || null,
        });
      }
    }

    // Handle Invite Token Auto-Approval
    if (inviteToken && projectId) {
      // Find the pending invite
      const [invite] = await db.select().from(dmsDealInvitations).where(
        and(eq(dmsDealInvitations.token, inviteToken), eq(dmsDealInvitations.projectId, projectId))
      );

      if (invite && invite.status === 'pending') {
        // Check if deal already exists just in case
        const [existingDeal] = await db.select().from(dmsDeals).where(
          and(eq(dmsDeals.projectId, projectId), eq(dmsDeals.buyerId, newUser.id))
        );

        if (!existingDeal) {
          // Create the Deal link instantly
          await db.insert(dmsDeals).values({
            projectId: invite.projectId,
            buyerId: newUser.id,
            ndaStatus: 'pending',
            status: 'active'
          });
        }

        // Mark invite as used
        await db.update(dmsDealInvitations).set({ status: 'used' }).where(eq(dmsDealInvitations.id, invite.id));
      }
    }

    return NextResponse.json({ success: true, message: 'User registered successfully', userId: newUser.id, companyId: finalCompanyId, role: roleToSet.toLowerCase() });
  } catch (error) {
    console.error('Registration Error:', error);
    // Handle unique email constraint error specifically
    const errorCode = error.code || (error.cause && error.cause.code);
    if (errorCode === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
