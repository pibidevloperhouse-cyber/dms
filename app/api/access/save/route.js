import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const { session, changes, groupId } = await req.json();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!groupId) {
            return NextResponse.json(
                { error: 'groupId is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(changes)) {
            return NextResponse.json(
                { error: 'changes must be an array' },
                { status: 400 }
            );
        }

        // Collect all distinct group IDs from changes
        const groupIds = Array.from(new Set(changes.map(c => c.groupId || groupId).filter(Boolean)));
        if (groupIds.length === 0 && groupId) groupIds.push(groupId);

        // Fetch groups to determine company_id
        const { data: groupsInfo } = await supabase
            .from('groups')
            .select('id, company_id')
            .in('id', groupIds);

        const groupCompMap = new Map();
        (groupsInfo || []).forEach(g => groupCompMap.set(g.id, g.company_id));

        // Get existing permissions for these groups
        const { data: existingPerms, error: fetchErr } = await supabase
            .from('permissions')
            .select('id, scope, document_id, folder_id, group_id')
            .in('group_id', groupIds);

        if (fetchErr) {
            throw fetchErr;
        }

        const existingMap = new Map();
        (existingPerms || []).forEach(p => {
            const key = `${p.group_id}_${p.scope}_${p.document_id || p.folder_id}`;
            existingMap.set(key, p.id);
        });

        // Also fetch members of these groups to keep direct user records in sync
        const { data: uGroups } = await supabase
            .from('user_groups')
            .select('user_id, group_id')
            .in('group_id', groupIds);

        const groupMembersMap = new Map();
        (uGroups || []).forEach(ug => {
            if (!groupMembersMap.has(ug.group_id)) groupMembersMap.set(ug.group_id, []);
            groupMembersMap.get(ug.group_id).push(ug.user_id);
        });

        const memberUserIds = Array.from(new Set((uGroups || []).map(ug => ug.user_id).filter(Boolean)));
        let existingUserMap = new Map();
        if (memberUserIds.length > 0) {
            const { data: existingUserPerms } = await supabase
                .from('permissions')
                .select('id, user_id, document_id, folder_id, scope')
                .in('user_id', memberUserIds);

            (existingUserPerms || []).forEach(p => {
                const key = `${p.user_id}_${p.scope}_${p.document_id || p.folder_id}`;
                existingUserMap.set(key, p.id);
            });
        }

        const toInsert = [];
        const toUpdate = [];
        const now = new Date().toISOString();

        for (const change of changes) {
            const { targetId, type, updatedState } = change;
            const targetGroupId = change.groupId || groupId;
            const scope = type === 'doc' ? 'document' : 'folder';
            const companyId = groupCompMap.get(targetGroupId) || session.company_id;

            const permData = {
                company_id: companyId,
                scope,
                document_id: type === 'doc' ? targetId : null,
                folder_id: type === 'fol' ? targetId : null,
                can_view: updatedState?.can_view ?? false,
                can_edit: updatedState?.can_edit ?? false,
                can_upload: updatedState?.can_upload ?? false,
                can_download_secure: updatedState?.can_download_secure ?? false,
                can_download_original: updatedState?.can_download_original ?? false,
                can_delete: updatedState?.can_delete ?? false,
                can_redact: updatedState?.can_redact ?? false,
                updated_at: now
            };

            const existingGroupPermId = existingMap.get(`${targetGroupId}_${scope}_${targetId}`);

            if (existingGroupPermId) {
                toUpdate.push({
                    id: existingGroupPermId,
                    payload: { ...permData, group_id: targetGroupId }
                });
            } else {
                toInsert.push({
                    ...permData,
                    group_id: targetGroupId
                });
            }

            // Sync direct permissions for members of this group
            const members = groupMembersMap.get(targetGroupId) || [];
            for (const uId of members) {
                const existingUserPermId = existingUserMap.get(`${uId}_${scope}_${targetId}`);
                if (existingUserPermId) {
                    toUpdate.push({
                        id: existingUserPermId,
                        payload: {
                            ...permData,
                            user_id: uId
                        }
                    });
                }
            }
        }

        // Batch insert and parallel updates
        if (toInsert.length > 0) {
            const { error: insertErr } = await supabase.from('permissions').insert(toInsert);
            if (insertErr) throw insertErr;
        }

        if (toUpdate.length > 0) {
            await Promise.all(
                toUpdate.map(u =>
                    supabase.from('permissions').update(u.payload).eq('id', u.id)
                )
            );
        }

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('Access save error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}
