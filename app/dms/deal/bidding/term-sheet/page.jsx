"use client";

import React from 'react';
import Link from 'next/link';

export default function SellerTermSheetPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white items-center">
        <Link href="/dms/deal/bidding" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>
        <Link href="/dms/deal/bidding/buyers" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Buyers</Link>
        <Link href="/dms/deal/bidding/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Term sheet</Link>
      </div>

      <div className="mx-7 mt-5 px-4 py-3 bg-green-50 border border-[#C7DFCB] rounded-xl text-[12.5px] text-green-700 flex justify-between items-center">
        <span>Bid from Halcyon Growth ($100.0M) accepted on 6 Sep 2026 — draft this term sheet and send for buyer signature.</span>
        <span>Stage 5 of 6</span>
      </div>

      <div className="pt-5 px-7 flex justify-between items-start flex-wrap gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900 m-0">Term sheet — Halcyon Growth</h1>
          <div className="text-[13px] text-slate-500 mt-1">Draft v2 · editable until sent for signature</div>
        </div>
        <div className="flex gap-2.5">
          <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-500 bg-white hover:text-slate-900 hover:border-slate-900 transition-colors">Save draft</button>
          <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity">Send to buyer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[22px] mx-7 mt-[22px] mb-10 items-start">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden row-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-[15px] font-bold text-slate-900 m-0">Key terms</h2>
            <span className="text-[12px] text-slate-400">Editable draft</span>
          </div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Purchase price</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="$100,000,000" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Structure</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="60% cash at close / 40% acquirer stock, 12-month vest" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Expected close</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="15 December 2026" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Exclusivity period</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="45 days from execution" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Key employee retention</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="90% of leadership team, 24-month terms" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Escrow</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="10% of purchase price, 18-month holdback" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 border-b border-slate-100 align-top text-[13px]">Regulatory conditions</td>
                <td className="px-5 py-3 border-b border-slate-100 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="Subject to standard antitrust clearance" /></td>
              </tr>
              <tr>
                <td className="w-[190px] text-slate-500 px-5 py-3 align-top text-[13px]">Governing law</td>
                <td className="px-5 py-3 align-top"><input type="text" className="w-full font-medium text-[13px] text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-[#F8F9FB] outline-none focus:border-slate-900 focus:bg-white transition-colors" defaultValue="Delaware, USA" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-[15px] font-bold text-slate-900 m-0">Counsel comments</h2></div>
          <div className="p-5 flex flex-col">
            <div className="flex gap-2.5 py-2.5 border-b border-slate-100 text-[12.5px]">
              <div className="w-[26px] h-[26px] rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">LC</div>
              <div>
                <b className="text-slate-900">Linklane LLP (your counsel)</b>
                <div className="text-slate-500 mt-0.5">Updated exclusivity to 45 days per buyer request on the 6 Sep call.</div>
                <div className="text-slate-400 text-[11px] mt-0.5">7 Sep, 10:12 AM</div>
              </div>
            </div>
            <div className="flex gap-2.5 py-2.5 text-[12.5px]">
              <div className="w-[26px] h-[26px] rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">RO</div>
              <div>
                <b className="text-slate-900">Halcyon Growth</b>
                <div className="text-slate-500 mt-0.5">Escrow holdback period works for us — no further changes on our side.</div>
                <div className="text-slate-400 text-[11px] mt-0.5">7 Sep, 11:40 AM</div>
              </div>
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-slate-100 bg-[#F8F9FB]">
            <textarea rows="2" placeholder="Add an internal or buyer-facing comment..." className="w-full font-sans text-[12.5px] px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400 resize-none"></textarea>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden col-[1] lg:col-[2]">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide uppercase mb-3">Signature status</h3>
            <div className="flex justify-between items-center py-2 text-[12.5px]">
              <span className="text-slate-900">ABC Technologies (you)</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full bg-green-600"></span>Signed</span>
            </div>
            <div className="flex justify-between items-center py-2 text-[12.5px]">
              <span className="text-slate-900">Halcyon Growth</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Pending</span>
            </div>
          </div>
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide uppercase mb-3">Next steps</h3>
            <div className="text-[12.5px] text-slate-500">Confirmatory due diligence and definitive agreement drafting begin once the buyer countersigns.</div>
          </div>
          <div className="p-5 flex flex-col gap-2">
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-slate-900 text-white bg-slate-900 hover:opacity-90 transition-opacity w-full cursor-pointer">Send for buyer signature</button>
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 bg-white hover:text-slate-900 hover:border-slate-900 transition-colors w-full cursor-pointer">Attach redlined document</button>
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 bg-white hover:text-slate-900 hover:border-slate-900 transition-colors w-full cursor-pointer">Message Halcyon Growth</button>
          </div>
        </div>
      </div>
    </div>
  );
}
