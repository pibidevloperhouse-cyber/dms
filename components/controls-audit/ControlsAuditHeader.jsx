"use client";

import React from "react";
import { ShieldCheck, Briefcase } from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";

export default function ControlsAuditHeader() {
  const { activeDeal } = useControlsAudit();

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-3.5 shrink-0 font-sans shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand / Module Identifier */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center text-white shadow-md shadow-[var(--brand)]/20 shrink-0">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-extrabold text-slate-900 tracking-tight">
                Controls & Audit
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand-50)] text-[var(--brand)] border border-[var(--brand)]/20">
                DMS Governance
              </span>
            </div>
            
          </div>
        </div>

        {/* Active Deal Context (Strictly Scoped - No Dropdown) */}
        {activeDeal && activeDeal.name && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
              <Briefcase size={14} className="text-[var(--brand)] shrink-0" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                Active Deal:
              </span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                {activeDeal.name} {activeDeal.projectName ? `(${activeDeal.projectName})` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
