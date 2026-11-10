import fs from 'fs';
import path from 'path';
import { db } from './db.js';

const STORE_PATH = path.join(process.cwd(), '.vdr_bidding_store.json');

// Default initial state matching the real database
export const DEFAULT_INITIAL_STATE = {
  round: {
    id: "c7330177-a8ab-47a2-933c-af0be1d1246f",
    dealId: "c7330177-a8ab-47a2-933c-af0be1d1246f",
    dealName: "VDR Sell",
    askingPrice: 10000000,
    askingPriceFormatted: "$10.0M",
    status: "evaluation",
    statusLabel: "Bid Evaluation",
    openedDate: "14 Oct 2026",
    deadline: "2026-11-20T18:00:00+05:30",
    deadlineDisplay: "18:00 IST, 20 Nov 2026",
    invitedCount: 2,
    sector: "Technology / SaaS",
    arr: "$1M ARR · 30% Gross Margin",
    employees: "11-20 employees",
    financialHealth: "EBITDA 24%",
    sellerAdvisor: "Ohm Priya (Seller Admin)",
  },
  bids: {
    "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf": {
      id: "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf",
      dealId: "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf",
      buyerId: "8ec0af77-0630-444f-8e1c-d362f35a2e13",
      name: "Naga Tech",
      mark: "NT",
      type: "Venture Capital (VC) · Argentina",
      buyerRole: "guest_admin",
      offerAmount: 10000000,
      offer: "$10.0M",
      vsAsk: "±0%",
      vsColor: "#16a34a",
      cash: "70%",
      stock: "30%",
      close: "Dec 2026",
      expectedCloseDate: "2026-12-15",
      status: "Shortlisted",
      engagement: "16 docs · 92%",
      views: 16,
      submittedAt: "14 Oct 2026",
      financingType: "Private Equity / Cash",
      contingencies: "Standard regulatory clearance, key employee retention",
      note: "We see strong synergistic value with our technology portfolio and are ready for rapid execution.",
      ndaSignedDate: "14 Oct 2026",
      leadName: "Naga raj",
      advisorName: "Ohm Priya",
      documents: [
        { name: "Binding Offer - Naga Tech.pdf", size: "2.4 MB", type: "pdf" },
        { name: "Proof of Funds.pdf", size: "1.2 MB", type: "pdf" }
      ],
      history: [
        { event: "Bid Submitted", amount: "$10.0M", date: "14 Oct 2026, 11:30 IST", note: "Binding offer submitted by Naga raj" }
      ]
    },
    "51013f2a-99dd-4405-95fb-f25502053455": {
      id: "51013f2a-99dd-4405-95fb-f25502053455",
      dealId: "51013f2a-99dd-4405-95fb-f25502053455",
      buyerId: "5082a2ab-a4d7-4ca9-add7-7a2a85bfe9cc",
      name: "Test User Deal",
      mark: "TU",
      type: "Individual Buyer · Afghanistan",
      buyerRole: "guest_admin",
      offerAmount: 9500000,
      offer: "$9.5M",
      vsAsk: "-5%",
      vsColor: "#dc2626",
      cash: "80%",
      stock: "20%",
      close: "Dec 2026",
      expectedCloseDate: "2026-12-15",
      status: "Under review",
      engagement: "10 docs · 68%",
      views: 10,
      submittedAt: "26 Oct 2026",
      financingType: "Bootstrapped / Self-Funded",
      contingencies: "Working capital validation",
      note: "Offer subject to working capital validation and executive alignment call.",
      ndaSignedDate: "26 Oct 2026",
      leadName: "Test User",
      advisorName: "Ohm Priya",
      documents: [
        { name: "Letter of Intent - Test User.pdf", size: "1.8 MB", type: "pdf" }
      ],
      counterOffer: {
        amount: 10000000,
        amountFormatted: "$10.0M",
        note: "The seller board is firm on $10.0M enterprise valuation, but open to your 80% cash structure.",
        counteredAt: "28 Oct 2026, 14:20 IST"
      },
      history: [
        { event: "Bid Submitted", amount: "$9.5M", date: "26 Oct 2026, 14:00 IST", note: "Initial offer submitted" },
        { event: "Seller Counter-Offer Received", amount: "$10.0M", date: "28 Oct 2026, 14:20 IST", note: "Board requested $10.0M" }
      ]
    }
  },
  termSheet: {
    id: "ts_vdr_sell",
    roundId: "c7330177-a8ab-47a2-933c-af0be1d1246f",
    dealName: "VDR Sell",
    acceptedBidId: "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf",
    buyerName: "Naga Tech",
    buyerMark: "NT",
    buyerType: "Venture Capital (VC) · Argentina",
    version: "Draft v1",
    stage: "Stage 5 of 6",
    status: "draft",
    lastUpdated: "28 Oct 2026",
    updatedBy: "Ohm Priya (Seller Admin)",
    keyTerms: {
      purchasePrice: "$10,000,000",
      structure: "70% cash at close / 30% acquirer stock, 12-month vest",
      expectedClose: "15 December 2026",
      exclusivityPeriod: "45 days from execution",
      keyEmployeeRetention: "90% of key team, 24-month terms",
      escrow: "10% of purchase price, 18-month holdback",
      regulatoryConditions: "Subject to standard antitrust clearance",
      governingLaw: "Delaware, USA"
    },
    changedFields: {
      purchasePrice: true,
      exclusivityPeriod: true
    },
    counselComments: [
      {
        id: "c-1",
        sender: "Ohm Priya (Seller Admin)",
        role: "seller_counsel",
        avatar: "OP",
        message: "Updated exclusivity period to 45 days per Naga raj call agreement.",
        timestamp: "28 Oct, 10:15 AM"
      },
      {
        id: "c-2",
        sender: "Naga raj (Buyer)",
        role: "buyer",
        avatar: "NR",
        message: "Escrow holdback period works for us — ready to sign once final draft is confirmed.",
        timestamp: "28 Oct, 11:30 AM"
      }
    ],
    signatures: {
      buyer: null,
      seller: null
    }
  },
  spa: {
    id: "spa_vdr_sell",
    roundId: "c7330177-a8ab-47a2-933c-af0be1d1246f",
    dealName: "VDR Sell",
    companyName: "VDR Sell Technologies Inc.",
    buyerName: "Vijay",
    buyerCompany: "Vijay Strategic Holdings LLC",
    sellerName: "Vishwa Raj",
    sellerCompany: "VDR Sell Founders & Investors Board",
    version: "v1.0 Final Execution Draft",
    status: "draft", // 'draft' | 'dispatched' | 'signed_by_buyer' | 'executed'
    lastUpdated: "9 Nov 2026",
    effectiveDate: "15 December 2026",
    articles: {
      purchasePrice: "$22,000,000",
      cashComponent: "$15,400,000 (70% via Wire Transfer at Closing)",
      stockComponent: "$6,600,000 (30% in Acquirer Common Stock)",
      closingDate: "15 December 2026",
      escrowHoldback: "$2,200,000 (10% held in Escrow for 18 months)",
      exclusivityPeriod: "45 Days from Execution",
      keyEmployeeRetention: "90% of key engineering team subject to 24-month retention lock-ins",
      governingLaw: "State of Delaware, United States",
      representations: "Customary corporate authority, capitalization, audited financials, tax compliance, and intellectual property ownership.",
      covenants: "Seller agrees to operate the business exclusively in the ordinary course and preserve standard commercial relationships.",
      conditionsPrecedent: "Antitrust clearances, delivery of share certificates, board approvals, and absence of Material Adverse Effect."
    },
    counselComments: [
      {
        id: "spa-c-1",
        sender: "Ohm Priya (Seller Legal Counsel)",
        role: "seller_counsel",
        avatar: "OP",
        message: "Formulated definitive SPA draft reflecting agreed $22.0M valuation and 10% indemnity escrow holdback per signed term sheet.",
        timestamp: "9 Nov, 03:45 PM"
      }
    ],
    signatures: {
      seller: {
        signer: "Vishwa Raj",
        company: "VDR Sell Technologies Inc.",
        role: "Seller Super Admin & Authorized Officer",
        signedAt: "9 Nov 2026, 04:00 PM IST",
        endorsed: true
      },
      buyer: null
    }
  },
  messages: {
    "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf": {
      buyerId: "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf",
      buyerName: "Naga Tech",
      mark: "NT",
      type: "Venture Capital (VC) · Argentina",
      status: "Shortlisted",
      leadName: "Naga raj",
      advisorName: "Ohm Priya",
      currentOffer: "$10.0M",
      threads: [
        {
          id: "m-nr-1",
          sender: "Naga raj",
          senderRole: "buyer",
          isMe: false,
          text: "We have reviewed the VDR documents for VDR Sell. Our board is prepared to proceed with the $10.0M offer with 70% cash consideration.",
          timestamp: "26 Oct, 2:15 PM"
        },
        {
          id: "m-nr-2",
          sender: "You",
          senderRole: "seller",
          isMe: true,
          text: "Thank you Naga raj. We appreciate the prompt proposal. Our counsel has prepared the draft term sheet for your review.",
          timestamp: "26 Oct, 3:40 PM"
        },
        {
          id: "m-nr-3",
          sender: "Naga raj",
          senderRole: "buyer",
          isMe: false,
          text: "Received the term sheet draft. 45 days exclusivity works well for our due diligence team.",
          timestamp: "28 Oct, 11:30 AM"
        }
      ]
    },
    "51013f2a-99dd-4405-95fb-f25502053455": {
      buyerId: "51013f2a-99dd-4405-95fb-f25502053455",
      buyerName: "Test User Deal",
      mark: "TU",
      type: "Individual Buyer · Afghanistan",
      status: "Under review",
      leadName: "Test User",
      advisorName: "Ohm Priya",
      currentOffer: "$9.5M",
      unreadCount: 1,
      threads: [
        {
          id: "m-tu-1",
          sender: "Test User",
          senderRole: "buyer",
          isMe: false,
          text: "Submitted initial offer of $9.5M for VDR Sell with 80% cash component.",
          timestamp: "26 Oct, 2:00 PM"
        },
        {
          id: "m-tu-2",
          sender: "You",
          senderRole: "seller",
          isMe: true,
          text: "We have reviewed your $9.5M offer and sent over a counter at $10.0M asking valuation. Please review the note in your bid dashboard.",
          timestamp: "28 Oct, 2:20 PM"
        }
      ]
    }
  }
};

