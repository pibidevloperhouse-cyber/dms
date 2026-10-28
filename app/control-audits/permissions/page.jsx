"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  FileText,
  Folder,
  User,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  FileEdit,
  Upload,
  Trash2,
  Download,
  Lock,
  Layers,
  ArrowRight,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  PageHeader,
  StatusBadge,
  DetailDrawer,
} from "@/components/controls-audit/shared";

// ── 6 CORE DOCUMENT PERMISSIONS ──
const DOCUMENT_PERMISSIONS = [
  {
    key: "view",
    name: "View Documents",
    shortName: "View",
    icon: Eye,
    category: "Read Access",
    color: "emerald",
    desc: "Ability to preview document contents inside the secure viewer.",
  },
  {
    key: "edit",
    name: "Document Edit",
    shortName: "Edit",
    icon: FileEdit,
    category: "Management",
    color: "blue",
    desc: "Permission to modify document properties, metadata, and contents.",
  },
  {
    key: "upload",
    name: "Upload Documents",
    shortName: "Upload",
    icon: Upload,
    category: "Management",
    color: "purple",
    desc: "Clearance to add new files or replace revisions in folders.",
  },
  {
    key: "delete",
    name: "Delete Documents",
    shortName: "Delete",
    icon: Trash2,
    category: "Destructive",
    color: "rose",
    desc: "Clearance to move documents to recycle bin or purge permanently.",
  },
  {
    key: "downloadOriginal",
    name: "Download Original",
    shortName: "Original DL",
    icon: Download,
    category: "Export Control",
    color: "amber",
    desc: "Permission to download native unwatermarked file to local disk.",
  },
  {
    key: "downloadSecure",
    name: "Download Secure",
    shortName: "Secure DL",
    icon: ShieldCheck,
    category: "Export Control",
    color: "teal",
    desc: "Permission to download watermarked, encrypted DRM (.html / .vdr) copy.",
  },
];

