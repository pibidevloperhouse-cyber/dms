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
        const isBuyer = dmsRole === 'buyer' || ['guest_admin', 'guest_lead', 'buyer'].includes(userRole);

        let groupQuery = supabase
            .from('groups')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (session.active_workspace_id) {
            groupQuery = groupQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            groupQuery = groupQuery.is('workspace_id', null);
        }

        let folderQuery = supabase
            .from('folders')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_deleted', false);

        if (session.active_workspace_id) {
            folderQuery = folderQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            folderQuery = folderQuery.is('workspace_id', null);
        }

        let docQuery = supabase
            .from('documents')
            .select('id, name, folder_id, index, uploaded_by, creator_revoked')
            .eq('company_id', companyId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

        if (session.active_workspace_id) {
            docQuery = docQuery.eq('workspace_id', session.active_workspace_id);
        } else {
            docQuery = docQuery.is('workspace_id', null);
        }

        const [
            { data: groupsData }, { data: foldersData }, { data: docsData },
            { data: permsData }, { data: userGroups }, { data: usersData }
        ] = await Promise.all([
            groupQuery,
            folderQuery,
            docQuery,
            supabase.from('permissions').select('id, document_id, folder_id, scope, group_id, can_view, can_edit, can_upload, can_download_secure, can_download_original, can_delete, can_redact, can_view_seller_groups').eq('company_id', companyId),
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
                filteredGroups = filteredGroups.filter(g => myGroupIds.has(g.id) || g.created_by === userId || ['guest_admin', 'guest_lead', 'external_user'].includes(g.role));
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
                if (myGroupIds.includes(p.group_id)) {
                    if (p.scope === 'document' && p.document_id) myPerms[`doc_${p.document_id}`] = p;
                    if (p.scope === 'folder' && p.folder_id) myPerms[`fol_${p.folder_id}`] = p;
                }
            });
        }

        const isFullAccess = ['super_admin', 'admin', 'sub_admin'].includes(session.role);

        const allowedFolders = (foldersData || []).filter(f => {
            if (isFullAccess) return true;
            if (f.created_by === session.id && f.creator_revoked !== true) return true;
            return myPerms[`fol_${f.id}`]?.can_view === true;
        });

        const allowedDocs = (docsData || []).filter(doc => {
            if (isFullAccess) return true;
            if (doc.uploaded_by === session.id && doc.creator_revoked !== true) return true;
            if (myPerms[`doc_${doc.id}`]?.can_view === true) return true;
            if (doc.folder_id && myPerms[`fol_${doc.folder_id}`]?.can_view === true) return true;
            return false;
        }).map((doc, idx) => ({ ...doc, displayIndex: (idx + 1).toString() }));

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
