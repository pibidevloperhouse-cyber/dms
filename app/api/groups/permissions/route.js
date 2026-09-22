import { NextResponse } from 'next/server';
import { db } from '@/db';
import { permissions } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

const mapToCamel = (obj) => {
    return {
        id: obj.id,
        companyId: obj.company_id,
        groupId: obj.group_id,
        userId: obj.user_id,
        documentId: obj.document_id,
        folderId: obj.folder_id,
        scope: obj.scope,
        canView: obj.can_view,
        canEdit: obj.can_edit,
        canDelete: obj.can_delete,
        canAddMembers: obj.can_add_members,
        canRemoveMembers: obj.can_remove_members,
        canCreateGroup: obj.can_create_group,
        canDeleteGroup: obj.can_delete_group,
        canUpload: obj.can_upload,
        canDownloadSecure: obj.can_download_secure,
        canDownloadOriginal: obj.can_download_original,
        canAccessGroups: obj.can_access_groups,
        canAccessSettings: obj.can_access_settings,
        canCreateFolder: obj.can_create_folder,
        canMergeFolder: obj.can_merge_folder,
        canDeleteFolder: obj.can_delete_folder,
        canAccessBranding: obj.can_access_branding,
        canAccessWatermarks: obj.can_access_watermarks,
        canAccessDocuments: obj.can_access_documents,
        canAccessEditPermissions: obj.can_access_edit_permissions,
        canRedaction: obj.can_redaction,
        canRedact: obj.can_redact,
        canAccessQa: obj.can_access_qa,
        canAskQa: obj.can_ask_qa,
        canAnswerQa: obj.can_answer_qa,
        canAccessNda: obj.can_access_nda,
        canAccessDeals: obj.can_access_deals,
        canAccessTasks: obj.can_access_tasks,
        canAccessCommunication: obj.can_access_communication,
        canAccessControlAudits: obj.can_access_control_audits
    };
};

const mapToSnake = (obj) => {
    return {
        id: obj.id,
        company_id: obj.companyId,
        group_id: obj.groupId,
        user_id: obj.userId,
        document_id: obj.documentId,
        folder_id: obj.folderId,
        scope: obj.scope,
        can_view: obj.canView,
        can_edit: obj.canEdit,
        can_delete: obj.canDelete,
        can_add_members: obj.canAddMembers,
        can_remove_members: obj.canRemoveMembers,
        can_create_group: obj.canCreateGroup,
        can_delete_group: obj.canDeleteGroup,
        can_upload: obj.canUpload,
        can_download_secure: obj.canDownloadSecure,
        can_download_original: obj.canDownloadOriginal,
        can_access_groups: obj.canAccessGroups,
        can_access_settings: obj.canAccessSettings,
        can_create_folder: obj.canCreateFolder,
        can_merge_folder: obj.canMergeFolder,
        can_delete_folder: obj.canDeleteFolder,
        can_access_branding: obj.canAccessBranding,
        can_access_watermarks: obj.canAccessWatermarks,
        can_access_documents: obj.canAccessDocuments,
        can_access_edit_permissions: obj.canAccessEditPermissions,
        can_redaction: obj.canRedaction,
        can_redact: obj.canRedact,
        can_access_qa: obj.canAccessQa,
        can_ask_qa: obj.canAskQa,
        can_answer_qa: obj.canAnswerQa,
        can_access_nda: obj.canAccessNda,
        can_access_deals: obj.canAccessDeals,
        can_access_tasks: obj.canAccessTasks,
        can_access_communication: obj.canAccessCommunication,
        can_access_control_audits: obj.canAccessControlAudits
    };
};

export async function POST(req) {
    try {
        const { action, session, groupId, userId, permissionsPayload } = await req.json();
        
        if (!session || !session.company_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ─── ACTION: FETCH PERMISSIONS ───
        if (action === 'fetch') {
            const condition = userId
                ? eq(permissions.userId, userId)
                : eq(permissions.groupId, groupId);

            const fetchedPermissions = await db.select()
                .from(permissions)
                .where(
                    and(
                        condition,
                        eq(permissions.companyId, session.company_id)
                    )
                );

            const rawPermissions = fetchedPermissions.map(mapToSnake);
            return NextResponse.json({ success: true, rawPermissions });
        }

        // ─── ACTION: SAVE PERMISSIONS ───
        if (action === 'save') {
            const { toDeleteIds, toUpsert } = permissionsPayload;

            // 1. Process Deletions (Modules turned off)
            if (toDeleteIds?.length > 0) {
                await db.delete(permissions).where(inArray(permissions.id, toDeleteIds));
            }

            // 2. Process Saves
            if (toUpsert?.length > 0) {
                // Filter items that ALREADY have an ID (Updates)
                const toUpdate = toUpsert.filter(p => p.id);
                // Filter items that DO NOT have an ID (New Inserts)
                const toInsert = toUpsert.filter(p => !p.id);

                if (toUpdate.length > 0) {
                    await Promise.all(toUpdate.map(async (p) => {
                        const mapped = mapToCamel(p);
                        const { id, ...dataToUpdate } = mapped;
                        await db.update(permissions).set(dataToUpdate).where(eq(permissions.id, id));
                    }));
                }

                if (toInsert.length > 0) {
                    const mappedInserts = toInsert.map(mapToCamel);
                    await db.insert(permissions).values(mappedInserts);
                }
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    } catch (error) {
        console.error("Permissions API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}