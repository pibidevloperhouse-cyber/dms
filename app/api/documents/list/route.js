//backend full separated from page.jsx

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dealTasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// 🔒 Uses SERVICE ROLE to bypass Row Level Security on the Backend
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        // We use POST so the frontend can securely send the localStorage session data
        const { session } = await req.json();

        if (!session || !session.company_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isGodMode = session.role === 'super_admin';
        const isInternalUser = session.role === 'internal_user';
        let myPerms = {};
        let globalTemp = { can_create: false, can_merge: false, can_delete: false };
        let dealRestrictions = null;
        const prepTaskFolderIds = new Set();

        // 1. 🛡️ CALCULATE ABAC PERMISSIONS ON THE SERVER
        if (!isGodMode) {
            const { data: myGroups } = await supabase.from('user_groups').select('group_id').eq('user_id', session.id);
            const groupIds = (myGroups || []).map(g => g.group_id);

            if (groupIds.length > 0) {
                const { data: perms } = await supabase.from('permissions').select('*').in('group_id', groupIds);

                (perms || []).forEach(p => {
                    if (p.scope === 'files') {
                        globalTemp.can_create = globalTemp.can_create || p.can_create_folder;
                        globalTemp.can_merge = globalTemp.can_merge || p.can_merge_folder;
                        globalTemp.can_delete = globalTemp.can_delete || p.can_delete_folder;
                    }

                    const key = p.scope === 'folder' ? `fol_${p.folder_id}` : `doc_${p.document_id}`;

                    if (!myPerms[key]) {
                        myPerms[key] = { ...p };
                    } else {
                        myPerms[key].can_view = myPerms[key].can_view || p.can_view;
                        myPerms[key].can_edit = myPerms[key].can_edit || p.can_edit;
                        myPerms[key].can_upload = myPerms[key].can_upload || p.can_upload;
                        myPerms[key].can_download_secure = myPerms[key].can_download_secure || p.can_download_secure;
                        myPerms[key].can_download_original = myPerms[key].can_download_original || p.can_download_original;
                        myPerms[key].can_delete = myPerms[key].can_delete || p.can_delete;
                    }
                });
            }

            // If internal user, find folders assigned in Preparation stage tasks created by Sub Admin
            if (isInternalUser) {
                try {
                    const prepTasks = await db
                        .select()
                        .from(dealTasks)
                        .where(
                            and(
                                eq(dealTasks.dealStage, 'Preparation'),
                                eq(dealTasks.creatorRole, 'sub_admin')
                            )
                        );

                    const userName = (session.name || '').trim().toLowerCase();
                    const userEmail = (session.email || '').trim().toLowerCase();

                    prepTasks.forEach((t) => {
                        const assignedUser = (t.assignedToUser || '').trim().toLowerCase();
                        const isAssigned = !assignedUser || assignedUser === userName || assignedUser === userEmail;
                        if (isAssigned) {
                            if (t.folderId) prepTaskFolderIds.add(t.folderId);
                            if (t.subfolderId) prepTaskFolderIds.add(t.subfolderId);
                        }
                    });
                } catch (taskErr) {
                    console.error('Error fetching preparation task folders for internal user:', taskErr);
                }
            }
        }

        // 2. 🗄️ FETCH RAW DATA
        const workspaceId = session.active_workspace_id;
        
        let foldersQuery = supabase.from('folders').select('*');
        let docsQuery = supabase.from('documents').select('*');
        
        if (workspaceId) {
            foldersQuery = foldersQuery.eq('workspace_id', workspaceId);
            docsQuery = docsQuery.eq('workspace_id', workspaceId);
            
            // Check Deal Restrictions & Stage Gating for Buyers/Guests
            if (['guest_admin', 'buyer', 'external_user', 'guest_lead', 'advisor'].includes(session.role) || session.dms_role === 'buyer') {
                const { data: dealData } = await supabase
                    .from('dms_deals')
                    .select('current_stage, guest_can_upload_docs, guest_can_download_docs, guest_can_create_folders')
                    .eq('id', workspaceId)
                    .single();
                if (dealData) {
                    const stage = (dealData.current_stage || 'Preparation').toString().trim().toLowerCase();
                    if (stage === 'preparation') {
                        return NextResponse.json({
                            success: false,
                            error: "Your deal is now in preparation stage. Once the preparation stage is completed, it is moved to the due diligence stage, then only you will be able to enter the deal.",
                            isPreparationBlocked: true
                        }, { status: 403 });
                    }

                    dealRestrictions = {
                        guestCanUploadDocs: dealData.guest_can_upload_docs,
                        guestCanDownloadDocs: dealData.guest_can_download_docs,
                        guestCanCreateFolders: dealData.guest_can_create_folders
                    };
                }
            }
        } else {
            foldersQuery = foldersQuery.eq('company_id', session.company_id).is('workspace_id', null);
            docsQuery = docsQuery.eq('company_id', session.company_id).is('workspace_id', null);
        }

        const [{ data: foldersData }, { data: docsData }, { data: usersData }, { data: redactedData }] = await Promise.all([
            foldersQuery,
            docsQuery,
            workspaceId ? supabase.from('users').select('id, name') : supabase.from('users').select('id, name').eq('company_id', session.company_id),
            supabase.from('redacted_documents').select('document_id, redacted_path'),
        ]);

        const userMap = {};
        (usersData || []).forEach(u => userMap[u.id] = u.name);

        const redactedMap = {};
        (redactedData || []).forEach(r => {
            if (r.document_id) redactedMap[r.document_id] = r.redacted_path;
        });

        // Ensure internal user has folder visibility & upload access for assigned prep folders
        prepTaskFolderIds.forEach((fId) => {
            const key = `fol_${fId}`;
            if (!myPerms[key]) {
                myPerms[key] = { can_view: true, can_upload: true, can_edit: false, can_delete: false };
            } else {
                myPerms[key].can_view = true;
                myPerms[key].can_upload = true;
            }
        });

        // ── 🛡️ BUYER DISCLOSURE STAGE ACCESS (GRANT / REVOKE ACCESS) ──
        const isBuyerSideUser = ['guest_admin', 'buyer', 'external_user', 'guest_lead', 'advisor'].includes(session.role) || session.dms_role === 'buyer';
        let standaloneDisclosureFolders = [];
        let standaloneDisclosureDocs = [];

        if (isBuyerSideUser) {
            try {
                let stageQuery = supabase
                    .from('buyer_disclosure_stages')
                    .select('id, name, stage_number, buyer_access, is_locked')
                    .eq('buyer_access', 'can_view')
                    .eq('is_locked', false);

                if (workspaceId) {
                    stageQuery = stageQuery.eq('workspace_id', workspaceId);
                } else if (session.company_id) {
                    stageQuery = stageQuery.eq('company_id', session.company_id);
                }

                const { data: grantedStages } = await stageQuery;

                if (grantedStages && grantedStages.length > 0) {
                    const grantedStageIds = grantedStages.map(s => s.id);
                    const { data: items } = await supabase
                        .from('buyer_disclosure_items')
                        .select('*')
                        .in('stage_id', grantedStageIds);

                    if (items && items.length > 0) {
                        const grantedFolderIds = new Set();
                        const grantedDocIds = new Set();

                        items.forEach(item => {
                            if (item.is_folder) {
                                if (item.original_folder_id) grantedFolderIds.add(item.original_folder_id);
                                const matchFol = (foldersData || []).find(f =>
                                    f.id === item.original_folder_id ||
                                    (f.name && item.name && f.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                                );
                                if (matchFol) {
                                    grantedFolderIds.add(matchFol.id);
                                } else {
                                    standaloneDisclosureFolders.push(item);
                                }
                            } else {
                                if (item.original_document_id) grantedDocIds.add(item.original_document_id);
                                const matchDoc = (docsData || []).find(d =>
                                    d.id === item.original_document_id ||
                                    (d.name && item.name && d.name.trim().toLowerCase() === item.name.trim().toLowerCase())
                                );
                                if (matchDoc) {
                                    grantedDocIds.add(matchDoc.id);
                                } else {
                                    standaloneDisclosureDocs.push(item);
                                }
                            }
                        });

                        // Cascade to all subfolders inside granted folders
                        let added = true;
                        while (added) {
                            added = false;
                            (foldersData || []).forEach(f => {
                                if (f.parent_folder_id && grantedFolderIds.has(f.parent_folder_id) && !grantedFolderIds.has(f.id)) {
                                    grantedFolderIds.add(f.id);
                                    added = true;
                                }
                            });
                        }

                        // Grant view & download access to all matching folders
                        grantedFolderIds.forEach(fId => {
                            const key = `fol_${fId}`;
                            if (!myPerms[key]) {
                                myPerms[key] = {
                                    can_view: true,
                                    can_upload: Boolean(dealRestrictions?.guestCanUploadDocs),
                                    can_download_secure: Boolean(dealRestrictions?.guestCanDownloadDocs ?? true),
                                    can_download_original: Boolean(dealRestrictions?.guestCanDownloadDocs ?? true),
                                    can_edit: false,
                                    can_delete: false
                                };
                            } else {
                                myPerms[key].can_view = true;
                            }
                        });

                        // Grant view & download access to all matching documents (and docs in granted folders)
                        (docsData || []).forEach(doc => {
                            if (grantedDocIds.has(doc.id) || (doc.folder_id && grantedFolderIds.has(doc.folder_id))) {
                                const key = `doc_${doc.id}`;
                                if (!myPerms[key]) {
                                    myPerms[key] = {
                                        can_view: true,
                                        can_upload: false,
                                        can_download_secure: Boolean(dealRestrictions?.guestCanDownloadDocs ?? true),
                                        can_download_original: Boolean(dealRestrictions?.guestCanDownloadDocs ?? true),
                                        can_edit: false,
                                        can_delete: false
                                    };
                                } else {
                                    myPerms[key].can_view = true;
                                }
                            }
                        });
                    }
                }
            } catch (discErr) {
                console.error('Error resolving buyer disclosure stage permissions:', discErr);
            }
        }

        // Utility to calculate human-readable bytes
        const formatBytes = (bytes) => {
            if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '--';
            if (bytes < 1024) return `${bytes} B`;
            if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
            if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        };

        // Recursive folder size calculator
        const calculateFolderSize = (folderId) => {
            let total = 0;
            const addFolderSize = (id) => {
                (docsData || []).forEach(doc => { if (doc.folder_id === id) total += Number(doc.file_size_bytes) || 0; });
                (foldersData || []).forEach(folder => { if (folder.parent_folder_id === id) addFolderSize(folder.id); });
            };
            addFolderSize(folderId);
            return formatBytes(total);
        };

        // 3. 🧹 CLEAN AND FILTER THE DATA
        const mappedFolders = (foldersData || [])
            .filter(f => isGodMode || (f.created_by === session.id && f.creator_revoked !== true) || myPerms[`fol_${f.id}`]?.can_view || prepTaskFolderIds.has(f.id))
            .map(f => ({
                id: f.id, parentId: f.parent_folder_id || null, index: f.index_number ? f.index_number.toString() : '1',
                name: f.name, type: 'folder', size: calculateFolderSize(f.id), uploadedBy: userMap[f.created_by] || 'System',
                dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                deletedBy: userMap[f.deleted_by] || 'Unknown',
                deletedAt: f.deleted_at ? new Date(f.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                is_bookmarked: f.is_bookmarked, is_deleted: f.is_deleted, creator_id: f.created_by, creator_revoked: f.creator_revoked, version: parseInt(f.version) || 1,
                isPrepAssignedFolder: prepTaskFolderIds.has(f.id)
            }));

        const mappedDocs = (docsData || [])
            .filter(doc => {
                if (isGodMode) return true;
                if (doc.uploaded_by === session.id && doc.creator_revoked !== true) return true;
                if (myPerms[`doc_${doc.id}`]?.can_view) return true;
                if (doc.folder_id && (myPerms[`fol_${doc.folder_id}`]?.can_view || prepTaskFolderIds.has(doc.folder_id))) return true;
                return false;
            })
            .map(doc => {
                const isRedacted = Boolean(doc.is_redacted || redactedMap[doc.id]);
                const isUploadedByMe = doc.uploaded_by === session.id;

                // Sub Admin to Internal User Flow Rule:
                // An internal user in preparation stage can see the folder and all file names inside it,
                // but can ONLY view/download files that they themselves uploaded.
                // Existing files or files uploaded by others are "Name only" (View restricted).
                const isViewRestricted = isInternalUser && !isUploadedByMe;

                const docPermKey = `doc_${doc.id}`;
                if (isInternalUser) {
                    if (isViewRestricted) {
                        myPerms[docPermKey] = {
                            can_view: false,
                            can_edit: false,
                            can_upload: false,
                            can_download_secure: false,
                            can_download_original: false,
                            can_delete: false,
                        };
                    } else {
                        myPerms[docPermKey] = {
                            can_view: true,
                            can_edit: true,
                            can_upload: true,
                            can_download_secure: true,
                            can_download_original: true,
                            can_delete: false,
                        };
                    }
                } else if (!isGodMode) {
                    // For sub_admin and admin roles, if they have folder view access, they can view files in that folder
                    const parentFolPerm = doc.folder_id ? myPerms[`fol_${doc.folder_id}`] : null;
                    if (parentFolPerm?.can_view && !myPerms[docPermKey]) {
                        myPerms[docPermKey] = {
                            can_view: true,
                            can_edit: Boolean(parentFolPerm.can_edit),
                            can_upload: Boolean(parentFolPerm.can_upload),
                            can_download_secure: Boolean(parentFolPerm.can_download_secure),
                            can_download_original: Boolean(parentFolPerm.can_download_original),
                            can_delete: false,
                        };
                    }
                }

                return {
                    id: doc.id, parentId: doc.folder_id || null, index: doc.index ? doc.index.toString().replace('.0', '') : '99',
                    name: doc.name, type: doc.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/gi, '') || 'file',
                    size: formatBytes(doc.file_size_bytes), uploadedBy: userMap[doc.uploaded_by] || 'System',
                    dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    deletedBy: userMap[doc.deleted_by] || 'Unknown',
                    deletedAt: doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                    is_bookmarked: doc.is_bookmarked, is_downloaded: doc.is_downloaded, is_deleted: doc.is_deleted,
                    file_path: doc.file_path, original_file_path: doc.original_file_path, dek_ref: doc.dek_ref, mime_type: doc.mime_type,
                    creator_id: doc.uploaded_by, creator_revoked: doc.creator_revoked, version: parseInt(doc.version) || 1,
                    is_redacted: isRedacted,
                    redacted_path: redactedMap[doc.id] || null,
                    is_view_restricted: isViewRestricted,
                    is_my_upload: isUploadedByMe,
                };
            });

        if (standaloneDisclosureFolders.length > 0) {
            standaloneDisclosureFolders.forEach(item => {
                myPerms[`fol_${item.id}`] = { can_view: true, can_download_secure: true, can_download_original: true };
                mappedFolders.push({
                    id: item.id,
                    parentId: item.parent_id || null,
                    index: '1',
                    name: item.name,
                    type: 'folder',
                    size: item.size || '--',
                    uploadedBy: 'Seller',
                    dateCreated: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                    deletedBy: 'Unknown',
                    deletedAt: '--',
                    is_bookmarked: false,
                    is_deleted: false,
                    creator_id: null,
                    version: 1
                });
            });
        }

        if (standaloneDisclosureDocs.length > 0) {
            standaloneDisclosureDocs.forEach(item => {
                myPerms[`doc_${item.id}`] = { can_view: true, can_download_secure: true, can_download_original: true };
                mappedDocs.push({
                    id: item.id,
                    parentId: item.parent_id || null,
                    index: '99',
                    name: item.name,
                    type: (item.name.split('.').pop() || 'file').toLowerCase(),
                    size: item.size || '--',
                    uploadedBy: 'Seller',
                    dateCreated: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                    deletedBy: 'Unknown',
                    deletedAt: '--',
                    is_bookmarked: false,
                    is_deleted: false,
                    is_redacted: Boolean(item.is_redacted),
                    version: 1
                });
            });
        }

        // 4. 🚀 SEND PERFECT JSON TO FRONTEND
        return NextResponse.json({
            success: true,
            files: [...mappedFolders, ...mappedDocs],
            mergedPerms: myPerms,
            globalFolderPerms: globalTemp,
            dealRestrictions
        });

    } catch (err) {
        console.error('List Engine crash:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
