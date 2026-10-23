// "use client";

// import React, { useState, useMemo } from "react";
// import Link from "next/link";
// import {
//   Shield,
//   ShieldAlert,
//   ShieldCheck,
//   Lock,
//   Plus,
//   Search,
//   Filter,
//   ArrowRight,
//   ExternalLink,
//   ChevronRight,
//   Clock,
//   Calendar,
//   AlertOctagon,
//   X,
//   RotateCcw,
//   Sparkles,
//   Layers,
//   Sliders,
//   CheckCircle2,
//   FileCode2,
// } from "lucide-react";
// import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
// import {
//   PageHeader,
//   StatusBadge,
//   DetailDrawer,
//   EmptyState,
// } from "@/components/controls-audit/shared";
// import ModalPortal from "@/components/ui/ModalPortal";

// export default function PoliciesPage() {
//   const {
//     activeDeal,
//     policies,
//     togglePolicyStatus,
//     createPolicy,
//     updatePolicy,
//     showToast,
//   } = useControlsAudit();

//   // Search & Filters
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedScope, setSelectedScope] = useState("all");
//   const [selectedEnforcement, setSelectedEnforcement] = useState("all");
//   const [selectedStatus, setSelectedStatus] = useState("all"); // 'all' | 'Active' | 'Inactive'

//   // Selected policy for inspection / configuration drawer
//   const [selectedPolicy, setSelectedPolicy] = useState(null);
//   const [editPolicyDescription, setEditPolicyDescription] = useState("");
//   const [editPolicyEnforcement, setEditPolicyEnforcement] = useState("Strict Block");

//   // Create Policy Modal state
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
//   const [newPolicyForm, setNewPolicyForm] = useState({
//     name: "",
//     description: "",
//     scope: "Workspace-wide",
//     enforcementLevel: "Strict Block",
//     owner: "Victoria Sterling",
//   });

//   // KPI Metrics computed from policies
//   const totalPolicies = policies.length;
//   const activePoliciesCount = policies.filter((p) => p.status === "Active").length;
//   const strictBlockCount = policies.filter((p) => p.enforcementLevel === "Strict Block").length;
//   const automatedSuspensionCount = policies.filter((p) => p.enforcementLevel === "Automated Suspension").length;

//   // Filtered policies list
//   const filteredPolicies = useMemo(() => {
//     return policies.filter((policy) => {
//       // Search
//       if (searchQuery.trim()) {
//         const q = searchQuery.toLowerCase();
//         const matchName = policy.name.toLowerCase().includes(q);
//         const matchDesc = policy.description.toLowerCase().includes(q);
//         const matchScope = policy.scope.toLowerCase().includes(q);
//         const matchOwner = policy.owner.toLowerCase().includes(q);
//         if (!matchName && !matchDesc && !matchScope && !matchOwner) return false;
//       }

//       // Scope
//       if (selectedScope !== "all" && policy.scope !== selectedScope) return false;

//       // Enforcement
//       if (selectedEnforcement !== "all" && policy.enforcementLevel !== selectedEnforcement) return false;

//       // Status
//       if (selectedStatus !== "all" && policy.status !== selectedStatus) return false;

//       return true;
//     });
//   }, [policies, searchQuery, selectedScope, selectedEnforcement, selectedStatus]);

//   // Open inspection drawer
//   const handleOpenInspect = (policy) => {
//     setSelectedPolicy(policy);
//     setEditPolicyDescription(policy.description);
//     setEditPolicyEnforcement(policy.enforcementLevel);
//   };

//   // Save policy edits
//   const handleSavePolicyEdits = () => {
//     if (!selectedPolicy) return;
//     updatePolicy(selectedPolicy.id, {
//       description: editPolicyDescription.trim(),
//       enforcementLevel: editPolicyEnforcement,
//     });
//     setSelectedPolicy((prev) =>
//       prev
//         ? {
//             ...prev,
//             description: editPolicyDescription.trim(),
//             enforcementLevel: editPolicyEnforcement,
//           }
//         : null
//     );
//   };

