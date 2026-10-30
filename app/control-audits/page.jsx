"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Milestone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Lock,
  FileCheck2,
  ListTodo,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  RiskBadge,
  AuditEventRow,
  DetailDrawer,
  formatAuditDate,
} from "@/components/controls-audit/shared";

export default function ControlsAuditOverviewPage() {
  const router = useRouter();
  const {
    activeDeal,
    currentStage,
    stages,
    gates,
    isReadyToAdvance,
    currentBlockers,
    kpis,
    auditLogs,
    risks,
    approvals,
    selectedSide,
    setSelectedSide,
    callerSide,
    sideCounts,
  } = useControlsAudit();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Latest 4-5 audit events from centralized state
  const recentAuditEvents = auditLogs.slice(0, 5);

  // Derivations for Needs Attention section
  const activeHighRisks = risks.filter(
    (r) => r.severity === "High" && r.status !== "mitigated"
  );
  const pendingApprovals = approvals.filter(
    (a) => a.overallStatus === "pending"
  );
  const currentTasksGate = gates.find((g) => g.source === "tasks");
  const gatedTasksCount = currentTasksGate
    ? Math.max(0, currentTasksGate.total - currentTasksGate.satisfied)
    : isReadyToAdvance
    ? 0
    : 1;

  // Gate icon mapping helper
  const getGateIcon = (source) => {
    switch (source) {
      case "documents":
        return <FileCheck2 size={15} className="text-emerald-600 shrink-0" />;
      case "tasks":
        return <ListTodo size={15} className="text-blue-600 shrink-0" />;
      case "risks":
        return <AlertTriangle size={15} className="text-rose-600 shrink-0" />;
      case "approvals":
        return <Clock size={15} className="text-amber-600 shrink-0" />;
      default:
        return <Milestone size={15} className="text-[var(--brand)] shrink-0" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-6">
      {/* ── 1. PAGE HEADER ── */}
      <PageHeader
        title="Controls & Audit"
        // subtitle="Monitor compliance, stage progression and audit activity."
        badge={
          <div className="flex items-center gap-2">
            {/* <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Deal: {activeDeal.name}</span>
            </span> */}
            {isMounted && (
              callerSide === "buyer" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  Buyer View
                </span>
              ) : callerSide === "seller" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  Seller View
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Super Admin Auditor
                </span>
              )
            )}
          </div>
        }
        actions={
          isMounted && callerSide === "super_admin" ? (
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedSide("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedSide === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Sides
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide("buyer")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedSide === "buyer"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-sky-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Buyer Side
              </button>
              <button
                type="button"
                onClick={() => setSelectedSide("seller")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedSide === "seller"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-sky-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Seller Side
              </button>
            </div>
          ) : null
        }
      />

      {/* ── 2. KPI SUMMARY — ONLY 4 CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stage */}
        <div
          onClick={() => router.push("/control-audits/stage-control")}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-[var(--brand)]/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stage
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-[var(--brand)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Milestone size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {kpis.stageProgress.currentStageNumber} / {kpis.stageProgress.totalStages}
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            {currentStage.name}
          </p>
        </div>

        {/* Card 2: Blockers */}
        <div
          onClick={() => router.push("/control-audits/stage-control")}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Blockers
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
            {currentBlockers.length}
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Blocking next stage
          </p>
        </div>

        {/* Card 3: Approvals */}
        <div
          onClick={() => router.push("/control-audits/approvals")}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approvals
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
            {kpis.approvalsPending.count}
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Pending approvals
          </p>
        </div>

        {/* Card 4: High Risks */}
        <div
          onClick={() => router.push("/control-audits/risks-alerts")}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              High Risks
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {kpis.highRisks.count}
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Active high risks
          </p>
        </div>
      </div>

      {/* ── 3. STAGE & GATE STATUS — PRIMARY SECTION ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6">
        {/* Section Title & Primary Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Stage & Gate Status
            </h2>

          </div>
          <button
            onClick={() => router.push("/control-audits/stage-control")}
            className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Stage Control</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 5 Stage Lifecycle Stepper */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Transaction Stages
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {stages.map((stage) => {
              const isCompleted = stage.status === "completed";
              const isCurrent = stage.isCurrent;
              const isLocked = stage.status === "locked" || (!isCompleted && !isCurrent);

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-blue-50/40 border-[var(--brand)] ring-2 ring-[var(--brand)]/20 shadow-xs"
                      : isCompleted
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-slate-50/70 border-slate-200/80 opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1.5">
                    {isCompleted ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">
                        <CheckCircle2 size={14} />
                      </span>
                    ) : isCurrent ? (
                      <span className="w-6 h-6 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[11px] font-bold">
                        {stage.order}
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[11px] font-bold">
                        <Lock size={12} />
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {stage.name}
                  </div>
                  <div className="mt-1">
                    {isCompleted ? (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Completed
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] font-bold text-[var(--brand)]">
                        Current Stage
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Stage Gate Conditions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Stage {currentStage.order} Gate Checklist ({currentStage.name})
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {gates.filter((g) => g.status === "completed").length} of {gates.length} Gates Cleared
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {gates.map((gate) => {
              const isSatisfied = gate.status === "completed";
              return (
                <div
                  key={gate.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isSatisfied
                      ? "bg-slate-50/50 border-slate-200"
                      : "bg-rose-50/20 border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getGateIcon(gate.source)}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 capitalize block truncate">
                        {gate.source}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {gate.satisfied} / {gate.total}
                      </span>
                    </div>
                  </div>

                  <StatusBadge
                    status={isSatisfied ? "completed" : "blocked"}
                    label={isSatisfied ? "Complete" : "Blocked"}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Readiness Status Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isReadyToAdvance
              ? "bg-emerald-50/60 border-emerald-200"
              : "bg-rose-50/50 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReadyToAdvance
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isReadyToAdvance ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}
            </span>
            <div>
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <span>
                  {isReadyToAdvance
                    ? "Ready to Advance Stage"
                    : "Not Ready to Advance"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isReadyToAdvance
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {isReadyToAdvance ? "All Gates Cleared" : `${currentBlockers.length} Blocking Conditions`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isReadyToAdvance
                  ? `All prerequisite document, task, risk, and approval conditions have been satisfied. Transaction can advance to Stage ${currentStage.order + 1}.`
                  : currentBlockers.map((b) => b.title).join(" • ")}
              </p>
            </div>
          </div>

          <Link
            href="/control-audits/stage-control"
            className="text-xs font-bold text-[var(--brand)] hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Resolve Stage Gates</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── LOWER ZONE: 4. NEEDS ATTENTION & 5. RECENT AUDIT ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── 4. NEEDS ATTENTION ── */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Needs Attention
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-priority items requiring compliance action.
                </p>
              </div>
              <button
                onClick={() => router.push("/control-audits/risks-alerts")}
                className="text-xs font-bold text-[var(--brand)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Review Issues</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Actionable Items List */}
            <div className="space-y-3">
              {/* Item 1: High Risks */}
              <div
                onClick={() => router.push("/control-audits/risks-alerts")}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[var(--brand)] transition-colors">
                      {activeHighRisks.length} High Risks
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      Antitrust clearance & IP license consent
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  High
                </span>
              </div>

              {/* Item 2: Pending Approvals */}
              <div
                onClick={() => router.push("/control-audits/approvals")}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[var(--brand)] transition-colors">
                      {pendingApprovals.length} Pending Approvals
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      SPA Draft v2.4 & Disclosure Schedule
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Action Req.
                </span>
              </div>

              {/* Item 3: Gated Tasks */}
              <div
                onClick={() => router.push("/control-audits/stage-control")}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[var(--brand)] flex items-center justify-center shrink-0">
                    <ListTodo size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[var(--brand)] transition-colors">
                      {gatedTasksCount} Gated Tasks
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentTasksGate?.details || "Milestone checklist task blockers"}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                  gatedTasksCount === 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  {gatedTasksCount === 0 ? "Cleared" : "Gated"}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => router.push("/control-audits/risks-alerts")}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Review Issues</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ── 5. RECENT AUDIT ACTIVITY ── */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Audit Activity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest immutable ledger entries from live transaction workflows.
                </p>
              </div>
              <button
                onClick={() => router.push("/control-audits/audit-trail")}
                className="text-xs font-bold text-[var(--brand)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View Audit Trail</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Latest 4-5 Events using AuditEventRow */}
            <div className="space-y-2.5">
              {recentAuditEvents.map((event) => (
                <AuditEventRow
                  key={event.id}
                  event={event}
                  layout="feed"
                  onClick={() => setSelectedAuditLog(event)}
                />
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              WORM Compliant • SHA-256 Verified
            </span>
            <button
              onClick={() => router.push("/control-audits/audit-trail")}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>View Full Audit Trail</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DETAIL DRAWER (Clicking Audit Event) ── */}
      {selectedAuditLog && (
        <DetailDrawer
          isOpen={Boolean(selectedAuditLog)}
          onClose={() => setSelectedAuditLog(null)}
          title="Forensic Audit Record"
          subtitle={`Event ID: ${selectedAuditLog.id} • Deal: ${activeDeal.name}`}
          badge={<StatusBadge status={selectedAuditLog.result} size="sm" />}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500 font-mono">
                Immutable WORM Record
              </span>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs text-slate-700">
            {/* Event Header Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Action Performed
              </div>
              <div className="text-sm font-bold text-slate-900">
                {selectedAuditLog.action}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Resource: <strong className="text-slate-800">{selectedAuditLog.resource}</strong>
              </div>
            </div>

            {/* Forensics Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Actor Name
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {selectedAuditLog.user}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Role
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {selectedAuditLog.userRole || "User"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Timestamp (IST)
                </span>
                <span className="font-mono text-slate-800 text-xs mt-0.5 block truncate" suppressHydrationWarning>
                  {formatAuditDate(selectedAuditLog.timestamp).full}
                </span>
              </div>
            </div>

            {/* Raw JSON Payload */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cryptographic Payload
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedAuditLog.jsonPayload || selectedAuditLog, null, 2)}
              </pre>
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
