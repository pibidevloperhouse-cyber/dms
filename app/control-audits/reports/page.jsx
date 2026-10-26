"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Flame,
  ScrollText,
  ShieldAlert,
  Download,
  Calendar,
  Eye,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  FileCode2,
  ChevronRight,
  X,
  FileCheck2,
  RefreshCw,
  Plus,
  Send,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  DetailDrawer,
  EmptyState,
  formatAuditDate,
} from "@/components/controls-audit/shared";
import ModalPortal from "@/components/ui/ModalPortal";

export default function ReportsPage() {
  const {
    activeDeal,
    reports,
    generateReport,
    showToast,
    selectedSide,
    setSelectedSide,
    callerSide,
  } = useControlsAudit();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("inception");

  // Preview Drawer state
  const [activePreviewReport, setActivePreviewReport] = useState(null);

  // Schedule Custom Report Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    category: "Access & Security",
    frequency: "Weekly Digest",
    recipientEmail: "v.sterling@acme-holdings.com",
    fileFormat: "PDF Legal Package",
  });

  // Filtered reports by search, category, and party side
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (selectedSide === "buyer" && rep.id === "rep-003") return false;
      if (selectedSide === "seller" && rep.id === "rep-002") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = rep.title.toLowerCase().includes(q);
        const matchDesc = rep.description.toLowerCase().includes(q);
        const matchCat = rep.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      if (selectedCategory !== "all" && rep.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [reports, searchQuery, selectedCategory, selectedSide]);

  const handleGenerateClick = (report, format = "PDF") => {
    generateReport(report.id, format);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.title.trim()) {
      showToast("Report title is required.", "error");
      return;
    }

    showToast(`Scheduled custom report "${scheduleForm.title}" for ${scheduleForm.frequency}.`, "success");
    setIsScheduleModalOpen(false);
    setScheduleForm({
      title: "",
      category: "Access & Security",
      frequency: "Weekly Digest",
      recipientEmail: "v.sterling@acme-holdings.com",
      fileFormat: "PDF Legal Package",
    });
  };

  const getReportIcon = (reportId) => {
    switch (reportId) {
      case "rep-001":
        return <FileText size={22} className="text-blue-600" />;
      case "rep-002":
        return <Flame size={22} className="text-amber-500" />;
      case "rep-003":
        return <ScrollText size={22} className="text-emerald-600" />;
      case "rep-004":
        return <ShieldAlert size={22} className="text-purple-600" />;
      default:
        return <BarChart3 size={22} className="text-[var(--brand)]" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-7">
      {/* ── HEADER ── */}
      <PageHeader
        title="Compliance & Governance Reports"

        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>4 Standard Reports Available</span>
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Party Side Toggle for Super Admin */}
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
            ) : callerSide === "buyer" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Buyer Diligence Reports
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                Seller Room Reports
              </span>
            )}

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-3.5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Schedule Custom Report</span>
            </button>
          </div>
        }
      />

      {/* ── A. 4 METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Templates
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              4 Standards
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ready for instant export</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--brand)] flex items-center justify-center font-bold">
            <FileCheck2 size={18} />
          </div>
        </div>

        {/* Diligence Records Tracked */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Diligence Records
            </span>
            <div className="text-2xl font-extrabold text-blue-800 tracking-tight">
              2,327+ Logs
            </div>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Watermarked views & downloads</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
        </div>

        {/* Security Breaches Audited */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Security Incidents
            </span>
            <div className="text-2xl font-extrabold text-purple-800 tracking-tight">
              19 Breaches
            </div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Denied access attempts blocked</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldAlert size={18} />
          </div>
        </div>

        {/* Cryptographic Assurance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Ledger Integrity
            </span>
            <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
              SHA-256
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Verifiable chain of custody</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Lock size={18} />
          </div>
        </div>
      </div>

      {/* ── B. FILTER TOOLBAR ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, category, or contents..."
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

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Categories" },
              { id: "Access & Security", label: "Access & Security" },
              { id: "Due Diligence Intelligence", label: "Diligence Heatmap" },
              { id: "Governance", label: "Governance" },
              { id: "Compliance & Security", label: "Compliance" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <Calendar size={13} className="text-slate-400" />
          <span>Evaluation Horizon:</span>
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)]"
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="inception">Deal Inception to Date (Full Transaction)</option>
          </select>
          <span className="text-slate-400 text-[11px] ml-auto">
            Target Deal: <strong>{activeDeal.name}</strong>
          </span>
        </div>
      </div>

      {/* ── C. 4 ENTERPRISE REPORT CARDS ── */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="No Reports Match Your Filter"
          description="Try broadening your search query or selecting 'All Categories'."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("all");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Icon, Category Pill, Format */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getReportIcon(report.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {report.category}
                        </span>
                        {report.id === "rep-002" ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            Buyer Side
                          </span>
                        ) : report.id === "rep-003" ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Seller Side
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200/60">
                            Both Sides
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors">
                        {report.title}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-semibold shrink-0">
                    {report.fileFormat}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {report.description}
                </p>

                {/* Report Statistics Sub-grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Records Indexed
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block" suppressHydrationWarning>
                      {Number(report.recordsCount).toLocaleString("en-US")} Entries
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Last Generated
                    </span>
                    <span
                      className="font-mono text-slate-600 text-xs mt-0.5 block truncate"
                      title={formatAuditDate(report.generatedAt).full}
                      suppressHydrationWarning
                    >
                      {formatAuditDate(report.generatedAt).full}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActivePreviewReport(report)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye size={14} className="text-slate-500" />
                  <span>Interactive Preview</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateClick(report, "CSV")}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                    title="Generate and download CSV data"
                  >
                    <Download size={13} className="text-slate-500" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleGenerateClick(report, "PDF")}
                    className="px-3.5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    title="Generate legal PDF package"
                  >
                    <Download size={13} />
                    <span>Export Package</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── D. INTERACTIVE PREVIEW DRAWER / MODAL ── */}
      {activePreviewReport && (
        <DetailDrawer
          isOpen={Boolean(activePreviewReport)}
          onClose={() => setActivePreviewReport(null)}
          title={activePreviewReport.title}
          subtitle={`Deal: ${activeDeal.name} • ${activePreviewReport.recordsCount} Indexed Records`}
          badge={<StatusBadge status="completed" label="Report Verified" size="sm" />}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500 font-mono">
                SHA-256 Digest: d8e29a...04bc
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePreviewReport(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleGenerateClick(activePreviewReport, "PDF")}
                  className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download Full Package</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Context Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <h4 className="font-bold text-slate-900 text-xs mb-1">
                Executive Intelligence Summary
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activePreviewReport.description}
              </p>
            </div>

            {/* SPECIFIC REPORT VISUALIZATIONS */}
            {activePreviewReport.id === "rep-002" ? (
              /* BUYER ENGAGEMENT HEATMAP */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Buyer Due Diligence Engagement Matrix (Past Week)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Intensity: Views / Downloads per Folder
                  </span>
                </div>

                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl p-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2 px-2">Data Room Folder</th>
                        <th className="py-2 px-2 text-center">Mon</th>
                        <th className="py-2 px-2 text-center">Tue</th>
                        <th className="py-2 px-2 text-center">Wed</th>
                        <th className="py-2 px-2 text-center">Thu</th>
                        <th className="py-2 px-2 text-center">Fri</th>
                        <th className="py-2 px-2 text-right">Total Reads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { folder: "01 Financials & Audited Statements", scores: [12, 24, 48, 62, 35], total: 181 },
                        { folder: "02 Legal & Corporate Structure", scores: [18, 30, 42, 55, 29], total: 174 },
                        { folder: "03 Intellectual Property & Patents", scores: [8, 14, 26, 38, 19], total: 105 },
                        { folder: "04 Operational & HR Agreements", scores: [5, 11, 18, 22, 14], total: 70 },
                        { folder: "05 Tax & Environmental Disclosures", scores: [14, 28, 52, 64, 41], total: 199 },
                      ].map((row) => (
                        <tr key={row.folder} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-semibold text-slate-800 text-[11px]">
                            {row.folder}
                          </td>
                          {row.scores.map((score, idx) => {
                            const bgIntensity =
                              score > 50
                                ? "bg-[var(--brand)] text-white font-bold"
                                : score > 30
                                ? "bg-[var(--brand)]/70 text-white font-semibold"
                                : score > 15
                                ? "bg-[var(--brand)]/30 text-slate-900"
                                : "bg-[var(--brand)]/10 text-slate-700";
                            return (
                              <td key={idx} className="py-2 px-2 text-center">
                                <span
                                  className={`inline-block w-8 py-1 rounded-md text-[10px] text-center ${bgIntensity}`}
                                >
                                  {score}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-2 text-right font-extrabold text-slate-900 text-[11px]">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500">
                  <span>Low Activity</span>
                  <span className="w-3.5 h-3.5 rounded bg-[var(--brand)]/10 border border-slate-200" />
                  <span className="w-3.5 h-3.5 rounded bg-[var(--brand)]/30" />
                  <span className="w-3.5 h-3.5 rounded bg-[var(--brand)]/70" />
                  <span className="w-3.5 h-3.5 rounded bg-[var(--brand)]" />
                  <span>Peak Diligence Activity</span>
                </div>
              </div>
            ) : activePreviewReport.id === "rep-003" ? (
              /* APPROVAL TRAIL LEGAL REPORT */
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Verifiable Chain of Custody & Signoff Log
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      doc: "SPA_Draft_v2.pdf",
                      version: "v2.4",
                      step: "Step 1: Legal Counsel Review",
                      signer: "Sarah Mitchell (Seller Legal)",
                      timestamp: "2026-09-08 14:15 UTC",
                      hash: "e7f891...091c",
                      status: "Approved",
                    },
                    {
                      doc: "Disclosure_Schedule_Q3.xlsx",
                      version: "v1.8",
                      step: "Step 1: Financial Controller Signoff",
                      signer: "David Chen (Seller Finance)",
                      timestamp: "2026-09-07 10:20 UTC",
                      hash: "a4c211...771b",
                      status: "Approved",
                    },
                    {
                      doc: "Tax_Indemnity_Letter.pdf",
                      version: "v1.1",
                      step: "Step 1: Tax Partner Review",
                      signer: "Victoria Sterling (Seller Admin)",
                      timestamp: "2026-09-05 16:45 UTC",
                      hash: "f1b882...990d",
                      status: "Approved",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ScrollText size={14} className="text-emerald-600" />
                          <span className="font-bold text-slate-900 text-xs">
                            {item.doc}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            [{item.version}]
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400">Step:</span> {item.step}
                        </div>
                        <div>
                          <span className="text-slate-400">Signer:</span> {item.signer}
                        </div>
                        <div>
                          <span className="text-slate-400">Time:</span> {item.timestamp}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          <span className="text-slate-400">Cert Hash:</span> {item.hash}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activePreviewReport.id === "rep-004" ? (
              /* DENIED ACCESS SECURITY REPORT */
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Forensic Log of Blocked Permission & Policy Breaches
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      actor: "Alexander Vance (Buyer Admin)",
                      action: "Attempted Raw Document Download",
                      target: "Tax_Indemnity_Letter.pdf",
                      reason: "External clean room policy restricts unwatermarked direct download",
                      ip: "198.51.100.42",
                      time: "2026-09-08 11:05 UTC",
                      status: "Denied & Blocked",
                    },
                    {
                      actor: "c.dupont@regulatory-sandbox.gov",
                      action: "Generate Public Share Link",
                      target: "HSR_Filing_Package_v1.pdf",
                      reason: "External sharing prohibited for unapproved domain",
                      ip: "203.0.113.19",
                      time: "2026-09-07 14:10 UTC",
                      status: "Flagged & Blocked",
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50/40 border border-rose-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 text-xs">
                          {item.action}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        <strong className="text-slate-800">Reason:</strong> {item.reason}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-100 font-mono">
                        <span>Actor: {item.actor}</span>
                        <span>{item.time} • IP: {item.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* DOCUMENT ACCESS REPORT (rep-001) */
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Document Reads & Watermarked Exports
                </h4>
                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Document</th>
                        <th className="py-2.5 px-3">Action</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Watermark ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { user: "Elena Rostova", doc: "SPA_Draft_v2.pdf", act: "Viewed in Viewer", dur: "14m 20s", wmark: "WM-99014" },
                        { user: "Alexander Vance", doc: "Financial_Model_FY26.xlsx", act: "Watermarked Download", dur: "—", wmark: "WM-99015" },
                        { user: "Dr. Julian Hayes", doc: "Phase_II_Soil_Audit.pdf", act: "Clean Room View", dur: "28m 10s", wmark: "WM-99016" },
                        { user: "David Chen", doc: "Cap_Table_Aug2026.xlsx", act: "Viewed in Viewer", dur: "6m 45s", wmark: "WM-99017" },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800 text-[11px]">{row.user}</td>
                          <td className="py-2 px-3 text-slate-700 text-[11px]">{row.doc}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {row.act}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{row.dur}</td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{row.wmark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}

      {/* ── E. SCHEDULE CUSTOM REPORT MODAL ── */}
      {isScheduleModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Schedule Automated Compliance Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Generate and deliver diligence reports automatically for {activeDeal.name}.
                  </p>
                </div>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                    placeholder="e.g., Weekly Buyer Diligence Velocity Briefing"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Report Category
                    </label>
                    <select
                      value={scheduleForm.category}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    >
                      <option value="Access & Security">Access & Security</option>
                      <option value="Due Diligence Intelligence">Diligence Intelligence</option>
                      <option value="Governance">Governance</option>
                      <option value="Compliance & Security">Compliance & Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Delivery Frequency
                    </label>
                    <select
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                    >
                      <option value="Daily Executive Digest">Daily Digest (9:00 AM UTC)</option>
                      <option value="Weekly Digest">Weekly Digest (Monday 8:00 AM)</option>
                      <option value="Milestone Stage Advancement">On Stage Advancement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={scheduleForm.recipientEmail}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, recipientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Delivery Package Format
                  </label>
                  <select
                    value={scheduleForm.fileFormat}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, fileFormat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
                  >
                    <option value="PDF Legal Package">PDF Legal Package with SHA-256 Signatures</option>
                    <option value="CSV Raw Data Package">CSV Compressed Data Package</option>
                    <option value="JSON Forensic Object">JSON Cryptographic Forensic Archive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Activate Schedule</span>
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