// Helper for resolving buyer bid by ID, buyerId, or alias without polluting bids dictionary
export function getBidForBuyer(store, key) {
  if (!store?.bids) return null;
  if (!key) return Object.values(store.bids)[0] || null;
  if (store.bids[key]) return store.bids[key];
  if (key === 'b') return store.bids["51013f2a-99dd-4405-95fb-f25502053455"] || Object.values(store.bids)[0] || null;
  if (key === 'c') return store.bids["3e5cac9b-e809-4a2a-a95d-35e9baa6eddf"] || Object.values(store.bids)[0] || null;

  const all = Object.values(store.bids);
  return all.find(b => b.buyerId === key || b.id === key) || all[0] || null;
}

// Helper for resolving buyer message thread by ID or alias
export function getMessageForBuyer(store, key) {
  if (!store?.messages) return null;
  if (!key) return Object.values(store.messages)[0] || null;
  if (store.messages[key]) return store.messages[key];
  if (key === 'b') return store.messages["51013f2a-99dd-4405-95fb-f25502053455"] || Object.values(store.messages)[0] || null;
  if (key === 'c') return store.messages["3e5cac9b-e809-4a2a-a95d-35e9baa6eddf"] || Object.values(store.messages)[0] || null;

  const all = Object.values(store.messages);
  return all.find(m => m.buyerUserId === key || m.buyerId === key) || all[0] || null;
}

