"use client";

import React from 'react';
import Link from 'next/link';
import BiddingNotificationBell from './BiddingNotificationBell';

export default function BiddingHeaderNav({ portal = 'buyer', activeTab = 'bidding' }) {
  const isBuyer = portal === 'buyer';

  const buyerTabs = [
    { id: 'my-bid', label: 'My bid', href: '/bidding/buyer-side/my-bid' },
    { id: 'bid-history', label: 'Bid history', href: '/bidding/buyer-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/buyer-side/messages' },
    { id: 'term-sheet', label: 'Term sheet', href: '/bidding/buyer-side/term-sheet' }
  ];

  const sellerTabs = [
    { id: 'bidding', label: 'Bidding', href: '/bidding/seller-side' },
    { id: 'bid-history', label: 'Bid history', href: '/bidding/seller-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/seller-side/messages' },
    { id: 'term-sheet', label: 'Term sheet', href: '/bidding/seller-side/term-sheet' }
  ];

  const tabs = isBuyer ? buyerTabs : sellerTabs;

  return (
    <div className="flex justify-between items-center px-7 border-b border-slate-200 bg-white">
      <div className="flex gap-[2px]">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-[13px] text-[13px] transition-colors ${
                isActive
                  ? 'text-slate-900 border-b-2 border-blue-600 font-medium'
                  : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Top Nav Bar Right Corner Notification Bell */}
      <BiddingNotificationBell role={isBuyer ? 'buyer' : 'seller'} />
    </div>
  );
}

