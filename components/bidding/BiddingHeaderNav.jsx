"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BiddingNotificationBell from './BiddingNotificationBell';

export default function BiddingHeaderNav({ portal = 'buyer', activeTab = 'bidding' }) {
  const isBuyer = portal === 'buyer';
  const [isTermSheetTransmitted, setIsTermSheetTransmitted] = useState(false);
  const [isSpaVisible, setIsSpaVisible] = useState(false);

  useEffect(() => {
    if (!isBuyer) return;

    let isMounted = true;
    const checkStatus = async () => {
      try {
        const [tsRes, spaRes] = await Promise.all([
          fetch('/api/bidding/term-sheet'),
          fetch('/api/bidding/spa')
        ]);

        if (tsRes.ok) {
          const data = await tsRes.json();
          const ts = data?.termSheet;
          const transmitted = Boolean(
            ts && (
              ts.status === 'sent_to_buyer' ||
              ts.status === 'signed' ||
              ts.status === 'signed_by_buyer' ||
              ts.status === 'executed' ||
              ts.signatures?.buyer
            )
          );
          const isTSSigned = Boolean(
            ts && (
              ts.status === 'signed' ||
              ts.status === 'signed_by_buyer' ||
              ts.status === 'executed' ||
              ts.signatures?.buyer
            )
          );
          if (isMounted) {
            setIsTermSheetTransmitted(transmitted);
            if (isTSSigned) setIsSpaVisible(true);
          }
        }

        if (spaRes.ok) {
          const spaData = await spaRes.json();
          if (spaData?.spa && (spaData.spa.status === 'dispatched' || spaData.spa.status === 'executed')) {
            if (isMounted) setIsSpaVisible(true);
          }
        }

        try {
          const rawSpa = localStorage.getItem('dms_spa_agreement_dispatched');
          if (rawSpa && isMounted) {
            setIsSpaVisible(true);
          }
        } catch (_) { }
      } catch (err) {
        // silent catch
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    const handleEvents = () => checkStatus();

    window.addEventListener('storage', handleEvents);
    window.addEventListener('bid_submitted', handleEvents);
    window.addEventListener('focus', handleEvents);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleEvents);
      window.removeEventListener('bid_submitted', handleEvents);
      window.removeEventListener('focus', handleEvents);
    };
  }, [isBuyer]);

  const buyerTabs = [
    { id: 'my-bid', label: 'My Bid & Proposal', href: '/bidding/buyer-side/my-bid' },
    { id: 'bid-history', label: 'Bid History', href: '/bidding/buyer-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/buyer-side/messages' },
    ...(isTermSheetTransmitted
      ? [{ id: 'term-sheet', label: 'Term Sheet', href: '/bidding/buyer-side/term-sheet' }]
      : []),
    ...(isSpaVisible
      ? [{ id: 'spa', label: 'SPA Agreement', href: '/bidding/buyer-side/spa' }]
      : [])
  ];

  const sellerTabs = [
    { id: 'bidding', label: 'Bidding Ledger', href: '/bidding/seller-side' },
    { id: 'bid-history', label: 'Bid History', href: '/bidding/seller-side/bid-history' },
    { id: 'messages', label: 'Messages', href: '/bidding/seller-side/messages' },
    { id: 'term-sheet', label: 'Term Sheet', href: '/bidding/seller-side/term-sheet' },
    { id: 'spa', label: 'SPA Agreement', href: '/bidding/seller-side/spa' }
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
                className={`px-3.5 py-[13px] text-[13px] font-semibold transition-all relative shrink-0 ${isActive
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