//   // Create Policy submit
//   const handleCreatePolicySubmit = (e) => {
//     e.preventDefault();
//     if (!newPolicyForm.name.trim()) {
//       showToast("Policy name is required.", "error");
//       return;
//     }

//     createPolicy({
//       ...newPolicyForm,
//       name: newPolicyForm.name.trim(),
//       description: newPolicyForm.description.trim() || "Automated transaction compliance governance standard.",
//     });

//     setIsCreateModalOpen(false);
//     setNewPolicyForm({
//       name: "",
//       description: "",
//       scope: "Workspace-wide",
//       enforcementLevel: "Strict Block",
//       owner: "Victoria Sterling",
//     });
//   };

//   const resetFilters = () => {
//     setSearchQuery("");
//     setSelectedScope("all");
//     setSelectedEnforcement("all");
//     setSelectedStatus("all");
//   };

//   const hasActiveFilters =
//     searchQuery !== "" ||
//     selectedScope !== "all" ||
//     selectedEnforcement !== "all" ||
//     selectedStatus !== "all";

//   return (
//     <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans space-y-7">
//       {/* ── HEADER ── */}
//       <PageHeader
//         title="Governance Policies & Enforcement"
//         subtitle="Manage compliance rules governing document access, forensic watermarking, external link restrictions, and stage gate prerequisites."
//         badge={
//           <div className="flex items-center gap-2">
//             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
//               <Shield size={13} className="text-purple-600" />
//               <span>{activePoliciesCount} of {totalPolicies} Policies Active</span>
//             </span>
//           </div>
//         }
//         actions={
//           <div className="flex items-center gap-2.5">
//             <Link
//               href="/control-audits/audit-trail"
//               className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
//             >
//               <FileCode2 size={14} className="text-slate-400" />
//               <span>Policy Audit Logs</span>
//             </Link>
//             <button
//               onClick={() => setIsCreateModalOpen(true)}
//               className="px-3.5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
//             >
//               <Plus size={14} />
//               <span>Create Governance Policy</span>
//             </button>
//           </div>
//         }
//       />

//       {/* ── A. 4 METRIC SUMMARY CARDS ── */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* 1. Active Enforced Policies */}
//         <div
//           onClick={() => setSelectedStatus(selectedStatus === "Active" ? "all" : "Active")}
//           className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
//             selectedStatus === "Active"
//               ? "border-purple-400 bg-purple-50/30 ring-2 ring-purple-300/50"
//               : "border-slate-200/80 hover:border-purple-300"
//           }`}
//         >
//           <div>
//             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
//               Active Enforced Policies
//             </span>
//             <div className="text-2xl font-extrabold text-purple-800 tracking-tight">
//               {activePoliciesCount}
//             </div>
//             <p className="text-[11px] text-purple-600 font-medium mt-1">100% compliance monitored</p>
//           </div>
//           <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
//             <ShieldCheck size={18} />
//           </div>
//         </div>

//         {/* 2. Strict Block Rules */}
//         <div
//           onClick={() => setSelectedEnforcement(selectedEnforcement === "Strict Block" ? "all" : "Strict Block")}
//           className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
//             selectedEnforcement === "Strict Block"
//               ? "border-rose-400 bg-rose-50/30 ring-2 ring-rose-300/50"
//               : "border-slate-200/80 hover:border-rose-300"
//           }`}
//         >
//           <div>
//             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
//               Strict Block Policies
//             </span>
//             <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
//               {strictBlockCount}
//             </div>
//             <p className="text-[11px] text-slate-400 mt-1">Automated execution halt on breach</p>
//           </div>
//           <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
//             <Lock size={18} />
//           </div>
//         </div>

