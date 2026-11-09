"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRight,
  Gavel,
  RefreshCw,
  Send
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
  const [myBidData, setMyBidData] = useState(null);
  const [spaStatus, setSpaStatus] = useState(null); // { dispatched: boolean, date: string }
  const [isDispatchingSPA, setIsDispatchingSPA] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

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
      let buyerId = '8ec0af77-0630-444f-8e1c-d362f35a2e13';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
        }
      } catch (e) {}

      const roleParam = isBuyerSide ? 'guest_admin' : 'super_admin';
      const [bidsRes, tsRes] = await Promise.all([
        fetch(`/api/bidding/bids?role=${roleParam}&buyerId=${encodeURIComponent(buyerId)}`),
        fetch('/api/bidding/term-sheet'),
      ]);

      if (bidsRes.ok) {
        const bJson = await bidsRes.json();
        if (bJson.bids) setBidsData(bJson.bids);
        if (bJson.round) setRoundData(bJson.round);
        if (bJson.myBid) setMyBidData(bJson.myBid);
      }

      if (tsRes.ok) {
        const tsJson = await tsRes.json();
        if (tsJson.termSheet) setTermSheetData(tsJson.termSheet);
      }

      // Check SPA dispatch status from localStorage
      try {
        const rawSpa = localStorage.getItem('dms_spa_agreement_dispatched');
        if (rawSpa) {
          setSpaStatus(JSON.parse(rawSpa));
        }
      } catch (e) {}

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
        let buyerId = '8ec0af77-0630-444f-8e1c-d362f35a2e13';
        try {
          const raw = localStorage.getItem('vdr_session');
          if (raw) {
            const user = JSON.parse(raw);
            if (user.id) buyerId = user.id;
          }
        } catch (e) {}

        const roleParam = isBuyerSide ? 'guest_admin' : 'super_admin';
        const [bidsRes, tsRes] = await Promise.all([
          fetch(`/api/bidding/bids?role=${roleParam}&buyerId=${encodeURIComponent(buyerId)}`),
          fetch('/api/bidding/term-sheet'),
        ]);

        if (isCancelled) return;

        if (bidsRes.ok) {
          const bJson = await bidsRes.json();
          if (isCancelled) return;
          if (bJson.bids) setBidsData(bJson.bids);
          if (bJson.round) setRoundData(bJson.round);
          if (bJson.myBid) setMyBidData(bJson.myBid);
        }

        if (tsRes.ok) {
          const tsJson = await tsRes.json();
          if (isCancelled) return;
          if (tsJson.termSheet) setTermSheetData(tsJson.termSheet);
        }

        try {
          const rawSpa = localStorage.getItem('dms_spa_agreement_dispatched');
          if (rawSpa && !isCancelled) {
            setSpaStatus(JSON.parse(rawSpa));
          }
        } catch (e) {}

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

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
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

  // Formatted Initial Benchmark Amount
  const initialBidAmount = useMemo(() => {
    if (negotiationInvitation?.askingPrice) {
      return `$${(Number(negotiationInvitation.askingPrice) / 1000000).toFixed(1)}M`;
    }
    if (roundData?.askingPrice) {
      return `$${(Number(roundData.askingPrice) / 1000000).toFixed(1)}M`;
    }
    return '$10.0M';
  }, [negotiationInvitation, roundData]);

  // Counter Party Details
  const counterPartyName = useMemo(() => {
    return activeBid?.name || dealInfo?.buyerCompany || 'Naga Tech';
  }, [activeBid, dealInfo]);

  const counterPartyOffer = useMemo(() => {
    if (activeBid?.offer) return activeBid.offer;
    return initialBidAmount;
  }, [activeBid, initialBidAmount]);

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
  // 2. Counter party (Offer / Review)
  // 3. Term sheet sign panna soltrathu (Sent for Signature)
  // 4. Sign panninathu (Term Sheet Signed)
  // 5. SPA agreement anupurathu (SPA Dispatched)
  // =========================================================================
  const steps = useMemo(() => {
    // Step 1: Initial Bid Amount Set
    const step1Done = Boolean(negotiationInvitation?.askingPrice || roundData?.askingPrice);

    // Step 2: Counter Party
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
      (termSheetData.status === 'signed' || termSheetData.signatures?.buyer)
    );
    const step4Done = Boolean(step3Done && isTermSheetSigned);

    // Step 5: SPA Agreement Dispatched
    const step5Done = Boolean(step4Done && spaStatus?.dispatched);

    return [
      {
        id: 'STEP_1',
        number: 1,
        title: 'Initial Bid Amount Set',
        desc: 'Asking price benchmark established by Seller Board',
        isDone: step1Done,
        isActive: !step1Done,
        tag: `Benchmark: ${initialBidAmount}`,
        actionText: null,
      },
      {
        id: 'STEP_2',
        number: 2,
        title: 'Counter Party Proposal',
        desc: `Counter party (${counterPartyName}) submitted proposal & valuation review`,
        isDone: step2Done,
        isActive: step1Done && !step2Done,
        tag: activeBid?.status === 'Shortlisted' ? 'Shortlisted' : activeBid?.counterOffer ? `Countered: ${activeBid.counterOffer.amountFormatted}` : `Offer: ${counterPartyOffer}`,
        actionText: isSellerSide ? 'View Bidding Ledger' : 'My Bid Portal',
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
        tag: `Exclusivity: ${termSheetData?.keyTerms?.exclusivityPeriod || '45 Days'}`,
        actionText: isSellerSide ? 'Review Term Sheet' : (isTermSheetSent ? 'Review Term Sheet' : null),
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
        title: 'SPA Agreement Dispatched',
        desc: 'Definitive Share Purchase Agreement (SPA) dispatched for closing',
        isDone: step5Done,
        isActive: step4Done && !step5Done,
        tag: step5Done ? `Dispatched on ${spaStatus?.date || 'Today'}` : 'Pending Dispatch',
        actionText: !step5Done && step4Done && isSellerSide ? 'Dispatch SPA Agreement' : null,
        onAction: !step5Done && step4Done && isSellerSide ? handleDispatchSPA : null,
      },
    ];
  }, [
    negotiationInvitation,
    roundData,
    activeBid,
    termSheetData,
    spaStatus,
    initialBidAmount,
    counterPartyName,
    counterPartyOffer,
    isSellerSide,
    isBuyerSide,
    handleDispatchSPA,
  ]);

  const completedCount = useMemo(() => steps.filter((s) => s.isDone).length, [steps]);
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ========================================================================= */}
      {/* COMPACT & PROFESSIONAL HEADER                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#006666] border border-teal-200/80">
                <Gavel className="w-3.5 h-3.5" />
                Negotiation &amp; Bidding Pipeline
              </span>
              <span className="text-xs font-semibold text-slate-500">
                · {dealInfo?.dealName || 'Project Alpha'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
              Acquisition Deal Closure Milestones
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Sync live status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-[#006666]' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
            </button>

            {onSwitchToTaskBoard && (
              <button
                type="button"
                onClick={onSwitchToTaskBoard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                <span>Task Board</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress summary bar */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {completedCount} of 5 Steps Completed
            </span>
            <span className="text-slate-400">({progressPercent}%)</span>
          </div>

          <div className="w-full sm:w-64 bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5-STEP VERTICAL PROGRESSION PIPELINE                                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs">
        <div className="relative pl-1 sm:pl-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div key={step.id} className="relative flex items-start gap-3 sm:gap-4 pb-6 last:pb-1">
                {/* Left: Vertical Track & Node Circle */}
                <div className="relative flex flex-col items-center shrink-0 self-stretch">
                  {/* Node Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                      step.isDone
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
                      className={`w-0.5 flex-1 my-1 transition-colors duration-300 min-h-[44px] ${
                        step.isDone ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                {/* Right: Content Card Directly Beside ("pakkathulaye") */}
                <div
                  className={`flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                    step.isDone
                      ? 'bg-emerald-50/30 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                      : step.isActive
                      ? 'bg-white border-teal-400 ring-2 ring-teal-100 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 opacity-65'
                  }`}
                >
                  {/* Title & Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-xs sm:text-[14px] font-bold ${
                          step.isDone ? 'text-slate-900' : step.isActive ? 'text-teal-950 font-extrabold' : 'text-slate-600'
                        }`}
                      >
                        {step.title}
                      </h4>

                      {/* Status Pill */}
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          step.isDone
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

                  {/* Right: Info Tag & Direct Action Button */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        step.isDone
                          ? 'bg-emerald-100/70 text-emerald-900 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {step.tag}
                    </span>

                    {/* Direct Action */}
                    {step.actionText && (
                      step.onAction ? (
                        <button
                          type="button"
                          disabled={isDispatchingSPA}
                          onClick={step.onAction}
                          className="px-3.5 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isDispatchingSPA ? 'Dispatching...' : step.actionText}</span>
                        </button>
                      ) : step.actionUrl ? (
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
