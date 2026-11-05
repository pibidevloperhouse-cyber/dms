"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaBell } from 'react-icons/fa';

export default function MyBidPage() {
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState('95000000');
  const [closeDate, setCloseDate] = useState('2026-12-15');
  const [cashPercent, setCashPercent] = useState(70);
  const [financingType, setFinancingType] = useState('Committed debt + equity');
  const [contingencies, setContingencies] = useState('Standard regulatory clearance, key employee retention');
  const [note, setNote] = useState('We see strong synergistic value and are ready for rapid execution.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Notification & Horizontal snapshot states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHorizontalSnapshot, setShowHorizontalSnapshot] = useState(false);

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
          if (inv.askingPrice) benchmarkAsk = Number(inv.askingPrice);
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

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      {/* Navigation tabs + Right Corner Notification Bell */}
      <div className="flex justify-between items-center px-7 border-b border-slate-200 bg-white">
        <div className="flex gap-[2px]">
          <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">My bid</Link>
          <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
          <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
          <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        </div>

        {/* Right Corner Notification Bell */}
        <div className="relative py-2">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <FaBell className="text-base text-slate-700" />
            {hasCounter && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notification Popover Dropdown (img1) */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-1.5 w-[360px] sm:w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FaBell className="text-amber-500 text-xs" />
                  <span>Bidding Notifications</span>
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">{hasCounter ? '1 unread' : '0 new'}</span>
              </div>

              {hasCounter ? (
                /* img1 in notification popover */
                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl">
                  <p className="text-[12.5px] text-amber-950 leading-relaxed font-medium mb-3">
                    The seller has sent a <b className="font-bold">counter-offer</b> on your {bid.offer} bid — they're asking for <b className="font-bold text-amber-950">{bid.counterOffer.amountFormatted || '$100.0M'}</b>. Review and respond below.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        setShowHorizontalSnapshot(true);
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      View seller's note
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        handleMatchCounter();
                      }}
                      disabled={isSubmitting}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      Match counter
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active notifications at this time.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto pb-8 pt-6 px-7">
        {/* Horizontal Counter-Offer Snapshot (img2) rendered at top of page when 'View seller's note' is clicked */}
        {showHorizontalSnapshot && hasCounter && (
          <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 mb-6 shadow-md animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Counter-offer received
                </span>
                <span className="text-xs font-bold text-slate-800">Deal Snapshot &amp; Seller Note</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHorizontalSnapshot(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold leading-none p-1 cursor-pointer"
                title="Dismiss horizontal note"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
              {/* Col 1: Valuation & Seller's Note */}
              <div className="md:border-r border-slate-100 md:pr-4">
                <div className="text-[26px] font-bold text-slate-900 tracking-tight">{bid.offer}</div>
                <div className="text-[12px] text-slate-500 font-medium mt-0.5">Your current offer · {bid.cash} cash / {bid.stock} stock</div>
                <div className="mt-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs italic text-amber-900 leading-relaxed">
                  "{bid.counterOffer?.note || 'The seller board is firm on $100.0M enterprise valuation.'}"
                </div>
              </div>

              {/* Col 2: Deal Snapshot */}
              <div className="md:border-r border-slate-100 md:pr-4 space-y-1.5 text-xs">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deal snapshot</div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500 font-medium">Asking price</span>
                  <span className="font-bold text-slate-900">{round?.askingPriceFormatted || '$100.0M'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500 font-medium">Your offer</span>
                  <span className="font-bold text-blue-600">{bid.offer}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500 font-medium">Seller's counter</span>
                  <span className="font-bold text-amber-700">{bid.counterOffer?.amountFormatted || '$100.0M'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500 font-medium">Expected close</span>
                  <span className="font-semibold text-slate-900">{bid.close}</span>
                </div>
              </div>

              {/* Col 3: Bid Timeline */}
              <div className="md:border-r border-slate-100 md:pr-4 space-y-2 text-xs">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bid timeline</div>
                {(bid.history || []).slice(-2).reverse().map((h, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${h.event.includes('Counter') ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div>
                      <div className="font-medium text-slate-800">{h.event} {h.amount ? `— ${h.amount}` : ''}</div>
                      <div className="text-[10.5px] text-slate-400">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Col 4: Action Buttons */}
              <div className="flex flex-col gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleMatchCounter}
                  disabled={isSubmitting}
                  className="w-full text-center text-xs font-bold py-2.5 px-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-xs cursor-pointer"
                >
                  Match counter — {bid.counterOffer?.amountFormatted || '$100.0M'}
                </button>
                <Link
                  href="/bidding/buyer-side/term-sheet"
                  className="w-full text-center text-xs font-semibold py-2 px-3 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  View Term Sheet →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-6 items-start ${showHorizontalSnapshot ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_360px]'}`}>
          <div className="flex flex-col gap-5">
            {/* Revise Bid Form */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-[16px] font-bold text-slate-900 m-0">
                  {(!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0) ? 'Prepare Initial Bid' : 'Revise your bid'}
                </h2>
                <span className="text-[12px] text-slate-400 font-medium">
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
                    <label className="text-[12px] font-medium text-slate-500">Supporting documents</label>
                    <div className="border-[1.5px] border-dashed border-slate-200 rounded-lg p-4.5 text-center text-slate-500 text-[12.5px] bg-[#FAFAFA] cursor-pointer hover:bg-slate-50 transition-colors">
                      <b className="text-slate-900 font-medium">Drop files</b> or click to upload — LOI, proof of financing, term sheet draft
                    </div>
                    {(bid.documents || [{ name: 'Letter of Intent — XYZ.pdf' }, { name: 'Financing confirmation.pdf' }]).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-[12.5px] mt-2 bg-white">
                        <span className="text-slate-900">{doc.name}</span>
                        <span className="text-blue-600 text-[11px] font-medium">Uploaded</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white flex-wrap gap-4">
                <span className="text-[11.5px] text-slate-400">Submitting notifies the seller immediately and is logged to the deal audit trail.</span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmitRevisedBid}
                    disabled={isSubmitting}
                    className="font-sans text-[13px] font-bold px-4 py-2.5 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs"
                  >
                    {isSubmitting
                      ? 'Submitting to Super Admin...'
                      : (!bid || bid.status === 'Draft' || !bid.history || bid.history.length === 0)
                      ? 'Submit Initial Bid to Super Admin'
                      : 'Submit revised bid'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Snapshot Sidebar (visible when horizontal note is not shown) */}
          {!showHorizontalSnapshot && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs sticky top-6">
              <div className="p-5 border-b border-slate-100">
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full border ${
                  hasCounter ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasCounter ? 'bg-amber-500' : 'bg-blue-600'}`}></span>
                  {hasCounter ? 'Counter-offer received' : (bid.status || 'Under review')}
                </span>
                <div className="text-[28px] font-bold mt-3 text-slate-900 tracking-tight">{bid.offer}</div>
                <div className="text-[12px] text-slate-500 font-medium mt-1">Your current offer · {bid.cash} cash / {bid.stock} stock</div>
              </div>

              <div className="p-5 border-b border-slate-100">
                <h3 className="text-[11.5px] font-bold text-slate-500 tracking-wider mb-3 uppercase">Deal snapshot</h3>
                <div className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-slate-600 font-medium">Asking price</span>
                  <span className="text-slate-900 font-semibold">{round?.askingPriceFormatted || '$100.0M'}</span>
                </div>
                <div className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-slate-600 font-medium">Your offer</span>
                  <span className="text-blue-600 font-bold">{bid.offer}</span>
                </div>
                {hasCounter && (
                  <div className="flex justify-between py-1.5 text-[13px]">
                    <span className="text-slate-600 font-medium">Seller's counter</span>
                    <span className="text-amber-700 font-bold">{bid.counterOffer.amountFormatted}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-slate-600 font-medium">Expected close</span>
                  <span className="text-slate-900 font-semibold">{bid.close}</span>
                </div>
              </div>

              <div className="p-5 border-b border-slate-100">
                <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide mb-3 uppercase">Bid timeline</h3>
                {(bid.history || []).slice(-4).reverse().map((h, i) => (
                  <div key={i} className="flex gap-2.5 py-2 text-[12.5px]">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${h.event.includes('Counter') ? 'bg-amber-500' : 'bg-green-500'}`}></div>
                    <div>
                      <div className="text-slate-900 font-medium">{h.event} {h.amount ? `— ${h.amount}` : ''}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{h.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4.5 flex flex-col gap-2">
                {hasCounter && (
                  <button
                    type="button"
                    onClick={handleMatchCounter}
                    disabled={isSubmitting}
                    className="w-full text-center font-sans text-[13px] font-semibold px-4 py-2.5 rounded-lg cursor-pointer border border-green-600 bg-green-600 text-white hover:opacity-90 transition-opacity shadow-xs"
                  >
                    Match counter — {bid.counterOffer.amountFormatted}
                  </button>
                )}
                <Link
                  href="/bidding/buyer-side/term-sheet"
                  className="w-full text-center font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-700 hover:bg-[#F8F9FB] hover:text-slate-900 transition-colors bg-white shadow-2xs"
                >
                  View Term Sheet →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
