"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaArrowLeft,
  FaFileInvoiceDollar,
  FaCommentDots,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaFileAlt,
  FaFilePdf,
  FaExternalLinkAlt,
  FaDownload,
  FaPaperPlane,
  FaUserTie,
  FaClock,
  FaCheck
} from 'react-icons/fa';

export default function DealBiddingDetails({ dealId, dealName = "Project Alpha" }) {
  const router = useRouter();

  // Mode: 'bidding' | 'messages'
  const [activeSubTab, setActiveSubTab] = useState('bidding');

  // If viewing individual bid inside deal (img4)
  const [selectedBidId, setSelectedBidId] = useState(null);

  // Filter & sort states for bid ledger (img1)
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'Shortlisted' | 'Under review' | 'Declined'
  const [sortBy, setSortBy] = useState('amount_high');

  // Data states
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [bidsData, setBidsData] = useState({});

  // Counter Modal State
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState('100000000');
  const [counterNote, setCounterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Messages State (img5)
  const [conversations, setConversations] = useState({});
  const [selectedBuyerMsgId, setSelectedBuyerMsgId] = useState('c');
  const [inputMessage, setInputMessage] = useState('');
  const [msgCategory, setMsgCategory] = useState('General');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const fetchBiddingData = async () => {
    try {
      const q = dealId ? `&dealId=${encodeURIComponent(dealId)}` : '';
      const [bidsRes, msgRes] = await Promise.all([
        fetch(`/api/bidding/bids?role=super_admin${q}`),
        fetch(`/api/bidding/messages?${dealId ? `dealId=${encodeURIComponent(dealId)}` : ''}`)
      ]);

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        if (data.bids) setBidsData(data.bids);
        if (data.kpis) setKpis(data.kpis);
        if (data.round) setRound(data.round);
      }

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.conversations) {
          setConversations(msgData.conversations);
          const convKeys = Object.keys(msgData.conversations);
          if (convKeys.length > 0 && (!selectedBuyerMsgId || !msgData.conversations[selectedBuyerMsgId])) {
            setSelectedBuyerMsgId(convKeys[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching deal bidding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiddingData();
  }, [dealId]);

  // Handle Export Ledger to CSV
  const handleExportLedger = () => {
    const bidsList = Array.from(new Map(Object.values(bidsData || {}).filter(b => b && b.id).map(b => [b.id, b])).values());
    if (bidsList.length === 0) return;
    const headers = ['Buyer Name', 'Buyer Type', 'Offer Amount', 'Cash %', 'Stock %', 'Expected Close', 'Status', 'Engagement'];
    const rows = bidsList.map(b => [
      `"${b.name}"`,
      `"${b.type}"`,
      `"${b.offer}"`,
      `"${b.cash}"`,
      `"${b.stock}"`,
      `"${b.close}"`,
      `"${b.status}"`,
      `"${b.engagement}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(dealName || 'Deal').replace(/\s+/g, '_')}_Bid_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close Round Action
  const handleCloseRound = async () => {
    if (!confirm('Are you sure you want to close this bidding round?')) return;
    try {
      const res = await fetch('/api/bidding/round', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE_ROUND', requesterRole: 'super_admin' })
      });
      if (res.ok) {
        alert('Bidding round closed successfully.');
        fetchBiddingData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Individual Bid Actions (img4)
  const handleDeclineBid = async (id) => {
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
        fetchBiddingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCounter = async (id) => {
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
        fetchBiddingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAndMoveToTermSheet = async (id) => {
    const currentBid = bidsData[id];
    if (!confirm(`Accept bid from ${currentBid?.name || 'buyer'} (${currentBid?.offer || '$100.0M'}) and advance to Term Sheet?`)) return;
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

  // Messages Actions (img5)
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMsg) return;
    setIsSendingMsg(true);
    try {
      const res = await fetch('/api/bidding/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          buyerId: selectedBuyerMsgId,
          text: inputMessage.trim(),
          sender: 'You',
          senderRole: 'seller',
          category: msgCategory
        })
      });
      if (res.ok) {
        setInputMessage('');
        fetchBiddingData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const allBidsList = Array.from(new Map(Object.values(bidsData || {}).filter(b => b && b.id).map(b => [b.id, b])).values());
  const filteredBids = allBidsList.filter(b => {
    if (filterTab === 'ALL') return true;
    return (b.status || '').toLowerCase() === filterTab.toLowerCase();
  });

  const sortedBids = [...filteredBids].sort((a, b) => {
    if (sortBy === 'amount_high') return (b.offerAmount || 0) - (a.offerAmount || 0);
    if (sortBy === 'engagement') return (b.views || 0) - (a.views || 0);
    return 0;
  });

  const selectedBid = selectedBidId ? bidsData[selectedBidId] : null;

  const convList = Object.values(conversations);
  const currentConv = conversations[selectedBuyerMsgId] || convList[0];

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading deal bidding &amp; negotiation room...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Sub-Header Navigation: Switch between Bidding Overview (img1/img4) and Messages (img5) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('bidding');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'bidding'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaFileInvoiceDollar className={activeSubTab === 'bidding' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Bidding Ledger &amp; Round</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200/80 text-slate-700 text-[10px] font-bold rounded-full">
              {allBidsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('messages');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'messages'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaCommentDots className={activeSubTab === 'messages' ? 'text-blue-600' : 'text-slate-400'} />
            <span>Buyer Messages</span>
            {convList.some(c => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <Link
            href="/bidding/seller-side/term-sheet"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>Term Sheet Draft</span>
            <FaExternalLinkAlt className="text-[10px] opacity-70" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BIDDING (IMG 1 - LEDGER, OR IMG 4 - INDIVIDUAL BID VIEW) */}
      {/* ========================================================================= */}
      {activeSubTab === 'bidding' && (
        <>
          {/* IF NO SPECIFIC BID IS SELECTED -> SHOW FULL BIDDING ROUND & LEDGER (IMG 1) */}
          {!selectedBidId && (
            <div className="space-y-6">
              {/* Header: Deal Name, Ask, Round status, Export & Close actions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="text-[24px] text-slate-900 flex items-baseline gap-3 flex-wrap font-bold tracking-tight">
                      {dealName || round?.dealName || 'Project Alpha'}
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide border ${
                        round?.status === 'closed'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${round?.status === 'closed' ? 'bg-slate-500' : 'bg-amber-500'}`} />
                        {round?.status === 'closed' ? 'Round Closed' : (round?.statusLabel || 'Bid Evaluation')}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[13px] font-medium mt-1">
                      Round opened {round?.openedDate || '12 Aug 2026'} &nbsp;·&nbsp; Ask {round?.askingPriceFormatted || '$100M'} &nbsp;·&nbsp; {kpis?.receivedCount || allBidsList.length} of {round?.invitedCount || 4} invited buyers have bid
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <button
                      type="button"
                      onClick={handleExportLedger}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      Export ledger
                    </button>
                    {round?.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={handleCloseRound}
                        className="text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-2xs"
                      >
                        Close bidding round
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-rose-600 font-medium mt-3.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                  Bid deadline in <b className="font-bold">2 days 6 hrs</b> — {round?.deadlineDisplay || '18:00 IST, 6 Sep 2026'} · reminder sent to 1 outstanding buyer
                </div>
              </div>

              {/* 5-Column KPI Cards (img1) */}
              <div className="grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">Bids received</div>
                  <div className="text-[22px] font-bold text-slate-900 tracking-tight">
                    {kpis?.receivedCount || allBidsList.length}
                    <span className="text-slate-400 font-normal text-[13px]"> / {round?.invitedCount || 4} invited</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate">1 outstanding — Meridian Partners</div>
                </div>

                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">Highest offer</div>
                  <div className="text-[22px] font-bold text-blue-600 tracking-tight">{kpis?.highestOfferFormatted || '$100.0M'}</div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">At asking price</div>
                </div>

                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">Average offer</div>
                  <div className="text-[22px] font-bold text-slate-900 tracking-tight">{kpis?.averageOfferFormatted || '$95.0M'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Spread $10M</div>
                </div>

                <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">Median cash component</div>
                  <div className="text-[22px] font-bold text-slate-900 tracking-tight">{kpis?.medianCashFormatted || '78%'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Across 3 bids</div>
                </div>

                <div className="p-4 md:p-5">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">VDR engagement</div>
                  <div className="text-[22px] font-bold text-slate-900 tracking-tight">{kpis?.totalViews || 41} <span className="text-slate-400 font-normal text-[13px]">views</span></div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1 truncate">Highest: {kpis?.highestEngagedBuyer || 'Halcyon Growth'}</div>
                </div>
              </div>

              {/* Bid Ledger Table (img1) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-[16px] font-bold text-slate-900 m-0">Bid ledger <span className="text-slate-400 font-normal text-sm">{allBidsList.length} offers</span></h3>
                    <p className="text-xs text-slate-400 mt-0.5">Updated live as buyers submit binding proposals</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                      {['ALL', 'Shortlisted', 'Under review', 'Declined'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setFilterTab(tab)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            filterTab === tab
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {tab === 'ALL' ? `All (${allBidsList.length})` : tab}
                        </button>
                      ))}
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
                    >
                      <option value="amount_high">Sort by: Offer amount — high to low</option>
                      <option value="engagement">Sort by: VDR Engagement</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FB] border-b border-slate-200 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Buyer</th>
                        <th className="py-3 px-4">Offer</th>
                        <th className="py-3 px-4">Structure</th>
                        <th className="py-3 px-4">Engagement</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Submitted</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {sortedBids.map((b) => {
                        const cashVal = parseInt(String(b.cash).replace('%', ''), 10) || 60;
                        const stockVal = 100 - cashVal;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => setSelectedBidId(b.id)}
                            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {b.mark || b.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                    <span>{b.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-400">{b.type}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{b.offer}</div>
                              <div className="text-xs text-slate-400">Close: {b.close}</div>
                            </td>

                            <td className="py-3.5 px-4 w-44">
                              <div className="flex h-2 rounded-full overflow-hidden mb-1">
                                <div className="bg-slate-900" style={{ width: `${cashVal}%` }} />
                                <div className="bg-blue-200" style={{ width: `${stockVal}%` }} />
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cashVal}% cash / {stockVal}% stock
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${Math.min(100, (b.views || 10) * 5)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-600">{b.views || 14} docs</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                b.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                b.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {b.status}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-xs text-slate-500">
                              {b.submittedAt || '2 Sep'}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBuyerMsgId(b.id);
                                    setActiveSubTab('messages');
                                  }}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                >
                                  Message
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBidId(b.id)}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  View bid
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {sortedBids.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                            No bids match the selected status filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* IF AN INDIVIDUAL BID IS CLICKED -> SHOW FULL BID VIEW INSIDE DEAL (IMG 4) */}
          {/* ========================================================================= */}
          {selectedBidId && selectedBid && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back to Bids Navigation Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedBidId(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
                >
                  <FaArrowLeft className="text-[10px]" />
                  <span>Back to all bids</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Deal: <b>{dealName}</b></span>
                </div>
              </div>

              {/* Individual Bid Header: Firm mark, title, action buttons (img4) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-start flex-wrap gap-5">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {selectedBid.mark || selectedBid.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-[24px] font-bold text-slate-900 mb-0.5 tracking-tight">{selectedBid.name}</h2>
                    <div className="text-slate-500 font-medium text-[13px]">{selectedBid.type}</div>
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      <span className="text-[11px] text-slate-600 font-medium border border-slate-200 px-2.5 py-0.5 rounded-full bg-slate-50">
                        NDA signed
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium border border-slate-200 px-2.5 py-0.5 rounded-full bg-slate-50">
                        Lead: {selectedBid.leadName || 'R. Okafor'}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium border border-slate-200 px-2.5 py-0.5 rounded-full bg-slate-50">
                        Advisor: {selectedBid.advisorName || 'Linklane LLP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons: Decline, Counter, Accept, Message */}
                <div className="flex gap-2.5 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBuyerMsgId(selectedBid.id);
                      setActiveSubTab('messages');
                    }}
                    className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    Message Buyer
                  </button>

                  {selectedBid.status !== 'Declined' && (
                    <button
                      type="button"
                      onClick={() => handleDeclineBid(selectedBid.id)}
                      disabled={isSubmitting}
                      className="text-xs font-semibold px-3.5 py-2 rounded-lg border border-rose-300 text-rose-700 bg-white hover:bg-rose-50 transition-colors"
                    >
                      Decline bid
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCounterAmount(String(selectedBid.counterOffer?.amount || 100000000));
                      setCounterNote(selectedBid.counterOffer?.note || 'The seller board is requesting $100.0M enterprise valuation.');
                      setIsCounterModalOpen(true);
                    }}
                    disabled={isSubmitting}
                    className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Counter offer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAcceptAndMoveToTermSheet(selectedBid.id)}
                    disabled={isSubmitting}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Accept &amp; move to term sheet
                  </button>
                </div>
              </div>

              {/* 2-Column Content Grid: Left: Offer Summary & Documents; Right: Notes & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                <div className="flex flex-col gap-6">
                  {/* Offer Summary Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-[15px] font-bold mb-3.5 text-slate-900 border-b border-slate-100 pb-2">
                      Offer Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-[#FAFAFA]">
                        <div className="text-[10.5px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wider">Offer</div>
                        <div className="text-[19px] font-bold text-slate-900 tracking-tight">{selectedBid.offer}</div>
                      </div>
                      <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-[#FAFAFA]">
                        <div className="text-[10.5px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wider">vs. asking price</div>
                        <div className="text-[19px] font-bold tracking-tight" style={{ color: selectedBid.vsColor || '#16a34a' }}>
                          {selectedBid.vsAsk}
                        </div>
                      </div>
                      <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-[#FAFAFA]">
                        <div className="text-[10.5px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wider">Expected close</div>
                        <div className="text-[19px] font-bold text-slate-900 tracking-tight">{selectedBid.close}</div>
                      </div>
                      <div className="border border-slate-100 rounded-xl px-3 py-2.5 bg-[#FAFAFA]">
                        <div className="text-[10.5px] text-slate-500 mb-0.5 font-semibold uppercase tracking-wider">Status</div>
                        <div className="text-[14px] font-semibold text-slate-900 mt-1">{selectedBid.status}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[12px] text-slate-500 font-medium">Structure</div>
                      <div className="flex h-2.5 rounded-full overflow-hidden mt-1.5 mb-2">
                        <div className="bg-slate-900" style={{ width: `${parseInt(String(selectedBid.cash).replace('%', ''), 10) || 60}%` }} />
                        <div className="bg-blue-100 border-l border-white" style={{ width: `${100 - (parseInt(String(selectedBid.cash).replace('%', ''), 10) || 60)}%` }} />
                      </div>
                      <div className="flex gap-5 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:text-slate-900">
                          Cash {selectedBid.cash}
                        </span>
                        <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:text-blue-600">
                          Stock {selectedBid.stock}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submitted Documents Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-[15px] font-bold mb-4 text-slate-900 border-b border-slate-100 pb-2">
                      Submitted Documents
                    </div>
                    {(selectedBid.documents || [
                      { name: 'Letter of Intent — signed.pdf', size: '2.4 MB' },
                      { name: 'Financing confirmation.pdf', size: '1.1 MB' },
                      { name: 'Term sheet draft v2.docx', size: '840 KB' }
                    ]).map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-xl text-xs mb-2.5 hover:bg-[#F8F9FB] hover:border-slate-400 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 font-medium text-slate-900">
                          <FaFilePdf className="text-red-500 text-sm" />
                          <span>{doc.name}</span>
                          <span className="text-slate-400 font-normal">({doc.size})</span>
                        </div>
                        <span className="text-blue-600 font-semibold text-xs flex items-center gap-1">
                          Open <FaExternalLinkAlt className="text-[10px]" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Internal Notes & Recent Activity */}
                <div className="flex flex-col gap-6">
                  {/* Internal Notes */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-[15px] font-bold mb-3 text-slate-900 border-b border-slate-100 pb-2">
                      Internal Notes
                    </div>
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 text-[13px] text-slate-600 bg-[#FAFAFA] italic leading-relaxed">
                      "{selectedBid.note || 'Financing letter checks out — board is comfortable with the stock component. Recommend proceeding to term sheet.'}"
                      <br /><br />
                      <span className="not-italic text-[11.5px] text-slate-400 font-medium">
                        — V. Sharma, Finance Advisor
                      </span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                    <div className="text-[15px] font-bold mb-3 text-slate-900 border-b border-slate-100 pb-2">
                      Recent Activity
                    </div>
                    {(selectedBid.history || []).slice(-3).reverse().map((h, i) => (
                      <div key={i} className={`flex gap-3 py-3 text-xs ${i < 2 ? 'border-b border-slate-100' : ''}`}>
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                        <div>
                          <div className="text-slate-900 font-semibold">{h.event} {h.amount ? `— ${h.amount}` : ''}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{h.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MESSAGES SECTION (IMG 5) INSIDE DEAL */}
      {/* ========================================================================= */}
      {activeSubTab === 'messages' && (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs min-h-[550px] animate-in fade-in duration-200">
          {/* Buyer Conversations Sidebar */}
          <div className="border-r border-slate-100 overflow-y-auto flex flex-col bg-white">
            <div className="px-4 py-3.5 border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wide font-semibold">
              Buyer Conversations
            </div>

            {convList.map((conv) => {
              const isSelected = conv.buyerId === selectedBuyerMsgId;
              const lastMsg = conv.threads?.[conv.threads.length - 1];
              return (
                <div
                  key={conv.buyerId}
                  onClick={() => setSelectedBuyerMsgId(conv.buyerId)}
                  className={`px-4 py-3.5 border-b border-slate-100 cursor-pointer flex gap-2.5 transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-r-2 border-r-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {conv.mark || conv.buyerName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-slate-900 flex justify-between items-center">
                      <span className="truncate">{conv.buyerName}</span>
                      {conv.unreadCount > 0 && !isSelected && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-slate-500 font-medium mt-0.5 truncate">
                      {lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : 'No messages yet'}
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-1">{lastMsg?.timestamp || 'Recent'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversation Chat Thread */}
          <div className="flex flex-col bg-[#F8F9FB]">
            {currentConv ? (
              <>
                <div className="px-5 py-3.5 border-b border-slate-200 flex justify-between items-center bg-white z-10 shadow-xs">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900 m-0">{currentConv.buyerName}</h3>
                    <div className="text-[11.5px] text-slate-400 mt-0.5 font-medium">
                      Lead: {currentConv.leadName || 'R. Okafor'} · Advisor: {currentConv.advisorName || 'Linklane LLP'} · Current offer {currentConv.currentOffer || '$100.0M'}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    currentConv.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    currentConv.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {currentConv.status || 'Active'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 max-h-[380px]">
                  {(currentConv.threads || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] ${msg.isMe ? 'self-end' : 'self-start'}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                          msg.isMe
                            ? 'bg-slate-900 text-white rounded-tr-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className={`text-[10.5px] text-slate-400 mt-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                        {msg.sender} · {msg.timestamp}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 px-5 py-3.5 bg-white">
                  <textarea
                    rows="3"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Write a negotiation message to ${currentConv.buyerName}...`}
                    className="w-full font-sans text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 resize-none shadow-2xs"
                  />
                  <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                    <div className="flex gap-1.5 flex-wrap">
                      {['General', 'Financials', 'Legal', 'Operations'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setMsgCategory(cat)}
                          className={`text-[10.5px] px-2 py-0.5 rounded-full cursor-pointer transition-colors border ${
                            msgCategory === cat
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isSendingMsg || !inputMessage.trim()}
                      className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs flex items-center gap-1.5"
                    >
                      <FaPaperPlane className="text-[10px]" />
                      <span>{isSendingMsg ? 'Sending...' : 'Send Message'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select a buyer conversation from the left to view messages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Send Counter-Offer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Propose a revised valuation and closing condition for this deal.
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
                onClick={() => handleSendCounter(selectedBidId)}
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

