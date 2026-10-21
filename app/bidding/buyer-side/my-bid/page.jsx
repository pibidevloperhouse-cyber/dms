"use client";

import React from 'react';
import Link from 'next/link';

export default function MyBidPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/buyer-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Overview</Link>
        {/* <Link href="/bidding/buyer-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Data room</Link> */}
        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="max-w-[1280px] mx-auto pb-8">
        <div className="pt-6.5 px-7">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <div className="text-[11.5px] text-slate-500 font-semibold tracking-wide mb-1.5 uppercase">ABC Technologies &nbsp;·&nbsp; SaaS &nbsp;·&nbsp; ARR $25M</div>
              <div className="text-[26px] text-slate-900 flex items-baseline gap-3 flex-wrap">
                <span className="font-bold tracking-tight text-slate-900">Project Alpha</span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> NDA signed · VDR access active
                </span>
              </div>
              <div className="text-[13px] text-slate-500 font-medium mt-1.5">Invited 12 Aug 2026 &nbsp;·&nbsp; Asking price $100M &nbsp;·&nbsp; Seller: ABC Technologies board</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-rose-600 font-medium mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Bid deadline in <b className="font-bold">2 days 6 hrs</b> — 18:00 IST, 6 Sep 2026
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mt-6 px-7 items-start">
          <div className="flex flex-col gap-5">
            <div className="px-5 py-4 bg-amber-50 border border-amber-200/80 rounded-xl flex justify-between items-center gap-4 flex-wrap">
              <div className="text-[13px] text-amber-800 font-medium">The seller has sent a <b>counter-offer</b> on your $95.0M bid — they're asking for <b className="font-bold text-amber-900">$100.0M</b>. Review and respond below.</div>
              <div className="flex gap-2 shrink-0">
                <button className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 transition-colors">View seller's note</button>
                <button className="text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity shadow-xs">Match counter</button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-[16px] font-bold text-slate-900 m-0">Revise your bid</h2>
                <span className="text-[12px] text-slate-400 font-medium">Editable until deadline · last saved 2 min ago</span>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Offer amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                      <input type="number" defaultValue="95000000" className="w-full pl-7 pr-3 py-2.5 font-bold text-[16px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Expected close date</label>
                    <input type="date" defaultValue="2026-12-15" className="w-full px-3 py-2.5 font-medium text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-slate-600">Deal structure — cash vs. stock</label>
                    <div className="flex items-center gap-3 mt-1.5">
                      <input type="range" min="0" max="100" defaultValue="70" className="flex-1 accent-slate-900" />
                    </div>
                    <div className="flex justify-between text-[11.5px] text-slate-500 font-medium mt-1.5">
                      <span>Cash <b className="text-slate-900 font-bold">70%</b></span>
                      <span>Stock <b className="text-slate-900 font-bold">30%</b></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Financing type</label>
                    <select defaultValue="Committed debt + equity" className="w-full px-3 py-2.5 font-sans text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors">
                      <option>Committed debt + equity</option>
                      <option>All-equity</option>
                      <option>Subject to financing</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Contingencies <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input type="text" placeholder="e.g. Regulatory approval, key employee retention" className="w-full px-3 py-2.5 font-sans text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4.5 mb-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Note to seller <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea rows="3" placeholder="Add context on your offer, timeline, or terms..." className="w-full px-3 py-2.5 font-sans text-[14px] text-slate-900 border border-slate-200 rounded-lg bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors resize-y"></textarea>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-slate-500">Supporting documents</label>
                    <div className="border-[1.5px] border-dashed border-slate-200 rounded-lg p-4.5 text-center text-slate-500 text-[12.5px] bg-[#FAFAFA] cursor-pointer hover:bg-slate-50 transition-colors">
                      <b className="text-slate-900 font-medium">Drop files</b> or click to upload — LOI, proof of financing, term sheet draft
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-[12.5px] mt-2 bg-white">
                      <span className="text-slate-900">Letter of Intent — Halcyon.pdf</span>
                      <span className="text-red-500 cursor-pointer text-[11px] hover:underline">Remove</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg text-[12.5px] mt-2 bg-white">
                      <span className="text-slate-900">Financing confirmation.pdf</span>
                      <span className="text-red-500 cursor-pointer text-[11px] hover:underline">Remove</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-white flex-wrap gap-4">
                <span className="text-[11.5px] text-slate-400">Submitting notifies the seller immediately and is logged to the deal audit trail.</span>
                <div className="flex gap-2.5">
                  <button className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-[#F8F9FB] hover:text-slate-900 transition-colors bg-transparent">Save draft</button>
                  <button className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity">Submit revised bid</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs sticky top-6">
            <div className="p-5 border-b border-slate-100">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Counter-offer received
              </span>
              <div className="text-[28px] font-bold mt-3 text-slate-900 tracking-tight">$95.0M</div>
              <div className="text-[12px] text-slate-500 font-medium mt-1">Your current offer · 70% cash / 30% stock</div>
            </div>

            <div className="p-5 border-b border-slate-100">
              <h3 className="text-[11.5px] font-bold text-slate-500 tracking-wider mb-3 uppercase">Deal snapshot</h3>
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-slate-600 font-medium">Asking price</span>
                <span className="text-slate-900 font-semibold">$100.0M</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-slate-600 font-medium">Your offer</span>
                <span className="text-blue-600 font-bold">$95.0M</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-slate-600 font-medium">Seller's counter</span>
                <span className="text-amber-700 font-bold">$100.0M</span>
              </div>
              <div className="flex justify-between py-1.5 text-[13px]">
                <span className="text-slate-600 font-medium">Expected close</span>
                <span className="text-slate-900 font-semibold">Dec 2026</span>
              </div>
            </div>

            <div className="p-5 border-b border-slate-100">
              <h3 className="text-[11.5px] font-semibold text-slate-500 tracking-wide mb-3 uppercase">Bid timeline</h3>

              <div className="flex gap-2.5 py-2 text-[12.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-slate-900">NDA signed, VDR access granted</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">14 Aug, 10:20 AM</div>
                </div>
              </div>

              <div className="flex gap-2.5 py-2 text-[12.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-slate-900">Initial bid submitted — $95.0M</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">1 Sep, 3:40 PM</div>
                </div>
              </div>

              <div className="flex gap-2.5 py-2 text-[12.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-slate-900">Seller countered at $100.0M</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">3 Sep, 9:05 AM</div>
                </div>
              </div>

              <div className="flex gap-2.5 py-2 text-[12.5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-slate-900">Awaiting your response</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Due before 6 Sep, 6:00 PM</div>
                </div>
              </div>
            </div>

            <div className="p-4.5 flex flex-col gap-2">
              <button className="w-full text-center font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-green-600 bg-green-600 text-white hover:opacity-90 transition-opacity">Match counter — $100.0M</button>
              <button className="w-full text-center font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-[#F8F9FB] hover:text-slate-900 transition-colors bg-transparent">Send a different revised offer</button>
              <button className="w-full text-center font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-[#F8F9FB] hover:text-slate-900 transition-colors bg-transparent">Message the seller</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
