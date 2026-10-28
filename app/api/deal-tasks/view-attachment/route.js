import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { dealTasks, documents } from '@/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import fernet from 'fernet';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujzgxebyrscawwejgboy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function getMimeType(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'txt': return 'text/plain';
    case 'html': return 'text/html';
    case 'csv': return 'text/csv';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return 'application/octet-stream';
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const fileId = searchParams.get('fileId');
    const rawFileName = searchParams.get('fileName') || searchParams.get('name') || '';
    const filePathParam = searchParams.get('filePath');
    const userRole = searchParams.get('userRole') || searchParams.get('role');
    const userName = searchParams.get('userName') || searchParams.get('user');

    const fileName = path.basename(rawFileName || 'document.pdf');
    const mime = getMimeType(fileName);

    // Rule: In Preparation stage sub admin to internal user task flow:
    // Internal user can only view attachments uploaded by themselves!
    if (taskId && userRole === 'internal_user') {
      const [task] = await db.select().from(dealTasks).where(eq(dealTasks.taskId, taskId)).limit(1);
      if (task && (task.dealStage === 'Preparation' || task.creatorRole === 'sub_admin')) {
        const userNorm = (userName || '').trim().toLowerCase();
        const attachments = Array.isArray(task.attachments) ? task.attachments : [];
        const targetAtt = attachments.find((a) => (fileId && a.id === fileId) || (a.name === fileName || a.fileName === fileName));
        if (targetAtt && targetAtt.uploadedBy) {
          const uploaderNorm = targetAtt.uploadedBy.trim().toLowerCase();
          if (uploaderNorm && uploaderNorm !== userNorm) {
            return NextResponse.json({
              error: 'Access Denied: In preparation stage, internal users can only view files they have uploaded.'
            }, { status: 403 });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 1. Check in public/uploads/deal-tasks/
    // -------------------------------------------------------------
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'deal-tasks');
    if (fs.existsSync(uploadsDir)) {
      // Direct match
      const directPath = path.join(uploadsDir, fileName);
      if (fs.existsSync(directPath)) {
        const fileBuffer = await fs.promises.readFile(directPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Check for prefix matches like ${taskId}_${fileName}
      const allFiles = await fs.promises.readdir(uploadsDir);
      const match = allFiles.find((f) => f.endsWith(`_${fileName}`) || f.includes(fileName));
      if (match) {
        const matchedPath = path.join(uploadsDir, match);
        const fileBuffer = await fs.promises.readFile(matchedPath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Check local directories on machine (e.g. D:\My Credentials)
    // -------------------------------------------------------------
    const possibleLocalPaths = [
      path.join('D:\\My Credentials', fileName),
      path.join(process.cwd(), 'public', fileName),
      filePathParam,
    ].filter(Boolean);

    for (const p of possibleLocalPaths) {
      if (fs.existsSync(p)) {
        const stat = await fs.promises.stat(p);
        if (stat.isFile()) {
          const fileBuffer = await fs.promises.readFile(p);
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': mime,
              'Content-Disposition': `inline; filename="${fileName}"`,
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Check deal_tasks in DB for attachment with base64/dataUrl
    // -------------------------------------------------------------
    if (taskId) {
      const [task] = await db.select().from(dealTasks).where(eq(dealTasks.taskId, taskId)).limit(1);
      if (task && Array.isArray(task.attachments)) {
        const att = task.attachments.find(
          (a) => (fileId && a.id === fileId) || (fileName && (a.name === fileName || a.fileName === fileName))
        );
        if (att) {
          if (att.dataUrl && att.dataUrl.includes(',')) {
            const base64Data = att.dataUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': att.mimeType || mime,
                'Content-Disposition': `inline; filename="${fileName}"`,
              },
            });
          }
          if (att.base64) {
            const buffer = Buffer.from(att.base64, 'base64');
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': att.mimeType || mime,
                'Content-Disposition': `inline; filename="${fileName}"`,
              },
            });
          }
          if (att.savedPath && fs.existsSync(att.savedPath)) {
            const buffer = await fs.promises.readFile(att.savedPath);
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': att.mimeType || mime,
                'Content-Disposition': `inline; filename="${fileName}"`,
              },
            });
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 4. Check documents table in DB
    // -------------------------------------------------------------
    const docMatches = await db
      .select()
      .from(documents)
      .where(or(eq(documents.name, fileName), ilike(documents.name, `%${fileName}%`)))
      .limit(1);

    if (docMatches.length > 0) {
      const doc = docMatches[0];

      // Try reading raw original file from Supabase storage if path exists
      if (doc.originalFilePath) {
        try {
          const { data: origData, error: origErr } = await supabase.storage
            .from('original-files')
            .download(doc.originalFilePath);
          if (!origErr && origData) {
            const arrayBuf = await origData.arrayBuffer();
            return new NextResponse(Buffer.from(arrayBuf), {
              status: 200,
              headers: {
                'Content-Type': doc.mimeType || mime,
                'Content-Disposition': `inline; filename="${fileName}"`,
              },
            });
          }
        } catch (_) {}
      }

      // Try decrypting from vault-files if available
      if (doc.filePath && doc.dekRef) {
        try {
          const { data: vaultData, error: vaultErr } = await supabase.storage
            .from('vault-files')
            .download(doc.filePath);
          if (!vaultErr && vaultData) {
            const encryptedText = await vaultData.text();
            const secret = new fernet.Secret(doc.dekRef);
            const token = new fernet.Token({ token: encryptedText, secret, ttl: 0 });
            const decryptedBase64 = token.decode();
            const buffer = Buffer.from(decryptedBase64, 'base64');
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': doc.mimeType || mime,
                'Content-Disposition': `inline; filename="${fileName}"`,
              },
            });
          }
        } catch (_) {}
      }
    }

    // If still not found, return 404
    return new NextResponse(
      `File "${fileName}" not found on server. Please re-upload or ensure the deliverable is attached.`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  } catch (err) {
    console.error('Error viewing attachment:', err);
    return new NextResponse('Internal server error while viewing attachment.', { status: 500 });
  }
}