// MAPPERS: PostgreSQL (snake_case) <-> Application (camelCase)
export function mapRoundFromDB(r) {
  if (!r) return DEFAULT_INITIAL_STATE.round;
  const numAsking = Number(r.asking_price) || 10000000;
  const rawFmt = r.asking_price_formatted || '';
  const validFmt = /^\$\d/.test(rawFmt) ? rawFmt : `$${(numAsking / 1000000).toFixed(1)}M`;
  return {
    id: r.id,
    dealId: r.deal_id || r.id,
    dealName: r.deal_name || "VDR Sell",
    askingPrice: numAsking,
    askingPriceFormatted: validFmt,
    status: r.status || "evaluation",
    statusLabel: r.status_label || "Bid Evaluation",
    openedDate: r.opened_date || "14 Oct 2026",
    deadline: r.deadline || "2026-11-20T18:00:00+05:30",
    deadlineDisplay: r.deadline_display || "18:00 IST, 20 Nov 2026",
    invitedCount: r.invited_count ?? 2,
    sector: r.sector || "Technology / SaaS",
    arr: r.arr || "$1M ARR · 30% Gross Margin",
    employees: r.employees || "11-20 employees",
    financialHealth: r.financial_health || "EBITDA 24%",
    sellerAdvisor: r.seller_advisor || "Ohm Priya (Seller Admin)",
  };
}

