"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SellerBiddingPage() {
  const [selectedBids, setSelectedBids] = useState(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const router = useRouter();

  const bidsData = {
    c: { name: "Halcyon Growth", type: "PE Firm · Melbourne, AU", offer: "$100.0M", cash: "60%", stock: "40%", close: "Dec 2026", status: "Shortlisted", engagement: "18 docs · 92%" },
    b: { name: "XYZ Capital", type: "Strategic Buyer · Singapore", offer: "$95.0M", cash: "70%", stock: "30%", close: "Dec 2026", status: "Under review", engagement: "14 docs · 66%" },
    a: { name: "Cardinal Buyers Inc.", type: "Corporate Buyer · London, UK", offer: "$90.0M", cash: "100%", stock: "0%", close: "Jan 2027", status: "Declined", engagement: "9 docs · 34%" }
  };

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
    router.push(`/dms/deal/bidding/bid/${id}`);
  };

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white items-center">
        <Link href="/dms/deal/bidding" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Bidding</Link>
        <Link href="/dms/deal/bidding/buyers" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Buyers</Link>
        <Link href="/dms/deal/bidding/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="max-w-[1400px] mx-auto">
        <div className="pt-6 px-7">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <div className="text-[27px] text-slate-900 flex items-baseline gap-3 flex-wrap font-serif font-medium">
                Project Alpha
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-sans font-medium px-2.5 py-1 rounded-full tracking-wide bg-amber-50 text-amber-600 border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Bid Evaluation
                </span>
              </div>
              <div className="text-slate-500 text-[13px] mt-1.5">Round opened 12 Aug 2026 &nbsp;·&nbsp; Ask $100M &nbsp;·&nbsp; 3 of 4 invited buyers have bid</div>
            </div>
            <div className="flex gap-2.5 items-start">
              <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors">Export ledger</button>
              <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity">Close bidding round</button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-red-600 mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Bid deadline in <b className="font-mono tabular-nums">2 days 6 hrs</b> — 18:00 IST, 6 Sep 2026 · reminder sent to 1 outstanding buyer
          </div>
        </div>

        <div className="mt-6 mx-7 grid grid-cols-2 md:grid-cols-5 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 tracking-wide mb-2">Bids received</div>
            <div className="text-[22px] font-mono text-slate-900 tabular-nums">3<span className="text-slate-400 font-sans text-[14px]"> / 4 invited</span></div>
            <div className="text-[11.5px] text-slate-400 mt-1">1 outstanding — Meridian Partners</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 tracking-wide mb-2">Highest offer</div>
            <div className="text-[22px] font-mono text-blue-600 tabular-nums">$100.0M</div>
            <div className="text-[11.5px] text-green-600 mt-1">At asking price</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 tracking-wide mb-2">Average offer</div>
            <div className="text-[22px] font-mono text-slate-900 tabular-nums">$95.0M</div>
            <div className="text-[11.5px] text-slate-400 mt-1">Spread $10M</div>
          </div>
          <div className="p-4 md:p-5 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="text-[11px] text-slate-500 tracking-wide mb-2">Median cash component</div>
            <div className="text-[22px] font-mono text-slate-900 tabular-nums">78%</div>
            <div className="text-[11.5px] text-slate-400 mt-1">Across 3 bids</div>
          </div>
          <div className="p-4 md:p-5">
            <div className="text-[11px] text-slate-500 tracking-wide mb-2">VDR engagement</div>
            <div className="text-[22px] font-mono text-slate-900 tabular-nums">41<span className="text-slate-400 font-sans text-[14px]"> views</span></div>
            <div className="text-[11.5px] text-green-600 mt-1">Highest: Halcyon Growth</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6 mx-7 mb-10 items-start">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
              <h2 className="text-[16px] font-serif font-medium m-0">Bid ledger <span className="text-slate-400 font-normal text-[14px] ml-1.5">3 offers</span></h2>
              <span className="text-[12px] text-slate-400">Updated live as buyers submit</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 md:p-4 border-b border-slate-100 flex-wrap">
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <button className="font-sans text-[12.5px] px-3 py-1.5 bg-slate-900 text-white border-r border-slate-200 cursor-pointer">All (3)</button>
                <button className="font-sans text-[12.5px] px-3 py-1.5 bg-white text-slate-500 border-r border-slate-200 cursor-pointer hover:bg-slate-50">Shortlisted (1)</button>
                <button className="font-sans text-[12.5px] px-3 py-1.5 bg-white text-slate-500 border-r border-slate-200 cursor-pointer hover:bg-slate-50">Under review (1)</button>
                <button className="font-sans text-[12.5px] px-3 py-1.5 bg-white text-slate-500 cursor-pointer hover:bg-slate-50">Declined (1)</button>
              </div>
              <div className="text-[12px] text-slate-400 flex items-center gap-1.5">Sort by
                <select className="font-sans text-[12.5px] text-slate-900 border border-slate-200 rounded-lg px-2 py-1 bg-white ml-1 outline-none focus:border-slate-400">
                  <option>Offer amount — high to low</option>
                  <option>Submitted — most recent</option>
                  <option>Engagement — most active</option>
                </select>
              </div>
            </div>

            <div className={`items-center justify-between p-3 mx-4 mt-4 bg-slate-900 text-white text-[12.5px] rounded-lg ${selectedBids.size >= 2 ? 'flex' : 'hidden'}`}>
              <span><span className="font-mono">{selectedBids.size}</span> bids selected for side-by-side comparison</span>
              <button className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-md cursor-pointer border border-white text-white hover:bg-white hover:text-slate-900 transition-colors" onClick={() => setShowCompare(true)}>Compare selected →</button>
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
                  <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" data-id="c" onClick={() => handleRowClick('c')}>
                    <td className="px-4 py-3.5 align-middle"><input type="checkbox" className="w-[15px] h-[15px] accent-slate-900" checked={selectedBids.has('c')} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleCompare(e, 'c')} /></td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono font-medium shrink-0">HG</div>
                        <div>
                          <div className="font-medium text-slate-900 text-[13.5px]">Halcyon Growth</div>
                          <div className="text-[11.5px] text-slate-400">PE Firm · NDA signed 14 Aug</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="text-[15px] text-blue-600 font-mono">$100.0M</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Close: Dec 2026</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex w-[90px] h-1.5 rounded-full overflow-hidden mb-1">
                        <div className="bg-slate-800 w-[60%]"></div><div className="bg-slate-300 w-[40%]"></div>
                      </div>
                      <div className="text-[11px] text-slate-400">60% cash / 40% stock</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-[56px] h-[5px] bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[92%]"></div></div>
                        <span className="text-[11px] text-slate-500">18 docs</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">Shortlisted</span></td>
                    <td className="px-4 py-3.5 align-middle text-slate-500 font-mono text-[13px] tabular-nums">2 Sep</td>
                  </tr>

                  <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" data-id="b" onClick={() => handleRowClick('b')}>
                    <td className="px-4 py-3.5 align-middle"><input type="checkbox" className="w-[15px] h-[15px] accent-slate-900" checked={selectedBids.has('b')} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleCompare(e, 'b')} /></td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono font-medium shrink-0">XC</div>
                        <div>
                          <div className="font-medium text-slate-900 text-[13.5px]">XYZ Capital</div>
                          <div className="text-[11.5px] text-slate-400">Strategic Buyer · NDA signed 11 Aug</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="text-[15px] text-slate-900 font-mono">$95.0M</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Close: Dec 2026</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex w-[90px] h-1.5 rounded-full overflow-hidden mb-1">
                        <div className="bg-slate-800 w-[70%]"></div><div className="bg-slate-300 w-[30%]"></div>
                      </div>
                      <div className="text-[11px] text-slate-400">70% cash / 30% stock</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-[56px] h-[5px] bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[66%]"></div></div>
                        <span className="text-[11px] text-slate-500">14 docs</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">Under review</span></td>
                    <td className="px-4 py-3.5 align-middle text-slate-500 font-mono text-[13px] tabular-nums">1 Sep</td>
                  </tr>

                  <tr className="hover:bg-slate-50 cursor-pointer transition-colors" data-id="a" onClick={() => handleRowClick('a')}>
                    <td className="px-4 py-3.5 align-middle"><input type="checkbox" className="w-[15px] h-[15px] accent-slate-900" checked={selectedBids.has('a')} onClick={(e) => e.stopPropagation()} onChange={(e) => toggleCompare(e, 'a')} /></td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-mono font-medium shrink-0">CB</div>
                        <div>
                          <div className="font-medium text-slate-900 text-[13.5px]">Cardinal Buyers Inc.</div>
                          <div className="text-[11.5px] text-slate-400">Corporate Buyer · NDA signed 13 Aug</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="text-[15px] text-slate-900 font-mono">$90.0M</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Close: Jan 2027</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex w-[90px] h-1.5 rounded-full overflow-hidden mb-1">
                        <div className="bg-slate-800 w-[100%]"></div><div className="bg-slate-300 w-[0%]"></div>
                      </div>
                      <div className="text-[11px] text-slate-400">100% cash</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-[56px] h-[5px] bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[34%]"></div></div>
                        <span className="text-[11px] text-slate-500">9 docs</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700">Declined</span></td>
                    <td className="px-4 py-3.5 align-middle text-slate-500 font-mono text-[13px] tabular-nums">29 Aug</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showCompare && (
          <div className="fixed inset-0 bg-[#0f172a]/50 flex items-start justify-center pt-12 px-5 z-50 overflow-auto backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false); }}>
            <div className="bg-white rounded-xl max-w-[980px] w-full border border-slate-200 shadow-xl overflow-hidden mb-12">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-[18px] font-serif font-medium m-0 text-slate-900">Compare bids</h2>
                <button className="cursor-pointer text-slate-400 hover:text-slate-900 text-[24px] leading-none border-none bg-transparent transition-colors" onClick={() => setShowCompare(false)}>×</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Buyer</th>
                      {Array.from(selectedBids).map(id => <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900 font-medium">{bidsData[id].name}</td>)}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Offer</th>
                      {Array.from(selectedBids).map((id, index) => <td key={id} className={`p-4 border-b border-slate-100 text-[13px] font-mono ${index === 0 ? 'text-blue-600 font-semibold' : 'text-slate-900'}`}>{bidsData[id].offer}</td>)}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Cash / Stock</th>
                      {Array.from(selectedBids).map(id => <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].cash} / {bidsData[id].stock}</td>)}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Expected close</th>
                      {Array.from(selectedBids).map(id => <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].close}</td>)}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">Status</th>
                      {Array.from(selectedBids).map(id => <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].status}</td>)}
                    </tr>
                    <tr>
                      <th className="p-4 border-b border-slate-100 text-slate-500 font-medium text-[11.5px] w-[150px] bg-[#F8F9FB]">VDR engagement</th>
                      {Array.from(selectedBids).map(id => <td key={id} className="p-4 border-b border-slate-100 text-[13px] text-slate-900">{bidsData[id].engagement}</td>)}
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
