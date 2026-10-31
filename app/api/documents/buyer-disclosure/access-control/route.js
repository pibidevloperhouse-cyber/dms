import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatBytes(bytes) {
    if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { action = 'get_data', session, guestAdminId, permissionsMap } = body;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
        }

        const companyId = session.company_id;
        const workspaceId = session.active_workspace_id || session.workspace_id;

        // ── 1. GET ALL DATA (STAGES, FILES, GUEST ADMINS, PERMISSIONS) ──
        if (action === 'get_data') {
            // A. Fetch Buyer Disclosure Stages
            let stageQuery = supabase
                .from('buyer_disclosure_stages')
                .select('*')
                .order('stage_number', { ascending: true });

            if (workspaceId) {
                stageQuery = stageQuery.eq('workspace_id', workspaceId);
            } else if (companyId) {
                stageQuery = stageQuery.eq('company_id', companyId);
            }

            let { data: stagesData } = await stageQuery;

            // Fallback: check by companyId if no stages found by workspaceId
            if ((!stagesData || stagesData.length === 0) && companyId) {
                const { data: compStages } = await supabase
                    .from('buyer_disclosure_stages')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('stage_number', { ascending: true });
                if (compStages && compStages.length > 0) stagesData = compStages;
            }

            // Deduplicate stages
            const stages = [];
            const seenStageNums = new Set();
            for (const s of stagesData || []) {
                const key = s.stage_number ?? s.name ?? s.id;
                if (!seenStageNums.has(key)) {
                    seenStageNums.add(key);
                    stages.push(s);
                }
            }

            const stageIds = stages.map(s => s.id);

            // B. Fetch Items in Stages
            let items = [];
            if (stageIds.length > 0) {
                const { data: dbItems } = await supabase
                    .from('buyer_disclosure_items')
                    .select('*')
                    .in('stage_id', stageIds)
                    .order('created_at', { ascending: true });
                if (dbItems) items = dbItems;
            }

            // C. Fetch Folders & Documents to resolve real contents
            let fQuery = supabase.from('folders').select('*').eq('is_deleted', false);
            let dQuery = supabase.from('documents').select('*').eq('is_deleted', false);
            if (workspaceId) {
                fQuery = fQuery.eq('workspace_id', workspaceId);
                dQuery = dQuery.eq('workspace_id', workspaceId);
            } else if (companyId) {
                fQuery = fQuery.eq('company_id', companyId);
                dQuery = dQuery.eq('company_id', companyId);
            }

            const [{ data: foldersData }, { data: docsData }] = await Promise.all([fQuery, dQuery]);
            const allFolders = foldersData || [];
            const allDocs = docsData || [];

            // Helper to recursively collect files in a folder
            const collectFolderFiles = (folderId, stage, folderPath = '') => {
                const results = [];
                const currentFolder = allFolders.find(f => f.id === folderId);
                const currentPath = folderPath ? `${folderPath} / ${currentFolder?.name || ''}` : (currentFolder?.name || 'Folder');

                // Files directly in this folder
                const childDocs = allDocs.filter(d => d.folder_id === folderId);
                childDocs.forEach(doc => {
                    const ext = (doc.name || '').split('.').pop()?.toLowerCase() || 'file';
                    results.push({
                        id: doc.id,
                        docId: doc.id,
                        name: doc.name,
                        stageId: stage.id,
                        stageName: stage.name,
                        stageNumber: stage.stage_number,
                        folderName: currentPath,
                        folderId: folderId,
                        size: formatBytes(doc.file_size_bytes),
                        version: doc.version ? `V${doc.version}`.replace('VV', 'V') : 'V1',
                        isRedacted: Boolean(doc.is_redacted),
                        type: ext,
                        createdAt: doc.created_at
                    });
                });

                // Child folders
                const subFolders = allFolders.filter(f => f.parent_folder_id === folderId);
                subFolders.forEach(sub => {
                    results.push(...collectFolderFiles(sub.id, stage, currentPath));
                });

                return results;
            };

            // D. Assemble complete list of files present in Buyer Disclosure
            const allDisclosureFiles = [];
            const seenFileIds = new Set();

            stages.forEach(stg => {
                const stageItems = items.filter(i => i.stage_id === stg.id);

                stageItems.forEach(item => {
                    if (item.is_folder) {
                        // Find matching folder
                        const matchFol = allFolders.find(f =>
                            f.id === item.original_folder_id ||
                            (f.name && item.name && f.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                        );

                        if (matchFol) {
                            const folderFiles = collectFolderFiles(matchFol.id, stg, '');
                            folderFiles.forEach(ff => {
                                if (!seenFileIds.has(ff.id)) {
                                    seenFileIds.add(ff.id);
                                    allDisclosureFiles.push(ff);
                                }
                            });
                        }
                    } else {
                        // Direct file item
                        const matchDoc = allDocs.find(d =>
                            d.id === item.original_document_id ||
                            (d.name && item.name && d.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                        );

                        const docId = matchDoc ? matchDoc.id : (item.original_document_id || item.id);
                        const fileExt = (item.name || '').split('.').pop()?.toLowerCase() || item.type || 'file';

                        if (!seenFileIds.has(docId)) {
                            seenFileIds.add(docId);
                            allDisclosureFiles.push({
                                id: docId,
                                docId: docId,
                                disclosureItemId: item.id,
                                name: item.name,
                                stageId: stg.id,
                                stageName: stg.name,
                                stageNumber: stg.stage_number,
                                folderName: 'Root',
                                folderId: null,
                                size: item.size || (matchDoc ? formatBytes(matchDoc.file_size_bytes) : '--'),
                                version: item.version || (matchDoc?.version ? `V${matchDoc.version}`.replace('VV', 'V') : 'V1'),
                                isRedacted: Boolean(item.is_redacted || matchDoc?.is_redacted),
                                type: fileExt,
                                createdAt: item.created_at || matchDoc?.created_at
                            });
                        }
                    }
                });
            });

            // E. Fetch Guest Admin Users & Groups
            // 1. Users with role 'guest_admin'
            const { data: guestUsers } = await supabase
                .from('users')
                .select('id, name, email, role, dms_role, company_id')
                .or(`role.eq.guest_admin,role.eq.guest_lead,role.eq.buyer,role.eq.external_user`);

            // Also check deal buyer if workspace has a deal
            let dealBuyer = null;
            if (workspaceId && UUID_REGEX.test(workspaceId)) {
                const { data: deal } = await supabase
                    .from('dms_deals')
                    .select('buyer_id')
                    .eq('id', workspaceId)
                    .maybeSingle();

                if (deal?.buyer_id) {
                    const { data: bUser } = await supabase
                        .from('users')
                        .select('id, name, email, role, dms_role, company_id')
                        .eq('id', deal.buyer_id)
                        .maybeSingle();
                    if (bUser) dealBuyer = bUser;
                }
            }

            const guestAdminsList = [];
            const seenUserIds = new Set();

            if (dealBuyer && !seenUserIds.has(dealBuyer.id)) {
                seenUserIds.add(dealBuyer.id);
                guestAdminsList.push(dealBuyer);
            }

            (guestUsers || []).forEach(u => {
                if (!seenUserIds.has(u.id)) {
                    seenUserIds.add(u.id);
                    guestAdminsList.push(u);
                }
            });

            // Select active guest admin
            const targetGuestAdminId = guestAdminId || (guestAdminsList[0]?.id || null);
            const activeGuestAdmin = guestAdminsList.find(u => u.id === targetGuestAdminId) || guestAdminsList[0] || null;

            // F. Fetch Existing Permissions for this Guest Admin
            let currentPermissions = {};
            if (activeGuestAdmin) {
                // Fetch direct permissions for this user
                const { data: userPerms } = await supabase
                    .from('permissions')
                    .select('*')
                    .eq('user_id', activeGuestAdmin.id);

                // Fetch permissions for groups this user belongs to
                const { data: userGroups } = await supabase
                    .from('user_groups')
                    .select('group_id')
                    .eq('user_id', activeGuestAdmin.id);

                const grpIds = (userGroups || []).map(g => g.group_id).filter(Boolean);
                let grpPerms = [];
                if (grpIds.length > 0) {
                    const { data: gp } = await supabase
                        .from('permissions')
                        .select('*')
                        .in('group_id', grpIds);
                    if (gp) grpPerms = gp;
                }

                // Map permissions
                [...(grpPerms || []), ...(userPerms || [])].forEach(p => {
                    const key = p.document_id || p.folder_id;
                    if (key) {
                        currentPermissions[key] = {
                            can_view: Boolean(p.can_view),
                            can_download_secure: Boolean(p.can_download_secure),
                            can_download_original: Boolean(p.can_download_original),
                            perm_id: p.id
                        };
                    }
                });
            }

            return NextResponse.json({
                success: true,
                files: allDisclosureFiles,
                stages: stages.map(s => ({ id: s.id, name: s.name, stageNumber: s.stage_number, buyerAccess: s.buyer_access })),
                guestAdmins: guestAdminsList,
                activeGuestAdmin,
                permissions: currentPermissions
            });
        }

        // ── 2. SAVE PERMISSIONS FOR GUEST ADMIN ──
        if (action === 'save_permissions') {
            if (!guestAdminId) {
                return NextResponse.json({ error: 'Guest Admin ID required' }, { status: 400 });
            }
            if (!permissionsMap || typeof permissionsMap !== 'object') {
                return NextResponse.json({ error: 'Permissions map required' }, { status: 400 });
            }

            // Find existing permission records for this user to update or insert
            const { data: existingUserPerms } = await supabase
                .from('permissions')
                .select('id, document_id, user_id')
                .eq('user_id', guestAdminId);

            const existingMap = new Map();
            (existingUserPerms || []).forEach(p => {
                if (p.document_id) existingMap.set(p.document_id, p.id);
            });

            // Also check user's groups to keep group permissions in sync if applicable
            const { data: uGroups } = await supabase
                .from('user_groups')
                .select('group_id')
                .eq('user_id', guestAdminId);
            const primaryGroupId = uGroups?.[0]?.group_id || null;

            const now = new Date().toISOString();
            const entries = Object.entries(permissionsMap);

            for (const [docId, perm] of entries) {
                if (!docId) continue;

                const payload = {
                    company_id: companyId,
                    user_id: guestAdminId,
                    document_id: docId,
                    scope: 'document',
                    can_view: Boolean(perm.can_view),
                    can_download_secure: Boolean(perm.can_download_secure),
                    can_download_original: Boolean(perm.can_download_original),
                    updated_at: now
                };

                const existingPermId = existingMap.get(docId);

                if (existingPermId) {
                    await supabase
                        .from('permissions')
                        .update(payload)
                        .eq('id', existingPermId);
                } else {
                    await supabase
                        .from('permissions')
                        .insert(payload);
                }

                // If user has a group, also ensure group permission exists
                if (primaryGroupId) {
                    const { data: existingGrpPerm } = await supabase
                        .from('permissions')
                        .select('id')
                        .eq('group_id', primaryGroupId)
                        .eq('document_id', docId)
                        .maybeSingle();

                    const grpPayload = {
                        company_id: companyId,
                        group_id: primaryGroupId,
                        document_id: docId,
                        scope: 'document',
                        can_view: Boolean(perm.can_view),
                        can_download_secure: Boolean(perm.can_download_secure),
                        can_download_original: Boolean(perm.can_download_original),
                        updated_at: now
                    };

                    if (existingGrpPerm?.id) {
                        await supabase
                            .from('permissions')
                            .update(grpPayload)
                            .eq('id', existingGrpPerm.id);
                    } else {
                        await supabase
                            .from('permissions')
                            .insert(grpPayload);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Buyer access control permissions updated successfully!'
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (err) {
        console.error('Buyer access control API error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