export function mapRoundToDB(round) {
  return {
    deal_name: round.dealName,
    asking_price: round.askingPrice,
    asking_price_formatted: round.askingPriceFormatted,
    status: round.status,
    status_label: round.statusLabel,
    opened_date: round.openedDate,
    deadline: round.deadline,
    deadline_display: round.deadlineDisplay,
    invited_count: round.invitedCount,
    sector: round.sector,
    arr: round.arr,
    employees: round.employees,
    financial_health: round.financialHealth,
    seller_advisor: round.sellerAdvisor,
    updated_at: new Date().toISOString()
  };
}

export function mapBidFromDB(b) {
  if (!b) return null;
  return {
    id: b.id,
    roundId: b.round_id,
    dealId: b.deal_id || b.id,
    buyerId: b.buyer_id,
    name: b.name,
    mark: b.mark,
    type: b.type,
    buyerRole: b.buyer_role || "guest_admin",
    offerAmount: Number(b.offer_amount) || 0,
    offer: b.offer,
    vsAsk: b.vs_ask,
    vsColor: b.vs_color,
    cash: b.cash,
    stock: b.stock,
    close: b.close,
    expectedCloseDate: b.expected_close_date,
    status: b.status,
    engagement: b.engagement,
    views: b.views || 0,
    submittedAt: b.submitted_at,
    financingType: b.financing_type,
    contingencies: b.contingencies,
    note: b.note,
    ndaSignedDate: b.nda_signed_date,
    leadName: b.lead_name,
    advisorName: b.advisor_name,
    documents: typeof b.documents === 'string' ? JSON.parse(b.documents) : (b.documents || []),
    counterOffer: typeof b.counter_offer === 'string' ? JSON.parse(b.counter_offer) : (b.counter_offer || null),
    history: typeof b.history === 'string' ? JSON.parse(b.history) : (b.history || []),
    updatedAt: b.updated_at || b.created_at || new Date().toISOString()
  };
}

export function mapBidToDB(bid, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  return {
    id: bid.id,
    round_id: bid.roundId || roundId,
    deal_id: bid.dealId || bid.id,
    buyer_id: bid.buyerId || null,
    name: bid.name,
    mark: bid.mark || 'NT',
    type: bid.type || 'Strategic Buyer',
    buyer_role: bid.buyerRole || 'guest_admin',
    offer_amount: Number(bid.offerAmount) || 0,
    offer: bid.offer,
    vs_ask: bid.vsAsk,
    vs_color: bid.vsColor,
    cash: bid.cash,
    stock: bid.stock,
    close: bid.close,
    expected_close_date: bid.expectedCloseDate,
    status: bid.status,
    engagement: bid.engagement || '0 docs',
    views: bid.views || 0,
    submitted_at: bid.submittedAt,
    financing_type: bid.financingType,
    contingencies: bid.contingencies,
    note: bid.note,
    nda_signed_date: bid.ndaSignedDate,
    lead_name: bid.leadName,
    advisor_name: bid.advisorName,
    documents: bid.documents || [],
    counter_offer: bid.counterOffer || null,
    history: bid.history || [],
    updated_at: new Date().toISOString()
  };
}

