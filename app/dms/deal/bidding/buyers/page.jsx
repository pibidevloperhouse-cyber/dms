"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function SellerBuyersPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen">
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white items-center">
        <Link href="/dms/deal/bidding" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>
        <Link href="/dms/deal/bidding/buyers" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Buyers</Link>
        <Link href="/dms/deal/bidding/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      <div className="pt-5 px-7 flex justify-between items-start flex-wrap gap-3.5">
        <div>
          <h1 className="text-[22px] font-serif font-medium m-0">Buyers</h1>
          <div className="text-[13px] text-slate-500 mt-1">Invite, manage access, and track every buyer's progress through the process</div>
        </div>
      </div>

      <div className="flex gap-3.5 mt-4 px-7">
        <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-white">Invited <b className="text-slate-900 font-mono">4</b></span>
        <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-white">NDA signed <b className="text-slate-900 font-mono">3</b></span>
        <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-white">Bids received <b className="text-slate-900 font-mono">3</b></span>
        <span className="text-[12px] text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-white">Declined <b className="text-slate-900 font-mono">1</b></span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl my-5 mx-7 mb-10 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 bg-white">
          <h2 className="text-[15px] font-serif font-medium m-0">All buyers</h2>
          <span className="text-[12px] text-slate-400">4 invited</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-slate-200">
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5">Buyer</th>
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5">Status</th>
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5">Offer</th>
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5">Data room access</th>
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5">Last activity</th>
                <th className="text-left text-[11px] text-slate-500 font-medium px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-mono font-medium shrink-0">HG</div>
                    <div>
                      <div className="font-medium text-[13.5px] text-slate-900">Halcyon Growth</div>
                      <div className="text-[11.5px] text-slate-400">PE Firm · Melbourne, AU</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">Shortlisted</span></td>
                <td className="px-4 py-3.5 align-middle font-mono text-[13px] text-slate-900 tabular-nums">$100.0M</td>
                <td className="px-4 py-3.5 align-middle">
                  <select className="font-sans text-[12px] text-slate-900 border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-slate-400">
                    <option>Full access</option>
                    <option>Restricted</option>
                    <option>No access</option>
                  </select>
                </td>
                <td className="px-4 py-3.5 align-middle text-slate-400 text-[12px]">Live now</td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex gap-1.5">
                    <Link href="/bidding/seller-side/messages" className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">Message</Link>
                    <Link href="/bidding/seller-side/bidding" className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">View bid</Link>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-mono font-medium shrink-0">XC</div>
                    <div>
                      <div className="font-medium text-[13.5px] text-slate-900">XYZ Capital</div>
                      <div className="text-[11.5px] text-slate-400">Strategic Buyer · Singapore</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Under review</span></td>
                <td className="px-4 py-3.5 align-middle font-mono text-[13px] text-slate-900 tabular-nums">$95.0M</td>
                <td className="px-4 py-3.5 align-middle">
                  <select className="font-sans text-[12px] text-slate-900 border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-slate-400" defaultValue="Restricted">
                    <option>Full access</option>
                    <option value="Restricted">Restricted</option>
                    <option>No access</option>
                  </select>
                </td>
                <td className="px-4 py-3.5 align-middle text-slate-400 text-[12px]">Yesterday, 4:12 PM</td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex gap-1.5">
                    <Link href="/bidding/seller-side/messages" className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">Message</Link>
                    <Link href="/bidding/seller-side/bidding" className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">View bid</Link>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-mono font-medium shrink-0">CB</div>
                    <div>
                      <div className="font-medium text-[13.5px] text-slate-900">Cardinal Buyers Inc.</div>
                      <div className="text-[11.5px] text-slate-400">Corporate Buyer · London, UK</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700">Declined</span></td>
                <td className="px-4 py-3.5 align-middle font-mono text-[13px] text-slate-900 tabular-nums">$90.0M</td>
                <td className="px-4 py-3.5 align-middle">
                  <select className="font-sans text-[12px] text-slate-900 border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-slate-400" defaultValue="No access">
                    <option>Full access</option>
                    <option>Restricted</option>
                    <option value="No access">No access</option>
                  </select>
                </td>
                <td className="px-4 py-3.5 align-middle text-slate-400 text-[12px]">29 Aug, 5:30 PM</td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex gap-1.5">
                    <Link href="/bidding/seller-side/messages" className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">Message</Link>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[30px] h-[30px] rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-mono font-medium shrink-0">MP</div>
                    <div>
                      <div className="font-medium text-[13.5px] text-slate-900">Meridian Partners</div>
                      <div className="text-[11.5px] text-slate-400">PE Firm · New York, US</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">NDA pending</span></td>
                <td className="px-4 py-3.5 align-middle font-mono text-[13px] text-slate-900 tabular-nums">—</td>
                <td className="px-4 py-3.5 align-middle"><span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">No access yet</span></td>
                <td className="px-4 py-3.5 align-middle text-slate-400 text-[12px]">Invited 4 Sep</td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="flex gap-1.5">
                    <button className="font-sans text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">Resend NDA</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {showInviteForm && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8F9FB] border-t border-slate-100">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-slate-500 font-medium">Company name</label>
              <input type="text" placeholder="e.g. Summit Capital Partners" className="font-sans text-[13px] px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-slate-500 font-medium">Contact email</label>
              <input type="text" placeholder="lead@summitcapital.com" className="font-sans text-[13px] px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-slate-500 font-medium">Buyer type</label>
              <select className="font-sans text-[13px] px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400">
                <option>PE Firm</option>
                <option>Strategic Buyer</option>
                <option>Corporate Buyer</option>
                <option>Individual / Family Office</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] text-slate-500 font-medium">Initial data room access</label>
              <select className="font-sans text-[13px] px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:border-slate-400">
                <option>Restricted (Corporate + Financials only)</option>
                <option>Full access</option>
                <option>NDA required first</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2.5 mt-2">
              <button className="font-sans text-[12px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors" onClick={() => setShowInviteForm(false)}>Cancel</button>
              <button className="font-sans text-[12px] font-medium px-4 py-2 rounded-lg cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 transition-opacity" onClick={() => setShowInviteForm(false)}>Send invitation &amp; NDA</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