//         {/* 3. Monitored Workspaces */}
//         <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
//           <div>
//             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
//               Monitored Workspaces
//             </span>
//             <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
//               {activeDeal.workspaces ? activeDeal.workspaces.length : 4}
//             </div>
//             <p className="text-[11px] text-slate-400 mt-1">Buyer, Seller & Advisor rooms</p>
//           </div>
//           <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--brand)] flex items-center justify-center font-bold">
//             <Layers size={18} />
//           </div>
//         </div>

//         {/* 4. Automated Suspensions */}
//         <div
//           onClick={() => setSelectedEnforcement(selectedEnforcement === "Automated Suspension" ? "all" : "Automated Suspension")}
//           className={`bg-white border rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between ${
//             selectedEnforcement === "Automated Suspension"
//               ? "border-amber-400 bg-amber-50/30 ring-2 ring-amber-300/50"
//               : "border-slate-200/80 hover:border-amber-300"
//           }`}
//         >
//           <div>
//             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
//               Automated Suspensions
//             </span>
//             <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
//               {automatedSuspensionCount}
//             </div>
//             <p className="text-[11px] text-slate-400 mt-1">Inactivity & credential revocation</p>
//           </div>
//           <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
//             <AlertOctagon size={18} />
//           </div>
//         </div>
//       </div>

//       {/* ── B. FILTER & SEARCH TOOLBAR ── */}
//       <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           {/* Search bar */}
//           <div className="relative flex-1 min-w-[260px] max-w-md">
//             <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search policy name, scope, description, or owner..."
//               className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800 placeholder:text-slate-400"
//             />
//             {searchQuery && (
//               <button
//                 onClick={() => setSearchQuery("")}
//                 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//               >
//                 <X size={12} />
//               </button>
//             )}
//           </div>

//           {/* Quick Status Filters */}
//           <div className="flex items-center gap-1.5">
//             {["all", "Active", "Inactive"].map((st) => (
//               <button
//                 key={st}
//                 onClick={() => setSelectedStatus(st)}
//                 className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
//                   selectedStatus === st
//                     ? "bg-slate-900 text-white shadow-2xs"
//                     : "bg-slate-100 hover:bg-slate-200 text-slate-600"
//                 }`}
//               >
//                 {st === "all" ? "All Policies" : st}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Secondary Dropdown Filters */}
//         <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
//           {/* Scope Dropdown */}
//           <div className="flex items-center gap-1.5">
//             <span className="text-slate-400 font-medium">Scope:</span>
//             <select
//               value={selectedScope}
//               onChange={(e) => setSelectedScope(e.target.value)}
//               className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)]"
//             >
//               <option value="all">All Scopes</option>
//               <option value="Workspace-wide">Workspace-wide</option>
//               <option value="All Buyer Rooms">All Buyer Rooms</option>
//               <option value="Deal: Acme Corp Acquisition">Deal Specific</option>
//               <option value="All Active Deals">All Active Deals</option>
//             </select>
//           </div>

//           {/* Enforcement Dropdown */}
//           <div className="flex items-center gap-1.5">
//             <span className="text-slate-400 font-medium">Enforcement:</span>
//             <select
//               value={selectedEnforcement}
//               onChange={(e) => setSelectedEnforcement(e.target.value)}
//               className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:border-[var(--brand)]"
//             >
//               <option value="all">All Enforcement Levels</option>
//               <option value="Strict Block">Strict Block</option>
//               <option value="Automated Suspension">Automated Suspension</option>
//             </select>
//           </div>

