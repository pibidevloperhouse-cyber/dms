"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function MyBidPage() {
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);
  const [negotiationInvitation, setNegotiationInvitation] = useState(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState('95000000');
  const [closeDate, setCloseDate] = useState('2026-12-15');
  const [cashPercent, setCashPercent] = useState(70);
  const [financingType, setFinancingType] = useState('Committed debt + equity');
  const [contingencies, setContingencies] = useState('Standard regulatory clearance, key employee retention');
  const [note, setNote] = useState('We see strong synergistic value and are ready for rapid execution.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Notification & Counter modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHorizontalSnapshot, setShowHorizontalSnapshot] = useState(false);
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
      } catch (e) {}

      let benchmarkAsk = 10000000;
      try {
        const rawInv = localStorage.getItem('dms_negotiation_invitation');
        if (rawInv) {
          const inv = JSON.parse(rawInv);
          setNegotiationInvitation(inv);
          if (inv.askingPrice) benchmarkAsk = Number(inv.askingPrice);
        }
      } catch (e) {}

      // Also fetch from active-stage to guarantee latest seller asking price & deadline
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
      } catch (e) {}

      const res = await fetch(`/api/bidding/bids?role=guest_admin&buyerId=${buyerId}`);
      if (res.ok) {
        const data = await res.json();
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
          // Initialize default draft bid for preparation
          const defaultVal = benchmarkAsk || data.round?.askingPrice || 10000000;
          setOfferAmount(String(defaultVal));
          setBid({
            id: buyerId,
            buyerId: buyerId,
            name: 'Naga Tech',
            offer: `${(defaultVal / 1000000).toFixed(1)}M`,
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
        alert(`You have matched the seller counter-offer at ${counterAmountFormatted}. Bid is updated!`);
        fetchMyBid();
        setShowHorizontalSnapshot(false);
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
      } catch (e) {}

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
        alert(isInitial
          ? 'Your initial binding proposal has been submitted to Super Admin for evaluation!'
          : 'Your revised binding proposal has been submitted to Super Admin.');
        fetchMyBid();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      {/* Top Navigation Tabs + Right Corner Bidding Notification Bell */}
      <BiddingHeaderNav portal="buyer" activeTab="my-bid" />

      <div className="w-full max-w-7xl mx-auto pb-10 pt-6 px-4 sm:px-6 lg:px-8">
        {/* Horizontal Seller Benchmark Asking Price & Deadline Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {/* Seller Asking Price */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#006666] flex items-center justify-center font-bold text-xl border border-teal-200/70 shrink-0">
                $
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Seller Asking Price
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {sellerAskingPrice}
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-slate-200" />

            {/* Bid Submission Deadline */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-200/70 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Submission Deadline
                </div>
                <div className="text-[15px] font-bold text-slate-900 mt-0.5">
                  {sellerDeadline}
                </div>
              </div>
            </div>

            {/* Current Submitted Bid (if active) */}
            {bid?.offer && bid.status !== 'Draft' && (
              <>
                <div className="hidden md:block h-10 w-px bg-slate-200" />
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200/70 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Your Current Bid
                    </div>
                    <div className="text-[15px] font-bold text-blue-700 mt-0.5 flex items-center gap-2">
                      <span>{bid.offer}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {bid.status || 'Under review'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: View Recent Counter Button */}
          <div className="flex items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={() => setShowRecentCounterModal(true)}
              className="inline-flex items-center gap-2 text-xs font-bold px-4.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                <path d="M7 21h10"/>
                <path d="M12 3v18"/>
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
              </svg>
              <span>View recent counter</span>
              {hasCounter && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Bidding Round Closed Banner for Buyer */}
        {(round?.status === 'closed' || bid?.status === 'Declined') && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shrink-0">
              !
            </div>
            <div>
              <div className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <span>Bidding Round Closed</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-800">
                  Paused
                </span>
              </div>
              <div className="text-xs text-rose-700 mt-0.5">
                The seller board has closed the active bidding round for this deal. You cannot submit or revise proposals until the round is reopened.
              </div>
            </div>
          </div>
        )}

        {/* Full-width Bid Form Card */}
        <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 m-0">
                {(!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0) ? 'Prepare Initial Bid' : 'Revise your bid'}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {(!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0)
                  ? 'Submit your binding acquisition proposal to Super Admin'
                  : `Currently: ${bid.offer} (${bid.cash} cash / ${bid.stock} stock) · Status: ${bid.status || 'Under review'}`}
              </p>
            </div>
            <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {(!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0) ? 'Initial binding proposal' : 'Editable until deadline'}
            </span>
          </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Offer amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 font-bold text-[16px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Expected close date</label>
                    <input
                      type="date"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="w-full px-3 py-2.5 font-medium text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-4.5">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-semibold text-slate-600">Cash / Stock component</span>
                    <span className="text-slate-500 font-medium">{cashPercent}% cash / {100 - cashPercent}% stock</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={cashPercent}
                    onChange={(e) => setCashPercent(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>100% Stock</span>
                    <span>50 / 50</span>
                    <span>100% Cash</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Financing confirmation</label>
                    <select
                      value={financingType}
                      onChange={(e) => setFinancingType(e.target.value)}
                      className="w-full px-3 py-2.5 font-medium text-[13.5px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors"
                    >
                      <option>Fully committed debt + equity</option>
                      <option>Committed debt + equity</option>
                      <option>All equity / balance sheet cash</option>
                      <option>Subject to financing</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Key contingencies</label>
                    <input
                      type="text"
                      value={contingencies}
                      onChange={(e) => setContingencies(e.target.value)}
                      className="w-full px-3 py-2.5 font-medium text-[13.5px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Note to seller board</label>
                    <textarea
                      rows="3"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add context on your offer, timeline, or terms..."
                      className="w-full px-3 py-2.5 font-sans text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors resize-y"
                    />
                  </div>
                </div>

                                <div className="grid grid-cols-1 gap-4.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-semibold text-slate-600">Supporting documents</label>
                      {uploadedDocs.length > 0 && (
                        <span className="text-[11px] font-medium text-slate-400">{uploadedDocs.length} document{uploadedDocs.length > 1 ? 's' : ''} attached</span>
                      )}
                    </div>

                    {/* Hidden file input */}
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

                    {/* Interactive Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-[1.5px] border-dashed rounded-lg p-5 text-center text-[12.5px] cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50/70 text-blue-700 shadow-sm'
                          : 'border-slate-300 bg-[#FAFAFA] text-slate-500 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <div>
                        <b className="text-slate-900 font-semibold">{isDragging ? 'Drop files here' : 'Drop files'}</b> or <span className="text-blue-600 font-semibold underline underline-offset-2">click to upload</span> — LOI, proof of financing, term sheet draft
                      </div>
                      <span className="text-[11px] text-slate-400">PDF, Word, Excel, or presentation documents</span>
                    </div>

                    {/* Uploaded Documents List */}
                    {uploadedDocs.length > 0 && (
                      <div className="flex flex-col gap-2 mt-2">
                        {uploadedDocs.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 border border-slate-200 rounded-lg text-[12.5px] bg-white shadow-2xs hover:border-slate-300 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                {doc.name.endsWith('.pdf') ? 'PDF' : doc.name.endsWith('.docx') || doc.name.endsWith('.doc') ? 'DOC' : 'FILE'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-900 font-medium truncate max-w-[280px] sm:max-w-md">{doc.name}</p>
                                <p className="text-[11px] text-slate-400">{doc.size} {doc.uploadedAt ? `· Uploaded ${doc.uploadedAt}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white flex-wrap gap-4">
                <span className="text-[11.5px] text-slate-400">Submitting notifies the seller immediately and is logged to the deal audit trail.</span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmitRevisedBid}
                    disabled={isSubmitting || round?.status === 'closed' || bid?.status === 'Declined'}
                    className={`font-sans text-[13px] font-bold px-4 py-2.5 rounded-lg border transition-opacity shadow-xs ${
                      round?.status === 'closed' || bid?.status === 'Declined'
                        ? 'border-slate-300 bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'cursor-pointer border-slate-900 bg-slate-900 text-white hover:opacity-90'
                    }`}
                  >
                    {isSubmitting
                      ? 'Submitting to Super Admin...'
                      : round?.status === 'closed' || bid?.status === 'Declined'
                      ? 'Bidding Round Closed'
                      : (!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0)
                      ? 'Submit Initial Bid to Super Admin'
                      : 'Submit revised bid'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Recent Counter-Offer Modal Card */}
        {showRecentCounterModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3.5 mb-4 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                    <path d="M7 21h10"/>
                    <path d="M12 3v18"/>
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                      Recent Counter-Offer from Seller
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRecentCounterModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Latest valuation &amp; conditions revised by the seller board.
                  </p>
                </div>
              </div>

              {hasCounter ? (
                <>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60">
                      <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Counter Valuation</div>
                      <div className="text-2xl font-black text-amber-950 mt-0.5">
                        {bid.counterOffer?.amountFormatted || '$12.0M'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Close</div>
                      <div className="text-base font-bold text-slate-900 mt-1">
                        {bid.counterOffer?.expectedCloseDisplay || bid.counterOffer?.expectedCloseDate || bid.close || 'Dec 2026'}
                      </div>
                    </div>
                  </div>

                  {/* Deal Comparison */}
                  <div className="mb-4 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-[#FAFAFA] flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Your current proposal:</span>
                    <span className="font-bold text-blue-700">{bid.offer}</span>
                  </div>

                  {/* Note to Buyer */}
                  <div className="mb-5">
                    <label className="text-[11.5px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">
                      Seller Note to Buyer
                    </label>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs italic text-slate-800 leading-relaxed">
                      "{bid.counterOffer?.note || 'The seller board is requesting benchmark valuation.'}"
                    </div>
                    {bid.counterOffer?.counteredAt && (
                      <div className="text-[10.5px] text-slate-400 mt-1.5 text-right">
                        Transmitted on {bid.counterOffer.counteredAt}
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRecentCounterModal(false)}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
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
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      {isSubmitting ? 'Matching...' : `Match Counter — ${bid.counterOffer?.amountFormatted || '$12.0M'}`}
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">No Recent Counter-Offer</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-5 leading-relaxed">
                    The seller board has not transmitted a counter-offer for this deal yet. Your proposal of <b>{bid?.offer || '$11.5M'}</b> is currently under evaluation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRecentCounterModal(false)}
                    className="px-5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
