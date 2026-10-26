import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'dms-secure-reset-secret-key-2026';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: 'Reset link is missing token or email parameter.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Parse token
    const parts = token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json(
        { valid: false, error: 'Invalid reset link format.' },
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
        { valid: false, error: 'Corrupted reset link.' },
        { status: 400 }
      );
    }

    // 2. Expiration check
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return NextResponse.json(
        { valid: false, error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 3. Email check
    if (!payload.email || payload.email.toLowerCase() !== cleanEmail) {
      return NextResponse.json(
        { valid: false, error: 'Reset link does not match your account email.' },
        { status: 400 }
      );
    }

    // 4. Fetch user to verify single-use status
    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = userList[0];
    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    // 5. Verify cryptographic HMAC signature
    // If the password was already changed, user.passwordHash is different and the signature will fail
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY + (user.passwordHash || ''))
      .update(payloadB64)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { 
          valid: false, 
          alreadyUsed: true,
          error: 'This reset link has already been used. Each link can only be used once.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('Error verifying reset token:', err);
    return NextResponse.json(
      { valid: false, error: 'Unable to verify reset link.' },
      { status: 500 }
    );
  }
}
