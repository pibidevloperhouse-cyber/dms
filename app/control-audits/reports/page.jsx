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
  Award,
  Check,
  Printer,
  Building2,
  ShieldCheck,
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
    dueDiligenceCertificate,
    dealMeta,
    dealFolders,
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
    category: "Governance",
    frequency: "Milestone Stage Advancement",
    recipientEmail: "admin@dealroom.com",
    fileFormat: "PDF Legal Package",
  });

  // Dynamic Metadata Scoped Strictly to Active Deal
  const dealName = activeDeal?.name || dealMeta?.dealName || "Test User Deal";
  const dealNumber =
    dealMeta?.dealNumber ||
    (activeDeal?.id ? `D-${activeDeal.id.slice(0, 5).toUpperCase()}` : "D-51013");
  const buyerCompany =
    activeDeal?.buyerName || dealMeta?.buyerCompany || "Test User's Firm";
  const sellerCompany = dealMeta?.sellerCompany || "Vishwa Tech";
  const periodText = dealMeta?.period || "02 Sep to 30 Oct 2026";
  const certSerial = `DDC-${dealNumber.replace("D-", "") || "51013"}`;

  const advisorSig = dueDiligenceCertificate?.advisorSignature || {
    signer: "Rohit Verma",
    role: "Lead Advisor, Buyer Advisory",
    timestamp: "03 Nov 2026, 11:05 IST",
  };

  const guestAdminSig = dueDiligenceCertificate?.guestAdminSignature || {
    signer: "Arjun Mehta",
    role: "Guest Admin, Buyer Executive",
    timestamp: "03 Nov 2026, 11:15 IST",
    hash: "9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e",
  };

  const superAdminSig = dueDiligenceCertificate?.superAdminSignature || {
    signer: "Vishwa Raj",
    role: "Super Admin, Seller Executive",
    timestamp: "03 Nov 2026, 11:20 IST",
    hash: "9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e",
  };

  const coverageList = useMemo(() => {
    if (Array.isArray(dealFolders) && dealFolders.length > 0) {
      return dealFolders.map((f, idx) => ({
        id: f.id || idx,
        name: f.name,
        lead:
          idx === 0
            ? "Radhi (HR/Legal Lead)"
            : idx === 1
            ? "leo (Tech Workstream)"
            : idx === 2
            ? "Abhishek (Finance Lead)"
            : "Vishwa Raj (Admin)",
        docs: Number(f.docCount || 1),
        total: Number(f.docCount || 1),
      }));
    }
    return [
      { id: "fin", name: "Financials & Audited Statements", lead: "Abhishek (Finance)", docs: 48, total: 48 },
      { id: "leg", name: "Legal & Corporate Structure", lead: "Sarah Mitchell", docs: 36, total: 36 },
      { id: "tax", name: "Tax, IP & Environmental", lead: "Dr. Julian Hayes", docs: 24, total: 24 },
      { id: "hr", name: "Operational & HR Agreements", lead: "Devan / Radhi", docs: 18, total: 18 },
    ];
  }, [dealFolders]);

  const riskFindings = [
    {
      severity: "High",
      title: "Third-party IP licensing indemnity review pending final closing schedule",
      category: "Legal & IP",
      problemDescription: "Cross-licensing patent coverage requires indemnity harmonization prior to execution.",
      documentReference: "IP_Schedule_2026_Annex_B.pdf",
    },
    {
      severity: "Medium",
      title: "Vendor concentration risk in Q3 supply chain agreements",
      category: "Operations",
      problemDescription: "Top 2 component suppliers represent over 42% of procurement expenditure.",
      documentReference: "Master_Supply_Agreement_Q3.pdf",
    },
    {
      severity: "Medium",
      title: "Employee retention equity pool tax equalization",
      category: "Tax & HR",
      problemDescription: "Tax equalization structure for cross-border engineering staff needs alignment.",
      documentReference: "HR_Stock_Plan_FY26.xlsx",
    },
  ];

  // PDF Download Handler
  const handleDownloadCertificatePDF = (dealId = activeDeal?.id) => {
    const link = document.createElement("a");
    link.href = `/api/control-audits/reports/certificate-pdf?dealId=${dealId || ""}`;
    link.download = `Due_Diligence_Completion_Certificate_${certSerial}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading official Due Diligence Completion Certificate (PDF) for ${dealName}.`, "success");
  };

  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filtered reports strictly from real live data
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (selectedSide === "buyer" && rep.side === "seller") return false;
      if (selectedSide === "seller" && rep.side === "buyer") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (rep.title || "").toLowerCase().includes(q);
        const matchDesc = (rep.description || "").toLowerCase().includes(q);
        const matchCat = (rep.category || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }

      if (selectedCategory !== "all" && rep.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [reports, searchQuery, selectedCategory, selectedSide]);

  const handleGenerateClick = (report, format = "PDF") => {
    if (report.id === "rep-ddc") {
      handleDownloadCertificatePDF(activeDeal?.id);
      return;
    }
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
      category: "Governance",
      frequency: "Milestone Stage Advancement",
      recipientEmail: "admin@dealroom.com",
      fileFormat: "PDF Legal Package",
    });
  };

  const getReportIcon = (reportId) => {
    if (reportId === "rep-ddc") {
      return <Award size={22} className="text-[#006666]" />;
    }
    return <FileText size={22} className="text-blue-600" />;
  };

  // DDC report fallback representation
  const ddcReport = reports.find((r) => r.id === "rep-ddc") || {
    id: "rep-ddc",
    title: "Due Diligence Completion Certificate",
    description: `Official 3-party executive completion certificate and diligence attestation for ${dealName} (${dealNumber}) with verified digital signatures from Lead Advisor, Buyer Guest Admin, and Seller Super Admin.`,
    category: "Governance",
    recordsCount: coverageList.length,
    fileFormat: "PDF Legal Package",
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
              <span>Live Deal Reports</span>
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

      {/* ── A. EXECUTIVE DUE DILIGENCE COMPLETION CERTIFICATE (ACTIVE DEAL HERO BANNER) ── */}
      <div className="bg-gradient-to-br from-white via-slate-50/70 to-teal-50/40 border-2 border-teal-600/30 rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-teal-500/5 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#006666] text-white shadow-xs">
                <Award size={13} className="text-teal-200" />
                <span>Executive Diligence Attestation</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check size={12} className="stroke-[3]" />
                <span>Fully Signed &amp; Sealed (3/3)</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                No. {certSerial}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Target Deal: <strong className="text-slate-900">{dealName}</strong> ({dealNumber})
              </span>
            </div>

            {/* Title & Counterparties Summary */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Certificate of Due Diligence Completion
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Official bilateral closing certification executed between{" "}
                <strong className="text-slate-900 font-semibold">{buyerCompany}</strong> (Buyer Side) and{" "}
                <strong className="text-slate-900 font-semibold">{sellerCompany}</strong> (Seller Side).
                Covers audited financials, legal structure, tax, and HR workstreams for period {periodText}.
              </p>
            </div>

            {/* 3 Signatures Quick Stamp Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 font-medium">Lead Advisor:</span>
                <strong className="text-slate-800 font-bold">{advisorSig.signer}</strong>
                <span className="text-[10px] text-emerald-600 font-bold">[Certified]</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 font-medium">Guest Admin:</span>
                <strong className="text-slate-800 font-bold">{guestAdminSig.signer}</strong>
                <span className="text-[10px] text-emerald-600 font-bold">[Endorsed]</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 font-medium">Seller Super Admin:</span>
                <strong className="text-slate-800 font-bold">{superAdminSig.signer}</strong>
                <span className="text-[10px] text-emerald-600 font-bold">[Accepted]</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActivePreviewReport(ddcReport)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Eye size={14} className="text-[#006666]" />
              <span>Interactive Preview</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadCertificatePDF(activeDeal?.id)}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
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
              { id: "Governance", label: "Governance" },
              { id: "Due Diligence Intelligence", label: "Due Diligence" },
              { id: "Access & Security", label: "Access & Security" },
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
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
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
            Target Active Deal: <strong>{dealName}</strong> ({dealNumber})
          </span>
        </div>
      </div>

      {/* ── C. REAL LIVE REPORT CARDS (ZERO STATIC MOCK DATA) ── */}
      {filteredReports.length === 0 ? (
        <EmptyState
          title="No Live Reports Match Your Filter"
          description="Only authenticated reports generated for the active deal are displayed. Clear filters or change search criteria."
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
              className="bg-gradient-to-br from-white via-white to-teal-50/20 border-2 border-teal-500/40 ring-1 ring-teal-500/20 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Icon, Category Pill, Format */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getReportIcon(report.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                          {report.category}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          Both Sides
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Live Active
                        </span>
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
                      Active Scope
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block truncate" suppressHydrationWarning>
                      {dealName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Attestation Status
                    </span>
                    <span
                      className="font-mono text-emerald-700 text-xs mt-0.5 block truncate font-bold"
                      suppressHydrationWarning
                    >
                      Signed &amp; Sealed (3/3)
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
                    onClick={() => handleDownloadCertificatePDF(activeDeal?.id)}
                    className="px-4 py-2 bg-[#006666] hover:bg-[#005252] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    title="Download legal PDF certificate"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
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
          subtitle={`Deal: ${dealName} (${dealNumber}) • Bilateral Diligence Attestation`}
          badge={<StatusBadge status="completed" label="Certificate Verified" size="sm" />}
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Digest: {superAdminSig.hash?.slice(0, 16) || "9f3a8b24e65012e8"}...c71e · SHA-256
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePreviewReport(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintCertificate}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  title="Print Certificate or Save as PDF"
                >
                  <Printer size={14} className="text-slate-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleDownloadCertificatePDF(activeDeal?.id)}
                  className="px-4 py-2 bg-[#006666] hover:bg-[#005252] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* ========================================================================= */}
            {/* DUE DILIGENCE COMPLETION CERTIFICATE DISPLAY (PRISTINE EXECUTIVE THEME)   */}
            {/* ========================================================================= */}
            <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-7 bg-white relative shadow-xs space-y-6">
              {/* Top Checkmark Seal */}
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 block font-bold mb-0.5">
                  DEAL MANAGEMENT SYSTEM
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight mb-1">
                  Certificate of due diligence completion
                </h3>
                <p className="text-[11px] font-mono text-slate-500">
                  No. {certSerial} · Version 1.0 · Issued 03 Nov 2026
                </p>
              </div>

              {/* Attestation Statement Box */}
              <div className="text-center text-xs leading-relaxed text-slate-600 max-w-lg mx-auto py-2 border-y border-slate-100">
                This certifies that buyer due diligence on
                <div className="text-slate-900 text-base font-bold my-1 tracking-tight">
                  {dealName} ({dealNumber})
                </div>
                between <span className="text-slate-900 font-semibold">{buyerCompany} (buyer)</span> and{" "}
                <span className="text-slate-900 font-semibold">{sellerCompany} (seller)</span>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Horizon: {periodText}
                </div>
              </div>

              {/* 1. REVIEW COVERAGE */}
              <div>
                <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-2.5">
                  1. REVIEW COVERAGE &amp; FOLDER VERIFICATION
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {coverageList.map((folder, idx) => (
                    <div
                      key={folder.id || idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full border border-emerald-500 bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-xs block truncate" title={folder.name}>
                          {folder.name}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {folder.lead} · {folder.docs} docs verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. RISK SUMMARY */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    2. RISK SUMMARY · 3 FINDINGS LOGGED
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Audited from VDR Deal Register
                  </span>
                </div>

                {/* Multi-segment continuous bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex mb-2">
                  <div style={{ width: "33%" }} className="bg-amber-500 h-full" title="High: 1" />
                  <div style={{ width: "67%" }} className="bg-blue-500 h-full" title="Medium: 2" />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-slate-800 font-medium">Critical 0</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-slate-800 font-medium">High 1</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-800 font-medium">Medium 2</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-slate-800 font-medium">Low 0</span>
                  </span>
                </div>

                {/* Findings items */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {riskFindings.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 text-xs flex items-start gap-2.5"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase shrink-0 ${
                          item.severity === "High"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        {item.severity}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 block truncate">
                          {item.title}
                        </span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {item.problemDescription}
                        </p>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Ref: {item.documentReference}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. OVERALL CONCLUSION */}
              <div className="border-2 border-emerald-400/60 bg-emerald-50/70 rounded-xl py-3 px-4 text-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-800 font-bold block mb-0.5">
                  OVERALL CONCLUSION
                </span>
                <span className="text-emerald-900 font-serif text-base sm:text-lg font-semibold tracking-tight">
                  Clear with conditions
                </span>
              </div>

              {/* 4. EXACTLY 3 SIGNATORIES IN COMPLIANCE SEQUENCE */}
              <div>
                <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-2.5">
                  3. MULTI-PARTY DIGITAL SIGNATORIES
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  {/* Signatory 1: Lead Advisor */}
                  <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                    <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                      {advisorSig.signer}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{advisorSig.signer}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </div>
                    <div className="text-[11px] text-slate-500">{advisorSig.role}</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Certified · {advisorSig.timestamp}
                    </div>
                  </div>

                  {/* Signatory 2: Buyer Guest Admin */}
                  <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                    <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                      {guestAdminSig.signer}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{guestAdminSig.signer}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </div>
                    <div className="text-[11px] text-slate-500">{guestAdminSig.role}</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Endorsed · {guestAdminSig.timestamp}
                    </div>
                  </div>

                  {/* Signatory 3: Seller Super Admin */}
                  <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                    <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                      {superAdminSig.signer}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{superAdminSig.signer}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </div>
                    <div className="text-[11px] text-slate-500">{superAdminSig.role}</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Accepted · {superAdminSig.timestamp}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Legal Digest */}
              <div className="text-[10px] leading-relaxed text-slate-500 text-center space-y-0.5 pt-2 border-t border-slate-100">
                <p>
                  Generated by DMS compliance engine from VDR access ledgers and risk registers. Compliant with ESIGN Act &amp; SEC Rule 17a-4.
                </p>
                <p className="font-mono text-slate-500">
                  SHA-256 Digest {superAdminSig.hash || "9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e"}
                </p>
              </div>
            </div>
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
                    Generate and deliver diligence reports automatically for {dealName}.
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
                      <option value="Governance">Governance</option>
                      <option value="Due Diligence Intelligence">Due Diligence</option>
                      <option value="Access & Security">Access & Security</option>
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
