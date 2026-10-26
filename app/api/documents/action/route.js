import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 🔒 Service Role: Full DB Access
);

export async function POST(req) {
    try {
        const { action, payload, session } = await req.json();

        if (!session || !session.company_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const companyId = session.company_id;
        const userId = session.id;

        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

        switch (action) {
            case 'create_folder':
                let { parentId, name, index } = payload;
                if (!index) {
                    let idxQ = supabase
                        .from('folders')
                        .select('index_number')
                        .eq('company_id', companyId)
                        .eq('is_deleted', false);
                    if (session.active_workspace_id) idxQ = idxQ.eq('workspace_id', session.active_workspace_id);
                    else idxQ = idxQ.is('workspace_id', null);
                    if (parentId) idxQ = idxQ.eq('parent_folder_id', parentId);
                    else idxQ = idxQ.is('parent_folder_id', null);
                    const { data: existing } = await idxQ;
                    const maxIdx = (existing || []).reduce((max, f) => Math.max(max, parseInt(f.index_number, 10) || 0), 0);
                    index = maxIdx + 1;
                }
                const { data: newFolData, error: cfErr } = await supabase.from('folders').insert({
                    company_id: companyId, 
                    workspace_id: session.active_workspace_id || null,
                    parent_folder_id: parentId || null,
                    name: name, index_number: index, created_by: userId
                }).select().single();
                if (cfErr) throw cfErr;
                return NextResponse.json({ success: true, folder: newFolData });

            case 'rename':
                const { itemId, type, newName } = payload;
                const table = type === 'folder' ? 'folders' : 'documents';
                const { error: renErr } = await supabase.from(table)
                    .update({ name: newName })
                    .eq('id', itemId).eq('company_id', companyId);
                if (renErr) throw renErr;
                break;

            case 'bookmark':
                const { id: bmId, itemType, isBookmarked } = payload;
                const bmTable = itemType === 'folder' ? 'folders' : 'documents';
                await supabase.from(bmTable).update({ is_bookmarked: !isBookmarked }).eq('id', bmId);
                break;

            case 'trash':
                const { docIds: tDocs, folderIds: tFolders } = payload;
                if (tDocs.length > 0) {
                    let docMap = {};
                    try {
                        const { data: dItems } = await supabase.from('documents').select('id, name, workspace_id').in('id', tDocs);
                        if (dItems) docMap = dItems.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
                    } catch (e) {}
                    await supabase.from('documents').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).in('id', tDocs);
                    for (const dId of tDocs) {
                        await supabase.from('document_edit_logs').insert([{
                            user_id: userId,
                            document_id: dId,
                            action_type: 'DELETE',
                            metadata: {
                                ip_address: clientIp,
                                mode: 'trash',
                                file_name: docMap[dId]?.name || null,
                                workspace_id: docMap[dId]?.workspace_id || null,
                            },
                            changed_at: new Date().toISOString()
                        }]);
                    }
                }
                if (tFolders.length > 0) await supabase.from('folders').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: userId }).in('id', tFolders);
                break;

            case 'recover':
                const { docIds: rDocs, folderIds: rFolders } = payload;
                if (rDocs.length > 0) await supabase.from('documents').update({ is_deleted: false, deleted_at: null, deleted_by: null }).in('id', rDocs);
                if (rFolders.length > 0) await supabase.from('folders').update({ is_deleted: false, deleted_at: null, deleted_by: null }).in('id', rFolders);
                break;

            case 'permanent_delete':
                const { docIds: pDocs, folderIds: pFolders } = payload;
                if (pDocs.length > 0) {
                    let docMap = {};
                    try {
                        const { data: dItems } = await supabase.from('documents').select('id, name, workspace_id').in('id', pDocs);
                        if (dItems) docMap = dItems.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
                    } catch (e) {}
                    for (const dId of pDocs) {
                        await supabase.from('document_edit_logs').insert([{
                            user_id: userId,
                            document_id: dId,
                            action_type: 'DELETE',
                            metadata: {
                                ip_address: clientIp,
                                mode: 'permanent',
                                file_name: docMap[dId]?.name || null,
                                workspace_id: docMap[dId]?.workspace_id || null,
                            },
                            changed_at: new Date().toISOString()
                        }]);
                    }
                    await supabase.from('documents').delete().in('id', pDocs);
                }
                if (pFolders.length > 0) await supabase.from('folders').delete().in('id', pFolders);
                break;

            case 'move':
                const { docIds: mDocs, folderIds: mFolders, targetFolderId } = payload;
                if (mDocs.length > 0) await supabase.from('documents').update({ folder_id: targetFolderId }).in('id', mDocs);
                if (mFolders.length > 0) await supabase.from('folders').update({ parent_folder_id: targetFolderId }).in('id', mFolders);
                break;

            case 'reindex':
                // Handles the drag and drop re-ordering logic bulk updates
                const { folderUpdates, docUpdates } = payload;
                if (folderUpdates.length > 0) {
                    await Promise.all(folderUpdates.map(u => supabase.from('folders').update({ index_number: u.index_number }).eq('id', u.id)));
                }
                if (docUpdates.length > 0) {
                    await Promise.all(docUpdates.map(u => supabase.from('documents').update({ index: u.index }).eq('id', u.id)));
                }
                break;

            default:
                throw new Error("Unknown action");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Action API crash:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}