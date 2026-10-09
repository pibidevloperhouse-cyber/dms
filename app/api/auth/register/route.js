import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, dmsDealInvitations, dmsDeals } from '@/db/schema';
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
    const buyerType = formData.get('buyerType'); // investor type for buyers
    
    const proofOfAuthorityFile = formData.get('proofOfAuthority');
    const additionalDocumentFile = formData.get('additionalDocument');

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine role (Buyer or Seller) based on participantType
    // If dealType is M&A, participantType decides. Otherwise, default to Buyer.
    const roleToSet = participantType || 'Buyer';

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`;

    // Handle File Uploads
    let proofOfAuthorityUrl = null;
    let additionalDocumentUrl = null;

    const safeCompanyName = companyName ? `${companyName.replace(/[^a-zA-Z0-9]/g, '-')}-` : '';

    if (proofOfAuthorityFile && typeof proofOfAuthorityFile.name === 'string') {
      const bytes = await proofOfAuthorityFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${safeCompanyName}${Date.now()}-poa-${proofOfAuthorityFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
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
      const fileName = `${safeCompanyName}${Date.now()}-doc-${additionalDocumentFile.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`;
      
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

    let finalCompanyId = null;

    if (companyName) {
      // Check if company already exists
      const existingCompany = await db.select().from(companies).where(eq(companies.email, email)).limit(1);
      
      if (existingCompany.length > 0) {
        finalCompanyId = existingCompany[0].id;
      } else {
        // Create a new Company profile for the user
        const [newCompany] = await db.insert(companies).values({
          name: companyName,
          email: email, // use user's email for the company for now
          status: 'active',
          phoneNumber,
          companyType,
          websiteUrl,
          linkedinUrl,
          operationType: dealType || null,
          country,
          stateRegion,
          city,
          dmsRole: roleToSet.toLowerCase(),
          subRole: sellerRole || null,
          proofOfAuthorityUrl,
          licenseNumber,
          additionalDocumentUrl,
        }).returning({ id: companies.id });
        
        finalCompanyId = newCompany.id;
      }
    }

    // Insert user into database
    const [newUser] = await db.insert(users).values({
      name: fullName,
      email,
      passwordHash,
      phoneNumber,
      companyId: finalCompanyId, // Link to the company
      role: roleToSet.toLowerCase() === 'seller' ? 'super_admin' : 'guest_admin',
      status: 'active',
    }).returning({ id: users.id });

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
