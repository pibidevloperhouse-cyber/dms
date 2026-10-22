"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BidDetailsPage() {
  const params = useParams();
  const id = params.id || 'c';

  const bidsData = {
    c: { name: "Halcyon Growth", mark: "HG", type: "PE Firm · Melbourne, AU", offer: "$100.0M", vsAsk: "±0%", cash: "60%", stock: "40%", close: "Dec 2026", status: "Shortlisted", engagement: "18 docs · 92%", vsColor: "var(--green)" },
    b: { name: "XYZ Capital", mark: "XC", type: "Strategic Buyer · Singapore", offer: "$95.0M", vsAsk: "-5%", cash: "70%", stock: "30%", close: "Dec 2026", status: "Under review", engagement: "14 docs · 66%", vsColor: "var(--red)" },
    a: { name: "Cardinal Buyers Inc.", mark: "CB", type: "Corporate Buyer · London, UK", offer: "$90.0M", vsAsk: "-10%", cash: "100%", stock: "0%", close: "Jan 2027", status: "Declined", engagement: "9 docs · 34%", vsColor: "var(--red)" }
  };

  const bid = bidsData[id] || bidsData['c'];

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans min-h-screen pb-10">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white text-[14px] items-center">
        <Link href="/dms/deal/bidding" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Bidding</Link>
        <Link href="/dms/deal/bidding/buyers" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Buyers</Link>
        <Link href="/dms/deal/bidding/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="pt-8 px-7 pb-6 flex justify-between items-start border-b border-slate-100 bg-white flex-wrap gap-5">
        <div className="flex gap-5 items-center">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">{bid.mark}</div>
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 mb-1 mt-0">{bid.name}</h1>
            <div className="text-slate-500 text-[14.5px]">{bid.type}</div>
            <div className="flex gap-2 mt-3.5 flex-wrap">
              <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1 rounded-full">NDA signed</span>
              <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1 rounded-full">Lead: R. Okafor</span>
              <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1 rounded-full">Advisor: Linklane LLP</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="font-sans text-[13.5px] font-medium px-5 py-2.5 rounded-lg cursor-pointer border border-red-600 text-red-600 bg-transparent hover:bg-red-600 hover:text-white transition-colors">Decline bid</button>
          <button className="font-sans text-[13.5px] font-medium px-5 py-2.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 bg-transparent hover:bg-white hover:text-slate-900 hover:border-slate-900 transition-colors">Counter offer</button>
          <Link href="/dms/deal/bidding/term-sheet" className="font-sans text-[13.5px] font-medium px-5 py-2.5 rounded-lg cursor-pointer border border-green-600 bg-green-600 text-white hover:opacity-90 transition-opacity">Accept &amp; move to term sheet</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-7 max-w-[1400px] mx-auto items-start">
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-[16px] font-sans font-semibold mb-3.5 text-slate-900 border-b border-slate-100 pb-2">Offer Summary</div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mb-4">
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-medium">Offer</div>
                <div className="text-[20px] font-bold text-slate-900">{bid.offer}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-medium">vs. asking price</div>
                <div className="text-[20px] font-bold" style={{ color: bid.vsColor }}>{bid.vsAsk}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-medium">Expected close</div>
                <div className="text-[20px] font-bold text-slate-900">{bid.close}</div>
              </div>
              <div className="border border-slate-100 rounded-lg px-3.5 py-2.5 bg-[#FAFAFA]">
                <div className="text-[11.5px] text-slate-500 mb-1 font-medium">Status</div>
                <div className="text-[15px] font-sans font-medium text-slate-900 mt-0.5">{bid.status}</div>
              </div>
            </div>

            <div className="mt-1">
              <div className="text-[12.5px] text-slate-500 font-medium">Structure</div>
              <div className="flex h-2.5 rounded-full overflow-hidden mt-2 mb-2.5">
                <div className="bg-slate-900" style={{ width: bid.cash }}></div>
                <div className="bg-blue-100 border-l border-white" style={{ width: bid.stock }}></div>
              </div>
              <div className="flex gap-6 text-[12.5px] text-slate-500">
                <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-slate-900">Cash {bid.cash}</span>
                <span className="flex items-center gap-1.5 before:content-['●'] before:text-[9px] before:relative before:-top-[1px] before:text-blue-600">Stock {bid.stock}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Submitted Documents</div>
            <div className="flex items-center justify-between px-4.5 py-3.5 border border-slate-200 rounded-lg text-[14px] mb-3 hover:bg-[#F8F9FB] hover:border-slate-400 transition-colors cursor-pointer">
              <span className="text-slate-900 font-medium">Letter of Intent — signed.pdf</span>
              <span className="text-slate-400 font-medium text-[12px]">Open ↗</span>
            </div>
            <div className="flex items-center justify-between px-4.5 py-3.5 border border-slate-200 rounded-lg text-[14px] mb-3 hover:bg-[#F8F9FB] hover:border-slate-400 transition-colors cursor-pointer">
              <span className="text-slate-900 font-medium">Financing confirmation.pdf</span>
              <span className="text-slate-400 font-medium text-[12px]">Open ↗</span>
            </div>
            <div className="flex items-center justify-between px-4.5 py-3.5 border border-slate-200 rounded-lg text-[14px] mb-3 hover:bg-[#F8F9FB] hover:border-slate-400 transition-colors cursor-pointer">
              <span className="text-slate-900 font-medium">Term sheet draft v2.docx</span>
              <span className="text-slate-400 font-medium text-[12px]">Open ↗</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Internal Notes</div>
            <div className="border border-dashed border-slate-400 rounded-lg p-5 text-[14.5px] text-slate-500 bg-[#FAFAFA] italic leading-relaxed">
              "Financing letter checks out — board is comfortable with the stock component. Recommend proceeding to term sheet."<br /><br />
              <span className="not-italic text-[12.5px] text-slate-400">— V. Sharma, Finance Advisor</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-[17px] font-sans font-semibold mb-5 text-slate-900 border-b border-slate-100 pb-3">Recent Activity</div>
            <div className="flex gap-3.5 py-4 text-[13.5px] border-b border-slate-100">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-slate-900 font-medium">Viewing Revenue.xlsx in VDR</div>
                <div className="text-slate-400 text-[12px] mt-1">Live now · 6 min</div>
              </div>
            </div>
            <div className="flex gap-3.5 py-4 text-[13.5px] border-b border-slate-100">
              <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-slate-900 font-medium">Asked a question on Legal DD</div>
                <div className="text-slate-400 text-[12px] mt-1">Yesterday, 4:12 PM</div>
              </div>
            </div>
            <div className="flex gap-3.5 py-4 text-[13.5px]">
              <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-slate-900 font-medium">Submitted revised offer — $100M</div>
                <div className="text-slate-400 text-[12px] mt-1">2 Sep, 11:02 AM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