export function mapTermSheetFromDB(ts) {
  if (!ts) return DEFAULT_INITIAL_STATE.termSheet;
  return {
    id: ts.id,
    roundId: ts.round_id,
    dealName: ts.deal_name || "VDR Sell",
    acceptedBidId: ts.accepted_bid_id || "3e5cac9b-e809-4a2a-a95d-35e9baa6eddf",
    buyerName: ts.buyer_name || "Naga Tech",
    buyerMark: ts.buyer_mark || "NT",
    buyerType: ts.buyer_type || "Venture Capital (VC) · Argentina",
    version: ts.version || "Draft v1",
    stage: ts.stage || "Stage 5 of 6",
    status: ts.status || "draft",
    lastUpdated: ts.last_updated || "28 Oct 2026",
    updatedBy: ts.updated_by || "Ohm Priya (Seller Admin)",
    keyTerms: typeof ts.key_terms === 'string' ? JSON.parse(ts.key_terms) : (ts.key_terms || {}),
    changedFields: typeof ts.changed_fields === 'string' ? JSON.parse(ts.changed_fields) : (ts.changed_fields || {}),
    counselComments: typeof ts.counsel_comments === 'string' ? JSON.parse(ts.counsel_comments) : (ts.counsel_comments || []),
    signatures: typeof ts.signatures === 'string' ? JSON.parse(ts.signatures) : (ts.signatures || { buyer: null, seller: null })
  };
}

export function mapTermSheetToDB(ts, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  return {
    id: ts.id || 'ts_vdr_sell',
    round_id: ts.roundId || roundId,
    deal_name: ts.dealName,
    accepted_bid_id: ts.acceptedBidId,
    buyer_name: ts.buyerName,
    buyer_mark: ts.buyerMark,
    buyer_type: ts.buyerType,
    version: ts.version,
    stage: ts.stage,
    status: ts.status,
    last_updated: ts.lastUpdated,
    updated_by: ts.updatedBy,
    key_terms: ts.keyTerms || {},
    changed_fields: ts.changedFields || {},
    counsel_comments: ts.counselComments || [],
    signatures: ts.signatures || { buyer: null, seller: null },
    updated_at: new Date().toISOString()
  };
}

export function mapMessageFromDB(msg) {
  if (!msg) return null;
  return {
    buyerId: msg.id || msg.buyer_id,
    buyerUserId: msg.buyer_id,
    roundId: msg.round_id,
    buyerName: msg.buyer_name,
    mark: msg.mark || 'NT',
    type: msg.type || '',
    status: msg.status || '',
    leadName: msg.lead_name || '',
    advisorName: msg.advisor_name || '',
    currentOffer: msg.current_offer || '',
    unreadCount: msg.unread_count || 0,
    threads: typeof msg.threads === 'string' ? JSON.parse(msg.threads) : (msg.threads || [])
  };
}

export function mapMessageToDB(msg, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  return {
    id: msg.buyerId,
    round_id: msg.roundId || roundId,
    buyer_id: msg.buyerUserId || msg.buyerId,
    buyer_name: msg.buyerName,
    mark: msg.mark || 'NT',
    type: msg.type || '',
    status: msg.status || '',
    lead_name: msg.leadName || '',
    advisor_name: msg.advisorName || '',
    current_offer: msg.currentOffer || '',
    unread_count: msg.unreadCount || 0,
    threads: msg.threads || [],
    updated_at: new Date().toISOString()
  };
}

// Fast In-Memory Cache + Request Coalescing to prevent duplicate DB hits and disk writes on reads
let _memCache = null;
let _memCacheAt = 0;
let _memCacheKey = null;
const _inFlightLoads = new Map();
const BIDDING_CACHE_TTL_MS = 5000;

export function invalidateBiddingCache() {
  _memCache = null;
  _memCacheAt = 0;
  _memCacheKey = null;
}