//           {/* Reset button */}
//           {hasActiveFilters && (
//             <button
//               onClick={resetFilters}
//               className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium ml-auto cursor-pointer"
//             >
//               <RotateCcw size={12} />
//               <span>Reset Filters</span>
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── C. ENTERPRISE POLICY TABLE ── */}
//       {filteredPolicies.length === 0 ? (
//         <EmptyState
//           title="No Governance Policies Found"
//           description="No policies match the specified search or filter parameters."
//           actionLabel="Reset Filters"
//           onAction={resetFilters}
//         />
//       ) : (
//         <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-xs">
//               <thead className="bg-slate-50/90 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0 z-10">
//                 <tr>
//                   <th className="py-3 px-4 min-w-[280px]">Policy & Governance Standard</th>
//                   <th className="py-3 px-4 w-44">Scope</th>
//                   <th className="py-3 px-4 w-44">Enforcement Level</th>
//                   <th className="py-3 px-4 w-36">Owner</th>
//                   <th className="py-3 px-4 w-32">Last Updated</th>
//                   <th className="py-3 px-4 w-28 text-center">Status</th>
//                   <th className="py-3 px-4 w-24 text-right">Configure</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {filteredPolicies.map((policy) => {
//                   const isActive = policy.status === "Active";
//                   return (
//                     <tr
//                       key={policy.id}
//                       className={`hover:bg-slate-50/70 transition-colors group ${
//                         !isActive ? "bg-slate-50/40 opacity-75" : ""
//                       }`}
//                     >
//                       {/* Policy Title & Description */}
//                       <td className="py-3.5 px-4 align-top">
//                         <div className="flex items-center gap-2">
//                           <span
//                             className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
//                               isActive
//                                 ? "bg-purple-50 text-purple-700"
//                                 : "bg-slate-100 text-slate-400"
//                             }`}
//                           >
//                             <Shield size={13} />
//                           </span>
//                           <span className="font-bold text-slate-900 group-hover:text-[var(--brand)] transition-colors text-xs">
//                             {policy.name}
//                           </span>
//                         </div>
//                         <p className="text-[11px] text-slate-500 mt-1 pl-8 leading-relaxed max-w-xl">
//                           {policy.description}
//                         </p>
//                       </td>

//                       {/* Scope */}
//                       <td className="py-3.5 px-4 align-top">
//                         <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
//                           {policy.scope}
//                         </span>
//                       </td>

//                       {/* Enforcement Level */}
//                       <td className="py-3.5 px-4 align-top">
//                         <span
//                           className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
//                             policy.enforcementLevel === "Strict Block"
//                               ? "bg-rose-50 text-rose-700 border-rose-200"
//                               : "bg-amber-50 text-amber-700 border-amber-200"
//                           }`}
//                         >
//                           <Lock size={11} />
//                           <span>{policy.enforcementLevel}</span>
//                         </span>
//                       </td>

//                       {/* Owner */}
//                       <td className="py-3.5 px-4 align-top">
//                         <div className="flex items-center gap-2">
//                           <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
//                             {policy.owner.split(" ").map((w) => w[0]).join("").slice(0, 2)}
//                           </span>
//                           <span className="font-semibold text-slate-800 truncate text-[11px]">
//                             {policy.owner}
//                           </span>
//                         </div>
//                       </td>

//                       {/* Last Updated */}
//                       <td className="py-3.5 px-4 align-top font-mono text-[11px] text-slate-500">
//                         {policy.lastUpdated}
//                       </td>

//                       {/* Active / Inactive Toggle Switch */}
//                       <td className="py-3.5 px-4 align-top text-center">
//                         <button
//                           type="button"
//                           onClick={() => togglePolicyStatus(policy.id)}
//                           className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
//                             isActive ? "bg-purple-600" : "bg-slate-300"
//                           }`}
//                           title={`Click to ${isActive ? "disable" : "enable"} ${policy.name}`}
//                         >
//                           <span
//                             aria-hidden="true"
//                             className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
//                               isActive ? "translate-x-4" : "translate-x-0"
//                             }`}
//                           />
//                         </button>
//                         <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
//                           {policy.status}
//                         </span>
//                       </td>

