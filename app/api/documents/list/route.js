//backend full separated from page.jsx

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
        let myPerms = {};
        let globalTemp = { can_create: false, can_merge: false, can_delete: false };
        let dealRestrictions = null;

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
        }

        // 2. 🗄️ FETCH RAW DATA
        const workspaceId = session.active_workspace_id;
        
        let foldersQuery = supabase.from('folders').select('*').eq('company_id', session.company_id);
        let docsQuery = supabase.from('documents').select('*').eq('company_id', session.company_id);
        
        if (workspaceId) {
            foldersQuery = foldersQuery.eq('workspace_id', workspaceId);
            docsQuery = docsQuery.eq('workspace_id', workspaceId);
            
            // Check Deal Restrictions for Buyers/Guests
            if (['guest_admin', 'buyer', 'external_user'].includes(session.role)) {
                const { data: dealData } = await supabase
                    .from('dms_deals')
                    .select('guest_can_upload_docs, guest_can_download_docs, guest_can_create_folders')
                    .eq('id', workspaceId)
                    .single();
                if (dealData) {
                    dealRestrictions = {
                        guestCanUploadDocs: dealData.guest_can_upload_docs,
                        guestCanDownloadDocs: dealData.guest_can_download_docs,
                        guestCanCreateFolders: dealData.guest_can_create_folders
                    };
                }
            }
        } else {
            // If no workspace is selected, we might want to return nothing or only items with no workspace
            foldersQuery = foldersQuery.is('workspace_id', null);
            docsQuery = docsQuery.is('workspace_id', null);
        }

        const [{ data: foldersData }, { data: docsData }, { data: usersData }] = await Promise.all([
            foldersQuery,
            docsQuery,
            supabase.from('users').select('id, name').eq('company_id', session.company_id),
        ]);

        const userMap = {};
        (usersData || []).forEach(u => userMap[u.id] = u.name);

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
            .filter(f => isGodMode || (f.created_by === session.id && f.creator_revoked !== true) || myPerms[`fol_${f.id}`]?.can_view)
            .map(f => ({
                id: f.id, parentId: f.parent_folder_id || null, index: f.index_number ? f.index_number.toString() : '1',
                name: f.name, type: 'folder', size: calculateFolderSize(f.id), uploadedBy: userMap[f.created_by] || 'System',
                dateCreated: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                deletedBy: userMap[f.deleted_by] || 'Unknown',
                deletedAt: f.deleted_at ? new Date(f.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                is_bookmarked: f.is_bookmarked, is_deleted: f.is_deleted, creator_id: f.created_by, creator_revoked: f.creator_revoked, version: parseInt(f.version) || 1
            }));

        const mappedDocs = (docsData || [])
            .filter(doc => isGodMode || (doc.uploaded_by === session.id && doc.creator_revoked !== true) || myPerms[`doc_${doc.id}`]?.can_view || (doc.folder_id && myPerms[`fol_${doc.folder_id}`]?.can_view))
            .map(doc => ({
                id: doc.id, parentId: doc.folder_id || null, index: doc.index ? doc.index.toString().replace('.0', '') : '99',
                name: doc.name, type: doc.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/gi, '') || 'file',
                size: formatBytes(doc.file_size_bytes), uploadedBy: userMap[doc.uploaded_by] || 'System',
                dateCreated: new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                deletedBy: userMap[doc.deleted_by] || 'Unknown',
                deletedAt: doc.deleted_at ? new Date(doc.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--',
                is_bookmarked: doc.is_bookmarked, is_downloaded: doc.is_downloaded, is_deleted: doc.is_deleted,
                file_path: doc.file_path, original_file_path: doc.original_file_path, dek_ref: doc.dek_ref, mime_type: doc.mime_type,
                creator_id: doc.uploaded_by, creator_revoked: doc.creator_revoked, version: parseInt(doc.version) || 1
            }));

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
















// import { createClient } from '@supabase/supabase-js';
// import { NextResponse } from 'next/server';

// const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const company_id = searchParams.get('company_id');

//         const { data, error } = await supabase
//             .from('documents')
//             .select('id, name, folder_id, index, mime_type, file_size_bytes, uploaded_by, created_at, security, is_deleted, is_bookmarked, is_downloaded')
//             .eq('company_id', company_id)
//             .eq('is_deleted', false)
//             .order('created_at', { ascending: true });

//         if (error) {
//             console.error('Fetch error:', error);
//             return NextResponse.json({ error: error.message }, { status: 500 });
//         }

//         return NextResponse.json({ documents: data });
//     } catch (err) {
//         console.error('Route crash:', err);
//         return NextResponse.json({ error: err.message }, { status: 500 });
//     }
// }