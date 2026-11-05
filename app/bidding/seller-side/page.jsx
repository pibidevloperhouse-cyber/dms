"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SellerBiddingPage() {
  const [selectedBids, setSelectedBids] = useState(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'Shortlisted' | 'Under review' | 'Declined'
  const [sortBy, setSortBy] = useState('amount_high');
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [bidsData, setBidsData] = useState({});
  const router = useRouter();

  const fetchBids = async () => {
    try {
      const res = await fetch('/api/bidding/bids?role=super_admin');
      if (res.ok) {
        const data = await res.json();
        if (data.bids) setBidsData(data.bids);
        if (data.kpis) setKpis(data.kpis);
        if (data.round) setRound(data.round);
      }
    } catch (e) {
      console.error('Error fetching bids:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const toggleCompare = (e, id) => {
    e.stopPropagation();
    const newSelected = new Set(selectedBids);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBids(newSelected);
  };

  const handleRowClick = (id) => {
    router.push(`/bidding/seller-side/bid/${id}`);
  };

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
        fetchBids();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    link.setAttribute('download', `Project_Alpha_Bid_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allBidsList = Array.from(new Map(Object.values(bidsData || {}).filter(b => b && b.id).map(b => [b.id, b])).values());

  // Filter bids by tab
  const filteredBids = allBidsList.filter(b => {
    if (filterTab === 'ALL') return true;
    return (b.status || '').toLowerCase() === filterTab.toLowerCase();
  });

  // Sort bids
  const sortedBids = [...filteredBids].sort((a, b) => {
    if (sortBy === 'amount_high') return (b.offerAmount || 0) - (a.offerAmount || 0);
    if (sortBy === 'engagement') return (b.views || 0) - (a.views || 0);
    return 0;
  });

  const shortlistedCount = allBidsList.filter(b => b.status === 'Shortlisted').length;
  const underReviewCount = allBidsList.filter(b => b.status === 'Under review').length;
  const declinedCount = allBidsList.filter(b => b.status === 'Declined').length;

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      {/* Top Bidding Navigation Tabs */}
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Bidding</Link>

        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <div className="pt-6 px-7">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <div className="text-[26px] text-slate-900 flex items-baseline gap-3 flex-wrap font-bold tracking-tight">
                {round?.dealName || 'Project Alpha'}
                <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full tracking-wide border ${round?.status === 'closed'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${round?.status === 'closed' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
                  {round?.status === 'closed' ? 'Round Closed' : (round?.statusLabel || 'Bid Evaluation')}
                </span>
              </div>
              <div className="text-slate-500 text-[13px] font-medium mt-1.5">
                Round opened {round?.openedDate || '12 Aug 2026'} &nbsp;·&nbsp; Ask {round?.askingPriceFormatted || '$100M'} &nbsp;·&nbsp; {kpis?.receivedCount || allBidsList.length} of {round?.invitedCount || 4} invited buyers have bid
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <button
                onClick={handleExportLedger}
                className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              >
                Export ledger
              </button>
              {round?.status !== 'closed' && (
                <button
                  onClick={handleCloseRound}
                  className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-2xs"
                >
                  Close bidding round
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-rose-600 font-medium mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Bid deadline in <b className="font-bold">2 days 6 hrs</b> — {round?.deadlineDisplay || '18:00 IST, 6 Sep 2026'} · reminder sent to 1 outstanding buyer
          </div>
        </div>

        {/* 5-Column KPI Cards */}
        <div className="mt-6 mx-7 grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2 uppercase">Bids received</div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{kpis?.receivedCount || allBidsList.length}<span className="text-slate-400 font-normal text-[14px]"> / {round?.invitedCount || 4} invited</span></div>
            <div className="text-[11.5px] text-slate-400 mt-1">1 outstanding — Meridian Partners</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2 uppercase">Highest offer</div>
            <div className="text-[24px] font-bold text-blue-600 tracking-tight">{kpis?.highestOfferFormatted || '$100.0M'}</div>
            <div className="text-[11.5px] text-emerald-600 font-medium mt-1">At asking price</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2 uppercase">Average offer</div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{kpis?.averageOfferFormatted || '$95.0M'}</div>
            <div className="text-[11.5px] text-slate-400 mt-1">Spread $10M</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2 uppercase">Median cash component</div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{kpis?.medianCashFormatted || '78%'}</div>
            <div className="text-[11.5px] text-slate-400 mt-1">Across {allBidsList.length} bids</div>
          </div>
          <div className="p-4 md:p-5">
            <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2 uppercase">VDR engagement</div>
            <div className="text-[24px] font-bold text-slate-900 tracking-tight">{kpis?.totalViews || 41}<span className="text-slate-400 font-normal text-[14px]"> views</span></div>
            <div className="text-[11.5px] text-emerald-600 font-medium mt-1">Highest: {kpis?.highestEngagedBuyer || 'Halcyon Growth'}</div>
          </div>
        </div>

        {/* Bid Ledger Table Container */}
        <div className="grid grid-cols-1 gap-6 mt-6 mx-7 mb-10 items-start">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
              <h2 className="text-[16px] font-bold text-slate-900 m-0">Bid ledger <span className="text-slate-400 font-normal text-[14px] ml-1.5">{allBidsList.length} offers</span></h2>
              <span className="text-[12px] text-slate-400">Updated live as buyers submit</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 md:p-4 border-b border-slate-100 flex-wrap">
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`font-sans text-[12.5px] px-3 py-1.5 cursor-pointer transition-colors ${filterTab === 'ALL' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  All ({allBidsList.length})
                </button>
                <button
                  onClick={() => setFilterTab('Shortlisted')}
                  className={`font-sans text-[12.5px] px-3 py-1.5 border-l border-slate-200 cursor-pointer transition-colors ${filterTab === 'Shortlisted' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Shortlisted ({shortlistedCount})
                </button>
                <button
                  onClick={() => setFilterTab('Under review')}
                  className={`font-sans text-[12.5px] px-3 py-1.5 border-l border-slate-200 cursor-pointer transition-colors ${filterTab === 'Under review' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Under review ({underReviewCount})
                </button>
                <button
                  onClick={() => setFilterTab('Declined')}
                  className={`font-sans text-[12.5px] px-3 py-1.5 border-l border-slate-200 cursor-pointer transition-colors ${filterTab === 'Declined' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Declined ({declinedCount})
                </button>
              </div>

              <div className="text-[12px] text-slate-400 flex items-center gap-1.5">
                Sort by
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="font-sans text-[12.5px] text-slate-900 border border-slate-200 rounded-lg px-2 py-1 bg-white ml-1 outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="amount_high">Offer amount — high to low</option>
                  <option value="engagement">Engagement — most active</option>
                </select>
              </div>
            </div>

            {/* Compare Bar if >= 2 selected */}
            <div className={`items-center justify-between p-3 mx-4 mt-4 bg-slate-900 text-white text-[12.5px] rounded-lg ${selectedBids.size >= 2 ? 'flex' : 'hidden'}`}>
              <span><span className="font-bold">{selectedBids.size}</span> bids selected for side-by-side comparison</span>
              <button
                className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-md cursor-pointer border border-white text-white hover:bg-white hover:text-slate-900 transition-colors"
                onClick={() => setShowCompare(true)}
              >
                Compare selected →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse mt-2">
                <thead>
                  <tr className="bg-[#F8F9FB] border-b border-slate-200">
                    <th className="w-[34px] px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide"></th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Buyer</th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Offer</th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Structure</th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Engagement</th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-[11px] text-slate-500 tracking-wide">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBids.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400 text-xs">
                        No bids match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    sortedBids.map((b) => {
                      const isSelected = selectedBids.has(b.id);
                      const cashVal = parseInt(String(b.cash).replace('%', ''), 10) || 70;
                      const stockVal = 100 - cashVal;

                      let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (b.status === 'Shortlisted') statusBadge = 'bg-green-50 text-green-700 border-green-200';
                      if (b.status === 'Under review') statusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                      if (b.status === 'Declined') statusBadge = 'bg-red-50 text-red-700 border-red-200';
                      if (b.status === 'Accepted') statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                      if (b.status === 'Countered') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';

                      return (
                        <tr
                          key={b.id}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleRowClick(b.id)}
                        >
                          <td className="px-4 py-3.5 align-middle">
                            <input
                              type="checkbox"
                              className="w-[15px] h-[15px] accent-slate-900 cursor-pointer"
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => toggleCompare(e, b.id)}
                            />
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[30px] h-[30px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                                {b.mark || b.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-[13.5px]">{b.name}</div>
                                <div className="text-[11.5px] text-slate-400">{b.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="text-[15px] font-bold text-blue-600">{b.offer}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Close: {b.close}</div>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex w-[90px] h-1.5 rounded-full overflow-hidden mb-1">
                              <div className="bg-slate-800" style={{ width: `${cashVal}%` }}></div>
                              <div className="bg-slate-300" style={{ width: `${stockVal}%` }}></div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{cashVal}% cash / {stockVal}% stock</div>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="w-[56px] h-[5px] bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (b.views || 10) * 5)}%` }}></div>
                              </div>
                              <span className="text-[11px] text-slate-600 font-medium">{b.views || 14} docs</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-slate-500 font-medium text-[13px]">
                            {b.submittedAt || 'Aug 2026'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Modal */}
        {showCompare && (
          <div
            className="fixed inset-0 bg-[#0f172a]/50 flex items-start justify-center pt-12 px-5 z-50 overflow-auto backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false); }}
          >
            <div className="bg-white rounded-xl max-w-[980px] w-full border border-slate-200 shadow-xl overflow-hidden mb-12 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-[18px] font-bold text-slate-900 m-0">Compare bids ({selectedBids.size} selected)</h2>
                <button
                  className="cursor-pointer text-slate-400 hover:text-slate-900 text-[24px] leading-none border-none bg-transparent transition-colors"
                  onClick={() => setShowCompare(false)}
                >
                  ×
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-semibold text-[11.5px] w-[150px] bg-[#F8F9FB] uppercase tracking-wider">Buyer</th>
                      {Array.from(selectedBids).map(id => bidsData[id] && (
                        <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900 font-semibold">{bidsData[id].name}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-semibold text-[11.5px] w-[150px] bg-[#F8F9FB] uppercase tracking-wider">Offer</th>
                      {Array.from(selectedBids).map((id, index) => bidsData[id] && (
                        <td key={id} className={`p-4 border-b border-slate-100 text-[13px] font-bold ${index === 0 ? 'text-blue-600' : 'text-slate-900'}`}>{bidsData[id].offer}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Cash / Stock</th>
                      {Array.from(selectedBids).map(id => bidsData[id] && (
                        <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].cash} / {bidsData[id].stock}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Expected close</th>
                      {Array.from(selectedBids).map(id => bidsData[id] && (
                        <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].close}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Status</th>
                      {Array.from(selectedBids).map(id => bidsData[id] && (
                        <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].status}</td>
                      ))}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">VDR engagement</th>
                      {Array.from(selectedBids).map(id => bidsData[id] && (
                        <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].engagement}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
