"use client";

import React from 'react';
import Link from 'next/link';

export default function SellerDataRoomPage() {
  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>
        {/* <Link href="/bidding/seller-side/data-room" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Data room</Link> */}
        <Link href="/bidding/seller-side/buyers" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Buyers</Link>
        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Messages</Link>
      </div>

      <div className="flex items-center justify-between px-7 py-4 gap-4 flex-wrap">
        <div className="flex-1 max-w-[320px]">
          <input type="text" placeholder="Search documents, folders, Q&A..." className="w-full font-sans text-[13px] px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400" />
        </div>
        <div className="flex gap-2.5">
          <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors">New folder</button>
          <button className="font-sans text-[13px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity">Upload documents</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_300px] mx-7 mb-10 border border-slate-200 rounded-xl bg-white overflow-hidden items-stretch shadow-sm">
        <div className="border-b md:border-b-0 md:border-r border-slate-100 py-3.5">
          <div className="px-5 py-2 text-[10.5px] tracking-wide text-slate-400 uppercase font-bold">Folders</div>
          <div className="px-5 py-2 text-[13px] text-slate-600 font-medium cursor-pointer flex justify-between hover:bg-slate-50 transition-colors"><span>Corporate</span><span className="text-[11px] text-slate-500 font-semibold">6</span></div>
          <div className="px-5 py-2 text-[13px] text-slate-900 font-semibold cursor-pointer flex justify-between bg-blue-50 border-r-2 border-blue-600"><span>Financials</span><span className="text-[11px] text-blue-600 font-bold">9</span></div>
          <div className="px-5 py-2 text-[13px] text-slate-600 font-medium cursor-pointer flex justify-between hover:bg-slate-50 transition-colors"><span>Legal</span><span className="text-[11px] text-slate-500 font-semibold">5</span></div>
          <div className="px-5 py-2 text-[13px] text-slate-600 font-medium cursor-pointer flex justify-between hover:bg-slate-50 transition-colors"><span>Operations</span><span className="text-[11px] text-slate-500 font-semibold">4</span></div>
          <div className="px-5 py-2 text-[13px] text-slate-600 font-medium cursor-pointer flex justify-between hover:bg-slate-50 transition-colors"><span>HR &amp; Talent</span><span className="text-[11px] text-slate-500 font-semibold">3</span></div>
          <div className="px-5 pt-3 pb-1 text-[10.5px] tracking-wide text-slate-400 uppercase mt-2 font-bold">Discussion</div>
          <div className="px-5 py-2 text-[13px] text-slate-600 font-medium cursor-pointer flex justify-between hover:bg-slate-50 transition-colors"><span>Q&amp;A inbox</span><span className="text-[11px] text-slate-500 font-semibold">2</span></div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
            <h2 className="text-[16px] font-bold text-slate-900 m-0">Financials <span className="text-slate-400 font-normal text-[13px]">· 9 files</span></h2>
            <span className="text-[12px] text-slate-400">Sort: Recently added</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F8F9FB] border-b border-slate-200">
                  <th className="text-left text-[11px] text-slate-500 font-medium px-5 py-2.5">Name</th>
                  <th className="text-left text-[11px] text-slate-500 font-medium px-5 py-2.5">Size</th>
                  <th className="text-left text-[11px] text-slate-500 font-medium px-5 py-2.5">Added</th>
                  <th className="text-left text-[11px] text-slate-500 font-medium px-5 py-2.5">Visibility</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-blue-50 cursor-pointer">
                  <td className="px-5 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">XLS</div>
                      <div>
                        <b className="font-medium text-slate-900 text-[13px]">Revenue &amp; cohort breakdown.xlsx</b>
                        <div className="text-slate-400 text-[11px]">Viewed by 3 of 4 buyers</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">2.1 MB</td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">2 Sep</td>
                  <td className="px-5 py-3 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">All buyers</span></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">PDF</div>
                      <div>
                        <b className="font-medium text-slate-900 text-[13px]">Audited financials FY25.pdf</b>
                        <div className="text-slate-400 text-[11px]">Viewed by 3 of 4 buyers</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">4.8 MB</td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">18 Aug</td>
                  <td className="px-5 py-3 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">All buyers</span></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">XLS</div>
                      <div>
                        <b className="font-medium text-slate-900 text-[13px]">Updated cap table v3.xlsx</b>
                        <div className="text-slate-400 text-[11px]">Viewed by 1 of 4 buyers</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">640 KB</td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">4 Sep</td>
                  <td className="px-5 py-3 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Shortlisted only</span></td>
                </tr>
                <tr className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">PDF</div>
                      <div>
                        <b className="font-medium text-slate-900 text-[13px]">Debt schedule.pdf</b>
                        <div className="text-slate-400 text-[11px]">Viewed by 2 of 4 buyers</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">310 KB</td>
                  <td className="px-5 py-3 align-middle text-slate-400 text-[11px]">16 Aug</td>
                  <td className="px-5 py-3 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">All buyers</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-slate-100 p-5 bg-[#F8F9FB]">
          <h3 className="text-[15px] font-medium mb-1">Revenue &amp; cohort breakdown.xlsx</h3>
          <div className="text-[12px] text-slate-400 mb-4">Uploaded 2 Sep 2026 · Financials</div>

          <div className="text-[11.5px] text-slate-500 font-medium mb-1.5">Visibility by buyer</div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200 text-[12.5px]">
            <span>Halcyon Growth</span>
            <div className="w-[32px] h-[18px] rounded-full bg-green-600 relative cursor-pointer"><div className="absolute top-[2px] left-[16px] w-[14px] h-[14px] rounded-full bg-white"></div></div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200 text-[12.5px]">
            <span>XYZ Capital</span>
            <div className="w-[32px] h-[18px] rounded-full bg-green-600 relative cursor-pointer"><div className="absolute top-[2px] left-[16px] w-[14px] h-[14px] rounded-full bg-white"></div></div>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200 text-[12.5px]">
            <span>Cardinal Buyers</span>
            <div className="w-[32px] h-[18px] rounded-full bg-slate-200 relative cursor-pointer"><div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white"></div></div>
          </div>
          <div className="flex justify-between items-center py-2 text-[12.5px]">
            <span>Meridian Partners</span>
            <div className="w-[32px] h-[18px] rounded-full bg-slate-200 relative cursor-pointer"><div className="absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white"></div></div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 bg-white hover:border-slate-900 hover:text-slate-900 transition-colors w-full cursor-pointer">Replace file</button>
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-500 bg-white hover:border-slate-900 hover:text-slate-900 transition-colors w-full cursor-pointer">View access log</button>
            <button className="text-center block font-sans text-[13px] font-medium px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:border-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full cursor-pointer">Remove document</button>
          </div>
        </div>
      </div>
    </div>
  );
}
