import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, loginHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Fetch user using Drizzle (supports both RDS & Supabase based on DB URL)
    const userList = await db.select({
      id: users.id,
      company_id: users.companyId,
      name: users.name,
      email: users.email,
      password_hash: users.passwordHash,
      role: users.role,
      dmsRole: users.dmsRole,
      status: users.status,
      nda_status: users.ndaStatus,
      request_status: users.requestStatus
    }).from(users).where(eq(users.email, email)).limit(1);

    const user = userList[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let isMatch = false;
    if (user.password_hash && user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = (password === user.password_hash);
    }
    
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'This account has been suspended. Please contact your VDR Administrator.' }, { status: 403 });
    }

    // Insert into login_history
    try {
      await db.insert(loginHistory).values({
        userId: user.id,
        companyId: user.company_id,
        action: 'LOGIN'
      });
    } catch (historyError) {
      console.error('Failed to insert login history:', historyError);
    }

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
