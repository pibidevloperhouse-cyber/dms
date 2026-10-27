"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Milestone,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  ListTodo,
  Clock,
  ExternalLink,
  Info,
  X,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  RiskBadge,
} from "@/components/controls-audit/shared";
import ModalPortal from "@/components/ui/ModalPortal";

export default function StageControlPage() {
  const router = useRouter();
  const {
    activeDeal,
    stages,
    currentStage,
    gates,
    isReadyToAdvance,
    currentBlockers,
    kpis,
    resolveStageGateCondition,
    advanceDealStage,
    showToast,
  } = useControlsAudit();

  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedStageTab, setSelectedStageTab] = useState(currentStage.id);

  const displayedStage = stages.find((s) => s.id === selectedStageTab) || currentStage;

  const handleAdvanceClick = () => {
    if (!isReadyToAdvance) {
      setShowBlockedModal(true);
    } else {
      setShowAdvanceModal(true);
    }
  };

  const confirmAdvancement = () => {
    advanceDealStage();
    setShowAdvanceModal(false);
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case "documents":
        return <FileCheck2 size={16} className="text-emerald-600" />;
      case "tasks":
        return <ListTodo size={16} className="text-blue-600" />;
      case "risks":
        return <AlertTriangle size={16} className="text-rose-600" />;
      case "approvals":
        return <Clock size={16} className="text-amber-600" />;
      default:
        return <Milestone size={16} className="text-[var(--brand)]" />;
    }
  };

  const getSourceModuleLink = (source) => {
    switch (source) {
      case "documents":
        return { label: "Go to Documents Module", href: "/documents" };
      case "tasks":
        return { label: "Go to Tasks & Workflow", href: "/tasks" };
      case "risks":
        return { label: "View Risks & Alerts", href: "/control-audits/risks-alerts" };
      case "approvals":
        return { label: "Open Approvals Chains", href: "/control-audits/approvals" };
      default:
        return { label: "View Module", href: "/control-audits" };
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-7">
      {/* ── HEADER ── */}
      <PageHeader
        title="Stage & Gate Control"
        // subtitle="Manage deal stage transitions, enforce gate satisfaction rules across documents, tasks, risks, and approvals, and control advancement."
        badge={
          <StatusBadge
            status={isReadyToAdvance ? "completed" : "blocked"}
            label={isReadyToAdvance ? "Ready to Advance" : "Advancement Blocked"}
            size="sm"
          />
        }
        actions={
          <div className="flex items-center gap-3">
            {/* Resolution Helper for Demo/Product Testing */}
            {!isReadyToAdvance && (
              <button
                onClick={() => {
                  resolveStageGateCondition("risks");
                  resolveStageGateCondition("approvals");
                }}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Sign off outstanding risks and approvals in mock state"
              >
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Resolve Pending Gates</span>
              </button>
            )}

            <button
              onClick={handleAdvanceClick}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer ${
                isReadyToAdvance
                  ? "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white ring-2 ring-[var(--brand)]/30"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              <span>Request to Advance Stage</span>
              <ArrowRight size={14} />
            </button>
          </div>
        }
      />

      {/* ── A. 5 STAGE STEPPER ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          {/* <div>
            <h3 className="text-sm font-bold text-slate-900">
              Transaction Lifecycle Stepper
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current Deal: <span className="font-semibold text-slate-700">{activeDeal.name}</span> • Target Close: {activeDeal.targetCloseDate}
            </p>
          </div> */}
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            Stage {stages.findIndex((s) => s.isCurrent) + 1} of {stages.length}
          </span>
        </div>

        {/* Stepper track */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {stages.map((stage, idx) => {
            const isSelected = stage.id === selectedStageTab;
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.isCurrent;
            const isLocked = stage.status === "locked";

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStageTab(stage.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-[var(--brand)] bg-[var(--brand-50)]/40 shadow-xs ring-1 ring-[var(--brand)]/20"
                    : isCurrent
                    ? "border-[var(--brand)]/60 bg-white"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[var(--brand)] text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </span>
                    <StatusBadge
                      status={stage.status}
                      label={isCurrent ? "Current" : stage.status === "completed" ? "Done" : "Locked"}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {stage.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>{isCompleted ? `Passed ${stage.completedAt}` : isCurrent ? "Active Stage" : "Locked"}</span>
                  {isSelected && <span className="text-[var(--brand)] font-bold">Selected</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── B & C. GATE CHECKLIST & BLOCKERS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gate Checklist (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Milestone className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {displayedStage.name} — Mandatory Gate Conditions
                </h3>
              </div>
              <StatusBadge
                status={displayedStage.status === "completed" ? "completed" : isReadyToAdvance ? "completed" : "blocked"}
                size="sm"
              />
            </div>
            {/* <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Stage gates enforce non-negotiable governance policies. Milestones must be 100% satisfied before counterparty advancement is authorized.
            </p> */}

            {/* Checklist Table / Rows */}
            <div className="space-y-3.5">
              {(displayedStage.gates || gates).map((gate) => {
                const isComplete = gate.status === "completed";
                const isBlocked = gate.status === "blocked";
                const moduleLink = getSourceModuleLink(gate.source);

                return (
                  <div
                    key={gate.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isComplete
                        ? "border-emerald-200 bg-emerald-50/40"
                        : isBlocked
                        ? "border-rose-200 bg-rose-50/40"
                        : "border-amber-200 bg-amber-50/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isComplete
                              ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                              : isBlocked
                              ? "bg-rose-100 border-rose-300 text-rose-700"
                              : "bg-amber-100 border-amber-300 text-amber-700"
                          }`}
                        >
                          {getSourceIcon(gate.source)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {gate.title}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              Source: {gate.source.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {gate.requirement}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800">
                            {gate.satisfied} / {gate.total}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {Math.round((gate.satisfied / gate.total) * 100)}% satisfied
                          </span>
                        </div>
                        <StatusBadge status={gate.status} size="sm" />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <p className="text-[11px] text-slate-600 font-medium">
                        <span className="font-bold">Audit Status:</span> {gate.details}
                      </p>
                      <Link
                        href={moduleLink.href}
                        className="text-[11px] font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>{moduleLink.label}</span>
                        <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Evaluation Engine: Verified Clean</span>
            <span>Policy: Pol-004 Enforced</span>
          </div>
        </div>

        {/* Blocker & Readiness Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Readiness Card */}
          <div
            className={`border rounded-2xl p-6 shadow-xs flex flex-col justify-between ${
              isReadyToAdvance
                ? "bg-emerald-50/60 border-emerald-200"
                : "bg-rose-50/60 border-rose-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                {isReadyToAdvance ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={20} className="text-rose-600" />
                )}
                <h3
                  className={`text-sm font-bold ${
                    isReadyToAdvance ? "text-emerald-900" : "text-rose-900"
                  }`}
                >
                  {isReadyToAdvance ? "Ready to Advance" : "Not Ready to Advance"}
                </h3>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isReadyToAdvance ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isReadyToAdvance
                  ? "All mandatory documents, task signoffs, risk reviews, and signatory approval chains are 100% satisfied. Advancement to Stage 4: Bidding is authorized."
                  : `Stage advancement is currently blocked. ${currentBlockers.length} conditions must be resolved before proceeding to Bidding.`}
              </p>

              {/* Exact Blocker List */}
              {!isReadyToAdvance && (
                <div className="mt-4 space-y-2.5">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                    Unsatisfied Blocker Conditions ({currentBlockers.length}):
                  </div>
                  {currentBlockers.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-rose-200 rounded-xl text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900">{b.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">
                          {b.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">{b.description}</p>
                      <Link
                        href={b.link}
                        className="text-[11px] font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        <span>Resolve in {b.source}</span>
                        <ArrowRight size={10} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200/60">
              <button
                onClick={handleAdvanceClick}
                className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isReadyToAdvance
                    ? "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white shadow-md"
                    : "bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/50"
                }`}
              >
                <span>{isReadyToAdvance ? "Proceed to Stage 4" : "Inspect Blocker Resolution"}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Policy Information Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--brand)]" />
              <h4 className="text-xs font-bold text-slate-800">
                Stage Advancement Governance Policy
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Policy <span className="font-mono text-slate-700">POL-004</span> mandates that milestone and stage-gate tasks possess blocking authority. Deal Administrators cannot override unmitigated high risks without legal partner signoff.
            </p>
            <div className="text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2 flex justify-between">
              <span>Authority: Victoria Sterling</span>
              <span className="text-slate-500 font-semibold">
                Enforced by Stage Gate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: ADVANCEMENT BLOCKED MODAL ── */}
      {showBlockedModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans">
            <div
              onClick={() => setShowBlockedModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stage Advancement Blocked
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold">
                    Cannot advance to Stage 4: Approvals
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                The transaction cannot advance because <span className="font-bold">{currentBlockers.length} mandatory gate conditions</span> remain unsatisfied under DMS Stage Policy:
              </p>

              <div className="space-y-2">
                {currentBlockers.map((b, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <p className="font-bold text-slate-800">{b.title}</p>
                    <p className="text-[11px] text-slate-500">{b.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    resolveStageGateCondition("risks");
                    resolveStageGateCondition("approvals");
                    setShowBlockedModal(false);
                  }}
                  className="text-xs font-semibold text-[var(--brand)] hover:underline"
                >
                  Resolve all gates now
                </button>
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close & Resolve Blockers
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ── MODAL: CONFIRM STAGE ADVANCEMENT ── */}
      {showAdvanceModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 font-sans">
            <div
              onClick={() => setShowAdvanceModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            />
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Advance Transaction Stage
                  </h3>
                  <p className="text-xs text-emerald-700 font-semibold">
                    All 4 gate conditions 100% satisfied
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                You are authorizing the advancement of <span className="font-bold">{activeDeal.name}</span> from <span className="font-bold text-slate-800">Stage 3: Negotiation</span> to <span className="font-bold text-[var(--brand)]">Stage 4: Bidding</span>.
              </p>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Verified Gate Checklist:</span>
                </div>
                <p className="text-[11px] text-emerald-700">✓ 18/18 Documents requested verified</p>
                <p className="text-[11px] text-emerald-700">✓ 24/24 Milestone tasks completed</p>
                <p className="text-[11px] text-emerald-700">✓ 5/5 High risks reviewed and mitigated</p>
                <p className="text-[11px] text-emerald-700">✓ 3/3 Core signatory approvals obtained</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 text-xs">
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdvancement}
                  className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Advance Stage
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
