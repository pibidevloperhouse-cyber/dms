import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies, dmsDealInvitations, dmsDeals } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, dealType, participantType, companyType, companyName, inviteToken, projectId } = body;

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

    let finalCompanyId = null;

    if (companyName) {
      // Create a new Company profile for the user
      const [newCompany] = await db.insert(companies).values({
        name: companyName,
        email: email, // use user's email for the company for now
        status: 'active'
      }).returning({ id: companies.id });
      
      finalCompanyId = newCompany.id;
    }

    // Insert user into database
    const [newUser] = await db.insert(users).values({
      name: fullName,
      email,
      passwordHash,
      companyType,
      companyName,
      companyId: finalCompanyId, // Link to the newly created company if seller
      dmsRole: roleToSet.toLowerCase(), // 'buyer' or 'seller'
      role: roleToSet.toLowerCase() === 'seller' ? 'super_admin' : 'guest_admin', // from userRoleEnum
      status: 'active'
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
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
