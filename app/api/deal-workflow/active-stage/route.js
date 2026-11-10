import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsDeals, dmsProjects, companies, users, dealTasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { updateRoundInDB, saveBidInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

let serverActiveStage = 'Preparation';
let serverNotificationPayload = null;
let serverStageQuery = null;
let serverStageAdvanceRequest = null;
let serverDueDiligenceCertificate = null;
let serverNegotiationInvitation = null;

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
      if (data.negotiationInvitation !== undefined) {
        serverNegotiationInvitation = data.negotiationInvitation;
      }
    }
  } catch (e) {
    console.error('Error reading active stage state file:', e);
  }
}

function saveStateToFile(stage, notificationPayload, stageQuery, stageAdvanceRequest, dueDiligenceCertificate, negotiationInvitation) {
  try {
    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({
        activeStage: stage,
        notificationPayload,
        stageQuery,
        stageAdvanceRequest,
        dueDiligenceCertificate,
        negotiationInvitation,
        updatedAt: new Date().toISOString(),
      }),
      'utf-8'
    );
  } catch (e) {
    console.error('Error writing active stage state file:', e);
  }
}

// Initial load on server start
let _stateLoaded = false;
if (!_stateLoaded) {
  loadStateFromFile();
  _stateLoaded = true;
}

let _cachedDealMeta = null;
let _cachedDealMetaAt = 0;
let _inFlightDealMeta = null;
const DEAL_META_TTL_MS = 60000; // 60 seconds cache

async function getDealMetadata(forceRefresh = false) {
  if (!forceRefresh && _cachedDealMeta && (Date.now() - _cachedDealMetaAt) < DEAL_META_TTL_MS) {
    return _cachedDealMeta;
  }

  if (!forceRefresh && _inFlightDealMeta) {
    return _inFlightDealMeta;
  }

  _inFlightDealMeta = (async () => {
    let dealMeta = {
      dealId: '51013f2a-99dd-4405-95fb-f25502053455',
      dealName: 'Naga raj Deal',
      dealNumber: 'D-F4FD2',
      sellerCompany: 'Vishwa Tech',
      buyerCompany: 'Naga Tech',
      buyerId: '5082a2ab-a4d7-4ca9-add7-7a2a85bfe9cc',
      buyerName: 'Naga raj',
      buyerRole: 'Buyer Guest Admin',
      leadAdvisorName: 'Vijay',
      guestAdminName: 'Naga raj',
      sellerSuperAdminName: 'Vishwa Raj',
      period: '02 Sep to 30 Oct 2026',
    };

    try {
      const [deals, allUsers, allComps, allProjs] = await Promise.all([
        db.select().from(dmsDeals),
        db.select({ id: users.id, name: users.name, role: users.role, companyId: users.companyId }).from(users),
        db.select({ id: companies.id, name: companies.name }).from(companies),
        db.select({ id: dmsProjects.id, companyId: dmsProjects.companyId }).from(dmsProjects),
      ]);

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
          const proj = allProjs.find(p => p.id === deal.projectId);
          if (proj?.companyId) {
            const seller = allComps.find(c => c.id === proj.companyId);
            if (seller?.name) sellerName = seller.name;

            const sAdmin = allUsers.find(u => u.companyId === proj.companyId && (u.role || '').toLowerCase() === 'super_admin' && (u.name || '').toLowerCase().includes('vishwa'))
              || allUsers.find(u => u.companyId === proj.companyId && (u.role || '').toLowerCase() === 'super_admin');
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
          dealId: deal.id,
          dealName: deal.dealName || 'Naga raj Deal',
          dealNumber: `D-${deal.id.slice(0, 5).toUpperCase()}`,
          sellerCompany: sellerName,
          buyerCompany: buyerName,
          buyerId: deal.buyerId,
          buyerName: guestAdminName || 'Naga raj',
          buyerRole: 'Buyer Guest Admin',
          leadAdvisorName: leadAdvisorName || 'Vijay',
          guestAdminName: guestAdminName || 'Naga raj',
          sellerSuperAdminName: sellerSuperAdminName || 'Vishwa Raj',
          period: '02 Sep to 30 Oct 2026',
        };
      }
      _cachedDealMeta = dealMeta;
      _cachedDealMetaAt = Date.now();
    } catch (dbErr) {
      console.warn('Could not query deal metadata from DB:', dbErr?.message);
    } finally {
      _inFlightDealMeta = null;
    }
    return dealMeta;
  })();

  return _inFlightDealMeta;
}

