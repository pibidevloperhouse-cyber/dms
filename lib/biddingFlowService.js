import { eq, or, desc } from 'drizzle-orm';
import { db } from '@/db';
import {
  biddingRounds,
  biddingBids,
  biddingTermSheets,
  biddingSpas,
  biddingMessages,
  dmsDeals,
  dmsProjects,
  companies,
  users
} from '@/db/schema';

function safeJsonParse(val, fallback) {
  if (val == null) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function buildEmptyTermSheet(round = null, dealCtx = null) {
  const roundId = round?.id || dealCtx?.roundId || '';
  return {
    id: roundId ? `ts_${roundId}` : 'ts_active',
    roundId,
    dealName: round?.dealName || dealCtx?.dealName || '',
    acceptedBidId: null,
    buyerName: dealCtx?.buyerCompany || dealCtx?.buyerName || '',
    buyerMark: '',
    buyerType: '',
    version: 'Draft v1',
    stage: 'Negotiation',
    status: 'draft',
    lastUpdated: '',
    updatedBy: dealCtx?.sellerName || '',
    keyTerms: {},
    changedFields: {},
    counselComments: [],
    signatures: { buyer: null, seller: null }
  };
}

function buildEmptySpa(round = null, dealCtx = null) {
  const roundId = round?.id || dealCtx?.roundId || '';
  return {
    id: roundId ? `spa_${roundId}` : 'spa_active',
    roundId,
    dealName: round?.dealName || dealCtx?.dealName || '',
    companyName: dealCtx?.sellerCompany || '',
    buyerName: dealCtx?.buyerName || dealCtx?.buyerCompany || '',
    buyerCompany: dealCtx?.buyerCompany || '',
    sellerName: dealCtx?.sellerName || '',
    sellerCompany: dealCtx?.sellerCompany || '',
    version: 'v1.0 Draft',
    status: 'draft',
    lastUpdated: '',
    effectiveDate: '',
    articles: {
      purchasePrice: '',
      cashComponent: '',
      stockComponent: '',
      closingDate: '',
      escrowHoldback: '',
      exclusivityPeriod: '',
      keyEmployeeRetention: '',
      governingLaw: '',
      representations: '',
      covenants: '',
      conditionsPrecedent: ''
    },
    counselComments: [],
    signatures: { seller: null, buyer: null }
  };
}

/**
 * Resolve real Deal, Seller, and Buyer context directly from PostgreSQL tables:
 * dms_deals, dms_projects, companies, users
 */
export async function getDealContextFromDB(filterDealId = null, targetBuyerId = null) {
  try {
    const [deals, projs, comps, allUsers] = await Promise.all([
      db.select().from(dmsDeals).orderBy(desc(dmsDeals.createdAt)),
      db.select({ id: dmsProjects.id, name: dmsProjects.name, companyId: dmsProjects.companyId }).from(dmsProjects),
      db.select({ id: companies.id, name: companies.name, country: companies.country, companyType: companies.companyType }).from(companies),
      db.select({ id: users.id, name: users.name, email: users.email, role: users.role, companyId: users.companyId }).from(users)
    ]);

    let deal = null;
    if (filterDealId) {
      deal = deals.find(d => d.id === filterDealId || d.projectId === filterDealId);
    }
    if (!deal && targetBuyerId) {
      deal = deals.find(d => d.buyerId === targetBuyerId || d.id === targetBuyerId);
    }
    if (!deal) {
      deal =
        deals.find(d => d.featureTasks && (d.dealName || '').toLowerCase().includes('naga')) ||
        deals.find(d => d.featureTasks) ||
        deals[0] ||
        null;
    }

    const proj = deal?.projectId ? projs.find(p => p.id === deal.projectId) : (projs[0] || null);
    const sellerComp = proj?.companyId ? comps.find(c => c.id === proj.companyId) : null;
    const sellerAdmin =
      (proj?.companyId && allUsers.find(u => u.companyId === proj.companyId && String(u.role || '').toLowerCase() === 'super_admin' && String(u.name || '').toLowerCase().includes('vishwa'))) ||
      (proj?.companyId && allUsers.find(u => u.companyId === proj.companyId && String(u.role || '').toLowerCase() === 'super_admin')) ||
      allUsers.find(u => String(u.role || '').toLowerCase() === 'super_admin') ||
      null;

    const effectiveBuyerId = targetBuyerId || deal?.buyerId || null;
    const buyerUser = effectiveBuyerId
      ? allUsers.find(u => u.id === effectiveBuyerId)
      : allUsers.find(u => ['guest_admin', 'buyer'].includes(String(u.role || '').toLowerCase()));
    const buyerComp = buyerUser?.companyId ? comps.find(c => c.id === buyerUser.companyId) : null;

    return {
      dealId: deal?.id || proj?.id || '',
      projectId: proj?.id || deal?.projectId || '',
      dealName: deal?.dealName || proj?.name || '',
      sellerCompany: sellerComp?.name || '',
      sellerName: sellerAdmin?.name || '',
      buyerId: buyerUser?.id || deal?.buyerId || '',
      buyerName: buyerUser?.name || '',
      buyerEmail: buyerUser?.email || '',
      buyerCompany: buyerComp?.name || deal?.dealName || buyerUser?.name || '',
      buyerCountry: buyerComp?.country || '',
      buyerType: buyerComp?.companyType || '',
      ndaSignedDate: deal?.ndaStatus === 'signed' && deal?.updatedAt
        ? new Date(deal.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '',
      roundId: proj?.id || deal?.id || ''
    };
  } catch (err) {
    console.error('[biddingFlowService] Error resolving deal context from DB:', err?.message);
    return {
      dealId: '',
      projectId: '',
      dealName: '',
      sellerCompany: '',
      sellerName: '',
      buyerId: '',
      buyerName: '',
      buyerEmail: '',
      buyerCompany: '',
      buyerCountry: '',
      buyerType: '',
      ndaSignedDate: '',
      roundId: ''
    };
  }
}

export function getBidForBuyer(store, key) {
  if (!store?.bids || !key) return null;
  if (store.bids[key]) return store.bids[key];
  const all = Object.values(store.bids);
  return all.find(b => b.buyerId === key || b.id === key || b.dealId === key) || null;
}

export function getMessageForBuyer(store, key) {
  if (!store?.messages || !key) return null;
  if (store.messages[key]) return store.messages[key];
  const all = Object.values(store.messages);
  return all.find(m => m.buyerUserId === key || m.buyerId === key || m.id === key) || null;
}

export function mapRoundFromDB(r, dealCtx = null) {
  if (!r) {
    return {
      id: dealCtx?.roundId || '',
      dealId: dealCtx?.dealId || dealCtx?.roundId || '',
      dealName: dealCtx?.dealName || '',
      askingPrice: 0,
      askingPriceFormatted: '',
      status: 'evaluation',
      statusLabel: 'Bid Evaluation',
      openedDate: '',
      deadline: '',
      deadlineDisplay: '',
      invitedCount: 0,
      sector: '',
      arr: '',
      employees: '',
      financialHealth: '',
      sellerAdvisor: dealCtx?.sellerName || ''
    };
  }
  const numAsking = Number(r.askingPrice ?? r.asking_price) || 0;
  const rawFmt = r.askingPriceFormatted ?? r.asking_price_formatted ?? '';
  const validFmt = /^\$\d/.test(rawFmt)
    ? rawFmt
    : (numAsking > 0 ? `$${(numAsking / 1000000).toFixed(1)}M` : '');
  return {
    id: r.id,
    dealId: (r.dealId ?? r.deal_id) || r.id,
    dealName: (r.dealName ?? r.deal_name) || dealCtx?.dealName || '',
    askingPrice: numAsking,
    askingPriceFormatted: validFmt,
    status: r.status || 'evaluation',
    statusLabel: (r.statusLabel ?? r.status_label) || 'Bid Evaluation',
    openedDate: (r.openedDate ?? r.opened_date) || '',
    deadline: r.deadline ? new Date(r.deadline).toISOString() : '',
    deadlineDisplay: (r.deadlineDisplay ?? r.deadline_display) || '',
    invitedCount: (r.invitedCount ?? r.invited_count) ?? 1,
    sector: r.sector || '',
    arr: r.arr || '',
    employees: r.employees || '',
    financialHealth: (r.financialHealth ?? r.financial_health) || '',
    sellerAdvisor: (r.sellerAdvisor ?? r.seller_advisor) || dealCtx?.sellerName || ''
  };
}

export function mapBidFromDB(b) {
  if (!b) return null;
  return {
    id: b.id,
    roundId: b.roundId ?? b.round_id,
    dealId: (b.dealId ?? b.deal_id) || b.id,
    buyerId: b.buyerId ?? b.buyer_id,
    name: b.name || '',
    mark: b.mark || '',
    type: b.type || '',
    buyerRole: (b.buyerRole ?? b.buyer_role) || 'guest_admin',
    offerAmount: Number(b.offerAmount ?? b.offer_amount) || 0,
    offer: b.offer || '',
    vsAsk: (b.vsAsk ?? b.vs_ask) || '',
    vsColor: (b.vsColor ?? b.vs_color) || '#16a34a',
    cash: b.cash || '',
    stock: b.stock || '',
    close: b.close || '',
    expectedCloseDate: (b.expectedCloseDate ?? b.expected_close_date) || '',
    status: b.status || 'Under review',
    engagement: b.engagement || '',
    views: b.views || 0,
    submittedAt: (b.submittedAt ?? b.submitted_at) || '',
    financingType: (b.financingType ?? b.financing_type) || '',
    contingencies: b.contingencies || '',
    note: b.note || '',
    ndaSignedDate: (b.ndaSignedDate ?? b.nda_signed_date) || '',
    leadName: (b.leadName ?? b.lead_name) || '',
    advisorName: (b.advisorName ?? b.advisor_name) || '',
    documents: safeJsonParse(b.documents, []),
    counterOffer: safeJsonParse(b.counterOffer ?? b.counter_offer, null),
    history: safeJsonParse(b.history, []),
    updatedAt: b.updatedAt || b.updated_at || b.createdAt || b.created_at || new Date().toISOString()
  };
}

export function mapTermSheetFromDB(ts) {
  if (!ts) return null;
  return {
    id: ts.id,
    roundId: ts.roundId ?? ts.round_id,
    dealName: (ts.dealName ?? ts.deal_name) || '',
    acceptedBidId: (ts.acceptedBidId ?? ts.accepted_bid_id) || null,
    buyerName: (ts.buyerName ?? ts.buyer_name) || '',
    buyerMark: (ts.buyerMark ?? ts.buyer_mark) || '',
    buyerType: (ts.buyerType ?? ts.buyer_type) || '',
    version: ts.version || 'Draft v1',
    stage: ts.stage || 'Negotiation',
    status: ts.status || 'draft',
    lastUpdated: (ts.lastUpdated ?? ts.last_updated) || '',
    updatedBy: (ts.updatedBy ?? ts.updated_by) || '',
    keyTerms: safeJsonParse(ts.keyTerms ?? ts.key_terms, {}),
    changedFields: safeJsonParse(ts.changedFields ?? ts.changed_fields, {}),
    counselComments: safeJsonParse(ts.counselComments ?? ts.counsel_comments, []),
    signatures: safeJsonParse(ts.signatures, { buyer: null, seller: null })
  };
}

export function mapSpaFromDB(s, dealCtx = null) {
  if (!s) return null;
  return {
    id: s.id,
    roundId: s.roundId ?? s.round_id,
    dealName: (s.dealName ?? s.deal_name) || dealCtx?.dealName || '',
    companyName: dealCtx?.sellerCompany || '',
    buyerName: (s.buyerName ?? s.buyer_name) || dealCtx?.buyerName || '',
    buyerCompany: dealCtx?.buyerCompany || (s.buyerName ?? s.buyer_name) || '',
    sellerName: (s.sellerName ?? s.seller_name) || dealCtx?.sellerName || '',
    sellerCompany: dealCtx?.sellerCompany || '',
    version: s.version || 'v1.0 Draft',
    status: s.status || 'draft',
    lastUpdated: (s.lastUpdated ?? s.last_updated) || '',
    updatedBy: (s.updatedBy ?? s.updated_by) || '',
    articles: safeJsonParse(s.articles, {}),
    counselComments: safeJsonParse(s.counselComments ?? s.counsel_comments, []),
    signatures: safeJsonParse(s.signatures, { seller: null, buyer: null })
  };
}

export function mapMessageFromDB(msg) {
  if (!msg) return null;
  return {
    id: msg.id,
    buyerId: msg.id || msg.buyerId || msg.buyer_id,
    buyerUserId: msg.buyerId ?? msg.buyer_id,
    roundId: msg.roundId ?? msg.round_id,
    buyerName: (msg.buyerName ?? msg.buyer_name) || '',
    mark: msg.mark || '',
    type: msg.type || '',
    status: msg.status || '',
    leadName: (msg.leadName ?? msg.lead_name) || '',
    advisorName: (msg.advisorName ?? msg.advisor_name) || '',
    currentOffer: (msg.currentOffer ?? msg.current_offer) || '',
    unreadCount: (msg.unreadCount ?? msg.unread_count) || 0,
    threads: safeJsonParse(msg.threads, [])
  };
}

// Short in-memory cache + request coalescing for burst reads; invalidated on all writes
let _memCache = null;
let _memCacheAt = 0;
let _memCacheKey = null;
const _inFlightLoads = new Map();
const BIDDING_CACHE_TTL_MS = 3000;

export function invalidateBiddingCache() {
  _memCache = null;
  _memCacheAt = 0;
  _memCacheKey = null;
}

export async function loadBiddingStoreAsync(filterDealId = null) {
  const cacheKey = filterDealId && filterDealId !== 'undefined' && filterDealId !== 'null'
    ? String(filterDealId)
    : '__default__';

  if (_memCache && _memCacheKey === cacheKey && (Date.now() - _memCacheAt) < BIDDING_CACHE_TTL_MS) {
    return _memCache;
  }

  if (_inFlightLoads.has(cacheKey)) {
    return _inFlightLoads.get(cacheKey);
  }

  const loadPromise = (async () => {
    try {
      const dealCtx = await getDealContextFromDB(cacheKey !== '__default__' ? cacheKey : null);

      // 1. Fetch active round directly from PostgreSQL bidding_rounds
      let roundRow = null;
      if (cacheKey !== '__default__') {
        const rows = await db
          .select()
          .from(biddingRounds)
          .where(or(eq(biddingRounds.id, cacheKey), eq(biddingRounds.dealId, cacheKey)))
          .limit(1);
        roundRow = rows[0] || null;
      }
      if (!roundRow) {
        const rows = await db
          .select()
          .from(biddingRounds)
          .orderBy(desc(biddingRounds.updatedAt))
          .limit(1);
        roundRow = rows[0] || null;
      }

      const round = mapRoundFromDB(roundRow, dealCtx);
      const targetRoundId = round.id || dealCtx.roundId || null;

      // 2. Fetch Bids, Term Sheet, SPA, and Messages from DB
      const [bidRows, tsRows, spaRows, msgRows] = await Promise.all([
        targetRoundId
          ? db.select().from(biddingBids).where(eq(biddingBids.roundId, targetRoundId)).orderBy(desc(biddingBids.updatedAt))
          : db.select().from(biddingBids).orderBy(desc(biddingBids.updatedAt)),
        targetRoundId
          ? db.select().from(biddingTermSheets).where(eq(biddingTermSheets.roundId, targetRoundId)).orderBy(desc(biddingTermSheets.updatedAt)).limit(1)
          : db.select().from(biddingTermSheets).orderBy(desc(biddingTermSheets.updatedAt)).limit(1),
        targetRoundId
          ? db.select().from(biddingSpas).where(eq(biddingSpas.roundId, targetRoundId)).orderBy(desc(biddingSpas.updatedAt)).limit(1)
          : db.select().from(biddingSpas).orderBy(desc(biddingSpas.updatedAt)).limit(1),
        targetRoundId
          ? db.select().from(biddingMessages).where(eq(biddingMessages.roundId, targetRoundId))
          : db.select().from(biddingMessages)
      ]);

      const bids = {};
      for (const row of bidRows) {
        const mapped = mapBidFromDB(row);
        if (mapped && mapped.id) {
          bids[mapped.id] = mapped;
        }
      }

      const termSheet = tsRows[0]
        ? mapTermSheetFromDB(tsRows[0])
        : buildEmptyTermSheet(round, dealCtx);

      if (!termSheet.buyerName && dealCtx.buyerCompany) {
        termSheet.buyerName = dealCtx.buyerCompany;
      }

      const spa = spaRows[0]
        ? mapSpaFromDB(spaRows[0], dealCtx)
        : buildEmptySpa(round, dealCtx);

      // Sync empty SPA article slots from accepted DB Term Sheet terms
      if (termSheet && termSheet.keyTerms) {
        const articles = { ...(spa.articles || {}) };
        if (!articles.purchasePrice && termSheet.keyTerms.purchasePrice) articles.purchasePrice = termSheet.keyTerms.purchasePrice;
        if (!articles.cashComponent && termSheet.keyTerms.structure) articles.cashComponent = termSheet.keyTerms.structure;
        if (!articles.closingDate && termSheet.keyTerms.expectedClose) articles.closingDate = termSheet.keyTerms.expectedClose;
        if (!articles.escrowHoldback && termSheet.keyTerms.escrow) articles.escrowHoldback = termSheet.keyTerms.escrow;
        if (!articles.exclusivityPeriod && termSheet.keyTerms.exclusivityPeriod) articles.exclusivityPeriod = termSheet.keyTerms.exclusivityPeriod;
        if (!articles.keyEmployeeRetention && termSheet.keyTerms.keyEmployeeRetention) articles.keyEmployeeRetention = termSheet.keyTerms.keyEmployeeRetention;
        if (!articles.governingLaw && termSheet.keyTerms.governingLaw) articles.governingLaw = termSheet.keyTerms.governingLaw;
        spa.articles = articles;
      }
      if (termSheet?.buyerName && !spa.buyerName) {
        spa.buyerName = termSheet.buyerName;
      }

      const messages = {};
      for (const row of msgRows) {
        const mapped = mapMessageFromDB(row);
        if (mapped && mapped.buyerId) {
          messages[mapped.buyerId] = mapped;
          if (mapped.buyerUserId) messages[mapped.buyerUserId] = mapped;
        }
      }

      const state = {
        round,
        bids,
        termSheet,
        spa,
        messages,
        dealMeta: dealCtx,
        updatedAt: new Date().toISOString()
      };

      _memCache = state;
      _memCacheKey = cacheKey;
      _memCacheAt = Date.now();
      return state;
    } catch (error) {
      console.error('[biddingFlowService] Error loading bidding store from DB:', error);
      throw error;
    } finally {
      _inFlightLoads.delete(cacheKey);
    }
  })();

  _inFlightLoads.set(cacheKey, loadPromise);
  return loadPromise;
}

export async function updateRoundInDB(updates, roundId = null) {
  invalidateBiddingCache();
  const currentStore = await loadBiddingStoreAsync(roundId);
  const targetId = currentStore.round?.id || roundId || currentStore.dealMeta?.roundId;
  const updatedRound = { ...currentStore.round, ...updates, id: targetId };

  if (updates.askingPrice !== undefined && !updates.askingPriceFormatted) {
    updatedRound.askingPriceFormatted = `$${(Number(updates.askingPrice) / 1000000).toFixed(1)}M`;
  }

  const values = {
    dealId: updatedRound.dealId || updatedRound.id || null,
    dealName: updatedRound.dealName || '',
    askingPrice: Number(updatedRound.askingPrice) || 0,
    askingPriceFormatted: updatedRound.askingPriceFormatted || '',
    status: updatedRound.status || 'evaluation',
    statusLabel: updatedRound.statusLabel || '',
    openedDate: updatedRound.openedDate || '',
    deadline: updatedRound.deadline ? new Date(updatedRound.deadline) : null,
    deadlineDisplay: updatedRound.deadlineDisplay || '',
    invitedCount: updatedRound.invitedCount ?? 1,
    sector: updatedRound.sector || '',
    arr: updatedRound.arr || '',
    employees: updatedRound.employees || '',
    financialHealth: updatedRound.financialHealth || '',
    sellerAdvisor: updatedRound.sellerAdvisor || '',
    updatedAt: new Date()
  };

  if (targetId) {
    const existing = await db
      .select({ id: biddingRounds.id })
      .from(biddingRounds)
      .where(or(eq(biddingRounds.id, targetId), eq(biddingRounds.dealId, targetId)))
      .limit(1);

    if (existing[0]?.id) {
      await db.update(biddingRounds).set(values).where(eq(biddingRounds.id, existing[0].id));
      updatedRound.id = existing[0].id;
    } else {
      await db.insert(biddingRounds).values({ id: targetId, ...values });
    }
  }

  invalidateBiddingCache();
  return updatedRound;
}

export async function saveBidInDB(bidData) {
  invalidateBiddingCache();
  const currentStore = await loadBiddingStoreAsync();
  const roundId = bidData.roundId || currentStore.round?.id || currentStore.dealMeta?.roundId || null;
  const withTimestamp = { ...bidData, roundId, updatedAt: new Date().toISOString() };

  const values = {
    id: withTimestamp.id,
    roundId,
    dealId: withTimestamp.dealId || withTimestamp.id,
    buyerId: withTimestamp.buyerId || null,
    name: withTimestamp.name || '',
    mark: withTimestamp.mark || '',
    type: withTimestamp.type || '',
    buyerRole: withTimestamp.buyerRole || 'guest_admin',
    offerAmount: Number(withTimestamp.offerAmount) || 0,
    offer: withTimestamp.offer || '',
    vsAsk: withTimestamp.vsAsk || '',
    vsColor: withTimestamp.vsColor || '',
    cash: withTimestamp.cash || '',
    stock: withTimestamp.stock || '',
    close: withTimestamp.close || '',
    expectedCloseDate: withTimestamp.expectedCloseDate || '',
    status: withTimestamp.status || 'Under review',
    engagement: withTimestamp.engagement || '',
    views: withTimestamp.views || 0,
    submittedAt: withTimestamp.submittedAt || '',
    financingType: withTimestamp.financingType || '',
    contingencies: withTimestamp.contingencies || '',
    note: withTimestamp.note || '',
    ndaSignedDate: withTimestamp.ndaSignedDate || '',
    leadName: withTimestamp.leadName || '',
    advisorName: withTimestamp.advisorName || '',
    documents: withTimestamp.documents || [],
    counterOffer: withTimestamp.counterOffer || null,
    history: withTimestamp.history || [],
    updatedAt: new Date()
  };

  await db.insert(biddingBids).values(values).onConflictDoUpdate({
    target: biddingBids.id,
    set: values
  });

  invalidateBiddingCache();
  return withTimestamp;
}

export async function updateTermSheetInDB(updates, roundId = null) {
  invalidateBiddingCache();
  const currentStore = await loadBiddingStoreAsync(roundId);
  const targetRoundId = currentStore.round?.id || roundId || currentStore.dealMeta?.roundId || null;
  const existingRowId = currentStore.termSheet?.id || (targetRoundId ? `ts_${targetRoundId}` : 'ts_active');

  const updatedTS = {
    ...currentStore.termSheet,
    ...updates,
    id: existingRowId,
    roundId: targetRoundId
  };

  const values = {
    id: existingRowId,
    roundId: targetRoundId,
    dealName: updatedTS.dealName || '',
    acceptedBidId: updatedTS.acceptedBidId || null,
    buyerName: updatedTS.buyerName || '',
    buyerMark: updatedTS.buyerMark || '',
    buyerType: updatedTS.buyerType || '',
    version: updatedTS.version || 'Draft v1',
    stage: updatedTS.stage || 'Negotiation',
    status: updatedTS.status || 'draft',
    lastUpdated: updatedTS.lastUpdated || '',
    updatedBy: updatedTS.updatedBy || '',
    keyTerms: updatedTS.keyTerms || {},
    changedFields: updatedTS.changedFields || {},
    counselComments: updatedTS.counselComments || [],
    signatures: updatedTS.signatures || { buyer: null, seller: null },
    updatedAt: new Date()
  };

  await db.insert(biddingTermSheets).values(values).onConflictDoUpdate({
    target: biddingTermSheets.id,
    set: values
  });

  invalidateBiddingCache();
  return updatedTS;
}

export async function updateSpaInDB(updates, roundId = null) {
  invalidateBiddingCache();
  const currentStore = await loadBiddingStoreAsync(roundId);
  const targetRoundId = currentStore.round?.id || roundId || currentStore.dealMeta?.roundId || null;
  const existingRowId = currentStore.spa?.id || (targetRoundId ? `spa_${targetRoundId}` : 'spa_active');

  const updatedSPA = {
    ...currentStore.spa,
    ...updates,
    id: existingRowId,
    roundId: targetRoundId
  };

  const values = {
    id: existingRowId,
    roundId: targetRoundId,
    dealName: updatedSPA.dealName || '',
    buyerName: updatedSPA.buyerName || '',
    sellerName: updatedSPA.sellerName || '',
    version: updatedSPA.version || 'v1.0 Draft',
    status: updatedSPA.status || 'draft',
    lastUpdated: updatedSPA.lastUpdated || '',
    updatedBy: updatedSPA.updatedBy || '',
    articles: updatedSPA.articles || {},
    counselComments: updatedSPA.counselComments || [],
    signatures: updatedSPA.signatures || { seller: null, buyer: null },
    updatedAt: new Date()
  };

  await db.insert(biddingSpas).values(values).onConflictDoUpdate({
    target: biddingSpas.id,
    set: values
  });

  invalidateBiddingCache();
  return updatedSPA;
}

export async function appendMessageInDB(buyerId, newMsg, roundId = null) {
  invalidateBiddingCache();
  const currentStore = await loadBiddingStoreAsync(roundId);
  const targetRoundId = currentStore.round?.id || roundId || currentStore.dealMeta?.roundId || null;
  const dealCtx = await getDealContextFromDB(targetRoundId, buyerId);
  const bid = getBidForBuyer(currentStore, buyerId);

  const existingRows = await db
    .select()
    .from(biddingMessages)
    .where(or(eq(biddingMessages.id, buyerId), eq(biddingMessages.buyerId, buyerId)))
    .limit(1);

  let mappedMsg;
  if (existingRows[0]) {
    mappedMsg = mapMessageFromDB(existingRows[0]);
    mappedMsg.threads = [...(mappedMsg.threads || []), newMsg];
  } else {
    mappedMsg = {
      id: buyerId,
      buyerId,
      buyerUserId: buyerId,
      roundId: targetRoundId,
      buyerName: bid?.name || dealCtx?.buyerCompany || dealCtx?.buyerName || 'Buyer',
      mark: bid?.mark || (dealCtx?.buyerCompany || dealCtx?.buyerName || 'B').substring(0, 2).toUpperCase(),
      type: bid?.type || dealCtx?.buyerType || '',
      status: bid?.status || 'Active',
      leadName: bid?.leadName || dealCtx?.buyerName || '',
      advisorName: currentStore.round?.sellerAdvisor || dealCtx?.sellerName || '',
      currentOffer: bid?.offer || '',
      unreadCount: 0,
      threads: [newMsg]
    };
  }

  const values = {
    id: mappedMsg.id || mappedMsg.buyerId,
    roundId: mappedMsg.roundId || targetRoundId,
    buyerId: mappedMsg.buyerUserId || mappedMsg.buyerId,
    buyerName: mappedMsg.buyerName || 'Buyer',
    mark: mappedMsg.mark || '',
    type: mappedMsg.type || '',
    status: mappedMsg.status || '',
    leadName: mappedMsg.leadName || '',
    advisorName: mappedMsg.advisorName || '',
    currentOffer: mappedMsg.currentOffer || '',
    unreadCount: mappedMsg.unreadCount || 0,
    threads: mappedMsg.threads || [],
    updatedAt: new Date()
  };

  await db.insert(biddingMessages).values(values).onConflictDoUpdate({
    target: biddingMessages.id,
    set: values
  });

  invalidateBiddingCache();
  return mappedMsg;
}

export function computeBiddingKPIs(store) {
  const bidsList = Object.values(store?.bids || {}).filter(
    (b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx
  );
  const receivedCount = bidsList.length;
  const invitedCount = store?.round?.invitedCount || (receivedCount > 0 ? receivedCount : 0);

  const validOffers = bidsList.map(b => b.offerAmount).filter(a => typeof a === 'number' && a > 0);
  const highestOffer = validOffers.length > 0 ? Math.max(...validOffers) : 0;
  const avgOffer = validOffers.length > 0
    ? validOffers.reduce((acc, v) => acc + v, 0) / validOffers.length
    : 0;

  const cashList = bidsList
    .map(b => parseInt(String(b.cash).replace('%', ''), 10))
    .filter(n => !isNaN(n));
  const medianCash = cashList.length > 0
    ? Math.round(cashList.reduce((acc, v) => acc + v, 0) / cashList.length)
    : 0;
  const totalViews = bidsList.reduce((acc, b) => acc + (b.views || 0), 0);

  return {
    receivedCount,
    invitedCount,
    highestOfferFormatted: `$${(highestOffer / 1000000).toFixed(1)}M`,
    averageOfferFormatted: `$${(avgOffer / 1000000).toFixed(1)}M`,
    medianCashFormatted: `${medianCash}%`,
    totalViews,
    highestEngagedBuyer: [...bidsList].sort((a, b) => (b.views || 0) - (a.views || 0))[0]?.name || 'None'
  };
}
