import { db } from '../../../../../db';
import { dmsDealProposals, dmsTeasers, dmsProjects, users, companies } from '../../../../../db/schema';
import { eq, and, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { projectId, buyerId, message } = data;

    if (!projectId || !buyerId) {
      return NextResponse.json({ error: 'Missing required fields: projectId or buyerId' }, { status: 400 });
    }

    // Find the teaser for this project (check both projectId and teaser id)
    let [teaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.projectId, projectId));
    if (!teaser) {
      [teaser] = await db.select().from(dmsTeasers).where(eq(dmsTeasers.id, projectId));
    }
    if (!teaser) {
      const [project] = await db.select().from(dmsProjects).where(eq(dmsProjects.id, projectId));
      if (project) {
        [teaser] = await db.insert(dmsTeasers).values({
          projectId: project.id,
          businessSummary: project.name,
          status: 'active'
        }).returning();
      }
    }

    if (!teaser) {
      return NextResponse.json({ error: 'Teaser not found for this project' }, { status: 404 });
    }

    // Check if proposal already exists for this buyer and teaser
    const [existingProposal] = await db.select().from(dmsDealProposals)
      .where(and(
        eq(dmsDealProposals.teaserId, teaser.id),
        eq(dmsDealProposals.buyerId, buyerId)
      ));

    if (existingProposal) {
      return NextResponse.json({ success: true, message: 'Access already requested', proposal: existingProposal }, { status: 200 });
    }

    // Insert new proposal
    const [newProposal] = await db.insert(dmsDealProposals).values({
      teaserId: teaser.id,
      buyerId,
      status: 'pending',
      message
    }).returning();

    // Safely update buyer's profile and company details
    try {
      const [buyerUser] = await db.select().from(users).where(eq(users.id, buyerId));
      if (buyerUser) {
        if (data.company) {
          if (buyerUser.companyId) {
            await db.update(companies).set({
              name: data.company,
              updatedAt: new Date()
            }).where(eq(companies.id, buyerUser.companyId));
          } else {
            const [newComp] = await db.insert(companies).values({
              name: data.company,
              email: buyerUser.email || `${buyerId}@example.com`,
              status: 'active',
              dmsRole: 'buyer'
            }).returning();
            if (newComp) {
              await db.update(users).set({
                companyId: newComp.id,
                updatedAt: new Date()
              }).where(eq(users.id, buyerId));
            }
          }
        }

        const updateFields = { updatedAt: new Date() };
        if (data.fullName) updateFields.name = data.fullName;
        if (data.jobTitle) updateFields.jobTitle = data.jobTitle;
        if (data.investmentRange) updateFields.investmentRange = data.investmentRange;

        await db.update(users).set(updateFields).where(eq(users.id, buyerId));
      }
    } catch (profileErr) {
      console.warn('Non-fatal error updating buyer profile:', profileErr);
    }

    return NextResponse.json({ success: true, proposal: newProposal }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deal proposal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return NextResponse.json({ error: 'Missing proposalId' }, { status: 400 });
    }

    await db.delete(dmsDealProposals).where(eq(dmsDealProposals.id, proposalId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete proposal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

