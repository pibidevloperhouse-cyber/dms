import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { logAuthActivity } from '@/lib/auth-audit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: email, token, or password.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify token exists in database token store (email_otps)
    const { data: record, error: dbError } = await supabaseAdmin
      .from('email_otps')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp', token)
      .single();

    if (dbError || !record) {
      return NextResponse.json(
        { error: 'This reset link has already been used.\nEach link can only be used once.' },
        { status: 400 }
      );
    }

    // 2. Validate token expiration
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // 3. Fetch user from DB
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        companyId: users.companyId,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = userList[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // 4. Update user's password in PostgreSQL / Supabase
    await db
      .update(users)
      .set({
        passwordHash: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 5. Update user in Supabase Auth if applicable
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: newPassword,
        });
      }
    } catch (authSyncErr) {
      console.warn('Supabase Auth user sync warning:', authSyncErr.message);
    }

    // 6. CONSUME AND DESTROY THE TOKEN IN DATABASE
    // This permanently ensures clicking the button in the same email again is impossible
    await supabaseAdmin
      .from('email_otps')
      .delete()
      .eq('email', cleanEmail);

    // 7. Log audit trail
    await logAuthActivity({
      userId: user.id,
      email: user.email,
      eventType: 'PASSWORD_RESET',
      status: 'SUCCESS',
      failureReason: null,
      companyId: user.companyId || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been changed successfully.',
    });
  } catch (err) {
    console.error('Error in reset-password API:', err);
    return NextResponse.json(
      { error: 'An error occurred while updating your password. Please try again.' },
      { status: 500 }
    );
  }
}
