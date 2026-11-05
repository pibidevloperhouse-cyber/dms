"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BidDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id || 'c';

  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decline Modal state
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  // Counter Modal states
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('100000000');
  const [counterExpectedDate, setCounterExpectedDate] = useState('2026-12-15');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBidDetails = async () => {
    try {
      const res = await fetch(`/api/bidding/bids/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bid) {
          setBid(data.bid);
          setCounterAmount(String(data.bid.counterOffer?.amount || 100000000));
          if (data.bid.counterOffer?.expectedCloseDate) {
            setCounterExpectedDate(data.bid.counterOffer.expectedCloseDate);
          } else if (data.bid.expectedCloseDate) {
            setCounterExpectedDate(data.bid.expectedCloseDate);
          }
          setCounterNote(data.bid.counterOffer?.note || `The seller board is requesting benchmark valuation.`);
        }
        if (data.round) setRound(data.round);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidDetails();
  }, [id]);

  const handleDeclineBid = () => {
    if (!bid) return;
    setIsDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!bid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        setIsDeclineModalOpen(false);
        await fetchBidDetails();
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
        await fetchBidDetails();
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
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COUNTER',
          counterAmount: Number(counterAmount) || 100000000,
          expectedCloseDate: counterExpectedDate,
          counterNote,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert('Counter-offer sent to buyer successfully.');
        setIsCounterModalOpen(false);
        await fetchBidDetails();
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
    if (!confirm(`Accept bid from ${bid?.name || 'buyer'} (${bid?.offer || '$100.0M'}) and advance to Term Sheet?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${id}`, {
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

  if (loading || !bid) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cashVal = parseInt(String(bid.cash).replace('%', ''), 10) || 60;
  const stockVal = 100 - cashVal;

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen pb-10">
      <BiddingHeaderNav portal="seller" activeTab="bidding" />

      <div className="pt-8 px-7 pb-6 flex justify-between items-center border-b border-slate-100 bg-white flex-wrap gap-5">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
            {bid.mark || bid.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 m-0 tracking-tight">{bid.name}</h1>
          </div>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          {(round?.status === 'closed' || bid.status === 'Declined') ? (
            <button
              type="button"
              onClick={handleResumeRound}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resume Bidding Round
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDeclineBid}
              disabled={isSubmitting}
              className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 transition-colors shadow-2xs"
            >
              Decline bid
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCounterModalOpen(true)}
            disabled={isSubmitting}
            className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-colors shadow-2xs"
          >
            Counter offer
          </button>
          <button
            type="button"
            onClick={handleAcceptAndMoveToTermSheet}
            disabled={isSubmitting}
            className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Accept &amp; move to term sheet
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-7 flex flex-col gap-6">
        {/* Closed Bidding Round Banner with Resume Option */}
        {(round?.status === 'closed' || bid.status === 'Declined') && (
          <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 flex-wrap shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-base shrink-0">
                !
              </div>
              <div>
                <div className="text-[15px] font-bold text-rose-950 flex items-center gap-2">
                  <span>Bidding Round Closed</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-800">
                    Paused
                  </span>
                </div>
                <div className="text-xs text-rose-700 mt-0.5">
                  The proposal from <b>{bid.name}</b> was declined and this deal's bidding round is currently closed.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResumeRound}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resume Bidding Round
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="text-[16px] font-bold mb-4 text-slate-900 border-b border-slate-100 pb-2.5">Offer Summary</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
            <div className="border border-slate-100 rounded-lg p-4 bg-[#FAFAFA]">
              <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Offer</div>
              <div className="text-[22px] font-bold text-slate-900 tracking-tight">{bid.offer}</div>
            </div>
            <div className="border border-slate-100 rounded-lg p-4 bg-[#FAFAFA]">
              <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">vs. asking price</div>
              <div className="text-[22px] font-bold tracking-tight" style={{ color: bid.vsColor || '#16a34a' }}>{bid.vsAsk}</div>
            </div>
            <div className="border border-slate-100 rounded-lg p-4 bg-[#FAFAFA]">
              <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Expected close</div>
              <div className="text-[22px] font-bold text-slate-900 tracking-tight">{bid.close}</div>
            </div>
            <div className="border border-slate-100 rounded-lg p-4 bg-[#FAFAFA]">
              <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Status</div>
              <div className="text-[16px] font-semibold text-slate-900 mt-1">{bid.status}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-[12.5px] text-slate-500 font-medium mb-2">
              <span>Structure</span>
              <span>Cash {bid.cash} / Stock {bid.stock}</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
              <div className="bg-slate-900" style={{ width: `${cashVal}%` }}></div>
              <div className="bg-blue-200 border-l border-white" style={{ width: `${stockVal}%` }}></div>
            </div>
            <div className="flex gap-6 text-[12.5px] text-slate-500 mt-2.5">
              <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-slate-900">Cash {bid.cash}</span>
              <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-blue-600">Stock {bid.stock}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="text-[16px] font-bold mb-4 text-slate-900 border-b border-slate-100 pb-2.5">Submitted Documents</div>
          {(bid.documents || [
            { name: 'Letter of Intent — signed.pdf', size: '2.4 MB' },
            { name: 'Financing confirmation.pdf', size: '1.1 MB' },
            { name: 'Term sheet draft v2.docx', size: '840 KB' }
          ]).map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between px-4.5 py-3.5 border border-slate-200 rounded-lg text-[14px] mb-3 hover:bg-[#F8F9FB] hover:border-slate-300 transition-colors cursor-pointer bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base text-blue-600">📄</span>
                <span className="text-slate-900 font-medium truncate">{doc.name}</span>
                {doc.size && <span className="text-xs text-slate-400 shrink-0">({doc.size})</span>}
              </div>
              <span className="text-slate-500 hover:text-blue-600 font-semibold text-[12px] shrink-0 ml-3">Open ↗</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decline Confirmation Modal Card */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/80">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 leading-snug">
                  Are you sure you want to decline the bid from {bid.name}?
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Declining this proposal will immediately <b>close the bidding round</b> for this deal and notify the buyer. You can reopen the round anytime using the <b>Resume Bidding Round</b> button.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecline}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? 'Declining...' : 'OK, Decline & Close Round'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Offer Modal — Simple, Neat, and Spacious Card */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-7 animate-in fade-in zoom-in-95">
            <div className="mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Send Counter-Offer</h3>
              <p className="text-xs text-slate-500">
                Propose a revised valuation and closing condition to <b className="text-slate-700">{bid.name}</b>.
              </p>
            </div>

            <div className="space-y-4.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Counter Valuation Amount ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490] transition-colors"
                      placeholder="100000000"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490] transition-colors font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Note to Buyer
                </label>
                <textarea
                  rows="3"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0e7490] focus:ring-1 focus:ring-[#0e7490] resize-none transition-colors"
                  placeholder="Explain justification for counter-offer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-7 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="px-4.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCounter}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0e7490] hover:bg-[#155e75] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
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