export async function GET() {
  try {
    if (!_stateLoaded) {
      loadStateFromFile();
      _stateLoaded = true;
    }
    const dealMeta = await getDealMetadata();

    if (serverActiveStage === 'Negotiation' && !serverNegotiationInvitation) {
      serverNegotiationInvitation = {
        id: 'neg-invite-active-deal',
        status: 'PENDING_ACCEPTANCE',
        stage: 'Negotiation',
        dealId: dealMeta?.dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f',
        dealName: dealMeta?.dealName || 'Naga raj Deal',
        askingPrice: 10000000,
        askingPriceFormatted: '10.0M',
        deadline: '2026-11-25T18:00:00+05:30',
        deadlineDisplay: '25 Nov 2026',
        invitedBuyerId: dealMeta?.buyerId || '5082a2ab-a4d7-4ca9-add7-7a2a85bfe9cc',
        invitedBuyerName: dealMeta?.buyerName || 'Naga raj',
        invitedBuyerCompany: dealMeta?.buyerCompany || 'Naga Tech',
        message: 'The seller board has approved activating the Negotiation Stage. You are invited to review the benchmark asking price and submit your acquisition proposal.',
        invitedBy: dealMeta?.sellerSuperAdminName ? `${dealMeta.sellerSuperAdminName} (Super Admin)` : 'Super Admin',
        timestamp: Date.now()
      };
      saveStateToFile(
        serverActiveStage,
        serverNotificationPayload,
        serverStageQuery,
        serverStageAdvanceRequest,
        serverDueDiligenceCertificate,
        serverNegotiationInvitation
      );
    }

    return NextResponse.json({
      success: true,
      activeStage: serverActiveStage,
      dealMeta,
      notificationPayload: serverNotificationPayload,
      stageQuery: serverStageQuery,
      stageAdvanceRequest: serverStageAdvanceRequest,
      dueDiligenceCertificate: serverDueDiligenceCertificate,
      negotiationInvitation: serverNegotiationInvitation,
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
        negotiationInvitation: serverNegotiationInvitation,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      stage,
      notificationPayload,
      stageQuery,
      stageAdvanceRequest,
      dueDiligenceCertificate,
      negotiationInvitation
    } = body;

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
    if (negotiationInvitation !== undefined) {
      serverNegotiationInvitation = negotiationInvitation;
    } else if (targetStage === 'Negotiation' && !serverNegotiationInvitation) {
      serverNegotiationInvitation = {
        id: `neg-invite-${Date.now()}`,
        status: 'PENDING_ACCEPTANCE',
        stage: 'Negotiation',
        dealId: 'c7330177-a8ab-47a2-933c-af0be1d1246f',
        dealName: 'Naga raj Deal',
        askingPrice: 10000000,
        askingPriceFormatted: '10.0M',
        deadline: '2026-11-25T18:00:00+05:30',
        deadlineDisplay: '25 Nov 2026',
        invitedBuyerId: '5082a2ab-a4d7-4ca9-add7-7a2a85bfe9cc',
        invitedBuyerName: 'Naga raj',
        invitedBuyerCompany: 'Naga Tech',
        message: 'The seller board has approved activating the Negotiation Stage. You are invited to review the benchmark asking price and submit your acquisition proposal.',
        invitedBy: notificationPayload?.activatedBy || 'Super Admin',
        timestamp: Date.now()
      };
    }

    if (serverNegotiationInvitation) {
      // Handle Negotiation Invite actions
      if (serverNegotiationInvitation.status === 'ACCEPTED') {
        try {
          await db.update(dmsDeals).set({ featureBidding: true });
        } catch (e) {
          console.error('Error enabling featureBidding on dmsDeals:', e);
        }
      }

      if (serverNegotiationInvitation.askingPrice || serverNegotiationInvitation.deadline) {
        try {
          const updates = {
            status: 'open',
            statusLabel: 'Negotiation / Bidding Open'
          };
          if (serverNegotiationInvitation.dealName) {
            updates.dealName = serverNegotiationInvitation.dealName;
          }
          if (serverNegotiationInvitation.askingPrice) {
            const numPrice = Number(serverNegotiationInvitation.askingPrice);
            updates.askingPrice = numPrice;
            updates.askingPriceFormatted = `$${(numPrice / 1000000).toFixed(1)}M`;
          }
          if (serverNegotiationInvitation.deadline) {
            updates.deadline = serverNegotiationInvitation.deadline;
            updates.deadlineDisplay = serverNegotiationInvitation.deadlineDisplay || new Date(serverNegotiationInvitation.deadline).toLocaleString();
          }
          const targetRoundId = serverNegotiationInvitation.dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f';
          await updateRoundInDB(updates, targetRoundId);
        } catch (e) {
          console.error('Error updating bidding_rounds from negotiation invite:', e);
        }
      }
    }

    saveStateToFile(
      targetStage,
      serverNotificationPayload,
      serverStageQuery,
      serverStageAdvanceRequest,
      serverDueDiligenceCertificate,
      serverNegotiationInvitation
    );

    try {
      if (stage) {
        _cachedDealMeta = null;
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
      negotiationInvitation: serverNegotiationInvitation,
    });
  } catch (error) {
    console.error('POST active stage error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
