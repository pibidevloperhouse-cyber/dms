"use client";

import { useState } from "react";
import { Store, ShieldCheck, CheckSquare, FileText, Gavel, Lock, Layers, GitBranch, ArrowRight } from "lucide-react";

export default function ForestCard() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [roleMode, setRoleMode] = useState("seller");

  const slides = [
    {
      step: "01",
      shortTitle: "Marketplace",
      symbolLabel: "DMS // MARKETPLACE",
      Icon: Store,
      titleLine1: "MARKET",
      titleLine2: "PLACE",
      singleLineTitle: true,
      fullTitle: "Market Place",
      subtitle: "Curated M&A Opportunities & Verified Buyer-Seller Discovery",
      urlPath: "dms/marketplace",
      buttonText: "Explore Marketplace",
      renderScreen: () =>
        roleMode === "seller" ? (
          <div className="w-full h-full bg-[#f8fafc] p-2 sm:p-2.5 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Top App Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 shrink-0">
              <span className="text-[8.5px] font-bold text-slate-800">Find Buyers</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-slate-400">🔔</span>
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[6.5px] font-bold text-slate-700">VR</span>
                <div className="leading-none">
                  <p className="text-[7px] font-bold text-slate-800">Vishwa Raj</p>
                  <p className="text-[5.5px] text-slate-400">seller</p>
                </div>
              </div>
            </div>

            {/* Page Title & Active Buyers Pill */}
            <div className="flex items-center justify-between gap-2 pt-1 shrink-0">
              <div>
                <h3 className="text-[11px] sm:text-[12px] font-extrabold text-slate-900 leading-tight">
                  Find <span className="text-[#0d9488]">Buyers</span>
                </h3>
                <p className="text-[6.5px] text-slate-500 leading-tight">
                  Discover premium, vetted acquisition targets. Filter by your exact mandate and request access to anonymous teasers.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[6.5px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                6 active matching buyers
              </span>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="grid grid-cols-4 gap-1.5 bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs shrink-0">
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Company Type</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Company Types</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Location</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Locations</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Deal Type</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Deal Types</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5 flex items-center justify-center bg-slate-50/70">
                <span className="text-[6.5px] font-bold text-slate-600">↻ RESET</span>
              </div>
            </div>

            {/* Search & Sort Row */}
            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-lg px-2 py-1 shadow-2xs shrink-0">
              <span className="text-[6.5px] text-slate-400 truncate">
                🔍 Search by industry, keyword, or business model...
              </span>
              <span className="text-[6.5px] font-semibold text-slate-700 border-l border-slate-200 pl-2 shrink-0">
                Sort by: Newest First ⌄
              </span>
            </div>

            {/* 3 Buyer Cards Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 min-h-0 pt-0.5">
              {[
                {
                  initials: "BA",
                  badgeBg: "bg-gradient-to-br from-[#1f6fb2] to-[#0d9488]",
                  firm: "banu mathi's Firm",
                  score: "9.9",
                  hq: "India",
                  stage: "$5M - $20M",
                },
                {
                  initials: "BH",
                  badgeBg: "bg-gradient-to-br from-[#0d9488] to-[#0284c7]",
                  firm: "bhanu mathi's Firm",
                  score: "9.2",
                  hq: "India",
                  stage: "Series C",
                },
                {
                  initials: "BH",
                  badgeBg: "bg-gradient-to-br from-[#0284c7] to-[#2ec4b6]",
                  firm: "bharathi kannan's Firm",
                  score: "8.5",
                  hq: "Antarctica",
                  stage: "Series C",
                },
              ].map((buyer, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md ${buyer.badgeBg} text-white flex items-center justify-center text-[7px] font-bold shrink-0`}
                        >
                          {buyer.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[5px] text-slate-400 font-semibold uppercase leading-none">M&A</p>
                          <p className="text-[7.5px] font-bold text-slate-900 truncate leading-tight">
                            {buyer.firm}
                          </p>
                        </div>
                      </div>
                      <span className="text-[7px] text-slate-400 shrink-0">🔖</span>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="text-[5.5px] px-1 py-0.2 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200/60">
                        • Growth opportunity
                      </span>
                      <span className="text-[5.5px] px-1 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium">
                        Corporate Development
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[6px] text-slate-500 leading-snug mt-1 line-clamp-2">
                      A fast-growing platform helping modern teams simplify their most important workflows.
                    </p>

                    {/* Signal Score Box */}
                    <div className="mt-1.5 p-1.5 rounded-lg bg-[#f0fdfa] border border-teal-100 grid grid-cols-2 gap-1 items-center">
                      <div className="border-r border-teal-200/60 pr-1">
                        <p className="text-[5px] font-bold text-slate-500 uppercase">✦ Signal Score</p>
                        <p className="text-[10px] font-black text-[#0d9488] leading-tight">
                          {buyer.score}
                          <span className="text-[6px] font-semibold text-slate-400"> /10</span>
                        </p>
                      </div>
                      <div className="pl-0.5">
                        <p className="text-[5.5px] font-bold text-slate-800 leading-tight">
                          Strong fit for your thesis
                        </p>
                        <p className="text-[5px] text-slate-400 leading-tight">Worth a closer look.</p>
                      </div>
                    </div>
                  </div>

                  {/* Meta & CTA */}
                  <div className="mt-1 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-0.5 text-[5px] leading-tight mb-1">
                      <div>
                        <p className="text-slate-400 uppercase">Sector</p>
                        <p className="font-bold text-slate-700 truncate">Corporate Dev</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase">Headquarters</p>
                        <p className="font-bold text-slate-700 truncate">{buyer.hq}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase">Stage</p>
                        <p className="font-bold text-slate-700 truncate">{buyer.stage}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#1f6fb2] to-[#14b8a6] text-white text-[6.5px] font-bold shadow-2xs">
                        Explore company ↗
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-[#f8fafc] p-2 sm:p-2.5 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Top App Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 shrink-0">
              <span className="text-[8.5px] font-bold text-slate-800">Find Deal</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-slate-400">🔔</span>
                <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[6.5px] font-bold text-slate-700">NR</span>
                <div className="leading-none">
                  <p className="text-[7px] font-bold text-slate-800">Naga raj</p>
                  <p className="text-[5.5px] text-slate-400">buyer</p>
                </div>
              </div>
            </div>

            {/* Page Title & Active Deals Pill */}
            <div className="flex items-center justify-between gap-2 pt-1 shrink-0">
              <div>
                <h3 className="text-[11px] sm:text-[12px] font-extrabold text-slate-900 leading-tight">
                  Explore <span className="text-[#0d9488]">Opportunities</span>
                </h3>
                <p className="text-[6.5px] text-slate-500 leading-tight">
                  Discover premium, vetted acquisition targets. Filter by your exact mandate and request access to anonymous teasers.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[6.5px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                3 active matching deals
              </span>
            </div>

            {/* Filter Dropdowns Row */}
            <div className="grid grid-cols-4 gap-1.5 bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs shrink-0">
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Industry</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Industries</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Location</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Locations</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5">
                <p className="text-[5px] font-semibold text-slate-400 uppercase">Deal Type</p>
                <p className="text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>All Deal Types</span><span className="text-slate-400">⌄</span>
                </p>
              </div>
              <div className="border border-slate-200/80 rounded px-1.5 py-0.5 flex items-center justify-center bg-slate-50/70">
                <span className="text-[6.5px] font-bold text-slate-600">↻ RESET</span>
              </div>
            </div>

            {/* Search & Sort Row */}
            <div className="flex items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-lg px-2 py-1 shadow-2xs shrink-0">
              <span className="text-[6.5px] text-slate-400 truncate">
                🔍 Search by industry, keyword, or business model...
              </span>
              <span className="text-[6.5px] font-semibold text-slate-700 border-l border-slate-200 pl-2 shrink-0">
                Sort by: Newest First ⌄
              </span>
            </div>

            {/* 3 Opportunity Cards Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 min-h-0 pt-0.5">
              {[
                {
                  initials: "TE",
                  badgeBg: "bg-[#1e3a8a]",
                  title: "testing project",
                  sector: "Healthcare / Life Sciences",
                  location: "Mumbai",
                  desc: "testing for updation",
                  value: "5M",
                },
                {
                  initials: "VD",
                  badgeBg: "bg-[#059669]",
                  title: "VDR Sell",
                  sector: "Technology / SaaS",
                  location: "Karnataka",
                  desc: "Enterprise cloud infrastructure provider with recurring revenue across regulated industries.",
                  value: "$1M",
                },
                {
                  initials: "PR",
                  badgeBg: "bg-[#b45309]",
                  title: "project bharathi",
                  sector: "Technology",
                  location: "Chhattisgarh",
                  desc: "Enterprise cloud infrastructure provider with recurring revenue across regulated industries.",
                  value: "344",
                },
              ].map((deal, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0"
                >
                  <div>
                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md ${deal.badgeBg} text-white flex items-center justify-center text-[7px] font-bold shrink-0`}
                        >
                          {deal.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[4.5px] text-slate-400 font-semibold uppercase leading-none truncate">
                            Confidential Opportunity
                          </p>
                          <p className="text-[7.5px] font-bold text-slate-900 truncate leading-tight mt-0.5">
                            {deal.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-[7px] text-slate-400 shrink-0">🔖</span>
                    </div>

                    {/* Pills */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[5.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/60 truncate max-w-[90px]">
                        {deal.sector}
                      </span>
                      <span className="text-[5.5px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/60">
                        {deal.location}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[6px] text-slate-500 leading-snug mt-1.5 line-clamp-2">
                      {deal.desc}
                    </p>
                  </div>

                  {/* Deal Metrics & View Deal Footer */}
                  <div className="mt-1 pt-1.5 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 text-[5.5px] leading-tight mb-1.5">
                      <div>
                        <p className="text-slate-400">Stage</p>
                        <p className="font-bold text-slate-800">Due diligence</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Indicative value</p>
                        <p className="font-bold text-slate-800">{deal.value}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Deadline</p>
                        <p className="font-bold text-slate-800">Oct 08, 2026</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Participants</p>
                        <p className="font-bold text-slate-800">18 Invited</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[6px]">
                      <span className="text-slate-400">○ 12 new documents</span>
                      <span className="font-bold text-[#0d9488]">View deal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
    },
    {
      step: "02",
      shortTitle: "Deal Room",
      symbolLabel: "DMS // VDR SECURE",
      Icon: ShieldCheck,
      titleLine1: "DEAL",
      titleLine2: "ROOM",
      fullTitle: "Deal Room",
      subtitle: "Ultra-Secure Virtual Data Room with Granular Access & Diligence",
      urlPath: "dms/deal-room",
      buttonText: "Enter Deal Room",
      screenImage: "/images/screen-dealroom.png",
      renderScreen: () => {
        const isSeller = roleMode === "seller";
        const cards = isSeller
          ? [
              { title: "testing project", deals: 2, highlighted: true },
              { title: "VDR Sell", deals: 3, highlighted: false },
            ]
          : [
              { title: "testing project", deals: 1, highlighted: false },
              { title: "VDR Sell", deals: 1, highlighted: true },
            ];

  return (
          <div className="w-full h-full bg-[#f8fafc] p-2.5 sm:p-3 flex flex-col select-none font-sans overflow-hidden">
            {/* Top App Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5 shrink-0">
              <span className="text-[9px] font-bold text-slate-800">Workspace</span>
              <div className="flex items-center gap-1.5">
                <span className="relative text-[8.5px] text-slate-400">
                  🔔
                  {!isSeller && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </span>
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[6.5px] font-bold text-slate-700">
                  {isSeller ? "VR" : "NR"}
                </span>
                <div className="leading-none">
                  <p className="text-[7.5px] font-bold text-slate-800">
                    {isSeller ? "Vishwa Raj" : "Naga raj"}
                  </p>
                  <p className="text-[6px] text-slate-400">{isSeller ? "seller" : "buyer"}</p>
                </div>
              </div>
            </div>

            {/* Page Title */}
            <div className="flex items-center justify-between gap-2 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-extrabold text-slate-900 leading-none">
                  {isSeller ? "PiBi Tech Solutions" : "Buyer Workspace"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[7px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  {isSeller ? "Seller" : "Buyer"}
                </span>
              </div>
              {isSeller && (
                <span className="px-2.5 py-1 rounded-md bg-[#0d9488] text-white text-[7px] font-bold shadow-2xs">
                  + Create Project
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200/80 text-[8px] font-semibold text-slate-500 mb-3 shrink-0">
              <span className="pb-1.5 text-[#0d9488] border-b-2 border-[#0d9488] font-bold">All</span>
              <span className="pb-1.5">Approved</span>
              <span className="pb-1.5">Pending</span>
              <span className="pb-1.5">Rejected</span>
            </div>

            {/* 2 Workspace Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {cards.map((ws, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl bg-white flex flex-col justify-between transition-all ${
                    ws.highlighted
                      ? "border border-[#2ec4b6] shadow-sm shadow-teal-500/10"
                      : "border border-slate-200/90 shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                      </div>
                      {isSeller ? (
                        <span className="text-slate-400 text-[10px] font-bold leading-none px-1">⋮</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[6.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          ✓ NDA Signed
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-2.5 text-[9.5px] font-bold ${
                        ws.highlighted ? "text-[#0d9488]" : "text-slate-900"
                      }`}
                    >
                      {ws.title}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 space-y-1 text-[7px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">
                        Current Deals: <strong className="text-slate-800">{ws.deals}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        Deal :
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 flex items-center gap-0.5 text-[6.5px]">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </span>
                    </div>
                    <p className="text-slate-500">
                      Created at : <span className="text-slate-700">Oct 14, 2026</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      step: "03",
      shortTitle: "Workflow",
      symbolLabel: "DMS // WORKFLOW",
      Icon: CheckSquare,
      titleLine1: "TASK &",
      titleLine2: "WORKFLOW",
      fullTitle: "Task & Workflow",
      subtitle: "Automated Milestone Tracking, Pipeline Stages & Approvals",
      urlPath: "dms/deal-workflow",
      buttonText: "Open Task Pipeline",
      screenImage: "/images/screen-workflow.png",
      renderScreen: () => {
        const isSeller = roleMode === "seller";
        const stages = isSeller
          ? [
              { num: "1", title: "Preparation", active: true, badge: "ACTIVE", statusLeft: "No tasks yet", statusRight: "Currently active", invite: false },
              { num: "2", title: "Due Diligence", active: false, badge: "INACTIVE", statusLeft: "No tasks yet", statusRight: "Toggle to activate", invite: false },
              { num: "3", title: "Negotiation", active: false, badge: "INACTIVE", statusLeft: "No tasks yet", statusRight: "Toggle to activate", invite: true },
            ]
          : [
              { num: "1", title: "Preparation", active: true, badge: "ACTIVE", statusLeft: "✓ Stage completed by Seller", statusRight: "• Completed", checkIcon: true },
              { num: "2", title: "Due Diligence", active: false, badge: "🔒 DISABLED", statusLeft: "🔒 Stage disabled by Super Admin", disabledPill: true },
              { num: "3", title: "Negotiation", active: false, badge: "INACTIVE", statusLeft: "🔒 Stage disabled by Super Admin", lockIcon: true },
            ];

  return (
          <div className="w-full h-full bg-[#f8fafc] p-2 sm:p-2.5 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div>
                <h3 className="text-[11px] sm:text-[12px] font-extrabold text-slate-900 leading-tight">
                  Task & Workflow
                </h3>
                <p className="text-[6px] text-slate-500 leading-tight">
                  Track deal milestones, manage team responsibilities, and collaborate via task-based communication.
                </p>
              </div>
              <span className="relative w-5 h-5 rounded-md bg-white border border-slate-200/90 flex items-center justify-center text-[8px] text-slate-500 shadow-2xs shrink-0">
                🔔
                {!isSeller && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 text-white text-[5px] font-bold flex items-center justify-center">
                    1
                  </span>
                )}
              </span>
            </div>

            {/* 3 Stage Cards */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0 pt-1">
              {stages.map((st, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl bg-white flex flex-col justify-between ${
                    st.active
                      ? "border-[1.5px] border-[#0d9488] shadow-xs"
                      : "border border-slate-200/90 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[6px] font-bold shrink-0">
                        {st.num}
                      </span>
                      <span className="text-[7.5px] font-bold text-slate-900 truncate">
                        {st.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {st.disabledPill ? (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[5px] font-bold">
                          {st.badge}
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-[5px] font-bold uppercase ${
                              st.active ? "text-[#0d9488]" : "text-slate-400"
                            }`}
                          >
                            {st.badge}
                          </span>
                          {isSeller ? (
                            <span
                              className={`w-4.5 h-2.5 rounded-full p-0.5 flex items-center ${
                                st.active ? "bg-[#0d9488] justify-end" : "bg-slate-200 justify-start"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                            </span>
                          ) : st.checkIcon ? (
                            <span className="w-3 h-3 rounded-full border border-[#0d9488] text-[#0d9488] flex items-center justify-center text-[5.5px] font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[6px] text-slate-400">🔒</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isSeller && (
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[5.5px] mb-1">
                        <span className="text-slate-400">Tasks Progress</span>
                        <span className="font-bold text-slate-700">0 / 0 Done (0%)</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-100" />
                    </div>
                  )}

                  <div className={`${isSeller ? "mt-1.5" : "mt-3"} flex items-center justify-between text-[5.5px]`}>
                    <span className={st.active && !isSeller ? "text-[#0d9488] font-semibold" : "text-slate-400"}>
                      {st.statusLeft}
                    </span>
                    <div className="flex items-center gap-1">
                      {st.invite && (
                        <span className="px-1 py-0.2 rounded bg-emerald-50 text-[#0d9488] border border-emerald-200/70 font-semibold text-[5px]">
                          🔑 Invite Buyer
                        </span>
                      )}
                      {st.statusRight && (
                        <span
                          className={`font-semibold ${
                            st.active ? "text-[#0d9488]" : "text-slate-400"
                          }`}
                        >
                          {st.statusRight}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs Row */}
            <div className="flex items-center gap-3 border-b border-slate-200/80 text-[6.5px] font-semibold text-slate-500 pt-1 shrink-0">
              <span className="pb-1 text-[#0d9488] border-b-2 border-[#0d9488] font-bold flex items-center gap-1">
                Created by You
                <span className="px-1 rounded-full bg-emerald-50 text-[#0d9488] text-[5.5px]">0</span>
              </span>
              <span className="pb-1 flex items-center gap-1">
                Task Creation
                <span className="px-1 rounded-full bg-slate-100 text-slate-500 text-[5.5px]">0</span>
              </span>
            </div>

            {/* Search & Filters Row */}
            <div className="flex items-center gap-1 pt-1 shrink-0">
              <div className="flex-1 bg-white border border-slate-200/80 rounded-md px-1.5 py-0.5 text-[5.5px] text-slate-400 truncate">
                🔍 Search tasks by title, ID, document, assignee, or group...
              </div>
              {["All Departments", "All Groups", "All Assignees", "All Priorities", "Internal Only"].map(
                (flt, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-slate-200/80 rounded-md px-1 py-0.5 text-[5px] font-medium text-slate-600 whitespace-nowrap"
                  >
                    {flt} ⌄
                  </span>
                )
              )}
            </div>

            {/* 4 Kanban Columns */}
            <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0 pt-1">
              {[
                {
                  dot: "bg-slate-400",
                  title: "TO DO",
                  sub: "Pending in Preparation",
                  empty: "No tasks in to do",
                  add: true,
                },
                {
                  dot: "bg-sky-500",
                  title: "IN PROGRESS",
                  sub: "In Motion in Preparation",
                  empty: "No tasks in in progress",
                  add: false,
                },
                {
                  dot: "bg-amber-400",
                  title: "REVIEW",
                  sub: "In Review in Preparation",
                  empty: "No tasks in review",
                  add: false,
                },
                {
                  dot: "bg-emerald-500",
                  title: "DONE",
                  sub: "Completed in Preparation",
                  empty: "No tasks in done",
                  add: false,
                },
              ].map((col, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col min-h-0"
                >
                  <div className="flex items-center justify-between gap-1 mb-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      <span className="text-[6px] font-extrabold text-slate-800">{col.title}</span>
                      <span className="px-1 rounded-full bg-slate-100 text-slate-500 text-[5px] font-bold">
                        0
                      </span>
                    </div>
                    <span className="text-[4.5px] text-slate-400 truncate">{col.sub}</span>
                  </div>
                  <div className="flex-1 rounded-md border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-1">
                    <p className="text-[5.5px] text-slate-400">{col.empty}</p>
                    {col.add && (
                      <p className="text-[5.5px] font-bold text-[#0d9488] mt-0.5">+ Add new task</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      step: "04",
      shortTitle: "Audit Logs",
      symbolLabel: "DMS // COMPLIANCE",
      Icon: FileText,
      titleLine1: "AUDIT &",
      titleLine2: "LOGS",
      fullTitle: "Audit & Logs",
      subtitle: "Immutable Activity Tracking, Document Watermarking & Event Logs",
      urlPath: "dms/control-audits",
      buttonText: "View Audit Trail",
      screenImage: "/images/screen-audit.png",
      renderScreen: () => {
        const isSeller = roleMode === "seller";
        const auditLogs = isSeller
          ? [
              { user: "Vishwa Raj", role: "Seller", action: "Certificate Executed by Seller Super Admin — Due Diligence..." },
              { user: "Vishwa Raj", role: "Seller", action: "Login Attempt — User Portal Session" },
              { user: "Rohit Verma", role: "Buyer", action: "Certificate Reviewed & Signed by S.P — Due Diligence..." },
            ]
          : [
              { user: "Naga raj", role: "Buyer", action: "Login Attempt — User Portal Session" },
              { user: "Rohit Verma", role: "Buyer", action: "Certificate Reviewed & Signed by S.P — Due Diligence..." },
              { user: "Naga raj", role: "Buyer", action: "Due Diligence Certificate Signed by Admin" },
            ];

  return (
          <div className="w-full h-full bg-[#f8fafc] p-2 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[10.5px] font-extrabold text-slate-900 leading-none">
                  Controls & Audit
                </h3>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[5.5px] font-bold border ${
                    isSeller
                      ? "bg-slate-100 text-slate-600 border-slate-200/80"
                      : "bg-sky-50 text-sky-700 border-sky-200/70"
                  }`}
                >
                  {isSeller ? "Super Admin Auditor" : "Buyer View"}
                </span>
              </div>
              {isSeller && (
                <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-md p-0.5 text-[5px] font-semibold">
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold">All Sides</span>
                  <span className="px-1 text-sky-600">• Buyer Side</span>
                  <span className="px-1 text-indigo-600">• Seller Side</span>
                </div>
              )}
            </div>

            {/* 3 KPI Cards */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[5px] font-bold text-slate-400 uppercase">
                  <span>Stage Progress</span>
                  <span className="text-sky-600">⇄</span>
                </div>
                <p className="text-[10px] font-black text-slate-900 leading-tight mt-0.5">4 / 4</p>
                <div className="flex items-center justify-between text-[5px] mt-0.5">
                  <span className="text-slate-500">Closing</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">Deal Complete</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[5px] font-bold text-slate-400 uppercase">
                  <span>Active Blockers</span>
                  <span className="text-emerald-600">✓</span>
                </div>
                <p className="text-[10px] font-black text-emerald-600 leading-tight mt-0.5">0</p>
                <div className="flex items-center justify-between text-[5px] mt-0.5">
                  <span className="text-slate-500">No active blockers</span>
                  <span className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">Cleared</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[5px] font-bold text-slate-400 uppercase">
                  <span>High Risks</span>
                  <span className="text-rose-500">⚠</span>
                </div>
                <p className="text-[10px] font-black text-slate-900 leading-tight mt-0.5">3</p>
                <div className="flex items-center justify-between text-[5px] mt-0.5">
                  <span className="text-slate-500">Active high risks</span>
                  <span className="px-1 py-0.2 rounded bg-rose-50 text-rose-600 font-bold">Critical</span>
                </div>
              </div>
            </div>

            {/* Stage & Gate Status Card */}
            <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs shrink-0 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-extrabold text-slate-800">Stage & Gate Status</span>
                <span className="px-1.5 py-0.5 rounded bg-[#0d9488] text-white text-[5px] font-bold">
                  View Stage Control →
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {["Preparation", "Due Diligence", "Negotiation", "Closing"].map((stage, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md p-1 text-center ${
                      idx === 3
                        ? "border border-[#0d9488] bg-emerald-50/40"
                        : "border border-emerald-200/70 bg-emerald-50/20"
                    }`}
                  >
                    <p className="text-[5.5px] font-bold text-slate-800">{stage}</p>
                    <p className="text-[4.5px] font-semibold text-[#0d9488]">
                      {idx === 3 ? "Deal Complete" : "Completed"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: "Documents", val: "1 / 1" },
                  { label: "Tasks", val: "1 / 1" },
                  { label: "Risks", val: "1 / 1" },
                ].map((chk, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200/70 rounded px-1.5 py-0.5 flex items-center justify-between text-[5px]"
                  >
                    <span className="text-slate-700 font-semibold">
                      {chk.label} <span className="text-slate-400">{chk.val}</span>
                    </span>
                    <span className="text-emerald-600 font-bold">✓ Complete</span>
                  </div>
                ))}
              </div>

              <div className="rounded bg-emerald-50/70 border border-emerald-200/70 px-1.5 py-0.5 flex items-center justify-between text-[5px]">
                <span className="font-bold text-emerald-800">
                  ✓ Ready to Advance Stage <span className="font-normal text-emerald-700">• All Gates Cleared</span>
                </span>
                <span className="font-bold text-[#0d9488]">Resolve Stage Gates ›</span>
              </div>
            </div>

            {/* Bottom 2-Column Section: Needs Attention | Recent Audit Activity */}
            <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
              {/* Needs Attention */}
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between text-[6.5px] font-extrabold text-slate-800 shrink-0">
                  <span>Needs Attention</span>
                  <span className="text-[5px] text-[#0d9488] font-semibold">Review Issues ›</span>
                </div>
                <div className="space-y-0.5 my-0.5">
                  {[
                    { title: "3 High Risks", sub: "Antitrust clearance & IP license", pill: "High", cls: "bg-rose-50 text-rose-600" },
                    { title: "1 Security & Policy Alerts", sub: "Unauthorized doc access probe", pill: "Active", cls: "bg-indigo-50 text-indigo-600" },
                    { title: "0 Gated Tasks", sub: "Escrow funds cleared ($7.5M)", pill: "Cleared", cls: "bg-emerald-50 text-emerald-700" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded px-1.5 py-0.5 flex items-center justify-between gap-1"
                    >
                      <div className="min-w-0">
                        <p className="text-[5.5px] font-bold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[4.5px] text-slate-400 truncate">{item.sub}</p>
                      </div>
                      <span className={`px-1 py-0.2 rounded text-[4.5px] font-bold shrink-0 ${item.cls}`}>
                        {item.pill}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full py-0.5 rounded bg-slate-900 text-white text-[5.5px] font-bold text-center shrink-0">
                  Review Issues →
                </div>
              </div>

              {/* Recent Audit Activity */}
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between text-[6.5px] font-extrabold text-slate-800 shrink-0">
                  <span>Recent Audit Activity</span>
                  <span className="text-[5px] text-[#0d9488] font-semibold">View Audit Trail ›</span>
                </div>
                <div className="space-y-0.5 my-0.5">
                  {auditLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded px-1.5 py-0.5 flex items-center justify-between gap-1"
                    >
                      <div className="min-w-0">
                        <p className="text-[5.5px] font-bold text-slate-800 truncate">
                          {log.user}{" "}
                          <span
                            className={`px-1 rounded text-[4.5px] ${
                              log.role === "Seller"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-sky-50 text-sky-700"
                            }`}
                          >
                            {log.role}
                          </span>
                        </p>
                        <p className="text-[4.5px] text-slate-500 truncate">{log.action}</p>
                      </div>
                      <span className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[4.5px] font-bold shrink-0">
                        Success
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[4.5px] text-slate-400 shrink-0">
                  <span>WORM Compliant • SHA-256 Verified</span>
                  <span className="font-bold text-slate-700">View Full Audit Trail →</span>
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      step: "05",
      shortTitle: "Deal Close",
      symbolLabel: "DMS // CLOSING",
      Icon: Gavel,
      titleLine1: "BIDDING &",
      titleLine2: "DEAL CLOSE",
      fullTitle: "Bidding & Deal Close",
      subtitle: "Competitive Multi-Round Bidding, SPA Execution & Escrow Closing",
      urlPath: "dms/deal-closing",
      buttonText: "Access Bidding Console",
      screenImage: "/images/screen-bidding.png",
      renderScreen: () =>
        roleMode === "seller" ? (
          <div className="w-full h-full bg-[#f8fafc] p-2 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Top Sub-Nav Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 text-[5.5px] shrink-0">
              <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                <span>← Deal Workflow</span>
                <span className="text-[#0d9488] border-b border-[#0d9488] pb-0.5 font-bold">
                  Bidding Ledger
                </span>
                <span>Bid History</span>
                <span>Messages</span>
                <span>Term Sheet</span>
                <span>SPA Agreement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[5px] font-bold text-slate-600 uppercase">
                  Seller Board
                </span>
                <span className="relative text-[7.5px] text-slate-500">
                  🔔
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 text-white text-[4.5px] font-bold flex items-center justify-center">
                    5
                  </span>
                </span>
              </div>
            </div>

            {/* Bidder Header Card */}
            <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-5 h-5 rounded-md bg-[#0f766e] text-white flex items-center justify-center text-[8px] font-bold shrink-0">
                  V
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8.5px] font-extrabold text-slate-900">Vijay</span>
                    <span className="px-1 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[4.5px] font-bold">
                      Accepted
                    </span>
                  </div>
                  <p className="text-[5px] text-slate-400 truncate">
                    AI / Machine Learning • Lead: Vijay • Submitted: 17 Nov 2026
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[5px] font-bold">
                <span className="px-1.5 py-0.5 rounded border border-rose-200 text-rose-600 bg-white">
                  Decline Bid
                </span>
                <span className="px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 bg-white">
                  🔨 Counter Offer
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0f766e] text-white">
                  ✓ Accept & Move to Term Sheet
                </span>
              </div>
            </div>

            {/* Yellow Counter-Offer Banner */}
            <div className="bg-[#fffbeb] border border-amber-200/90 rounded-lg p-1.5 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-4.5 h-4.5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[7px] shrink-0">
                  🔨
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="text-[6px] font-bold text-slate-900 flex items-center gap-1">
                    <span>Active Seller Counter-Offer: $20.0M</span>
                    <span className="px-1 rounded bg-amber-200/70 text-amber-800 text-[4.5px] font-extrabold">
                      DISPATCHED
                    </span>
                  </p>
                  <p className="text-[4.5px] text-amber-800/80 truncate">
                    The seller board is requesting benchmark valuation. • Countered on: 17 Nov 2026, 11:45 am IST
                  </p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-white border border-amber-300 text-amber-800 text-[5px] font-bold shrink-0">
                Revise Counter-Offer
              </span>
            </div>

            {/* 4 Metrics Strip */}
            <div className="grid grid-cols-4 gap-1.5 shrink-0">
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <p className="text-[4.5px] font-bold text-slate-400 uppercase">Asking Benchmark</p>
                <p className="text-[9.5px] font-black text-slate-900 leading-tight mt-0.5">$10.0M</p>
                <p className="text-[4.5px] text-slate-400">Enterprise valuation target</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <p className="text-[4.5px] font-bold text-slate-400 uppercase">Proposed Offer</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9.5px] font-black text-slate-900 leading-tight">$15.0M</span>
                  <span className="px-1 rounded bg-emerald-50 text-emerald-700 text-[4.5px] font-bold">
                    +50% vs Ask
                  </span>
                </div>
                <p className="text-[4.5px] text-slate-400">Binding acquisition price</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <p className="text-[4.5px] font-bold text-slate-400 uppercase">Consideration Structure</p>
                <p className="text-[6.5px] font-extrabold text-slate-800 mt-0.5">50% Cash / 50% Stock</p>
                <div className="w-full h-1 rounded-full overflow-hidden flex mt-1">
                  <div className="w-1/2 bg-[#0d9488]" />
                  <div className="w-1/2 bg-blue-500" />
                </div>
                <div className="flex items-center justify-between text-[4.5px] text-slate-400 mt-0.5">
                  <span>● 50% Cash</span>
                  <span>● 50% Stock</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs">
                <p className="text-[4.5px] font-bold text-slate-400 uppercase">Expected Close</p>
                <p className="text-[9px] font-black text-slate-900 leading-tight mt-0.5">Nov 2026</p>
                <p className="text-[4.5px] text-slate-400">Target execution window</p>
              </div>
            </div>

            {/* Bottom 2-Column Section */}
            <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
              {/* Buyer Commercial Dossier (2 cols) */}
              <div className="col-span-2 bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[6.5px] font-extrabold text-slate-800 border-l-2 border-[#0d9488] pl-1">
                    Buyer Commercial Dossier & Rationale
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[4.5px] font-bold">
                    LOI TERMS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 my-1">
                  <div className="border border-slate-100 rounded p-1 bg-slate-50/50">
                    <p className="text-[4.5px] font-bold text-slate-400 uppercase">Financing Confirmation</p>
                    <p className="text-[5.5px] font-bold text-slate-800 mt-0.5">All equity / balance sheet cash</p>
                  </div>
                  <div className="border border-slate-100 rounded p-1 bg-slate-50/50">
                    <p className="text-[4.5px] font-bold text-slate-400 uppercase">Key Contingencies</p>
                    <p className="text-[5.5px] font-bold text-slate-800 mt-0.5">hgjhgghgh</p>
                  </div>
                </div>
                <div className="border-l-2 border-[#0d9488] bg-slate-50/50 rounded-r p-1">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase">Buyer Strategic Note</p>
                  <p className="text-[5.5px] font-semibold text-slate-700">"bgghghgh"</p>
                </div>
              </div>

              {/* Submitted Documents (1 col) */}
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <span className="text-[6.5px] font-extrabold text-slate-800">• Submitted Documents</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-[#0d9488] text-[4.5px] font-bold">
                    1 File
                  </span>
                </div>
                <div className="border border-slate-200/70 rounded p-1.5 flex items-center justify-between gap-1 bg-slate-50/40">
                  <div className="min-w-0">
                    <p className="text-[5.5px] font-bold text-slate-800 truncate">
                      Sample-Letter-of-Intent...
                    </p>
                    <p className="text-[4.5px] text-slate-400">210 KB</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#0d9488] text-[5px] font-bold shrink-0">
                    View ↗
                  </span>
                </div>
                <div className="flex items-center justify-between text-[4.5px] text-slate-400 pt-1 border-t border-slate-100">
                  <span className="text-emerald-600 font-semibold">✓ NDA Verified Submission</span>
                  <span>17 Nov 2026</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-[#f8fafc] p-2 flex flex-col justify-between select-none font-sans overflow-hidden">
            {/* Top Sub-Nav Bar */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1 text-[5.5px] shrink-0">
              <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                <span>← Deal Workflow</span>
                <span className="text-[#0d9488] border-b border-[#0d9488] pb-0.5 font-bold">
                  My Bid & Proposal
                </span>
                <span>Bid History</span>
                <span>Messages</span>
                <span>Term Sheet</span>
                <span>SPA Agreement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[5px] font-bold text-slate-600 uppercase">
                  Buyer Portal
                </span>
                <span className="text-[7.5px] text-slate-500">🔔</span>
              </div>
            </div>

            {/* 3 KPI Cards */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 text-[#0d9488] flex items-center justify-center text-[8px] font-bold shrink-0">
                  $
                </span>
                <div className="min-w-0">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase truncate">
                    Seller Asking Benchmark
                  </p>
                  <p className="text-[9px] font-black text-slate-900 leading-tight">10.0M</p>
                  <p className="text-[4.5px] text-slate-400 truncate">Enterprise valuation target</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 text-[#0d9488] flex items-center justify-center text-[8px] font-bold shrink-0">
                  ↗
                </span>
                <div className="min-w-0">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase truncate">
                    Your Current Offer
                  </p>
                  <p className="text-[9px] font-black text-[#0d9488] leading-tight">$10.0M</p>
                  <p className="text-[4.5px] text-slate-400 truncate">70% Cash / 30% Stock</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-lg p-1.5 shadow-2xs flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-[7.5px] font-bold shrink-0">
                  📅
                </span>
                <div className="min-w-0">
                  <p className="text-[4.5px] font-bold text-slate-400 uppercase truncate">
                    Submission Deadline
                  </p>
                  <p className="text-[8.5px] font-black text-slate-900 leading-tight">25 Nov 2026</p>
                  <p className="text-[4.5px] text-slate-400 truncate">Bilateral submission window</p>
                </div>
              </div>
            </div>

            {/* Prepare Acquisition Proposal Card */}
            <div className="bg-white border border-slate-200/80 rounded-lg p-2 shadow-2xs flex-1 flex flex-col justify-between min-h-0">
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div>
                  <h4 className="text-[8px] font-extrabold text-slate-900 leading-tight">
                    Prepare Acquisition Proposal
                  </h4>
                  <p className="text-[5px] text-slate-400">
                    Configure your binding acquisition terms, consideration mix, and attached documents.
                  </p>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[5px] font-semibold text-slate-600 shrink-0">
                  Initial binding proposal
                </span>
              </div>

              {/* Row 1: Offer Amount & Expected Close Date */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div>
                  <p className="text-[5px] font-bold text-slate-600 mb-0.5">Offer Amount ($)</p>
                  <div className="border border-slate-200/80 rounded px-1.5 py-1 bg-slate-50/40 text-[6.5px] font-bold text-slate-800 flex items-center gap-1">
                    <span className="text-slate-400">$</span>
                    <span>10000000</span>
                  </div>
                </div>
                <div>
                  <p className="text-[5px] font-bold text-slate-600 mb-0.5">Expected Close Date</p>
                  <div className="border border-slate-200/80 rounded px-1.5 py-1 bg-white text-[6.5px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>25-11-2026</span>
                    <span className="text-slate-400 text-[6px]">📅</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Consideration Structure Slider */}
              <div className="border border-slate-200/70 rounded-md p-1.5 bg-slate-50/30 shrink-0">
                <div className="flex items-center justify-between text-[5.5px] mb-1">
                  <span className="font-bold text-slate-700">Consideration Structure</span>
                  <span className="font-bold text-[#0d9488]">70% Cash / 30% Stock</span>
                </div>
                <div className="relative w-full h-1 rounded-full bg-slate-200 flex items-center">
                  <div className="w-[70%] h-full rounded-full bg-[#0d9488]" />
                  <span className="w-2 h-2 rounded-full bg-[#0d9488] border border-white shadow-xs -ml-1" />
                </div>
                <div className="flex items-center justify-between text-[4.5px] text-slate-400 mt-1">
                  <span>100% Stock</span>
                  <span>50 / 50</span>
                  <span>100% Cash</span>
                </div>
              </div>

              {/* Row 3: Financing Type & Key Contingencies */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <div>
                  <p className="text-[5px] font-bold text-slate-600 mb-0.5">Financing Type</p>
                  <div className="border border-slate-200/80 rounded px-1.5 py-0.5 bg-white text-[6px] font-semibold text-slate-700 flex items-center justify-between">
                    <span>Committed debt + equity</span>
                    <span className="text-slate-400">⌄</span>
                  </div>
                </div>
                <div>
                  <p className="text-[5px] font-bold text-slate-600 mb-0.5">Key Contingencies</p>
                  <div className="border border-slate-200/80 rounded px-1.5 py-0.5 bg-slate-50/40 text-[6px] text-slate-400 h-[18px]" />
                </div>
              </div>

              {/* Row 4: Strategic Note */}
              <div className="shrink-0">
                <p className="text-[5px] font-bold text-slate-600 mb-0.5">Strategic Note to Seller Board</p>
                <div className="border border-slate-200/80 rounded px-1.5 py-1 bg-slate-50/40 text-[5.5px] text-slate-400">
                  Add context on your acquisition proposal, synergies, or conditions...
                </div>
              </div>
            </div>
          </div>
        ),
    },
  ];

  const current = slides[activeSlide];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const moduleCards = [
    {
      idx: 0,
      title: "Market Place",
      desc: "Discover verified buyer-seller opportunities",
      CardIcon: Store,
      iconColor: "text-teal-600",
      activeBorder: "border-teal-400 bg-teal-50/40 ring-2 ring-teal-400/20",
      cornerGrad: "from-teal-100/70",
      arrowBg: "bg-teal-400",
    },
    {
      idx: 1,
      title: "Deal Room",
      desc: "Secure, permission-based virtual data rooms",
      CardIcon: Layers,
      iconColor: "text-violet-600",
      activeBorder: "border-violet-400 bg-violet-50/40 ring-2 ring-violet-400/20",
      cornerGrad: "from-violet-100/70",
      arrowBg: "bg-violet-400",
    },
    {
      idx: 2,
      title: "Task & Workflow",
      desc: "Manage due diligence with structured tasks",
      CardIcon: GitBranch,
      iconColor: "text-emerald-600",
      activeBorder: "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-400/20",
      cornerGrad: "from-emerald-100/70",
      arrowBg: "bg-emerald-400",
    },
    {
      idx: 3,
      title: "Audit & Logs",
      desc: "Track activity, access and compliance in real time",
      CardIcon: ShieldCheck,
      iconColor: "text-amber-500",
      activeBorder: "border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20",
      cornerGrad: "from-amber-100/70",
      arrowBg: "bg-amber-400",
    },
    {
      idx: 4,
      title: "Bidding & Deal Close",
      desc: "Run competitive bidding, negotiations and final closing",
      CardIcon: Gavel,
      iconColor: "text-sky-600",
      activeBorder: "border-sky-400 bg-sky-50/40 ring-2 ring-sky-400/20",
      cornerGrad: "from-sky-100/70",
      arrowBg: "bg-sky-400",
    },
  ];

  const renderModuleCard = (card, extraClass = "") => {
    const isActive = activeSlide === card.idx;
    return (
      <button
        key={card.idx}
        type="button"
        onClick={() => setActiveSlide(card.idx)}
        className={`group relative rounded-2xl transition-all cursor-pointer ${
          isActive
            ? "p-[2px] bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] shadow-lg shadow-[#1f6fb2]/15 scale-[1.02]"
            : "p-[1px] bg-slate-300/80 shadow-sm hover:bg-slate-400/80 hover:-translate-y-0.5"
        } ${extraClass}`}
      >
        <div className="relative overflow-hidden w-full h-full rounded-[14px] p-3.5 sm:p-4 text-center flex flex-col items-center justify-center min-h-[115px] sm:min-h-[125px] bg-white">
          <div className="relative z-10">
            <h3
              className={`text-xs sm:text-[13.5px] font-extrabold leading-tight ${
                isActive ? "text-slate-900" : "text-slate-700"
              }`}
            >
              {card.title}
            </h3>
            {/* Stylish Curved Double-Line Underline */}
            <div className="flex justify-center my-1.5">
              <svg className="w-16 h-3.5" viewBox="0 0 68 14" fill="none">
                <defs>
                  <linearGradient id={`curveGrad-${card.idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1f6fb2" />
                    <stop offset="100%" stopColor="#2ec4b6" />
                  </linearGradient>
                </defs>
                <path
                  d="M 4 6 Q 34 0 64 6"
                  stroke={isActive ? `url(#curveGrad-${card.idx})` : "#cbd5e1"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 11 Q 34 6.5 53 11"
                  stroke={isActive ? `url(#curveGrad-${card.idx})` : "#e2e8f0"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeOpacity={isActive ? "0.85" : "1"}
                />
              </svg>
            </div>
            <p
              className={`text-[9.5px] sm:text-[10.5px] leading-snug ${
                isActive ? "text-slate-600" : "text-slate-500"
              }`}
            >
              {card.desc}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <section className="py-8 md:py-12 w-full bg-transparent relative">
      {/* Section Title (Left-Aligned, No Background) */}
      <div className="w-full md:w-[94%] lg:w-[94%] xl:w-[92%] mx-auto px-4 mb-3" data-aos="fade-up">
        <h2 className="pl-1 sm:pl-2 md:pl-2 text-3xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight text-left">
          DMS Module
        </h2>
      </div>

      {/* ========================================================= */}
      {/* CONTENT: LEFT CONTROLS & RIGHT PC MONITOR                 */}
      {/* ========================================================= */}
      <div className="relative w-full">
        {/* Left-edge vertical gradient accent pill tab spanning from Seller/Buyer to Monitor bottom */}
        <div className="hidden md:block absolute left-0 top-6 lg:top-7 w-5 lg:w-7 h-[415px] lg:h-[435px] bg-gradient-to-b from-[#1f6fb2] to-[#2ec4b6] rounded-r-2xl z-30 shadow-md pointer-events-none" />
        <div className="w-full md:w-[94%] lg:w-[94%] xl:w-[92%] mx-auto px-4">
        <div
          data-aos="fade-up"
          className="relative w-full flex flex-col md:flex-row h-auto md:h-[76vh] md:min-h-[480px] md:max-h-[560px] select-none transition-all duration-500"
        >
          {/* Left Content Column */}
          <div className="relative z-10 w-full md:w-[44%] lg:w-[43%] xl:w-[43%] h-full py-5 sm:py-6 md:py-6 lg:py-7 pl-1 sm:pl-2 md:pl-2 pr-2 sm:pr-3 flex flex-col justify-start shrink-0">
            {/* Top Row: Seller/Buyer Toggle & Double Chevrons (Aligned Straight) */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-[#1f6fb2]/30 shadow-md ring-4 ring-[#2ec4b6]/10 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoleMode("seller")}
                  className={`px-5 sm:px-6 py-2 rounded-xl text-sm font-extrabold tracking-wide transition-all cursor-pointer ${
                    roleMode === "seller"
                      ? "bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] text-white shadow-md shadow-[#1f6fb2]/30 scale-[1.03]"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Seller
                </button>
                <button
                  type="button"
                  onClick={() => setRoleMode("buyer")}
                  className={`px-5 sm:px-6 py-2 rounded-xl text-sm font-extrabold tracking-wide transition-all cursor-pointer ${
                    roleMode === "buyer"
                      ? "bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] text-white shadow-md shadow-[#1f6fb2]/30 scale-[1.03]"
                      : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  Buyer
                </button>
              </div>

              {/* Double Arrow Chevrons (Interactive next button) */}
              <button
                type="button"
                onClick={nextSlide}
                title="Next slide"
                className="text-slate-800 hover:text-[#1f6fb2] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer p-0.5 shrink-0"
              >
                <svg
                  className="w-11 h-6 sm:w-12 sm:h-7 md:w-14 md:h-8"
                  viewBox="0 0 80 44"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1f6fb2" />
                      <stop offset="100%" stopColor="#2ec4b6" />
                    </linearGradient>
                  </defs>
                  <polygon points="12,6 32,22 12,38" fill="url(#arrowGrad)" />
                  <polyline
                    points="22,6 42,22 22,38"
                    stroke="url(#arrowGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon points="46,6 66,22 46,38" fill="url(#arrowGrad)" />
                  <polyline
                    points="56,6 76,22 56,38"
                    stroke="url(#arrowGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* 5 Module Cards Grid (3 Top + 2 Bottom Centered) */}
            <div className="mt-4 flex-1 flex flex-col justify-center gap-2.5 sm:gap-3">
              {/* Top Row: 3 Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {moduleCards.slice(0, 3).map((card) => renderModuleCard(card))}
              </div>

              {/* Bottom Row: 2 Cards Centered */}
              <div className="flex items-stretch justify-center gap-2 sm:gap-2.5">
                {moduleCards.slice(3, 5).map((card) =>
                  renderModuleCard(card, "w-[44%] sm:w-[40%]")
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* Right Column: Real PC Monitor Screen (Interactive UI)    */}
          {/* ========================================================= */}
          <div className="w-full md:w-[56%] lg:w-[57%] xl:w-[57%] h-auto md:h-full relative overflow-hidden flex flex-col items-center md:items-end justify-start pt-5 sm:pt-6 md:pt-6 lg:pt-7 pb-4 pl-4 sm:pl-6 md:pl-8 pr-1 sm:pr-2">
            {/* Monitor + Stand Wrapper (keeps stand centered under monitor) */}
            <div className="w-full max-w-[640px] lg:max-w-[670px] flex flex-col items-center">
            {/* Monitor Outer Shell: Controlled Width & Enhanced Height */}
            <div className="w-full bg-slate-900 border-[6px] sm:border-[7px] md:border-[8px] border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_25px_60px_rgba(15,23,42,0.22)]">
              {/* Top Monitor Bezel with Web Camera & Window Controls */}
              <div className="bg-slate-900 py-1.5 sm:py-2 px-3.5 flex items-center justify-between border-b border-slate-800/90 select-none">
                {/* Window Dots (Red, Yellow, Green) */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-xs" />
                </div>

                {/* Real Browser URL Bar */}
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/60 text-[10px] sm:text-[10.5px] font-mono text-slate-300 max-w-[260px] truncate shadow-inner">
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{current.urlPath}</span>
                </div>

                {/* Webcam Dot with Lens Reflection */}
                <div className="w-2 h-2 rounded-full bg-slate-950 ring-1 ring-slate-700/70" />
              </div>

              {/* PC Screen Display: Compact, snug height */}
              <div
                key={`screen-${activeSlide}`}
                onClick={nextSlide}
                title="Click screen to view next module"
                className="relative bg-[#f8fafc] w-full h-[275px] sm:h-[300px] md:h-[325px] lg:h-[340px] overflow-hidden cursor-pointer group animate-screenFade p-2 sm:p-2.5 md:p-3 flex flex-col justify-between"
              >
                {/* Active Module Screen Content: Skeleton UI */}
                {current.renderScreen()}

                {/* Subtle Interactive Screen Hover Prompt */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition-colors pointer-events-none flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-md bg-slate-900/90 text-white text-[9px] font-mono backdrop-blur-xs shadow-md">
                    Click to switch PC screen →
                  </span>
                </div>
              </div>

              {/* Monitor Bottom Bezel Chin */}
              <div className="h-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-800" />
            </div>

            {/* Aluminum Monitor Stand Base */}
            <div className="hidden sm:flex flex-col items-center pointer-events-none -mt-[1px]">
              <div className="w-14 h-2.5 bg-gradient-to-b from-slate-700 to-slate-800 shadow-xs" />
              <div className="w-32 h-1.5 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 rounded-full shadow-md" />
            </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Scoped CSS Animations for Smooth Transitions */}
      <style jsx>{`
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInSub {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes screenFade {
          0% {
            opacity: 0.4;
            transform: scale(0.98);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slideText {
          animation: slideInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideSub {
          animation: slideInSub 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
        }
        .animate-screenFade {
          animation: screenFade 0.35s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
