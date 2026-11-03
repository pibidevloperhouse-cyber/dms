import { NextResponse } from 'next/server';
import { db } from '@/db';
import { folders, permissions, documents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getDealWorkflowFolders(companyId, workspaceId) {
  try {
    // 1. Fetch all active non-deleted folders ordered by index number and creation date
    const allFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.isDeleted, false))
      .orderBy(folders.indexNumber, desc(folders.createdAt));

    // 2. Fetch all folder permissions for real-time access checks
    const folderPerms = await db
      .select({
        id: permissions.id,
        groupId: permissions.groupId,
        folderId: permissions.folderId,
        canView: permissions.canView,
        canUpload: permissions.canUpload,
      })
      .from(permissions)
      .where(eq(permissions.scope, 'folder'));

    // 3. Fetch all active non-deleted documents for live document counts
    let allDocs = [];
    try {
      allDocs = await db
        .select({
          id: documents.id,
          folderId: documents.folderId,
          name: documents.name,
          workspaceId: documents.workspaceId,
          companyId: documents.companyId,
        })
        .from(documents)
        .where(eq(documents.isDeleted, false));
    } catch (docErr) {
      console.warn('Could not query documents for live folder counts:', docErr?.message);
    }

    if (!allFolders || allFolders.length === 0) {
      return {
        folders: [],
        allFolders: [],
        totalDocsCount: allDocs.length,
        rootDocsCount: allDocs.filter((d) => !d.folderId).length,
        permissions: folderPerms || [],
      };
    }

    // 4. Filter smartly by workspaceId or companyId if available
    let filtered = allFolders;
    if (workspaceId) {
      const wsMatch = allFolders.filter((f) => f.workspaceId === workspaceId);
      if (wsMatch.length > 0) {
        filtered = wsMatch;
      }
    } else if (companyId) {
      const compMatch = allFolders.filter((f) => f.companyId === companyId);
      if (compMatch.length > 0) {
        filtered = compMatch;
      }
    }

    // 5. Separate top-level folders (main folders) and subfolders
    const topLevelFolders = filtered.filter((f) => !f.parentFolderId);
    const subfoldersList = filtered.filter((f) => Boolean(f.parentFolderId));

    // 6. Map top-level folders with their child subfolders and live document counts
    const structuredFolders = topLevelFolders.map((parent) => {
      const children = subfoldersList
        .filter((sub) => sub.parentFolderId === parent.id)
        .map((sub) => {
          const directCount = allDocs.filter((d) => d.folderId === sub.id).length;
          return {
            id: sub.id,
            name: sub.name,
            parentFolderId: sub.parentFolderId,
            indexNumber: sub.indexNumber,
            workspaceId: sub.workspaceId,
            companyId: sub.companyId,
            docCount: directCount,
          };
        });

      const directParentDocs = allDocs.filter((d) => d.folderId === parent.id).length;
      const subDocsCount = children.reduce((sum, c) => sum + (c.docCount || 0), 0);
      const totalFolderDocs = directParentDocs + subDocsCount;

      return {
        id: parent.id,
        name: parent.name,
        indexNumber: parent.indexNumber,
        workspaceId: parent.workspaceId,
        companyId: parent.companyId,
        docCount: totalFolderDocs,
        directDocCount: directParentDocs,
        subfolders: children,
      };
    });

    const allFoldersWithCounts = filtered.map((f) => {
      const count = allDocs.filter((d) => d.folderId === f.id).length;
      return {
        ...f,
        docCount: count,
      };
    });

    const rootDocsCount = allDocs.filter((d) => !d.folderId).length;

    return {
      folders: structuredFolders,
      allFolders: allFoldersWithCounts,
      totalDocsCount: allDocs.length,
      rootDocsCount,
      permissions: folderPerms || [],
    };
  } catch (err) {
    console.error('Error querying folders:', err);
    throw err;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const workspaceId = searchParams.get('workspaceId');

    const result = await getDealWorkflowFolders(companyId, workspaceId);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Deal workflow folders GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const companyId = body.companyId || body.session?.company_id || null;
    const workspaceId = body.workspaceId || body.session?.active_workspace_id || body.session?.workspace_id || null;

    const result = await getDealWorkflowFolders(companyId, workspaceId);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Deal workflow folders POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
