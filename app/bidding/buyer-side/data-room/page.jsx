"use client";

import React from 'react';
import Link from 'next/link';

export default function DataRoomPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen flex flex-col antialiased">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/buyer-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Overview</Link>
        {/* <Link href="/bidding/buyer-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Data room</Link> */}
        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-7 flex flex-col">
        <div className="flex items-center justify-between py-4 gap-4 flex-wrap w-full">
          <div className="flex-1 max-w-[340px]">
            <input type="text" placeholder="Search documents, folders, Q&A..." className="w-full font-sans text-[13px] px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm transition-colors" />
          </div>
          <span className="text-[11.5px] text-green-700 bg-green-50 px-2.5 py-1.5 rounded-full border border-green-200/60 font-medium tracking-wide">NDA-gated · Bidder access</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-0 mb-10 border border-slate-200 rounded-xl bg-white overflow-hidden items-stretch shadow-sm flex-1">
          <div className="border-r border-slate-100 py-3.5 bg-[#FAFAFA]/30 hidden lg:block">
            <div className="px-5 pt-2 pb-1 text-[10.5px] tracking-wider text-slate-400 uppercase font-bold">Folders</div>
            <div className="px-5 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium"><span>Corporate</span><span className="text-[11px] text-slate-500 font-semibold">6</span></div>
            <div className="px-5 py-2.5 text-[13px] text-slate-900 bg-blue-50 border-r-2 border-blue-600 cursor-pointer flex justify-between items-center font-semibold"><span>Financials</span><span className="text-[11px] text-blue-600 font-bold">9</span></div>
            <div className="px-5 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium"><span>Legal</span><span className="text-[11px] text-slate-500 font-semibold">5</span></div>
            <div className="px-5 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium"><span>Operations</span><span className="text-[11px] text-slate-500 font-semibold">4</span></div>
            <div className="px-5 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium"><span>HR &amp; Talent</span><span className="text-[11px] text-slate-500 font-semibold">3</span></div>
            
            <div className="px-5 pt-4 pb-1 text-[10.5px] tracking-wider text-slate-400 uppercase font-bold">Discussion</div>
            <div className="px-5 py-2.5 text-[13px] text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors font-medium"><span>Q&amp;A thread</span><span className="text-[11px] text-slate-500 font-semibold">12</span></div>
          </div>

          <div className="flex flex-col min-w-0 border-r border-slate-100">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-[#FAFAFA]">
              <h2 className="text-[16px] font-bold text-slate-900 m-0">Financials <span className="text-slate-400 font-normal text-[13px]">· 9 files</span></h2>
              <span className="text-[12px] text-slate-500 font-medium">Sort: Recently added</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] text-slate-500 font-semibold px-5 py-2.5 border-b border-slate-200 bg-white uppercase tracking-wider">Name</th>
                    <th className="text-left text-[11px] text-slate-500 font-semibold px-5 py-2.5 border-b border-slate-200 bg-white uppercase tracking-wider">Size</th>
                    <th className="text-left text-[11px] text-slate-500 font-semibold px-5 py-2.5 border-b border-slate-200 bg-white uppercase tracking-wider">Added</th>
                    <th className="text-left text-[11px] text-slate-500 font-semibold px-5 py-2.5 border-b border-slate-200 bg-white uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50/50 cursor-pointer border-b border-slate-100">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white text-emerald-600 border border-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">XLS</div>
                        <div className="min-w-0">
                          <b className="font-medium text-slate-900 text-[13px] block truncate">Revenue &amp; cohort breakdown.xlsx</b>
                          <div className="text-slate-500 text-[11px] mt-0.5">Financials</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">2.1 MB</td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">2 Sep</td>
                    <td className="px-5 py-3"><span className="text-[11px] text-green-600 font-medium">Viewed</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white text-rose-600 border border-rose-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">PDF</div>
                        <div className="min-w-0">
                          <b className="font-medium text-slate-900 text-[13px] block truncate">Audited financials FY25.pdf</b>
                          <div className="text-slate-500 text-[11px] mt-0.5">Financials</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">4.8 MB</td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">18 Aug</td>
                    <td className="px-5 py-3"><span className="text-[11px] text-green-600 font-medium">Viewed</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white text-emerald-600 border border-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">XLS</div>
                        <div className="min-w-0">
                          <b className="font-medium text-slate-900 text-[13px] block truncate">Updated cap table v3.xlsx</b>
                          <div className="text-slate-500 text-[11px] mt-0.5">Financials</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">640 KB</td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">4 Sep</td>
                    <td className="px-5 py-3"><span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">New</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white text-rose-600 border border-rose-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">PDF</div>
                        <div className="min-w-0">
                          <b className="font-medium text-slate-900 text-[13px] block truncate">Debt schedule.pdf</b>
                          <div className="text-slate-500 text-[11px] mt-0.5">Financials</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">310 KB</td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">16 Aug</td>
                    <td className="px-5 py-3"><span className="text-[11px] text-green-600 font-medium">Viewed</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white text-emerald-600 border border-emerald-100 flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">XLS</div>
                        <div className="min-w-0">
                          <b className="font-medium text-slate-900 text-[13px] block truncate">Monthly ARR trend.xlsx</b>
                          <div className="text-slate-500 text-[11px] mt-0.5">Financials</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">1.2 MB</td>
                    <td className="px-5 py-3 text-slate-500 text-[12px]">15 Aug</td>
                    <td className="px-5 py-3"><span className="text-[11px] text-green-600 font-medium">Viewed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 flex flex-col bg-[#FAFAFA]/50">
            <h3 className="text-[15px] font-medium text-slate-900 mb-1">Revenue &amp; cohort breakdown.xlsx</h3>
            <div className="text-[12px] text-slate-500 mb-4">Uploaded by ABC Technologies · 2 Sep 2026</div>
            
            <div className="flex flex-col gap-2 mb-2">
              <a href="#" className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity text-center w-full shadow-sm">Open in viewer</a>
              <a href="#" className="font-sans text-[13px] font-medium px-4 py-2.5 rounded-lg cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-center w-full shadow-sm">Download</a>
            </div>

            <div className="mt-4 mb-2">
              <div className="flex justify-between py-2 text-[12.5px] border-b border-slate-100"><span className="text-slate-500">Folder</span><span className="text-slate-900 font-semibold text-[12.5px]">Financials</span></div>
              <div className="flex justify-between py-2 text-[12.5px] border-b border-slate-100"><span className="text-slate-500">Size</span><span className="text-slate-900 font-semibold text-[12.5px]">2.1 MB</span></div>
              <div className="flex justify-between py-2 text-[12.5px] border-b border-slate-100"><span className="text-slate-500">Your views</span><span className="text-slate-900 font-semibold text-[12.5px]">3</span></div>
              <div className="flex justify-between py-2 text-[12.5px] border-b border-slate-100"><span className="text-slate-500">Last viewed</span><span className="text-slate-900 font-semibold text-[12.5px]">Today</span></div>
            </div>

            <div className="mt-6 flex-1">
              <label className="block text-[11.5px] text-slate-500 font-semibold uppercase tracking-wide mb-2">Ask a question about this document</label>
              <textarea rows="3" placeholder="e.g. Can you break down enterprise vs. SMB revenue?" className="w-full font-sans text-[12.5px] p-3 border border-slate-200 rounded-lg resize-none bg-white text-slate-900 focus:outline-none focus:border-slate-400 shadow-sm transition-colors mb-2"></textarea>
              <a href="#" className="inline-block font-sans text-[12.5px] font-medium px-3 py-1.5 rounded-md cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">Submit to seller</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