//                       {/* Actions */}
//                       <td className="py-3.5 px-4 align-top text-right">
//                         <button
//                           onClick={() => handleOpenInspect(policy)}
//                           className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
//                         >
//                           <span>Inspect</span>
//                           <ChevronRight size={12} />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* ── D. POLICY DETAIL & INSPECTION DRAWER ── */}
//       {selectedPolicy && (
//         <DetailDrawer
//           isOpen={Boolean(selectedPolicy)}
//           onClose={() => setSelectedPolicy(null)}
//           title="Policy Rule Inspection & Governance"
//           subtitle={`Policy ID: ${selectedPolicy.id} • Deal: ${activeDeal.name}`}
//           badge={
//             <span
//               className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
//                 selectedPolicy.status === "Active"
//                   ? "bg-purple-50 text-purple-700 border border-purple-200"
//                   : "bg-slate-100 text-slate-600 border border-slate-200"
//               }`}
//             >
//               {selectedPolicy.status}
//             </span>
//           }
//           footer={
//             <div className="flex items-center justify-end gap-2.5 w-full">
//               <button
//                 onClick={() => setSelectedPolicy(null)}
//                 className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
//               >
//                 Close
//               </button>
//               <button
//                 onClick={handleSavePolicyEdits}
//                 className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
//               >
//                 <CheckCircle2 size={14} />
//                 <span>Save Configuration</span>
//               </button>
//             </div>
//           }
//         >
//           <div className="space-y-6 text-xs text-slate-700">
//             {/* Policy Title Banner */}
//             <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl flex items-start gap-3">
//               <Shield size={20} className="text-purple-600 shrink-0 mt-0.5" />
//               <div>
//                 <h4 className="font-bold text-sm text-purple-900">
//                   {selectedPolicy.name}
//                 </h4>
//                 <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
//                   Enforces strict transaction compliance across all connected workspaces. Breaches immediately create immutable forensic audit events.
//                 </p>
//               </div>
//             </div>

//             {/* Core Metadata */}
//             <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
//               <div>
//                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
//                   Enforcement Scope
//                 </span>
//                 <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
//                   {selectedPolicy.scope}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
//                   Enforcement Standard
//                 </span>
//                 <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
//                   {selectedPolicy.enforcementLevel}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
//                   Designated Compliance Lead
//                 </span>
//                 <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
//                   {selectedPolicy.owner}
//                 </span>
//               </div>
//               <div>
//                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
//                   Last Policy Review
//                 </span>
//                 <span className="font-mono text-slate-800 text-xs mt-0.5 block">
//                   {selectedPolicy.lastUpdated}
//                 </span>
//               </div>
//             </div>

//             {/* Editable Description */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
//                 Policy Mandate Description
//               </label>
//               <textarea
//                 rows={3}
//                 value={editPolicyDescription}
//                 onChange={(e) => setEditPolicyDescription(e.target.value)}
//                 className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] font-medium text-slate-800"
//               />
//             </div>

//             {/* Enforcement Level Selection */}
//             <div>
//               <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
//                 Enforcement Response Action
//               </label>
//               <div className="grid grid-cols-2 gap-2.5">
//                 {[
//                   {
//                     level: "Strict Block",
//                     desc: "Immediately halts request, revokes session token, and triggers security notification.",
//                   },
//                   {
//                     level: "Automated Suspension",
//                     desc: "Temporarily locks access until administrative approval review is conducted.",
//                   },
//                 ].map((item) => (
//                   <button
//                     key={item.level}
//                     type="button"
//                     onClick={() => setEditPolicyEnforcement(item.level)}
//                     className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
//                       editPolicyEnforcement === item.level
//                         ? "border-[var(--brand)] bg-blue-50/40 ring-2 ring-[var(--brand)]/20"
//                         : "border-slate-200 bg-white hover:bg-slate-50"
//                     }`}
//                   >
//                     <span className="font-bold text-xs text-slate-900 block mb-1">
//                       {item.level}
//                     </span>
//                     <span className="text-[11px] text-slate-500 leading-normal block">
//                       {item.desc}
//                     </span>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Related Audit Events */}
//             <div>
//               <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
//                 Recent Violations Logged Under This Policy
//               </h4>
//               <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-2">
//                 <div className="flex items-center justify-between">
//                   <span className="font-semibold text-slate-800">
//                     Incident #4491: External Link Generation Attempt
//                   </span>
//                   <span className="text-rose-600 font-bold">Blocked</span>
//                 </div>
//                 <p className="text-slate-500 text-[10px]">
//                   Actor: c.dupont@regulatory-sandbox.gov • Triggered 2026-09-07 14:10 UTC
//                 </p>
//               </div>
//             </div>
//           </div>
//         </DetailDrawer>
//       )}

