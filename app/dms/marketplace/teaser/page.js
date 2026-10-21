"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FaBriefcase, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaUsers, 
  FaRegFileAlt, 
  FaRegBookmark, 
  FaBookmark,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaEllipsisH,
  FaTimes,
  FaBuilding,
  FaGlobe,
  FaChartLine,
  FaCheckCircle,
  FaFileContract,
  FaHandshake,
  FaPercentage,
  FaMapMarkerAlt,
  FaFilePdf,
  FaInfoCircle,
  FaTag,
  FaBalanceScale,
  FaDownload,
  FaShieldAlt,
  FaCheck,
  FaChevronDown
} from "react-icons/fa";

export default function TeasersList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'archived'
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [teaserData, setTeaserData] = useState(null);
  const [teaserLoading, setTeaserLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("company");
  const router = useRouter();

  // Fetch teaser details from dms_teasers table for the selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setTeaserData(null);
      return;
    }

    let isCancelled = false;
    const fetchTeaser = async () => {
      setTeaserLoading(true);
      try {
        const res = await fetch(`/api/dms/teasers?projectId=${selectedProjectId}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setTeaserData(data.teaser || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teaser details:", err);
      } finally {
        if (!isCancelled) {
          setTeaserLoading(false);
        }
      }
    };

    fetchTeaser();
    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId]);

  const parseJsonArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [val];
    }
  };

  const formatCurrency = (val) => {
    if (!val || val === "undefined" || val === "null") return "#NA";
    const cleaned = String(val).trim();
    if (cleaned.startsWith("$") || cleaned.startsWith("₹") || cleaned.startsWith("€")) return cleaned;
    const num = Number(cleaned.replace(/[^0-9.-]/g, ""));
    if (!isNaN(num) && num !== 0) {
      return `$${num.toLocaleString()}`;
    }
    return cleaned || "#NA";
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dms_saved_teasers") || "[]");
      setBookmarkedIds(saved);
    } catch (e) {
      // ignore
    }

    const fetchProjects = async () => {
      try {
        const companyId = localStorage.getItem("companyId") || "test-company-123";
        const userId = localStorage.getItem("userId") || "seller-123";
        const vdrRoleItem = localStorage.getItem("vdrRole") || "external_user";

        const res = await fetch(`/api/dms/projects?companyId=${companyId}&userId=${userId}&role=${vdrRoleItem}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.projects || [];
          setProjects(list);
          if (list.length > 0) {
            setSelectedProjectId(list[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch projects", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const toggleBookmark = (e, projectId) => {
    e.stopPropagation();
    let updated;
    if (bookmarkedIds.includes(projectId)) {
      updated = bookmarkedIds.filter((id) => id !== projectId);
    } else {
      updated = [...bookmarkedIds, projectId];
    }
    setBookmarkedIds(updated);
    localStorage.setItem("dms_saved_teasers", JSON.stringify(updated));
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || filteredProjects[0] || null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f6fb2]"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-72px)] md:h-[calc(100vh-72px)] flex flex-col bg-white text-gray-900 font-sans selection:bg-[#1f6fb2]/20 overflow-hidden">
      
      {/* Top Navigation Bar: Tabs + Search + Filter */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20 px-3 sm:px-8 py-2 sm:py-3.5 flex items-center justify-between shrink-0">
        
        {/* Tabs: Active teasers vs Archived */}
        <div className="flex items-center gap-2.5 sm:gap-8">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === "active"
                ? "text-[#1f6fb2]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="hidden sm:inline">Active teasers</span>
            <span className="sm:hidden">Active</span>
            <span className="text-xs font-semibold px-1.5 py-0.2 rounded-full bg-sky-50 text-[#1f6fb2]">
              {projects.length}
            </span>
            {activeTab === "active" && (
              <span className="absolute bottom-[-9px] sm:bottom-[-15px] left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] rounded-t-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("archived")}
            className={`flex items-center gap-1.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "archived"
                ? "text-[#1f6fb2]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>Archived</span>
            <span className="text-xs font-medium px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-500">
              0
            </span>
            {activeTab === "archived" && (
              <span className="absolute bottom-[-9px] sm:bottom-[-15px] left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#1f6fb2] to-[#2ec4b6] rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* Right Tools: Search & Filter */}
        <div className="flex items-center gap-1 sm:gap-4">
          {showSearchInput ? (
            <div className="relative flex items-center">
              <FaSearch className="w-3 h-3 text-gray-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="pl-7 pr-6 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1f6fb2] focus:ring-1 focus:ring-[#1f6fb2] w-28 sm:w-48 md:w-64"
              />
              <button
                onClick={() => { setShowSearchInput(false); setSearchQuery(""); }}
                className="absolute right-1.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#1f6fb2] transition-colors py-1 px-1.5 rounded-lg hover:bg-gray-50"
            >
              <FaSearch className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Search</span>
            </button>
          )}

          <button
            onClick={() => {
              if (searchQuery) setSearchQuery("");
              else setShowSearchInput(true);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#1f6fb2] transition-colors py-1 px-1.5 rounded-lg hover:bg-gray-50"
          >
            <FaFilter className="w-3 h-3 text-gray-500" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-16 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-sky-50 rounded-xl flex items-center justify-center mb-4 text-[#1f6fb2] mx-auto">
            <FaBriefcase className="text-2xl" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">No Teasers Found</h2>
          <p className="text-gray-500 text-xs mb-6">
            You haven't created any projects yet. Create a project in the Workspace to automatically generate its teaser.
          </p>
          <button
            onClick={() => router.push("/dms/marketplace/workspace")}
            className="px-4 py-2 bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity"
          >
            Go to Workspace
          </button>
        </div>
      ) : activeTab === "archived" ? (
        <div className="p-16 text-center max-w-md mx-auto text-gray-400">
          <FaRegFileAlt className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No archived teasers</p>
          <p className="text-xs text-gray-400 mt-1">All your active opportunities appear in the active tab.</p>
        </div>
      ) : (
        
        /* Master-Detail Split Screen Layout */
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          
          {/* ========================================================
             LEFT COLUMN: YOUR OPPORTUNITIES LIST (Desktop Only)
             ======================================================== */}
          <div className="hidden md:flex md:w-80 lg:w-[340px] border-r border-gray-200 bg-white flex-col shrink-0 h-full overflow-hidden">
            
            {/* List Header */}
            <div className="px-6 pt-6 pb-3 shrink-0">
              <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                Your Opportunities
              </span>
            </div>

            {/* Opportunities List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredProjects.map((project, idx) => {
                const isSelected = selectedProject && selectedProject.id === project.id;
                const initials = (project.name || "UN").substring(0, 2).toUpperCase();
                const opportunityNumber = `Opportunity 0${idx + 1}`;

                return (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`relative px-6 py-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#f0f9ff]"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-gradient-to-b from-[#1f6fb2] to-[#2ec4b6]"></div>
                    )}

                    {/* Unified Brand Avatar (Matching NA Icon Style) */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm tracking-wide shrink-0 transition-colors ${
                        isSelected
                          ? "bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] text-white shadow-xs"
                          : "bg-sky-50 border border-[#2ec4b6]/30 text-[#1f6fb2]"
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Title & Opportunity Number */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <h4
                        className={`text-sm font-bold truncate leading-tight transition-colors ${
                          isSelected ? "text-[#1f6fb2]" : "text-gray-900"
                        }`}
                        title={project.name}
                      >
                        {project.name}
                      </h4>
                      <span className="text-xs text-gray-400 font-medium mt-1">
                        {opportunityNumber}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================
             RIGHT COLUMN: TEASER PRODUCT VIEW (Selected Opportunity)
             ======================================================== */}
          {selectedProject && (() => {
            const detailTabs = [
              { id: "company", label: "Company Information", shortLabel: "Company" },
              { id: "financial", label: "Financial Performance", shortLabel: "Financials" },
              { id: "customers", label: "Customers & Scale", shortLabel: "Customers" },
              { id: "deal", label: "Deal Expectations", shortLabel: "Deal Terms" },
              ...(teaserData?.keyHighlights ? [{ id: "highlights", label: "Key Highlights", shortLabel: "Highlights" }] : []),
              { id: "documents", label: "Documents", shortLabel: "Documents" },
            ];

            const currentTabIndex = Math.max(
              0,
              detailTabs.findIndex((t) => t.id === activeDetailTab)
            );
            const activeTabId = detailTabs[currentTabIndex]?.id || "company";

            return (
              <div className="flex-1 min-h-0 bg-white p-3 sm:p-6 lg:p-8 flex flex-col justify-between h-full overflow-hidden">
                <div className="flex flex-col min-h-0 flex-1">
                  
                  {/* ========================================================
                     MOBILE ONLY: TOP HEADER (Opportunity Switcher + Actions)
                     ======================================================== */}
                  <div className="md:hidden flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {(selectedProject.name || "UN").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="text-xs font-bold text-gray-900 bg-sky-50/70 border border-[#2ec4b6]/30 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1f6fb2] truncate max-w-[140px] cursor-pointer"
                          >
                            {filteredProjects.map((p, idx) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                            {(filteredProjects.findIndex((p) => p.id === selectedProjectId) + 1 || 1)}/{filteredProjects.length}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                          {selectedProject.projectType || teaserData?.businessModel || "Acquisition"} • {teaserData?.headquarters || "North America"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                      <button
                        onClick={(e) => toggleBookmark(e, selectedProject.id)}
                        className="p-1 hover:text-[#1f6fb2] transition-colors rounded hover:bg-gray-50"
                        title={bookmarkedIds.includes(selectedProject.id) ? "Remove bookmark" : "Save opportunity"}
                      >
                        {bookmarkedIds.includes(selectedProject.id) ? (
                          <FaBookmark className="w-3.5 h-3.5 text-[#1f6fb2]" />
                        ) : (
                          <FaRegBookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => router.push(`/dms/teaser?project=${encodeURIComponent(selectedProject.name)}&projectId=${selectedProject.id}`)}
                        className="p-1 hover:text-gray-600 transition-colors rounded hover:bg-gray-50"
                        title="Options"
                      >
                        <FaEllipsisH className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ========================================================
                     MOBILE ONLY: FEATURES DROPDOWN SWITCHER (Small Devices)
                     ======================================================== */}
                  <div className="md:hidden mb-2 shrink-0">
                    <div className="relative">
                      <select
                        value={activeTabId}
                        onChange={(e) => setActiveDetailTab(e.target.value)}
                        className="w-full appearance-none bg-sky-50/70 border border-[#1f6fb2]/40 text-[#1f6fb2] font-bold text-xs py-1.5 px-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1f6fb2] shadow-xs cursor-pointer"
                      >
                        {detailTabs.map((tab) => (
                          <option key={tab.id} value={tab.id} className="text-gray-900 bg-white font-semibold">
                            {tab.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#1f6fb2]">
                        <FaChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* ========================================================
                     MOBILE ONLY: 4 KEY SPECIFICATIONS (2x2 Grid)
                     ======================================================== */}
                  <div className="md:hidden grid grid-cols-2 gap-1.5 p-2 bg-sky-50/50 rounded-lg border border-[#2ec4b6]/25 mb-2 shrink-0 text-xs">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Stage</span>
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {teaserData?.status ? teaserData.status.charAt(0).toUpperCase() + teaserData.status.slice(1) : "Due diligence"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Value</span>
                      <span className="text-xs font-bold text-[#1f6fb2] truncate">
                        {formatCurrency(teaserData?.askingPrice) !== "#NA" 
                          ? formatCurrency(teaserData?.askingPrice) 
                          : (teaserData?.revenueBand && teaserData.revenueBand !== "undefined" ? teaserData.revenueBand : "TBD")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-1 pt-1 border-t border-sky-100/70">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Deadline</span>
                      <span className="text-xs font-bold text-gray-900 truncate">Oct 08, 2026</span>
                    </div>
                    <div className="flex justify-between items-center px-1 pt-1 border-t border-sky-100/70">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Invited</span>
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {teaserData?.totalCustomerCount ? `${Number(teaserData.totalCustomerCount).toLocaleString()}` : "18"}
                      </span>
                    </div>
                  </div>

                  {/* ========================================================
                     DESKTOP ONLY: SUBHEADER, TITLE, 4 SPECS & FEATURE TABS
                     ======================================================== */}
                  <div className="hidden md:flex md:flex-col">
                    {/* Top Sub-Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-gray-400 tracking-wider uppercase text-[11px]">
                          Confidential Opportunity
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-gray-500 font-medium">
                          {selectedProject.projectType || teaserData?.businessModel || "Acquisition"} / {teaserData?.headquarters || "North America"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => toggleBookmark(e, selectedProject.id)}
                          className="p-1.5 text-gray-300 hover:text-[#1f6fb2] transition-colors rounded-md hover:bg-gray-50"
                          title={bookmarkedIds.includes(selectedProject.id) ? "Remove bookmark" : "Save opportunity"}
                        >
                          {bookmarkedIds.includes(selectedProject.id) ? (
                            <FaBookmark className="w-4 h-4 text-[#1f6fb2]" />
                          ) : (
                            <FaRegBookmark className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => router.push(`/dms/teaser?project=${encodeURIComponent(selectedProject.name)}&projectId=${selectedProject.id}`)}
                          className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-50"
                          title="Options"
                        >
                          <FaEllipsisH className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title Block: Avatar + Big Project Title */}
                    <div className="flex items-center gap-3.5 mb-2 shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] text-white flex items-center justify-center font-bold text-base tracking-wide shrink-0 shadow-sm">
                        {(selectedProject.name || "UN").substring(0, 2).toUpperCase()}
                      </div>
                      <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">
                        {selectedProject.name}
                      </h2>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mb-3 line-clamp-1 shrink-0">
                      {teaserData?.businessSummary || selectedProject.description || "none"}
                    </p>

                    {/* 4 Key Specifications Horizontal Row */}
                    <div className="grid grid-cols-4 gap-4 py-3 border-t border-b border-gray-100 mb-3 shrink-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                          <FaBriefcase className="w-3 h-3 text-[#1f6fb2] shrink-0" />
                          <span className="truncate">Stage</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {teaserData?.status ? teaserData.status.charAt(0).toUpperCase() + teaserData.status.slice(1) : "Due diligence"}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                          <FaDollarSign className="w-3 h-3 text-[#1f6fb2] shrink-0" />
                          <span className="truncate">Value</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {formatCurrency(teaserData?.askingPrice) !== "#NA" 
                            ? formatCurrency(teaserData?.askingPrice) 
                            : (teaserData?.revenueBand && teaserData.revenueBand !== "undefined" ? teaserData.revenueBand : "TBD")}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                          <FaCalendarAlt className="w-3 h-3 text-[#1f6fb2] shrink-0" />
                          <span className="truncate">Deadline</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          Oct 08, 2026
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                          <FaUsers className="w-3 h-3 text-[#1f6fb2] shrink-0" />
                          <span className="truncate">Invited</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {teaserData?.totalCustomerCount ? `${Number(teaserData.totalCustomerCount).toLocaleString()}` : "18"}
                        </span>
                      </div>
                    </div>

                    {/* Feature Tabs on Desktop */}
                    <div className="border-b border-gray-200 mb-3 pb-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
                      {detailTabs.map((tab) => {
                        const isTabActive = activeTabId === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveDetailTab(tab.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                              isTabActive
                                ? "bg-gradient-to-br from-[#1f6fb2] to-[#2ec4b6] text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ========================================================
                     ACTIVE DETAIL SECTION (Shared, Responsive, Non-Scrollable)
                     ======================================================== */}
                  <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                    {/* 1. Company Overview & Basic Info */}
                    {activeTabId === "company" && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-1 border-b border-gray-100">
                          Company Information
                        </h3>

                        {/* Mobile: Clean 2-column stacked mini-cards (md:hidden) */}
                        <div className="md:hidden grid grid-cols-2 gap-1.5">
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Business Model</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.businessModel || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Industry</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.industry || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Sub-Industry</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.subIndustry || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Legal Structure</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.legalStructure || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Year Founded</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.yearFounded || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Employees</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.employees || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Headquarters</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.headquarters || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Locations</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">
                              {parseJsonArray(teaserData?.operationsLocation).join(", ") || "#NA"}
                            </span>
                          </div>
                        </div>

                        {/* Desktop: Spacious table grid (hidden md:grid) */}
                        <div className="hidden md:grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Business Model</span>
                            <span className="font-semibold text-gray-900">{teaserData?.businessModel || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Industry</span>
                            <span className="font-semibold text-gray-900">{teaserData?.industry || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Sub-Industry</span>
                            <span className="font-semibold text-gray-900">{teaserData?.subIndustry || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Legal Structure</span>
                            <span className="font-semibold text-gray-900">{teaserData?.legalStructure || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Year Founded</span>
                            <span className="font-semibold text-gray-900">{teaserData?.yearFounded || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Employees / Team</span>
                            <span className="font-semibold text-gray-900">{teaserData?.employees || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Headquarters</span>
                            <span className="font-semibold text-gray-900">{teaserData?.headquarters || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Operating Locations</span>
                            <span className="font-semibold text-gray-900">
                              {parseJsonArray(teaserData?.operationsLocation).join(", ") || "#NA"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Financial Metrics */}
                    {activeTabId === "financial" && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-1 border-b border-gray-100">
                          Financial Performance
                        </h3>

                        {/* Mobile: Clean 2-column stacked mini-cards (md:hidden) */}
                        <div className="md:hidden grid grid-cols-2 gap-1.5">
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Revenue</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.revenue || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Revenue Band</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.revenueBand && teaserData.revenueBand !== "undefined" ? teaserData.revenueBand : "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">EBITDA Band</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.ebitdaBand || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">EBITDA Margin</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.profitabilityEbitdaPercent ? `${teaserData.profitabilityEbitdaPercent}%` : "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Gross Margin</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.grossMarginPercent ? `${teaserData.grossMarginPercent}%` : "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Net Profit</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">
                              {teaserData?.netProfit ? (teaserData.netProfit.includes("$") || teaserData.netProfit.includes("₹") ? teaserData.netProfit : `$${teaserData.netProfit}`) : "#NA"}
                            </span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Recurring Rev</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.recurringRevenuePercent ? `${teaserData.recurringRevenuePercent}%` : "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">YoY Growth</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.growthRatePercent ? `${teaserData.growthRatePercent}%` : "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Debt on Biz</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{formatCurrency(teaserData?.debtOnBusiness)}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Working Capital</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{formatCurrency(teaserData?.workingCapital)}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center col-span-2">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Add-Backs</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{formatCurrency(teaserData?.addBacks)}</span>
                          </div>
                        </div>

                        {/* Desktop: Spacious table grid (hidden md:grid) */}
                        <div className="hidden md:grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Revenue</span>
                            <span className="font-semibold text-gray-900">{teaserData?.revenue || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Revenue Band</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.revenueBand && teaserData.revenueBand !== "undefined" ? teaserData.revenueBand : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">EBITDA Band</span>
                            <span className="font-semibold text-gray-900">{teaserData?.ebitdaBand || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">EBITDA Margin</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.profitabilityEbitdaPercent ? `${teaserData.profitabilityEbitdaPercent}%` : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Gross Margin</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.grossMarginPercent ? `${teaserData.grossMarginPercent}%` : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Net Profit</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.netProfit ? (teaserData.netProfit.includes("$") || teaserData.netProfit.includes("₹") ? teaserData.netProfit : `$${teaserData.netProfit}`) : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Recurring Revenue</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.recurringRevenuePercent ? `${teaserData.recurringRevenuePercent}%` : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">YoY Growth Rate</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.growthRatePercent ? `${teaserData.growthRatePercent}%` : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Debt on Business</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(teaserData?.debtOnBusiness)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Working Capital</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(teaserData?.workingCapital)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50 col-span-2 md:col-span-1">
                            <span className="text-gray-500">Add-Backs</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(teaserData?.addBacks)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Customer & Scale */}
                    {activeTabId === "customers" && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-1 border-b border-gray-100">
                          Customers & Scale
                        </h3>

                        {/* Mobile: Clean 2-column stacked mini-cards (md:hidden) */}
                        <div className="md:hidden grid grid-cols-2 gap-1.5">
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Total Customers</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">
                              {teaserData?.totalCustomerCount ? Number(teaserData.totalCustomerCount).toLocaleString() : "#NA"}
                            </span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Top Customer %</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.topCustomerPercentRevenue || "#NA"}</span>
                          </div>
                        </div>

                        {/* Desktop: Spacious table grid (hidden md:grid) */}
                        <div className="hidden md:grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Total Customer Count</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.totalCustomerCount ? Number(teaserData.totalCustomerCount).toLocaleString() : "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Top Customer % Revenue</span>
                            <span className="font-semibold text-gray-900">{teaserData?.topCustomerPercentRevenue || "#NA"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Deal Expectations & Buyer Fit */}
                    {activeTabId === "deal" && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-1 border-b border-gray-100">
                          Deal Expectations
                        </h3>

                        {/* Mobile: Clean 2-column stacked mini-cards (md:hidden) */}
                        <div className="md:hidden grid grid-cols-2 gap-1.5">
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Asking Price</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{formatCurrency(teaserData?.askingPrice)}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Valuation Expectation</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{formatCurrency(teaserData?.valuationExpectation)}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Investment Mandate</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">
                              {teaserData?.investmentMandate || selectedProject.projectType || "#NA"}
                            </span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Reason for Sale</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">{teaserData?.reasonForSale || "#NA"}</span>
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex flex-col justify-center col-span-2">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">Preferred Buyer Types</span>
                            <span className="text-xs font-bold text-gray-900 truncate mt-0.5">
                              {parseJsonArray(teaserData?.preferredBuyerTypes).join(", ") || "#NA"}
                            </span>
                          </div>
                        </div>

                        {/* Desktop: Spacious table grid (hidden md:grid) */}
                        <div className="hidden md:grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Asking Price</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(teaserData?.askingPrice)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Valuation Expectation</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(teaserData?.valuationExpectation)}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Investment Mandate</span>
                            <span className="font-semibold text-gray-900">
                              {teaserData?.investmentMandate || selectedProject.projectType || "#NA"}
                            </span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Reason for Sale</span>
                            <span className="font-semibold text-gray-900">{teaserData?.reasonForSale || "#NA"}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50 col-span-2">
                            <span className="text-gray-500">Preferred Buyer Types</span>
                            <span className="font-semibold text-gray-900">
                              {parseJsonArray(teaserData?.preferredBuyerTypes).join(", ") || "#NA"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Key Highlights */}
                    {activeTabId === "highlights" && teaserData?.keyHighlights && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-2 border-b border-gray-100">
                          Key Highlights
                        </h3>

                        {/* Mobile */}
                        <div className="md:hidden">
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 max-h-[140px] overflow-y-auto">
                            {teaserData.keyHighlights}
                          </p>
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:block">
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            {teaserData.keyHighlights}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 6. Documents */}
                    {activeTabId === "documents" && (
                      <div>
                        <h3 className="hidden md:block text-xs font-bold text-[#1f6fb2] tracking-widest uppercase mb-3 pb-2 border-b border-gray-100">
                          Documents
                        </h3>

                        {/* Mobile */}
                        <div className="md:hidden grid grid-cols-1 gap-1.5">
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FaRegFileAlt className="w-3.5 h-3.5 text-[#1f6fb2] shrink-0" />
                              <span className="text-xs font-semibold text-gray-800 truncate">P&L Statement</span>
                            </div>
                            {teaserData?.profitAndLossUrl ? (
                              <a href={teaserData.profitAndLossUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1f6fb2] font-bold hover:underline shrink-0">
                                Download
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium shrink-0">In deal room</span>
                            )}
                          </div>
                          <div className="bg-gray-50/70 p-2 rounded-lg border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FaRegFileAlt className="w-3.5 h-3.5 text-[#1f6fb2] shrink-0" />
                              <span className="text-xs font-semibold text-gray-800 truncate">Balance Sheet</span>
                            </div>
                            {teaserData?.balanceSheetUrl ? (
                              <a href={teaserData.balanceSheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1f6fb2] font-bold hover:underline shrink-0">
                                Download
                              </a>
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium shrink-0">In deal room</span>
                            )}
                          </div>
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-2 gap-x-12 gap-y-1.5 text-sm">
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Profit & Loss Statement</span>
                            {teaserData?.profitAndLossUrl ? (
                              <a href={teaserData.profitAndLossUrl} target="_blank" rel="noopener noreferrer" className="text-[#1f6fb2] hover:underline font-medium">
                                View / Download
                              </a>
                            ) : (
                              <span className="text-gray-400">Available in deal room</span>
                            )}
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-gray-50">
                            <span className="text-gray-500">Balance Sheet</span>
                            {teaserData?.balanceSheetUrl ? (
                              <a href={teaserData.balanceSheetUrl} target="_blank" rel="noopener noreferrer" className="text-[#1f6fb2] hover:underline font-medium">
                                View / Download
                              </a>
                            ) : (
                              <span className="text-gray-400">Available in deal room</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents Notice */}
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 font-medium pt-2 mt-auto border-t border-gray-100 shrink-0">
                  <FaRegFileAlt className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>12 new documents available in deal room</span>
                </div>

              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
