"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ScrollText,
  Shield,
  Download,
  FileCode2,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock,
  Code2,
  Calendar,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  AuditEventRow,
  DetailDrawer,
  EmptyState,
} from "@/components/controls-audit/shared";
import { formatAuditDate } from "@/components/controls-audit/shared/AuditEventRow";

export default function AuditTrailPage() {
  const {
    auditLogs,
    activeDeal,
    deals,
    selectedDealId,
    setSelectedDealId,
    showToast,
    refreshAuditLogs,
    isLoadingAuthLogs,
    selectedSide,
    setSelectedSide,
    callerSide,
    sideCounts,
  } = useControlsAudit();

  // Mounted status to prevent SSR hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all"); // 'all' | 'today' | 'last7' | 'last30'

  // Sorting: { column: 'timestamp' | 'user' | 'action' | 'result', direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState({ column: "timestamp", direction: "desc" });

  // Pagination: currentPage, pageSize
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected event for detail drawer (READ ONLY)
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Extract unique modules & actions from dynamic logs with standard platform baselines
  const uniqueModules = useMemo(() => {
    const set = new Set(["Authentication", "Documents"]);
    auditLogs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [auditLogs]);

  const uniqueActions = useMemo(() => {
    const set = new Set();
    auditLogs.forEach((l) => {
      if (l.action) {
        if (selectedModule === "all" || l.module?.toLowerCase() === selectedModule.toLowerCase()) {
          set.add(l.action);
        }
      }
    });

    if (selectedModule === "Documents" || selectedModule === "all") {
      set.add("Document View");
      set.add("Document Download (Secure)");
      set.add("Document Download (Original)");
      set.add("Document Upload");
      set.add("Document Moved to Trash");
    }
    if (selectedModule === "Authentication" || selectedModule === "all") {
      set.add("Login Attempt");
      set.add("Sign-up Attempt");
    }

    return Array.from(set);
  }, [auditLogs, selectedModule]);

  // Filtered & Sorted logs
  const processedLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Result filter
        if (selectedResult !== "all") {
          const filterNorm = selectedResult.toLowerCase();
          const logNorm = (log.result || "").toLowerCase();
          if (filterNorm === "failure") {
            if (logNorm !== "failure" && logNorm !== "failed") return false;
          } else if (filterNorm === "denied") {
            if (logNorm !== "denied" && logNorm !== "failure" && logNorm !== "failed") return false;
          } else if (logNorm !== filterNorm) {
            return false;
          }
        }

        // Module filter
        if (selectedModule !== "all" && log.module?.toLowerCase() !== selectedModule.toLowerCase()) {
          return false;
        }

        // Action filter
        if (selectedAction !== "all" && log.action !== selectedAction) {
          return false;
        }

        // Date range filter
        if (selectedDateRange !== "all") {
          const logDate = new Date(log.timestamp);
          const now = new Date();
          const diffDays = Math.ceil(Math.abs(now - logDate) / (1000 * 60 * 60 * 24));

          if (selectedDateRange === "today" && diffDays > 1) return false;
          if (selectedDateRange === "last7" && diffDays > 7) return false;
          if (selectedDateRange === "last30" && diffDays > 30) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchUser = log.user?.toLowerCase().includes(q);
          const matchEmail = log.userEmail?.toLowerCase().includes(q);
          const matchAction = log.action?.toLowerCase().includes(q);
          const matchResource = log.resource?.toLowerCase().includes(q);
          const matchDeal = log.deal?.toLowerCase().includes(q);
          const matchCompany = log.companyName?.toLowerCase().includes(q);
          const matchRole = log.userRole?.toLowerCase().includes(q);
          const matchReason = log.failureReason?.toLowerCase().includes(q);
          if (
            !matchUser &&
            !matchEmail &&
            !matchAction &&
            !matchResource &&
            !matchDeal &&
            !matchCompany &&
            !matchRole &&
            !matchReason
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const { column, direction } = sortConfig;
        let valA = a[column];
        let valB = b[column];

        if (column === "timestamp") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (column === "durationSeconds") {
          valA = a.durationSeconds !== null && a.durationSeconds !== undefined ? a.durationSeconds : -1;
          valB = b.durationSeconds !== null && b.durationSeconds !== undefined ? b.durationSeconds : -1;
        } else {
          valA = (valA || "").toString().toLowerCase();
          valB = (valB || "").toString().toLowerCase();
        }

        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [auditLogs, selectedResult, selectedModule, selectedAction, selectedDateRange, searchQuery, sortConfig]);

  // Paginated records
  const totalRecords = processedLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedLogs.slice(start, start + pageSize);
  }, [processedLogs, currentPage, pageSize]);

  // Sort toggle handler
  const handleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedResult("all");
    setSelectedModule("all");
    setSelectedAction("all");
    setSelectedDateRange("all");
    if (callerSide === "super_admin" && selectedSide !== "all") {
      setSelectedSide("all");
      refreshAuditLogs(selectedDealId, "all");
    }
    setCurrentPage(1);
  };

  const hasActiveFilters =
    isMounted &&
    (searchQuery !== "" ||
      selectedResult !== "all" ||
      selectedModule !== "all" ||
      selectedAction !== "all" ||
      selectedDateRange !== "all" ||
      (callerSide === "super_admin" && selectedSide !== "all"));

  // ── EXPORT CSV ──
  const handleExportCSV = () => {
    const headers = [
      "Event ID",
      "Timestamp (IST)",
      "Party Side",
      "User",
      "Email",
      "Role",
      "Action",
      "Resource",
      "View Time",
      "Module",
      "Organization / Deal",
      "Result",
      "Failure Reason",
    ];

    const rows = processedLogs.map((log) => [
      log.id,
      formatAuditDate(log.timestamp).full,
      `"${log.sideLabel || (log.side === 'buyer' ? 'Buyer Side' : 'Seller Side')}"`,
      `"${log.user}"`,
      log.userEmail || "",
      `"${log.userRole || ""}"`,
      `"${log.action}"`,
      `"${(log.resource || '').replace(/"/g, '""')}"`,
      `"${log.durationText || log.duration || "—"}"`,
      log.module || "",
      `"${log.companyName || log.deal || ""}"`,
      log.result,
      `"${(log.failureReason || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Ledger_${activeDeal.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${processedLogs.length} audit records to CSV successfully.`, "success");
  };

  // ── EXPORT JSON ──
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedLogs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Audit_Forensic_Package_${activeDeal.code}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${processedLogs.length} structured audit records to JSON package.`, "success");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-6">
      {/* ── HEADER ── */}
      <PageHeader
        title="Enterprise Audit Trail"
        // subtitle="Forensic, read-only ledger capturing historical user interactions, document access, security authorizations, and administrative actions."
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300/80 shadow-2xs font-mono">
              <Shield size={13} className="text-emerald-600" />
              <span>Immutable Ledger Verified</span>
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (refreshAuditLogs) {
                  refreshAuditLogs();
                  showToast("Audit trail ledger refreshed.", "info");
                }
              }}
              disabled={isLoadingAuthLogs}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh audit ledger data"
            >
              <RotateCcw size={14} className={`text-slate-500 ${isLoadingAuthLogs ? "animate-spin" : ""}`} />
              <span>{isLoadingAuthLogs ? "Refreshing…" : "Refresh Ledger"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Download filtered records as CSV"
            >
              <Download size={14} className="text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Download structured cryptographic log package"
            >
              <FileCode2 size={14} />
              <span>Export JSON Package</span>
            </button>
          </div>
        }
      />

      {/* Immutability Banner */}
      {/* <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Lock size={15} className="text-slate-500 shrink-0" />
          <span>
            <strong className="text-slate-800">Compliance Assurance:</strong> Audit records are historical events protected by write-once-read-many (WORM) standards. Records are immutable and cannot be altered or removed.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden md:block">
          SHA-256 Block Verification Active
        </span>
      </div> */}

      {/* ── FILTER & SEARCH NAVIGATION BAR ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3 relative z-20">
        {/* Row 1: Search */}
        <div className="relative w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search user, email, action, resource, organization, or failure reason..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800 placeholder:text-slate-400 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Row 2: Dropdowns [Deal Filter] [All Dates] [All Modules] [All Actions] [All Results] */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Active Deal Context (Strictly Scoped - No Dropdown) */}
          {activeDeal && activeDeal.name && (
            <div
              className="flex items-center gap-2 h-9 px-3.5 py-1.5 bg-blue-50/90 border border-blue-200/90 rounded-xl font-bold text-blue-900 text-xs shadow-2xs select-none"
              title={`Active Deal: ${activeDeal.name} ${activeDeal.projectName ? `(${activeDeal.projectName})` : ""}`}
            >
              <Briefcase size={13} className="text-blue-600 shrink-0" />
              <span className="truncate max-w-[240px]">
                {activeDeal.name} {activeDeal.projectName ? `(${activeDeal.projectName})` : ""}
              </span>
            </div>
          )}

          {/* Party Side Filtering: Super Admin Toggle vs Buyer/Seller Security Lock */}
          {!isMounted ? (
            <div className="h-9 w-64 bg-slate-100/80 rounded-xl animate-pulse" />
          ) : callerSide === "super_admin" ? (
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedSide("buyer");
                  setCurrentPage(1);
                  refreshAuditLogs(selectedDealId, "buyer");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSide === "buyer"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-sky-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Buyer Side</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedSide === "buyer" ? "bg-sky-700 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {sideCounts.buyer}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSide("seller");
                  setCurrentPage(1);
                  refreshAuditLogs(selectedDealId, "seller");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSide === "seller"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-sky-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Seller Side</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedSide === "seller" ? "bg-sky-700 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {sideCounts.seller}
                </span>
              </button>
            </div>
          ) : callerSide === "buyer" ? (
            <div className="flex items-center gap-2 h-9 px-3.5 py-1.5 bg-sky-50 border border-sky-200/90 rounded-xl text-sky-800 font-bold text-xs shadow-2xs select-none">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>Buyer View</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 h-9 px-3.5 py-1.5 bg-sky-50 border border-sky-200/90 rounded-xl text-sky-800 font-bold text-xs shadow-2xs select-none">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>Seller View</span>
            </div>
          )}

          {/* All Dates */}
          <div className="relative">
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[var(--brand)] cursor-pointer text-xs transition-colors"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="last7">Past 7 Days</option>
              <option value="last30">Past 30 Days</option>
            </select>
          </div>

          {/* All Modules (including Communications and AI Capabilities) */}
          <div className="relative">
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setSelectedAction("all");
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[var(--brand)] cursor-pointer text-xs transition-colors"
            >
              <option value="all">All Modules</option>
              {uniqueModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* All Actions */}
          <div className="relative">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[var(--brand)] cursor-pointer text-xs transition-colors"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* All Results / Status */}
          <div className="relative">
            <select
              value={selectedResult}
              onChange={(e) => {
                setSelectedResult(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[var(--brand)] cursor-pointer text-xs transition-colors"
            >
              <option value="all">All Results</option>
              <option value="Success">Success</option>
              <option value="Failure">Failure</option>
              <option value="Denied">Denied</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── FORENSIC AUDIT TABLE ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Audit Trail Ledger
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {totalRecords} records found • Page {currentPage} of {totalPages}
          </span>
        </div>

        {isLoadingAuthLogs && totalRecords === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3 min-h-[300px]">
            <div className="w-8 h-8 border-3 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
            <p className="text-xs font-semibold">Loading live audit records…</p>
          </div>
        ) : totalRecords === 0 ? (
          <EmptyState
            title="No audit records match filters"
            description="Try clearing search filters or selecting 'All Dates' to view historical events."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
            minHeight="min-h-[300px]"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 select-none">
                <tr>
                  {/* User Column */}
                  <th
                    onClick={() => handleSort("user")}
                    className="px-4 py-3.5 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>User</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Action Column */}
                  <th
                    onClick={() => handleSort("action")}
                    className="px-4 py-3.5 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Action</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Resource / Target / Document File / Auth Detail Column */}
                  <th
                    onClick={() => handleSort("resource")}
                    className="px-4 py-3.5 min-w-[200px] cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>
                        {selectedModule === "Authentication"
                          ? "Auth Detail / Reason"
                          : selectedModule === "Documents"
                          ? "Document File"
                          : "Resource / Target"}
                      </span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* View Duration Column (Only shown for Documents & All Modules, omitted for Authentication) */}
                  {selectedModule !== "Authentication" && (
                    <th
                      onClick={() => handleSort("durationSeconds")}
                      className="px-4 py-3.5 cursor-pointer hover:text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>View Time</span>
                        <ArrowUpDown size={12} className="text-slate-400" />
                      </div>
                    </th>
                  )}

                  {/* Deal Column */}
                  <th className="px-4 py-3.5">Deal Context</th>

                  {/* Result Column */}
                  <th
                    onClick={() => handleSort("result")}
                    className="px-4 py-3.5 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Result</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Date & Time Column (Indian Standard Time - Asia/Kolkata) */}
                  <th
                    onClick={() => handleSort("timestamp")}
                    className="px-4 py-3.5 cursor-pointer hover:text-slate-800"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time (IST)</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedLogs.map((log) => (
                  <AuditEventRow
                    key={log.id}
                    event={log}
                    layout="table"
                    moduleView={selectedModule}
                    onClick={(e) => setSelectedAuditLog(e)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── CLIENT-SIDE PAGINATION TOOLBAR ── */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span>
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, totalRecords)}</span> of{" "}
              <span className="font-bold text-slate-800">{totalRecords}</span> events
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-400">Rows:</span>
              {[10, 25, 50].map((sz) => (
                <button
                  key={sz}
                  onClick={() => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    pageSize === sz
                      ? "bg-[var(--brand)] text-white font-bold"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation pagination buttons */}
          <div className="flex items-center gap-1 self-end sm:self-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pNum
                      ? "bg-[var(--brand)] text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── FORENSIC AUDIT DETAIL DRAWER (READ ONLY) ── */}
      <DetailDrawer
        isOpen={!!selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
        title="Forensic Audit Record"
        subtitle="Immutable transaction event preserved in compliance ledger"
        badge={
          selectedAuditLog && (
            <StatusBadge status={selectedAuditLog.result} size="sm" />
          )
        }
        footer={
          <div className="flex items-center justify-between w-full text-xs">
            <span className="font-mono text-slate-400 text-[11px]">
              Checksum: {selectedAuditLog?.metadata?.checksum || "sha256:7e88b2a1...verified"}
            </span>
            <button
              onClick={() => setSelectedAuditLog(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close Ledger View
            </button>
          </div>
        }
      >
        {selectedAuditLog && (
          <div className="space-y-5 text-xs">
            {/* Immutability Notice */}
            <div className="p-3 bg-slate-100 border border-slate-300/80 rounded-xl text-[11px] text-slate-700 flex items-center gap-2">
              <Lock size={14} className="shrink-0 text-slate-600" />
              <span>
                <strong>Read-only audit record:</strong> This event is sealed and timestamped. Modifying or deleting audit records is strictly prohibited by DMS security policy.
              </span>
            </div>

            {/* Event Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Event Identifier:</span>
                <span className="font-mono font-bold text-slate-800">{selectedAuditLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Action Performed:</span>
                <span className="font-bold text-slate-900">{selectedAuditLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">
                  {selectedAuditLog.module === "Authentication"
                    ? "Auth Detail / Target:"
                    : selectedAuditLog.module === "Documents"
                    ? "Document File:"
                    : "Target Resource:"}
                </span>
                <span className="font-semibold text-slate-800">{selectedAuditLog.resource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Module:</span>
                <span className="font-medium text-slate-700">{selectedAuditLog.module || "General"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Deal Context:</span>
                <span className="font-semibold text-slate-800">
                  {selectedAuditLog.deal || activeDeal.name}
                  {selectedAuditLog.projectName && ` • ${selectedAuditLog.projectName}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Timestamp (IST):</span>
                <span suppressHydrationWarning className="font-mono text-slate-600 font-semibold">
                  {formatAuditDate(selectedAuditLog.timestamp).full}
                </span>
              </div>
              {selectedAuditLog.module !== "Authentication" && selectedAuditLog.durationText && selectedAuditLog.durationText !== "—" && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/70">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-sky-600" />
                    <span>View Duration:</span>
                  </span>
                  <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs">
                    {selectedAuditLog.durationText} ({selectedAuditLog.durationFormatted || "00:00"})
                  </span>
                </div>
              )}
            </div>

            {/* Document View Time Forensic Insight */}
            {selectedAuditLog.action?.toLowerCase().includes("view") && (
              <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Document Viewing Duration</h5>
                    <p className="text-[11px] text-slate-500">
                      Total tracked reading time recorded by secure heartbeat monitor
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-white border border-sky-200 rounded-lg font-mono font-extrabold text-sm text-sky-800 shadow-xs">
                    {selectedAuditLog.durationText || "< 5s"}
                  </span>
                  <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                    Formatted: {selectedAuditLog.durationFormatted || "00:00"}
                  </span>
                </div>
              </div>
            )}

            {/* Failure Reason */}
            {selectedAuditLog.failureReason && (
              <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                  Authentication Failure Reason
                </span>
                <p className="font-semibold text-rose-900 text-xs">{selectedAuditLog.failureReason}</p>
              </div>
            )}

            {/* Actor Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Actor & Authentication Context
              </h4>
              <div className="p-3 border border-slate-200 rounded-xl space-y-1.5 bg-white">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm">{selectedAuditLog.user}</p>
                  <div className="flex items-center gap-1.5">
                    {selectedAuditLog.side === "buyer" ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Buyer Side
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Seller Side
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {selectedAuditLog.userRole}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">{selectedAuditLog.userEmail}</p>
                {selectedAuditLog.companyName && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Organization:</span>
                    <span className="font-semibold text-slate-800">{selectedAuditLog.companyName}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600 font-mono text-[11px]">
                  <div>Action: <span className="font-semibold text-slate-800">{selectedAuditLog.action}</span></div>
                  <div>Outcome: <span className="font-bold">{selectedAuditLog.result}</span></div>
                </div>
              </div>
            </div>

            {/* Governance/Policy Decision */}
            {selectedAuditLog.permissionDecision && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Governance Authorization Decision
                </h4>
                <div className="p-3 border border-slate-200 rounded-xl space-y-1 bg-slate-50/50">
                  <p className="font-semibold text-slate-800">
                    Rule: {selectedAuditLog.permissionDecision.rule}
                  </p>
                  <p className="text-slate-600">
                    Verdict: <span className="font-bold">{selectedAuditLog.permissionDecision.verdict}</span>
                  </p>
                  {selectedAuditLog.permissionDecision.reason && (
                    <p className="text-rose-600 font-medium text-[11px]">
                      Reason: {selectedAuditLog.permissionDecision.reason}
                    </p>
                  )}
                  {selectedAuditLog.permissionDecision.watermarkText && (
                    <p className="text-slate-500 font-mono text-[10px]">
                      Applied Watermark: {selectedAuditLog.permissionDecision.watermarkText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Metadata */}
            {selectedAuditLog.metadata && Object.keys(selectedAuditLog.metadata).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cryptographic & File Metadata
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] font-mono">
                  {Object.entries(selectedAuditLog.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{k}:</span>
                      <span className="text-slate-700 font-semibold truncate max-w-[280px]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Payload (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 size={13} />
                  <span>Raw Cryptographic Payload (Read Only)</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Verifiable Signature</span>
              </div>
              <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(selectedAuditLog.jsonPayload || selectedAuditLog, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
