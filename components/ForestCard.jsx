"use client";

import { useState } from "react";
import { Store, ShieldCheck, CheckSquare, FileText, Gavel, ArrowRight, Lock } from "lucide-react";

export default function ForestCard() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      step: "01",
      shortTitle: "Marketplace",
      symbolLabel: "DMS // MARKETPLACE",
      Icon: Store,
      titleLine1: "MARKET",
      titleLine2: "PLACE",
      fullTitle: "Market Place",
      subtitle: "Curated M&A Opportunities & Verified Buyer-Seller Discovery",
      urlPath: "dms.pibi.tech/marketplace",
      buttonText: "Explore Marketplace",
      renderScreen: () => (
        <div className="w-full h-full bg-[#f8fafc] p-2 sm:p-2.5 md:p-3 flex flex-col justify-between select-none font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#00c875] flex items-center justify-center text-white text-[9.5px] font-bold shadow-2xs">D</span>
              <span className="text-[12px] font-bold text-slate-800">Find Buyers</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              6 Active Buyers
            </span>
          </div>

          {/* Cards Grid: 3 Skeleton Cards Side-by-Side (Compact & Snug) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-1.5 overflow-hidden flex-1">
            {/* Card 1 Skeleton */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#1f6fb2] text-white flex items-center justify-center text-[8px] font-bold shrink-0">BA</span>
                    <div className="h-2.5 w-14 sm:w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <span className="text-[7.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">9.9/10</span>
                </div>
                {/* Tags */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200/50">Growth</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Corp Dev</span>
                </div>
                {/* Shimmer skeleton lines */}
                <div className="space-y-1 mt-2">
                  <div className="h-2 w-full bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-2 w-4/5 bg-slate-200/60 rounded animate-pulse" />
                </div>
              </div>

              {/* Stats & Explore Button */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[7px] text-slate-400">
                  <span className="truncate">India • Majority</span>
                  <span className="text-[#1f6fb2] font-bold shrink-0">Strong ↗</span>
                </div>
                <div className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] text-white text-[7.5px] font-bold text-center shadow-2xs hover:opacity-95 transition-opacity">
                  Explore company ↗
                </div>
              </div>
            </div>

            {/* Card 2 Skeleton */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-teal-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0">BH</span>
                    <div className="h-2.5 w-14 sm:w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <span className="text-[7.5px] font-bold text-[#1f6fb2] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">9.2/10</span>
                </div>
                {/* Tags */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200/50">Growth</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Corp Dev</span>
                </div>
                {/* Shimmer skeleton lines */}
                <div className="space-y-1 mt-2">
                  <div className="h-2 w-full bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-2 w-4/5 bg-slate-200/60 rounded animate-pulse" />
                </div>
              </div>

              {/* Stats & Explore Button */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[7px] text-slate-400">
                  <span className="truncate">India • Series C</span>
                  <span className="text-[#1f6fb2] font-bold shrink-0">Strong ↗</span>
                </div>
                <div className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] text-white text-[7.5px] font-bold text-center shadow-2xs hover:opacity-95 transition-opacity">
                  Explore company ↗
                </div>
              </div>
            </div>

            {/* Card 3 Skeleton */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0">BH</span>
                    <div className="h-2.5 w-14 sm:w-16 bg-slate-200 rounded animate-pulse" />
                  </div>
                  <span className="text-[7.5px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/50">8.5/10</span>
                </div>
                {/* Tags */}
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold border border-cyan-200/50">Growth</span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Corp Dev</span>
                </div>
                {/* Shimmer skeleton lines */}
                <div className="space-y-1 mt-2">
                  <div className="h-2 w-full bg-slate-200/80 rounded animate-pulse" />
                  <div className="h-2 w-4/5 bg-slate-200/60 rounded animate-pulse" />
                </div>
              </div>

              {/* Stats & Explore Button */}
              <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[7px] text-slate-400">
                  <span className="truncate">Global • Series C</span>
                  <span className="text-[#1f6fb2] font-bold shrink-0">Strong ↗</span>
                </div>
                <div className="mt-1.5 w-full py-1.5 rounded-lg bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] text-white text-[7.5px] font-bold text-center shadow-2xs hover:opacity-95 transition-opacity">
                  Explore company ↗
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Filter Banner */}
          <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-[7.5px] sm:text-[8px] text-slate-500">
            <span>Filter: SaaS • $5M-$20M • NDA Protected</span>
            <span className="font-bold text-emerald-600">32 Matched</span>
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
      urlPath: "dms.pibi.tech/deal-room",
      buttonText: "Enter Deal Room",
      screenImage: "/images/screen-dealroom.png",
      renderScreen: () => (
        <div className="w-full h-full bg-[#0f172a] p-2.5 sm:p-3 flex flex-col justify-between text-white select-none relative overflow-hidden font-sans">
          {/* Subtle Watermark Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none rotate-[-25deg] text-3xl font-black">
            CONFIDENTIAL // VDR
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold text-slate-100">Project Titan VDR</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              AES-256 ENCRYPTED
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 my-auto z-10">
            <div className="p-2 sm:p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-amber-400/50 transition-colors">
              <div className="flex items-center gap-1.5 text-amber-400 text-[9.5px] sm:text-[10px] font-bold">
                📁 01_Financial_Models
              </div>
              <p className="text-[7.5px] sm:text-[8px] text-slate-400 mt-1">18 Verified Docs • Audited P&L</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-sky-400/50 transition-colors">
              <div className="flex items-center gap-1.5 text-sky-400 text-[9.5px] sm:text-[10px] font-bold">
                📁 02_Legal_Contracts
              </div>
              <p className="text-[7.5px] sm:text-[8px] text-slate-400 mt-1">12 Executed NDAs & Bylaws</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-emerald-400/50 transition-colors">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[9.5px] sm:text-[10px] font-bold">
                📁 03_IP_&_Patents
              </div>
              <p className="text-[7.5px] sm:text-[8px] text-slate-400 mt-1">24 Architecture Schematics</p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-purple-400/50 transition-colors">
              <div className="flex items-center gap-1.5 text-purple-400 text-[9.5px] sm:text-[10px] font-bold">
                📁 04_Tax_&_CapTable
              </div>
              <p className="text-[7.5px] sm:text-[8px] text-slate-400 mt-1">Shareholder Equity Matrix</p>
            </div>
          </div>

          <div className="p-1 rounded bg-slate-800/50 border border-slate-700/40 flex items-center justify-between text-[8px] text-slate-400 z-10">
            <span>Watermark: USER_VISHWA_RAJ • IP: 103.24.x</span>
            <span className="text-emerald-400 font-bold">Full Access</span>
          </div>
        </div>
      ),
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
      urlPath: "dms.pibi.tech/deal-workflow",
      buttonText: "Open Task Pipeline",
      screenImage: "/images/screen-workflow.png",
      renderScreen: () => (
        <div className="w-full h-full bg-[#f8fafc] p-2.5 sm:p-3 flex flex-col justify-between select-none font-sans">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5">
            <span className="text-[11px] font-bold text-slate-900">M&A Deal Milestones</span>
            <span className="text-[9px] font-bold text-[#1f6fb2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Stage 3 of 4 Active
            </span>
          </div>

          <div className="space-y-1.5 my-1.5">
            <div className="p-1.5 rounded-lg bg-white border border-emerald-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold">✓</span>
                <div>
                  <p className="text-[9px] font-bold text-slate-800">Due Diligence Audit Phase</p>
                  <p className="text-[7px] text-slate-400">All 14 items confirmed by Seller</p>
                </div>
              </div>
              <span className="text-[8px] font-bold text-emerald-600">COMPLETED</span>
            </div>

            <div className="p-1.5 rounded-lg bg-white border border-blue-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold">⚡</span>
                <div>
                  <p className="text-[9px] font-bold text-slate-800">CIM & Adjusted EBITDA Review</p>
                  <p className="text-[7px] text-slate-400">Assigned to Lead M&A Advisor</p>
                </div>
              </div>
              <span className="text-[8px] font-bold text-[#1f6fb2] animate-pulse">IN PROGRESS</span>
            </div>

            <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[9px]">⏳</span>
                <div>
                  <p className="text-[9px] font-bold text-slate-600">Final SPA Drafting & Escrow</p>
                  <p className="text-[7px] text-slate-400">Scheduled upon Offer Approval</p>
                </div>
              </div>
              <span className="text-[8px] text-slate-400">PENDING</span>
            </div>
          </div>

          <div className="p-1 rounded bg-slate-100 flex items-center justify-between text-[8px] text-slate-500">
            <span>Automated Approvals: 8/10 Passed</span>
            <span className="font-bold text-[#1f6fb2]">80% Complete</span>
          </div>
        </div>
      ),
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
      urlPath: "dms.pibi.tech/control-audits",
      buttonText: "View Audit Trail",
      screenImage: "/images/screen-audit.png",
      renderScreen: () => (
        <div className="w-full h-full bg-[#0a0f1d] p-2.5 sm:p-3 flex flex-col justify-between text-slate-200 select-none font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              LIVE AUDIT TRAIL
            </span>
            <span className="text-[8px] text-slate-400">IMMUTABLE LOGS</span>
          </div>

          <div className="space-y-1 my-1.5 text-[8px]">
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-400">12:44:10</span>
              <span className="text-slate-200 font-bold">NDA_SIGNED_EXECUTED</span>
              <span className="text-slate-400">Banu Mathi</span>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-cyan-400">12:30:05</span>
              <span className="text-slate-200 font-bold">DOC_WATERMARK_EXPORT</span>
              <span className="text-slate-400">Financials.pdf</span>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-amber-400">12:15:22</span>
              <span className="text-slate-200 font-bold">PERMISSIONS_UPGRADE</span>
              <span className="text-slate-400">Tier 2 Granted</span>
            </div>
            <div className="p-1 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">11:58:40</span>
              <span className="text-slate-200 font-bold">AUTH_SESSION_2FA</span>
              <span className="text-slate-400">IP 103.24.xx</span>
            </div>
          </div>

          <div className="p-1 rounded bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-[7px] text-cyan-300">
            <span>SHA-256 HASH VERIFIED</span>
            <span className="text-emerald-400">ZERO COMPLIANCE ALERTS</span>
          </div>
        </div>
      ),
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
      urlPath: "dms.pibi.tech/deal-closing",
      buttonText: "Access Bidding Console",
      screenImage: "/images/screen-bidding.png",
      renderScreen: () => (
        <div className="w-full h-full bg-[#f8fafc] p-2.5 sm:p-3 flex flex-col justify-between select-none font-sans">
          <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5">
            <span className="text-[11px] font-bold text-slate-900">Bidding Round 2 & Closing</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Round Active (24h)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 my-1.5">
            <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[8px] font-bold text-slate-400 block uppercase">Top Binding Offer</span>
              <span className="text-sm font-black text-slate-900">₹18.5 Cr</span>
              <span className="text-[8px] text-emerald-600 block mt-0.5 font-semibold">100% Cash at Close</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-[8px] font-bold text-slate-400 block uppercase">SPA Execution</span>
              <span className="text-sm font-black text-emerald-600">2 / 2 Signed</span>
              <span className="text-[8px] text-slate-500 block mt-0.5">Escrow Deposit Confirmed</span>
            </div>
          </div>

          <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between text-[9px] font-bold shadow-xs">
            <span>🎉 Ready for Definitive Settlement</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">EXECUTE →</span>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[activeSlide];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="py-8 md:py-12 w-full bg-white relative">
      {/* ========================================================= */}
      {/* 1. 3D DIGITAL WAVE (FULL WIDTH, 3D ISOMETRIC STEP DESIGN) */}
      {/* ========================================================= */}
      <div className="w-full px-3 sm:px-6 md:px-8 lg:px-10 mb-8">
        <div
          className="w-full overflow-x-auto pb-3 scrollbar-none"
          data-aos="fade-down"
        >
          <div className="relative min-w-[760px] w-full h-22 sm:h-24 md:h-26 select-none">
            {/* SVG 3D Isometric Digital Wave */}
            <svg
              className="w-full h-full"
              viewBox="0 0 1020 90"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* User Requested: linear-gradient(135deg, #1f6fb2, #2ec4b6) */}
                <linearGradient id="waveLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1f6fb2" />
                  <stop offset="100%" stopColor="#2ec4b6" />
                </linearGradient>

                {/* 3D Shading Gradients harmonized with #1f6fb2 and #2ec4b6 */}
                <linearGradient id="topSurfaceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="rightRiserGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1f6fb2" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0f4973" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="leftRiserGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2ec4b6" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f0fdfa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ccfbf1" stopOpacity="0.5" />
                </linearGradient>
                <filter id="shadow3D" x="-5%" y="-5%" width="115%" height="135%">
                  <feDropShadow dx="2" dy="8" stdDeviation="6" floodColor="#1f6fb2" floodOpacity="0.18" />
                </filter>
              </defs>

              <g filter="url(#shadow3D)">
                {/* 3D Top Surfaces (Treads - Elevated High Boxes) */}
                <polygon points="0,14 14,4 214,4 200,14" fill="url(#topSurfaceGrad)" stroke="#7dd3fc" strokeWidth="1.2" strokeOpacity="0.6" />
                <polygon points="400,14 414,4 614,4 600,14" fill="url(#topSurfaceGrad)" stroke="#7dd3fc" strokeWidth="1.2" strokeOpacity="0.6" />
                <polygon points="800,14 814,4 1014,4 1000,14" fill="url(#topSurfaceGrad)" stroke="#7dd3fc" strokeWidth="1.2" strokeOpacity="0.6" />

                {/* 3D Valley Floors (Recessed Low Gaps) */}
                <polygon points="200,74 214,84 414,84 400,74" fill="url(#floorGrad)" stroke="#5eead4" strokeWidth="1.2" strokeOpacity="0.6" />
                <polygon points="600,74 614,84 814,84 800,74" fill="url(#floorGrad)" stroke="#5eead4" strokeWidth="1.2" strokeOpacity="0.6" />

                {/* 3D Right-side Drop Walls (Risers - exactly in user's crop) */}
                <polygon points="200,14 214,4 214,84 200,74" fill="url(#rightRiserGrad)" stroke="#1a5a8f" strokeWidth="1.5" />
                <polygon points="600,14 614,4 614,84 600,74" fill="url(#rightRiserGrad)" stroke="#1a5a8f" strokeWidth="1.5" />
                <polygon points="1000,14 1014,4 1014,84 1000,74" fill="url(#rightRiserGrad)" stroke="#1a5a8f" strokeWidth="1.5" />

                {/* 3D Left-side Rising Walls */}
                <polygon points="400,74 414,84 414,4 400,14" fill="url(#leftRiserGrad)" stroke="#1f8b85" strokeWidth="1.5" />
                <polygon points="800,74 814,84 814,4 800,14" fill="url(#leftRiserGrad)" stroke="#1f8b85" strokeWidth="1.5" />

                {/* Front Primary Square Wave Line with linear-gradient(135deg, #1f6fb2, #2ec4b6) */}
                <path
                  d="M 0,74 V 14 H 200 V 74 H 400 V 14 H 600 V 74 H 800 V 14 H 1000 V 74"
                  stroke="url(#waveLineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </g>
            </svg>

            {/* Titles placed directly inside the alternating 3D Boxes & Gaps */}
            {slides.map((slide, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                style={{
                  left: `${idx * 20}%`,
                  width: "20%",
                }}
                className="absolute top-2.5 h-[64px] sm:h-[68px] flex items-center justify-center cursor-pointer group"
                title={slide.fullTitle}
              >
                <div
                  className={`w-full h-full flex flex-col items-center justify-center px-2 text-center transition-all ${idx === activeSlide
                    ? "scale-[1.05]"
                    : "opacity-80 hover:opacity-100"
                    }`}
                >
                  <span
                    className={`text-[10px] sm:text-[11px] font-mono leading-none ${idx === activeSlide ? "text-[#1f6fb2] font-black" : "text-slate-400"
                      }`}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs md:text-sm lg:text-[14px] leading-tight line-clamp-2 mt-1 ${idx === activeSlide
                      ? "text-[#0f3b5f] font-black drop-shadow-sm"
                      : "text-slate-600 hover:text-slate-950 font-semibold"
                      }`}
                  >
                    {slide.fullTitle}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THE CARD: WIDER WIDTH & 80% HEIGHT                     */}
      {/* ========================================================= */}
      <div className="w-full md:w-[88%] lg:w-[88%] xl:w-[86%] mx-auto px-4">
        <div
          data-aos="fade-up"
          className="relative w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/90 bg-[#f4f7fc] flex flex-col md:flex-row h-auto md:h-[76vh] md:min-h-[480px] md:max-h-[560px] select-none transition-all duration-500"
        >
          {/* Subtle Digital Circuit Overlay on Card Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-25 overflow-hidden">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="digitalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f6fb2" strokeWidth="0.5" strokeOpacity="0.25" />
                  <circle cx="0" cy="0" r="1" fill="#1f6fb2" fillOpacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#digitalGrid)" />
              {/* Digital Circuit traces */}
              <path d="M 0 80 H 90 L 130 120 H 250 L 290 160" fill="none" stroke="#1f6fb2" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="6 3" />
              <circle cx="90" cy="80" r="2.5" fill="#1f6fb2" />
              <circle cx="250" cy="120" r="2.5" fill="#1f6fb2" />
              <circle cx="290" cy="160" r="3" fill="#1f6fb2" />
              <path d="M 40 380 H 180 L 220 340 H 340" fill="none" stroke="#2ec4b6" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="5 3" />
              <circle cx="180" cy="380" r="2" fill="#2ec4b6" />
              <circle cx="340" cy="340" r="2.5" fill="#2ec4b6" />
            </svg>
          </div>

          {/* Left accent vertical pill tab (Harmonized gradient) */}
          <div className="absolute left-0 top-[28%] -translate-y-1/2 w-3 sm:w-4 md:w-5 h-24 sm:h-28 md:h-32 bg-gradient-to-b from-[#1f6fb2] to-[#2ec4b6] rounded-r-2xl z-30 shadow-md pointer-events-none" />

          {/* Left Content Column */}
          <div className="relative z-10 w-full md:w-[38%] lg:w-[37%] xl:w-[36%] h-full p-5 sm:p-6 md:p-6 lg:p-7 pr-3 sm:pr-4 flex flex-col justify-between bg-gradient-to-r from-white via-[#f8fafc] to-[#f4f7fc] shrink-0">
            {/* Top Row: Digital Symbol & Double Chevrons */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Digital Symbol Badge */}
              <div
                key={`badge-${activeSlide}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/90 shadow-sm hover:border-[#1f6fb2]/40 transition-all duration-300 animate-slideSub"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ec4b6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ec4b6]"></span>
                </span>
                <current.Icon className="w-3.5 h-3.5 text-[#1f6fb2] animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-slate-800 uppercase">
                  {current.symbolLabel}
                </span>
              </div>

              {/* Double Arrow Chevrons (Interactive next button) */}
              <button
                type="button"
                onClick={nextSlide}
                title="Next slide"
                className="text-slate-800 hover:text-[#1f6fb2] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer p-0.5"
              >
                <svg
                  className="w-10 h-5 sm:w-11 sm:h-6 md:w-12 md:h-7"
                  viewBox="0 0 80 44"
                  fill="none"
                >
                  <polygon points="12,6 32,22 12,38" fill="currentColor" />
                  <polyline
                    points="22,6 42,22 22,38"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon points="46,6 66,22 46,38" fill="currentColor" />
                  <polyline
                    points="56,6 76,22 56,38"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Middle Section: Animated Big Bold Title & Subtitle & Buttons */}
            <div
              key={activeSlide}
              className="my-auto py-1 transition-all duration-500 animate-slideText"
            >
              <h2 className="text-2xl sm:text-3xl md:text-[36px] lg:text-[42px] font-black text-slate-900 uppercase tracking-tight leading-[1.05] drop-shadow-sm font-sans">
                {current.titleLine1}
                <br />
                <span className="bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] bg-clip-text text-transparent">
                  {current.titleLine2}
                </span>
              </h2>
              <p className="mt-2 text-xs sm:text-[12.5px] lg:text-[13px] text-slate-600 font-medium tracking-normal leading-relaxed animate-slideSub">
                {current.subtitle}
              </p>

              {/* Requested Action Button: Controls & reflects real PC screen */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={nextSlide}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] shadow-md hover:shadow-lg hover:shadow-[#1f6fb2]/25 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer group"
                >
                  <span>{current.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200/80 px-2 py-1 rounded-md">
                  0{activeSlide + 1} / 05
                </span>
              </div>

              {/* 5 Quick Stage Switcher Pills */}
              <div className="mt-2.5 flex flex-wrap gap-1 pt-2 border-t border-slate-200/70">
                {slides.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[8.5px] sm:text-[9px] font-semibold transition-all cursor-pointer ${activeSlide === idx
                      ? "bg-[#1f6fb2] text-white shadow-2xs scale-105"
                      : "bg-white/80 text-slate-500 hover:text-slate-900 hover:bg-white"
                      }`}
                  >
                    {s.shortTitle}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-0.5" />
          </div>

          {/* ========================================================= */}
          {/* Right Column: Real PC Monitor Screen (Interactive UI)    */}
          {/* ========================================================= */}
          <div className="w-full md:w-[62%] lg:w-[63%] xl:w-[64%] h-auto md:h-full relative overflow-hidden flex flex-col items-center justify-start pt-5 sm:pt-6 md:pt-6 lg:pt-7 pb-4 px-2 sm:px-3 md:px-4 bg-[#f4f7fc]">
            {/* Monitor Outer Shell: Controlled Width & Enhanced Height */}
            <div className="w-full max-w-[640px] lg:max-w-[670px] bg-slate-900 border-[6px] sm:border-[7px] md:border-[8px] border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_25px_60px_rgba(15,23,42,0.22)]">
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
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-1.5 px-4 flex items-center justify-between border-t border-slate-800 text-[8.5px] font-mono tracking-widest text-slate-400 select-none">
                <span className="opacity-75">PIBI DEAL CONSOLE</span>
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>

            {/* Aluminum Monitor Stand Base */}
            <div className="hidden sm:flex flex-col items-center pointer-events-none -mt-[1px]">
              <div className="w-14 h-2.5 bg-gradient-to-b from-slate-700 to-slate-800 shadow-xs" />
              <div className="w-32 h-1.5 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 rounded-full shadow-md" />
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
