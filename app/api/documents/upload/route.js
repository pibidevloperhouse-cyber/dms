import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fernet from 'fernet';
import crypto from 'crypto'; // Native Node.js crypto

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 🔒 Service Role required for backend storage!
);

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        let company_id = formData.get('company_id');
        let workspace_id = formData.get('workspace_id');
        let folder_id = formData.get('folder_id');
        let uploaded_by = formData.get('uploaded_by');
        const index = formData.get('index');

        if (!file) throw new Error("No file provided");

        // Sanitize UUID parameters (clean empty string, "null", "undefined")
        if (workspace_id === '' || workspace_id === 'null' || workspace_id === 'undefined') {
            workspace_id = null;
        }
        if (folder_id === '' || folder_id === 'null' || folder_id === 'undefined') {
            folder_id = null;
        }
        if (uploaded_by === '' || uploaded_by === 'null' || uploaded_by === 'undefined') {
            uploaded_by = null;
        }
        if (!company_id || company_id === '' || company_id === 'null' || company_id === 'undefined') {
            if (uploaded_by) {
                const { data: u } = await supabase.from('users').select('company_id').eq('id', uploaded_by).single();
                if (u?.company_id) company_id = u.company_id;
            }
        }
        if (!company_id || company_id === 'null' || company_id === 'undefined') {
            company_id = 'default';
        }

        // Convert the uploaded file into a raw Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Define Dual Bucket Paths
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^\w.-]/g, '_');
        const originalStoragePath = `${company_id}/original_${timestamp}_${safeFileName}`;
        const secureStoragePath = `${company_id}/secure_${timestamp}_${safeFileName}`;

        // 2. Upload RAW Original to the 'original-files' bucket
        const { error: origErr } = await supabase.storage
            .from('original-files')
            .upload(originalStoragePath, buffer, { contentType: file.type || 'application/octet-stream' });
        if (origErr) throw new Error("Original Upload Failed: " + origErr.message);

        // 3. Optional: Convert PPT/PPTX to PDF for Secure Vault
        let bufferToEncrypt = buffer;
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        if (['ppt', 'pptx'].includes(fileExt) && process.env.CONVERTAPI_SECRET) {
            try {
                const convertapi = require('convertapi')(process.env.CONVERTAPI_SECRET);
                const os = require('os');
                const path = require('path');
                const fs = require('fs').promises;
                
                const tempInputPath = path.join(os.tmpdir(), `temp_${timestamp}_${safeFileName}`);
                await fs.writeFile(tempInputPath, buffer);
                
                const result = await convertapi.convert('pdf', { File: tempInputPath }, fileExt);
                const pdfUrl = result.response.Files[0].Url;
                const pdfResponse = await fetch(pdfUrl);
                bufferToEncrypt = Buffer.from(await pdfResponse.arrayBuffer());
                
                await fs.unlink(tempInputPath).catch(() => {});
            } catch (err) {
                console.warn("ConvertAPI conversion error, falling back to original buffer:", err.message);
                bufferToEncrypt = buffer;
            }
        }

        // 4. Encrypt for the Secure Vault
        // Generate a true random 32-byte AES key
        const randomBytes = crypto.randomBytes(32);
        const fernetKey = randomBytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const secret = new fernet.Secret(fernetKey);
        const token = new fernet.Token({ secret: secret });

        // Fernet requires Base64 text to encrypt, so we convert the buffer to Base64 first
        const base64Data = bufferToEncrypt.toString('base64');
        const encryptedString = token.encode(base64Data);

        // 4. Upload Encrypted text to 'vault-files' bucket
        const { error: secureErr } = await supabase.storage
            .from('vault-files')
            .upload(secureStoragePath, Buffer.from(encryptedString), { contentType: 'text/plain' });
        if (secureErr) throw new Error("Secure Upload Failed: " + secureErr.message);

        // 5. Save all metadata to the Postgres Database
        if (folder_id === '') folder_id = null; // Clean up empty strings

        const isNewVersion = formData.get('isNewVersion') === 'true';
        const upload_comment = formData.get('upload_comment') || null;
        const existing_document_id = formData.get('existing_document_id') || null;
        
        let docData;
        
        if (isNewVersion && existing_document_id) {
            // Fetch existing document
            const { data: existingDoc, error: fetchErr } = await supabase.from('documents').select('*').eq('id', existing_document_id).single();
            if (fetchErr) throw new Error("Failed to fetch existing document: " + fetchErr.message);
            
            // 1. Copy to document_versions
            const { error: versionErr } = await supabase.from('document_versions').insert({
                document_id: existingDoc.id,
                version_number: existingDoc.version || 1,
                name: existingDoc.name,
                file_path: existingDoc.file_path,
                original_file_path: existingDoc.original_file_path,
                storage_bucket: 'vault-files', 
                mime_type: existingDoc.mime_type,
                file_size_bytes: existingDoc.file_size_bytes,
                workspace_id: existingDoc.workspace_id,
                company_id: existingDoc.company_id,
                folder_id: existingDoc.folder_id,
                dek_ref: existingDoc.dek_ref,
                security: existingDoc.security,
                creator_revoked: existingDoc.creator_revoked,
                is_redacted: existingDoc.is_redacted,
                index: existingDoc.index,
                file_data: existingDoc.file_data,
                uploaded_by: existingDoc.uploaded_by,
                created_at: existingDoc.created_at,
                upload_comment: existingDoc.upload_comment
            });
            if (versionErr) throw new Error("Failed to save version history: " + versionErr.message);
            
            // 2. Update existing document
            const { data: updatedDoc, error: updateErr } = await supabase.from('documents').update({
                file_path: secureStoragePath,
                original_file_path: originalStoragePath,
                mime_type: file.type || 'application/octet-stream',
                file_size_bytes: file.size,
                dek_ref: fernetKey,
                uploaded_by: uploaded_by,
                version: (existingDoc.version || 1) + 1,
                upload_comment: upload_comment,
                updated_at: new Date().toISOString()
            }).eq('id', existing_document_id).select('id').single();
            if (updateErr) throw new Error("Database update failed: " + updateErr.message);
            docData = updatedDoc;
            
        } else {
            // Normal insert
            const { data: newDoc, error: dbErr } = await supabase.from('documents').insert({
                company_id: company_id,
                workspace_id: workspace_id || null,
                folder_id: folder_id,
                uploaded_by: uploaded_by,
                name: file.name,
                file_path: secureStoragePath,
                original_file_path: originalStoragePath,
                mime_type: file.type || 'application/octet-stream',
                file_size_bytes: file.size,
                dek_ref: fernetKey,
                index: index,
                security: 'Fernet Encrypted',
                version: 1,
                upload_comment: upload_comment
            }).select('id').single();

            if (dbErr) throw new Error("Database sync failed: " + dbErr.message);
            docData = newDoc;
        }

        // 6. Log UPLOAD activity with IP address
        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || '127.0.0.1');

        if (uploaded_by) {
            try {
                await supabase.from('document_edit_logs').insert([{
                    user_id: uploaded_by,
                    document_id: docData.id,
                    action_type: 'UPLOAD',
                    metadata: {
                        ip_address: clientIp,
                        file_name: file.name,
                        folder_id: folder_id
                    },
                    changed_at: new Date().toISOString()
                }]);
            } catch (logErr) {
                console.warn("Upload log insert non-fatal warning:", logErr.message);
            }
        }

        return NextResponse.json({ success: true, id: docData.id });

    } catch (e) {
        console.error("Upload API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}






// import { createClient } from '@supabase/supabase-js';
// import { NextResponse } from 'next/server';
// import fernet from 'fernet';
// import crypto from 'crypto';

// const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export async function POST(req) {
//     try {
//         const formData = await req.formData();
//         const file = formData.get('file');
//         const company_id = formData.get('company_id');
//         const folder_id = formData.get('folder_id') || null;
//         const uploaded_by = formData.get('uploaded_by');
//         const index = formData.get('index') || '1';

//         if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

//         const originalName = file.name;
//         const timestamp = Date.now();

//         const originalStoragePath = `${company_id}/original_${timestamp}_${originalName}`;
//         const secureStoragePath = `${company_id}/secure_${timestamp}_${originalName}`;

//         const fileBuffer = Buffer.from(await file.arrayBuffer());

//         // 1. Upload Original File Directly
//         await supabase.storage.from('original-files').upload(originalStoragePath, fileBuffer, { contentType: file.type });

//         // 2. Generate a valid Fernet Key (Must be 32 bytes/44 chars Base64)
//         const randomBytes = crypto.randomBytes(32);
//         // 🔥 CRITICAL: We keep the '=' padding so Fernet generates valid headers!
//         const fernetKey = randomBytes.toString('base64');

//         const secret = new fernet.Secret(fernetKey);
//         const token = new fernet.Token({ secret });

//         // 3. Encrypt Data
//         const base64Data = fileBuffer.toString('base64');
//         const encryptedString = token.encode(base64Data);

//         // 4. Upload Encrypted Data to Vault (as Text)
//         await supabase.storage.from('vault-files').upload(secureStoragePath, encryptedString, { contentType: 'text/plain' });

//         // 5. Insert Database Row
//         const { data: dbData, error: dbErr } = await supabase.from('documents').insert({
//             company_id: company_id,
//             folder_id: folder_id,
//             uploaded_by: uploaded_by,
//             name: originalName,
//             file_path: secureStoragePath,
//             original_file_path: originalStoragePath,
//             mime_type: file.type,
//             file_size_bytes: file.size,
//             dek_ref: fernetKey, // Saved with padding
//             index,
//             security: 'Fernet Encrypted',
//             is_deleted: false,
//             is_bookmarked: false,
//             is_downloaded: false,
//             version: 1
//         }).select('id').single();

//         if (dbErr) throw dbErr;
//         return NextResponse.json({ success: true, id: dbData.id });

//     } catch (error) {
//         console.error('Upload Error:', error);
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }



