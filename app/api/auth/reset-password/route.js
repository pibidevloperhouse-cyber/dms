import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logAuthActivity } from '@/lib/auth-audit';

const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'dms-secure-reset-secret-key-2026';

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

    // 1. Parse token
    const parts = token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid password reset token format.' },
        { status: 400 }
      );
    }

    const [payloadB64, signature] = parts;
    let payload;
    try {
      const decodedJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      payload = JSON.parse(decodedJson);
    } catch {
      return NextResponse.json(
        { error: 'Malformed password reset token.' },
        { status: 400 }
      );
    }

    // 2. Validate token expiration
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new link.' },
        { status: 400 }
      );
    }

    // 3. Validate token email match
    if (!payload.email || payload.email.toLowerCase() !== cleanEmail) {
      return NextResponse.json(
        { error: 'Reset token does not match the provided email address.' },
        { status: 400 }
      );
    }

    // 4. Fetch user from DB
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
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

    // 5. Verify cryptographic HMAC signature
    // The signature incorporates the user's previous passwordHash.
    // If the password was already changed, the expected signature will differ, automatically invalidating reuse!
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY + (user.passwordHash || ''))
      .update(payloadB64)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    // 6. Update user's password in PostgreSQL / Supabase
    await db
      .update(users)
      .set({
        passwordHash: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 7. Update user in Supabase Auth if user exists in auth.users
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: newPassword,
        });
      }
    } catch (authSyncErr) {
      console.warn('Supabase Auth user sync skipped/warning:', authSyncErr.message);
    }

    // 8. Log audit trail
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
