import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatSeconds(secs) {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { accessLogId, durationSeconds, session } = body;

        if (!accessLogId) {
            return NextResponse.json({ success: false, error: 'Missing access log ID' }, { status: 400 });
        }

        const duration = Math.max(0, parseInt(durationSeconds || 0, 10));
        const formatted = formatSeconds(duration);
        const closedAt = new Date().toISOString();

        const { error: updateErr } = await supabase
            .from('document_access_logs')
            .update({
                closed_at: closedAt,
                duration_seconds: duration,
                duration_formatted: formatted
            })
            .eq('id', accessLogId);

        if (updateErr) {
            console.error('[HEARTBEAT API] Update error:', updateErr);
            return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        // Also update matching document_edit_logs row metadata in real time
        try {
            const { data: editLogs } = await supabase
                .from('document_edit_logs')
                .select('id, metadata')
                .filter('metadata->>access_log_id', 'eq', accessLogId)
                .limit(1);

            if (editLogs && editLogs.length > 0) {
                const currentMeta = editLogs[0].metadata || {};
                await supabase
                    .from('document_edit_logs')
                    .update({
                        metadata: {
                            ...currentMeta,
                            duration_seconds: duration,
                            duration_formatted: formatted,
                            closed_at: closedAt
                        }
                    })
                    .eq('id', editLogs[0].id);
            }
        } catch (syncErr) {
            console.warn('[HEARTBEAT API] document_edit_logs sync notice:', syncErr.message);
        }

        return NextResponse.json({
            success: true,
            durationSeconds: duration,
            durationFormatted: formatted
        });
    } catch (err) {
        console.error('[HEARTBEAT API ERROR]:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
