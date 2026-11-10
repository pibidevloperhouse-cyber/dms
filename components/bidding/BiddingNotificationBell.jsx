"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, CheckCircle2, XCircle, Scale, FileText, Sparkles, ArrowRight } from 'lucide-react';

export default function BiddingNotificationBell({ role = 'buyer' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [selectedCounterModal, setSelectedCounterModal] = useState(null);
  const [isMatchingCounter, setIsMatchingCounter] = useState(false);
  const popoverRef = useRef(null);

  const storageKey = `dms_bidding_notifications_read_${role}`;

  const handleMatchCounterInBell = async (bidId, counterAmountFormatted) => {
    if (!bidId) return;
    setIsMatchingCounter(true);
    try {
      const res = await fetch(`/api/bidding/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MATCH_COUNTER', requesterRole: 'guest_admin' })
      });
      if (res.ok) {
        alert(`You matched the counter-offer at ${counterAmountFormatted || 'asking price'}!`);
        setSelectedCounterModal(null);
        await fetchNotifications();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bid_submitted'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatchingCounter(false);
    }
  };

  // Load read notifications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch (e) { }
  }, [storageKey]);

  // Fetch bid data and generate notifications
  const fetchNotifications = async () => {
    try {
      let buyerId = '';
      try {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.id) buyerId = user.id;
        }
      } catch (e) { }

      const url = role === 'seller'
        ? '/api/bidding/bids?role=super_admin'
        : `/api/bidding/bids?role=guest_admin${buyerId ? `&buyerId=${encodeURIComponent(buyerId)}` : ''}`;

      const [res, tsRes, spaRes] = await Promise.all([
        fetch(url),
        fetch('/api/bidding/term-sheet'),
        fetch('/api/bidding/spa')
      ]);
      if (!res.ok) return;

      const data = await res.json();
      let termSheet = null;
      let spa = null;
      if (tsRes.ok) {
        try {
          const tsData = await tsRes.json();
          termSheet = tsData?.termSheet;
        } catch (_) { }
      }
      if (spaRes?.ok) {
        try {
          const spaData = await spaRes.json();
          spa = spaData?.spa;
        } catch (_) { }
      }

      const isTermSheetTransmitted = Boolean(
        termSheet && (
          termSheet.status === 'sent_to_buyer' ||
          termSheet.status === 'signed' ||
          termSheet.status === 'signed_by_buyer' ||
          termSheet.status === 'executed' ||
          termSheet.signatures?.buyer
        )
      );

      const generated = [];

      if (role === 'seller') {
        const bidsList = Object.values(data.bids || {});
        const target = bidsList[0] || null;

        // 0. SPA Executed by Buyer
        if (spa && spa.status === 'executed') {
          generated.push({
            id: `seller-spa-executed-${spa.lastUpdated || 'now'}`,
            type: 'spa_closed',
            title: '🎉 SPA Agreement Fully Executed!',
            message: `${spa.buyerName || 'Buyer'} has digitally executed the Share Purchase Agreement (SPA). Deal is closed!`,
            timestamp: spa.signatures?.buyer?.signedAt || spa.lastUpdated || 'Recently',
            link: '/bidding/seller-side/spa',
            actionLabel: 'View Closed SPA',
            icon: 'accept',
            color: 'emerald'
          });
        }

        // 0b. Term Sheet Signed by Buyer
        const isTermSheetSignedByBuyer = Boolean(
          termSheet && (
            termSheet.signatures?.buyer ||
            termSheet.status === 'signed_by_buyer' ||
            termSheet.status === 'signed' ||
            termSheet.status === 'executed'
          )
        );
        if (isTermSheetSignedByBuyer) {
          const buyerSigner = termSheet.signatures?.buyer?.signer || termSheet.buyerName || target?.name || 'Buyer';
          const signedAt = termSheet.signatures?.buyer?.signedAt || termSheet.lastUpdated || 'Recently';
          generated.push({
            id: `seller-termsheet-signed-${signedAt}`,
            type: 'accept',
            title: '✍️ Term Sheet Signed by Buyer',
            message: `${buyerSigner} has digitally signed the Term Sheet. You can now move to the SPA Agreement.`,
            timestamp: signedAt,
            link: '/bidding/seller-side/term-sheet',
            actionLabel: 'View Signed Term Sheet',
            icon: 'accept',
            color: 'emerald'
          });
        }

        if (target) {
          const history = target.history || [];

          // 1. Bid Accepted
          if (target.status === 'Accepted' || history.some(h => h.event?.includes('Accept'))) {
            const acceptEvent = history.find(h => h.event?.includes('Accept'));
            generated.push({
              id: `seller-accept-${target.id}-${acceptEvent?.date || 'now'}`,
              type: 'accepted',
              title: 'Bid Accepted — Moved to Term Sheet',
              message: `You accepted ${target.name}'s proposal (${target.offer}). Deal advanced to Term Sheet execution.`,
              timestamp: acceptEvent?.date || 'Recently',
              link: '/bidding/seller-side/term-sheet',
              actionLabel: 'Open Term Sheet',
              icon: 'accept',
              color: 'emerald'
            });
          }

          // 2. Counter-offer sent
          if (target.status === 'Countered' || target.counterOffer) {
            const expClose = target.counterOffer?.expectedCloseDisplay || (target.counterOffer?.expectedCloseDate ? new Date(target.counterOffer.expectedCloseDate).toLocaleString('default', { month: 'short', year: 'numeric' }) : null);
            generated.push({
              id: `seller-counter-${target.id}-${target.counterOffer?.counteredAt || 'now'}`,
              type: 'counter',
              title: 'Counter-Offer Transmitted',
              message: `You sent a counter-offer of ${target.counterOffer?.amountFormatted || 'revised valuation'}${expClose ? ` (Target close: ${expClose})` : ''} to ${target.name}.`,
              timestamp: target.counterOffer?.counteredAt || 'Recently',
              link: '/bidding/seller-side',
              actionLabel: 'View in Bidding',
              icon: 'counter',
              color: 'amber'
            });
          }

          // 3. Bid Declined & Round Closed
          if (target.status === 'Declined' || history.some(h => h.event?.includes('Decline'))) {
            const declineEvent = history.find(h => h.event?.includes('Decline'));
            generated.push({
              id: `seller-decline-${target.id}-${declineEvent?.date || 'now'}`,
              type: 'declined',
              title: 'Bid Declined & Round Closed',
              message: `You declined the proposal from ${target.name} and closed the bidding round.`,
              timestamp: declineEvent?.date || 'Recently',
              link: '/bidding/seller-side',
              actionLabel: 'View in Bidding',
              icon: 'decline',
              color: 'rose'
            });
          }

          // 3b. Bidding Round Resumed
          if (history.some(h => h.event?.includes('Resumed'))) {
            const resumeEvent = history.slice().reverse().find(h => h.event?.includes('Resumed'));
            generated.push({
              id: `seller-resume-${target.id}-${resumeEvent?.date || 'now'}`,
              type: 'submission',
              title: 'Bidding Round Resumed',
              message: `You reopened the bidding round for ${target.name}.`,
              timestamp: resumeEvent?.date || 'Recently',
              link: '/bidding/seller-side',
              actionLabel: 'View in Bidding',
              icon: 'submission',
              color: 'emerald'
            });
          }

          // 4. Bid Submitted / Revised
          const latestSubmit = history.slice().reverse().find(h => h.event?.includes('Submit') || h.event?.includes('Revised'));
          if (latestSubmit) {
            generated.push({
              id: `seller-submit-${target.id}-${latestSubmit.date}`,
              type: 'submission',
              title: latestSubmit.event?.includes('Revised') ? 'Bid Revised by Buyer' : 'New Binding Offer Submitted',
              message: `${target.name} submitted an offer of ${latestSubmit.amount || target.offer} (${target.cash} cash / ${target.stock} stock).`,
              timestamp: latestSubmit.date,
              link: '/bidding/seller-side',
              actionLabel: 'Evaluate Proposal',
              icon: 'submission',
              color: 'blue'
            });
          }
        }
      } else {
        // Buyer side notifications
        const bid = data.myBid;
        if (bid) {
          const history = bid.history || [];

          // 0. SPA Dispatched & Ready for Final Signature
          if (spa && spa.status === 'dispatched' && !spa.signatures?.buyer) {
            generated.push({
              id: `buyer-spa-dispatched-${spa.lastUpdated || 'now'}`,
              type: 'spa',
              title: '📑 Definitive SPA Dispatched for Execution',
              message: 'The seller board has transmitted the definitive Share Purchase Agreement (SPA). Review clauses and sign with your mouse to close the deal.',
              timestamp: spa.lastUpdated || 'Recently',
              link: '/bidding/buyer-side/spa',
              actionLabel: 'Review & Sign SPA',
              icon: 'termsheet',
              color: 'teal'
            });
          }

          // 0b. SPA Executed & Closed
          if (spa && spa.status === 'executed') {
            generated.push({
              id: `buyer-spa-executed-${spa.lastUpdated || 'now'}`,
              type: 'spa_closed',
              title: '🎉 M&A Deal Closed & Fully Executed!',
              message: 'Your Share Purchase Agreement has been successfully executed and recorded. The acquisition is closed!',
              timestamp: spa.signatures?.buyer?.signedAt || 'Recently',
              link: '/bidding/buyer-side/spa',
              actionLabel: 'View Executed SPA',
              icon: 'accept',
              color: 'emerald'
            });
          }

          // 1. Seller Accepted Bid
          if (bid.status === 'Accepted' || history.some(h => h.event?.includes('Accept'))) {
            const acceptEvent = history.find(h => h.event?.includes('Accept'));

            if (!isTermSheetTransmitted) {
              generated.push({
                id: `buyer-accept-${bid.id}-${acceptEvent?.date || 'now'}`,
                type: 'accepted',
                title: '🎉 Your Bid Has Been Accepted!',
                message: `Congratulations! The seller board accepted your ${bid.offer} acquisition proposal. The bilateral Term Sheet is currently being drafted by the seller board.`,
                timestamp: acceptEvent?.date || 'Recently',
                link: '/bidding/buyer-side/my-bid',
                actionLabel: 'View Proposal Status',
                icon: 'accept',
                color: 'emerald'
              });
            } else {
              generated.push({
                id: `buyer-termsheet-${bid.id}-${termSheet?.lastUpdated || 'now'}`,
                type: 'termsheet',
                title: '📄 Binding Term Sheet Received',
                message: `The seller board has finalized and transmitted the formal Term Sheet for your review and digital signature.`,
                timestamp: termSheet?.lastUpdated || acceptEvent?.date || 'Recently',
                link: '/bidding/buyer-side/term-sheet',
                actionLabel: 'Review & Sign Term Sheet',
                icon: 'termsheet',
                color: 'emerald'
              });
            }
          }

          // 2. Seller Counter-Offer Received
          if (bid.status === 'Countered' || bid.counterOffer) {
            const expClose = bid.counterOffer?.expectedCloseDisplay || (bid.counterOffer?.expectedCloseDate ? new Date(bid.counterOffer.expectedCloseDate).toLocaleString('default', { month: 'short', year: 'numeric' }) : null);
            generated.push({
              id: `buyer-counter-${bid.id}-${bid.counterOffer?.counteredAt || 'now'}`,
              type: 'counter',
              title: 'Seller Counter-Offer Received',
              message: `The seller board requested ${bid.counterOffer?.amountFormatted || 'revised valuation'}${expClose ? ` (Target close: ${expClose})` : ''}: "${bid.counterOffer?.note || 'Please review our counter valuation.'}"`,
              timestamp: bid.counterOffer?.counteredAt || 'Recently',
              link: '/bidding/buyer-side/my-bid',
              actionLabel: 'View counter',
              icon: 'counter',
              color: 'amber',
              counterData: {
                ...bid.counterOffer,
                bidId: bid.id,
                bidOffer: bid.offer,
                expectedCloseDisplay: expClose || ''
              }
            });
          }

          // 3. Bid Declined by Seller & Round Closed
          if (bid.status === 'Declined' || history.some(h => h.event?.includes('Decline'))) {
            const declineEvent = history.find(h => h.event?.includes('Decline'));
            generated.push({
              id: `buyer-decline-${bid.id}-${declineEvent?.date || 'now'}`,
              type: 'declined',
              title: 'Proposal Declined & Round Closed',
              message: `The seller board reviewed and declined your proposal. The active bidding round has been closed.`,
              timestamp: declineEvent?.date || 'Recently',
              link: '/bidding/buyer-side/my-bid',
              actionLabel: 'View Status',
              icon: 'decline',
              color: 'rose'
            });
          }

          // 3b. Bidding Round Reopened
          if (history.some(h => h.event?.includes('Resumed'))) {
            const resumeEvent = history.slice().reverse().find(h => h.event?.includes('Resumed'));
            generated.push({
              id: `buyer-resume-${bid.id}-${resumeEvent?.date || 'now'}`,
              type: 'submission',
              title: 'Bidding Round Reopened',
              message: `The seller board reopened the bidding round. You may now revise and submit your proposal.`,
              timestamp: resumeEvent?.date || 'Recently',
              link: '/bidding/buyer-side/my-bid',
              actionLabel: 'Revise Offer',
              icon: 'submission',
              color: 'emerald'
            });
          }

          // 4. Proposal Submitted Confirmation
          const latestSubmit = history.slice().reverse().find(h => h.event?.includes('Submit') || h.event?.includes('Revised'));
          if (latestSubmit) {
            generated.push({
              id: `buyer-submit-${bid.id}-${latestSubmit.date}`,
              type: 'submission',
              title: 'Binding Proposal Transmitted',
              message: `Your binding proposal of ${latestSubmit.amount || bid.offer} was submitted to Super Admin for evaluation.`,
              timestamp: latestSubmit.date,
              link: '/bidding/buyer-side/my-bid',
              actionLabel: 'View Proposal',
              icon: 'submission',
              color: 'blue'
            });
          }
        }
      }

      setNotifications(generated);
    } catch (e) {
      console.error('Error fetching bidding notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 8000);
    const handleUpdate = () => fetchNotifications();
    if (typeof window !== 'undefined') {
      window.addEventListener('bid_submitted', handleUpdate);
      window.addEventListener('bid_updated', handleUpdate);
      window.addEventListener('focus', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        clearInterval(interval);
        window.removeEventListener('bid_submitted', handleUpdate);
        window.removeEventListener('bid_updated', handleUpdate);
        window.removeEventListener('focus', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
    return () => clearInterval(interval);
  }, [role]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
    } catch (e) { }
  };

  const markSingleAsRead = (id) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));
    } catch (e) { }
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const renderIcon = (type, color) => {
    switch (type) {
      case 'accept':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'counter':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Scale className="w-4 h-4" />
          </div>
        );
      case 'decline':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
            <XCircle className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <FileText className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative py-1.5" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
        title="Bidding Notifications"
        aria-label="Bidding Notifications"
      >
        <Bell className="w-[22px] h-[22px] text-slate-700" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] sm:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-[13.5px] font-bold text-slate-900">Bidding Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11.5px] text-slate-500 hover:text-blue-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-medium">No bidding notifications yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Updates on submissions, counter-offers, and stage advancement will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => markSingleAsRead(n.id)}
                    className={`p-4 transition-colors flex gap-3.5 items-start ${isRead ? 'bg-white hover:bg-slate-50/60 opacity-80' : 'bg-blue-50/20 hover:bg-blue-50/40'
                      }`}
                  >
                    {renderIcon(n.type, n.color)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[13px] font-bold text-slate-900 leading-tight">
                          {n.title}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[12px] text-slate-600 leading-relaxed font-normal mb-2.5">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {n.timestamp}
                        </span>

                        {n.type === 'counter' && n.counterData ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markSingleAsRead(n.id);
                              setIsOpen(false);
                              setSelectedCounterModal(n.counterData);
                            }}
                            className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 hover:text-amber-900 transition-colors cursor-pointer"
                          >
                            <span>{n.actionLabel || 'View counter'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <Link
                            href={n.link}
                            onClick={() => {
                              markSingleAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11.5px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <span>{n.actionLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Seller Counter-Offer Details Modal Card */}
      {selectedCounterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <Scale className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
                    Seller Counter-Offer Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedCounterModal(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revised valuation and closing condition proposed by the seller board.
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/60">
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Counter Valuation</div>
                <div className="text-2xl font-black text-amber-950 mt-0.5">
                  {selectedCounterModal.amountFormatted || `$${(Number(selectedCounterModal.amount || 12000000) / 1000000).toFixed(1)}M`}
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Close</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {selectedCounterModal.expectedCloseDisplay || selectedCounterModal.expectedCloseDate || 'Dec 2026'}
                </div>
              </div>
            </div>

            {/* Current Proposal Comparison */}
            {selectedCounterModal.bidOffer && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-[#FAFAFA] flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Your current proposal:</span>
                <span className="font-bold text-blue-700">{selectedCounterModal.bidOffer}</span>
              </div>
            )}

            {/* Note to Buyer */}
            <div className="mb-5">
              <label className="text-[11.5px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">
                Seller's Justification / Note
              </label>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs italic text-slate-800 leading-relaxed">
                "{selectedCounterModal.note || 'The seller board is requesting benchmark valuation.'}"
              </div>
              {selectedCounterModal.counteredAt && (
                <div className="text-[10.5px] text-slate-400 mt-1.5 text-right">
                  Transmitted on {selectedCounterModal.counteredAt}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCounterModal(null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {role === 'buyer' && (
                <button
                  type="button"
                  onClick={() => handleMatchCounterInBell(selectedCounterModal.bidId, selectedCounterModal.amountFormatted)}
                  disabled={isMatchingCounter}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {isMatchingCounter ? 'Matching...' : `Match Counter — ${selectedCounterModal.amountFormatted || '$12.0M'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

