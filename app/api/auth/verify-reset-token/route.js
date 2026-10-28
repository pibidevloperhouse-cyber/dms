import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // 1. Query database token store (email_otps)
    const { data: record, error: dbError } = await supabaseAdmin
      .from('email_otps')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp', token)
      .single();

    // If no record exists, it means the token was already consumed and deleted, or is invalid
    if (dbError || !record) {
      return NextResponse.json(
        {
          valid: false,
          alreadyUsed: true,
          error: 'This reset link has already been used.\nEach link can only be used once.',
        },
        { status: 400 }
      );
    }

    // 2. Check expiration
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: 'This password reset link has expired. Please request a new one.',
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
