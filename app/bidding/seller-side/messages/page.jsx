"use client";

import React from 'react';
import Link from 'next/link';

export default function SellerMessagesPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen flex flex-col">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>
        {/* <Link href="/bidding/seller-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Data room</Link> */}
        <Link href="/bidding/seller-side/buyers" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Buyers</Link>
        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Messages</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] m-7 border border-slate-200 rounded-xl bg-white overflow-hidden flex-1 min-h-[520px] shadow-sm">
        <div className="border-r border-slate-100 overflow-y-auto flex flex-col">
          <div className="px-[18px] py-4 border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wide">Buyer conversations</div>

          <div className="px-[18px] py-3 border-b border-slate-100 cursor-pointer flex gap-2.5 bg-blue-50 border-r-2 border-blue-600">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">HG</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 flex justify-between">Halcyon Growth</div>
              <div className="text-[12px] text-slate-500 font-medium mt-1 whitespace-nowrap overflow-hidden text-ellipsis">You: Escrow holdback period works for us...</div>
              <div className="text-[11px] text-slate-400 mt-1">7 Sep</div>
            </div>
          </div>

          <div className="px-[18px] py-3 border-b border-slate-100 cursor-pointer flex gap-2.5 hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">XC</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 flex justify-between">XYZ Capital <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none self-center">2</span></div>
              <div className="text-[12px] text-slate-500 font-medium mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Asked: Can we get clarity on IP assignment?</div>
              <div className="text-[11px] text-slate-400 mt-1">Yesterday</div>
            </div>
          </div>

          <div className="px-[18px] py-3 border-b border-slate-100 cursor-pointer flex gap-2.5 hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">CB</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 flex justify-between">Cardinal Buyers</div>
              <div className="text-[12px] text-slate-500 font-medium mt-1 whitespace-nowrap overflow-hidden text-ellipsis">We're stepping back from the process for now</div>
              <div className="text-[11px] text-slate-400 mt-1">29 Aug</div>
            </div>
          </div>

          <div className="px-[18px] py-3 border-b border-slate-100 cursor-pointer flex gap-2.5 hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">MP</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 flex justify-between">Meridian Partners</div>
              <div className="text-[12px] text-slate-500 font-medium mt-1 whitespace-nowrap overflow-hidden text-ellipsis">NDA countersigned, requesting VDR access</div>
              <div className="text-[11px] text-slate-400 mt-1">4 Sep</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 m-0">Halcyon Growth</h2>
              <div className="text-[11.5px] text-slate-400 mt-0.5 font-medium">Lead: R. Okafor · Advisor: Linklane LLP · Current offer $100.0M</div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Shortlisted</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#F8F9FB]">
            <div className="max-w-[72%] self-start">
              <div className="px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed bg-white border border-slate-200 text-slate-900 shadow-sm rounded-tl-sm">Thanks for the revised offer. The board reviewed it this morning — we'd like to discuss the stock component a bit further before responding formally.</div>
              <div className="text-[11px] text-slate-400 mt-1">R. Okafor · 2 Sep, 2:15 PM</div>
            </div>
            <div className="max-w-[72%] self-end">
              <div className="px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed bg-slate-900 text-white shadow-sm rounded-tr-sm">Happy to walk through it. We're flexible on the vesting schedule if that helps move things along.</div>
              <div className="text-[11px] text-slate-400 mt-1 text-right">You · 2 Sep, 3:40 PM</div>
            </div>
            <div className="max-w-[72%] self-end">
              <div className="px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed bg-slate-900 text-white shadow-sm rounded-tr-sm">We've sent over a counter at $100.0M — full details are in the term sheet draft. Let us know your thoughts by the 6th.</div>
              <div className="text-[11px] text-slate-400 mt-1 text-right">You · 3 Sep, 9:05 AM</div>
            </div>
            <div className="max-w-[72%] self-start">
              <div className="px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed bg-white border border-slate-200 text-slate-900 shadow-sm rounded-tl-sm">Escrow holdback period works for us — no further changes needed on our side once you confirm the price.</div>
              <div className="text-[11px] text-slate-400 mt-1">R. Okafor · 7 Sep, 11:40 AM</div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-3.5 bg-white">
            <textarea rows="3" placeholder="Write a message to Halcyon Growth..." className="w-full font-sans text-[13px] px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400 resize-none"></textarea>
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1.5">
                <span className="text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-colors bg-slate-900 text-white border border-slate-900">General</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Financials</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Legal</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Operations</span>
              </div>
              <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
