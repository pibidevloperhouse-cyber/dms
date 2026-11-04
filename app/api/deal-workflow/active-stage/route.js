import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsDeals, dmsProjects, companies, users, dealTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let serverActiveStage = 'Preparation';
let serverNotificationPayload = null;
let serverStageQuery = null;
let serverStageAdvanceRequest = null;
let serverDueDiligenceCertificate = null;

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
      if (data.stageAdvanceRequest !== undefined) {
        serverStageAdvanceRequest = data.stageAdvanceRequest;
      }
      if (data.dueDiligenceCertificate !== undefined) {
        serverDueDiligenceCertificate = data.dueDiligenceCertificate;
      }
    }
  } catch (e) {
    console.error('Error reading active stage state file:', e);
  }
}

function saveStateToFile(stage, notificationPayload, stageQuery, stageAdvanceRequest, dueDiligenceCertificate) {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({
        activeStage: stage,
        notificationPayload,
        stageQuery,
        stageAdvanceRequest,
        dueDiligenceCertificate,
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

async function getDealMetadata() {
  let dealMeta = {
    dealName: 'Naga raj Deal',
    dealNumber: 'D-F4FD2',
    sellerCompany: 'Vishwa Tech',
    buyerCompany: 'Naga Tech',
    leadAdvisorName: 'Vijay',
    guestAdminName: 'Naga raj',
    sellerSuperAdminName: 'Vishwa Raj',
    period: '02 Sep to 30 Oct 2026',
  };

  try {
    const deals = await db.select().from(dmsDeals);
    const allUsers = await db.select().from(users);
    const allComps = await db.select().from(companies);

    if (deals.length > 0) {
      const deal = deals.find(d => (d.dealName || '').toLowerCase().includes('naga'))
        || deals.find(d => d.featureTasks)
        || deals[0];

      if (deal.currentStage) {
        serverActiveStage = deal.currentStage;
      }

      let sellerName = 'Vishwa Tech';
      let buyerName = 'Naga Tech';
      let sellerSuperAdminName = 'Vishwa Raj';
      let guestAdminName = 'Naga raj';
      let leadAdvisorName = 'Vijay';

      if (deal.projectId) {
        const projs = await db.select().from(dmsProjects).where(eq(dmsProjects.id, deal.projectId));
        if (projs[0]?.companyId) {
          const seller = allComps.find(c => c.id === projs[0].companyId);
          if (seller?.name) sellerName = seller.name;

          const sAdmin = allUsers.find(u => u.companyId === projs[0].companyId && (u.role || '').toLowerCase() === 'super_admin' && (u.name || '').toLowerCase().includes('vishwa'))
            || allUsers.find(u => u.companyId === projs[0].companyId && (u.role || '').toLowerCase() === 'super_admin');
          if (sAdmin?.name) sellerSuperAdminName = sAdmin.name;
        }
      }

      if (deal.buyerId) {
        const buyer = allUsers.find(u => u.id === deal.buyerId);
        if (buyer) {
          if (buyer.role === 'guest_admin') guestAdminName = buyer.name;
          if (buyer.companyId) {
            const bComp = allComps.find(c => c.id === buyer.companyId);
            if (bComp?.name) buyerName = bComp.name;

            const gAdmin = allUsers.find(u => u.companyId === buyer.companyId && (u.role || '').toLowerCase() === 'guest_admin');
            if (gAdmin?.name) guestAdminName = gAdmin.name;

            const adv = allUsers.find(u => u.companyId === buyer.companyId && (u.role || '').toLowerCase() === 'advisor');
            if (adv?.name) leadAdvisorName = adv.name;
          }
        }
      }

      if (!leadAdvisorName) {
        const adv = allUsers.find(u => (u.role || '').toLowerCase() === 'advisor');
        if (adv?.name) leadAdvisorName = adv.name;
      }

      dealMeta = {
        dealName: deal.dealName || 'Naga raj Deal',
        dealNumber: `D-${deal.id.slice(0, 5).toUpperCase()}`,
        sellerCompany: sellerName,
        buyerCompany: buyerName,
        leadAdvisorName: leadAdvisorName || 'Vijay',
        guestAdminName: guestAdminName || 'Naga raj',
        sellerSuperAdminName: sellerSuperAdminName || 'Vishwa Raj',
        period: '02 Sep to 30 Oct 2026',
      };
    }
  } catch (dbErr) {
    console.warn('Could not query deal metadata from DB:', dbErr?.message);
  }
  return dealMeta;
}

export async function GET() {
  try {
    loadStateFromFile();
    const dealMeta = await getDealMetadata();

    return NextResponse.json({
      success: true,
      activeStage: serverActiveStage,
      dealMeta,
      notificationPayload: serverNotificationPayload,
      stageQuery: serverStageQuery,
      stageAdvanceRequest: serverStageAdvanceRequest,
      dueDiligenceCertificate: serverDueDiligenceCertificate,
    });
  } catch (error) {
    console.error('GET active stage error:', error);
    return NextResponse.json(
      {
        success: false,
        activeStage: serverActiveStage || 'Preparation',
        stageQuery: serverStageQuery,
        stageAdvanceRequest: serverStageAdvanceRequest,
        dueDiligenceCertificate: serverDueDiligenceCertificate,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { stage, notificationPayload, stageQuery, stageAdvanceRequest, dueDiligenceCertificate } = body;

    const targetStage = stage || serverActiveStage;
    serverActiveStage = targetStage;
    if (notificationPayload !== undefined) {
      serverNotificationPayload = notificationPayload;
    }
    if (stageQuery !== undefined) {
      serverStageQuery = stageQuery;
    }
    if (stageAdvanceRequest !== undefined) {
      serverStageAdvanceRequest = stageAdvanceRequest;
    }
    if (dueDiligenceCertificate !== undefined) {
      serverDueDiligenceCertificate = dueDiligenceCertificate;
    }

    saveStateToFile(targetStage, serverNotificationPayload, serverStageQuery, serverStageAdvanceRequest, serverDueDiligenceCertificate);

    try {
      if (stage) {
        await db.update(dmsDeals).set({ currentStage: targetStage });
        // Automatically enable all deal tasks created/assigned for the activated stage in DB
        await db.update(dealTasks).set({ isEnabled: true });
      }
    } catch (dbErr) {
      console.error('Error updating dmsDeals or dealTasks in DB:', dbErr);
    }

    const dealMeta = await getDealMetadata();

    return NextResponse.json({
      success: true,
      activeStage: serverActiveStage,
      dealMeta,
      notificationPayload: serverNotificationPayload,
      stageQuery: serverStageQuery,
      stageAdvanceRequest: serverStageAdvanceRequest,
      dueDiligenceCertificate: serverDueDiligenceCertificate,
    });
  } catch (error) {
    console.error('POST active stage error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
