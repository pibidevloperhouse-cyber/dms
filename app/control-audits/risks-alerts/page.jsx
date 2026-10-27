"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileWarning,
  ListTodo,
  FileText,
  User,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Shield,
  X,
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  RiskBadge,
  DetailDrawer,
  EmptyState,
} from "@/components/controls-audit/shared";
import ModalPortal from "@/components/ui/ModalPortal";

export default function RisksAlertsPage() {
  const {
    activeDeal,
    risks,
    updateRiskStatus,
    createRisk,
    showToast,
  } = useControlsAudit();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all"); // 'all' | 'High' | 'Medium' | 'Low'
  const [selectedCategory, setSelectedCategory] = useState("all"); // 'all' | 'High Risk' | 'Policy Violation' | 'Overdue Task'
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'active' | 'in_review' | 'mitigated' | 'escalated'
  const [filterBlockersOnly, setFilterBlockersOnly] = useState(false);

  // View toggle: 'table' | 'cards'
  const [viewMode, setViewMode] = useState("table");

  // Selected risk for mitigation drawer
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [mitigationStatusDraft, setMitigationStatusDraft] = useState("active");
  const [mitigationNotesDraft, setMitigationNotesDraft] = useState("");

  // Create Risk Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRiskForm, setNewRiskForm] = useState({
    title: "",
    category: "High Risk",
    severity: "High",
    owner: "Victoria Sterling",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    relatedItem: "SPA_Draft_v2.pdf",
    relatedType: "Document",
    mitigationPlan: "",
    blocksStageAdvancement: true,
  });

  // KPI Metrics computed from shared state
  const totalRisks = risks.length;
  const highRisks = risks.filter((r) => r.severity === "High" && r.status !== "mitigated");
  const blockingRisksCount = risks.filter((r) => r.blocksStageAdvancement && r.status !== "mitigated").length;
  const mediumLowRisks = risks.filter((r) => (r.severity === "Medium" || r.severity === "Low") && r.status !== "mitigated");
  const policyViolations = risks.filter((r) => r.category === "Policy Violation" && r.status !== "mitigated");
  const mitigatedRisks = risks.filter((r) => r.status === "mitigated");

  // Filtered risks list
  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = risk.title.toLowerCase().includes(q);
        const matchOwner = risk.owner.toLowerCase().includes(q);
        const matchCategory = risk.category.toLowerCase().includes(q);
        const matchRelated = (risk.relatedItem || "").toLowerCase().includes(q);
        if (!matchTitle && !matchOwner && !matchCategory && !matchRelated) return false;
      }

      // Severity
      if (selectedSeverity !== "all" && risk.severity !== selectedSeverity) return false;

      // Category
      if (selectedCategory !== "all" && risk.category !== selectedCategory) return false;

      // Status
      if (selectedStatus !== "all" && risk.status !== selectedStatus) return false;

      // Blockers only
      if (filterBlockersOnly && (!risk.blocksStageAdvancement || risk.status === "mitigated")) return false;

      return true;
    });
  }, [risks, searchQuery, selectedSeverity, selectedCategory, selectedStatus, filterBlockersOnly]);

  // Open mitigation drawer
  const handleOpenMitigation = (risk) => {
    setSelectedRisk(risk);
    setMitigationStatusDraft(risk.status);
    setMitigationNotesDraft("");
  };

  // Save mitigation updates
  const handleSaveMitigation = () => {
    if (!selectedRisk) return;
    updateRiskStatus(selectedRisk.id, mitigationStatusDraft, mitigationNotesDraft.trim());
    setSelectedRisk((prev) => (prev ? { ...prev, status: mitigationStatusDraft } : null));
    showToast(`Mitigation plan updated for "${selectedRisk.title}".`, "success");
  };

  // Create new risk submit
  const handleCreateRiskSubmit = (e) => {
    e.preventDefault();
    if (!newRiskForm.title.trim()) {
      showToast("Risk title is required.", "error");
      return;
    }

    createRisk({
      ...newRiskForm,
      title: newRiskForm.title.trim(),
      mitigationPlan: newRiskForm.mitigationPlan.trim() || "Mitigation strategy pending review.",
    });

    setIsCreateModalOpen(false);
    setNewRiskForm({
      title: "",
      category: "High Risk",
      severity: "High",
      owner: "Victoria Sterling",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      relatedItem: "SPA_Draft_v2.pdf",
      relatedType: "Document",
      mitigationPlan: "",
      blocksStageAdvancement: true,
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSeverity("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setFilterBlockersOnly(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedSeverity !== "all" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    filterBlockersOnly;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-7">
      {/* ── HEADER ── */}
      <PageHeader
        title="Risks & Alerts Governance"
        // subtitle="Monitor deal compliance risks, enforce mitigation plans, review policy security alerts, and manage conditions that block stage progression."
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${
                blockingRisksCount > 0
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  blockingRisksCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span>
                {blockingRisksCount > 0
                  ? `${blockingRisksCount} High Risks Blocking Stage 3`
                  : "All Stage 3 Risk Gates Satisfied"}
              </span>
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/control-audits/stage-control"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight size={14} className="text-slate-400" />
              <span>Stage Gate Checklist</span>
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Report New Risk</span>
            </button>
          </div>
        }
      />

      {/* ── A. 4 METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. High Risks (Blocking) */}
        <div
          onClick={() => {
            setSelectedSeverity(selectedSeverity === "High" ? "all" : "High");
            setFilterBlockersOnly(true);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === "High" && filterBlockersOnly
              ? "border-rose-400 bg-rose-50/30 ring-2 ring-rose-300/50"
              : "border-slate-200/80 hover:border-rose-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              High Risks (Blocking)
            </span>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
              {highRisks.length}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              {blockingRisksCount} currently blocking Stage 3
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
        </div>

        {/* 2. Medium & Low Risks */}
        <div
          onClick={() => {
            setSelectedSeverity(selectedSeverity === "Medium" ? "all" : "Medium");
            setFilterBlockersOnly(false);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === "Medium"
              ? "border-amber-400 bg-amber-50/30 ring-2 ring-amber-300/50"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Medium & Low Risks
            </span>
            <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
              {mediumLowRisks.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Operational diligence scope</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
        </div>

        {/* 3. Policy Violations */}
        <div
          onClick={() => {
            setSelectedCategory(selectedCategory === "Policy Violation" ? "all" : "Policy Violation");
            setFilterBlockersOnly(false);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedCategory === "Policy Violation"
              ? "border-purple-400 bg-purple-50/30 ring-2 ring-purple-300/50"
              : "border-slate-200/80 hover:border-purple-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Policy Violations
            </span>
            <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
              {policyViolations.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Security & external sharing breaches</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldAlert size={18} />
          </div>
        </div>

        {/* 4. Mitigated Risks */}
        <div
          onClick={() => {
            setSelectedStatus(selectedStatus === "mitigated" ? "all" : "mitigated");
            setFilterBlockersOnly(false);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedStatus === "mitigated"
              ? "border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-300/50"
              : "border-slate-200/80 hover:border-emerald-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Mitigated Risks
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              {mitigatedRisks.length}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Signoffs verified and cleared</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* ── B. FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risk title, owner, category, or related file..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Severity filter pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Severity:
            </span>
            {["all", "High", "Medium", "Low"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedSeverity === sev
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {sev === "all" ? "All Severities" : sev}
              </button>
            ))}
          </div>

          {/* View mode switcher */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[var(--brand)] font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Dense Table View"
            >
              <TableIcon size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white text-[var(--brand)] font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Secondary filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All Categories</option>
              <option value="High Risk">High Risk</option>
              <option value="Policy Violation">Policy Violation</option>
              <option value="Overdue Task">Overdue Task</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_review">In Review</option>
              <option value="escalated">Escalated</option>
              <option value="mitigated">Mitigated</option>
            </select>
          </div>

          {/* Stage Blocker Only Toggle */}
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={filterBlockersOnly}
              onChange={(e) => setFilterBlockersOnly(e.target.checked)}
              className="rounded text-[var(--brand)] focus:ring-0"
            />
            <span>Stage 3 Blockers Only</span>
          </label>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium ml-auto cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── C. MAIN RISK CONTENT (TABLE OR CARDS) ── */}
      {filteredRisks.length === 0 ? (
        <EmptyState
          title="No Matching Risks Found"
          description="Try broadening your search query or clearing active filter constraints."
          actionLabel="Reset Filters"
          onAction={resetFilters}
        />
      ) : viewMode === "table" ? (
        /* ── DENSE REAL TABLE ── */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 w-28">Severity</th>
                  <th className="py-3 px-4 min-w-[240px]">Risk & Details</th>
                  <th className="py-3 px-4 w-36">Category</th>
                  <th className="py-3 px-4 w-44">Stage Impact</th>
                  <th className="py-3 px-4 min-w-[180px]">Related Resource</th>
                  <th className="py-3 px-4 w-36">Owner</th>
                  <th className="py-3 px-4 w-28">Due Date</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map((risk) => {
                  const isBlocking = risk.blocksStageAdvancement && risk.status !== "mitigated";
                  return (
                    <tr
                      key={risk.id}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isBlocking ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Severity */}
                      <td className="py-3 px-4 align-top">
                        <RiskBadge severity={risk.severity} />
                      </td>

                      {/* Risk Title & Mitigation snippet */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors">
                          {risk.title}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {risk.mitigationPlan}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 align-top">
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          {risk.category}
                        </span>
                      </td>

                      {/* Stage Impact */}
                      <td className="py-3 px-4 align-top">
                        {risk.blocksStageAdvancement ? (
                          risk.status === "mitigated" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 size={12} />
                              <span>Blocker Resolved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle size={12} />
                              <span>Blocks Stage 3</span>
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Stage Block</span>
                        )}
                      </td>

                      {/* Related Resource */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          {risk.relatedType === "Document" ? (
                            <FileText size={13} className="text-blue-500 shrink-0" />
                          ) : risk.relatedType === "Task" ? (
                            <ListTodo size={13} className="text-amber-500 shrink-0" />
                          ) : (
                            <ShieldAlert size={13} className="text-purple-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[160px]" title={risk.relatedItem}>
                            {risk.relatedItem}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                          {risk.relatedType}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {risk.ownerAvatar}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {risk.owner}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 align-top font-mono text-[11px] text-slate-600">
                        {risk.dueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top">
                        <StatusBadge
                          status={
                            risk.status === "mitigated"
                              ? "completed"
                              : risk.status === "in_review"
                              ? "in_progress"
                              : risk.status === "escalated"
                              ? "overdue"
                              : "blocked"
                          }
                          label={
                            risk.status === "mitigated"
                              ? "Mitigated"
                              : risk.status === "in_review"
                              ? "In Review"
                              : risk.status === "escalated"
                              ? "Escalated"
                              : "Active"
                          }
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right">
                        <button
                          onClick={() => handleOpenMitigation(risk)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>Mitigate</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GRID CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRisks.map((risk) => {
            const isBlocking = risk.blocksStageAdvancement && risk.status !== "mitigated";
            return (
              <div
                key={risk.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  isBlocking
                    ? "border-rose-300 bg-rose-50/10"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Top Bar: Severity & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <RiskBadge severity={risk.severity} />
                    <StatusBadge
                      status={
                        risk.status === "mitigated"
                          ? "completed"
                          : risk.status === "in_review"
                          ? "in_progress"
                          : risk.status === "escalated"
                          ? "overdue"
                          : "blocked"
                      }
                      label={
                        risk.status === "mitigated"
                          ? "Mitigated"
                          : risk.status === "in_review"
                          ? "In Review"
                          : risk.status === "escalated"
                          ? "Escalated"
                          : "Active"
                      }
                      size="sm"
                    />
                  </div>

                  {/* Stage Blocker Chip */}
                  {risk.blocksStageAdvancement && (
                    <div className="mb-2">
                      {risk.status === "mitigated" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>Stage 3 Blocker Resolved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <AlertTriangle size={11} />
                          <span>Blocks Stage 3 Advancement</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors leading-snug">
                    {risk.title}
                  </h4>

                  {/* Category & Resource */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-600">
                      {risk.category}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      {risk.relatedType === "Document" ? (
                        <FileText size={12} className="text-blue-500" />
                      ) : (
                        <ListTodo size={12} className="text-amber-500" />
                      )}
                      <span className="truncate max-w-[140px]">{risk.relatedItem}</span>
                    </span>
                  </div>

                  {/* Mitigation Snippet */}
                  <p className="text-xs text-slate-600 mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                    <strong className="text-slate-800">Plan:</strong> {risk.mitigationPlan}
                  </p>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {risk.ownerAvatar}
                    </span>
                    <div className="text-[11px]">
                      <span className="font-semibold text-slate-800 block leading-none">
                        {risk.owner}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Due: {risk.dueDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenMitigation(risk)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Mitigate</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── D. MITIGATION DETAIL DRAWER ── */}
      {selectedRisk && (
        <DetailDrawer
          isOpen={Boolean(selectedRisk)}
          onClose={() => setSelectedRisk(null)}
          title="Risk Mitigation & Signoff"
          subtitle={`Risk ID: ${selectedRisk.id} • Deal: ${activeDeal.name}`}
          badge={<RiskBadge severity={selectedRisk.severity} />}
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                onClick={() => setSelectedRisk(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSaveMitigation}
                className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Save Mitigation Update</span>
              </button>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Blocker Alert Banner */}
            {selectedRisk.blocksStageAdvancement && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  selectedRisk.status === "mitigated"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <AlertTriangle
                  size={18}
                  className={selectedRisk.status === "mitigated" ? "text-emerald-600 shrink-0" : "text-rose-600 shrink-0"}
                />
                <div>
                  <h4 className="font-bold text-xs">
                    {selectedRisk.status === "mitigated"
                      ? "Stage 3 Blocker Satisfied"
                      : "Mandatory Stage 3 Blocker"}
                  </h4>
                  <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                    {selectedRisk.status === "mitigated"
                      ? "This risk has been verified as mitigated. The corresponding Stage 3 Gate condition has been satisfied."
                      : "Under the Transaction Stage Advancement Policy, this deal cannot advance to Stage 4 (Approvals) until this high risk is marked mitigated by authorized legal/finance lead."}
                  </p>
                </div>
              </div>
            )}

            {/* Risk Title & Meta */}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {selectedRisk.title}
              </h3>
              <div className="grid grid-cols-2 gap-3 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Category
                  </span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {selectedRisk.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Severity
                  </span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {selectedRisk.severity} Risk
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Owner
                  </span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {selectedRisk.owner}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <span className="font-mono text-slate-800 text-xs mt-0.5 block">
                    {selectedRisk.dueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Resource */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Linked Deal Resource
              </h4>
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {selectedRisk.relatedType === "Document" ? (
                    <FileText size={16} className="text-blue-600" />
                  ) : (
                    <ListTodo size={16} className="text-amber-600" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      {selectedRisk.relatedItem}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Scope: {selectedRisk.relatedType}
                    </span>
                  </div>
                </div>
                <Link
                  href={selectedRisk.relatedType === "Document" ? "/documents" : "/tasks"}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Resource</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Current Mitigation Strategy */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Current Mitigation Strategy
              </h4>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs leading-relaxed text-slate-700">
                {selectedRisk.mitigationPlan}
              </div>
            </div>

            {/* Interactive Mitigation Controls */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Update Mitigation Status
              </h4>

              {/* Status Radio Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "active", label: "Active", color: "border-rose-300 text-rose-800 bg-rose-50" },
                  { id: "in_review", label: "In Review", color: "border-blue-300 text-blue-800 bg-blue-50" },
                  { id: "escalated", label: "Escalated", color: "border-amber-300 text-amber-800 bg-amber-50" },
                  { id: "mitigated", label: "Mitigated", color: "border-emerald-300 text-emerald-800 bg-emerald-50" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setMitigationStatusDraft(st.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      mitigationStatusDraft === st.id
                        ? `${st.color} ring-2 ring-slate-900/20 shadow-xs font-extrabold`
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Mitigation Notes Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mitigation Log Notes (Recorded in Immutable Audit Trail)
                </label>
                <textarea
                  rows={3}
                  value={mitigationNotesDraft}
                  onChange={(e) => setMitigationNotesDraft(e.target.value)}
                  placeholder="Enter regulatory clearance notes, legal counsel review findings, or signoff references..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800"
                />
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* ── E. REPORT NEW RISK MODAL ── */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Report New Transaction Risk
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a new compliance, diligence, or legal risk to {activeDeal.name}.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateRiskSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Risk Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRiskForm.title}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, title: e.target.value })}
                    placeholder="e.g., Target Environmental Phase II Soil Assessment Findings"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={newRiskForm.severity}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, severity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    >
                      <option value="High">High Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="Low">Low Risk</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newRiskForm.category}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    >
                      <option value="High Risk">High Risk</option>
                      <option value="Policy Violation">Policy Violation</option>
                      <option value="Overdue Task">Overdue Task</option>
                      <option value="Document Request">Document Request</option>
                      <option value="Approval Pending">Approval Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Risk Owner
                    </label>
                    <input
                      type="text"
                      value={newRiskForm.owner}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, owner: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      value={newRiskForm.dueDate}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Related Deal Item / Document / Task
                  </label>
                  <input
                    type="text"
                    value={newRiskForm.relatedItem}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, relatedItem: e.target.value })}
                    placeholder="e.g., Phase_II_Environmental_Report.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mitigation Strategy
                  </label>
                  <textarea
                    rows={2}
                    value={newRiskForm.mitigationPlan}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, mitigationPlan: e.target.value })}
                    placeholder="Describe specific actions or escrow provisions required to resolve this risk..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="pr-4">
                    <span className="font-bold text-slate-800 block">
                      Blocks Stage Advancement
                    </span>
                    <span className="text-[11px] text-slate-500">
                      If enabled, this risk gates Stage 3 progression until marked mitigated.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newRiskForm.blocksStageAdvancement}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, blocksStageAdvancement: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--brand)] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Create Risk</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
