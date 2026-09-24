import { db } from '../../../../../db';
import { dmsDeals } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { dealId, featureQa, featureBidding, featureTasks, featureGroups, featureCommunication, guestCanCreateGroups, guestCanInviteMembers, guestCanUploadDocs, guestCanDownloadDocs, guestCanCreateFolders } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId' }, { status: 400 });
    }

    const updateData = {};
    if (featureQa !== undefined) updateData.featureQa = featureQa;
    if (featureBidding !== undefined) updateData.featureBidding = featureBidding;
    if (featureTasks !== undefined) updateData.featureTasks = featureTasks;
    if (featureGroups !== undefined) updateData.featureGroups = featureGroups;
    if (featureCommunication !== undefined) updateData.featureCommunication = featureCommunication;
    if (guestCanCreateGroups !== undefined) updateData.guestCanCreateGroups = guestCanCreateGroups;
    if (guestCanInviteMembers !== undefined) updateData.guestCanInviteMembers = guestCanInviteMembers;
    if (guestCanUploadDocs !== undefined) updateData.guestCanUploadDocs = guestCanUploadDocs;
    if (guestCanDownloadDocs !== undefined) updateData.guestCanDownloadDocs = guestCanDownloadDocs;
    if (guestCanCreateFolders !== undefined) updateData.guestCanCreateFolders = guestCanCreateFolders;
    updateData.updatedAt = new Date();

    const [updatedDeal] = await db.update(dmsDeals)
      .set(updateData)
      .where(eq(dmsDeals.id, dealId))
      .returning();

    if (!updatedDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deal: updatedDeal }, { status: 200 });
  } catch (error) {
    console.error('Failed to update deal features:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
