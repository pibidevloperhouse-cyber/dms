"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Gavel,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  CheckCircle2,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
  Clock,
  Sparkles,
  Upload,
  X
} from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';
import BiddingPipelineBanner from '@/components/bidding/BiddingPipelineBanner';

export default function MyBidPage() {
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);
  const [termSheet, setTermSheet] = useState(null);
  const [negotiationInvitation, setNegotiationInvitation] = useState(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState('10000000');
  const [closeDate, setCloseDate] = useState('2026-12-15');
  const [cashPercent, setCashPercent] = useState(70);
  const [financingType, setFinancingType] = useState('Committed debt + equity');
  const [contingencies, setContingencies] = useState('Standard regulatory clearance, key employee retention');
  const [note, setNote] = useState('We see strong synergistic value and are ready for rapid execution.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showRecentCounterModal, setShowRecentCounterModal] = useState(false);

  // Supporting Documents upload states & handlers
  const fileInputRef = useRef(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFilesSelected = (files) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((f) => {
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      const displaySize = f.size >= 1024 * 1024 ? `${sizeMb} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`;
      return {
        name: f.name,
        size: displaySize,
        type: f.name.endsWith('.pdf') ? 'pdf' : (f.name.endsWith('.doc') || f.name.endsWith('.docx') ? 'docx' : 'file'),
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    });
    setUploadedDocs((prev) => [...prev, ...added]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleRemoveDoc = (index) => {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchMyBid = async () => {
    try {
      let buyerId = '8ec0af77-0630-444f-8e1c-d362f35a2e13';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
        }
      } catch (e) { }

      let benchmarkAsk = 10000000;
      try {
        const rawInv = localStorage.getItem('dms_negotiation_invitation');
        if (rawInv) {
          const inv = JSON.parse(rawInv);
          setNegotiationInvitation(inv);
          if (inv.askingPrice) benchmarkAsk = Number(inv.askingPrice);
        }
      } catch (e) { }

      try {
        const stageRes = await fetch('/api/deal-workflow/active-stage');
        if (stageRes.ok) {
          const stageData = await stageRes.json();
          if (stageData.negotiationInvitation) {
            setNegotiationInvitation(stageData.negotiationInvitation);
            if (stageData.negotiationInvitation.askingPrice) {
              benchmarkAsk = Number(stageData.negotiationInvitation.askingPrice);
            }
          }
        }
      } catch (e) { }

      const [bidsRes, tsRes] = await Promise.all([
        fetch(`/api/bidding/bids?role=guest_admin&buyerId=${buyerId}`),
        fetch('/api/bidding/term-sheet')
      ]);

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        if (data.round) setRound(data.round);

        if (data.myBid) {
          setBid(data.myBid);
          setOfferAmount(String(data.myBid.offerAmount || benchmarkAsk));
          setCloseDate(data.myBid.expectedCloseDate || '2026-12-15');
          const cashVal = parseInt(String(data.myBid.cash).replace('%', ''), 10);
          setCashPercent(isNaN(cashVal) ? 70 : cashVal);
          if (data.myBid.financingType) setFinancingType(data.myBid.financingType);
          if (data.myBid.contingencies) setContingencies(data.myBid.contingencies);
          if (data.myBid.note) setNote(data.myBid.note);
          if (Array.isArray(data.myBid.documents) && data.myBid.documents.length > 0) {
            setUploadedDocs(data.myBid.documents);
          }
        } else {
          const defaultVal = benchmarkAsk || data.round?.askingPrice || 10000000;
          setOfferAmount(String(defaultVal));
          setBid({
            id: buyerId,
            buyerId: buyerId,
            name: 'Naga Tech',
            offer: `$${(defaultVal / 1000000).toFixed(1)}M`,
            offerAmount: defaultVal,
            cash: '70%',
            stock: '30%',
            close: 'Dec 2026',
            expectedCloseDate: '2026-12-15',
            status: 'Draft',
            history: []
          });
        }
      }

      if (tsRes.ok) {
        const tsData = await tsRes.json();
        if (tsData.termSheet) setTermSheet(tsData.termSheet);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBid();
  }, []);

  const handleMatchCounter = async () => {
    const targetBidId = bid?.id || bid?.buyerId || '8ec0af77-0630-444f-8e1c-d362f35a2e13';
    const counterAmountFormatted = bid?.counterOffer?.amountFormatted || '$10.0M';
    if (!confirm(`Match seller counter-offer at ${counterAmountFormatted}?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${targetBidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MATCH_COUNTER',
          buyerId: targetBidId,
          requesterRole: 'guest_admin'
        })
      });
      if (res.ok) {
        alert(`You have matched the seller counter-offer at ${counterAmountFormatted}. Proposal updated!`);
        fetchMyBid();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRevisedBid = async () => {
    setIsSubmitting(true);
    try {
      let buyerId = bid?.buyerId || bid?.id || '8ec0af77-0630-444f-8e1c-d362f35a2e13';
      let buyerName = bid?.name || 'Naga Tech';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
          if (user.company_name || user.name) buyerName = user.company_name || user.name;
        }
      } catch (e) { }

      const isInitial = !bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0;

      const res = await fetch('/api/bidding/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: round?.dealId || 'c7330177-a8ab-47a2-933c-af0be1d1246f',
          buyerId,
          buyerName,
          offerAmount: Number(offerAmount) || 10000000,
          expectedCloseDate: closeDate,
          cashPercent: Number(cashPercent),
          financingType,
          contingencies,
          note,
          documents: uploadedDocs,
          requesterRole: 'guest_admin'
        })
      });

      if (res.ok) {
        const resData = await res.json();
        const savedBidId = resData?.bid?.id || buyerId;
        try {
          localStorage.setItem('dms_active_bid_id', savedBidId);
        } catch (_) { }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
        alert(
          isInitial
            ? 'Your initial binding proposal has been submitted to Super Admin for evaluation!'
            : 'Your revised proposal has been transmitted to Super Admin.'
        );
        fetchMyBid();
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
          <p className="text-xs font-semibold text-slate-500">Loading Proposal Portal...</p>
        </div>
      </div>
    );
  }

  const hasCounter = Boolean(bid?.counterOffer);

  const sellerAskingPrice =
    negotiationInvitation?.askingPriceFormatted ||
    (negotiationInvitation?.askingPrice ? `$${(Number(negotiationInvitation.askingPrice) / 1000000).toFixed(1)}M` : null) ||
    round?.askingPriceFormatted ||
    (round?.askingPrice ? `$${(Number(round.askingPrice) / 1000000).toFixed(1)}M` : '$10.0M');

  const sellerDeadline =
    negotiationInvitation?.deadlineDisplay ||
    (negotiationInvitation?.deadline ? new Date(negotiationInvitation.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : null) ||
    round?.deadlineDisplay ||
    (round?.deadline ? new Date(round.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 Nov 2026');

  // 5-Step Pipeline state for buyer
  const step1Done = Boolean(round?.askingPrice || negotiationInvitation?.askingPrice);
  const step2Done = Boolean(bid?.offer && bid.status !== 'Draft');
  const isTermSheetTransmitted = Boolean(
    termSheet && (
      termSheet.status === 'sent_to_buyer' ||
      termSheet.status === 'signed' ||
      termSheet.status === 'signed_by_buyer' ||
      termSheet.status === 'executed' ||
      termSheet.signatures?.buyer
    )
  );
  const step3Done = Boolean(isTermSheetTransmitted);
  const step4Done = Boolean(termSheet && (termSheet.status === 'signed' || termSheet.signatures?.buyer));
  const step5Done = false;

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen antialiased pb-16">
      {/* Top Navigation Bar */}
      <BiddingHeaderNav portal="buyer" activeTab="my-bid" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

        {/* 1. TOP 5-STEP PIPELINE BANNER */}
        <BiddingPipelineBanner portal="buyer" highlightStep={2} />

        {/* ========================================================================= */}
        {/* 2. SELLER BENCHMARK & CURRENT OFFER OVERVIEW CARDS                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Benchmark Asking Price */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#006666] flex items-center justify-center font-bold text-xl border border-teal-200/70 shrink-0">
              <DollarSign className="w-6 h-6 text-[#006666]" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Seller Asking Benchmark
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {sellerAskingPrice}
              </div>
              <div className="text-[10px] text-slate-400">Enterprise valuation target</div>
            </div>
          </div>

          {/* Card 2: Your Current Proposal */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-200/70 shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Your Current Offer
              </div>
              <div className="text-2xl font-black text-emerald-800 tracking-tight mt-0.5 flex items-center gap-2">
                <span>{bid?.offer || 'Pending'}</span>
                {bid?.status && bid.status !== 'Draft' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {bid.status}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {bid ? `${cashPercent}% Cash / ${100 - cashPercent}% Stock` : 'Prepare binding proposal below'}
              </div>
            </div>
          </div>

          {/* Card 3: Bid Submission Deadline */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl border border-amber-200/70 shrink-0">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Submission Deadline
              </div>
              <div className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                {sellerDeadline}
              </div>
              <div className="text-[10px] text-slate-400">Bilateral submission window</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PROMINENT SELLER COUNTER-OFFER CALLOUT (BLUE THEME)                   */}
        {/* ========================================================================= */}
        {hasCounter && (
          <div className="bg-gradient-to-r from-blue-50 via-sky-50/70 to-blue-50/90 border border-blue-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Seller Counter-Offer Received: {bid.counterOffer?.amountFormatted || '$10.0M'}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                  "{bid.counterOffer?.note || 'The seller board is requesting benchmark enterprise valuation.'}"
                </p>
                <div className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-2 flex-wrap">
                  <span>Dispatched on {bid.counterOffer?.counteredAt || 'Recent'}</span>
                  <span>·</span>
                  <span>Expected Close: {bid.counterOffer?.expectedCloseDate || 'Dec 2026'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleMatchCounter}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Match Counter ({bid.counterOffer?.amountFormatted || '$10.0M'})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRecentCounterModal(true)}
                className="px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Proposal Accepted & Term Sheet Formulation Underway (Prior to Transmit) */}
        {bid?.status === 'Accepted' && !isTermSheetTransmitted && (
          <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-teal-50/80 border border-teal-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-4 animate-in fade-in">
            <div className="w-11 h-11 rounded-2xl bg-[#006666] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Proposal Accepted by Seller Board</span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
                  Term Sheet Drafting in Progress
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                The seller board has accepted your acquisition proposal of <strong className="text-slate-900">{bid.offer || '$10.0M'}</strong> and is currently formulating the commercial and legal clauses of the Term Sheet. Once transmitted by the seller, the Term Sheet section will unlock for your review and execution.
              </p>
              <div className="text-[11px] text-[#006666] font-semibold mt-1">
                Awaiting seller transmission · No action required from you right now.
              </div>
            </div>
          </div>
        )}

        {/* Binding Term Sheet Transmitted by Seller Banner */}
        {isTermSheetTransmitted && (
          <div className="bg-gradient-to-r from-blue-50 via-sky-50/70 to-blue-50/90 border border-blue-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Binding Term Sheet Transmitted by Seller</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                    Ready for Review
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                  The seller board has finalized and transmitted the acquisition Term Sheet for your commercial review and digital execution.
                </p>
                <div className="text-[11px] text-blue-700 font-semibold mt-1">
                  Exclusivity Period: {termSheet?.keyTerms?.exclusivityPeriod || '45 Days'} · Expected Close: {termSheet?.keyTerms?.expectedClose || 'Dec 2026'}
                </div>
              </div>
            </div>

            <Link
              href="/bidding/buyer-side/term-sheet"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              <span>Review &amp; Sign Term Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Bidding Round Closed Banner */}
        {(round?.status === 'closed' || bid?.status === 'Declined') && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
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
                The seller board has paused the active bidding round for this deal. You cannot submit or revise proposals until the round is reopened.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. PROPOSAL FORM & DOCUMENT SUBMISSION COCKPIT                             */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-wrap gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
                {(!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0)
                  ? 'Prepare Acquisition Proposal'
                  : 'Revise Acquisition Proposal'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your binding acquisition terms, consideration mix, and attached documents.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {bid?.status !== 'Draft' ? 'Editable until bid deadline' : 'Initial binding proposal'}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Row 1: Offer Amount & Close Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Offer Amount ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 font-bold text-sm sm:text-base text-slate-900 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-medium text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666] outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 2: Cash / Stock Consideration Split Slider */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
                <span>Consideration Structure</span>
                <span className="text-[#006666]">{cashPercent}% Cash / {100 - cashPercent}% Stock</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={cashPercent}
                onChange={(e) => setCashPercent(Number(e.target.value))}
                className="w-full accent-[#006666] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1.5">
                <span>100% Stock</span>
                <span>50 / 50</span>
                <span>100% Cash</span>
              </div>
            </div>

            {/* Row 3: Financing & Contingencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Financing Type
                </label>
                <select
                  value={financingType}
                  onChange={(e) => setFinancingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-medium text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#006666] outline-none transition-all"
                >
                  <option>Committed debt + equity</option>
                  <option>Fully committed debt + equity</option>
                  <option>All equity / balance sheet cash</option>
                  <option>Subject to financing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Key Contingencies
                </label>
                <input
                  type="text"
                  value={contingencies}
                  onChange={(e) => setContingencies(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-medium text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#006666] outline-none transition-all"
                />
              </div>
            </div>

            {/* Row 4: Strategic Note */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Strategic Note to Seller Board
              </label>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add context on your acquisition proposal, synergies, or conditions..."
                className="w-full p-3 font-sans text-xs sm:text-sm text-slate-900 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#006666] outline-none transition-all resize-none"
              />
            </div>

            {/* Row 5: Supporting Documents Drop Zone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Supporting Documents (LOI, Proof of Funds)</label>
                {uploadedDocs.length > 0 && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {uploadedDocs.length} document{uploadedDocs.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
                multiple
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center text-xs cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${isDragging
                    ? 'border-[#006666] bg-teal-50/70 text-[#006666]'
                    : 'border-slate-300 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:border-slate-400'
                  }`}
              >
                <div className="w-9 h-9 rounded-full bg-teal-50 text-[#006666] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-slate-800">{isDragging ? 'Drop files here' : 'Drop files'}</strong> or{' '}
                  <span className="text-[#006666] font-bold underline underline-offset-2">browse computer</span>
                </div>
                <span className="text-[11px] text-slate-400">PDF, Word, or financial documents</span>
              </div>

              {uploadedDocs.length > 0 && (
                <div className="flex flex-col gap-2 mt-2.5">
                  {uploadedDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs bg-white shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#006666] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-slate-900 font-bold truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Attached
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDoc(idx);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Remove document"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white flex-wrap gap-4">
            <span className="text-xs text-slate-400">
              Submissions are immediately logged to the bilateral deal audit trail.
            </span>
            <button
              type="button"
              onClick={handleSubmitRevisedBid}
              disabled={isSubmitting || round?.status === 'closed' || bid?.status === 'Declined'}
              className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 ${round?.status === 'closed' || bid?.status === 'Declined'
                  ? 'border border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'cursor-pointer bg-[#006666] hover:bg-[#005252] text-white'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {isSubmitting
                  ? 'Transmitting...'
                  : (!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0)
                    ? 'Submit Initial Proposal to Board'
                    : 'Submit Revised Proposal'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Counter Details Modal */}
      {showRecentCounterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                <Gavel className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-slate-900">
                    Seller Board Counter-Offer
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRecentCounterModal(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest valuation &amp; conditions revised by the seller board.
                </p>
              </div>
            </div>

            {hasCounter ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70">
                    <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Counter Valuation</div>
                    <div className="text-2xl font-black text-blue-950 mt-0.5">
                      {bid.counterOffer?.amountFormatted || '$10.0M'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Close</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {bid.counterOffer?.expectedCloseDate || 'Dec 2026'}
                    </div>
                  </div>
                </div>

                <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs italic text-slate-800">
                  "{bid.counterOffer?.note || 'The seller board is requesting benchmark valuation.'}"
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRecentCounterModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecentCounterModal(false);
                      handleMatchCounter();
                    }}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Match Counter — {bid.counterOffer?.amountFormatted || '$10.0M'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No active counter-offer from the seller board.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