// ASYNC DB OPERATIONS FOR REAL DATA
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
      // 1. Fetch Round
      let roundRow = null;
      if (cacheKey !== '__default__') {
        const { data } = await db.from('bidding_rounds').select('*').or(`id.eq.${cacheKey},deal_id.eq.${cacheKey}`).maybeSingle();
        roundRow = data;
      }
      if (!roundRow) {
        const { data } = await db.from('bidding_rounds').select('*').eq('id', 'c7330177-a8ab-47a2-933c-af0be1d1246f').maybeSingle();
        roundRow = data;
      }

      const targetRoundId = roundRow?.id || 'c7330177-a8ab-47a2-933c-af0be1d1246f';

      // 2. Fetch Bids, Term Sheet, and Messages in parallel
      const [bidsRes, tsRes, msgRes] = await Promise.all([
        db.from('bidding_bids').select('*').eq('round_id', targetRoundId).order('updated_at', { ascending: false }),
        db.from('bidding_term_sheets').select('*').eq('round_id', targetRoundId).maybeSingle(),
        db.from('bidding_messages').select('*').eq('round_id', targetRoundId)
      ]);

      const round = roundRow ? mapRoundFromDB(roundRow) : DEFAULT_INITIAL_STATE.round;

      const bids = {};
      if (bidsRes.data && bidsRes.data.length > 0) {
        for (const row of bidsRes.data) {
          const mapped = mapBidFromDB(row);
          if (mapped && mapped.id) {
            bids[mapped.id] = mapped;
          }
        }
      } else {
        Object.assign(bids, DEFAULT_INITIAL_STATE.bids);
      }

      const termSheet = tsRes.data ? mapTermSheetFromDB(tsRes.data) : DEFAULT_INITIAL_STATE.termSheet;

      const messages = {};
      if (msgRes.data && msgRes.data.length > 0) {
        for (const row of msgRes.data) {
          const mapped = mapMessageFromDB(row);
          if (mapped && mapped.buyerId) {
            messages[mapped.buyerId] = mapped;
            if (mapped.buyerUserId) messages[mapped.buyerUserId] = mapped;
          }
        }
      } else {
        Object.assign(messages, DEFAULT_INITIAL_STATE.messages);
      }

      const existingStore = loadBiddingStore();
      const spa = existingStore?.spa ? { ...DEFAULT_INITIAL_STATE.spa, ...existingStore.spa } : { ...DEFAULT_INITIAL_STATE.spa };

      if (termSheet && termSheet.keyTerms) {
        spa.articles = { ...spa.articles };
        if (termSheet.keyTerms.purchasePrice) spa.articles.purchasePrice = termSheet.keyTerms.purchasePrice;
        if (termSheet.keyTerms.structure) spa.articles.cashComponent = termSheet.keyTerms.structure;
        if (termSheet.keyTerms.expectedClose) spa.articles.closingDate = termSheet.keyTerms.expectedClose;
        if (termSheet.buyerName) spa.buyerName = termSheet.buyerName;
      }

      const state = {
        round,
        bids,
        termSheet,
        spa,
        messages,
        updatedAt: new Date().toISOString()
      };

      _memCache = state;
      _memCacheKey = cacheKey;
      _memCacheAt = Date.now();
      return state;
    } catch (error) {
      console.error('[biddingFlowService] Error loading real data from DB, falling back:', error);
      return loadBiddingStore();
    } finally {
      _inFlightLoads.delete(cacheKey);
    }
  })();

  _inFlightLoads.set(cacheKey, loadPromise);
  return loadPromise;
}

export async function updateRoundInDB(updates, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  try {
    invalidateBiddingCache();
    const currentStore = await loadBiddingStoreAsync(roundId);
    const updatedRound = { ...currentStore.round, ...updates };
    if (updates.askingPrice && !updates.askingPriceFormatted) {
      updatedRound.askingPriceFormatted = `$${(Number(updates.askingPrice) / 1000000).toFixed(1)}M`;
    }

    const dbPayload = mapRoundToDB(updatedRound);
    const targetId = updatedRound.id || 'c7330177-a8ab-47a2-933c-af0be1d1246f';
    const { data: updatedRows } = await db
      .from('bidding_rounds')
      .update(dbPayload)
      .or(`id.eq.${roundId},deal_id.eq.${roundId}`)
      .select('id');

    if (!updatedRows || updatedRows.length === 0) {
      await db.from('bidding_rounds').update(dbPayload).eq('id', targetId);
    }

    currentStore.round = updatedRound;
    _memCache = currentStore;
    _memCacheAt = Date.now();
    saveBiddingStore(currentStore);

    return updatedRound;
  } catch (error) {
    console.error('[biddingFlowService] Error updating round in DB:', error);
    invalidateBiddingCache();
    const store = loadBiddingStore();
    store.round = { ...store.round, ...updates };
    saveBiddingStore(store);
    return store.round;
  }
}

