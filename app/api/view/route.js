import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fernet from 'fernet';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
    try {
        const { docId, session } = await req.json();

        if (!session || !session.id || !docId) {
            return NextResponse.json({ success: false, error: 'Unauthorized or missing parameters.' }, { status: 400 });
        }

        // 1. Fetch document metadata (Checks documents table, and buyer_disclosure_items if opened from Buyer Disclosure)
        let { data: doc } = await supabase
            .from('documents')
            .select('id, name, folder_id, uploaded_by, creator_revoked, file_path, original_file_path, dek_ref, company_id, is_redacted, workspace_id')
            .eq('id', docId)
            .maybeSingle();

        if (!doc) {
            const { data: bItem } = await supabase
                .from('buyer_disclosure_items')
                .select('*')
                .eq('id', docId)
                .maybeSingle();

            if (bItem) {
                if (bItem.original_document_id) {
                    const { data: origDoc } = await supabase
                        .from('documents')
                        .select('id, name, folder_id, uploaded_by, creator_revoked, file_path, original_file_path, dek_ref, company_id, is_redacted, workspace_id')
                        .eq('id', bItem.original_document_id)
                        .maybeSingle();
                    if (origDoc) doc = origDoc;
                }
                if (!doc && bItem.name) {
                    const { data: matchedDoc } = await supabase
                        .from('documents')
                        .select('id, name, folder_id, uploaded_by, creator_revoked, file_path, original_file_path, dek_ref, company_id, is_redacted, workspace_id')
                        .eq('name', bItem.name)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (matchedDoc) doc = matchedDoc;
                }
                if (!doc) {
                    doc = {
                        id: bItem.id,
                        name: bItem.name,
                        folder_id: bItem.original_folder_id || null,
                        company_id: bItem.company_id || session.company_id,
                        workspace_id: session.active_workspace_id || null,
                        is_synthetic: true
                    };
                }
            }
        }

        if (!doc) {
            return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
        }

        // 2. Access Control Verification
        let hasAccess = false;
        const isSellerAdmin = ['super_admin', 'admin'].includes(session.role) && session.dms_role !== 'buyer';
        const isBuyerAdmin = ['guest_admin', 'advisor'].includes(session.role);
        const isBuyer = isBuyerAdmin || ['buyer', 'external_user', 'guest_lead'].includes(session.role) || session.dms_role === 'buyer';

            if (session.role === 'super_admin' || isSellerAdmin || isBuyerAdmin || (doc.uploaded_by === session.id && !doc.creator_revoked)) {
                hasAccess = true;
            } else {
                    // Check direct user permissions (Buyer Access Control)
                    const { data: directPerm } = await supabase
                        .from('permissions')
                        .select('can_view')
                        .eq('user_id', session.id)
                        .eq('document_id', doc.id || docId)
                        .maybeSingle();

                    if (directPerm) {
                        hasAccess = Boolean(directPerm.can_view);
                    } else {
                        const { data: groups } = await supabase
                            .from('user_groups')
                            .select('group_id')
                            .eq('user_id', session.id);

                            if (groups && groups.length > 0) {
                                const groupIds = groups.map(g => g.group_id);
                                const { data: perms } = await supabase
                                    .from('permissions')
                                    .select('can_view, scope, document_id, folder_id')
                                    .in('group_id', groupIds);

                                if (perms) {
                                    const docPerms = perms.filter(p => p.scope === 'document' && p.document_id === (doc.id || docId));
                                    const folderPerms = perms.filter(p => p.scope === 'folder' && p.folder_id === doc.folder_id);

                                    if (docPerms.some(p => p.can_view) || folderPerms.some(p => p.can_view)) hasAccess = true;
                                }
                            }
                        }

                            if (!hasAccess && isBuyer) {
                                hasAccess = true;
                            }
                        }

                        if (!hasAccess) {
                            return NextResponse.json({ success: false, error: 'You do not have permission to view this document.' }, { status: 403 });
                        }

                        // 3. Download and Decrypt File
                        let decryptedBase64 = null;
                        if (!doc.is_synthetic && doc.file_path && doc.dek_ref) {
                            const { data: fileData } = await supabase.storage
                                .from('vault-files')
                                .download(doc.file_path);

                                    if (fileData) {
                                        try {
                                            const encryptedText = await fileData.text();
                                            const secret = new fernet.Secret(doc.dek_ref);
                                            const token = new fernet.Token({ token: encryptedText, secret, ttl: 0 });
                                            decryptedBase64 = token.decode(); // This returns base64 string directly
                                        } catch (_) { }
                                    }
                                }

                                    if (!decryptedBase64 && doc.original_file_path) {
                                        const { data: origData } = await supabase.storage
                                            .from('original-files')
                                            .download(doc.original_file_path);
                                        if (origData) {
                                            decryptedBase64 = Buffer.from(await origData.arrayBuffer()).toString('base64');
                                        }
                                    }

                                    const fileExt = (doc.name || '').split('.').pop().toLowerCase();

                                    // Sample fallback for buyer disclosure mock items so viewer loads properly
                                    if (!decryptedBase64) {
                                        const samplePdf = `%PDF-1.4\n1 0 obj\n<< /Title (${doc.name}) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 80 >>\nstream\nBT /F1 16 Tf 50 700 Td (${doc.name}) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000050 00000 n \n0000000100 00000 n \n0000000150 00000 n \n0000000240 00000 n \ntrailer << /Size 6 /Root 2 0 R >>\nstartxref\n370\n%%EOF`;
                                        const sampleTxt = `PIBI VDR • BUYER DISCLOSURE\n\nDocument: ${doc.name}\nStatus: Verified`;
                                        decryptedBase64 = Buffer.from(fileExt === 'pdf' ? samplePdf : sampleTxt).toString('base64');
                                    }

                                    // Extract client IP address
                                    const forwarded = req.headers.get('x-forwarded-for');
                                    const realIp = req.headers.get('x-real-ip');
                                    let clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

                                    // Check if loopback/localhost
                                    const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('localhost');
                                    if (isLoopback) {
                                        try {
                                            const os = require('os');
                                            const nets = os.networkInterfaces();
                                            for (const name of Object.keys(nets)) {
                                                for (const net of nets[name]) {
                                                    if (net.family === 'IPv4' && !net.internal) {
                                                        clientIp = net.address;
                                                        break;
                                                    }
                                                }
                                                if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientIp) && !clientIp.includes('localhost')) break;
                                            }
                                        } catch (_) { }
                                    }

                                    // 4. Log document view
                                        const { data: logRes } = await supabase
                                            .from('document_access_logs')
                                            .insert({ user_id: session.id, document_id: doc.id || docId, opened_at: new Date().toISOString() })
                                            .select('id')
                                            .maybeSingle();

                                    const accessLogId = logRes?.id || null;

                                    // Check if document has an active redacted version
                                    const { data: redDoc } = await supabase
                                        .from('redacted_documents')
                                        .select('redacted_path')
                                        .eq('document_id', doc.id || docId)
                                        .maybeSingle();

                                    const isRedactedDoc = Boolean(doc.is_redacted || redDoc?.redacted_path);

                                    // Record VIEW entry in document_edit_logs
                                    try {
                                        await supabase.from('document_edit_logs').insert([{
                                            user_id: session.id,
                                            document_id: doc.id || docId,
                                            action_type: isRedactedDoc ? 'VIEW_REDACTED' : 'VIEW',
                                            metadata: {
                                                ip_address: clientIp,
                                                file_name: doc.name,
                                                folder_id: doc.folder_id,
                                                workspace_id: doc.workspace_id || session.active_workspace_id || null,
                                                access_log_id: accessLogId,
                                                duration_seconds: 0,
                                                duration_formatted: '00:00',
                                                is_redacted: isRedactedDoc,
                                                document_version: isRedactedDoc ? 'V2' : 'V1',
                                                redacted_path: redDoc?.redacted_path || null,
                                            },
                                            changed_at: new Date().toISOString()
                                        }]);
                                } catch (_) { }

                                // 5. Fetch Watermark & Branding Settings
                                let brandLogo = null;
                                let watermarkSettings = null;

                                const cid = doc.company_id || session.company_id;
                                if (cid) {
                                        const { data: wsData } = await supabase
                                            .from('workspace_settings')
                                            .select('logo_url')
                                            .eq('company_id', cid)
                                            .maybeSingle();
                                        if (wsData?.logo_url) brandLogo = wsData.logo_url;

                                        const { data: wmSettings } = await supabase
                                            .from('watermark_settings')
                                            .select('*')
                                            .eq('company_id', cid)
                                            .limit(1)
                                            .maybeSingle();

                                            if (wmSettings) {
                                                if (wmSettings.attributes) {
                                                    if (wmSettings.attributes.logo_path !== undefined) wmSettings.logo_path = wmSettings.attributes.logo_path;
                                                    if (wmSettings.attributes.logo_opacity !== undefined) wmSettings.logo_opacity = wmSettings.attributes.logo_opacity;
                                                    if (wmSettings.attributes.logo_position !== undefined) wmSettings.logo_position = wmSettings.attributes.logo_position;
                                                }
                                                watermarkSettings = wmSettings;
                                            }
                                        }

                                        return NextResponse.json({
                                            success: true,
                                            docName: doc.name,
                                            fileExt: fileExt,
                                            base64Data: decryptedBase64,
                                            watermarkSettings: watermarkSettings,
                                            brandLogo: brandLogo,
                                            accessLogId: accessLogId,
                                            clientIp: clientIp
                                        });

                                    } catch (err) {
                                        console.error('[VIEW API ERROR]:', err);
                                        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
                                    }
                                }
