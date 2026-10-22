"use client";

import React from 'react';
import Link from 'next/link';

export default function TermSheetPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/buyer-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Overview</Link>
        {/* <Link href="/bidding/buyer-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Data room</Link> */}
        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Term sheet</Link>
      </div>

      <div className="max-w-[1280px] mx-auto pb-8">
        <div className="mt-5 mx-7 px-4.5 py-3 bg-green-50 border border-green-200/60 rounded-xl text-[12.5px] text-green-700 flex justify-between items-center shadow-sm">
          <span>Your bid of $100.0M was accepted on 6 Sep 2026 — this term sheet reflects the agreed terms.</span>
          <span className="font-medium">Stage 5 of 6</span>
        </div>

        <div className="pt-5.5 px-7 flex justify-between items-start flex-wrap gap-3.5">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 m-0 tracking-tight">Term sheet — Project Alpha</h1>
            <div className="text-[13px] text-slate-500 font-medium mt-1.5">Draft v2 · last updated by seller counsel, 7 Sep 2026</div>
          </div>
          <div className="flex gap-2.5">
            <a href="#" className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs">Download PDF</a>
            <a href="#" className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs">Send for signature</a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5.5 mt-5.5 mx-7 pb-10 items-start">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden lg:row-span-2">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAFAFA]">
              <h2 className="text-[15px] font-bold text-slate-900 m-0">Key terms</h2>
              <span className="text-[12px] text-slate-400">Redlines highlighted</span>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Purchase price</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    $100,000,000 <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-1 text-[11px] font-medium border border-amber-200/50">changed</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Structure</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">60% cash at close / 40% acquirer stock, 12-month vest</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Expected close</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">15 December 2026</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Exclusivity period</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">
                    45 days from execution <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-1 text-[11px] font-medium border border-amber-200/50">changed</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Key employee retention</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">90% of leadership team, 24-month terms</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Escrow</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">10% of purchase price, 18-month holdback</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-500 w-[200px]">Regulatory conditions</td>
                  <td className="py-3.5 px-5 border-b border-slate-100 text-[13px] align-top text-slate-900">Subject to standard antitrust clearance</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 text-[13px] align-top text-slate-500 w-[200px]">Governing law</td>
                  <td className="py-3.5 px-5 text-[13px] align-top text-slate-900">Delaware, USA</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-[#FAFAFA]">
              <h2 className="text-[15px] font-bold text-slate-900 m-0">Counsel comments</h2>
            </div>
            <div className="p-5">
              <div className="flex gap-2.5 py-2.5 border-b border-slate-100 text-[12.5px] first:pt-0">
                <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 border border-blue-200">LC</div>
                <div>
                  <b className="text-slate-900 font-semibold">Linklane LLP (seller counsel)</b>
                  <div className="text-slate-600 font-medium mt-0.5 leading-relaxed">Updated exclusivity to 45 days per buyer request on the 6 Sep call.</div>
                  <div className="text-slate-400 text-[11px] mt-1">7 Sep, 10:12 AM</div>
                </div>
              </div>
              <div className="flex gap-2.5 py-2.5 text-[12.5px] pt-4 pb-0">
                <div className="w-6.5 h-6.5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 border border-amber-200">RO</div>
                <div>
                  <b className="text-slate-900 font-semibold">You</b>
                  <div className="text-slate-600 font-medium mt-0.5 leading-relaxed">Escrow holdback period works for us — no further changes on our side.</div>
                  <div className="text-slate-400 text-[11px] mt-1">7 Sep, 11:40 AM</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide uppercase mb-3">Signature status</h3>
              <div className="flex justify-between py-2 text-[12.5px] text-slate-700">
                <span>ABC Technologies (seller)</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Signed</span>
              </div>
              <div className="flex justify-between py-2 text-[12.5px] text-slate-700">
                <span>Halcyon Growth (you)</span>
                <span className="flex items-center gap-1.5 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pending</span>
              </div>
            </div>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide uppercase mb-3">Next steps</h3>
              <div className="text-[12.5px] text-slate-600 leading-relaxed">Confirmatory due diligence and definitive agreement drafting begin once this term sheet is fully executed.</div>
            </div>
            <div className="p-5 flex flex-col gap-2">
              <a href="#" className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity text-center w-full shadow-sm">Sign term sheet</a>
              <a href="#" className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-center w-full shadow-sm">Request a change</a>
              <a href="#" className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-center w-full shadow-sm">Message seller counsel</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
