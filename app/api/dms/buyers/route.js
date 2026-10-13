import { db } from '../../../../db';
import { users, companies } from '../../../../db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buyersList = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      companyName: companies.name,
    })
    .from(users)
    .innerJoin(companies, eq(users.companyId, companies.id))
    .where(or(eq(companies.dmsRole, 'buyer'), ilike(companies.dmsRole, 'buyer')));

    return NextResponse.json({ buyers: buyersList }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch buyers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
