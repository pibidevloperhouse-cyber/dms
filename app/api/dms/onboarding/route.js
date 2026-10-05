import { db } from '../../../../db';
import { users, companyProfiles, dmsProjects, dmsTeasers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { formData, userId } = data; // In production, get userId from auth token (e.g. Supabase session)

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // 1. Update User Profile with new fields
    await db.update(users).set({
      sellerType: formData.sellerType,
      isBroker: formData.isBroker,
      linkedinUrl: formData.linkedinUrl,
      dmsRole: 'seller'
    }).where(eq(users.id, userId));

    // 2. Insert Company Profile
    await db.insert(companyProfiles).values({
      userId: userId,
      companyName: formData.companyName,
      websiteUrl: formData.websiteUrl,
      country: formData.country,
      teamSize: formData.teamSize,
      ttmRevenue: parseFloat(formData.ttmRevenue) || 0,
      ttmProfit: parseFloat(formData.ttmProfit) || 0,
      arr: parseFloat(formData.arr) || 0,
      churnRate: formData.churnRate,
      churnTrend: formData.churnTrend,
      askingPrice: parseFloat(formData.askingPrice) || 0,
      priceJustification: formData.priceJustification,
    });

    // 3. Create a DMS Project (The main container)
    // We need a companyId for the project. For now, assuming the user's companyId is used.
    // Fetching user to get their companyId
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    
    const [project] = await db.insert(dmsProjects).values({
      companyId: user.companyId || userId, // Fallback if no companyId
      name: formData.companyName,
      status: 'active'
    }).returning({ id: dmsProjects.id });

    // 4. Create the Teaser
    await db.insert(dmsTeasers).values({
      projectId: project.id,
      dealName: "Project " + Math.random().toString(36).substring(7).toUpperCase(),
      revenue: formData.ttmRevenue.toString(),
      status: 'draft',
      publicHeadline: "Profitable SaaS in " + formData.country, // Will be replaced by AI later
      publicDesc: formData.reasonForSelling,
    });

    return NextResponse.json({ success: true, projectId: project.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to process onboarding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
