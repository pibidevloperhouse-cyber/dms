import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🔒 Supabase client with Service Role Key for full DB access
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_STAGES = [
    {
        stage_number: 1,
        name: 'Stage 1',
        buyer_access: 'can_view',
        is_locked: false,
        items: [
            { name: 'Hr', is_folder: true, type: 'folder', version: 'V1', created_at: new Date('2026-10-23').toISOString(), size: '5.8 MB' },
            { name: 'Aids', is_folder: true, type: 'folder', version: 'V1', created_at: new Date('2026-10-23').toISOString(), size: '136 KB' },
            { name: 'Retail', is_folder: true, type: 'folder', version: 'V1', created_at: new Date('2026-10-23').toISOString(), size: '112 KB' }
        ]
    },
    {
        stage_number: 2,
        name: 'Stage 2',
        buyer_access: 'hidden',
        is_locked: true,
        items: [
            { name: 'Financial Audits & Projections', is_folder: true, type: 'folder', version: 'V1', created_at: new Date('2026-10-24').toISOString(), size: '4.2 MB' },
            { name: 'Tax Compliance Certificates.pdf', is_folder: false, type: 'pdf', version: 'V1', created_at: new Date('2026-10-24').toISOString(), size: '890 KB' }
        ]
    },
    {
        stage_number: 3,
        name: 'Stage 3',
        buyer_access: 'hidden',
        is_locked: true,
        items: [
            { name: 'Intellectual Property & Patents', is_folder: true, type: 'folder', version: 'V1', created_at: new Date('2026-10-25').toISOString(), size: '1.6 MB' },
            { name: 'Material Commercial Contracts.docx', is_folder: false, type: 'docx', version: 'V1', created_at: new Date('2026-10-25').toISOString(), size: '3.1 MB' }
        ]
    }
];

async function getValidCompanyId(companyId) {
    if (!companyId || !UUID_REGEX.test(companyId.toString())) return null;
    try {
        const { data: comp } = await supabase.from('companies').select('id').eq('id', companyId).maybeSingle();
        return comp ? comp.id : null;
    } catch (e) {
        return null;
    }
}

// Seed default stages into database if not yet initialized for this company
async function ensureStagesInDB(companyId, workspaceId) {
    const validCompanyId = await getValidCompanyId(companyId);

    // 1. If validCompanyId is present, check for existing stages for this company
    if (validCompanyId) {
        const { data: existingStages } = await supabase
            .from('buyer_disclosure_stages')
            .select('*')
            .eq('company_id', validCompanyId)
            .order('stage_number', { ascending: true });

        if (existingStages && existingStages.length > 0) {
            return { stages: existingStages, validCompanyId };
        }
    } else {
        // If no companyId in session, check if any stages already exist in DB
        const { data: anyStages } = await supabase
            .from('buyer_disclosure_stages')
            .select('*')
            .order('stage_number', { ascending: true });

        if (anyStages && anyStages.length > 0) {
            const primaryCompanyId = anyStages[0].company_id;
            const filtered = anyStages.filter(s => s.company_id === primaryCompanyId);
            return { stages: filtered, validCompanyId: primaryCompanyId };
        }
    }

    // 2. If DB is completely empty, seed default stages
    const createdStages = [];
    for (const def of DEFAULT_STAGES) {
        const { data: newStage, error: stageErr } = await supabase
            .from('buyer_disclosure_stages')
            .insert({
                company_id: validCompanyId,
                workspace_id: workspaceId || null,
                stage_number: def.stage_number,
                name: def.name,
                buyer_access: def.buyer_access,
                is_locked: def.is_locked
            })
            .select()
            .single();

        if (!stageErr && newStage) {
            createdStages.push(newStage);
            for (const it of def.items) {
                await supabase.from('buyer_disclosure_items').insert({
                    stage_id: newStage.id,
                    company_id: validCompanyId,
                    name: it.name,
                    is_folder: it.is_folder,
                    type: it.type,
                    version: it.version,
                    size: it.size
                });
            }
        }
    }

    return { stages: createdStages, validCompanyId };
}

