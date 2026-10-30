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

        // 1. Fetch document metadata
        const { data: doc, error: docErr } = await supabase
            .from('documents')
            .select('name, folder_id, uploaded_by, creator_revoked, file_path, dek_ref, company_id, is_redacted, workspace_id')
            .eq('id', docId)
            .single();

        if (docErr || !doc) {
            return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
        }

        // 2. Access Control Verification
        let hasAccess = false;
        if (session.role === 'super_admin' || (doc.uploaded_by === session.id && !doc.creator_revoked)) {
            hasAccess = true;
        } else {
            const { data: groups } = await supabase
                .from('user_groups')
                .select('group_id')
                .eq('user_id', session.id);

            if (groups && groups.length > 0) {
                const groupIds = groups.map(g => g.group_id);

                // Fetch permissions for these groups
                const { data: perms } = await supabase
                    .from('permissions')
                    .select('can_view, scope, document_id, folder_id')
                    .in('group_id', groupIds);

                if (perms) {
                    const docPerms = perms.filter(p => p.scope === 'document' && p.document_id === docId);
                    const folderPerms = perms.filter(p => p.scope === 'folder' && p.folder_id === doc.folder_id);

                    if (docPerms.length > 0) {
                        if (docPerms.some(p => p.can_view)) hasAccess = true;
                    }
                    else if (folderPerms.length > 0) {
                        if (folderPerms.some(p => p.can_view)) hasAccess = true;
                    }
                }
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ success: false, error: 'You do not have permission to view this document.' }, { status: 403 });
        }

        // 3. Download and Decrypt File
        const { data: fileData, error: fileErr } = await supabase.storage
            .from('vault-files')
            .download(doc.file_path);

        if (fileErr || !fileData) {
            return NextResponse.json({ success: false, error: 'Encrypted file not found in storage bucket.' }, { status: 404 });
        }

        const encryptedText = await fileData.text();
        const secret = new fernet.Secret(doc.dek_ref);
        const token = new fernet.Token({ token: encryptedText, secret, ttl: 0 });
        const decryptedBase64 = token.decode(); // This returns base64 string directly

        const fileExt = doc.name.split('.').pop().toLowerCase();

        // Extract client IP address
        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        let clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

        // Check if the client is connecting via loopback/localhost
        const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('localhost');
        if (isLoopback) {
            const os = require('os');
            const nets = os.networkInterfaces();
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                    if (net.family === 'IPv4' && !net.internal) {
                        clientIp = net.address;
                        break;
                    }
                }
                if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientIp) && !clientIp.includes('localhost')) {
                    break;
                }
            }
        }

        // 4. Log document view
        const { data: logRes, error: logErr } = await supabase
            .from('document_access_logs')
            .insert({ user_id: session.id, document_id: docId, opened_at: new Date().toISOString() })
            .select('id')
            .single();

        if (logErr) {
            console.error('[VIEW API] Log failed:', logErr);
        }

        const accessLogId = logRes?.id || null;

        // Check if document has an active redacted version
        const { data: redDoc } = await supabase
            .from('redacted_documents')
            .select('redacted_path')
            .eq('document_id', docId)
            .maybeSingle();

        const isRedactedDoc = Boolean(doc.is_redacted || redDoc?.redacted_path);

        // Record VIEW entry in document_edit_logs with redaction fidelity
        await supabase.from('document_edit_logs').insert([{
            user_id: session.id,
            document_id: docId,
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

        // 5. Fetch Watermark & Branding Settings
        let brandLogo = null;
        let watermarkSettings = null;

        if (doc.company_id || session.company_id) {
            const cid = doc.company_id || session.company_id;

            // Branding Logo
            const { data: wsData } = await supabase
                .from('workspace_settings')
                .select('logo_url')
                .eq('company_id', cid)
                .single();
            if (wsData?.logo_url) brandLogo = wsData.logo_url;

            // Watermark Settings
            const { data: wmSettings } = await supabase
                .from('watermark_settings')
                .select('*')
                .eq('company_id', cid)
                .limit(1)
                .single();

            if (wmSettings) {
                // Apply schema cache workarounds
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
