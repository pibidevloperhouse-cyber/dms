"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  ShieldCheck,
  Briefcase,
  Layers,
  Check,
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
    selectedDealId,
    setSelectedDealId,
    selectedSide,
    setSelectedSide,
    callerSide,
    addAuditEvent,
    showToast,
  } = useControlsAudit();

  // API Data State
  const [isLoading, setIsLoading] = useState(true);
  const [dealInfo, setDealInfo] = useState(null);
  const [availableDeals, setAvailableDeals] = useState([]);
  const [risksList, setRisksList] = useState([]);
  const [apiCounts, setApiCounts] = useState({
    total: 0,
    high: 0,
    mediumLow: 0,
    policyViolations: 0,
    mitigated: 0,
    blockingStage: 0,
    buyerRisks: 0,
    sellerRisks: 0,
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("all"); // 'all' | 'High' | 'Medium' | 'Low'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'active' | 'in_review' | 'mitigated' | 'escalated'
  const [filterBlockersOnly, setFilterBlockersOnly] = useState(false);

  // View toggle: 'table' | 'cards'
  const [viewMode, setViewMode] = useState("table");

  // Selected risk for mitigation drawer
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [mitigationStatusDraft, setMitigationStatusDraft] = useState("active");
  const [mitigationNotesDraft, setMitigationNotesDraft] = useState("");
  const [isSavingMitigation, setIsSavingMitigation] = useState(false);

  // Create Risk Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRiskForm, setNewRiskForm] = useState({
    title: "",
    category: "High Risk",
    severity: "High",
    side: "seller",
    owner: "Legal Counsel",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    relatedItem: "Regulatory Clearance Filing",
    relatedType: "Document",
    mitigationPlan: "",
    blocksStageAdvancement: true,
  });

  // Fetch live risks and alerts from backend API
  const fetchRisksData = useCallback(async (targetDealId) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (targetDealId) params.append("dealId", targetDealId);

      const res = await fetch(`/api/control-audits/risks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDealInfo(data.deal);
          setAvailableDeals(data.deals || []);
          setRisksList(data.risks || []);
          if (data.counts) setApiCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch risks & alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when active deal changes
  useEffect(() => {
    fetchRisksData(selectedDealId || activeDeal?.id);
  }, [fetchRisksData, selectedDealId, activeDeal?.id]);

  // Filtered risks list based on local search, party side, severity, category, status, and stage blocker
  const filteredRisks = useMemo(() => {
    return risksList.filter((risk) => {
      // 1. Party Side Filter (All Sides vs Buyer Side vs Seller Side)
      if (selectedSide !== "all" && risk.side !== selectedSide) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (risk.title || "").toLowerCase().includes(q);
        const matchOwner = (risk.owner || "").toLowerCase().includes(q);
        const matchCategory = (risk.category || "").toLowerCase().includes(q);
        const matchRelated = (risk.relatedItem || "").toLowerCase().includes(q);
        const matchSide = (risk.sideLabel || "").toLowerCase().includes(q);
        if (!matchTitle && !matchOwner && !matchCategory && !matchRelated && !matchSide) {
          return false;
        }
      }

      // 3. Severity Filter
      if (selectedSeverity !== "all" && risk.severity !== selectedSeverity) return false;

      // 4. Category Filter
      if (selectedCategory !== "all" && risk.category !== selectedCategory) return false;

      // 5. Status Filter
      if (selectedStatus !== "all" && risk.status !== selectedStatus) return false;

      // 6. Blockers Only Filter
      if (filterBlockersOnly && (!risk.blocksStageAdvancement || risk.status === "mitigated")) {
        return false;
      }

      return true;
    });
  }, [risksList, selectedSide, searchQuery, selectedSeverity, selectedCategory, selectedStatus, filterBlockersOnly]);

  // Dynamic counts derived from current party side scope
  const scopedCounts = useMemo(() => {
    const list = selectedSide === "all" ? risksList : risksList.filter((r) => r.side === selectedSide);
    return {
      total: list.length,
      high: list.filter((r) => r.severity === "High" && r.status !== "mitigated").length,
      blockingStage: list.filter((r) => r.blocksStageAdvancement && r.status !== "mitigated").length,
      mediumLow: list.filter((r) => (r.severity === "Medium" || r.severity === "Low") && r.status !== "mitigated").length,
      policyViolations: list.filter((r) => (r.category === "Policy Violation" || r.category === "Security Alert") && r.status !== "mitigated").length,
      mitigated: list.filter((r) => r.status === "mitigated").length,
      buyer: risksList.filter((r) => r.side === "buyer").length,
      seller: risksList.filter((r) => r.side === "seller").length,
    };
  }, [risksList, selectedSide]);

  // Open mitigation drawer
  const handleOpenMitigation = (risk) => {
    setSelectedRisk(risk);
    setMitigationStatusDraft(risk.status);
    setMitigationNotesDraft(risk.mitigationPlan || "");
  };

  // Save mitigation updates & log into audit trail
  const handleSaveMitigation = async () => {
    if (!selectedRisk) return;
    try {
      setIsSavingMitigation(true);

      // Call API
      const res = await fetch("/api/control-audits/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_risk",
          riskId: selectedRisk.id,
          newStatus: mitigationStatusDraft,
          mitigationNotes: mitigationNotesDraft.trim(),
          dealId: dealInfo?.id || selectedDealId,
        }),
      });

      // Update local state
      setRisksList((prev) =>
        prev.map((item) =>
          item.id === selectedRisk.id
            ? {
                ...item,
                status: mitigationStatusDraft,
                mitigationPlan: mitigationNotesDraft.trim() || item.mitigationPlan,
              }
            : item
        )
      );

      setSelectedRisk((prev) =>
        prev
          ? {
              ...prev,
              status: mitigationStatusDraft,
              mitigationPlan: mitigationNotesDraft.trim() || prev.mitigationPlan,
            }
          : null
      );

      // Log into immutable audit trail ledger
      if (addAuditEvent) {
        addAuditEvent({
          action: "Updated Risk Mitigation",
          resource: `${selectedRisk.title} [Status: ${mitigationStatusDraft}]`,
          module: "Risks & Alerts",
          result: mitigationStatusDraft === "mitigated" ? "Success" : "Flagged",
          metadata: {
            riskId: selectedRisk.id,
            side: selectedRisk.side,
            newStatus: mitigationStatusDraft,
            notes: mitigationNotesDraft.trim(),
          },
          jsonPayload: {
            risk_id: selectedRisk.id,
            status: mitigationStatusDraft,
            side: selectedRisk.side,
            mitigation_notes: mitigationNotesDraft.trim(),
          },
        });
      }

      showToast(`Risk mitigation updated for "${selectedRisk.title}".`, "success");
    } catch (err) {
      console.error("Error saving mitigation:", err);
      showToast("Failed to save mitigation updates.", "error");
    } finally {
      setIsSavingMitigation(false);
    }
  };

  // Create new risk submit
  const handleCreateRiskSubmit = async (e) => {
    e.preventDefault();
    if (!newRiskForm.title.trim()) {
      showToast("Risk title is required.", "error");
      return;
    }

    try {
      const targetProjectId = dealInfo?.projectId || activeDeal?.projectId;
      let dbRiskId = null;

      if (targetProjectId) {
        const res = await fetch("/api/control-audits/risks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_risk",
            title: newRiskForm.title.trim(),
            severity: newRiskForm.severity,
            projectId: targetProjectId,
            dealId: dealInfo?.id || selectedDealId,
          }),
        });
        const data = await res.json();
        if (data.success && data.createdRisk) {
          dbRiskId = data.createdRisk.id;
        }
      }

      const createdItem = {
        id: dbRiskId || `gov-${Date.now().toString().slice(-4)}`,
        title: newRiskForm.title.trim(),
        category: newRiskForm.category,
        type: "Deal Governance Risk",
        severity: newRiskForm.severity,
        owner: newRiskForm.owner || dealInfo?.buyerName || "Legal Counsel",
        ownerAvatar: ((newRiskForm.owner || dealInfo?.buyerName || "LC").split(" ").map((w) => w[0]).join("") || "LC").toUpperCase().slice(0, 2),
        status: "active",
        dueDate: newRiskForm.dueDate,
        detectedAt: new Date().toISOString(),
        deal: dealInfo?.name || activeDeal?.name || "Active Deal",
        dealId: dealInfo?.id || selectedDealId,
        side: newRiskForm.side,
        sideLabel: newRiskForm.side === "buyer" ? "Buyer Side" : "Seller Side",
        relatedItem: newRiskForm.relatedItem || "Regulatory Clearance Filing",
        relatedType: newRiskForm.relatedType || "Document",
        description: "Manually registered deal governance risk.",
        mitigationPlan: newRiskForm.mitigationPlan.trim() || "Mitigation strategy pending review.",
        blocksStageAdvancement: newRiskForm.blocksStageAdvancement,
      };

      setRisksList((prev) => [createdItem, ...prev]);

      // Log into audit trail
      if (addAuditEvent) {
        addAuditEvent({
          action: "Created Deal Risk",
          resource: `${createdItem.title} [${createdItem.sideLabel}]`,
          module: "Risks & Alerts",
          result: createdItem.severity === "High" ? "Flagged" : "Success",
          metadata: {
            riskId: createdItem.id,
            side: createdItem.side,
            severity: createdItem.severity,
            category: createdItem.category,
            owner: createdItem.owner,
          },
          jsonPayload: {
            risk_id: createdItem.id,
            title: createdItem.title,
            severity: createdItem.severity,
            side: createdItem.side,
          },
        });
      }

      setIsCreateModalOpen(false);
      showToast(`New ${createdItem.severity} Risk "${createdItem.title}" logged and persisted successfully.`, "info");

      // Reset form
      setNewRiskForm({
        title: "",
        category: "High Risk",
        severity: "High",
        side: "seller",
        owner: dealInfo?.companyName ? `${dealInfo.companyName} Lead` : "Legal Counsel",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        relatedItem: "Regulatory Clearance Filing",
        relatedType: "Document",
        mitigationPlan: "",
        blocksStageAdvancement: true,
      });
    } catch (err) {
      console.error("Error creating risk:", err);
      showToast("Failed to persist new risk in database.", "error");
    }
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
        badge={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs ${
                scopedCounts.blockingStage > 0
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  scopedCounts.blockingStage > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span>
                {scopedCounts.blockingStage > 0
                  ? `${scopedCounts.blockingStage} High Risks Blocking Stage 3 Bidding`
                  : "All Stage 3 Risk Gates Satisfied"}
              </span>
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Party Side Filter Pills */}
            {callerSide === "super_admin" ? (
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
                  Buyer Side ({scopedCounts.buyer})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSide("seller")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedSide === "seller"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-indigo-700"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Seller Side ({scopedCounts.seller})
                </button>
              </div>
            ) : callerSide === "buyer" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Buyer Side Scoped ({scopedCounts.buyer} Risks)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Seller Side Scoped ({scopedCounts.seller} Risks)
              </span>
            )}

            {/* Stage Gate Link */}
            <Link
              href="/control-audits/stage-control"
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRight size={13} className="text-slate-400" />
              <span>Stage Gates</span>
            </Link>

            {/* Report New Risk Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Log Risk</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchRisksData(selectedDealId || activeDeal?.id)}
              disabled={isLoading}
              title="Refresh risks and security alerts"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* ── DEAL STAGE & BLOCKER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              Active Deal
            </span>
            <span className="text-xs font-mono text-slate-300">
              {dealInfo?.name || activeDeal?.name || "Deal Workspace"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Current Stage: Bidding (Stage 3)
            </span>
          </div>
          <h2 className="text-base md:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Transaction Risk Matrix & Security Alerts</span>
          </h2>
          
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
            <div className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">Buyer Risks</div>
            <div className="text-lg font-black text-white mt-0.5">{scopedCounts.buyer}</div>
            <div className="text-[10px] text-slate-300 font-medium">Compliance & DD</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center min-w-[110px]">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Seller Risks</div>
            <div className="text-lg font-black text-white mt-0.5">{scopedCounts.seller}</div>
            <div className="text-[10px] text-slate-300 font-medium">Clearance & IP</div>
          </div>
        </div>
      </div>

      {/* ── 4 KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. High Risks (Blocking) */}
        <div
          onClick={() => {
            setSelectedSeverity(selectedSeverity === "High" && filterBlockersOnly ? "all" : "High");
            setFilterBlockersOnly(!filterBlockersOnly);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedSeverity === "High" && filterBlockersOnly
              ? "border-rose-400 bg-rose-50/30 ring-2 ring-rose-300/50"
              : "border-slate-200/80 hover:border-rose-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              High Risks (Blockers)
            </span>
            <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
              {scopedCounts.high}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              {scopedCounts.blockingStage} currently blocking Stage 3 Bidding
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
              {scopedCounts.mediumLow}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Operational & DD scope</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
        </div>

        {/* 3. Security & Policy Alerts */}
        <div
          onClick={() => {
            setSelectedCategory(selectedCategory === "Security Alert" ? "all" : "Security Alert");
            setFilterBlockersOnly(false);
          }}
          className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
            selectedCategory === "Security Alert"
              ? "border-purple-400 bg-purple-50/30 ring-2 ring-purple-300/50"
              : "border-slate-200/80 hover:border-purple-300"
          }`}
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Security & Policy Alerts
            </span>
            <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
              {scopedCounts.policyViolations}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Automated leak & auth signals</p>
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
              {scopedCounts.mitigated}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Signoffs verified and cleared</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risk title, owner, category, related item, or side..."
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
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Security Alert">Security Alert</option>
              <option value="Policy Violation">Policy Violation</option>
              <option value="Regulatory & Compliance">Regulatory & Compliance</option>
              <option value="Deal Governance">Deal Governance</option>
              <option value="High Risk">High Risk</option>
              <option value="Overdue Milestone">Overdue Milestone</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)] cursor-pointer"
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
              className="rounded text-[var(--brand)] focus:ring-0 cursor-pointer"
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

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--brand-50)] text-[var(--brand)] mb-3 animate-pulse">
            <RefreshCw size={22} className="animate-spin" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Loading Risks & Security Alerts...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Correlating audit activity signals, Stage 3 blockers, and deal compliance items.
          </p>
        </div>
      )}

      {/* ── VIEW 1: DENSE TABLE VIEW ── */}
      {!isLoading && viewMode === "table" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[var(--brand)]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Active Risks & Security Ledger
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filteredRisks.length} {filteredRisks.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Click any row to open the mitigation & audit inspection drawer
            </div>
          </div>

          {filteredRisks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No risks or alerts found matching current filters.</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Try selecting "All Sides" or resetting your search and severity filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 min-w-[260px]">Risk / Alert Title</th>
                    <th className="px-3 py-3.5">Party Side</th>
                    <th className="px-3 py-3.5">Severity</th>
                    <th className="px-3 py-3.5">Stage Gate</th>
                    <th className="px-4 py-3.5">Related Asset</th>
                    <th className="px-3 py-3.5">Owner / Lead</th>
                    <th className="px-3 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRisks.map((risk) => {
                    const isBuyer = risk.side === "buyer";
                    const isBlocker = risk.blocksStageAdvancement && risk.status !== "mitigated";

                    return (
                      <tr
                        key={risk.id}
                        onClick={() => handleOpenMitigation(risk)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* Title & Category */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                risk.category === "Security Alert" || risk.category === "Policy Violation"
                                  ? "bg-purple-50 text-purple-600"
                                  : risk.severity === "High"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {risk.category === "Security Alert" ? (
                                <ShieldAlert size={14} />
                              ) : risk.severity === "High" ? (
                                <AlertTriangle size={14} />
                              ) : (
                                <FileWarning size={14} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors">
                                {risk.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {risk.category}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {risk.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Party Side */}
                        <td className="px-3 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                              isBuyer
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {isBuyer ? "Buyer Side" : "Seller Side"}
                          </span>
                        </td>

                        {/* Severity */}
                        <td className="px-3 py-3.5">
                          <RiskBadge severity={risk.severity} size="sm" />
                        </td>

                        {/* Stage Gate Blocker */}
                        <td className="px-3 py-3.5">
                          {isBlocker ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <Lock size={10} className="text-rose-600" />
                              <span>Stage 3 Blocker</span>
                            </span>
                          ) : risk.blocksStageAdvancement ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={10} className="text-emerald-600" />
                              <span>Gate Cleared</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Non-blocking</span>
                          )}
                        </td>

                        {/* Related Item */}
                        <td className="px-4 py-3.5">
                          <span className="text-slate-700 font-mono text-[11px] truncate max-w-[180px] block" title={risk.relatedItem}>
                            {risk.relatedItem || "General Workspace"}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                              {risk.ownerAvatar || "US"}
                            </div>
                            <span className="text-slate-800 font-semibold truncate max-w-[120px]">
                              {risk.owner}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <StatusBadge status={risk.status} size="sm" />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMitigation(risk);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[var(--brand)] hover:bg-[var(--brand-50)] transition-colors border border-transparent hover:border-[var(--brand)]/20"
                          >
                            Mitigate →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: VISUAL CARDS VIEW ── */}
      {!isLoading && viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRisks.map((risk) => {
            const isBuyer = risk.side === "buyer";
            const isBlocker = risk.blocksStageAdvancement && risk.status !== "mitigated";

            return (
              <div
                key={risk.id}
                onClick={() => handleOpenMitigation(risk)}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isBlocker ? "border-rose-200 hover:border-rose-300" : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                        isBuyer
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {isBuyer ? "Buyer Side" : "Seller Side"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <RiskBadge severity={risk.severity} size="sm" />
                      <StatusBadge status={risk.status} size="sm" />
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {risk.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {risk.category} • {risk.type}
                    </p>
                  </div>

                  {/* Stage Blocker Alert */}
                  {isBlocker && (
                    <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-semibold">
                      <Lock size={12} className="shrink-0 text-rose-600" />
                      <span className="text-[11px]">Blocks Advancement to Stage 3 Bidding</span>
                    </div>
                  )}

                  {/* Related Item & Description */}
                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      Target Resource:
                    </div>
                    <div className="font-mono text-slate-800 truncate">{risk.relatedItem || "Workspace File"}</div>
                    {risk.description && (
                      <p className="text-slate-500 text-[10px] line-clamp-2 italic pt-1 border-t border-slate-200/60 mt-1">
                        "{risk.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Owner & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                      {risk.ownerAvatar || "US"}
                    </div>
                    <span className="text-slate-700 font-medium truncate max-w-[120px]">
                      {risk.owner}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--brand)] hover:underline">
                    Mitigate →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL & MITIGATION DRAWER ── */}
      <DetailDrawer
        isOpen={!!selectedRisk}
        onClose={() => setSelectedRisk(null)}
        title="Risk & Security Alert Mitigation"
        subtitle="Forensic analysis, mitigation planning, and stage blocker clearance"
        badge={
          selectedRisk && (
            <div className="flex items-center gap-1.5">
              <RiskBadge severity={selectedRisk.severity} size="sm" />
              <StatusBadge status={mitigationStatusDraft} size="sm" />
            </div>
          )
        }
      >
        {selectedRisk && (
          <div className="space-y-5 text-xs font-sans">
            {/* Context Box */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Party Side:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedRisk.side === "buyer"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {selectedRisk.sideLabel || (selectedRisk.side === "buyer" ? "Buyer Side" : "Seller Side")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Risk Title:</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px]">
                  {selectedRisk.title}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Category / Type:</span>
                <span className="font-semibold text-slate-700">
                  {selectedRisk.category} • {selectedRisk.type}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Target Resource:</span>
                <span className="font-mono text-slate-800">{selectedRisk.relatedItem}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Deal Context:</span>
                <span className="font-semibold text-slate-800">{selectedRisk.deal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Stage Progression Impact:</span>
                {selectedRisk.blocksStageAdvancement ? (
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    <Lock size={11} />
                    <span>Blocks Stage 3 Bidding</span>
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">Non-blocking Advisory</span>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedRisk.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Audit Signal / Risk Assessment
                </h4>
                <div className="p-3 border border-slate-200 rounded-xl bg-white text-slate-700 leading-relaxed">
                  {selectedRisk.description}
                </div>
              </div>
            )}

            {/* Interactive Status Selector */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Update Governance Status
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "active", label: "Active / Flagged" },
                  { value: "in_review", label: "Under Review" },
                  { value: "escalated", label: "Escalated to Lead" },
                  { value: "mitigated", label: "Mitigated & Cleared" },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setMitigationStatusDraft(st.value)}
                    className={`p-2.5 rounded-xl border text-left font-semibold text-xs transition-all cursor-pointer ${
                      mitigationStatusDraft === st.value
                        ? "border-[var(--brand)] bg-[var(--brand-50)]/50 text-[var(--brand)] ring-1 ring-[var(--brand)]/30"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mitigation Plan & Notes */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mitigation Strategy & Resolution Notes
              </h4>
              <p className="text-[11px] text-slate-400 mb-2">
                Formal legal and governance notes explaining risk mitigation or clearance terms
              </p>
              <textarea
                rows={4}
                value={mitigationNotesDraft}
                onChange={(e) => setMitigationNotesDraft(e.target.value)}
                placeholder="Detail the mitigation actions taken (e.g. indemnity escrow carveout in section 8.4, secondary regulatory submission, credentials validated)..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] text-xs text-slate-800 leading-relaxed"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveMitigation}
                disabled={isSavingMitigation}
                className="w-full py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingMitigation ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Recording Mitigation...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Apply Mitigation & Sign Audit Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* ── REPORT NEW RISK MODAL ── */}
      {isCreateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Log Transaction Risk</h3>
                    <p className="text-[11px] text-slate-500">
                      Record a new deal compliance risk or stage blocker
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateRiskSubmit} className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Risk Title *</label>
                  <input
                    type="text"
                    required
                    value={newRiskForm.title}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, title: e.target.value })}
                    placeholder="e.g. Antitrust Regulatory Review Notice"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-xs text-slate-800 font-medium"
                  />
                </div>

                {/* Party Side & Severity Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Party Side</label>
                    <select
                      value={newRiskForm.side}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, side: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] text-xs text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="seller">Seller Side</option>
                      <option value="buyer">Buyer Side</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Severity</label>
                    <select
                      value={newRiskForm.severity}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, severity: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] text-xs text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="High">High (Stage Gate Risk)</option>
                      <option value="Medium">Medium (Operational)</option>
                      <option value="Low">Low (Informational)</option>
                    </select>
                  </div>
                </div>

                {/* Category & Owner */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={newRiskForm.category}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] text-xs text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="Regulatory & Compliance">Regulatory & Compliance</option>
                      <option value="High Risk">High Risk</option>
                      <option value="Deal Governance">Deal Governance</option>
                      <option value="Policy Violation">Policy Violation</option>
                      <option value="Security Alert">Security Alert</option>
                      <option value="Overdue Milestone">Overdue Milestone</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owner / Lead</label>
                    <input
                      type="text"
                      value={newRiskForm.owner}
                      onChange={(e) => setNewRiskForm({ ...newRiskForm, owner: e.target.value })}
                      placeholder="e.g. Legal Counsel"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Related Asset */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Related Document / Task</label>
                  <input
                    type="text"
                    value={newRiskForm.relatedItem}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, relatedItem: e.target.value })}
                    placeholder="e.g. Financial Disclosure Schedules or Task #104"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-medium"
                  />
                </div>

                {/* Stage Blocker Checkbox */}
                <label className="flex items-center gap-2 p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRiskForm.blocksStageAdvancement}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, blocksStageAdvancement: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-rose-900 block">Blocks Stage 3 Bidding</span>
                    <span className="text-[10px] text-rose-600 block">
                      Prevents deal stage progression until formal mitigation signoff
                    </span>
                  </div>
                </label>

                {/* Initial Mitigation Plan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Mitigation Plan</label>
                  <textarea
                    rows={2}
                    value={newRiskForm.mitigationPlan}
                    onChange={(e) => setNewRiskForm({ ...newRiskForm, mitigationPlan: e.target.value })}
                    placeholder="Describe planned resolution or escrow carveout..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                  >
                    Log Transaction Risk
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
