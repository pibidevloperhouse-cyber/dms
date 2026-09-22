"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";

const PERMISSION_SECTIONS = [
    {
        label: "Workspace", scope: "workspace", description: "Control access to navigation modules and group management",
        subPerms: [
            { key: "can_access_groups", label: "Groups", desc: "Can access the Groups module and manage group settings", nested: [{ key: "can_add_members", label: "Add Members", desc: "Can invite & add users to groups" }, { key: "can_remove_members", label: "Remove Members", desc: "Can remove users from groups" }, { key: "can_create_group", label: "Create Group", desc: "Can create new groups" }, { key: "can_delete_group", label: "Delete Group", desc: "Can delete existing groups" }] },
            { key: "can_access_settings", label: "Settings", desc: "Can access the Settings module and workspace configurations", nested: [{ key: "can_access_branding", label: "Branding", desc: "Can customize workspace branding" }, { key: "can_access_watermarks", label: "Watermarks", desc: "Can configure document watermarks" }, { key: "can_access_nda", label: "NDA Access", desc: "Can view and configure NDA settings and signers" }] },
            { key: "can_access_qa", label: "Q&A Module", desc: "Can access the Q&A due diligence inquiry module", nested: [{ key: "can_ask_qa", label: "Ask Questions", desc: "Can raise new document-linked questions" }, { key: "can_answer_qa", label: "Answer & Suggest", desc: "Can submit suggested answers and collaborate" }] },
            { key: "can_access_deals", label: "Deals", desc: "Can access the Deals module" },
            { key: "can_access_tasks", label: "Tasks & Workflow", desc: "Can access the Tasks & Workflow module" },
            { key: "can_access_communication", label: "Communication", desc: "Can access the Communication module" },
            { key: "can_access_control_audits", label: "Control & Audits", desc: "Can access the Control & Audits module" },
        ],
    },
];

const DEFAULT_PERMS = { can_view: false, can_edit: false, can_download: false, can_delete: false, can_add_members: false, can_remove_members: false };

