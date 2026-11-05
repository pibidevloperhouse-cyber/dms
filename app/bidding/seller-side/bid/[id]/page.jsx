"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function BidDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id || 'c';

  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('100000000');
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
          setCounterNote(data.bid.counterOffer?.note || `The seller board is requesting $100.0M enterprise valuation.`);
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

  const handleDeclineBid = async () => {
    if (!confirm('Are you sure you want to decline this bid?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bidding/bids/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DECLINE', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        alert('Bid has been declined.');
        fetchBidDetails();
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
          counterNote,
          requesterRole: 'super_admin'
        })
      });
      if (res.ok) {
        alert('Counter-offer sent to buyer successfully.');
        setIsCounterModalOpen(false);
        fetchBidDetails();
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
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white text-[14px]">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Bidding</Link>

        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
      </div>

      <div className="pt-8 px-7 pb-6 flex justify-between items-start border-b border-slate-100 bg-white flex-wrap gap-5">
        <div className="flex gap-5 items-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {bid.mark || bid.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 mb-1 mt-0 tracking-tight">{bid.name}</h1>
            <div className="text-slate-500 font-medium text-[14.5px]">{bid.type}</div>
            <div className="flex gap-2 mt-3.5 flex-wrap">
              <span className="text-[12px] text-slate-600 font-medium border border-slate-200 px-3 py-1 rounded-full">NDA signed</span>
              <span className="text-[12px] text-slate-600 font-medium border border-slate-200 px-3 py-1 rounded-full">Lead: {bid.leadName || 'R. Okafor'}</span>
              <span className="text-[12px] text-slate-600 font-medium border border-slate-200 px-3 py-1 rounded-full">Advisor: {bid.advisorName || 'Linklane LLP'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {bid.status !== 'Declined' && (
            <button
              onClick={handleDeclineBid}
              disabled={isSubmitting}
              className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 transition-colors"
            >
              Decline bid
            </button>
          )}
          <button
            onClick={() => setIsCounterModalOpen(true)}
            disabled={isSubmitting}
            className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-colors shadow-2xs"
          >
            Counter offer
          </button>
          <button
            onClick={handleAcceptAndMoveToTermSheet}
            disabled={isSubmitting}
            className="text-[13.5px] font-semibold px-5 py-2.5 rounded-lg cursor-pointer border border-emerald-600 bg-emerald-600 text-white hover:opacity-90 transition-opacity shadow-xs"
          >
            Accept &amp; move to term sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-7 max-w-[1400px] mx-auto items-start">
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="text-[16px] font-bold mb-3.5 text-slate-900 border-b border-slate-100 pb-2">Offer Summary</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-4">
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Offer</div>
                <div className="text-[20px] font-bold text-slate-900 tracking-tight">{bid.offer}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">vs. asking price</div>
                <div className="text-[20px] font-bold tracking-tight" style={{ color: bid.vsColor || '#16a34a' }}>{bid.vsAsk}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Expected close</div>
                <div className="text-[20px] font-bold text-slate-900 tracking-tight">{bid.close}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Status</div>
                <div className="text-[15px] font-semibold text-slate-900 mt-0.5">{bid.status}</div>
              </div>
            </div>

            <div className="mt-1">
              <div className="text-[12.5px] text-slate-500 font-medium">Structure</div>
              <div className="flex h-2.5 rounded-full overflow-hidden mt-2 mb-2.5">
                <div className="bg-slate-900" style={{ width: `${cashVal}%` }}></div>
                <div className="bg-blue-100 border-l border-white" style={{ width: `${stockVal}%` }}></div>
              </div>
              <div className="flex gap-6 text-[12.5px] text-slate-500">
                <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-slate-900">Cash {bid.cash}</span>
                <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-blue-600">Stock {bid.stock}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Submitted Documents</div>
            {(bid.documents || [
              { name: 'Letter of Intent — signed.pdf', size: '2.4 MB' },
              { name: 'Financing confirmation.pdf', size: '1.1 MB' },
              { name: 'Term sheet draft v2.docx', size: '840 KB' }
            ]).map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between px-4.5 py-3.5 border border-slate-200 rounded-lg text-[14px] mb-3 hover:bg-[#F8F9FB] hover:border-slate-400 transition-colors cursor-pointer">
                <span className="text-slate-900 font-medium">{doc.name}</span>
                <span className="text-slate-400 font-medium text-[12px]">Open ↗</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Internal Notes</div>
            <div className="border border-dashed border-slate-400 rounded-lg p-5 text-[14.5px] text-slate-500 bg-[#FAFAFA] italic leading-relaxed">
              "{bid.note || 'Financing letter checks out — board is comfortable with the stock component. Recommend proceeding to term sheet.'}"<br /><br />
              <span className="not-italic text-[12.5px] text-slate-400">— V. Sharma, Finance Advisor</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Recent Activity</div>
            {(bid.history || []).slice(-3).reverse().map((h, i) => (
              <div key={i} className={`flex gap-3.5 py-4 text-[13.5px] ${i < 2 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-slate-900 font-medium">{h.event} {h.amount ? `— ${h.amount}` : ''}</div>
                  <div className="text-slate-400 text-[12px] mt-1">{h.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counter Offer Modal */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Send Counter-Offer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Propose a revised valuation and closing condition to <b>{bid.name}</b>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Counter Valuation Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                    placeholder="100000000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Note to Buyer</label>
                <textarea
                  rows="3"
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-600 resize-none"
                  placeholder="Explain justification for counter-offer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCounter}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
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
