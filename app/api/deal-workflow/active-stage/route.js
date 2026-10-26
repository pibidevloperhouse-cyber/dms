import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsDeals, dealTasks } from '@/db/schema';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let serverActiveStage = 'Preparation';
let serverNotificationPayload = null;
let serverStageQuery = null;

const STATE_FILE_PATH = path.join(process.cwd(), '.vdr_active_stage.json');

function loadStateFromFile() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (data.activeStage) {
        serverActiveStage = data.activeStage;
      }
      if (data.notificationPayload) {
        serverNotificationPayload = data.notificationPayload;
      }
      if (data.stageQuery !== undefined) {
        serverStageQuery = data.stageQuery;
      }
    }
  } catch (e) {
    console.error('Error reading active stage state file:', e);
  }
}

function saveStateToFile(stage, notificationPayload, stageQuery) {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({
        activeStage: stage,
        notificationPayload,
        stageQuery,
        updatedAt: new Date().toISOString(),
      }),
      'utf-8'
    );
  } catch (e) {
    console.error('Error writing active stage state file:', e);
  }
}

// Initial load on server start
loadStateFromFile();

export async function GET() {
  try {
    loadStateFromFile();

    try {
      const deals = await db.select({ currentStage: dmsDeals.currentStage }).from(dmsDeals).limit(1);
      if (deals.length > 0 && deals[0].currentStage) {
        serverActiveStage = deals[0].currentStage;
      }
    } catch (dbErr) {
      // Fallback to file/in-memory state if DB is unreachable
    }

    return NextResponse.json({
      success: true,
      activeStage: serverActiveStage,
      notificationPayload: serverNotificationPayload,
      stageQuery: serverStageQuery,
    });
  } catch (error) {
    console.error('GET active stage error:', error);
    return NextResponse.json(
      { success: false, activeStage: serverActiveStage || 'Preparation', stageQuery: serverStageQuery },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { stage, notificationPayload, stageQuery } = body;

    const targetStage = stage || serverActiveStage;
    serverActiveStage = targetStage;
    if (notificationPayload !== undefined) {
      serverNotificationPayload = notificationPayload;
    }
    if (stageQuery !== undefined) {
      serverStageQuery = stageQuery;
    }

    saveStateToFile(targetStage, serverNotificationPayload, serverStageQuery);

    try {
      if (stage) {
        await db.update(dmsDeals).set({ currentStage: targetStage });
        // Automatically enable all deal tasks created/assigned for the activated stage in DB
        await db.update(dealTasks).set({ isEnabled: true });
      }
    } catch (dbErr) {
      console.error('Error updating dmsDeals or dealTasks in DB:', dbErr);
    }

    return NextResponse.json({
      success: true,
      activeStage: serverActiveStage,
      notificationPayload: serverNotificationPayload,
      stageQuery: serverStageQuery,
    });
  } catch (error) {
    console.error('POST active stage error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
