import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
    try {
        const { session } = await req.json();
        if (!session || !session.company_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userRole = session.role;
        const userId = session.id;
        const companyId = session.company_id;
        const dmsRole = session.dms_role || '';
        const isBuyer = dmsRole === 'buyer' || ['guest_admin', 'guest_lead', 'buyer', 'advisor', 'external_user'].includes(userRole);

        let groupQuery = supabase
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false });

        if (session.active_workspace_id) {
            groupQuery = groupQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            groupQuery = groupQuery.eq('company_id', companyId).is('workspace_id', null);
        }

        let folderQuery = supabase
            .from('folders')
            .select('*')
            .eq('is_deleted', false);

        if (session.active_workspace_id) {
            folderQuery = folderQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            folderQuery = folderQuery.eq('company_id', companyId).is('workspace_id', null);
        }

        let docQuery = supabase
            .from('documents')
            .select('id, name, folder_id, index, uploaded_by, creator_revoked')
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

        if (session.active_workspace_id) {
            docQuery = docQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            docQuery = docQuery.eq('company_id', companyId).is('workspace_id', null);
        }

        let permQuery = supabase.from('permissions').select('id, user_id, document_id, folder_id, scope, group_id, can_view, can_edit, can_upload, can_download_secure, can_download_original, can_delete, can_redact, can_view_seller_groups');
        if (!session.active_workspace_id) {
            permQuery = permQuery.eq('company_id', companyId);
        }

        const [
            { data: groupsData }, { data: foldersData }, { data: docsData },
            { data: permsData }, { data: userGroups }, { data: usersData }
        ] = await Promise.all([
            groupQuery,
            folderQuery,
            docQuery,
            permQuery,
            supabase.from('user_groups').select('user_id, group_id'),
            supabase.from('users').select('id, name, email')
        ]);

        // Visibility permissions check matching GroupSidebar
        let localCanViewSellerGroups = false;
        if (userRole === 'super_admin' || userRole === 'admin') {
            localCanViewSellerGroups = true;
        } else {
            const myGroupIds = (userGroups || []).filter(ug => ug.user_id === userId).map(ug => ug.group_id);
            if (myGroupIds.length > 0 && permsData) {
                localCanViewSellerGroups = permsData.some(p => p.scope === 'workspace' && myGroupIds.includes(p.group_id) && p.can_view_seller_groups);
            }
        }

        let allGroups = groupsData || [];
        let filteredGroups = allGroups.filter(g => g.type !== 'individual');

        const SELLER_ROLE_HIERARCHY = {
            super_admin: ['super_admin', 'admin', 'sub_admin', 'internal_user', 'user'],
            admin: ['admin', 'sub_admin', 'internal_user', 'user'],
            sub_admin: ['sub_admin', 'internal_user', 'user'],
            internal_user: ['internal_user', 'user'],
            user: ['internal_user', 'user'],
        };

        const normalizedUserRole = (userRole || '').toLowerCase();
        const allowedSellerRoles = SELLER_ROLE_HIERARCHY[normalizedUserRole] || ['internal_user', 'user'];

        if (isBuyer) {
            if (userRole !== 'super_admin' && !localCanViewSellerGroups) {
                const myGroupIds = new Set((userGroups || []).filter(ug => ug.user_id === userId).map(ug => ug.group_id));
                filteredGroups = filteredGroups.filter(g => myGroupIds.has(g.id) || g.created_by === userId || ['guest_admin', 'guest_lead', 'external_user', 'buyer', 'advisor'].includes(g.role));
            }
        } else {
            filteredGroups = filteredGroups.filter(g => {
                if (g.role) return allowedSellerRoles.includes(g.role.toLowerCase());
                return normalizedUserRole === 'super_admin' || normalizedUserRole === 'admin';
            });
        }

        const roleOrder = {
            'super_admin': 1,
            'admin': 2,
            'sub_admin': 3,
            'internal_user': 4,
            'guest_admin': 5,
            'guest_lead': 6,
            'external_user': 7
        };

        filteredGroups.sort((a, b) => {
            const orderA = roleOrder[a.role] || 99;
            const orderB = roleOrder[b.role] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

        filteredGroups = filteredGroups.map(g => ({
            ...g,
            department: g.department || 'General'
        }));

        // Calculate document & folder access
        let myGroupIds = [];
        if (session.role !== 'super_admin' && userGroups) {
            myGroupIds = userGroups.filter(ug => ug.user_id === session.id).map(ug => ug.group_id);
        }

        const myPerms = {};
        if (session.role !== 'super_admin' && permsData) {
            permsData.forEach(p => {
                if (myGroupIds.includes(p.group_id) || p.user_id === session.id) {
                    if (p.scope === 'document' && p.document_id) myPerms[`doc_${p.document_id}`] = p;
                    if (p.scope === 'folder' && p.folder_id) myPerms[`fol_${p.folder_id}`] = p;
                }
            });

            // If buyer user has no direct perm, check if deal buyer has explicit perm
            if (isBuyer && session.active_workspace_id) {
                const { data: deal } = await supabase.from('dms_deals').select('buyer_id').eq('id', session.active_workspace_id).maybeSingle();
                if (deal?.buyer_id && deal.buyer_id !== session.id) {
                    permsData.forEach(p => {
                        if (p.user_id === deal.buyer_id) {
                            if (p.scope === 'document' && p.document_id && !myPerms[`doc_${p.document_id}`]) {
                                myPerms[`doc_${p.document_id}`] = p;
                            }
                            if (p.scope === 'folder' && p.folder_id && !myPerms[`fol_${p.folder_id}`]) {
                                myPerms[`fol_${p.folder_id}`] = p;
                            }
                        }
                    });
                }
            }
        }

        // ── 🛡️ BUYER DISCLOSURE STAGE FILTER FOR BUYER SIDE USERS ──
        let grantedFolderIds = new Set();
        let grantedDocIds = new Set();
        let standaloneFolders = [];
        let standaloneDocs = [];

        if (isBuyer) {
            try {
                let stageQuery = supabase
                    .from('buyer_disclosure_stages')
                    .select('id, name, stage_number, buyer_access, is_locked, company_id, updated_at')
                    .order('updated_at', { ascending: false });

                if (session.active_workspace_id) {
                    stageQuery = stageQuery.eq('workspace_id', session.active_workspace_id);
                } else if (session.company_id) {
                    stageQuery = stageQuery.eq('company_id', session.company_id);
                }

                const { data: allStages } = await stageQuery;

                // Deduplicate canonical stages per stage_number
                const canonicalStages = [];
                const seenStageNums = new Set();
                for (const s of (allStages || [])) {
                    const num = s.stage_number ?? s.name;
                    if (!seenStageNums.has(num)) {
                        seenStageNums.add(num);
                        canonicalStages.push(s);
                    }
                }

                const grantedStages = canonicalStages.filter(s => s.buyer_access === 'can_view' && !s.is_locked);

                if (grantedStages && grantedStages.length > 0) {
                    const grantedStageNums = new Set(grantedStages.map(s => s.stage_number));
                    const allGrantedStageIds = (allStages || [])
                        .filter(s => grantedStageNums.has(s.stage_number))
                        .map(s => s.id);

                    const { data: items } = await supabase
                        .from('buyer_disclosure_items')
                        .select('*')
                        .in('stage_id', allGrantedStageIds);

                    if (items && items.length > 0) {
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
                                    standaloneFolders.push({
                                        id: item.id,
                                        parent_folder_id: item.parent_id || null,
                                        name: item.name,
                                        index_number: 1,
                                        _type: 'folder'
                                    });
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
                                    standaloneDocs.push({
                                        id: item.id,
                                        folder_id: item.parent_id || null,
                                        name: item.name,
                                        index: '99',
                                        _type: 'doc'
                                    });
                                }
                            }
                        });

                        // Cascade down: subfolders
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

                        // Cascade down: docs
                        (docsData || []).forEach(doc => {
                            if (doc.folder_id && grantedFolderIds.has(doc.folder_id)) {
                                grantedDocIds.add(doc.id);
                            }
                        });

                        // Cascade UP: ancestor folders for granted docs that have can_view !== false
                        (docsData || []).forEach(doc => {
                            if (grantedDocIds.has(doc.id) && doc.folder_id) {
                                const perm = myPerms[`doc_${doc.id}`];
                                if (!perm || perm.can_view !== false) {
                                    let currFolId = doc.folder_id;
                                    while (currFolId) {
                                        grantedFolderIds.add(currFolId);
                                        const parent = (foldersData || []).find(f => f.id === currFolId);
                                        currFolId = parent?.parent_folder_id || null;
                                    }
                                }
                            }
                        });

                        let folAncestorsAdded = true;
                        while (folAncestorsAdded) {
                            folAncestorsAdded = false;
                            (foldersData || []).forEach(f => {
                                if (grantedFolderIds.has(f.id) && f.parent_folder_id && !grantedFolderIds.has(f.parent_folder_id)) {
                                    grantedFolderIds.add(f.parent_folder_id);
                                    folAncestorsAdded = true;
                                }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Error filtering access list by disclosure stages:', e);
            }
        }

        const isFullAccess = ['super_admin', 'admin', 'sub_admin'].includes(session.role);

        const allowedFolders = [
            ...(foldersData || []).filter(f => {
                if (isBuyer) {
                    return grantedFolderIds.has(f.id) && (myPerms[`fol_${f.id}`]?.can_view !== false);
                }
                if (isFullAccess) return true;
                if (f.created_by === session.id && f.creator_revoked !== true) return true;
                return myPerms[`fol_${f.id}`]?.can_view === true;
            }),
            ...standaloneFolders
        ];

        const allowedDocs = [
            ...(docsData || []).filter(doc => {
                if (isBuyer) {
                    if (!grantedDocIds.has(doc.id)) return false;
                    if (myPerms[`doc_${doc.id}`] && myPerms[`doc_${doc.id}`].can_view === false) return false;
                    return true;
                }
                if (isFullAccess) return true;
                if (doc.uploaded_by === session.id && doc.creator_revoked !== true) return true;
                if (myPerms[`doc_${doc.id}`]?.can_view === true) return true;
                if (doc.folder_id && myPerms[`fol_${doc.folder_id}`]?.can_view === true) return true;
                return false;
            }),
            ...standaloneDocs
        ].map((doc, idx) => ({ ...doc, displayIndex: (idx + 1).toString() }));

        const membersMap = {};
        if (userGroups && usersData) {
            const userDict = {};
            usersData.forEach(u => userDict[u.id] = u);
            userGroups.forEach(ug => {
                if (!membersMap[ug.group_id]) membersMap[ug.group_id] = [];
                if (userDict[ug.user_id]) membersMap[ug.group_id].push(userDict[ug.user_id]);
            });
        }

        const map = {};
        (permsData || []).forEach(p => {
            if (p.scope === 'document' && p.document_id) map[`${p.group_id}_doc_${p.document_id}`] = p;
            else if (p.scope === 'folder' && p.folder_id) map[`${p.group_id}_fol_${p.folder_id}`] = p;
        });

        return NextResponse.json({
            success: true,
            groups: filteredGroups,
            folders: allowedFolders,
            documents: allowedDocs,
            permissions: map,
            groupMembers: membersMap
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
