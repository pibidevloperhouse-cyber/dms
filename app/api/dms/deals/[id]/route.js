import { db } from '../../../../../db';
import { dmsDeals } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const dealId = resolvedParams.id;
    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId' }, { status: 400 });
    }

    const [deal] = await db.select({
      id: dmsDeals.id,
      featureQa: dmsDeals.featureQa,
      featureBidding: dmsDeals.featureBidding,
      featureTasks: dmsDeals.featureTasks,
      featureGroups: dmsDeals.featureGroups,
      featureCommunication: dmsDeals.featureCommunication,
      guestCanCreateGroups: dmsDeals.guestCanCreateGroups,
      guestCanInviteMembers: dmsDeals.guestCanInviteMembers,
      guestCanUploadDocs: dmsDeals.guestCanUploadDocs,
      guestCanDownloadDocs: dmsDeals.guestCanDownloadDocs,
      guestCanCreateFolders: dmsDeals.guestCanCreateFolders,
    })
    .from(dmsDeals)
    .where(eq(dmsDeals.id, dealId));

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({ deal }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch deal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
