"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  Gavel,
  RefreshCw,
  Send,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useDealWorkflow, normalizeRole } from './DealWorkflowContext';

export default function NegotiationBiddingTracker({ onSwitchToTaskBoard }) {
  const router = useRouter();
  const {
    currentUser,
    dealInfo,
    negotiationInvitation,
  } = useDealWorkflow();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bidsData, setBidsData] = useState({});
  const [roundData, setRoundData] = useState(null);
  const [termSheetData, setTermSheetData] = useState(null);
  const [spaData, setSpaData] = useState(null);
  const [myBidData, setMyBidData] = useState(null);
  const [messagesData, setMessagesData] = useState(null);
  const [spaStatus, setSpaStatus] = useState(null);
  const [isDispatchingSPA, setIsDispatchingSPA] = useState(false);
  const [isMatchingCounter, setIsMatchingCounter] = useState(false);
  const [isAcceptingBid, setIsAcceptingBid] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const normRole = normalizeRole(currentUser?.role);
  const isBuyerSide =
    currentUser?.side === 'buyer' ||
    ['guest_admin', 'advisor', 'guest_lead', 'external_user', 'buyer'].includes(normRole) ||
    String(currentUser?.role || '').toLowerCase().includes('guest') ||
    String(currentUser?.role || '').toLowerCase().includes('buyer') ||
    String(currentUser?.dms_role || '').toLowerCase() === 'buyer';

  const isSellerSide = !isBuyerSide;
  const isSuperAdmin = normRole === 'super_admin' || normRole === 'guest_admin';

  // Manual sync function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      let buyerId = '';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
        }
      } catch (e) { }

      const roleParam = isBuyerSide ? 'guest_admin' : 'super_admin';
      const [bidsRes, tsRes, spaRes, msgRes] = await Promise.all([
        fetch(`/api/bidding/bids?role=${roleParam}${buyerId ? `&buyerId=${encodeURIComponent(buyerId)}` : ''}`),
        fetch('/api/bidding/term-sheet'),
        fetch('/api/bidding/spa'),
        fetch(`/api/bidding/messages${buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : ''}`).catch(() => null),
      ]);

      if (bidsRes.ok) {
        const bJson = await bidsRes.json();
        setBidsData(bJson.bids || {});
        if (bJson.round) setRoundData(bJson.round);
        setMyBidData(bJson.myBid || null);
      }

      if (tsRes.ok) {
        const tsJson = await tsRes.json();
        if (tsJson.termSheet) setTermSheetData(tsJson.termSheet);
      }

      if (spaRes?.ok) {
        const sJson = await spaRes.json();
        setSpaData(sJson?.spa || null);
        if (sJson?.spa && (sJson.spa.status === 'dispatched' || sJson.spa.status === 'executed')) {
          setSpaStatus({ dispatched: true, date: sJson.spa.lastUpdated || '' });
        } else {
          setSpaStatus(null);
        }
      }

      if (msgRes?.ok) {
        const mJson = await msgRes.json();
        if (mJson.conversation) {
          setMessagesData(mJson.conversation);
        } else if (mJson.conversations) {
          const list = Object.values(mJson.conversations || {});
          setMessagesData(list[0] || null);
        }
      }

      setLastRefreshedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('Error fetching live bidding status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isBuyerSide]);

  // Initial fetch & light interval polling (every 6s)
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        let buyerId = '';
        try {
          const raw = localStorage.getItem('vdr_session');
          if (raw) {
            const user = JSON.parse(raw);
            if (user.id) buyerId = user.id;
          }
        } catch (e) { }

        const roleParam = isBuyerSide ? 'guest_admin' : 'super_admin';
        const [bidsRes, tsRes, spaRes, msgRes] = await Promise.all([
          fetch(`/api/bidding/bids?role=${roleParam}${buyerId ? `&buyerId=${encodeURIComponent(buyerId)}` : ''}`),
          fetch('/api/bidding/term-sheet'),
          fetch('/api/bidding/spa'),
          fetch(`/api/bidding/messages${buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : ''}`).catch(() => null),
        ]);

        if (isCancelled) return;

        if (bidsRes.ok) {
          const bJson = await bidsRes.json();
          if (isCancelled) return;
          setBidsData(bJson.bids || {});
          if (bJson.round) setRoundData(bJson.round);
          setMyBidData(bJson.myBid || null);
        }

        if (tsRes.ok) {
          const tsJson = await tsRes.json();
          if (isCancelled) return;
          if (tsJson.termSheet) setTermSheetData(tsJson.termSheet);
        }

        if (spaRes?.ok) {
          const sJson = await spaRes.json();
          if (!isCancelled) {
            setSpaData(sJson?.spa || null);
            if (sJson?.spa && (sJson.spa.status === 'dispatched' || sJson.spa.status === 'executed')) {
              setSpaStatus({ dispatched: true, date: sJson.spa.lastUpdated || '' });
            } else {
              setSpaStatus(null);
            }
          }
        }

        if (msgRes?.ok) {
          const mJson = await msgRes.json();
          if (!isCancelled) {
            if (mJson.conversation) {
              setMessagesData(mJson.conversation);
            } else if (mJson.conversations) {
              const list = Object.values(mJson.conversations || {});
              setMessagesData(list[0] || null);
            }
          }
        }

        if (!isCancelled) {
          setLastRefreshedAt(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }
      } catch (err) {
        console.error('Error in periodic bidding fetch:', err);
      }
    };

    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 6000);

    const handleStorageChange = (e) => {
      if (
        e.key === 'dms_negotiation_invitation' ||
        e.key === 'vdr_bidding_store' ||
        e.key === 'dms_spa_agreement_dispatched'
      ) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bid_submitted', loadData);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bid_submitted', loadData);
    };
  }, [isBuyerSide]);

  // Resolve active counter party bid
  const activeBid = useMemo(() => {
    if (myBidData && myBidData.offerAmount) return myBidData;
    const all = Object.values(bidsData || {});
    if (all.length === 0) return null;
    const accepted = all.find((b) => b.status === 'Accepted');
    if (accepted) return accepted;
    const shortlisted = all.find((b) => b.status === 'Shortlisted');
    if (shortlisted) return shortlisted;
    const underReview = all.find((b) => b.status === 'Under review');
    if (underReview) return underReview;
    return all[0];
  }, [myBidData, bidsData]);

  // Formatted Initial Benchmark Amount (only shown once invitation is sent / round is active)
  const isInviteSentOrActive = Boolean(
    (negotiationInvitation?.askingPrice && Number(negotiationInvitation.askingPrice) > 0) ||
    (roundData?.status === 'open' && Number(roundData?.askingPrice) > 0) ||
    activeBid?.offerAmount
  );

  const initialBidAmount = useMemo(() => {
    if (!isInviteSentOrActive) return 'Not set';
    if (negotiationInvitation?.askingPrice && Number(negotiationInvitation.askingPrice) > 0) {
      return `$${(Number(negotiationInvitation.askingPrice) / 1000000).toFixed(1)}M`;
    }
    if (roundData?.askingPrice && Number(roundData.askingPrice) > 0) {
      return `$${(Number(roundData.askingPrice) / 1000000).toFixed(1)}M`;
    }
    return 'Not set';
  }, [isInviteSentOrActive, negotiationInvitation, roundData]);

  // Counter Party Details
  const counterPartyName = useMemo(() => {
    return activeBid?.name || dealInfo?.buyerCompany || 'Buyer';
  }, [activeBid, dealInfo]);

  const counterPartyOffer = useMemo(() => {
    if (activeBid?.offer) return activeBid.offer;
    return 'Awaiting Offer';
  }, [activeBid]);

  // Handler for Buyer to Match Seller Counter-Offer
  const handleMatchCounter = useCallback(async () => {
    const targetBidId = activeBid?.id || activeBid?.buyerId;
    if (!targetBidId) return;
    const counterAmountFormatted = activeBid?.counterOffer?.amountFormatted || '';
    if (!confirm(`Match seller counter-offer${counterAmountFormatted ? ` at ${counterAmountFormatted}` : ''}?`)) return;
    setIsMatchingCounter(true);
    try {
      const res = await fetch(`/api/bidding/bids/${targetBidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MATCH_COUNTER',
          buyerId: targetBidId,
          requesterRole: 'guest_admin',
        }),
      });
      if (res.ok) {
        alert(`You have matched the seller counter-offer at ${counterAmountFormatted}!`);
        await handleManualRefresh();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error('Error matching counter:', e);
    } finally {
      setIsMatchingCounter(false);
    }
  }, [activeBid, handleManualRefresh]);

  // Handler for Seller to Accept Proposal
  const handleAcceptBid = useCallback(async () => {
    const targetBidId = activeBid?.id || activeBid?.buyerId;
    if (!targetBidId) return;
    if (!confirm(`Accept proposal from ${counterPartyName} (${counterPartyOffer}) and advance to Term Sheet?`)) return;
    setIsAcceptingBid(true);
    try {
      const res = await fetch(`/api/bidding/bids/${targetBidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          requesterRole: 'super_admin',
        }),
      });
      if (res.ok) {
        await handleManualRefresh();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
        router.push('/bidding/seller-side/term-sheet');
      }
    } catch (e) {
      console.error('Error accepting bid:', e);
    } finally {
      setIsAcceptingBid(false);
    }
  }, [activeBid, counterPartyName, counterPartyOffer, handleManualRefresh, router]);

  // Handler to dispatch SPA agreement (Step 5)
  const handleDispatchSPA = useCallback(async () => {
    setIsDispatchingSPA(true);
    try {
      const now = new Date();
      const payload = {
        dispatched: true,
        date: `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
        dispatchedBy: currentUser?.name || 'Seller Super Admin',
        recipient: counterPartyName,
        documentName: 'Share_Purchase_Agreement_v1.0_Final.pdf'
      };
      localStorage.setItem('dms_spa_agreement_dispatched', JSON.stringify(payload));
      setSpaStatus(payload);
    } catch (e) {
      console.error('Error dispatching SPA:', e);
    } finally {
      setIsDispatchingSPA(false);
    }
  }, [currentUser, counterPartyName]);

  // =========================================================================
  // THE 5 PREDEFINED STEPS REQUESTED BY USER:
  // 1. Initial bid amount set pantrathu
  // 2. Counter party (Offer / Review / Custom Bidding Operations)
  // 3. Term sheet sign panna soltrathu (Sent for Signature)
  // 4. Sign panninathu (Term Sheet Signed)
  // 5. SPA agreement anupurathu (SPA Dispatched)
  // =========================================================================
  const steps = useMemo(() => {
    // Step 1: Initial Bid Amount Set (ONLY done when Seller has sent invitation or opened round with asking price)
    const step1Done = isInviteSentOrActive;

    // Step 2: Counter Party Proposal & Bidding Operations
    const step2Done = Boolean(
      activeBid &&
      (activeBid.offerAmount || activeBid.status === 'Shortlisted' || activeBid.status === 'Accepted' || activeBid.counterOffer)
    );

    // Step 3: Term Sheet Sign Request Sent (Only true for buyer when transmitted)
    const isTermSheetSent = Boolean(
      termSheetData &&
      (termSheetData.status === 'sent_to_buyer' ||
        termSheetData.status === 'signed' ||
        termSheetData.status === 'signed_by_buyer' ||
        termSheetData.status === 'executed' ||
        termSheetData.signatures?.buyer)
    );
    const step3Done = Boolean(step2Done && (isSellerSide ? (isTermSheetSent || activeBid?.status === 'Accepted') : isTermSheetSent));

    // Step 4: Term Sheet Signed
    const isTermSheetSigned = Boolean(
      termSheetData &&
      (termSheetData.status === 'signed' || termSheetData.status === 'signed_by_buyer' || termSheetData.status === 'executed' || termSheetData.signatures?.buyer)
    );
    const step4Done = Boolean(step3Done && isTermSheetSigned);

    // Step 5: SPA Agreement Dispatched / Executed
    const isSpaExecuted = Boolean(spaData && spaData.status === 'executed');
    const isSpaDispatched = Boolean(isSpaExecuted || spaData?.status === 'dispatched' || spaStatus?.dispatched);
    const step5Done = Boolean(step4Done && isSpaDispatched);

    const uploadedDocsList = Array.isArray(activeBid?.documents) ? activeBid.documents : [];
    const loiDoc =
      uploadedDocsList.find(
        (d) =>
          (d.name || '').toLowerCase().includes('loi') ||
          (d.name || '').toLowerCase().includes('intent')
      ) ||
      uploadedDocsList[0] ||
      null;

    const historyList = Array.isArray(activeBid?.history) ? activeBid.history : [];
    const chatThreads = Array.isArray(messagesData?.threads) ? messagesData.threads : [];

    return [
      {
        id: 'STEP_1',
        number: 1,
        title: 'Negotiation Stage Enabled & Invitation Sent',
        desc: step1Done
          ? `Seller Board activated Negotiation Stage and sent formal invitation (Benchmark: ${initialBidAmount}). Buyer accepted invitation.`
          : 'Awaiting Seller Board negotiation invitation & asking price benchmark',
        isDone: step1Done,
        isActive: !step1Done,
        tag: `Benchmark: ${initialBidAmount}`,
        actionText: null,
      },
      {
        id: 'STEP_2',
        number: 2,
        title: 'Buyer Proposal & Bilateral Bidding Operations',
        desc: step2Done
          ? `Counter party (${counterPartyName}) submitted customized acquisition proposal (${counterPartyOffer}, ${activeBid?.vsAsk || '+50% vs Ask'}), LOI document, and bilateral negotiation history.`
          : `Awaiting proposal & LOI submission from ${counterPartyName}`,
        isDone: step2Done,
        isActive: step1Done && !step2Done,
        tag: activeBid?.status === 'Accepted'
          ? `Accepted: ${counterPartyOffer}`
          : activeBid?.counterOffer
            ? `Countered: ${activeBid.counterOffer.amountFormatted}`
            : `Offer: ${counterPartyOffer}`,
        loiDoc: step2Done ? loiDoc : null,
        historyList,
        chatThreads,
        actionText: step1Done ? (isSellerSide ? 'View Bidding Ledger' : 'My Bid Portal') : null,
        actionUrl: isSellerSide ? '/bidding/seller-side' : '/bidding/buyer-side/my-bid',
      },
      {
        id: 'STEP_3',
        number: 3,
        title: 'Term Sheet Sign Request',
        desc: isTermSheetSent
          ? 'Agreed commercial terms formulated into Term Sheet & sent to buyer for sign-off'
          : 'Agreed commercial terms being formulated into Term Sheet by seller board',
        isDone: step3Done,
        isActive: step2Done && !step3Done,
        tag: termSheetData?.keyTerms?.exclusivityPeriod
          ? `Exclusivity: ${termSheetData.keyTerms.exclusivityPeriod}`
          : (isTermSheetSent ? 'Sent for Signature' : 'Awaiting Term Sheet'),
        actionText: step2Done && (isSellerSide || isTermSheetSent) ? 'Review Term Sheet' : null,
        actionUrl: isSellerSide ? '/bidding/seller-side/term-sheet' : (isTermSheetSent ? '/bidding/buyer-side/term-sheet' : null),
      },
      {
        id: 'STEP_4',
        number: 4,
        title: 'Term Sheet Signed',
        desc: 'Digital signatures endorsed by counter party executive leads',
        isDone: step4Done,
        isActive: step3Done && !step4Done,
        tag: step4Done ? 'Signed & Executed' : 'Awaiting Buyer Signatures',
        actionText: !step4Done && isBuyerSide && isTermSheetSent ? 'Sign Term Sheet' : null,
        actionUrl: isTermSheetSent ? '/bidding/buyer-side/term-sheet' : null,
      },
      {
        id: 'STEP_5',
        number: 5,
        title: 'SPA Agreement Dispatched & Executed',
        desc: 'Definitive Share Purchase Agreement (SPA) closing and binding execution',
        isDone: step5Done,
        isActive: step4Done && !step5Done,
        tag: isSpaExecuted
          ? `Executed & Closed: ${spaData?.signatures?.buyer?.signedAt || spaStatus?.date || 'Closed'}`
          : isSpaDispatched
            ? `Dispatched: ${spaData?.lastUpdated || spaStatus?.date || 'Sent'}`
            : (isSellerSide ? 'Formulate SPA' : 'Awaiting Seller Dispatch'),
        actionText: step4Done ? (isSellerSide ? (step5Done ? 'View SPA Agreement' : 'Formulate / Dispatch SPA') : (isSpaDispatched ? 'Review & Execute SPA' : null)) : null,
        actionUrl: isSellerSide ? '/bidding/seller-side/spa' : (isSpaDispatched ? '/bidding/buyer-side/spa' : null),
      },
    ];
  }, [
    isInviteSentOrActive,
    activeBid,
    termSheetData,
    spaData,
    spaStatus,
    initialBidAmount,
    counterPartyName,
    counterPartyOffer,
    messagesData,
    isSellerSide,
    isBuyerSide,
  ]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ========================================================================= */}
      {/* 5-STEP VERTICAL PROGRESSION PIPELINE                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#006666]">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bidding & Negotiation Pipeline</h3>
              <p className="text-xs text-slate-500">Live transaction lifecycle: invitation, custom offers, counter negotiations, term sheet & SPA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-all"
            title="Refresh live bidding data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#006666]' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>

        <div className="relative pl-1 sm:pl-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isStep2 = step.id === 'STEP_2';

            return (
              <div key={step.id} className="relative flex items-start gap-3 sm:gap-4 pb-6 last:pb-1">
                {/* Left: Vertical Track & Node Circle */}
                <div className="relative flex flex-col items-center shrink-0 self-stretch">
                  {/* Node Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${step.isDone
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-50'
                      : step.isActive
                        ? 'bg-teal-50 border-2 border-teal-600 text-[#006666] ring-4 ring-teal-50'
                        : 'bg-slate-100 border border-slate-300 text-slate-400'
                      }`}
                  >
                    {step.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                  </div>

                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 my-1 transition-colors duration-300 min-h-[44px] ${step.isDone ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                    />
                  )}
                </div>

                {/* Right: Content Card Directly Beside */}
                <div
                  className={`flex-1 flex flex-col gap-3 p-3.5 sm:p-5 rounded-xl border transition-all duration-200 ${step.isDone
                    ? 'bg-emerald-50/20 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                    : step.isActive
                      ? 'bg-white border-teal-400 ring-2 ring-teal-100 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 opacity-65'
                    }`}
                >
                  {/* Step Header (Title, Pill, Tag, Action Button) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-xs sm:text-[14px] font-bold ${step.isDone ? 'text-slate-900' : step.isActive ? 'text-teal-950 font-extrabold' : 'text-slate-600'
                            }`}
                        >
                          {step.title}
                        </h4>

                        {/* Status Pill */}
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${step.isDone
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : step.isActive
                              ? 'bg-teal-100 text-teal-800 border border-teal-300 animate-pulse'
                              : 'bg-slate-200 text-slate-500 border border-slate-200'
                            }`}
                        >
                          {step.isDone ? '✓ Completed' : step.isActive ? 'In Progress' : 'Pending'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-[13px] text-slate-600 mt-1 font-normal">
                        {step.desc}
                      </p>
                    </div>

                    {/* Right: Info Tag & Direct Action Button for Standard Steps */}
                    {!isStep2 && (
                      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${step.isDone
                            ? 'bg-emerald-100/70 text-emerald-900 font-bold'
                            : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {step.tag}
                        </span>

                        {step.actionText && (
                          step.actionUrl ? (
                            <button
                              type="button"
                              onClick={() => router.push(step.actionUrl)}
                              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{step.actionText}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>

                  {/* ================================================================= */}
                  {/* STEP 2 ENRICHED CONTENT: FULL BILATERAL BIDDING & NEGOTIATION      */}
                  {/* ================================================================= */}
                  {isStep2 && step.isDone && activeBid && (
                    <div className="mt-2 flex flex-col gap-3.5 border-t border-slate-200/80 pt-3.5">
                      {/* 1. KEY VALUATION COMPARISON GRID */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Seller Asking Benchmark */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Seller Benchmark Ask
                          </span>
                          <span className="text-base font-extrabold text-slate-900 mt-0.5">
                            {initialBidAmount}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Initial Board Benchmark
                          </span>
                        </div>

                        {/* Buyer Custom Proposal */}
                        <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 flex flex-col relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                              Buyer Custom Offer
                            </span>
                            <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {activeBid.vsAsk || '+50% vs Ask'}
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-[#006666] mt-0.5">
                            {counterPartyOffer}
                          </span>
                          <span className="text-[10px] text-teal-700 mt-0.5">
                            Proposed by {activeBid.name || counterPartyName}
                          </span>
                        </div>

                        {/* Consideration Mix */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Consideration Structure
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                            {activeBid.cash || '50%'} Cash / {activeBid.stock || '50%'} Stock
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {activeBid.financingType || 'All equity / balance sheet cash'}
                          </span>
                        </div>

                        {/* Target Closing Date */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Target Closing Date
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 mt-0.5">
                            {activeBid.close || activeBid.expectedCloseDate || '24 Nov 2026'}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Status: <strong className="text-emerald-700 font-bold">{activeBid.status || 'Accepted'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* 2. ACTIVE SELLER COUNTER-OFFER CALLOUT (IF COUNTER EXISTS) */}
                      {activeBid.counterOffer && (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                              <RotateCcw className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-amber-950">
                                  Seller Counter-Offer: {activeBid.counterOffer.amountFormatted || '$20.0M'}
                                </span>
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                                  Countered: {activeBid.counterOffer.counteredAt || 'Nov 2026'}
                                </span>
                              </div>
                              <p className="text-xs text-amber-900 mt-1 italic">
                                &quot;{activeBid.counterOffer.note || 'The seller board is requesting benchmark valuation.'}&quot;
                              </p>
                            </div>
                          </div>

                          {/* Quick Buyer Match Action */}
                          {isBuyerSide && activeBid.status !== 'Accepted' && (
                            <button
                              type="button"
                              onClick={handleMatchCounter}
                              disabled={isMatchingCounter}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isMatchingCounter ? 'Matching...' : `Match Counter (${activeBid.counterOffer.amountFormatted})`}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* 3. CONTINGENCIES, NOTES & ATTACHED LOI DOCUMENT */}
                      <div className="flex flex-col md:flex-row items-stretch gap-2.5">
                        {/* Contingencies & Rationale */}
                        <div className="flex-1 p-3 rounded-xl bg-white border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-700">Buyer Proposal Conditions</span>
                            <span className="text-[10px] text-slate-400">Financing & Scope</span>
                          </div>
                          <div className="text-slate-600 space-y-1">
                            <p>
                              <strong className="text-slate-800 font-semibold">Contingencies:</strong> {activeBid.contingencies || 'None specified'}
                            </p>
                            <p>
                              <strong className="text-slate-800 font-semibold">Offer Note:</strong> {activeBid.note || 'Acquisition offer submitted with formal LOI attached.'}
                            </p>
                          </div>
                        </div>

                        {/* LOI Document Badge */}
                        {step.loiDoc && (
                          <div className="w-full md:w-80 p-3 rounded-xl bg-teal-50/60 border border-teal-200/90 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                                  Official LOI Document
                                </span>
                                <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Verified
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <FileText className="w-4 h-4 text-[#006666] shrink-0" />
                                <span className="font-bold text-slate-900 truncate">
                                  {step.loiDoc.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                                Size: {step.loiDoc.size || '210 KB'} · Attached by {activeBid.name || 'Buyer'}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-teal-100 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(step.actionUrl)}
                                className="text-[11px] font-bold text-[#006666] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect LOI</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. EXPANDABLE BILATERAL NEGOTIATION ROUNDS HISTORY (ALL 16 TURNS) */}
                      {step.historyList && step.historyList.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowHistory((prev) => !prev)}
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-[#006666]" />
                              <span>Negotiation Rounds & Audit History ({step.historyList.length} Operations Recorded)</span>
                              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Bilateral Ledger
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                              <span>{showHistory ? 'Collapse Rounds' : 'Show All Rounds'}</span>
                              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </button>

                          {showHistory && (
                            <div className="p-3 border-t border-slate-200 bg-white max-h-72 overflow-y-auto space-y-2">
                              {step.historyList.map((item, hIdx) => {
                                const isSellerTurn =
                                  item.event.toLowerCase().includes('seller') ||
                                  item.event.toLowerCase().includes('counter-offer sent') ||
                                  item.event.toLowerCase().includes('accepted by seller');

                                return (
                                  <div
                                    key={hIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isSellerTurn
                                      ? 'bg-purple-50/40 border-purple-200'
                                      : 'bg-teal-50/40 border-teal-200'
                                      }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isSellerTurn
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-teal-100 text-teal-800'
                                          }`}
                                      >
                                        Round #{hIdx + 1}
                                      </span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <strong className="text-slate-900 font-bold">{item.event}</strong>
                                          <span className="text-[11px] font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {item.amount}
                                          </span>
                                        </div>
                                        {item.note && (
                                          <p className="text-[11px] text-slate-600 mt-0.5 italic">
                                            {item.note}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0 font-mono">
                                      <span>{item.date}</span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${isSellerTurn
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-emerald-100 text-emerald-700'
                                          }`}
                                      >
                                        {isSellerTurn ? 'Seller Board' : 'Buyer Side'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. DIRECT NEGOTIATION CHAT THREADS SNIPPET */}
                      {step.chatThreads && step.chatThreads.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowMessages((prev) => !prev)}
                            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-[#006666]" />
                              <span>Direct Negotiation Channel Messages ({step.chatThreads.length} Messages Exchanged)</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px]">
                              <span>{showMessages ? 'Hide Chat' : 'Show Chat'}</span>
                              {showMessages ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </button>

                          {showMessages && (
                            <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                              {step.chatThreads.map((m, mIdx) => {
                                const isSellerMsg = m.senderRole === 'seller' || m.sender?.includes('Super Admin');
                                return (
                                  <div
                                    key={m.id || mIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${isSellerMsg
                                      ? 'bg-slate-50 border-slate-200'
                                      : 'bg-teal-50/40 border-teal-200'
                                      }`}
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${isSellerMsg ? 'bg-purple-600' : 'bg-teal-600'
                                        }`}
                                    >
                                      {m.sender?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-900">{m.sender}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{m.timestamp || m.createdAt}</span>
                                      </div>
                                      <p className="text-slate-700 mt-0.5">{m.text}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => router.push(isSellerSide ? '/bidding/seller-side/messages' : '/bidding/buyer-side/messages')}
                                  className="text-xs font-bold text-[#006666] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open Full Negotiation Messages</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 6. BILATERAL ACTION BUTTONS TOOLBAR */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Current Stage: <strong className="text-slate-800">{activeBid.status === 'Accepted' ? 'Consensus Reached (Ready for Term Sheet)' : 'Bilateral Negotiation Active'}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSellerSide ? (
                            <>
                              <button
                                type="button"
                                onClick={() => router.push('/bidding/seller-side')}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                              >
                                View Bidding Ledger
                              </button>
                              {activeBid.status !== 'Accepted' && (
                                <button
                                  type="button"
                                  onClick={handleAcceptBid}
                                  disabled={isAcceptingBid}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isAcceptingBid ? 'Accepting...' : 'Accept Proposal & Advance'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => router.push('/bidding/seller-side/term-sheet')}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <span>Draft Term Sheet</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => router.push('/bidding/buyer-side/my-bid')}
                                className="px-3.5 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Gavel className="w-3.5 h-3.5" />
                                <span>Revise / Manage Bid</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => router.push('/bidding/buyer-side/messages')}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Negotiation Chat</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