export async function saveBidInDB(bidData) {
  try {
    const withTimestamp = { ...bidData, updatedAt: new Date().toISOString() };
    const dbPayload = mapBidToDB(withTimestamp, withTimestamp.roundId || 'c7330177-a8ab-47a2-933c-af0be1d1246f');
    const { error } = await db.from('bidding_bids').upsert(dbPayload, { onConflict: 'id' });
    if (error) throw error;

    if (_memCache) {
      if (!_memCache.bids) _memCache.bids = {};
      _memCache.bids[withTimestamp.id] = withTimestamp;
      _memCacheAt = Date.now();
    }

    const store = loadBiddingStore();
    if (!store.bids) store.bids = {};
    store.bids[withTimestamp.id] = withTimestamp;
    saveBiddingStore(store);

    return withTimestamp;
  } catch (error) {
    console.error('[biddingFlowService] Error saving bid in DB:', error);
    invalidateBiddingCache();
    const store = loadBiddingStore();
    if (!store.bids) store.bids = {};
    store.bids[bidData.id] = bidData;
    saveBiddingStore(store);
    return bidData;
  }
}

export async function updateTermSheetInDB(updates, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  try {
    const currentStore = await loadBiddingStoreAsync(roundId);
    const updatedTS = { ...currentStore.termSheet, ...updates };

    const dbPayload = mapTermSheetToDB(updatedTS, roundId);
    const { error } = await db.from('bidding_term_sheets').upsert(dbPayload, { onConflict: 'id' });
    if (error) throw error;

    currentStore.termSheet = updatedTS;
    _memCache = currentStore;
    _memCacheAt = Date.now();
    saveBiddingStore(currentStore);

    return updatedTS;
  } catch (error) {
    console.error('[biddingFlowService] Error updating term sheet in DB:', error);
    invalidateBiddingCache();
    const store = loadBiddingStore();
    store.termSheet = { ...store.termSheet, ...updates };
    saveBiddingStore(store);
    return store.termSheet;
  }
}

export async function updateSpaInDB(updates, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  try {
    const currentStore = await loadBiddingStoreAsync(roundId);
    const updatedSPA = { ...currentStore.spa, ...updates };

    try {
      const dbPayload = {
        id: updatedSPA.id || 'spa_vdr_sell',
        round_id: updatedSPA.roundId || roundId,
        deal_name: updatedSPA.dealName,
        buyer_name: updatedSPA.buyerName,
        seller_name: updatedSPA.sellerName,
        version: updatedSPA.version,
        status: updatedSPA.status,
        last_updated: updatedSPA.lastUpdated,
        articles: updatedSPA.articles || {},
        counsel_comments: updatedSPA.counselComments || [],
        signatures: updatedSPA.signatures || { seller: null, buyer: null },
        updated_at: new Date().toISOString()
      };
      await db.from('bidding_spas').upsert(dbPayload, { onConflict: 'id' });
    } catch (_) {}

    currentStore.spa = updatedSPA;
    _memCache = currentStore;
    _memCacheAt = Date.now();
    saveBiddingStore(currentStore);

    return updatedSPA;
  } catch (error) {
    console.error('[biddingFlowService] Error updating SPA in DB:', error);
    invalidateBiddingCache();
    const store = loadBiddingStore();
    store.spa = { ...store.spa, ...updates };
    saveBiddingStore(store);
    return store.spa;
  }
}

export async function appendMessageInDB(buyerId, newMsg, roundId = 'c7330177-a8ab-47a2-933c-af0be1d1246f') {
  try {
    const { data: existingRow } = await db
      .from('bidding_messages')
      .select('*')
      .or(`id.eq.${buyerId},buyer_id.eq.${buyerId}`)
      .maybeSingle();

    let mappedMsg;
    if (existingRow) {
      mappedMsg = mapMessageFromDB(existingRow);
      mappedMsg.threads = [...(mappedMsg.threads || []), newMsg];
    } else {
      const store = loadBiddingStore();
      const fallbackMsg = store.messages?.[buyerId] || {
        buyerId,
        roundId,
        buyerName: newMsg.senderRole === 'buyer' ? newMsg.sender : "Buyer",
        mark: "NT",
        threads: []
      };
      mappedMsg = { ...fallbackMsg, threads: [...(fallbackMsg.threads || []), newMsg] };
    }

    const dbPayload = mapMessageToDB(mappedMsg, mappedMsg.roundId || roundId);
    await db.from('bidding_messages').upsert(dbPayload, { onConflict: 'id' });

    if (_memCache) {
      if (!_memCache.messages) _memCache.messages = {};
      _memCache.messages[buyerId] = mappedMsg;
      _memCacheAt = Date.now();
    }

    const store = loadBiddingStore();
    if (!store.messages) store.messages = {};
    store.messages[buyerId] = mappedMsg;
    saveBiddingStore(store);

    return mappedMsg;
  } catch (error) {
    console.error('[biddingFlowService] Error saving message in DB:', error);
    invalidateBiddingCache();
    const store = loadBiddingStore();
    if (!store.messages) store.messages = {};
    if (!store.messages[buyerId]) {
      store.messages[buyerId] = { buyerId, buyerName: "Buyer", mark: "NT", threads: [] };
    }
    store.messages[buyerId].threads.push(newMsg);
    saveBiddingStore(store);
    return store.messages[buyerId];
  }
}