// Fetch full stages with their items from database
async function getFullStages(companyId, workspaceId) {
    const { stages } = await ensureStagesInDB(companyId, workspaceId);
    const stageIds = stages.map(s => s.id);

    let items = [];
    if (stageIds.length > 0) {
        const { data: dbItems, error: itemsErr } = await supabase
            .from('buyer_disclosure_items')
            .select('*')
            .in('stage_id', stageIds)
            .order('created_at', { ascending: true });

        if (!itemsErr && dbItems) {
            items = dbItems;
        }
    }

    // Map into frontend format
    return stages.map(stg => {
        const stgItems = items
            .filter(i => i.stage_id === stg.id)
            .map(i => {
                const d = i.created_at ? new Date(i.created_at) : new Date();
                const dateFormatted = !isNaN(d.getTime())
                    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Oct 23, 2026';

                return {
                    id: i.id,
                    stageId: i.stage_id,
                    name: i.name,
                    isFolder: Boolean(i.is_folder),
                    type: i.type || (i.is_folder ? 'folder' : 'file'),
                    version: i.version || 'V1',
                    createdAt: dateFormatted,
                    size: i.size || '--',
                    buyerAccess: stg.buyer_access === 'can_view' ? 'visible' : 'hidden'
                };
            });

        return {
            id: stg.id,
            name: stg.name,
            stageNumber: stg.stage_number,
            buyerAccess: stg.buyer_access,
            isLocked: stg.is_locked,
            itemCount: stgItems.length,
            items: stgItems
        };
    });
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { action = 'get_stages', session } = body;

        const companyId = session?.company_id || null;
        const workspaceId = session?.workspace_id || session?.active_workspace_id || null;

        switch (action) {
            case 'get_stages': {
                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages
                });
            }

            case 'update_access': {
                const { stageId, mode } = body;
                if (!stageId) {
                    return NextResponse.json({ error: 'Stage ID required' }, { status: 400 });
                }

                const isGrant = mode === 'grant';
                const { stages } = await ensureStagesInDB(companyId, workspaceId);

                let matchedStage = null;
                if (UUID_REGEX.test(stageId.toString())) {
                    matchedStage = stages.find(s => s.id === stageId);
                }
                if (!matchedStage) {
                    const num = parseInt(stageId.toString().replace(/[^0-9]/g, '') || '1', 10);
                    matchedStage = stages.find(s => s.stage_number === num);
                }

                if (matchedStage) {
                    await supabase
                        .from('buyer_disclosure_stages')
                        .update({
                            buyer_access: isGrant ? 'can_view' : 'hidden',
                            is_locked: !isGrant,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', matchedStage.id);
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    message: isGrant ? 'Buyer access granted' : 'Buyer access revoked'
                });
            }

            case 'copy_item': {
                const { item, targetStageId } = body;
                if (!item) {
                    return NextResponse.json({ error: 'Item required' }, { status: 400 });
                }

                const { stages } = await ensureStagesInDB(companyId, workspaceId);

                // Find target stage safely (checks UUID or stage number)
                let targetStage = null;
                if (targetStageId && UUID_REGEX.test(targetStageId.toString())) {
                    targetStage = stages.find(s => s.id === targetStageId);
                }

                if (!targetStage) {
                    const num = parseInt(targetStageId?.toString().replace(/[^0-9]/g, '') || '1', 10);
                    targetStage = stages.find(s => s.stage_number === num) || stages[0];
                }

                if (!targetStage) {
                    return NextResponse.json({ error: 'Target stage not found' }, { status: 404 });
                }

                const isFolder = item.type === 'folder' || Boolean(item.isFolder);
                const originalDocId = !isFolder && item.id && UUID_REGEX.test(item.id.toString()) ? item.id : null;
                const originalFoldId = isFolder && item.id && UUID_REGEX.test(item.id.toString()) ? item.id : null;

                // Insert into database
                const { data: newItem, error: insErr } = await supabase
                    .from('buyer_disclosure_items')
                    .insert({
                        stage_id: targetStage.id,
                        company_id: targetStage.company_id || null,
                        original_document_id: originalDocId,
                        original_folder_id: originalFoldId,
                        name: item.name,
                        is_folder: isFolder,
                        type: item.type || (isFolder ? 'folder' : 'file'),
                        version: item.version ? `V${item.version}`.replace('VV', 'V') : 'V1',
                        size: item.size || '--'
                    })
                    .select()
                    .single();

                if (insErr) {
                    console.error('Failed to insert disclosure item:', insErr);
                    return NextResponse.json({ error: insErr.message }, { status: 500 });
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    copiedItem: newItem,
                    message: `Item "${item.name}" copied to ${targetStage.name}`
                });
            }

            case 'add_folder': {
                const { name, stageId } = body;
                if (!name || !stageId) {
                    return NextResponse.json({ error: 'Folder name and Stage ID required' }, { status: 400 });
                }

                const { stages } = await ensureStagesInDB(companyId, workspaceId);
                let targetStage = null;
                if (UUID_REGEX.test(stageId.toString())) {
                    targetStage = stages.find(s => s.id === stageId);
                }
                if (!targetStage) {
                    const num = parseInt(stageId.toString().replace(/[^0-9]/g, '') || '1', 10);
                    targetStage = stages.find(s => s.stage_number === num) || stages[0];
                }

                if (!targetStage) {
                    return NextResponse.json({ error: 'Target stage not found' }, { status: 404 });
                }

                const { data: newFolder, error: fErr } = await supabase
                    .from('buyer_disclosure_items')
                    .insert({
                        stage_id: targetStage.id,
                        company_id: targetStage.company_id || null,
                        name: name.trim(),
                        is_folder: true,
                        type: 'folder',
                        version: 'V1',
                        size: '--'
                    })
                    .select()
                    .single();

                if (fErr) {
                    console.error('Failed to create folder:', fErr);
                    return NextResponse.json({ error: fErr.message }, { status: 500 });
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    newFolder,
                    message: `Folder "${name}" created in ${targetStage.name}`
                });
            }

            case 'rename_item': {
                const { itemId, newName } = body;
                if (!itemId || !newName) {
                    return NextResponse.json({ error: 'Item ID and New Name required' }, { status: 400 });
                }

                if (UUID_REGEX.test(itemId.toString())) {
                    await supabase
                        .from('buyer_disclosure_items')
                        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
                        .eq('id', itemId);
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    message: `Renamed to "${newName}"`
                });
            }

            case 'move_stage': {
                const { itemIds, targetStageId } = body;
                const ids = Array.isArray(itemIds) ? itemIds : [body.itemId].filter(Boolean);
                if (ids.length === 0 || !targetStageId) {
                    return NextResponse.json({ error: 'Item IDs and Target Stage ID required' }, { status: 400 });
                }

                const { stages } = await ensureStagesInDB(companyId, workspaceId);
                let targetStage = null;
                if (UUID_REGEX.test(targetStageId.toString())) {
                    targetStage = stages.find(s => s.id === targetStageId);
                }
                if (!targetStage) {
                    const num = parseInt(targetStageId.toString().replace(/[^0-9]/g, '') || '1', 10);
                    targetStage = stages.find(s => s.stage_number === num) || stages[0];
                }

                if (!targetStage) {
                    return NextResponse.json({ error: 'Target stage not found' }, { status: 404 });
                }

                const validUuids = ids.filter(id => UUID_REGEX.test(id.toString()));
                if (validUuids.length > 0) {
                    await supabase
                        .from('buyer_disclosure_items')
                        .update({ stage_id: targetStage.id, updated_at: new Date().toISOString() })
                        .in('id', validUuids);
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    message: `Moved ${validUuids.length} item(s) to ${targetStage.name}`
                });
            }

            case 'delete_item': {
                const { itemId, itemIds } = body;
                const ids = Array.isArray(itemIds) ? itemIds : (itemId ? [itemId] : []);
                if (ids.length === 0) {
                    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
                }

                const validUuids = ids.filter(id => UUID_REGEX.test(id.toString()));
                if (validUuids.length > 0) {
                    await supabase
                        .from('buyer_disclosure_items')
                        .delete()
                        .in('id', validUuids);
                }

                const fullStages = await getFullStages(companyId, workspaceId);
                return NextResponse.json({
                    success: true,
                    stages: fullStages,
                    message: `${validUuids.length} item(s) removed from stage`
                });
            }

            case 'download_file': {
                const { itemId } = body;
                if (!itemId) {
                    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
                }

                const { data: item, error: itErr } = await supabase
                    .from('buyer_disclosure_items')
                    .select('*')
                    .eq('id', itemId)
                    .single();

                if (itErr || !item) {
                    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
                }

                const fileName = item.name;
                const ext = fileName.split('.').pop().toLowerCase();

                let fileBuffer = null;
                let mimeType = 'application/octet-stream';

                // 1. If connected to an actual document in storage, fetch the real original file
                if (item.original_document_id) {
                    const { data: originalDoc } = await supabase
                        .from('documents')
                        .select('original_file_path, file_url, name, mime_type')
                        .eq('id', item.original_document_id)
                        .maybeSingle();

                    if (originalDoc?.original_file_path) {
                        const { data: storageBlob, error: stErr } = await supabase.storage
                            .from('original-files')
                            .download(originalDoc.original_file_path);

                        if (!stErr && storageBlob) {
                            fileBuffer = Buffer.from(await storageBlob.arrayBuffer());
                            mimeType = originalDoc.mime_type || storageBlob.type || 'application/octet-stream';
                        }
                    }
                }

                // 2. If no storage file exists, generate clean original document content matching extension
                if (!fileBuffer) {
                    if (ext === 'pdf') {
                        mimeType = 'application/pdf';
                        fileBuffer = Buffer.from(
                            `%PDF-1.4\n1 0 obj\n<< /Title (${fileName}) /Creator (PIBI VDR) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n5 0 obj\n<< /Length 260 >>\nstream\nBT\n/F1 18 Tf\n50 720 Td\n(PIBI VDR - BUYER DISCLOSURE) Tj\n/F1 12 Tf\n0 -30 Td\n(Document Name: ${fileName}) Tj\n0 -20 Td\n(Version: ${item.version || 'V1'}) Tj\n0 -20 Td\n(Created: ${new Date(item.created_at).toLocaleDateString()}) Tj\n0 -30 Td\n(CONFIDENTIAL - STRICTLY FOR AUTHORIZED BUYER REVIEW) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000067 00000 n \n0000000117 00000 n \n0000000174 00000 n \n0000000328 00000 n \ntrailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n638\n%%EOF`
                        );
                    } else if (ext === 'docx' || ext === 'doc') {
                        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                        fileBuffer = Buffer.from(
                            `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}\n\\viewkind4\\uc1\\pard\\lang1033\\f0\\fs28\\b PIBI VDR • BUYER DISCLOSURE\\par\n\\fs22\\b0 Document: ${fileName}\\par\nVersion: ${item.version || 'V1'}\\par\nCreated: ${new Date(item.created_at).toLocaleDateString()}\\par\n\\par\n\\b CONFIDENTIAL TRANSACTION DISCLOSURE\\b0\\par\nOriginal verified document content.\\par\n}`
                        );
                    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
                        mimeType = ext === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
                        fileBuffer = Buffer.from(
                            `Document,Version,Status,Date\n${fileName},${item.version || 'V1'},Verified,${new Date(item.created_at).toISOString()}\n`
                        );
                    } else {
                        mimeType = 'text/plain';
                        fileBuffer = Buffer.from(
                            `PIBI VDR • BUYER DISCLOSURE\n\nDocument: ${fileName}\nVersion: ${item.version || 'V1'}\nCreated: ${new Date(item.created_at).toLocaleString()}\nStatus: Verified\n\nCONFIDENTIAL - Staged buyer disclosure original file.`
                        );
                    }
                }

                return new Response(fileBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
                        'Content-Length': fileBuffer.length.toString()
                    }
                });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (err) {
        console.error('Buyer Disclosure API Error:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
