"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function SellerBidHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [bidsList, setBidsList] = useState([]);
  const [selectedBidId, setSelectedBidId] = useState(null);
  const [activeBid, setActiveBid] = useState(null);
  const [round, setRound] = useState(null);

  const fetchBidHistory = async () => {
    try {
      const res = await fetch('/api/bidding/bids?role=super_admin');
      if (res.ok) {
        const data = await res.json();
        if (data.bids) {
          const list = Object.values(data.bids || {});
          setBidsList(list);
          if (list.length > 0) {
            let target = null;
            if (selectedBidId) {
              target = list.find((b) => b.id === selectedBidId || b.buyerId === selectedBidId);
            }
            if (!target) {
              target = list[0];
            }
            setActiveBid(target);
          }
        }
        if (data.round) setRound(data.round);
      }
    } catch (e) {
      console.error('Error fetching bid history on seller side:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidHistory();

    const handleBidUpdate = () => fetchBidHistory();
    const interval = setInterval(fetchBidHistory, 4000);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#F8F9FB]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const historyItems = (activeBid?.history || []).slice().reverse();
  const dealName = round?.dealName || 'VDR Sell';

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased pb-12">
      {/* Top Bidding Navigation Tabs + Right Corner Notification Bell */}
      <BiddingHeaderNav portal="seller" activeTab="bid-history" />

      <div className="max-w-[1280px] mx-auto pb-8">
        {/* Page Title & Subtitle matching buyer side */}
        <div className="pt-6 px-7 flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-slate-900 m-0 tracking-tight">Bid history</h1>
              {bidsList.length > 1 && activeBid && (
                <div className="relative inline-flex items-center">
                  <select
                    value={activeBid.id}
                    onChange={(e) => {
                      setSelectedBidId(e.target.value);
                      const target = bidsList.find((b) => b.id === e.target.value);
                      if (target) setActiveBid(target);
                    }}
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
            <div className="text-[13px] text-slate-500 font-medium mt-1.5">
              Every version submitted by <b>{activeBid?.name || 'Buyer'}</b> on {dealName}, in order
            </div>
          </div>
        </div>

        {/* Timeline List matching buyer side structure */}
        <div className="mt-6 mx-7">
          {historyItems.length === 0 ? (
            <div className="flex gap-4.5 py-5 border-b border-slate-100 last:border-b-0">
              <div className="flex flex-col items-center shrink-0 w-6">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-50 border-2 border-blue-600"></div>
              </div>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-slate-900">
                    Current offer — {activeBid?.offer || '$11.5M'}
                  </span>
                  <span className="text-[11.5px] text-slate-500 font-medium">Latest</span>
                </div>
                <div className="text-[12.5px] text-slate-600 mt-1">
                  {activeBid?.cash || '75%'} cash / {activeBid?.stock || '25%'} stock · Expected close {activeBid?.close || 'Dec 2026'}
                </div>
              </div>
            </div>
          ) : (
            historyItems.map((item, idx) => {
              const isLatest = idx === 0;
              const isCounter = item.event?.toLowerCase().includes('counter');

              return (
                <div key={idx} className="flex gap-4.5 py-5 border-b border-slate-100 last:border-b-0">
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 ${
                        isCounter
                          ? 'bg-amber-50 border-amber-500'
                          : isLatest
                          ? 'bg-blue-50 border-blue-600'
                          : 'bg-white border-slate-300'
                      }`}
                    ></div>
                    {idx < historyItems.length - 1 && (
                      <div className="w-[1.5px] flex-1 bg-slate-200 mt-1.5 mb-[-20px]"></div>
                    )}
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
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

                    <div className="text-[12.5px] text-slate-600 mt-1.5">
                      {item.note || `${activeBid?.cash || '75%'} cash / ${activeBid?.stock || '25%'} stock · Expected close ${activeBid?.close || 'Dec 2026'}`}
                    </div>
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
