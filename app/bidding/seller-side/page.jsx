"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Gavel,
  FileText,
  CheckCircle2,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
  Clock,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function SellerBiddingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bidsList, setBidsList] = useState([]);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [activeBid, setActiveBid] = useState(null);
  const [round, setRound] = useState(null);
  const [termSheet, setTermSheet] = useState(null);

  // Decline Modal state
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  // Counter Modal states
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('12000000');
  const [counterExpectedDate, setCounterExpectedDate] = useState('2026-12-15');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCounterModal = () => {
    if (activeBid) {
      if (activeBid.counterOffer?.amount) {
        setCounterAmount(String(activeBid.counterOffer.amount));
      } else if (round?.askingPrice) {
        setCounterAmount(String(round.askingPrice));
      } else {
        setCounterAmount('12000000');
      }

      if (activeBid.counterOffer?.expectedCloseDate) {
        setCounterExpectedDate(activeBid.counterOffer.expectedCloseDate);
      } else if (activeBid.expectedCloseDate) {
        setCounterExpectedDate(activeBid.expectedCloseDate);
      } else {
        setCounterExpectedDate('2026-12-15');
      }

      setCounterNote(
        activeBid.counterOffer?.note || `The seller board is requesting benchmark valuation.`
      );
    }
    setIsCounterModalOpen(true);
  };

  const handleSelectBid = (bidId) => {
    setSelectedBidId(bidId);
    const target = bidsList.find((b) => b.id === bidId || b.buyerId === bidId);
    if (target) {
      setActiveBid(target);
      if (!isCounterModalOpen) {
        if (target.counterOffer?.amount) {
          setCounterAmount(String(target.counterOffer.amount));
        } else if (round?.askingPrice) {
          setCounterAmount(String(round.askingPrice));
        }
        if (target.counterOffer?.expectedCloseDate) {
          setCounterExpectedDate(target.counterOffer.expectedCloseDate);
        } else if (target.expectedCloseDate) {
          setCounterExpectedDate(target.expectedCloseDate);
        }
        setCounterNote(
          target.counterOffer?.note || `The seller board is requesting benchmark valuation.`
        );
      }
    }
  };

  const fetchBids = async () => {
    try {
      const [bidsRes, tsRes] = await Promise.all([
        fetch('/api/bidding/bids?role=super_admin'),
        fetch('/api/bidding/term-sheet')
      ]);

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        if (data.bids) {
          const list = Object.values(data.bids || {});
          setBidsList(list);

          if (list.length > 0) {
            let active = null;
            if (selectedBidId) {
              active = list.find((b) => b.id === selectedBidId || b.buyerId === selectedBidId);
            }
            if (!active) {
              const lastActiveId = typeof window !== 'undefined' ? localStorage.getItem('dms_active_bid_id') : null;
              if (lastActiveId) {
                active = list.find((b) => b.id === lastActiveId || b.buyerId === lastActiveId);
              }
            }
            if (!active) {
              // Prefer recently submitted or active bid
              active = list[0];
            }
            setActiveBid(active);
          }
        }
        if (data.round) setRound(data.round);
      }

      if (tsRes.ok) {
        const tsData = await tsRes.json();
        if (tsData.termSheet) setTermSheet(tsData.termSheet);
      }
    } catch (e) {
      console.error('Error fetching bids on seller side:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();

    const handleBidUpdate = () => fetchBids();
    const interval = setInterval(fetchBids, 4000);

    if (typeof window !== 'undefined') {
      window.addEventListener('bid_submitted', handleBidUpdate);
      window.addEventListener('focus', handleBidUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('bid_submitted', handleBidUpdate);
        window.removeEventListener('focus', handleBidUpdate);
      };
    }
    return () => clearInterval(interval);
  }, [selectedBidId]);

  const handleDeclineBid = () => {
    if (!activeBid) return;
    setIsDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!activeBid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${activeBid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        setIsDeclineModalOpen(false);
        await fetchBids();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeRound = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bidding/round', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESUME_ROUND', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        await fetchBids();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCounter = async () => {
    if (!activeBid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${activeBid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COUNTER',
          counterAmount: Number(counterAmount) || 12000000,
          expectedCloseDate: counterExpectedDate,
          counterNote,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert(`Counter-offer sent to ${activeBid.name} successfully.`);
        setIsCounterModalOpen(false);
        await fetchBids();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAndMoveToTermSheet = async () => {
    if (!activeBid) return;
    if (
      !confirm(
        `Accept proposal from ${activeBid.name || 'buyer'} (${activeBid.offer || '$10.0M'}) and advance to Term Sheet?`
      )
    )
      return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${activeBid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        router.push('/bidding/seller-side/term-sheet');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#006666] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Bidding Ledger...</p>
        </div>
      </div>
    );
  }

  if (!activeBid) {
    return (
      <div className="bg-[#F8F9FB] min-h-screen text-slate-900 font-sans">
        <BiddingHeaderNav portal="seller" activeTab="bidding" />
        <div className="max-w-4xl mx-auto p-12 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Active Proposals Found</h2>
          <p className="text-sm text-slate-500">Awaiting acquisition proposals from invited buyers.</p>
        </div>
      </div>
    );
  }

  const cashVal = parseInt(String(activeBid.cash || '70').replace('%', ''), 10) || 70;
  const stockVal = 100 - cashVal;

  const askPrice = round?.askingPrice || 0;
  const offerAmount = activeBid.offerAmount || 0;
  const vsAskPct = askPrice > 0 ? Math.round(((offerAmount - askPrice) / askPrice) * 100) : 0;
  const vsAskDisplay = vsAskPct === 0 ? '±0%' : `${vsAskPct > 0 ? '+' : ''}${vsAskPct}%`;
  const vsColor = vsAskPct >= 0 ? '#16a34a' : '#dc2626';

  const documents = Array.isArray(activeBid.documents) ? activeBid.documents : [];

  // 5-Step Pipeline state for seller side
  const step1Done = Boolean(round?.askingPrice);
  const step2Done = Boolean(activeBid && activeBid.offerAmount);
  const step3Done = Boolean(termSheet && (termSheet.status === 'sent_to_buyer' || termSheet.status === 'signed' || activeBid.status === 'Accepted'));
  const step4Done = Boolean(termSheet && (termSheet.status === 'signed' || termSheet.signatures?.buyer));
  const step5Done = false; // SPA stage

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen pb-16 antialiased">
      {/* Top Bidding Navigation Bar */}
      <BiddingHeaderNav portal="seller" activeTab="bidding" />

      {/* Main Container */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* ========================================================================= */}
        {/* 2. PROFILE & ACTION COCKPIT HEADER                                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 p-5 sm:p-6 shadow-md shadow-gray-300/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#006666] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
              {activeBid.mark || activeBid.name?.substring(0, 2).toUpperCase() || '--'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
                  {activeBid.name}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#006666] border border-teal-200">
                  {activeBid.status || 'Under review'}
                </span>

                {/* Buyer Switcher Dropdown (matching Image 4 pill) */}
                {bidsList.length > 1 && (
                  <div className="relative inline-flex items-center">
                    <select
                      value={activeBid.id}
                      onChange={(e) => handleSelectBid(e.target.value)}
                      className="appearance-none bg-sky-50/80 hover:bg-sky-100/90 text-sky-900 border border-sky-300 text-xs font-bold rounded-full pl-3 pr-7 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all shadow-2xs"
                      title="Switch buyer proposal"
                    >
                      {bidsList.map((b) => (
                        <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                          {b.name} ({b.offer || `$${(b.offerAmount / 1000000).toFixed(1)}M`})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-sky-700 absolute right-2 pointer-events-none" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{activeBid.type || 'Venture Capital (VC) · Invited Buyer'}</span>
                <span>·</span>
                <span>Lead: <strong className="text-slate-700">{activeBid.leadName || activeBid.name || 'Buyer Lead'}</strong></span>
                <span>·</span>
                <span>Submitted: <strong className="text-slate-700">{activeBid.submittedAt || 'Recent'}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {(round?.status === 'closed' || activeBid.status === 'Declined') ? (
              <button
                type="button"
                onClick={handleResumeRound}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resume Bidding Round</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDeclineBid}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Decline Bid
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCounterModal}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Gavel className="w-3.5 h-3.5 text-slate-600" />
              <span>Counter Offer</span>
            </button>

            <button
              type="button"
              onClick={handleAcceptAndMoveToTermSheet}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Accept &amp; Move to Term Sheet</span>
            </button>
          </div>
        </div>

        {/* Closed Bidding Round Notification Banner */}
        {(round?.status === 'closed' || activeBid.status === 'Declined') && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shrink-0">
                !
              </div>
              <div>
                <div className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <span>Bidding Round Closed</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                    Paused
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-0.5">
                  The proposal from <b>{activeBid.name}</b> was declined. Invited buyers cannot submit further revisions until the round is resumed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResumeRound}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume Bidding Round</span>
            </button>
          </div>
        )}

        {/* Active Counter-Offer Callout Box (if applicable) */}
        {activeBid.counterOffer && (
          <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 flex-wrap shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Gavel className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Active Seller Counter-Offer: {activeBid.counterOffer.amountFormatted || '$12.0M'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 uppercase">
                    Dispatched
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  {activeBid.counterOffer.note || 'The seller board is requesting benchmark enterprise valuation.'}
                </p>
                <div className="text-[11px] text-amber-700/80 font-medium mt-1">
                  Countered on: {activeBid.counterOffer.counteredAt || 'Recent'} · Awaiting buyer response.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCounterModal}
              className="px-3.5 py-1.5 rounded-xl border border-amber-400 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
            >
              Revise Counter-Offer
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3A. OFFER COMPARISON METRICS CARD                                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-300 bg-gradient-to-b from-slate-50/90 to-white">
            {/* Metric 1: Benchmark Asking Price */}
            <div className="p-5 sm:p-6 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Asking Benchmark
              </span>
              <div className="text-[26px] leading-tight font-black text-slate-900 tracking-tight tabular-nums mt-2">
                ${(askPrice / 1000000).toFixed(1)}M
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Enterprise valuation target
              </div>
            </div>

            {/* Metric 2: Buyer Proposed Offer */}
            <div className="p-5 sm:p-6 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Proposed Offer
              </span>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="text-[26px] leading-tight font-black text-slate-900 tracking-tight tabular-nums">
                  {activeBid.offer}
                </span>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: vsColor,
                    backgroundColor: vsAskPct >= 0 ? '#ecfdf5' : '#fef2f2',
                    borderColor: vsAskPct >= 0 ? '#6ee7b7' : '#fca5a5'
                  }}
                >
                  {vsAskDisplay} vs Ask
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Binding acquisition price
              </div>
            </div>

            {/* Metric 3: Consideration Mix */}
            <div className="p-5 sm:p-6 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Consideration Structure
              </span>
              <div className="text-[15px] font-extrabold text-slate-900 mt-2.5 tracking-tight">
                {activeBid.cash || `${cashVal}%`} Cash / {activeBid.stock || `${stockVal}%`} Stock
              </div>
              <div className="mt-2.5">
                <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-200 flex border border-slate-300/80">
                  <div className="bg-[#006666] h-full" style={{ width: `${cashVal}%` }} />
                  <div className="bg-blue-500 h-full" style={{ width: `${stockVal}%` }} />
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-600 font-semibold mt-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006666]" />
                    {cashVal}% Cash
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {stockVal}% Stock
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 4: Expected Closing Date */}
            <div className="p-5 sm:p-6 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Expected Close
              </span>
              <div className="text-[22px] leading-tight font-black text-slate-900 tracking-tight mt-2">
                {activeBid.close || 'Dec 2026'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-medium">
                Target execution window
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3B. COMMERCIAL DOSSIER & SUBMITTED DOCUMENTS CARD                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-md shadow-gray-300/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">
            {/* Left 2 Cols: Commercial Terms & Strategic Rationale */}
            <div className="lg:col-span-2 p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-5 rounded-full bg-[#006666]" />
                  <h3 className="text-[15px] sm:text-base font-bold text-slate-900 m-0 tracking-tight">
                    Buyer Commercial Dossier &amp; Rationale
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-gray-300 uppercase tracking-wider">
                  LOI Terms
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/90 p-4 rounded-xl border border-gray-300 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Financing Confirmation
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5 block leading-snug">
                    {activeBid.financingType || 'Private Equity / Balance Sheet Cash'}
                  </span>
                </div>

                <div className="bg-slate-50/90 p-4 rounded-xl border border-gray-300 shadow-2xs">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Key Contingencies
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5 block leading-snug">
                    {activeBid.contingencies || 'Standard antitrust clearance, leadership team retention'}
                  </span>
                </div>
              </div>

              <div className="mt-4 bg-gradient-to-br from-slate-50 to-teal-50/30 p-4.5 rounded-xl border border-gray-300 border-l-4 border-l-[#006666] shadow-2xs">
                <span className="text-[10.5px] font-bold text-[#006666] uppercase tracking-wider block">
                  Buyer Strategic Note
                </span>
                <p className="text-xs sm:text-[13.5px] text-slate-800 mt-1.5 font-medium leading-relaxed m-0">
                  &ldquo;{activeBid.note || 'We see strong synergistic value with our technology portfolio and are ready for rapid execution.'}&rdquo;
                </p>
              </div>
            </div>

            {/* Right Col: Submitted Documents */}
            <div className="p-6 sm:p-7 bg-slate-100/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#006666]" />
                    <h3 className="text-[15px] sm:text-base font-bold text-slate-900 m-0 tracking-tight">
                      Submitted Documents
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#006666] border border-teal-300">
                    {documents.length} {documents.length === 1 ? 'File' : 'Files'}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {documents.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white border border-gray-300 text-xs text-slate-500 text-center">
                      No documents uploaded yet.
                    </div>
                  ) : (
                    documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-300 hover:border-[#006666] hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#006666] flex items-center justify-center border border-teal-200 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#006666] transition-colors">
                              {doc.name}
                            </div>
                            {doc.size && (
                              <div className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                                {doc.size}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-[#006666] border border-teal-200 group-hover:bg-[#006666] group-hover:text-white group-hover:border-[#006666] transition-colors shrink-0 ml-2">
                          View ↗
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-300 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  NDA Verified Submission
                </span>
                <span>{activeBid.submittedAt || 'Recent'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Decline Confirmation Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  Decline proposal from {activeBid.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Declining this proposal will immediately <b>pause the bidding round</b> for this deal. You can reopen the round anytime using the <b>Resume Bidding Round</b> button.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Declining...' : 'Confirm & Close Round'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Send Counter-Offer</h3>
              <p className="text-xs text-slate-500">
                Propose a revised valuation and closing condition to <strong className="text-slate-800">{activeBid.name}</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Counter Valuation ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:border-[#006666] focus:ring-1 focus:ring-[#006666] transition-colors"
                      placeholder="12000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    value={counterExpectedDate}
                    onChange={(e) => setCounterExpectedDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#006666] focus:ring-1 focus:ring-[#006666] transition-colors font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Board Note to Buyer
                </label>
                <textarea
                  rows="3"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#006666] focus:ring-1 focus:ring-[#006666] resize-none transition-colors"
                  placeholder="The seller board is requesting benchmark valuation."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCounter}
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#006666] hover:bg-[#005252] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Sending...' : 'Transmit Counter-Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