export default function UserPermissionsPage() {
    const params = useParams();
    const router = useRouter();
    const groupSlug = params.slug;
    const userId = params.userId;

    const [groupData, setGroupData] = useState(null);
    const [perms, setPerms] = useState({});
    const [permsLoading, setPermsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [session, setSession] = useState(null);
    const [dealFeatures, setDealFeatures] = useState(null);

    useEffect(() => {
        const rawSession = localStorage.getItem("vdr_session");
        if (rawSession) {
            const parsed = JSON.parse(rawSession);
            setSession(parsed);
            if (parsed.role === 'guest_admin' && parsed.active_workspace_id) {
                fetch(`/api/dms/deals/${parsed.active_workspace_id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.deal) setDealFeatures(data.deal);
                    })
                    .catch(console.error);
            }
        }
    }, []);

    // ── HITS DETAILS API JUST FOR GROUP INFO ──
    useEffect(() => {
        if (!groupSlug || !session) return;
        const fetchGroup = async () => {
            const res = await fetch('/api/groups/details', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, groupSlug })
            });
            const data = await res.json();
            if (data.success) setGroupData(data.group);
        };
        fetchGroup();
    }, [groupSlug, session]);

    // ── HITS PERMISSIONS API ──
    useEffect(() => {
        if (!groupData || !session) return;
        const loadPerms = async () => {
            setPermsLoading(true);
            try {
                const res = await fetch('/api/groups/permissions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'fetch', session, groupId: null, userId })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                const built = {};
                PERMISSION_SECTIONS.forEach(({ scope }) => {
                    const row = data.rawPermissions?.find((r) => r.scope === scope);
                    built[scope] = {
                        enabled: !!row,
                        can_add_members: row?.can_add_members ?? false,
                        can_remove_members: row?.can_remove_members ?? false,
                        can_create_group: row?.can_create_group ?? false,
                        can_delete_group: row?.can_delete_group ?? false,
                        can_access_documents: row?.can_access_documents ?? false,
                        can_access_groups: row?.can_access_groups ?? false,
                        can_access_edit_permissions: row?.can_access_edit_permissions ?? false,
                        can_access_settings: row?.can_access_settings ?? false,
                        can_access_branding: row?.can_access_branding ?? false,
                        can_access_watermarks: row?.can_access_watermarks ?? false,
                        can_access_nda: row?.can_access_nda ?? false,
                        can_access_qa: row?.can_access_qa ?? false,
                        can_ask_qa: row?.can_ask_qa ?? false,
                        can_answer_qa: row?.can_answer_qa ?? false,
                        can_access_deals: row?.can_access_deals ?? false,
                        can_access_tasks: row?.can_access_tasks ?? false,
                        can_access_communication: row?.can_access_communication ?? false,
                        can_access_control_audits: row?.can_access_control_audits ?? false,
                        existingId: row?.id ?? null,
                    };
                });

                const filesRow = data.rawPermissions?.find((r) => r.scope === "files");
                built["files"] = {
                    enabled: !!filesRow,
                    can_create_folder: filesRow?.can_create_folder ?? false,
                    can_merge_folder: filesRow?.can_merge_folder ?? false,
                    can_delete_folder: filesRow?.can_delete_folder ?? false,
                    existingId: filesRow?.id ?? null,
                };

                setPerms(built);
            } catch (err) { console.error(err); } finally { setPermsLoading(false); }
        };
        loadPerms();
    }, [groupData, session]);

    const triggerToast = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

    const toggleSection = (scope) => {
        setPerms((prev) => {
            const current = prev[scope] || { ...DEFAULT_PERMS, enabled: false, existingId: null };
            return { ...prev, [scope]: { ...current, enabled: !current.enabled, ...(!current.enabled ? {} : { can_view: false, can_edit: false, can_download: false, can_delete: false, can_add_members: false, can_remove_members: false }) } };
        });
    };

    const toggleSubPerm = (scope, key) => setPerms((prev) => ({ ...prev, [scope]: { ...prev[scope], [key]: !prev[scope]?.[key] } }));

    // ── SAVES VIA PERMISSIONS API ──
    const handleSubmitPermissions = async () => {
        if (!groupData) return;
        setSaving(true);
        try {
            const ALL_SECTIONS = [...PERMISSION_SECTIONS, { scope: "files" }];
            const toDeleteIds = [];
            const toUpsert = [];

            for (const { scope } of ALL_SECTIONS) {
                const s = perms[scope];
                if (!s) continue;

                if (!s.enabled && !s.can_access_edit_permissions) {
                    if (s.existingId) toDeleteIds.push(s.existingId);
                    continue;
                }

                const payload = {
                    company_id: groupData.company_id, group_id: null, user_id: userId, scope,
                    can_view: false, can_add_members: s.can_add_members || false, can_remove_members: s.can_remove_members || false,
                    can_create_group: s.can_create_group || false, can_delete_group: s.can_delete_group || false,
                    can_access_documents: s.can_access_documents || false, can_access_groups: s.can_access_groups || false,
                    can_access_edit_permissions: s.can_access_edit_permissions || false, can_access_settings: s.can_access_settings || false,
                    can_access_branding: s.can_access_branding || false, can_access_watermarks: s.can_access_watermarks || false, can_access_nda: s.can_access_nda || false,
                    can_access_qa: s.can_access_qa || false, can_ask_qa: s.can_ask_qa || false, can_answer_qa: s.can_answer_qa || false,
                    can_access_deals: s.can_access_deals || false, can_access_tasks: s.can_access_tasks || false, can_access_communication: s.can_access_communication || false, can_access_control_audits: s.can_access_control_audits || false,
                    folder_id: null, document_id: null, can_create_folder: s.can_create_folder || false, can_merge_folder: s.can_merge_folder || false, can_delete_folder: s.can_delete_folder || false,
                };
                if (s.existingId) { payload.id = s.existingId; payload.updated_at = new Date().toISOString(); }
                toUpsert.push(payload);
            }

            const res = await fetch('/api/groups/permissions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'save', session, groupId: null, userId, permissionsPayload: { toDeleteIds, toUpsert } })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            triggerToast("Permissions saved successfully");
            setTimeout(() => router.push(`/groups/${groupSlug}`), 1200);
        } catch (err) { alert("Failed to save permissions: " + err.message); } finally { setSaving(false); }
    };

    const handleToggleEditPerm = async () => {
        const ws = perms["workspace"] || { enabled: false, existingId: null };
        const isOn = !!ws.can_access_edit_permissions;
        const newVal = !isOn;
        setPerms((prev) => ({ ...prev, workspace: { ...prev.workspace, can_access_edit_permissions: newVal } }));
        triggerToast("Press Save Permissions to confirm edit toggle");
    };

    const ws = perms["workspace"] || { enabled: false, existingId: null };
    const isEditPermOn = !!ws.can_access_edit_permissions;

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden font-sans bg-[#F8FAFC] relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--brand)]/10 to-transparent pointer-events-none" />

            {showToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[var(--brand-dark)] text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300 font-medium text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {toastMsg}
                </div>
            )}

            <div className="pt-10 px-10 pb-6 shrink-0 relative z-10">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => router.push(`/groups/${groupSlug}`)} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer">
                        <FaArrowLeft size={14} />
                    </button>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                            {groupData?.name || "Group"} &rsaquo; Permissions
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] text-white flex items-center justify-center shadow-sm">
                                <FaShieldAlt size={15} />
                            </span>
                            Edit User Permissions
                        </h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-10 pb-12">
                <div className="max-w-4xl">
                    {permsLoading ? (
                        <div className="py-32 flex justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>
                    ) : (
                        <div className="space-y-6">

                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-base text-slate-800">Edit Permissions Access</p>
                                        <p className="text-sm text-slate-500 mt-1">Allow this group to access and modify permission settings for other groups</p>
                                    </div>
                                    <button onClick={handleToggleEditPerm} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${isEditPermOn ? "bg-[var(--brand)]" : "bg-slate-200"}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEditPermOn ? "translate-x-5" : "translate-x-0"}`} />
                                    </button>
                                </div>
                            </div>

                            {PERMISSION_SECTIONS.map(({ label, scope, description, subPerms }) => {
                                const s = perms[scope] || { enabled: false, ...DEFAULT_PERMS, existingId: null };
                                
                                let visibleSubPerms = subPerms;
                                if (session?.role === 'guest_admin') {
                                    visibleSubPerms = subPerms.filter(sub => {
                                        if (sub.key === 'can_access_qa' && dealFeatures && !dealFeatures.featureQa) return false;
                                        if (sub.key === 'can_access_tasks' && dealFeatures && !dealFeatures.featureTasks) return false;
                                        if (sub.key === 'can_access_deals' && dealFeatures && !dealFeatures.featureBidding) return false;
                                        if (sub.key === 'can_access_groups' && dealFeatures && !dealFeatures.featureGroups) return false;
                                        if (sub.key === 'can_access_communication' && dealFeatures && !dealFeatures.featureCommunication) return false;
                                        if (sub.key === 'can_access_settings') return false;
                                        if (sub.key === 'can_access_control_audits') return false;
                                        return true;
                                    });
                                }

                                if (visibleSubPerms.length === 0) return null;

                                return (
                                    <div key={scope} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="font-semibold text-base text-slate-800">{label} Access Control</p>
                                                <p className="text-sm text-slate-500 mt-1">{description}</p>
                                            </div>
                                            <button onClick={() => toggleSection(scope)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${s.enabled ? "bg-[var(--brand)]" : "bg-slate-200"}`}>
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.enabled ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                        </div>
                                        {s.enabled && (
                                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                {visibleSubPerms.map((sub) => {
                                                    const isModuleOn = !!s[sub.key];
                                                    return (
                                                        <div key={sub.key} className={`border rounded-2xl transition-all duration-200 overflow-hidden ${isModuleOn ? "border-slate-300 shadow-sm bg-white" : "border-slate-200 bg-slate-50/50"}`}>
                                                            <div className="p-6 flex items-center justify-between">
                                                                <div>
                                                                    <h4 className={`font-semibold ${isModuleOn ? "text-slate-800" : "text-slate-600"}`}>{sub.label} Module</h4>
                                                                    <p className="text-sm text-slate-500 mt-1">{sub.desc}</p>
                                                                </div>
                                                                <button onClick={() => toggleSubPerm(scope, sub.key)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isModuleOn ? "bg-emerald-500" : "bg-slate-300"}`}>
                                                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isModuleOn ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>
                                                            {isModuleOn && sub.nested && sub.nested.length > 0 && (
                                                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in fade-in duration-300">
                                                                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-5">Granular Permissions</h5>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                                                        {sub.nested.map((n) => (
                                                                            <label key={n.key} className="flex items-start gap-3.5 cursor-pointer group">
                                                                                <div className="mt-0.5 relative flex items-center justify-center">
                                                                                    <input type="checkbox" checked={!!s[n.key]} onChange={() => toggleSubPerm(scope, n.key)} className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none transition-all cursor-pointer" />
                                                                                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <span className={`block text-sm font-medium transition-colors ${s[n.key] ? "text-slate-900" : "text-slate-600"}`}>{n.label}</span>
                                                                                    <span className="block text-xs text-slate-500 mt-0.5">{n.desc}</span>
                                                                                </div>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(() => {
                                const fs = perms["files"] || { enabled: false, can_create_folder: false, can_merge_folder: false, can_delete_folder: false, existingId: null };
                                const folderPerms = [{ key: "can_create_folder", label: "Create Folder", desc: "Can create new folders in the workspace" }, { key: "can_merge_folder", label: "Merge Folder", desc: "Can merge folders together" }, { key: "can_delete_folder", label: "Delete Folder", desc: "Can permanently delete folders" }];
                                return (
                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="font-semibold text-base text-slate-800">File Access Control</p>
                                                <p className="text-sm text-slate-500 mt-1">Manage folder-level permissions for this group</p>
                                            </div>
                                            <button onClick={() => setPerms((prev) => ({ ...prev, files: { ...(prev.files || {}), enabled: !fs.enabled } }))} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${fs.enabled ? "bg-[var(--brand)]" : "bg-slate-200"}`}>
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fs.enabled ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                        </div>
                                        {fs.enabled && (
                                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="border rounded-2xl border-slate-300 shadow-sm bg-white overflow-hidden">
                                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                                                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-5">Granular Permissions</h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                                            {folderPerms.map((fp) => (
                                                                <label key={fp.key} className="flex items-start gap-3.5 cursor-pointer group">
                                                                    <div className="mt-0.5 relative flex items-center justify-center">
                                                                        <input type="checkbox" checked={!!fs[fp.key]} onChange={() => setPerms((prev) => ({ ...prev, files: { ...prev.files, [fp.key]: !prev.files?.[fp.key] } }))} className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none transition-all cursor-pointer" />
                                                                        <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <span className={`block text-sm font-medium transition-colors ${fs[fp.key] ? "text-slate-900" : "text-slate-600"}`}>{fp.label}</span>
                                                                        <span className="block text-xs text-slate-500 mt-0.5">{fp.desc}</span>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-6 pb-6">
                        <button type="button" onClick={() => router.push(`/groups/${groupSlug}`)} className="flex-1 max-w-xs bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={handleSubmitPermissions} disabled={saving || permsLoading} className="flex-1 max-w-xs bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white py-3 rounded-xl font-semibold text-sm shadow-md hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 cursor-pointer">
                            {saving ? "Saving Changes..." : "Save Permissions"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}









// "use client";

// import React, { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { supabase } from "@/utils/supabase/client";
// import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";

// // ─── Permission Config ────────────────────────────────────────────────────────

// const PERMISSION_SECTIONS = [
//     {
//         label: "Workspace",
//         scope: "workspace",
//         description: "Control access to navigation modules and group management",
//         subPerms: [
//             {
//                 key: "can_access_groups",
//                 label: "Groups",
//                 desc: "Can access the Groups module and manage group settings",
//                 nested: [
//                     { key: "can_add_members", label: "Add Members", desc: "Can invite & add users to groups" },
//                     { key: "can_remove_members", label: "Remove Members", desc: "Can remove users from groups" },
//                     { key: "can_create_group", label: "Create Group", desc: "Can create new groups" },
//                     { key: "can_delete_group", label: "Delete Group", desc: "Can delete existing groups" },
//                 ],
//             },
//             {
//                 key: "can_access_settings",
//                 label: "Settings",
//                 desc: "Can access the Settings module and workspace configurations",
//                 nested: [
//                     { key: "can_access_branding", label: "Branding", desc: "Can customize workspace branding" },
//                     { key: "can_access_watermarks", label: "Watermarks", desc: "Can configure document watermarks" },
//                 ],
//             },
//         ],
//     },
// ];

// const DEFAULT_PERMS = {
//     can_view: false,
//     can_edit: false,
//     can_download: false,
//     can_delete: false,
//     can_add_members: false,
//     can_remove_members: false,
// };

// // ─── Page Component ───────────────────────────────────────────────────────────

// export default function PermissionsPage() {
//     const params = useParams();
//     const router = useRouter();
//     const groupSlug = params.slug;

//     const [groupData, setGroupData] = useState(null);
//     const [companyId, setCompanyId] = useState(null);

//     const [perms, setPerms] = useState({});
//     const [permsLoading, setPermsLoading] = useState(false);
//     const [saving, setSaving] = useState(false);

//     const [toastMsg, setToastMsg] = useState("");
//     const [showToast, setShowToast] = useState(false);

//     // ── Load session ──────────────────────────────────────────────────────────
//     useEffect(() => {
//         const rawSession = localStorage.getItem("vdr_session");
//         if (rawSession) {
//             const parsed = JSON.parse(rawSession);
//             setCompanyId(parsed.company_id);
//         }
//     }, []);

//     // ── Load group ────────────────────────────────────────────────────────────
//     useEffect(() => {
//         if (!groupSlug || !companyId) return;

//         const fetchGroup = async () => {
//             const { data, error } = await supabase
//                 .from("groups")
//                 .select("*")
//                 .eq("company_id", companyId)
//                 .eq("id", groupSlug)
//                 .single();

//             if (!error && data) setGroupData(data);
//         };

//         fetchGroup();
//     }, [groupSlug, companyId]);

//     // ── Load permissions from DB ──────────────────────────────────────────────
//     useEffect(() => {
//         if (!groupData) return;

//         const loadPerms = async () => {
//             setPermsLoading(true);
//             try {
//                 const { data, error } = await supabase
//                     .from("permissions")
//                     .select("*")
//                     .eq("group_id", groupData.id)
//                     .eq("company_id", groupData.company_id);

//                 if (error) throw error;

//                 const built = {};
//                 PERMISSION_SECTIONS.forEach(({ scope }) => {
//                     const row = data?.find((r) => r.scope === scope);
//                     built[scope] = {
//                         enabled: !!row,
//                         can_add_members: row?.can_add_members ?? false,
//                         can_remove_members: row?.can_remove_members ?? false,
//                         can_create_group: row?.can_create_group ?? false,
//                         can_delete_group: row?.can_delete_group ?? false,
//                         can_access_documents: row?.can_access_documents ?? false,
//                         can_access_groups: row?.can_access_groups ?? false,
//                         can_access_edit_permissions: row?.can_access_edit_permissions ?? false,
//                         can_access_settings: row?.can_access_settings ?? false,
//                         can_access_branding: row?.can_access_branding ?? false,
//                         can_access_watermarks: row?.can_access_watermarks ?? false,
//                         existingId: row?.id ?? null,
//                     };
//                 });

//                 const filesRow = data?.find((r) => r.scope === "files");
//                 built["files"] = {
//                     enabled: !!filesRow,
//                     can_create_folder: filesRow?.can_create_folder ?? false,
//                     can_merge_folder: filesRow?.can_merge_folder ?? false,
//                     can_delete_folder: filesRow?.can_delete_folder ?? false,
//                     existingId: filesRow?.id ?? null,
//                 };

//                 setPerms(built);
//             } catch (err) {
//                 console.error("Load perms error:", err);
//             } finally {
//                 setPermsLoading(false);
//             }
//         };

//         loadPerms();
//     }, [groupData]);

//     // ── Helpers ───────────────────────────────────────────────────────────────

//     const triggerToast = (msg) => {
//         setToastMsg(msg);
//         setShowToast(true);
//         setTimeout(() => setShowToast(false), 3000);
//     };

//     const toggleSection = (scope) => {
//         setPerms((prev) => {
//             const current = prev[scope] || { ...DEFAULT_PERMS, enabled: false, existingId: null };
//             return {
//                 ...prev,
//                 [scope]: {
//                     ...current,
//                     enabled: !current.enabled,
//                     ...(!current.enabled
//                         ? {}
//                         : {
//                               can_view: false,
//                               can_edit: false,
//                               can_download: false,
//                               can_delete: false,
//                               can_add_members: false,
//                               can_remove_members: false,
//                           }),
//                 },
//             };
//         });
//     };

//     const toggleSubPerm = (scope, key) => {
//         setPerms((prev) => ({
//             ...prev,
//             [scope]: { ...prev[scope], [key]: !prev[scope]?.[key] },
//         }));
//     };

//     // ── Toggle Edit Permissions Access (instant DB save) ──────────────────────
//     const handleToggleEditPerm = async () => {
//         const ws = perms["workspace"] || { enabled: false, existingId: null };
//         const isOn = !!ws.can_access_edit_permissions;
//         const newVal = !isOn;

//         setPerms((prev) => ({
//             ...prev,
//             workspace: { ...prev.workspace, can_access_edit_permissions: newVal },
//         }));

//         try {
//             if (ws.existingId) {
//                 const { error } = await supabase
//                     .from("permissions")
//                     .update({ can_access_edit_permissions: newVal, updated_at: new Date().toISOString() })
//                     .eq("id", ws.existingId);
//                 if (error) throw error;
//             } else {
//                 const { data: inserted, error } = await supabase
//                     .from("permissions")
//                     .insert({
//                         company_id: groupData.company_id,
//                         group_id: groupData.id,
//                         scope: "workspace",
//                         can_access_edit_permissions: newVal,
//                         can_view: false,
//                         can_add_members: false,
//                         can_remove_members: false,
//                         can_create_group: false,
//                         can_delete_group: false,
//                         can_access_documents: false,
//                         can_access_groups: false,
//                         can_access_settings: false,
//                         can_access_branding: false,
//                         can_access_watermarks: false,
//                     })
//                     .select("id")
//                     .single();
//                 if (error) throw error;
//                 setPerms((prev) => ({
//                     ...prev,
//                     workspace: { ...prev.workspace, existingId: inserted.id },
//                 }));
//             }
//             triggerToast("Edit permission updated successfully");
//         } catch (err) {
//             console.error("Failed to save edit permission:", err);
//             triggerToast("Failed to save: " + err.message);
//             // Revert on error
//             setPerms((prev) => ({
//                 ...prev,
//                 workspace: { ...prev.workspace, can_access_edit_permissions: isOn },
//             }));
//         }
//     };

//     // ── Save All Permissions ──────────────────────────────────────────────────
//     const handleSubmitPermissions = async () => {
//         if (!groupData) return;
//         setSaving(true);
//         try {
//             const ALL_SECTIONS = [...PERMISSION_SECTIONS, { scope: "files" }];
//             for (const { scope } of ALL_SECTIONS) {
//                 const s = perms[scope];
//                 if (!s) continue;

//                 if (!s.enabled && !s.can_access_edit_permissions) {
//                     if (s.existingId) {
//                         const { error } = await supabase
//                             .from("permissions")
//                             .delete()
//                             .eq("id", s.existingId);
//                         if (error) throw error;
//                     }
//                     continue;
//                 }

//                 const payload = {
//                     company_id: groupData.company_id,
//                     group_id: groupData.id,
//                     scope,
//                     can_view: false,
//                     can_add_members: s.can_add_members || false,
//                     can_remove_members: s.can_remove_members || false,
//                     can_create_group: s.can_create_group || false,
//                     can_delete_group: s.can_delete_group || false,
//                     can_access_documents: s.can_access_documents || false,
//                     can_access_groups: s.can_access_groups || false,
//                     can_access_edit_permissions: s.can_access_edit_permissions || false,
//                     can_access_settings: s.can_access_settings || false,
//                     can_access_branding: s.can_access_branding || false,
//                     can_access_watermarks: s.can_access_watermarks || false,
//                     folder_id: null,
//                     document_id: null,
//                     can_create_folder: s.can_create_folder || false,
//                     can_merge_folder: s.can_merge_folder || false,
//                     can_delete_folder: s.can_delete_folder || false,
//                 };

//                 if (s.existingId) {
//                     const { error } = await supabase
//                         .from("permissions")
//                         .update({ ...payload, updated_at: new Date().toISOString() })
//                         .eq("id", s.existingId);
//                     if (error) throw error;
//                 } else {
//                     const { data: inserted, error } = await supabase
//                         .from("permissions")
//                         .insert(payload)
//                         .select("id")
//                         .single();
//                     if (error) throw error;
//                     setPerms((prev) => ({
//                         ...prev,
//                         [scope]: { ...prev[scope], existingId: inserted.id },
//                     }));
//                 }
//             }

//             triggerToast("Permissions saved successfully");
//             // Navigate back after save
//             setTimeout(() => router.push(`/groups/${groupSlug}`), 1200);
//         } catch (err) {
//             console.error("Save perms error:", err);
//             alert("Failed to save permissions: " + err.message);
//         } finally {
//             setSaving(false);
//         }
//     };

//     // ─── UI ───────────────────────────────────────────────────────────────────

//     const ws = perms["workspace"] || { enabled: false, existingId: null };
//     const isEditPermOn = !!ws.can_access_edit_permissions;

//     return (
//         <div className="flex-1 flex flex-col h-screen overflow-hidden font-sans bg-[#F8FAFC] relative">
//             {/* Background gradient */}
//             <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[var(--brand)]/10 to-transparent pointer-events-none" />

//             {/* TOAST */}
//             {showToast && (
//                 <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[var(--brand-dark)] text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in duration-300 font-medium text-sm flex items-center gap-2">
//                     <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                     </svg>
//                     {toastMsg}
//                 </div>
//             )}

//             {/* HEADER */}
//             <div className="pt-10 px-10 pb-6 shrink-0 relative z-10">
//                 <div className="flex items-center gap-4 mb-2">
//                     <button
//                         onClick={() => router.push(`/groups/${groupSlug}`)}
//                         className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer"
//                         title="Back to Group"
//                     >
//                         <FaArrowLeft size={14} />
//                     </button>
//                     <div>
//                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
//                             {groupData?.name || "Group"} &rsaquo; Permissions
//                         </p>
//                         <h1 className="text-2xl font-semibold text-slate-800 tracking-tight flex items-center gap-3">
//                             <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] text-white flex items-center justify-center shadow-sm">
//                                 <FaShieldAlt size={15} />
//                             </span>
//                             Edit Permissions
//                         </h1>
//                     </div>
//                 </div>
//                 <p className="text-slate-500 text-sm ml-14 pl-0.5">
//                     Configure granular access controls for{" "}
//                     <span className="font-semibold text-slate-700">{groupData?.name || "this group"}</span>
//                 </p>
//             </div>

//             {/* CONTENT */}
//             <div className="flex-1 overflow-y-auto px-10 pb-12">
//                 <div className="max-w-4xl">
//                     {permsLoading ? (
//                         <div className="py-32 flex justify-center">
//                             <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//                         </div>
//                     ) : (
//                         <div className="space-y-6">

//                             {/* ── Edit Permissions Access Toggle ── */}
//                             <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
//                                 <div className="flex items-center justify-between">
//                                     <div>
//                                         <p className="font-semibold text-base text-slate-800">Edit Permissions Access</p>
//                                         <p className="text-sm text-slate-500 mt-1">
//                                             Allow this group to access and modify permission settings for other groups
//                                         </p>
//                                     </div>
//                                     <button
//                                         onClick={handleToggleEditPerm}
//                                         className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${isEditPermOn ? "bg-[var(--brand)]" : "bg-slate-200"}`}
//                                     >
//                                         <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEditPermOn ? "translate-x-5" : "translate-x-0"}`} />
//                                     </button>
//                                 </div>
//                             </div>

//                             {/* ── Workspace Access Sections ── */}
//                             {PERMISSION_SECTIONS.map(({ label, scope, description, subPerms }) => {
//                                 const s = perms[scope] || { enabled: false, ...DEFAULT_PERMS, existingId: null };

//                                 return (
//                                     <div key={scope} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
//                                         {/* Section Header */}
//                                         <div className="flex items-center justify-between mb-6">
//                                             <div>
//                                                 <p className="font-semibold text-base text-slate-800">{label} Access Control</p>
//                                                 <p className="text-sm text-slate-500 mt-1">{description}</p>
//                                             </div>
//                                             <button
//                                                 onClick={() => toggleSection(scope)}
//                                                 className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${s.enabled ? "bg-[var(--brand)]" : "bg-slate-200"}`}
//                                             >
//                                                 <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.enabled ? "translate-x-5" : "translate-x-0"}`} />
//                                             </button>
//                                         </div>

//                                         {/* Sub Modules */}
//                                         {s.enabled && (
//                                             <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
//                                                 {subPerms.map((sub) => {
//                                                     const isModuleOn = !!s[sub.key];
//                                                     return (
//                                                         <div key={sub.key} className={`border rounded-2xl transition-all duration-200 overflow-hidden ${isModuleOn ? "border-slate-300 shadow-sm bg-white" : "border-slate-200 bg-slate-50/50"}`}>
//                                                             {/* Module Header */}
//                                                             <div className="p-6 flex items-center justify-between">
//                                                                 <div>
//                                                                     <h4 className={`font-semibold ${isModuleOn ? "text-slate-800" : "text-slate-600"}`}>{sub.label} Module</h4>
//                                                                     <p className="text-sm text-slate-500 mt-1">{sub.desc}</p>
//                                                                 </div>
//                                                                 <button
//                                                                     onClick={() => toggleSubPerm(scope, sub.key)}
//                                                                     className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isModuleOn ? "bg-emerald-500" : "bg-slate-300"}`}
//                                                                 >
//                                                                     <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isModuleOn ? "translate-x-4" : "translate-x-0"}`} />
//                                                                 </button>
//                                                             </div>

//                                                             {/* Granular Permissions */}
//                                                             {isModuleOn && sub.nested && sub.nested.length > 0 && (
//                                                                 <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in fade-in duration-300">
//                                                                     <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-5">Granular Permissions</h5>
//                                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
//                                                                         {sub.nested.map((n) => (
//                                                                             <label key={n.key} className="flex items-start gap-3.5 cursor-pointer group">
//                                                                                 <div className="mt-0.5 relative flex items-center justify-center">
//                                                                                     <input
//                                                                                         type="checkbox"
//                                                                                         checked={!!s[n.key]}
//                                                                                         onChange={() => toggleSubPerm(scope, n.key)}
//                                                                                         className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 transition-all cursor-pointer"
//                                                                                     />
//                                                                                     <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
//                                                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                                                                                     </svg>
//                                                                                 </div>
//                                                                                 <div className="flex-1">
//                                                                                     <span className={`block text-sm font-medium transition-colors ${s[n.key] ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"}`}>{n.label}</span>
//                                                                                     <span className="block text-xs text-slate-500 mt-0.5">{n.desc}</span>
//                                                                                 </div>
//                                                                             </label>
//                                                                         ))}
//                                                                     </div>
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     );
//                                                 })}
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })}

//                             {/* ── File Access Control ── */}
//                             {(() => {
//                                 const fs = perms["files"] || {
//                                     enabled: false,
//                                     can_create_folder: false,
//                                     can_merge_folder: false,
//                                     can_delete_folder: false,
//                                     existingId: null,
//                                 };
//                                 const folderPerms = [
//                                     { key: "can_create_folder", label: "Create Folder", desc: "Can create new folders in the workspace" },
//                                     { key: "can_merge_folder", label: "Merge Folder", desc: "Can merge folders together" },
//                                     { key: "can_delete_folder", label: "Delete Folder", desc: "Can permanently delete folders" },
//                                 ];

//                                 return (
//                                     <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
//                                         <div className="flex items-center justify-between mb-6">
//                                             <div>
//                                                 <p className="font-semibold text-base text-slate-800">File Access Control</p>
//                                                 <p className="text-sm text-slate-500 mt-1">Manage folder-level permissions for this group</p>
//                                             </div>
//                                             <div className="flex items-center gap-3">
//                                                 <button
//                                                     onClick={() => groupData?.id && router.push(`/documents/access?group=${groupData.id}`)}
//                                                     title="Go to advanced file permissions"
//                                                     className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-[var(--brand-dark)] hover:text-white transition-colors"
//                                                 >
//                                                     <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                                                         <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
//                                                     </svg>
//                                                 </button>
//                                                 <button
//                                                     onClick={() => setPerms((prev) => ({ ...prev, files: { ...(prev.files || {}), enabled: !fs.enabled } }))}
//                                                     className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 ${fs.enabled ? "bg-[var(--brand)]" : "bg-slate-200"}`}
//                                                 >
//                                                     <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fs.enabled ? "translate-x-5" : "translate-x-0"}`} />
//                                                 </button>
//                                             </div>
//                                         </div>

//                                         {fs.enabled && (
//                                             <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
//                                                 <div className="border rounded-2xl border-slate-300 shadow-sm bg-white overflow-hidden">
//                                                     <div className="p-6">
//                                                         <h4 className="font-semibold text-slate-800">Folder Permissions</h4>
//                                                         <p className="text-sm text-slate-500 mt-1">Control what folder operations this group can perform</p>
//                                                     </div>
//                                                     <div className="border-t border-slate-100 bg-slate-50/50 p-6">
//                                                         <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-5">Granular Permissions</h5>
//                                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
//                                                             {folderPerms.map((fp) => (
//                                                                 <label key={fp.key} className="flex items-start gap-3.5 cursor-pointer group">
//                                                                     <div className="mt-0.5 relative flex items-center justify-center">
//                                                                         <input
//                                                                             type="checkbox"
//                                                                             checked={!!fs[fp.key]}
//                                                                             onChange={() => setPerms((prev) => ({ ...prev, files: { ...prev.files, [fp.key]: !prev.files?.[fp.key] } }))}
//                                                                             className="peer w-5 h-5 appearance-none border-2 border-slate-300 rounded-md checked:bg-[var(--brand)] checked:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-1 transition-all cursor-pointer"
//                                                                         />
//                                                                         <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
//                                                                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                                                                         </svg>
//                                                                     </div>
//                                                                     <div className="flex-1">
//                                                                         <span className={`block text-sm font-medium transition-colors ${fs[fp.key] ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800"}`}>{fp.label}</span>
//                                                                         <span className="block text-xs text-slate-500 mt-0.5">{fp.desc}</span>
//                                                                     </div>
//                                                                 </label>
//                                                             ))}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })()}

//                             {/* ── Action Buttons ── */}
//                             <div className="flex items-center gap-3 pt-2 pb-6">
//                                 <button
//                                     type="button"
//                                     onClick={() => router.push(`/groups/${groupSlug}`)}
//                                     className="flex-1 max-w-xs bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button
//                                     onClick={handleSubmitPermissions}
//                                     disabled={saving || permsLoading}
//                                     className="flex-1 max-w-xs bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white py-3 rounded-xl font-semibold text-sm shadow-[0_8px_30px_rgba(var(--brand-rgb),0.2)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 flex justify-center items-center gap-2 cursor-pointer"
//                                 >
//                                     {saving ? (
//                                         <>
//                                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                             Saving Changes...
//                                         </>
//                                     ) : (
//                                         "Save Permissions"
//                                     )}
//                                 </button>
//                             </div>

//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
