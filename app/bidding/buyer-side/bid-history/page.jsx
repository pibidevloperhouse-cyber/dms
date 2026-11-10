"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BidHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bid, setBid] = useState(null);
  const [round, setRound] = useState(null);

  const fetchBidHistory = async () => {
    try {
      let buyerId = '';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
        }
      } catch (e) {}

      const res = await fetch(`/api/bidding/bids?role=guest_admin${buyerId ? `&buyerId=${encodeURIComponent(buyerId)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setBid(data.myBid || null);
        if (data.round) setRound(data.round);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidHistory();
  }, []);

  const handleMatchCounter = async () => {
    const targetBidId = bid?.id || bid?.buyerId;
    if (!targetBidId) return;
    const counterAmountFormatted = bid?.counterOffer?.amountFormatted || '';
    try {
      const res = await fetch(`/api/bidding/bids/${targetBidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MATCH_COUNTER', requesterRole: 'guest_admin' })
      });
      if (res.ok) {
        alert(`Counter-offer matched at ${counterAmountFormatted}!`);
        router.push('/bidding/buyer-side/my-bid');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const historyItems = (bid?.history || []).slice().reverse();
  const dealName = round?.dealName || 'Active Deal';

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      <BiddingHeaderNav portal="buyer" activeTab="bid-history" />

      <div className="max-w-[1280px] mx-auto pb-8">
        <div className="pt-6 px-7 flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 m-0 tracking-tight">Bid history</h1>
            <div className="text-[13px] text-slate-500 font-medium mt-1.5">Every version you've submitted on {dealName}, in order</div>
          </div>
        </div>

        <div className="mt-6 mx-7">
          {!bid ? (
            <div className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center shadow-md shadow-gray-300/80">
              <div className="text-[15px] font-bold text-slate-900">No bid proposals submitted yet</div>
              <div className="text-[13px] text-slate-500 mt-1">
                Submit your initial proposal in the My Bid section to view your timeline here.
              </div>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex gap-4.5 py-5 border-b border-slate-100 last:border-b-0">
              <div className="flex flex-col items-center shrink-0 w-6">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-50 border-2 border-amber-500"></div>
              </div>
              <div className="flex-1 bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md shadow-gray-300/80">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-slate-900">Current offer — {bid.offer || '—'}</span>
                  <span className="text-[11.5px] text-slate-500 font-medium">Latest</span>
                </div>
                <div className="text-[12.5px] text-slate-600 mt-1">
                  {bid.cash || '—'} cash / {bid.stock || '—'} stock{bid.close ? ` · Expected close ${bid.close}` : ''}
                </div>
              </div>
            </div>
          ) : (
            historyItems.map((item, idx) => {
              const isLatest = idx === 0;
              const isCounter = item.event?.includes('Counter');

              return (
                <div key={idx} className="flex gap-4.5 py-5 border-b border-slate-100 last:border-b-0">
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      isCounter ? 'bg-amber-50 border-amber-500' : isLatest ? 'bg-blue-50 border-blue-600' : 'bg-white border-slate-300'
                    }`}></div>
                    {idx < historyItems.length - 1 && (
                      <div className="w-[1.5px] flex-1 bg-slate-200 mt-1.5 mb-[-20px]"></div>
                    )}
                  </div>
                  <div className="flex-1 bg-white border-2 border-gray-300 rounded-xl p-5 shadow-md shadow-gray-300/80">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-bold text-slate-900">{item.event}</span>
                      <span className="text-[11.5px] text-slate-500 font-medium">{item.date}</span>
                    </div>
                    {item.amount && (
                      <div className="text-[20px] font-bold mt-2 text-slate-900 flex items-center tracking-tight">
                        {item.amount}
                        {isCounter && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ml-2 border border-amber-200">
                            Seller counter
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[12.5px] text-slate-600 mt-1">{item.note}</div>
                    {isCounter && (
                      <div className="mt-3.5 flex gap-2">
                        <button
                          onClick={handleMatchCounter}
                          className="text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs"
                        >
                          Match counter
                        </button>
                        <Link
                          href="/bidding/buyer-side/my-bid"
                          className="text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors shadow-xs"
                        >
                          Send revised offer
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
