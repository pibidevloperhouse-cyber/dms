"use client";

import React from 'react';
import Link from 'next/link';

export default function MessagesPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen flex flex-col antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/buyer-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Overview</Link>
        {/* <Link href="/bidding/buyer-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Data room</Link> */}
        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] m-7 border border-slate-200 rounded-xl bg-white overflow-hidden flex-1 min-h-[520px] shadow-sm">
        <div className="border-r border-slate-100 overflow-y-auto flex flex-col">
          <div className="px-4.5 py-4 border-b border-slate-100 text-[11px] text-slate-400 font-medium uppercase tracking-wider">Conversation with seller</div>
          
          <div className="px-4.5 py-3 border-b border-slate-100 cursor-pointer bg-blue-50 border-l-[3px] border-l-blue-600">
            <div className="text-[13px] font-medium text-slate-900">General</div>
            <div className="text-[12px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">V. Sharma: Escrow holdback period works for us...</div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between"><span>7 Sep</span></div>
          </div>
          
          <div className="px-4.5 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 border-l-[3px] border-l-transparent transition-colors">
            <div className="text-[13px] font-medium text-slate-900">Financials Q&amp;A <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block ml-1.5"></span></div>
            <div className="text-[12px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Seller: Customer contracts are auto-renewing, 92%...</div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between"><span>2 hrs ago</span></div>
          </div>
          
          <div className="px-4.5 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 border-l-[3px] border-l-transparent transition-colors">
            <div className="text-[13px] font-medium text-slate-900">Legal DD Q&amp;A</div>
            <div className="text-[12px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">You: Can we get clarity on the IP assignment clause?</div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between"><span>Yesterday</span></div>
          </div>
          
          <div className="px-4.5 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 border-l-[3px] border-l-transparent transition-colors">
            <div className="text-[13px] font-medium text-slate-900">Operations Q&amp;A</div>
            <div className="text-[12px] text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Seller: Uploaded the vendor contract summary</div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between"><span>3 days ago</span></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 m-0">General — ABC Technologies</h2>
              <div className="text-[11.5px] text-slate-500 mt-1 font-medium">Seller team: V. Sharma (Finance), Linklane LLP (Counsel)</div>
            </div>
            <span className="text-[11.5px] text-slate-400 font-medium">All messages logged to audit trail</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#FAFAFA]">
            <div className="max-w-[72%] self-start">
              <div className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed bg-white border border-slate-200 text-slate-900 shadow-sm">
                Thanks for the revised offer. The board reviewed it this morning — we'd like to discuss the stock component a bit further before responding formally.
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">V. Sharma · 2 Sep, 2:15 PM</div>
            </div>
            
            <div className="max-w-[72%] self-end">
              <div className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed bg-slate-900 text-white shadow-sm">
                Happy to walk through it. We're flexible on the vesting schedule if that helps move things along.
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 text-right">You · 2 Sep, 3:40 PM</div>
            </div>
            
            <div className="max-w-[72%] self-start">
              <div className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed bg-white border border-slate-200 text-slate-900 shadow-sm">
                We've sent over a counter at $100.0M — full details are in the term sheet draft. Let us know your thoughts by the 6th.
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">V. Sharma · 3 Sep, 9:05 AM</div>
            </div>
            
            <div className="max-w-[72%] self-start">
              <div className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed bg-white border border-slate-200 text-slate-900 shadow-sm">
                Escrow holdback period works for us — no further changes needed on our side once you confirm the price.
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">V. Sharma · 7 Sep, 11:40 AM</div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-4 bg-white z-10">
            <textarea rows="3" placeholder="Write a message to the seller..." className="w-full font-sans text-[13px] px-3 py-2.5 border border-slate-200 rounded-lg resize-none bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors"></textarea>
            <div className="flex justify-between items-center mt-2.5">
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[11px] px-2.5 py-1 rounded-full cursor-pointer bg-slate-900 text-white border border-slate-900 font-medium">General</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Financials</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Legal</span>
                <span className="text-[11px] text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-slate-50 transition-colors">Operations</span>
              </div>
              <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-sm">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