// Local cache sync
export function loadBiddingStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return {
        round: { ...DEFAULT_INITIAL_STATE.round, ...(data.round || {}) },
        bids: { ...DEFAULT_INITIAL_STATE.bids, ...(data.bids || {}) },
        termSheet: { ...DEFAULT_INITIAL_STATE.termSheet, ...(data.termSheet || {}) },
        spa: { ...DEFAULT_INITIAL_STATE.spa, ...(data.spa || {}) },
        messages: { ...DEFAULT_INITIAL_STATE.messages, ...(data.messages || {}) },
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('Error reading .vdr_bidding_store.json:', err);
  }
  saveBiddingStore(DEFAULT_INITIAL_STATE);
  return DEFAULT_INITIAL_STATE;
}

export function saveBiddingStore(state) {
  try {
    const rawBids = state.bids || DEFAULT_INITIAL_STATE.bids || {};
    const cleanBids = {};
    for (const b of Object.values(rawBids)) {
      if (b && b.id && !cleanBids[b.id]) {
        cleanBids[b.id] = b;
      }
    }

    const rawMsgs = state.messages || DEFAULT_INITIAL_STATE.messages || {};
    const cleanMessages = {};
    for (const m of Object.values(rawMsgs)) {
      if (m && m.buyerId && !cleanMessages[m.buyerId]) {
        cleanMessages[m.buyerId] = m;
      }
    }

    const dataToSave = {
      round: state.round || DEFAULT_INITIAL_STATE.round,
      bids: cleanBids,
      termSheet: state.termSheet || DEFAULT_INITIAL_STATE.termSheet,
      spa: state.spa || DEFAULT_INITIAL_STATE.spa,
      messages: cleanMessages,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing .vdr_bidding_store.json:', err);
    return false;
  }
}

// Compute dynamic KPI metrics for Seller Bidding Dashboard
export function computeBiddingKPIs(store) {
  const bidsList = Object.values(store.bids || {}).filter((b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx);
  const receivedCount = bidsList.length;
  const invitedCount = store.round?.invitedCount || 2;

  const validOffers = bidsList.map(b => b.offerAmount).filter(a => typeof a === 'number' && a > 0);
  const highestOffer = validOffers.length > 0 ? Math.max(...validOffers) : 10000000;
  const avgOffer = validOffers.length > 0 ? validOffers.reduce((acc, v) => acc + v, 0) / validOffers.length : 9750000;

  const cashList = bidsList.map(b => {
    const pct = parseInt(String(b.cash).replace('%', ''), 10);
    return isNaN(pct) ? 70 : pct;
  });
  const medianCash = cashList.length > 0 ? Math.round(cashList.reduce((acc, v) => acc + v, 0) / cashList.length) : 75;
  const totalViews = bidsList.reduce((acc, b) => acc + (b.views || 0), 0);

  return {
    receivedCount,
    invitedCount,
    highestOfferFormatted: `$${(highestOffer / 1000000).toFixed(1)}M`,
    averageOfferFormatted: `$${(avgOffer / 1000000).toFixed(1)}M`,
    medianCashFormatted: `${medianCash}%`,
    totalViews,
    highestEngagedBuyer: bidsList.sort((a, b) => (b.views || 0) - (a.views || 0))[0]?.name || "Naga Tech"
  };
}
