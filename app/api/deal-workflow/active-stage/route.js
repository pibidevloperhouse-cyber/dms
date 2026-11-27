import { NextResponse } from 'next/server';
import { db } from '@/db';
import { dmsDeals, dmsProjects, companies, users, dealTasks } from '@/db/schema';
import { eq, and, or, isNull, inArray } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { updateRoundInDB } from '@/lib/biddingFlowService';

export const dynamic = 'force-dynamic';

function normalizeStageName(stage) {
  if (!stage) return 'Preparation';
  const s = String(stage).trim().toLowerCase();
  if (s.includes('clos')) return 'Closing';
  if (s.includes('neg')) return 'Negotiation';
  if (s.includes('due') || s.includes('diligence')) return 'Due Diligence';
  return 'Preparation';
}

let serverActiveStage = 'Preparation';
let serverNotificationPayload = null;
let serverStageQuery = null;
let serverStageAdvanceRequest = null;
let serverDueDiligenceCertificate = null;
let serverNegotiationInvitation = null;
let serverByDealState = {};

const STATE_FILE_PATH = path.join(process.cwd(), '.vdr_active_stage.json');

function loadStateFromFile() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (data.activeStage) {
        serverActiveStage = normalizeStageName(data.activeStage);
      }
      if (data.notificationPayload !== undefined) {
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
      if (data.byDeal && typeof data.byDeal === 'object') {
        serverByDealState = data.byDeal;
      }
    }
  } catch (e) {
    console.error('Error reading active stage state file:', e);
  }
}

