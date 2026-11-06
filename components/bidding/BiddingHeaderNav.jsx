"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BiddingNotificationBell from './BiddingNotificationBell';

export default function BiddingHeaderNav({ portal = 'buyer', activeTab = 'bidding' }) {
  const isBuyer = portal === 'buyer';

  const buyerTabs = [
    { id: 'my-bid', label: 'My Bid & Proposal', href: '/bidding/buyer-side/my-bid' },
    { id: 'bid-history', label: 'Bid History', href: '/bidding/buyer-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/buyer-side/messages' },
    { id: 'term-sheet', label: 'Term Sheet', href: '/bidding/buyer-side/term-sheet' }
  ];

  const sellerTabs = [
    { id: 'bidding', label: 'Bidding Ledger', href: '/bidding/seller-side' },
    { id: 'bid-history', label: 'Bid History', href: '/bidding/seller-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/seller-side/messages' },
    { id: 'term-sheet', label: 'Term Sheet', href: '/bidding/seller-side/term-sheet' }
  ];

  const tabs = isBuyer ? buyerTabs : sellerTabs;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-7 border-b border-slate-200 bg-white gap-2">
      <div className="flex items-center gap-3 py-1 sm:py-0 overflow-x-auto">
        {/* Back Link to Deal Workflow */}
        <Link
          href="/deal-workflow"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#006666] py-2.5 pr-3 border-r border-slate-200 transition-colors shrink-0"
          title="Return to Deal Workflow & Negotiation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Deal Workflow</span>
        </Link>

        {/* Bidding Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-3.5 py-[13px] text-[13px] font-semibold transition-all relative shrink-0 ${
                  isActive
                    ? 'text-[#006666]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#006666] rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Corner: Role Pill & Notification Bell */}
      <div className="flex items-center gap-3 py-2 sm:py-0 shrink-0 self-end sm:self-center">
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
          {isBuyer ? 'Buyer Portal' : 'Seller Board'}
        </span>
        <BiddingNotificationBell role={isBuyer ? 'buyer' : 'seller'} />
      </div>
    </div>
  );
}
