"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Eye,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  FileCheck2,
  Plus,
  Award,
  Check,
  Printer,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Building,
  Gavel,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  DetailDrawer,
  EmptyState,
} from "@/components/controls-audit/shared";
import ModalPortal from "@/components/ui/ModalPortal";

export default function ReportsPage() {
  const {
    activeDeal,
    showToast,
    selectedSide,
    setSelectedSide,
    callerSide,
    dueDiligenceCertificate,
    dealMeta,
    dealFolders,
    refreshAuditLogs,
  } = useControlsAudit();

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
  const dealName = activeDeal?.name || dealMeta?.dealName || "Naga raj Deal";
  const dealNumber =
    dealMeta?.dealNumber ||
    (activeDeal?.id ? `D-${activeDeal.id.slice(0, 5).toUpperCase()}` : "D-51013");
  const buyerCompany =
    activeDeal?.buyerName || dealMeta?.buyerCompany || "Naga Tech";
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

  // =========================================================================
  // THE 4 OFFICIAL DEAL DOCUMENTS (PER DEAL SCOPE):
  // 1. Due Diligence Certificate (DDC)
  // 2. Letter of Intent (LOI)
  // 3. Binding Term Sheet
  // 4. Share Purchase Agreement (SPA)
  // =========================================================================
  const dealDocuments = useMemo(() => {
    return [
      {
        id: "doc-ddc",
        docNumber: 1,
        title: "Certificate of Due Diligence Completion",
        subtitle: "Official Bilateral Closing Due Diligence Attestation & Workstream Sign-Off",
        badge: "Executive Diligence Attestation",
        status: "Fully Signed & Sealed (3/3)",
        statusType: "success",
        category: "Governance & Attestation",
        documentName: `Due_Diligence_Completion_Certificate_${certSerial}.pdf`,
        fileSize: "245 KB",
        fileFormat: "PDF Legal Package",
        date: "03 Nov 2026",
        serial: certSerial,
        description: `Official bilateral closing certification executed between ${buyerCompany} (Buyer Side) and ${sellerCompany} (Seller Side). Covers audited financials, corporate structure, IP/tax, and operational workstreams.`,
        metaItems: [
          { label: "Signatures", value: "Lead Advisor · Guest Admin · Super Admin" },
          { label: "Workstreams", value: "4 Folders Audited (126 Documents Verified)" },
          { label: "Integrity", value: "SHA-256 Verified Ledger Attestation" },
          { label: "Advancement", value: "Stage 3 Negotiation Unlocked" },
        ],
        downloadUrl: `/api/control-audits/reports/certificate-pdf?dealId=${activeDeal?.id || ""}`,
      },
      {
        id: "doc-loi",
        docNumber: 2,
        title: "Letter of Intent (LOI) & Acquisition Proposal",
        subtitle: "Binding Commercial Offer, Valuation & Diligence Contingencies Package",
        badge: "Binding Acquisition Proposal",
        status: "Verified & Accepted",
        statusType: "success",
        category: "Commercial & Acquisition",
        documentName: "Sample-Letter-of-Intent_Extended-Version.pdf",
        fileSize: "210 KB",
        fileFormat: "PDF Legal Package",
        date: "10 Nov 2026",
        serial: `LOI-${dealNumber}-2026`,
        description: `Official counterparty Letter of Intent and binding proposal filed by ${buyerCompany} proposing customized valuation terms, financing structure, and transaction timeline.`,
        metaItems: [
          { label: "Proposed Valuation", value: "$15.0M (+50% vs Ask Benchmark)" },
          { label: "Consideration Mix", value: "50% Cash / 50% Stock (Balance Sheet Equity)" },
          { label: "Target Close", value: "24 Nov 2026 (Nov 2026 Horizon)" },
          { label: "Submitter", value: `Vijay (@${buyerCompany}) · Received by Seller Board` },
        ],
        downloadUrl: `/api/control-audits/reports/document-pdf?type=loi&dealId=${activeDeal?.id || ""}`,
      },
      {
        id: "doc-term-sheet",
        docNumber: 3,
        title: "Binding M&A Term Sheet",
        subtitle: "Commercial Framework, Bilateral Exclusivity & Board Governance Agreement",
        badge: "Commercial Agreement",
        status: "Formulated & Approved",
        statusType: "success",
        category: "Legal Framework",
        documentName: `Binding_Term_Sheet_Executed_${dealNumber}.pdf`,
        fileSize: "185 KB",
        fileFormat: "PDF Legal Package",
        date: "12 Nov 2026",
        serial: `TS-${dealNumber}-FINAL`,
        description: `Bilateral commercial agreement formulating agreed valuation, 30-day exclusivity period, board representation, and conditions precedent agreed between buyer and seller boards.`,
        metaItems: [
          { label: "Agreed Valuation", value: "$15.0M Commercial Consensus" },
          { label: "Exclusivity Period", value: "30 Business Days Bilateral Exclusivity" },
          { label: "Governance Rights", value: "2 Board Seats, CapEx Supermajority" },
          { label: "Execution Lead", value: "Buyer Executive & Seller Board Lead" },
        ],
        downloadUrl: `/api/control-audits/reports/document-pdf?type=term-sheet&dealId=${activeDeal?.id || ""}`,
      },
      {
        id: "doc-spa",
        docNumber: 4,
        title: "Definitive Share Purchase Agreement (SPA)",
        subtitle: "Final Closing Instrument, Escrow Clearance & Equity Allocation Package",
        badge: "Definitive Closing Legal Package",
        status: "Dispatched & Execution Ready",
        statusType: "pending",
        category: "Definitive Closing",
        documentName: `Share_Purchase_Agreement_${dealNumber}_Final.pdf`,
        fileSize: "420 KB",
        fileFormat: "PDF Legal Package",
        date: "17 Nov 2026",
        serial: `SPA-${dealNumber}-FINAL`,
        description: `Final definitive Share Purchase Agreement governing asset purchase, share transfer covenants, escrow release mechanisms, representations & warranties, and closing execution.`,
        metaItems: [
          { label: "Transaction Value", value: "$15.0M Total Purchase Consideration" },
          { label: "Closing Escrow", value: "Escrow Release upon Joint Authorization" },
          { label: "Jurisdiction", value: "Delaware Corporate Law / Indian Jurisdiction" },
          { label: "Current Status", value: "Dispatched to Buyer for Formal Execution" },
        ],
        downloadUrl: `/api/control-audits/reports/document-pdf?type=spa&dealId=${activeDeal?.id || ""}`,
      },
    ];
  }, [activeDeal, certSerial, dealNumber, buyerCompany, sellerCompany]);

  // PDF Download Handler
  const handleDownloadPDF = (doc) => {
    let currentUserId = "";
    let currentUserName = "";
    try {
      const session = JSON.parse(localStorage.getItem("vdr_session") || "{}");
      currentUserId = session.id || localStorage.getItem("userId") || "";
      currentUserName = session.name || localStorage.getItem("userName") || "";
    } catch (_) {}

    const urlWithUser = `${doc.downloadUrl}&userId=${encodeURIComponent(currentUserId)}&userName=${encodeURIComponent(currentUserName)}`;

    const link = document.createElement("a");
    link.href = urlWithUser;
    link.download = doc.documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading official ${doc.title} (PDF) for ${dealName}.`, "success");

    if (typeof refreshAuditLogs === 'function') {
      setTimeout(() => refreshAuditLogs(), 600);
    }
  };

  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-7">
      {/* ── HEADER ── */}
      <PageHeader
        title="Compliance & Governance Reports"
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>4 Mandatory Deal Documents</span>
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              Target Deal: <strong className="text-slate-800">{dealName}</strong> ({dealNumber})
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

      {/* ── DEAL INSTRUMENTS SUMMARY STRIP ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#006666] shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Transaction Legal Instruments</h3>
            <p className="text-xs text-slate-500">
              Complete set of 4 mandatory bilateral closing documents executed for <strong className="text-slate-800">{dealName}</strong>. Available to both buyer and seller executives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-600">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            1. Due Diligence Certificate
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            2. Letter of Intent (LOI)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            3. Term Sheet
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            4. SPA Agreement
          </span>
        </div>
      </div>

      {/* ── THE 4 MANDATORY TRANSACTION DOCUMENTS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {dealDocuments.map((doc) => {
          const isDDC = doc.id === "doc-ddc";
          const isLOI = doc.id === "doc-loi";
          const isTS = doc.id === "doc-term-sheet";
          const isSPA = doc.id === "doc-spa";

          return (
            <div
              key={doc.id}
              className={`rounded-2xl p-6 shadow-2xs transition-all flex flex-col justify-between border ${
                isDDC
                  ? "bg-gradient-to-br from-white via-white to-teal-50/30 border-teal-500/50 ring-1 ring-teal-500/20"
                  : isLOI
                  ? "bg-gradient-to-br from-white via-white to-sky-50/30 border-sky-400/50 ring-1 ring-sky-400/20"
                  : isTS
                  ? "bg-gradient-to-br from-white via-white to-purple-50/30 border-purple-400/50 ring-1 ring-purple-400/20"
                  : "bg-gradient-to-br from-white via-white to-amber-50/30 border-amber-400/50 ring-1 ring-amber-400/20"
              }`}
            >
              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {doc.docNumber}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#006666]/10 text-[#006666] border border-[#006666]/20">
                      {doc.badge}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        doc.statusType === "success"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-teal-100 text-teal-800 border-teal-300"
                      }`}
                    >
                      <Check size={11} className="stroke-[3]" />
                      <span>{doc.status}</span>
                    </span>
                  </div>

                  <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {doc.fileSize}
                  </span>
                </div>

                {/* Title & Document File */}
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {doc.title}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {doc.subtitle}
                </p>

                {/* File Attachment Pill */}
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 w-full">
                  <FileText className="w-3.5 h-3.5 text-[#006666] shrink-0" />
                  <span className="font-mono font-bold truncate flex-1 text-slate-900">
                    {doc.documentName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {doc.fileFormat}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {doc.description}
                </p>

                {/* Key Metadata Table / Sub-grid */}
                <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  {doc.metaItems.map((meta, mIdx) => (
                    <div key={mIdx} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{meta.label}:</span>
                      <strong className="text-slate-800 font-semibold text-right truncate max-w-[240px]">
                        {meta.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActivePreviewReport(doc)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Eye size={14} className="text-[#006666]" />
                  <span>Interactive Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF(doc)}
                  className="px-4 py-2 bg-[#006666] hover:bg-[#005252] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── D. INTERACTIVE PREVIEW DRAWER / MODAL ── */}
      {activePreviewReport && (
        <DetailDrawer
          isOpen={Boolean(activePreviewReport)}
          onClose={() => setActivePreviewReport(null)}
          title={activePreviewReport.title}
          subtitle={`Deal: ${dealName} (${dealNumber}) • Bilateral Attestation Package`}
          badge={<StatusBadge status="completed" label={activePreviewReport.status} size="sm" />}
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Serial: {activePreviewReport.serial || certSerial} · SHA-256 Digest
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
                  title="Print Document or Save as PDF"
                >
                  <Printer size={14} className="text-slate-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleDownloadPDF(activePreviewReport)}
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
            {/* 1. DUE DILIGENCE COMPLETION CERTIFICATE PREVIEW                            */}
            {/* ========================================================================= */}
            {activePreviewReport.id === "doc-ddc" && (
              <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-7 bg-white relative shadow-xs space-y-6">
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

                {/* Review Coverage */}
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

                {/* Risk Summary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                      2. RISK SUMMARY · 3 FINDINGS LOGGED
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Audited from VDR Deal Register
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex mb-2">
                    <div style={{ width: "33%" }} className="bg-amber-500 h-full" title="High: 1" />
                    <div style={{ width: "67%" }} className="bg-blue-500 h-full" title="Medium: 2" />
                  </div>

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

                {/* 3 Signatures */}
                <div>
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-2.5">
                    3. MULTI-PARTY DIGITAL SIGNATORIES
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                      <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                        {advisorSig.signer}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {advisorSig.signer}
                      </div>
                      <div className="text-[11px] text-slate-500">{advisorSig.role}</div>
                      <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                        Certified · {advisorSig.timestamp}
                      </div>
                    </div>

                    <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                      <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                        {guestAdminSig.signer}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {guestAdminSig.signer}
                      </div>
                      <div className="text-[11px] text-slate-500">{guestAdminSig.role}</div>
                      <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                        Endorsed · {guestAdminSig.timestamp}
                      </div>
                    </div>

                    <div className="border-2 border-slate-200 rounded-xl p-3 bg-slate-50/60 relative">
                      <div className="h-8 flex items-center justify-center font-serif italic text-base text-[#006666]">
                        {superAdminSig.signer}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1">
                        {superAdminSig.signer}
                      </div>
                      <div className="text-[11px] text-slate-500">{superAdminSig.role}</div>
                      <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                        Accepted · {superAdminSig.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. LETTER OF INTENT (LOI) PREVIEW                                         */}
            {/* ========================================================================= */}
            {activePreviewReport.id === "doc-loi" && (
              <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-7 bg-white relative shadow-xs space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-sky-50 border-2 border-sky-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <FileText className="w-6 h-6 text-sky-600" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 block font-bold mb-0.5">
                    M&amp;A BINDING PROPOSAL INSTRUMENT
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight mb-1">
                    Letter of Intent (LOI)
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Ref: {activePreviewReport.serial} · Attached: Sample-Letter-of-Intent_Extended-Version.pdf (210 KB)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Executive Proposal Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Proposed Purchase Valuation:</span>
                      <strong className="block text-slate-900 text-sm mt-0.5">$15.0M (+50% vs Ask Benchmark)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Consideration Structure:</span>
                      <strong className="block text-slate-900 text-sm mt-0.5">50% Cash / 50% Stock</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Target Closing Date:</span>
                      <strong className="block text-slate-900 mt-0.5">24 Nov 2026</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Financing Structure:</span>
                      <strong className="block text-slate-900 mt-0.5">All equity / balance sheet cash</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Contingencies &amp; Offer Rationale
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <p><strong className="text-slate-800">Contingencies:</strong> Standard diligence completion, clearance of intellectual property schedules, and bilateral definitive agreement execution.</p>
                    <p><strong className="text-slate-800">Offer Rationale:</strong> Formal acquisition proposal filed with validated letter of intent attached under digital watermark verification.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Authorized Submitter: <strong>Vijay (@Naga Tech)</strong></span>
                  <span>Received &amp; Reviewed by Seller Board</span>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. BINDING TERM SHEET PREVIEW                                             */}
            {/* ========================================================================= */}
            {activePreviewReport.id === "doc-term-sheet" && (
              <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-7 bg-white relative shadow-xs space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-50 border-2 border-purple-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Gavel className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 block font-bold mb-0.5">
                    COMMERCIAL AGREEMENT
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight mb-1">
                    Binding M&amp;A Term Sheet
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Ref: {activePreviewReport.serial} · Key Terms Formulated &amp; Countersigned
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Commercial Price:</span>
                    <strong className="block text-slate-900 text-sm mt-0.5">$15.0M Agreed</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Exclusivity:</span>
                    <strong className="block text-slate-900 text-sm mt-0.5">30 Business Days</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Governance Covenants:</span>
                    <strong className="block text-slate-900 mt-0.5">2 Board Seats Assigned</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[11px]">CapEx Approval:</span>
                    <strong className="block text-slate-900 mt-0.5">Supermajority Required</strong>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Conditions Precedent
                  </h4>
                  <p>1. Negotiation and bilateral execution of definitive Share Purchase Agreement (SPA).</p>
                  <p>2. Receipt of all customary regulatory and compliance pre-clearance certificates.</p>
                  <p>3. Execution of definitive funds escrow agreement upon closing date.</p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. SHARE PURCHASE AGREEMENT (SPA) PREVIEW                                 */}
            {/* ========================================================================= */}
            {activePreviewReport.id === "doc-spa" && (
              <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-7 bg-white relative shadow-xs space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Building className="w-6 h-6 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 block font-bold mb-0.5">
                    DEFINITIVE CLOSING INSTRUMENT
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-slate-900 tracking-tight mb-1">
                    Share Purchase Agreement (SPA)
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Ref: {activePreviewReport.serial} · Definitive Transaction Closing Instrument
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Definitive Transaction Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500">Purchase Consideration:</span>
                      <strong className="block text-slate-900 text-sm mt-0.5">$15.0M Total Value</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Escrow Closing:</span>
                      <strong className="block text-slate-900 text-sm mt-0.5">Wiring Release on Digital Seal</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Governing Law:</span>
                      <strong className="block text-slate-900 mt-0.5">Delaware Corporate Law / India</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Execution Status:</span>
                      <strong className="block text-emerald-700 font-bold mt-0.5">Dispatched to Counterparty</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    Core Warranties &amp; Indemnity Caps
                  </h4>
                  <p>• Fundamental representations survivability: 36 months post-closing execution.</p>
                  <p>• General indemnity escrow retention pool: 10% of total cash consideration.</p>
                  <p>• Closing condition: Simultaneous execution of officer certificates and share transfer endorsement.</p>
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
                      Category
                    </label>
                    <select
                      value={scheduleForm.category}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
                    >
                      <option value="Governance">Governance</option>
                      <option value="Due Diligence">Due Diligence</option>
                      <option value="Access & Security">Access &amp; Security</option>
                      <option value="Compliance">Compliance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Delivery Frequency
                    </label>
                    <select
                      value={scheduleForm.frequency}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
                    >
                      <option value="Daily 08:00 UTC">Daily at 08:00 UTC</option>
                      <option value="Weekly (Every Monday)">Weekly (Every Monday)</option>
                      <option value="Milestone Stage Advancement">On Milestone Stage Advancement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recipient Notification Email
                  </label>
                  <input
                    type="email"
                    required
                    value={scheduleForm.recipientEmail}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, recipientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    Save &amp; Activate Schedule
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