function saveStateToFile(dealKey = null) {
  try {
    if (dealKey) {
      serverByDealState[dealKey] = {
        activeStage: serverActiveStage,
        notificationPayload: serverNotificationPayload,
        stageQuery: serverStageQuery,
        stageAdvanceRequest: serverStageAdvanceRequest,
        dueDiligenceCertificate: serverDueDiligenceCertificate,
        negotiationInvitation: serverNegotiationInvitation,
        updatedAt: new Date().toISOString(),
      };
    }

    fs.writeFileSync(
      STATE_FILE_PATH,
      JSON.stringify({
        activeStage: serverActiveStage,
        notificationPayload: serverNotificationPayload,
        stageQuery: serverStageQuery,
        stageAdvanceRequest: serverStageAdvanceRequest,
        dueDiligenceCertificate: serverDueDiligenceCertificate,
        negotiationInvitation: serverNegotiationInvitation,
        byDeal: serverByDealState,
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

const _dealMetaCache = new Map();
const _inFlightDealMetaMap = new Map();
const DEAL_META_TTL_MS = 60000; // 60 seconds cache

function invalidateDealMetaCache() {
  _dealMetaCache.clear();
}

async function getDealMetadata({ dealId = null, workspaceId = null, forceRefresh = false } = {}) {
  const cacheKey = dealId || workspaceId || '__default__';
  const cached = _dealMetaCache.get(cacheKey);
  if (!forceRefresh && cached && (Date.now() - cached.at) < DEAL_META_TTL_MS) {
    return cached.data;
  }

  if (!forceRefresh && _inFlightDealMetaMap.has(cacheKey)) {
    return _inFlightDealMetaMap.get(cacheKey);
  }

  const promise = (async () => {
    let dealMeta = {
      dealId: '',
      projectId: '',
      currentStage: null,
      dealName: '',
      dealNumber: '',
      sellerCompany: '',
      buyerCompany: '',
      buyerId: '',
      buyerName: '',
      buyerRole: 'Buyer Guest Admin',
      leadAdvisorName: '',
      guestAdminName: '',
      sellerSuperAdminName: '',
      period: '',
    };

    try {
      const [deals, allUsers, allComps, allProjs] = await Promise.all([
        db.select().from(dmsDeals),
        db.select({ id: users.id, name: users.name, role: users.role, companyId: users.companyId }).from(users),
        db.select({ id: companies.id, name: companies.name }).from(companies),
        db.select({ id: dmsProjects.id, companyId: dmsProjects.companyId }).from(dmsProjects),
      ]);

      if (deals.length > 0) {
        let deal = null;
        if (dealId) {
          deal = deals.find((d) => d.id === dealId);
        }
        if (!deal && workspaceId) {
          deal = deals.find((d) => d.id === workspaceId || d.workspaceId === workspaceId || d.projectId === workspaceId);
        }
        if (!deal) {
          deal = deals.find((d) => (d.dealName || '').toLowerCase().includes('naga'))
            || deals.find((d) => d.featureTasks)
            || deals[0];
        }

        let sellerName = 'Vishwa Tech';
        let buyerName = 'Naga Tech';
        let sellerSuperAdminName = 'Vishwa Raj';
        let guestAdminName = 'Naga raj';
        let leadAdvisorName = 'Vijay';

        if (deal.projectId) {
          const proj = allProjs.find((p) => p.id === deal.projectId);
          if (proj?.companyId) {
            const seller = allComps.find((c) => c.id === proj.companyId);
            if (seller?.name) sellerName = seller.name;

            const sAdmin = allUsers.find((u) => u.companyId === proj.companyId && (u.role || '').toLowerCase() === 'super_admin' && (u.name || '').toLowerCase().includes('vishwa'))
              || allUsers.find((u) => u.companyId === proj.companyId && (u.role || '').toLowerCase() === 'super_admin');
            if (sAdmin?.name) sellerSuperAdminName = sAdmin.name;
          }
        }

        if (deal.buyerId) {
          const buyer = allUsers.find((u) => u.id === deal.buyerId);
          if (buyer) {
            if (buyer.role === 'guest_admin') guestAdminName = buyer.name;
            if (buyer.companyId) {
              const bComp = allComps.find((c) => c.id === buyer.companyId);
              if (bComp?.name) buyerName = bComp.name;

              const gAdmin = allUsers.find((u) => u.companyId === buyer.companyId && (u.role || '').toLowerCase() === 'guest_admin');
              if (gAdmin?.name) guestAdminName = gAdmin.name;

              const adv = allUsers.find((u) => u.companyId === buyer.companyId && (u.role || '').toLowerCase() === 'advisor');
              if (adv?.name) leadAdvisorName = adv.name;
            }
          }
        }

        if (!leadAdvisorName) {
          const adv = allUsers.find((u) => (u.role || '').toLowerCase() === 'advisor');
          if (adv?.name) leadAdvisorName = adv.name;
        }

        dealMeta = {
          dealId: deal.id,
          projectId: deal.projectId || '',
          currentStage: deal.currentStage ? normalizeStageName(deal.currentStage) : null,
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
      _dealMetaCache.set(cacheKey, { data: dealMeta, at: Date.now() });
    } catch (dbErr) {
      console.warn('Could not query deal metadata from DB:', dbErr?.message);
    } finally {
      _inFlightDealMetaMap.delete(cacheKey);
    }
    return dealMeta;
  })();

  _inFlightDealMetaMap.set(cacheKey, promise);
  return promise;
}

function getScopedState(dealId) {
  if (dealId && serverByDealState[dealId]) {
    const scoped = serverByDealState[dealId];
    return {
      activeStage: scoped.activeStage ? normalizeStageName(scoped.activeStage) : serverActiveStage,
      notificationPayload: scoped.notificationPayload !== undefined ? scoped.notificationPayload : serverNotificationPayload,
      stageQuery: scoped.stageQuery !== undefined ? scoped.stageQuery : serverStageQuery,
      stageAdvanceRequest: scoped.stageAdvanceRequest !== undefined ? scoped.stageAdvanceRequest : serverStageAdvanceRequest,
      dueDiligenceCertificate: scoped.dueDiligenceCertificate !== undefined ? scoped.dueDiligenceCertificate : serverDueDiligenceCertificate,
      negotiationInvitation: scoped.negotiationInvitation !== undefined ? scoped.negotiationInvitation : serverNegotiationInvitation,
    };
  }
  return {
    activeStage: serverActiveStage,
    notificationPayload: serverNotificationPayload,
    stageQuery: serverStageQuery,
    stageAdvanceRequest: serverStageAdvanceRequest,
    dueDiligenceCertificate: serverDueDiligenceCertificate,
    negotiationInvitation: serverNegotiationInvitation,
  };
}

export async function GET(req) {
  try {
    if (!_stateLoaded) {
      loadStateFromFile();
      _stateLoaded = true;
    }

    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId');
    const workspaceId = searchParams.get('workspaceId');

    const dealMeta = await getDealMetadata({ dealId, workspaceId });
    const resolvedDealId = dealMeta?.dealId || dealId || workspaceId || null;
    const scopedState = getScopedState(resolvedDealId);

    // Authoritative stage comes from DB dms_deals.current_stage for this deal, falling back to persisted stage state.
    const effectiveActiveStage = dealMeta?.currentStage || scopedState.activeStage || 'Preparation';

    return NextResponse.json({
      success: true,
      activeStage: effectiveActiveStage,
      dealMeta,
      notificationPayload: scopedState.notificationPayload,
      stageQuery: scopedState.stageQuery,
      stageAdvanceRequest: scopedState.stageAdvanceRequest,
      dueDiligenceCertificate: scopedState.dueDiligenceCertificate,
      negotiationInvitation: scopedState.negotiationInvitation,
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
    if (!_stateLoaded) {
      loadStateFromFile();
      _stateLoaded = true;
    }

    const body = await req.json();
    const {
      stage,
      dealId,
      workspaceId,
      notificationPayload,
      stageQuery,
      stageAdvanceRequest,
      dueDiligenceCertificate,
      negotiationInvitation,
    } = body;

    const currentMeta = await getDealMetadata({ dealId, workspaceId, forceRefresh: true });
    const targetDealId = dealId || currentMeta?.dealId || workspaceId || null;
    const scopedState = getScopedState(targetDealId);

    const targetStage = stage
      ? normalizeStageName(stage)
      : (currentMeta?.currentStage || scopedState.activeStage || serverActiveStage || 'Preparation');

    serverActiveStage = targetStage;
    if (notificationPayload !== undefined) {
      serverNotificationPayload = notificationPayload;
    } else if (scopedState.notificationPayload !== undefined) {
      serverNotificationPayload = scopedState.notificationPayload;
    }
    if (stageQuery !== undefined) {
      serverStageQuery = stageQuery;
    } else if (scopedState.stageQuery !== undefined) {
      serverStageQuery = scopedState.stageQuery;
    }
    if (stageAdvanceRequest !== undefined) {
      serverStageAdvanceRequest = stageAdvanceRequest;
    } else if (scopedState.stageAdvanceRequest !== undefined) {
      serverStageAdvanceRequest = scopedState.stageAdvanceRequest;
    }
    if (dueDiligenceCertificate !== undefined) {
      serverDueDiligenceCertificate = dueDiligenceCertificate;
    } else if (scopedState.dueDiligenceCertificate !== undefined) {
      serverDueDiligenceCertificate = scopedState.dueDiligenceCertificate;
    }

    if (negotiationInvitation !== undefined) {
      serverNegotiationInvitation = negotiationInvitation;
    } else if (targetStage === 'Negotiation' && !scopedState.negotiationInvitation && !serverNegotiationInvitation) {
      serverNegotiationInvitation = {
        id: `neg-invite-${Date.now()}`,
        status: 'PENDING_ACCEPTANCE',
        stage: 'Negotiation',
        dealId: currentMeta?.dealId || '',
        dealName: currentMeta?.dealName || '',
        askingPrice: 0,
        askingPriceFormatted: '',
        deadline: '',
        deadlineDisplay: '',
        invitedBuyerId: currentMeta?.buyerId || '',
        invitedBuyerName: currentMeta?.buyerName || '',
        invitedBuyerCompany: currentMeta?.buyerCompany || '',
        message: 'The seller board has approved activating the Negotiation Stage. You are invited to review the asking price and submit your acquisition proposal.',
        invitedBy: notificationPayload?.activatedBy || currentMeta?.sellerSuperAdminName || 'Super Admin',
        timestamp: Date.now()
      };
    } else if (scopedState.negotiationInvitation !== undefined) {
      serverNegotiationInvitation = scopedState.negotiationInvitation;
    }

    if (serverNegotiationInvitation) {
      // Handle Negotiation Invite actions
      if (serverNegotiationInvitation.status === 'ACCEPTED' && targetDealId) {
        try {
          await db
            .update(dmsDeals)
            .set({ featureBidding: true })
            .where(eq(dmsDeals.id, targetDealId));
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
          const targetRoundId = serverNegotiationInvitation.dealId || currentMeta?.projectId || null;
          await updateRoundInDB(updates, targetRoundId);
        } catch (e) {
          console.error('Error updating bidding_rounds from negotiation invite:', e);
        }
      }
    }

    saveStateToFile(targetDealId);

    try {
      if (stage) {
        invalidateDealMetaCache();

        if (targetDealId) {
          await db
            .update(dmsDeals)
            .set({ currentStage: targetStage, updatedAt: new Date() })
            .where(eq(dmsDeals.id, targetDealId));
        }

        // Enable only tasks belonging to the activated stage (scoped to this deal/workspace or legacy unassigned tasks)
        const taskFilter = targetDealId
          ? or(
              eq(dealTasks.dealId, targetDealId),
              eq(dealTasks.workspaceId, targetDealId),
              ...(workspaceId && workspaceId !== targetDealId ? [eq(dealTasks.workspaceId, workspaceId)] : []),
              and(isNull(dealTasks.dealId), isNull(dealTasks.workspaceId))
            )
          : undefined;

        const candidateTasks = taskFilter
          ? await db
              .select({ id: dealTasks.id, dealStage: dealTasks.dealStage, isEnabled: dealTasks.isEnabled })
              .from(dealTasks)
              .where(taskFilter)
          : await db
              .select({ id: dealTasks.id, dealStage: dealTasks.dealStage, isEnabled: dealTasks.isEnabled })
              .from(dealTasks);

        const taskIdsToEnable = candidateTasks
          .filter((t) => normalizeStageName(t.dealStage) === targetStage && t.isEnabled !== true)
          .map((t) => t.id);

        if (taskIdsToEnable.length > 0) {
          await db
            .update(dealTasks)
            .set({ isEnabled: true, updatedAt: new Date() })
            .where(inArray(dealTasks.id, taskIdsToEnable));
        }
      }
    } catch (dbErr) {
      console.error('Error updating dmsDeals or dealTasks in DB:', dbErr);
    }

    const dealMeta = await getDealMetadata({ dealId, workspaceId, forceRefresh: true });
    const updatedScoped = getScopedState(targetDealId);

    return NextResponse.json({
      success: true,
      activeStage: dealMeta?.currentStage || targetStage,
      dealMeta,
      notificationPayload: updatedScoped.notificationPayload,
      stageQuery: updatedScoped.stageQuery,
      stageAdvanceRequest: updatedScoped.stageAdvanceRequest,
      dueDiligenceCertificate: updatedScoped.dueDiligenceCertificate,
      negotiationInvitation: updatedScoped.negotiationInvitation,
    });
  } catch (error) {
    console.error('POST active stage error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