//       {/* ── E. CREATE POLICY MODAL ── */}
//       {isCreateModalOpen && (
//         <ModalPortal>
//           <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
//             <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
//               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
//                 <div>
//                   <h3 className="text-sm font-bold text-slate-900">
//                     Create Governance Policy
//                   </h3>
//                   <p className="text-xs text-slate-500">
//                     Enforce compliance rules across workspaces in {activeDeal.name}.
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsCreateModalOpen(false)}
//                   className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
//                 >
//                   <X size={16} />
//                 </button>
//               </div>

//               <form onSubmit={handleCreatePolicySubmit} className="p-6 space-y-4 text-xs">
//                 <div>
//                   <label className="block font-bold text-slate-700 mb-1">
//                     Policy Name *
//                   </label>
//                   <input
//                     type="text"
//                     required
//                     value={newPolicyForm.name}
//                     onChange={(e) => setNewPolicyForm({ ...newPolicyForm, name: e.target.value })}
//                     placeholder="e.g., Clean Room Cleanse & Destruction Policy"
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[var(--brand)] text-slate-800 font-medium"
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="block font-bold text-slate-700 mb-1">
//                       Enforcement Scope
//                     </label>
//                     <select
//                       value={newPolicyForm.scope}
//                       onChange={(e) => setNewPolicyForm({ ...newPolicyForm, scope: e.target.value })}
//                       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
//                     >
//                       <option value="Workspace-wide">Workspace-wide</option>
//                       <option value="All Buyer Rooms">All Buyer Rooms</option>
//                       <option value="Deal: Acme Corp Acquisition">Deal Specific</option>
//                       <option value="All Active Deals">All Active Deals</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block font-bold text-slate-700 mb-1">
//                       Enforcement Level
//                     </label>
//                     <select
//                       value={newPolicyForm.enforcementLevel}
//                       onChange={(e) => setNewPolicyForm({ ...newPolicyForm, enforcementLevel: e.target.value })}
//                       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
//                     >
//                       <option value="Strict Block">Strict Block</option>
//                       <option value="Automated Suspension">Automated Suspension</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block font-bold text-slate-700 mb-1">
//                     Designated Compliance Lead
//                   </label>
//                   <input
//                     type="text"
//                     value={newPolicyForm.owner}
//                     onChange={(e) => setNewPolicyForm({ ...newPolicyForm, owner: e.target.value })}
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
//                   />
//                 </div>

//                 <div>
//                   <label className="block font-bold text-slate-700 mb-1">
//                     Rule & Mandate Description
//                   </label>
//                   <textarea
//                     rows={3}
//                     value={newPolicyForm.description}
//                     onChange={(e) => setNewPolicyForm({ ...newPolicyForm, description: e.target.value })}
//                     placeholder="Specify exact conditions, restriction rules, and breach penalties..."
//                     className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-[var(--brand)]"
//                   />
//                 </div>

//                 <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
//                   <button
//                     type="button"
//                     onClick={() => setIsCreateModalOpen(false)}
//                     className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
//                   >
//                     <Plus size={14} />
//                     <span>Enforce Policy</span>
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </ModalPortal>
//       )}
//     </div>
//   );
// }
