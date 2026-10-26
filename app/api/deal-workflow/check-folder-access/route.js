import { NextResponse } from 'next/server';
import { db } from '@/db';
import { permissions, groups, folders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const groupId = searchParams.get('groupId');
    const groupName = searchParams.get('groupName');

    if (!folderId) {
      return NextResponse.json({ success: false, error: 'folderId is required' }, { status: 400 });
    }

    // 1. Resolve folder
    const folderRows = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);
    const targetFolder = folderRows.length > 0 ? folderRows[0] : null;
    const parentFolderId = targetFolder?.parentFolderId || null;

    // 2. Resolve group
    let resolvedGroup = null;
    if (groupId) {
      const gRows = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      if (gRows.length > 0) resolvedGroup = gRows[0];
    }
    if (!resolvedGroup && groupName) {
      const gRows = await db.select().from(groups);
      resolvedGroup = gRows.find((g) => g.name.toLowerCase() === groupName.toLowerCase()) || null;
    }

    // 3. Check permissions
    let hasAccess = false;
    let permRecord = null;

    if (resolvedGroup) {
      const allPerms = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.groupId, resolvedGroup.id),
            eq(permissions.scope, 'folder')
          )
        );

      // Check target folder permission
      permRecord = allPerms.find((p) => p.folderId === folderId);
      // If checking a subfolder, check parent folder permission
      if (!permRecord && parentFolderId) {
        permRecord = allPerms.find((p) => p.folderId === parentFolderId);
      }

      if (permRecord && (permRecord.canView || permRecord.canUpload)) {
        hasAccess = true;
      }
    }

    const accessUrl = resolvedGroup ? `/documents/access?group=${resolvedGroup.id}` : '/documents/access';

    return NextResponse.json({
      success: true,
      hasAccess,
      folderId,
      folderName: targetFolder?.name || 'Folder',
      groupId: resolvedGroup?.id || groupId || null,
      groupName: resolvedGroup?.name || groupName || 'Assigned Group',
      canView: Boolean(permRecord?.canView),
      canUpload: Boolean(permRecord?.canUpload),
      accessUrl,
      message: hasAccess
        ? `Access verified: "${resolvedGroup?.name || 'Group'}" has access to folder "${targetFolder?.name || 'Folder'}".`
        : `"${resolvedGroup?.name || 'Group'}" does not have access to folder "${targetFolder?.name || 'Folder'}". Please grant access in the Access section.`,
    });
  } catch (error) {
    console.error('Check folder access error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