export default function PermissionsPage() {
  const {
    activeDeal: contextActiveDeal,
    selectedDealId: contextDealId,
    setSelectedDealId,
    selectedSide,
    setSelectedSide,
    callerSide,
  } = useControlsAudit();

  // ── LOCAL STATE ──
  const [availableDeals, setAvailableDeals] = useState([]);
  const [selectedDealId, setLocalDealId] = useState(contextDealId || "");
  const [activeDeal, setActiveDeal] = useState(null);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [userDocumentMatrix, setUserDocumentMatrix] = useState([]);
  const [roleGroupMatrix, setRoleGroupMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDealDropdownOpen, setIsDealDropdownOpen] = useState(false);

  // View toggle: 'document' | 'user' | 'role'
  const [viewMode, setViewMode] = useState("document");

  // Selected cell detail for inspection drawer
  const [inspectedDetail, setInspectedDetail] = useState(null);

  // Filters & Search
  const [documentSearch, setDocumentSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedPermissionFilter, setSelectedPermissionFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);

  // ── FETCH LIVE DATA DEAL & WORKSPACE WISE ──
  const fetchPermissionsData = useCallback(async (dealIdToFetch) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dealIdToFetch) params.append("dealId", dealIdToFetch);
      if (selectedSide && selectedSide !== "all") params.append("side", selectedSide);

      const res = await fetch(`/api/control-audits/permissions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAvailableDeals(data.availableDeals || []);
        setActiveDeal(data.activeDeal || null);
        setLocalDealId(data.activeDeal?.id || "");
        setStats(data.stats || null);
        setDocuments(data.documents || []);
        setUsers(data.users || []);
        setUserDocumentMatrix(data.userDocumentMatrix || []);
        setRoleGroupMatrix(data.roleGroupMatrix || []);

        if (data.users && data.users.length > 0 && !selectedUserId) {
          setSelectedUserId(data.users[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSide, selectedUserId]);

  // Initial load
  useEffect(() => {
    fetchPermissionsData(contextDealId);
  }, [fetchPermissionsData, contextDealId]);

  // Handle deal switch
  const handleDealChange = (newDealId) => {
    setLocalDealId(newDealId);
    setIsDealDropdownOpen(false);
    if (setSelectedDealId) setSelectedDealId(newDealId);
    fetchPermissionsData(newDealId);
  };

  // Currently selected user in "By User" view
  const currentSelectedUser = useMemo(() => {
    if (!users || users.length === 0) return null;
    return users.find((u) => u.id === selectedUserId) || users[0];
  }, [users, selectedUserId]);

  const currentSelectedUserMatrix = useMemo(() => {
    if (!currentSelectedUser || !userDocumentMatrix) return null;
    return userDocumentMatrix.find((m) => m.user.id === currentSelectedUser.id);
  }, [currentSelectedUser, userDocumentMatrix]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(documentSearch.toLowerCase()) ||
        doc.folderName.toLowerCase().includes(documentSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedPermissionFilter === "all") return true;
      const permObj = doc.permissions[selectedPermissionFilter];
      return permObj && permObj.count > 0;
    });
  }, [documents, documentSearch, selectedPermissionFilter]);

  // Open drawer for a document permission
  const inspectDocPermission = (doc, permKey, permData) => {
    const permConfig = DOCUMENT_PERMISSIONS.find((p) => p.key === permKey);
    setInspectedDetail({
      type: "document_permission",
      title: `${permConfig.name} - ${doc.name}`,
      document: doc,
      permission: permConfig,
      count: permData.count,
      users: permData.users || [],
      dealName: activeDeal?.name || "Deal Room",
      allUsers: users,
    });
  };

  // Open drawer for user-document cell
  const inspectUserDocCell = (user, doc, cellData) => {
    setInspectedDetail({
      type: "user_document_cell",
      title: `Policy Inspection: ${user.name}`,
      user,
      doc,
      cellData,
      dealName: activeDeal?.name || "Deal Room",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-6 animate-in fade-in duration-300">
      {/* ── A. PAGE HEADER WITH DEAL SELECTOR & SIDE FILTER ── */}
      <PageHeader
        title="Permissions Matrix & Governance"
        badge={
          <StatusBadge
            status="active"
            label={loading ? "Refreshing..." : "Live Access Engine"}
            size="sm"
          />
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* DEAL & WORKSPACE SELECTOR DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDealDropdownOpen(!isDealDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl shadow-xs text-xs font-bold text-slate-800 transition-all cursor-pointer hover:bg-slate-50"
              >
                <Briefcase size={14} className="text-[var(--brand)]" />
                <span className="text-slate-400 font-medium">Deal:</span>
                <span className="max-w-[150px] truncate text-slate-900">
                  {activeDeal?.name || "Select Deal"}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${
                    isDealDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDealDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDealDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                      <span>Available Deals & Workspaces</span>
                      <span className="font-mono">{availableDeals.length} deals</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {availableDeals.map((d) => {
                        const isSelected = d.id === selectedDealId;
                        return (
                          <div
                            key={d.id}
                            onClick={() => handleDealChange(d.id)}
                            className={`px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-[var(--brand-50)] text-[var(--brand)] font-bold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate font-semibold">{d.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Stage: {d.stage}
                              </p>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-[var(--brand)] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PARTY SIDE TOGGLE */}
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
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                {callerSide === "buyer" ? "Buyer Roles & Permissions" : "Seller Roles & Permissions"}
              </span>
            )}

            {/* VIEW MODE TOGGLE (By Document | By User | By Group) */}
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <button
                onClick={() => setViewMode("document")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "document"
                    ? "bg-[var(--brand)] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText size={13} />
                <span>By Document</span>
              </button>
              <button
                onClick={() => setViewMode("user")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "user"
                    ? "bg-[var(--brand)] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User size={13} />
                <span>By User</span>
              </button>
              <button
                onClick={() => setViewMode("role")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "role"
                    ? "bg-[var(--brand)] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users size={13} />
                <span>By Role / Group</span>
              </button>
            </div>
          </div>
        }
      />

      {/* ── B. ACTIVE DEAL METRICS BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold tracking-tight">
                {activeDeal?.name || "Active Deal Room"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {activeDeal?.stage || "Due Diligence"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Document Access Matrix: View, Delete, Upload, Download Original, Download Secure, Document Edit
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Deal Documents</div>
            <div className="text-base font-extrabold text-white mt-0.5">{stats?.totalDocuments || documents.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Members</div>
            <div className="text-base font-extrabold text-white mt-0.5">{users.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Buyer Members</div>
            <div className="text-base font-extrabold text-sky-400 mt-0.5">{stats?.buyerUsersCount || 0}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Seller Members</div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5">{stats?.sellerUsersCount || 0}</div>
          </div>
        </div>
      </div>

      {/* ── C. VIEW MODE 1: BY DOCUMENT (DOCUMENT-CENTRIC MATRIX) ── */}
      {viewMode === "document" && (
        <div className="space-y-4">
          {/* Filters & Quick Permission Filter Chips */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                placeholder="Search documents or folders in this deal..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Permission Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setSelectedPermissionFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedPermissionFilter === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Permissions ({DOCUMENT_PERMISSIONS.length})
              </button>
              {DOCUMENT_PERMISSIONS.map((perm) => {
                const isSelected = selectedPermissionFilter === perm.key;
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => setSelectedPermissionFilter(perm.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--brand)] text-white shadow-2xs font-bold"
                        : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <perm.icon size={12} />
                    <span>{perm.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DOCUMENT PERMISSIONS MATRIX TABLE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Document vs. Member Permissions Matrix ({filteredDocuments.length} Documents)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click any cell to inspect members holding permission
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw size={24} className="mx-auto animate-spin mb-3 text-[var(--brand)]" />
                Loading live permissions matrix for {activeDeal?.name}...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No documents found</p>
                <p className="text-slate-400 mt-1">
                  {documentSearch
                    ? "Try clearing your search query."
                    : "No documents have been uploaded to this deal room yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5 min-w-[240px]">Document & Folder</th>
                      {DOCUMENT_PERMISSIONS.map((perm) => (
                        <th
                          key={perm.key}
                          className="px-3 py-3.5 text-center min-w-[130px]"
                          title={perm.desc}
                        >
                          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
                            <perm.icon size={13} className="text-[var(--brand)]" />
                            <span>{perm.name}</span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-normal font-mono lowercase">
                            {perm.category}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredDocuments.map((doc) => {
                      return (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Document Information */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0 mt-0.5 group-hover:bg-[var(--brand-50)] group-hover:text-[var(--brand)] transition-colors">
                                <FileText size={16} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate max-w-[260px]" title={doc.name}>
                                  {doc.name}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                                  <span className="flex items-center gap-1">
                                    <Folder size={10} />
                                    {doc.folderName}
                                  </span>
                                  <span>•</span>
                                  <span>{doc.fileSizeFormatted}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 6 Permission Cells */}
                          {DOCUMENT_PERMISSIONS.map((perm) => {
                            const permData = doc.permissions[perm.key] || { count: 0, users: [] };
                            const hasAccess = permData.count > 0;

                            return (
                              <td
                                key={perm.key}
                                onClick={() => inspectDocPermission(doc, perm.key, permData)}
                                className="px-3 py-3 text-center transition-all cursor-pointer select-none hover:bg-slate-100/80"
                                title={`Click to inspect ${permData.count} members with ${perm.name}`}
                              >
                                <div className="flex flex-col items-center justify-center gap-1">
                                  {hasAccess ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/90 shadow-2xs group-hover:scale-105 transition-transform">
                                      <Check size={12} className="text-emerald-600 stroke-[3]" />
                                      <span>{permData.count} Users</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 text-slate-400 font-bold border border-slate-200/60">
                                      <span className="text-xs">—</span>
                                    </div>
                                  )}

                                  {/* Avatar preview stack if any */}
                                  {hasAccess && (
                                    <div className="flex items-center -space-x-1.5 mt-0.5">
                                      {permData.users.slice(0, 3).map((u, i) => (
                                        <div
                                          key={u.id || i}
                                          className="w-4 h-4 rounded-full bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center border border-white ring-1 ring-slate-100"
                                          title={u.name}
                                        >
                                          {u.avatar || u.name?.slice(0, 1)}
                                        </div>
                                      ))}
                                      {permData.count > 3 && (
                                        <span className="text-[9px] text-slate-400 font-mono pl-1">
                                          +{permData.count - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── D. VIEW MODE 2: BY USER (USER-CENTRIC INSPECTION) ── */}
      {viewMode === "user" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* User selector list (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deal Room Members</h3>
                <p className="text-[11px] text-slate-400">Select a member to inspect document clearances</p>
              </div>
              <span className="text-xs font-bold text-slate-500 font-mono">{users.length} members</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search member name or email..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Member List */}
            <div className="space-y-2 overflow-y-auto max-h-[550px] pr-1">
              {users
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                    u.role.toLowerCase().includes(userSearch.toLowerCase())
                )
                .map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const isBuyer = u.side === "buyer";

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[var(--brand)] bg-[var(--brand-50)]/40 shadow-xs ring-1 ring-[var(--brand)]/20"
                          : "border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-[var(--brand)] text-white shadow-xs"
                              : isBuyer
                              ? "bg-sky-100 text-sky-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isBuyer
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.groups && u.groups.length > 0 && (
                              <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
                                • {u.groups.map((g) => g.name).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className={isSelected ? "text-[var(--brand)]" : "text-slate-300"}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

          {/* User Effective Document Permissions (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col space-y-6">
            {currentSelectedUser ? (
              <>
                {/* Profile Card Header */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                      {currentSelectedUser.avatar || currentSelectedUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{currentSelectedUser.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            currentSelectedUser.side === "buyer"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {currentSelectedUser.side === "buyer" ? "Buyer Team" : "Seller Team"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{currentSelectedUser.email}</p>
                      <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                        Role: <span className="text-[var(--brand)]">{currentSelectedUser.role}</span>
                        {currentSelectedUser.groups?.length > 0 && (
                          <span className="text-slate-400 font-normal">
                            {" "}
                            (Groups: {currentSelectedUser.groups.map((g) => g.name).join(", ")})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400">Viewable</div>
                      <div className="font-bold text-slate-800">
                        {currentSelectedUserMatrix?.summary?.viewCount || 0} / {documents.length}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400">Original DL</div>
                      <div className="font-bold text-amber-700">
                        {currentSelectedUserMatrix?.summary?.downloadOriginalCount || 0} / {documents.length}
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400">Secure DL</div>
                      <div className="font-bold text-teal-700">
                        {currentSelectedUserMatrix?.summary?.downloadSecureCount || 0} / {documents.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Access Breakdown for User */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-[var(--brand)]" />
                      Document-Level Permission Breakdown
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Evaluated via Role + Group Inheritance
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3">Document Name</th>
                            <th className="px-2.5 py-3 text-center">View</th>
                            <th className="px-2.5 py-3 text-center">Edit</th>
                            <th className="px-2.5 py-3 text-center">Upload</th>
                            <th className="px-2.5 py-3 text-center">Delete</th>
                            <th className="px-2.5 py-3 text-center">Original DL</th>
                            <th className="px-2.5 py-3 text-center">Secure DL</th>
                            <th className="px-3 py-3">Source Policy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {currentSelectedUserMatrix?.documentPermissions?.map((item) => {
                            return (
                              <tr
                                key={item.documentId}
                                onClick={() =>
                                  inspectUserDocCell(currentSelectedUser, { name: item.documentName }, item)
                                }
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                                    {item.documentName}
                                  </div>
                                </td>

                                {/* View */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canView ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200 text-xs">
                                      ×
                                    </span>
                                  )}
                                </td>

                                {/* Edit */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canEdit ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200 text-xs">
                                      ×
                                    </span>
                                  )}
                                </td>

                                {/* Upload */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canUpload ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-50 text-slate-400 font-bold border border-slate-200 text-xs">
                                      —
                                    </span>
                                  )}
                                </td>

                                {/* Delete */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canDelete ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200 text-xs">
                                      ×
                                    </span>
                                  )}
                                </td>

                                {/* Original DL */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canDownloadOriginal ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200 text-xs">
                                      ×
                                    </span>
                                  )}
                                </td>

                                {/* Secure DL */}
                                <td className="px-2.5 py-3 text-center">
                                  {item.canDownloadSecure ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal-50 text-teal-700 font-bold border border-teal-200 text-xs">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-50 text-rose-600 font-bold border border-rose-200 text-xs">
                                      ×
                                    </span>
                                  )}
                                </td>

                                {/* Source */}
                                <td className="px-3 py-3">
                                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate inline-block max-w-[130px]" title={item.source}>
                                    {item.source}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a member from the left to view document permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── E. VIEW MODE 3: BY ROLE / GROUP ── */}
      {viewMode === "role" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--brand)]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Deal Groups & Policy Matrix ({roleGroupMatrix.length} Groups in {activeDeal?.name})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Click any group to see member roster and document scope
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="px-5 py-3.5 min-w-[200px]">Group / Team</th>
                    <th className="px-3 py-3.5 text-center min-w-[90px]">Side</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Members</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">View Clearance</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Edit Clearance</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Upload Clearance</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Delete Clearance</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Original DL</th>
                    <th className="px-3 py-3.5 text-center min-w-[110px]">Secure DL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {roleGroupMatrix.map((item) => {
                    const { group, summary } = item;
                    return (
                      <tr key={group.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-xs">{group.name}</div>
                          <div className="text-[10px] text-slate-400">{group.description || group.role || "Deal Group"}</div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              group.side === "buyer"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {group.side === "buyer" ? "Buyer" : "Seller"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-slate-800">{group.membersCount} users</span>
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px] mx-auto">
                            {group.members?.map((m) => m.name).join(", ") || "No users"}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-emerald-700">{summary.viewCount} docs</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-blue-700">{summary.editCount} docs</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-purple-700">{summary.uploadCount > 0 ? "Allowed" : "—"}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-rose-700">{summary.deleteCount} docs</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-amber-700">{summary.downloadOriginalCount} docs</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-teal-700">{summary.downloadSecureCount} docs</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── F. DETAIL INSPECTION DRAWER ── */}
      <DetailDrawer
        isOpen={!!inspectedDetail}
        onClose={() => setInspectedDetail(null)}
        title={inspectedDetail?.title || "Permission Policy Inspection"}
        subtitle="Verification of authorization source, group inheritance, and active clearance"
        badge={
          <StatusBadge
            status={
              inspectedDetail?.count > 0 || inspectedDetail?.cellData?.canView
                ? "allowed"
                : "denied"
            }
            size="sm"
          />
        }
      >
        {inspectedDetail && (
          <div className="space-y-5 text-xs">
            {/* Document Permission Detail View */}
            {inspectedDetail.type === "document_permission" && (
              <>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Deal Context:</span>
                    <span className="font-bold text-slate-900">{inspectedDetail.dealName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Document:</span>
                    <span className="font-bold text-slate-800">{inspectedDetail.document.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Permission:</span>
                    <span className="font-bold text-[var(--brand)]">
                      {inspectedDetail.permission.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Members with Clearance:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {inspectedDetail.count} Users
                    </span>
                  </div>
                </div>

                {/* List of Allowed Members */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Users size={14} className="text-[var(--brand)]" />
                    <span>Members Holding Permission ({inspectedDetail.users.length})</span>
                  </h4>

                  {inspectedDetail.users.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center">
                      No members currently possess this permission for this document.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {inspectedDetail.users.map((u) => (
                        <div
                          key={u.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {u.avatar || u.name?.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.name}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {u.source || "Allowed"}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {u.groups?.join(", ") || u.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permission Explanation */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs leading-relaxed">
                  <div className="font-bold text-slate-800 mb-1">Governance Policy:</div>
                  {inspectedDetail.permission.desc}
                </div>
              </>
            )}

            {/* User Document Cell View */}
            {inspectedDetail.type === "user_document_cell" && (
              <>
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Target Member:</span>
                    <span className="font-bold text-slate-900">{inspectedDetail.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Document:</span>
                    <span className="font-semibold text-slate-800">
                      {inspectedDetail.doc.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Authorization Source:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {inspectedDetail.cellData.source}
                    </span>
                  </div>
                </div>

                {/* Permissions Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                    Clearances on this Document
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">View Documents</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canView ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Document Edit</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canEdit ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Upload Documents</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canUpload ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Delete Documents</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canDelete ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Download Original</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canDownloadOriginal ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Download Secure</span>
                      <StatusBadge
                        status={inspectedDetail.cellData.canDownloadSecure ? "allowed" : "denied"}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Policy Justification */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Policy Justification
                  </h4>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed italic">
                    "{inspectedDetail.cellData.reason}"
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
