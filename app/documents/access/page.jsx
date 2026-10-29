"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// 🔥 SUPABASE IMPORT REMOVED
import { hasPermission } from '@/lib/access/permissions';
import { FaEye, FaEdit, FaUpload, FaShieldAlt, FaDownload } from 'react-icons/fa';

export default function AccessPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>}>
            <AccessPageContent />
        </Suspense>
    );
}

function AccessPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlGroupId = searchParams.get('group') || searchParams.get('groupId');

    const [session, setSession] = useState(null);

    // Core Data
    const [groups, setGroups] = useState([]);
    const [folders, setFolders] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [permissions, setPermissions] = useState({});
    const [groupMembers, setGroupMembers] = useState({});

    // UI State
    const [loading, setLoading] = useState(true);
    const [pendingChanges, setPendingChanges] = useState({}); // 🔥 TRACKS UNSAVED TOGGLES
    const [isSubmitting, setIsSubmitting] = useState(false);  // 🔥 TRACKS SAVE BUTTON STATE
    const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
    const [saving, setSaving] = useState({});
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState({});

    const toggleDept = (deptName) => {
        setExpandedDepts(prev => ({
            ...prev,
            [deptName]: !prev[deptName]
        }));
    };

    // ── SESSION ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (!raw) { window.location.href = '/login'; return; }

        const s = JSON.parse(raw);
        const returnTo = searchParams.get('returnTo');
        const roleNorm = (s.role || '').toLowerCase().replace(/[\s-_]+/g, '');
        const isAllowed = hasPermission(s.role, 'manage_access') || ['superadmin', 'admin', 'subadmin', 'internaluser', 'user'].includes(roleNorm) || ['super_admin', 'admin', 'sub_admin', 'internal_user'].includes(s.role) || Boolean(returnTo);
        if (!isAllowed) {
            router.replace('/documents');
            return;
        }
        setSession(s);
    }, [router, searchParams]);

    // ── FETCH (NOW HITS API INSTEAD OF DB DIRECTLY) ──────────────────────────
    useEffect(() => {
        if (session) fetchAll();
    }, [session]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // 🔥 HITS THE NEW LIST API WE MADE IN THE PREVIOUS STEP
            const res = await fetch('/api/access/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setGroups(data.groups);
            setFolders(data.folders);
            setDocuments(data.documents);
            setGroupMembers(data.groupMembers);
            setPermissions(data.permissions);

            if (data.groups?.length > 0) {
                const matched = urlGroupId
                    ? data.groups.find(g => g.id === urlGroupId || (g.name && (g.name.toLowerCase() === decodeURIComponent(urlGroupId).toLowerCase() || g.name.toLowerCase() === urlGroupId.toLowerCase())))
                    : null;
                const chosenId = matched ? matched.id : data.groups[0].id;
                setSelectedGroup(chosenId);
                const chosenGroup = data.groups.find(g => g.id === chosenId);
                const dept = chosenGroup?.department || 'General';
                setExpandedDepts(prev => ({ ...prev, [dept]: true }));
                setExpandedGroups(prev => new Set(prev).add(chosenId));
            }

        } catch (err) { console.error('Fetch error:', err); }
        finally { setLoading(false); }
    }, [session, urlGroupId]);

    const getDescendantDocs = (folderId) => {
        let descendants = [];
        const findDocs = (fid) => {
            documents.filter(d => d.folder_id === fid).forEach(d => descendants.push(d));
            folders.filter(f => f.parent_folder_id === fid).forEach(f => findDocs(f.id));
        };
        findDocs(folderId);
        return descendants;
    };

    const getFolderBulkState = (groupId, folderId, field) => {
        const desc = getDescendantDocs(folderId);
        if (desc.length === 0) return 'none';
        
        const hasAll = desc.every(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);
        const hasSome = desc.some(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);
        
        if (hasAll) return 'all';
        if (hasSome) return 'some';
        return 'none';
    };

    const getBreadcrumbs = () => {
        let crumbs = [];
        let curr = currentFolderId;
        while (curr) {
            const f = folders.find(folder => folder.id === curr);
            if (f) { crumbs.unshift(f); curr = f.parent_folder_id; } else break;
        }
        return crumbs;
    };

    // ── FAST LOCAL TOGGLE (NO DB CALL YET) ──────────────────────────────────
    const togglePermission = async (groupId, targetId, type, field, overrideTarget = null) => {
        if (type === 'doc' && field === 'can_upload') {
            alert("Upload permission can only be granted to Folders."); return;
        }

        const key = `${groupId}_${type}_${targetId}`;
        const current = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false, can_redact: false, perm_id: null };

        let targetState = overrideTarget !== null ? overrideTarget : !current[field];
        let updated = { ...current, [field]: targetState };

        // CASCADE LOGIC
        if (['can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete'].includes(field) && updated[field]) updated.can_view = true;
        if (field === 'can_download_original' && updated.can_download_original) updated.can_download_secure = true;
        if (field === 'can_view' && updated.can_view && type === 'doc') updated.can_download_secure = true;
        if (field === 'can_view' && !updated.can_view) {
            updated.can_edit = false; updated.can_upload = false; updated.can_download_secure = false; updated.can_download_original = false; updated.can_delete = false;
        }

        if (JSON.stringify(current) === JSON.stringify(updated)) return;

        setPermissions(prev => ({ ...prev, [key]: updated }));
        setPendingChanges(prev => ({
            ...prev,
            [key]: { groupId, targetId, type, updatedState: updated }
        }));
    };

    // ── BATCH SAVE (NOW HITS API INSTEAD OF SUPABASE DIRECTLY) ───────────────
    const handleSaveAndReturn = async () => {
        const changes = Object.values(pendingChanges);

        if (changes.length === 0) {
            triggerRedirect();
            return;
        }

        setIsSubmitting(true);
        setSaveMessage({ text: '', type: '' });

        try {
            const groupId = changes[0].groupId;
            
            // 🔥 HITS THE NEW SAVE API WE MADE IN THE PREVIOUS STEP
            const res = await fetch('/api/access/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, changes, groupId })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setSaveMessage({ text: '✅ Saved successfully! Redirecting...', type: 'success' });
            setPendingChanges({});

            setTimeout(() => { triggerRedirect(); }, 800);

        } catch (error) {
            console.error("Save failed:", error);
            setSaveMessage({ text: `❌ Failed to save: ${error.message || 'Check connection'}`, type: 'error' });
            setIsSubmitting(false);
        }
    };

    const triggerRedirect = () => {
        const returnTo = searchParams.get('returnTo') || searchParams.get('returnUrl') || searchParams.get('from');
        if (returnTo) {
            window.location.href = returnTo;
            return;
        }

        if (selectedGroup === 'subadmin') router.push('/groups/subadmin?view=permissions');
        else if (selectedGroup) router.push(`/groups/${selectedGroup}?view=permissions`);
        else router.push('/groups');
    };

    // ── BULK TOGGLES ─────────────────────────────────────────────────────────
    const toggleFolderBulk = async (groupId, folderId, field) => {
        const descendants = getDescendantDocs(folderId);
        if (descendants.length === 0) return;
        const currentState = getFolderBulkState(groupId, folderId, field);
        const targetState = currentState !== 'all';
        await Promise.all(descendants.map(doc => togglePermission(groupId, doc.id, 'doc', field, targetState)));
    };

    const toggleAllForGroup = async (groupId, field) => {
        if (field === 'can_upload') {
            const allFoldersHaveIt = displayFolders.length > 0 && displayFolders.every(f => permissions[`${groupId}_fol_${f.id}`]?.can_upload);
            await Promise.all(displayFolders.map(f => togglePermission(groupId, f.id, 'fol', 'can_upload', !allFoldersHaveIt)));
        } else {
            const allDocsHaveIt = displayDocs.length > 0 && displayDocs.every(doc => permissions[`${groupId}_doc_${doc.id}`]?.[field] === true);
            await Promise.all(displayDocs.map(doc => togglePermission(groupId, doc.id, 'doc', field, !allDocsHaveIt)));
        }
    };

    // ── SORT HELPER ──────────────────────────────────────────────────────────
    const sortItemsByIndex = (a, b) => {
        const aIndex = Number.isFinite(+(a.index_number || a.index)) ? +(a.index_number || a.index) : 999999;
        const bIndex = Number.isFinite(+(b.index_number || b.index)) ? +(b.index_number || b.index) : 999999;
        if (aIndex !== bIndex) return aIndex - bIndex;
        if (a.type && b.type && a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
    };

    const accessIndexMap = useMemo(() => {
        const map = new Map();
        const byParent = {};
        folders.forEach(f => {
            const pId = f.parent_folder_id || 'root';
            if (!byParent[pId]) byParent[pId] = [];
            byParent[pId].push({ ...f, _type: 'folder' });
        });
        documents.forEach(d => {
            const pId = d.folder_id || 'root';
            if (!byParent[pId]) byParent[pId] = [];
            byParent[pId].push({ ...d, _type: 'doc' });
        });
        Object.values(byParent).forEach(group =>
            group.sort((a, b) => sortItemsByIndex(
                { index_number: a.index_number, index: a.index, name: a.name, type: a._type },
                { index_number: b.index_number, index: b.index, name: b.name, type: b._type }
            ))
        );

        const assignIndex = (parentId, prefix) => {
            (byParent[parentId] || []).forEach((child, idx) => {
                const displayIndex = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
                const key = child._type === 'folder' ? `folder_${child.id}` : `doc_${child.id}`;
                map.set(key, displayIndex);
                if (child._type === 'folder') assignIndex(child.id, displayIndex);
            });
        };
        assignIndex('root', '');
        return map;
    }, [folders, documents]);

    // ── RENDER ───────────────────────────────────────────────────────────────
    const activeGroup = groups.find(g => g.id === selectedGroup);
    const sortedFolders = folders.filter(f => f.parent_folder_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);
    const sortedDocs = documents.filter(d => d.folder_id === currentFolderId && d.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);

    const displayFolders = sortedFolders.map(f => ({ ...f, displayIndex: accessIndexMap.get(`folder_${f.id}`) || '—' }));
    const displayDocs = sortedDocs.map(d => ({ ...d, displayIndex: accessIndexMap.get(`doc_${d.id}`) || '—' }));

    if (loading) return <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>;

    // 🔥 YOUR UI BEGINS HERE: EXACTLY UNTOUCHED. NO CHANGES.
    return (
        <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
            <aside className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300`}>
                <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Room Groups</p>
                    <p className="text-[11px] text-slate-400 mt-1">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2">
                    {(() => {
                        const allKnownDepts = Array.from(new Set(
                            groups.map(g => g.department || 'General').filter(Boolean)
                        ));

                        if (allKnownDepts.length === 0) {
                            return (
                                <div className="px-4 py-8 text-center text-xs text-slate-400 italic">
                                    No groups found
                                </div>
                            );
                        }

                        return allKnownDepts.map(deptName => {
                            const deptGroups = groups.filter(g => (g.department || 'General').toLowerCase() === deptName.toLowerCase());
                            const isDeptExpanded = !!expandedDepts[deptName];

                            return (
                                <div key={deptName} className="mb-1.5">
                                    {/* Department Header Button */}
                                    <button
                                        type="button"
                                        onClick={() => toggleDept(deptName)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left group ${
                                            isDeptExpanded
                                                ? 'bg-slate-100/90 text-slate-900 font-bold'
                                                : 'text-slate-700 hover:bg-slate-50 font-semibold'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="text-[12.5px] truncate capitalize font-medium">{deptName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                deptGroups.length > 0 ? 'bg-brand/10 text-brand' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                {deptGroups.length}
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`text-slate-400 transition-transform duration-200 ${isDeptExpanded ? 'rotate-90 text-slate-700' : ''}`}
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Department Groups List */}
                                    {isDeptExpanded && (
                                        <div className="mt-1 ml-2 pl-2 border-l-2 border-slate-100 space-y-1 py-0.5">
                                            {deptGroups.length === 0 ? (
                                                <div className="py-2 px-3 text-xs text-slate-400 italic">No groups in this department</div>
                                            ) : (
                                                deptGroups.map(group => {
                                                    const isActive = selectedGroup === group.id;
                                                    const isGroupExpanded = expandedGroups.has(group.id);
                                                    const members = groupMembers[group.id] || [];

                                                    return (
                                                        <div key={group.id} className="mb-0.5">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedGroup(group.id);
                                                                    setExpandedGroups(prev => new Set(prev).add(group.id));
                                                                }}
                                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all ${
                                                                    isActive ? 'bg-brand text-white' : 'hover:bg-slate-50 text-slate-700'
                                                                }`}
                                                            >
                                                                <div
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedGroups(prev => {
                                                                            const n = new Set(prev);
                                                                            n.has(group.id) ? n.delete(group.id) : n.add(group.id);
                                                                            return n;
                                                                        });
                                                                    }}
                                                                    className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/20 transition-transform cursor-pointer shrink-0 ${
                                                                        isGroupExpanded ? 'rotate-180' : ''
                                                                    }`}
                                                                    title="Toggle members"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                        <polyline points="6 9 12 15 18 9" />
                                                                    </svg>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-[12px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                                                        {group.name}
                                                                    </p>
                                                                </div>
                                                                <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-md mr-1 ${
                                                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {members.length} Users
                                                                </span>
                                                            </button>

                                                            {/* Members inside Group */}
                                                            {isGroupExpanded && members.length > 0 && (
                                                                <div className="mt-1 mb-2 ml-4 pl-3 border-l-2 border-slate-100 flex flex-col gap-1">
                                                                    {members.map(user => (
                                                                        <div key={user.id} className="flex items-center gap-2 py-1">
                                                                            <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                                                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-[11.5px] font-semibold text-slate-600 truncate">{user.name || user.email}</p>
                                                                                {user.name && <p className="text-[9.5px] text-slate-400 truncate">{user.email}</p>}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {isGroupExpanded && members.length === 0 && (
                                                                <div className="mt-1 mb-2 ml-4 pl-3 border-l-2 border-slate-100 py-1 text-[11px] text-slate-400 italic">
                                                                    No members
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Toggle Groups Sidebar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M12 22a4 4 0 0 1-4-4v-4" />
                                <circle cx="12" cy="4" r="2" />
                            </svg>
                        </button>
                        {activeGroup && (
                            <>
                                <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-[12px] font-black text-white shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[14px] font-black text-slate-800">{activeGroup.name}</p>
                                    <p className="text-[11px] text-slate-400">Group Access Rules</p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative w-48">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
                    </div>
                </div>

                <div className="flex-1 overflow-auto px-7 py-5">
                    {!selectedGroup ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                            <p className="text-[13px] font-bold">Select a group to manage access</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                                <button onClick={() => setCurrentFolderId(null)} className={`text-[12px] font-bold whitespace-nowrap ${currentFolderId === null ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Root Directory</button>
                                {getBreadcrumbs().map(crumb => (
                                    <React.Fragment key={crumb.id}>
                                        <span className="text-slate-300 shrink-0">/</span>
                                        <button onClick={() => setCurrentFolderId(crumb.id)} className={`text-[12px] font-bold whitespace-nowrap ${currentFolderId === crumb.id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>{crumb.name}</button>
                                    </React.Fragment>
                                ))}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px] border-collapse text-left">
                                    <thead>
                                        <tr className="bg-slate-100/50 border-b border-slate-200">
                                            <th colSpan="2" className="py-2.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Apply to All Below →</th>
                                            {['can_view', 'can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete', 'can_redact'].map(field => {
                                                const isAllChecked = field === 'can_upload'
                                                    ? (displayFolders.length > 0 && displayFolders.every(f => permissions[`${selectedGroup}_fol_${f.id}`]?.can_upload))
                                                    : (displayDocs.length > 0 && displayDocs.every(d => permissions[`${selectedGroup}_doc_${d.id}`]?.[field]));

                                                return (
                                                    <th key={`bulk_${field}`} className="py-2.5 px-3 text-center">
                                                        <button onClick={() => toggleAllForGroup(selectedGroup, field)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors border ${isAllChecked ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                                            {isAllChecked ? 'Uncheck All' : 'Check All'}
                                                        </button>
                                                    </th>
                                                );
                                            })}
                                        </tr>

                                        <tr className="border-b border-slate-100 bg-slate-50/60">
                                            <th className="py-3.5 px-4 w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
                                            <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <FaEye className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        View
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <FaEdit className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        Edit
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <FaUpload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        Upload
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <FaShieldAlt className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        DL Secure
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <FaDownload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        DL Original
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors">
                                                        <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" />
                                                    </svg>
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        Delete
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3.5 px-3 w-24 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
                                                        Redaction
                                                        <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">

                                        {displayFolders.map(folder => {
                                            const toggles = [
                                                { field: 'can_view', color: 'bg-brand' }, { field: 'can_edit', color: 'bg-brand' },
                                                { field: 'can_upload', color: 'bg-brand' }, { field: 'can_download_secure', color: 'bg-brand' },
                                                { field: 'can_download_original', color: 'bg-brand' },
                                                { field: 'can_delete', color: 'bg-brand' },
                                                { field: 'can_redact', color: 'bg-brand' },
                                            ];

                                            return (
                                                <tr key={folder.id} className="group hover:bg-slate-50/60 transition-all duration-150 cursor-pointer" onDoubleClick={() => setCurrentFolderId(folder.id)}>
                                                    <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{folder.displayIndex}</td>
                                                    <td className="py-3.5 px-3" onClick={() => setCurrentFolderId(folder.id)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 border border-amber-100 text-amber-500">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                                                            </div>
                                                            <div><p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px] group-hover:underline decoration-slate-300 underline-offset-2">{folder.name}</p></div>
                                                        </div>
                                                    </td>

                                                    {toggles.map(({ field, color }) => {
                                                        if (field === 'can_upload') {
                                                            const isActive = permissions[`${selectedGroup}_fol_${folder.id}`]?.can_upload;
                                                            const isSaving = saving[`${selectedGroup}_fol_${folder.id}_can_upload`];
                                                            return (
                                                                <td key={field} className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={() => togglePermission(selectedGroup, folder.id, 'fol', 'can_upload')} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${isActive ? color : 'bg-slate-200'}`}>
                                                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                                    </button>
                                                                </td>
                                                            );
                                                        } else {
                                                            const state = getFolderBulkState(selectedGroup, folder.id, field);
                                                            return (
                                                                <td key={field} className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                                    <button onClick={() => toggleFolderBulk(selectedGroup, folder.id, field)} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${state === 'all' ? color : state === 'some' ? 'bg-slate-400' : 'bg-slate-200'}`} title={state === 'some' ? 'Partial Access' : ''}>
                                                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${state === 'all' ? 'left-0.5 translate-x-5' : state === 'some' ? 'left-[12px]' : 'left-0.5 translate-x-0'}`} />
                                                                    </button>
                                                                </td>
                                                            );
                                                        }
                                                    })}
                                                </tr>
                                            );
                                        })}

                                        {displayDocs.map((doc) => {
                                            const key = `${selectedGroup}_doc_${doc.id}`;
                                            const perm = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false };
                                            const ext = doc.name.split('.').pop().toLowerCase();
                                            const iconClass = { pdf: 'bg-rose-50 border-rose-100 text-rose-600', xlsx: 'bg-emerald-50 border-emerald-100 text-emerald-600', docx: 'bg-indigo-50 border-indigo-100 text-indigo-600' }[ext] || 'bg-slate-50 border-slate-200 text-slate-400';

                                            return (
                                                <tr key={doc.id} className="group hover:bg-slate-50/60 transition-all duration-150">
                                                    <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{doc.displayIndex}</td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border ${iconClass}`}>
                                                                {ext.toUpperCase().slice(0, 3)}
                                                            </div>
                                                            <p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px]">{doc.name}</p>
                                                        </div>
                                                    </td>

                                                    {[{ field: 'can_view', color: 'bg-brand' }, { field: 'can_edit', color: 'bg-brand' }, { field: 'can_upload', color: 'bg-brand' }, { field: 'can_download_secure', color: 'bg-brand' }, { field: 'can_download_original', color: 'bg-brand' }, { field: 'can_delete', color: 'bg-brand' }, { field: 'can_redact', color: 'bg-brand' }].map(({ field, color }) => {
                                                        if (field === 'can_upload') {
                                                            return (
                                                                <td key={field} className="py-3.5 px-3 text-center">
                                                                    <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', 'can_upload')} className="relative w-11 h-6 rounded-full bg-slate-100 cursor-not-allowed mx-auto block opacity-60" title="Upload is only for folders">
                                                                        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                                                                    </button>
                                                                </td>
                                                            );
                                                        }

                                                        const isActive = perm[field];
                                                        const isSaving = saving[`${key}_${field}`];
                                                        return (
                                                            <td key={field} className="py-3.5 px-3 text-center">
                                                                <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', field)} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${isActive ? color : 'bg-slate-200'} ${isSaving ? 'opacity-50' : ''}`}>
                                                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* RETURN/SUBMIT BUTTON & INLINE MESSAGES */}
                <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-3">
                    {saveMessage.text && (
                        <div className={`px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-lg flex items-center gap-2 animate-fade-in-up ${saveMessage.type === 'success'
                            ? 'bg-emerald-500 text-white border border-emerald-600'
                            : 'bg-red-500 text-white border border-red-600'
                            }`}>
                            {saveMessage.text}
                        </div>
                    )}

                    <button
                        onClick={handleSaveAndReturn}
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg transition-all active:scale-95 ${Object.keys(pendingChanges).length > 0
                            ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                            : 'bg-brand hover:bg-brand-dark text-white'
                            } ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        <span>{isSubmitting ? 'Saving Changes...' : (Object.keys(pendingChanges).length > 0 ? 'Save & Return' : 'Return (No Changes)')}</span>
                        {!isSubmitting && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}










// "use client";

// import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { supabase } from '@/utils/supabase/client';
// import { hasPermission } from '@/lib/access/permissions';
// import { FaEye, FaEdit, FaUpload, FaShieldAlt, FaDownload } from 'react-icons/fa';

// export default function AccessPage() {
//     return (
//         <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>}>
//             <AccessPageContent />
//         </Suspense>
//     );
// }

// function AccessPageContent() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const urlGroupId = searchParams.get('group') || searchParams.get('groupId');

//     const [session, setSession] = useState(null);

//     // Core Data
//     const [groups, setGroups] = useState([]);
//     const [folders, setFolders] = useState([]);
//     const [documents, setDocuments] = useState([]);
//     const [permissions, setPermissions] = useState({});
//     const [groupMembers, setGroupMembers] = useState({});

//     // UI State
//     const [loading, setLoading] = useState(true);
//     const [pendingChanges, setPendingChanges] = useState({}); // 🔥 TRACKS UNSAVED TOGGLES
//     const [isSubmitting, setIsSubmitting] = useState(false);  // 🔥 TRACKS SAVE BUTTON STATE
//     const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
//     const [saving, setSaving] = useState({});
//     const [selectedGroup, setSelectedGroup] = useState(null);
//     const [expandedGroups, setExpandedGroups] = useState(new Set());
//     const [searchQuery, setSearchQuery] = useState('');
//     const [currentFolderId, setCurrentFolderId] = useState(null);
//     const [sidebarOpen, setSidebarOpen] = useState(false);



//     // ── SESSION ──────────────────────────────────────────────────────────────
//     useEffect(() => {
//         const raw = localStorage.getItem('vdr_session');
//         if (!raw) { window.location.href = '/login'; return; }

//         const s = JSON.parse(raw);
//         if (!hasPermission(s.role, 'manage_access')) {
//             router.replace('/documents');
//             return;
//         }
//         setSession(s);
//     }, [router]);

//     // ── FETCH ────────────────────────────────────────────────────────────────
//     useEffect(() => {
//         if (session) fetchAll();
//     }, [session]);

//     // const fetchAll = useCallback(async () => {
//     //     setLoading(true);
//     //     try {
//     //         let groupQuery = supabase.from('groups').select('*').eq('company_id', session.company_id).order('created_at', { ascending: false });
//     //         if (session.role !== 'super_admin') groupQuery = groupQuery.eq('created_by', session.id);

//     //         const [
//     //             { data: groupsData },
//     //             { data: foldersData },
//     //             { data: docsData },
//     //             { data: permsData },
//     //             { data: userGroups },
//     //             { data: usersData }
//     //         ] = await Promise.all([
//     //             groupQuery,
//     //             supabase.from('folders').select('*').eq('company_id', session.company_id),
//     //             supabase.from('documents').select('id, name, folder_id, index').eq('company_id', session.company_id).eq('is_deleted', false).order('created_at', { ascending: true }),
//     //             // Fetching exactly the columns we know exist in your DB now
//     //             supabase.from('permissions').select('id, document_id, folder_id, scope, group_id, can_view, can_edit, can_upload, can_download_secure, can_download_original, can_delete').eq('company_id', session.company_id),
//     //             supabase.from('user_groups').select('user_id, group_id'),
//     //             supabase.from('users').select('id, name, email')
//     //         ]);

//     //         setGroups(groupsData || []);
//     //         setFolders(foldersData || []);

//     //         const cleanedDocs = (docsData || []).map((doc, index) => ({
//     //             ...doc, displayIndex: (index + 1).toString()
//     //         }));
//     //         setDocuments(cleanedDocs);

//     //         const membersMap = {};
//     //         if (userGroups && usersData) {
//     //             const userDict = {};
//     //             usersData.forEach(u => userDict[u.id] = u);
//     //             userGroups.forEach(ug => {
//     //                 if (!membersMap[ug.group_id]) membersMap[ug.group_id] = [];
//     //                 if (userDict[ug.user_id]) membersMap[ug.group_id].push(userDict[ug.user_id]);
//     //             });
//     //         }
//     //         setGroupMembers(membersMap);

//     //         const map = {};
//     //         (permsData || []).forEach(p => {
//     //             if (p.scope === 'document' && p.document_id) {
//     //                 map[`${p.group_id}_doc_${p.document_id}`] = p;
//     //             } else if (p.scope === 'folder' && p.folder_id) {
//     //                 map[`${p.group_id}_fol_${p.folder_id}`] = p;
//     //             }
//     //         });
//     //         setPermissions(map);

//     //         if (groupsData?.length > 0) {
//     //             setSelectedGroup(urlGroupId || groupsData[0].id);
//     //         }
//     //     } catch (err) { console.error('Fetch error:', err); }
//     //     finally { setLoading(false); }
//     // }, [session, urlGroupId]);

//     // ── HIERARCHY HELPERS ────────────────────────────────────────────────────


//     const fetchAll = useCallback(async () => {
//         setLoading(true);
//         try {
//             let groupQuery = supabase.from('groups').select('*').eq('company_id', session.company_id).order('created_at', { ascending: false });
//             if (session.role !== 'super_admin') groupQuery = groupQuery.eq('created_by', session.id);

//             const [
//                 { data: groupsData },
//                 { data: foldersData },
//                 { data: docsData },
//                 { data: permsData },
//                 { data: userGroups },
//                 { data: usersData }
//             ] = await Promise.all([
//                 groupQuery,

//                 // supabase.from('folders').select('*').eq('company_id', session.company_id),
//                 // supabase.from('documents').select('id, name, folder_id, index, uploaded_by, creator_revoked').eq('company_id', session.company_id).eq('is_deleted', false).order('created_at', { ascending: true }),
//                 supabase.from('folders').select('*').eq('company_id', session.company_id).eq('is_deleted', false),
//                 supabase.from('documents').select('id, name, folder_id, index, uploaded_by, creator_revoked').eq('company_id', session.company_id).eq('is_deleted', false).order('created_at', { ascending: true }),
//                 supabase.from('permissions').select('id, document_id, folder_id, scope, group_id, can_view, can_edit, can_upload, can_download_secure, can_download_original, can_delete, can_redact').eq('company_id', session.company_id),
//                 supabase.from('user_groups').select('user_id, group_id'),
//                 supabase.from('users').select('id, name, email')
//             ]);

//             setGroups(groupsData || []);

//             // 🔥 DELEGATION RULE: Calculate My Access First 🔥
//             let myGroupIds = [];
//             if (session.role !== 'super_admin' && userGroups) {
//                 myGroupIds = userGroups.filter(ug => ug.user_id === session.id).map(ug => ug.group_id);
//             }

//             const myPerms = {};
//             if (session.role !== 'super_admin' && permsData) {
//                 permsData.forEach(p => {
//                     if (myGroupIds.includes(p.group_id)) {
//                         if (p.scope === 'document' && p.document_id) myPerms[`doc_${p.document_id}`] = p;
//                         if (p.scope === 'folder' && p.folder_id) myPerms[`fol_${p.folder_id}`] = p;
//                     }
//                 });
//             }

//             // FILTER FOLDERS (Only show what I have access to)
//             const allowedFolders = (foldersData || []).filter(f => {
//                 if (session.role === 'super_admin') return true;
//                 if (f.created_by === session.id && f.creator_revoked !== true) return true; // I am the creator
//                 return myPerms[`fol_${f.id}`]?.can_view === true; // Or I was granted access
//             });
//             setFolders(allowedFolders);

//             // FILTER DOCS (Only show what I have access to)
//             const allowedDocs = (docsData || []).filter(doc => {
//                 if (session.role === 'super_admin') return true;
//                 if (doc.uploaded_by === session.id && doc.creator_revoked !== true) return true;
//                 if (myPerms[`doc_${doc.id}`]?.can_view === true) return true;
//                 if (doc.folder_id && myPerms[`fol_${doc.folder_id}`]?.can_view === true) return true;
//                 return false;
//             });

//             setDocuments(allowedDocs.map((doc, idx) => ({ ...doc, displayIndex: (idx + 1).toString() })));

//             // (Keep rest of existing fetch mapping for members and permissions map)
//             const membersMap = {};
//             if (userGroups && usersData) {
//                 const userDict = {};
//                 usersData.forEach(u => userDict[u.id] = u);
//                 userGroups.forEach(ug => {
//                     if (!membersMap[ug.group_id]) membersMap[ug.group_id] = [];
//                     if (userDict[ug.user_id]) membersMap[ug.group_id].push(userDict[ug.user_id]);
//                 });
//             }
//             setGroupMembers(membersMap);

//             const map = {};
//             (permsData || []).forEach(p => {
//                 if (p.scope === 'document' && p.document_id) map[`${p.group_id}_doc_${p.document_id}`] = p;
//                 else if (p.scope === 'folder' && p.folder_id) map[`${p.group_id}_fol_${p.folder_id}`] = p;
//             });
//             setPermissions(map);

//             if (groupsData?.length > 0) setSelectedGroup(urlGroupId || groupsData[0].id);

//         } catch (err) { console.error('Fetch error:', err); }
//         finally { setLoading(false); }
//     }, [session, urlGroupId]);



//     const getDescendantDocs = (folderId) => {
//         let descendants = [];
//         const findDocs = (fid) => {
//             documents.filter(d => d.folder_id === fid).forEach(d => descendants.push(d));
//             folders.filter(f => f.parent_folder_id === fid).forEach(f => findDocs(f.id));
//         };
//         findDocs(folderId);
//         return descendants;
//     };

//     const getFolderBulkState = (groupId, folderId, field) => {
//         const desc = getDescendantDocs(folderId);
//         if (desc.length === 0) return 'none';
        
//         const hasAll = desc.every(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);
//         const hasSome = desc.some(d => permissions[`${groupId}_doc_${d.id}`]?.[field]);
        
//         if (hasAll) return 'all';
//         if (hasSome) return 'some';
//         return 'none';
//     };

//     const getBreadcrumbs = () => {
//         let crumbs = [];
//         let curr = currentFolderId;
//         while (curr) {
//             const f = folders.find(folder => folder.id === curr);
//             if (f) { crumbs.unshift(f); curr = f.parent_folder_id; } else break;
//         }
//         return crumbs;
//     };

//     // ── CORE BULLETPROOF DB TOGGLE ───────────────────────────────────────────
//     // const togglePermission = async (groupId, targetId, type, field, overrideTarget = null) => {

//     //     if (type === 'doc' && field === 'can_upload') {
//     //         alert("Upload permission can only be granted to Folders.");
//     //         return;
//     //     }

//     //     const key = `${groupId}_${type}_${targetId}`;
//     //     const saveKey = `${key}_${field}`;
//     //     const current = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false, perm_id: null };

//     //     let targetState = overrideTarget !== null ? overrideTarget : !current[field];
//     //     let updated = { ...current, [field]: targetState };

//     //     // CASCADE LOGIC
//     //     if (['can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete'].includes(field) && updated[field]) updated.can_view = true;
//     //     if (field === 'can_download_original' && updated.can_download_original) updated.can_download_secure = true;
//     //     if (field === 'can_view' && updated.can_view && type === 'doc') updated.can_download_secure = true;
//     //     if (field === 'can_view' && !updated.can_view) {
//     //         updated.can_edit = false; updated.can_upload = false; updated.can_download_secure = false; updated.can_download_original = false;
//     //     }

//     //     if (JSON.stringify(current) === JSON.stringify(updated)) return;

//     //     // Optimistic UI
//     //     setPermissions(prev => ({ ...prev, [key]: updated }));
//     //     setSaving(prev => ({ ...prev, [saveKey]: true }));

//     //     // 🚨 STRICT DB WRITING LOGIC 🚨
//     //     try {
//     //         const allFalse = !updated.can_view && !updated.can_edit && !updated.can_upload && !updated.can_download_secure && !updated.can_download_original && !updated.can_delete;

//     //         // This payload exactly matches the columns in your database
//     //         const dbPayload = {
//     //             can_view: updated.can_view,
//     //             can_edit: updated.can_edit,
//     //             can_upload: updated.can_upload,
//     //             can_download_secure: updated.can_download_secure,
//     //             can_download_original: updated.can_download_original,
//     //             can_delete: updated.can_delete,
//     //             updated_at: new Date().toISOString()
//     //         };

//     //         if (current.id || current.perm_id) {
//     //             const rowId = current.id || current.perm_id;

//     //             if (allFalse) {
//     //                 const { error } = await supabase.from('permissions').delete().eq('id', rowId);
//     //                 if (error) throw error;
//     //                 updated.perm_id = null;
//     //             } else {
//     //                 const { error } = await supabase.from('permissions').update(dbPayload).eq('id', rowId);
//     //                 if (error) throw error;
//     //             }
//     //         } else if (!allFalse) {
//     //             const insertPayload = {
//     //                 company_id: session.company_id,
//     //                 group_id: groupId,
//     //                 scope: type === 'doc' ? 'document' : 'folder',
//     //                 document_id: type === 'doc' ? targetId : null,
//     //                 folder_id: type === 'fol' ? targetId : null,
//     //                 ...dbPayload
//     //             };

//     //             const { data, error } = await supabase.from('permissions').insert(insertPayload).select('id').single();
//     //             if (error) throw error;
//     //             updated.perm_id = data.id;
//     //         }

//     //         setPermissions(prev => ({ ...prev, [key]: updated }));

//     //     } catch (err) {
//     //         console.error('DATABASE WRITE FAILED:', err);
//     //         // 🔥 POPUP ALERT IF DATABASE FAILS 🔥
//     //         alert("Database Save Error: " + (err.message || JSON.stringify(err)));
//     //         setPermissions(prev => ({ ...prev, [key]: current }));
//     //     } finally {
//     //         setSaving(prev => { const n = { ...prev }; delete n[saveKey]; return n; });
//     //     }
//     // };


//     // ── FAST LOCAL TOGGLE (NO DB CALL YET) ──────────────────────────────────
//     const togglePermission = async (groupId, targetId, type, field, overrideTarget = null) => {
//         if (type === 'doc' && field === 'can_upload') {
//             alert("Upload permission can only be granted to Folders."); return;
//         }

//         const key = `${groupId}_${type}_${targetId}`;
//         const current = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false, can_redact: false, perm_id: null };

//         let targetState = overrideTarget !== null ? overrideTarget : !current[field];
//         let updated = { ...current, [field]: targetState };

//         // CASCADE LOGIC (If they can edit, they must be able to view, etc.)
//         if (['can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete'].includes(field) && updated[field]) updated.can_view = true;
//         if (field === 'can_download_original' && updated.can_download_original) updated.can_download_secure = true;
//         if (field === 'can_view' && updated.can_view && type === 'doc') updated.can_download_secure = true;
//         if (field === 'can_view' && !updated.can_view) {
//             updated.can_edit = false; updated.can_upload = false; updated.can_download_secure = false; updated.can_download_original = false; updated.can_delete = false;
//         }

//         if (JSON.stringify(current) === JSON.stringify(updated)) return;

//         // 1. Update the UI instantly
//         setPermissions(prev => ({ ...prev, [key]: updated }));

//         // 2. Queue the final "Net Change" for the Submit button
//         setPendingChanges(prev => ({
//             ...prev,
//             [key]: { groupId, targetId, type, updatedState: updated }
//         }));
//     };

//     // ── BATCH SAVE & RETURN (EXPLICIT DENY - NO DELETION) ────────────────────
//     const handleSaveAndReturn = async () => {
//         const changes = Object.values(pendingChanges);

//         if (changes.length === 0) {
//             triggerRedirect();
//             return;
//         }

//         setIsSubmitting(true);
//         setSaveMessage({ text: '', type: '' }); // Clear old messages

//         try {
//             const groupId = changes[0].groupId;
            
//             let toUpsert = [];
//             if (changes.length > 0) {
//                 // 1. FETCH EXISTING PERMS
//                 const { data: existingPerms, error: fetchErr } = await supabase
//                     .from('permissions')
//                     .select('id, scope, document_id, folder_id')
//                     .eq('company_id', session.company_id)
//                     .eq('group_id', groupId);

//                 if (fetchErr) throw fetchErr;

//                 // 2. BUILD UPSERT ARRAY (Everything gets explicitly updated)
//                 for (const change of changes) {
//                     const { targetId, type, updatedState } = change;

//                     const existing = (existingPerms || []).find(p =>
//                         p.scope === (type === 'doc' ? 'document' : 'folder') &&
//                         (type === 'doc' ? p.document_id === targetId : p.folder_id === targetId)
//                     );

//                     // Create the payload with explicitly true/false values
//                     const payload = {
//                         company_id: session.company_id,
//                         group_id: groupId,
//                         scope: type === 'doc' ? 'document' : 'folder',
//                         document_id: type === 'doc' ? targetId : null,
//                         folder_id: type === 'fol' ? targetId : null,
//                         can_view: updatedState.can_view,
//                         can_edit: updatedState.can_edit,
//                         can_upload: updatedState.can_upload,
//                         can_download_secure: updatedState.can_download_secure,
//                         can_download_original: updatedState.can_download_original,
//                         can_delete: updatedState.can_delete,
//                         can_redact: updatedState.can_redact,
//                         updated_at: new Date().toISOString()
//                     };

//                     if (existing) payload.id = existing.id; // Update exact row
//                     toUpsert.push(payload);
//                 }
//             }

//             // 3. EXECUTE MASS UPSERT
//             if (toUpsert.length > 0) {
//                 const { error: upsertErr } = await supabase.from('permissions').upsert(toUpsert);
//                 if (upsertErr) throw upsertErr;
//             }

//             // 4. SHOW INLINE SUCCESS & REDIRECT
//             setSaveMessage({ text: '✅ Saved successfully! Redirecting...', type: 'success' });
//             setPendingChanges({});

//             // Wait 800ms so the user can read the green text before screen changes
//             setTimeout(() => {
//                 triggerRedirect();
//             }, 800);

//         } catch (error) {
//             console.error("Save failed:", error);
//             setSaveMessage({ text: `❌ Failed to save: ${error.message || 'Check connection'}`, type: 'error' });
//             setIsSubmitting(false);
//         }
//     };
//     const triggerRedirect = () => {
//         if (selectedGroup === 'subadmin') router.push('/groups/subadmin?view=permissions');
//         else if (selectedGroup) router.push(`/groups/${selectedGroup}?view=permissions`);
//         else router.push('/groups');
//     };


//     // ── BULK TOGGLES ─────────────────────────────────────────────────────────
//     const toggleFolderBulk = async (groupId, folderId, field) => {
//         const descendants = getDescendantDocs(folderId);
//         if (descendants.length === 0) return;
//         const currentState = getFolderBulkState(groupId, folderId, field);
//         const targetState = currentState !== 'all';
//         await Promise.all(descendants.map(doc => togglePermission(groupId, doc.id, 'doc', field, targetState)));
//     };

//     const toggleAllForGroup = async (groupId, field) => {
//         if (field === 'can_upload') {
//             const allFoldersHaveIt = displayFolders.length > 0 && displayFolders.every(f => permissions[`${groupId}_fol_${f.id}`]?.can_upload);
//             await Promise.all(displayFolders.map(f => togglePermission(groupId, f.id, 'fol', 'can_upload', !allFoldersHaveIt)));
//         } else {
//             const allDocsHaveIt = displayDocs.length > 0 && displayDocs.every(doc => permissions[`${groupId}_doc_${doc.id}`]?.[field] === true);
//             await Promise.all(displayDocs.map(doc => togglePermission(groupId, doc.id, 'doc', field, !allDocsHaveIt)));
//         }
//     };

//     // ── SORT HELPER ──────────────────────────────────────────────────────────
//     const sortItemsByIndex = (a, b) => {
//         const aIndex = Number.isFinite(+(a.index_number || a.index)) ? +(a.index_number || a.index) : 999999;
//         const bIndex = Number.isFinite(+(b.index_number || b.index)) ? +(b.index_number || b.index) : 999999;
//         if (aIndex !== bIndex) return aIndex - bIndex;
//         if (a.type && b.type && a.type !== b.type) return a.type === 'folder' ? -1 : 1;
//         return a.name.localeCompare(b.name);
//     };

//     // ── STABLE INDEX MAP ─────────────────────────────────────────────────────
//     // Sequential 1,2,3 for root items; 1.1,1.2 for files inside folders.
//     const accessIndexMap = useMemo(() => {
//         const map = new Map();
//         const byParent = {};
//         folders.forEach(f => {
//             const pId = f.parent_folder_id || 'root';
//             if (!byParent[pId]) byParent[pId] = [];
//             byParent[pId].push({ ...f, _type: 'folder' });
//         });
//         documents.forEach(d => {
//             const pId = d.folder_id || 'root';
//             if (!byParent[pId]) byParent[pId] = [];
//             byParent[pId].push({ ...d, _type: 'doc' });
//         });
//         Object.values(byParent).forEach(group =>
//             group.sort((a, b) => sortItemsByIndex(
//                 { index_number: a.index_number, index: a.index, name: a.name, type: a._type },
//                 { index_number: b.index_number, index: b.index, name: b.name, type: b._type }
//             ))
//         );

//         const assignIndex = (parentId, prefix) => {
//             (byParent[parentId] || []).forEach((child, idx) => {
//                 const displayIndex = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
//                 const key = child._type === 'folder' ? `folder_${child.id}` : `doc_${child.id}`;
//                 map.set(key, displayIndex);
//                 if (child._type === 'folder') assignIndex(child.id, displayIndex);
//             });
//         };
//         assignIndex('root', '');
//         return map;
//     }, [folders, documents]);

//     // ── RENDER ───────────────────────────────────────────────────────────────
//     const activeGroup = groups.find(g => g.id === selectedGroup);
//     const sortedFolders = folders.filter(f => f.parent_folder_id === currentFolderId && f.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);
//     const sortedDocs = documents.filter(d => d.folder_id === currentFolderId && d.name.toLowerCase().includes(searchQuery.toLowerCase())).sort(sortItemsByIndex);

//     const displayFolders = sortedFolders.map(f => ({ ...f, displayIndex: accessIndexMap.get(`folder_${f.id}`) || '—' }));
//     const displayDocs = sortedDocs.map(d => ({ ...d, displayIndex: accessIndexMap.get(`doc_${d.id}`) || '—' }));

//     if (loading) return <div className="flex items-center justify-center w-full h-full bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand rounded-full animate-spin" /></div>;

//     return (
//         <div className="relative flex w-full h-full bg-[#F8F9FB] overflow-hidden text-slate-800 font-sans">
//             <aside className={`${sidebarOpen ? 'w-[280px]' : 'w-0'} shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300`}>
//                 <div className="px-5 pt-5 pb-3 border-b border-slate-100">
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Room Groups</p>
//                     <p className="text-[11px] text-slate-400 mt-1">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
//                 </div>

//                 <div className="flex-1 overflow-y-auto py-2 px-2">
//                     {groups.map(group => {
//                         const isActive = selectedGroup === group.id;
//                         const isExpanded = expandedGroups.has(group.id);
//                         const members = groupMembers[group.id] || [];

//                         return (
//                             <div key={group.id} className="mb-0.5">
//                                 <button
//                                     onClick={() => setSelectedGroup(group.id)}
//                                     className={`w-full flex items-center gap-2 px-2 py-3 rounded-xl text-left transition-all ${isActive ? 'bg-brand text-white' : 'hover:bg-slate-50 text-slate-700'}`}
//                                 >
//                                     <div
//                                         onClick={(e) => { e.stopPropagation(); setExpandedGroups(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n; }); }}
//                                         className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/20 transition-transform cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
//                                     </div>
//                                     <div className="min-w-0 flex-1">
//                                         <p className={`text-[12.5px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{group.name}</p>
//                                     </div>
//                                     <span className={`text-[10px] font-black shrink-0 px-2 py-1 rounded-md mr-1 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
//                                         {members.length} Users
//                                     </span>
//                                 </button>

//                                 {isExpanded && members.length > 0 && (
//                                     <div className="mt-1 mb-2 ml-4 pl-4 border-l-2 border-slate-100 flex flex-col gap-1">
//                                         {members.map(user => (
//                                             <div key={user.id} className="flex items-center gap-2 py-1">
//                                                 <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center text-[9px] font-bold shrink-0">
//                                                     {user.name?.charAt(0).toUpperCase() || 'U'}
//                                                 </div>
//                                                 <div className="min-w-0 flex-1">
//                                                     <p className="text-[11.5px] font-semibold text-slate-600 truncate">{user.name}</p>
//                                                     <p className="text-[9.5px] text-slate-400 truncate">{user.email}</p>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             </aside>

//             <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
//                 <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-200 bg-white">
//                     <div className="flex items-center gap-3">
//                         <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Toggle Groups Sidebar">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                                 <path d="M12 2v20M12 22a4 4 0 0 1-4-4v-4" /> {/* Hook shape */}
//                                 <circle cx="12" cy="4" r="2" />
//                             </svg>
//                         </button>
//                         {activeGroup && (
//                             <>
//                                 <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-[12px] font-black text-white shrink-0">
//                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
//                                 </div>
//                                 <div>
//                                     <p className="text-[14px] font-black text-slate-800">{activeGroup.name}</p>
//                                     <p className="text-[11px] text-slate-400">Group Access Rules</p>
//                                 </div>
//                             </>
//                         )}
//                     </div>
//                     <div className="relative w-48">
//                         <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//                         <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all" />
//                     </div>
//                 </div>

//                 <div className="flex-1 overflow-auto px-7 py-5">
//                     {!selectedGroup ? (
//                         <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
//                             <p className="text-[13px] font-bold">Select a group to manage access</p>
//                         </div>
//                     ) : (
//                         <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
//                             <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
//                                 <button onClick={() => setCurrentFolderId(null)} className={`text-[12px] font-bold whitespace-nowrap ${currentFolderId === null ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Root Directory</button>
//                                 {getBreadcrumbs().map(crumb => (
//                                     <React.Fragment key={crumb.id}>
//                                         <span className="text-slate-300 shrink-0">/</span>
//                                         <button onClick={() => setCurrentFolderId(crumb.id)} className={`text-[12px] font-bold whitespace-nowrap ${currentFolderId === crumb.id ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>{crumb.name}</button>
//                                     </React.Fragment>
//                                 ))}
//                             </div>

//                             <div className="overflow-x-auto">
//                                 <table className="w-full min-w-[750px] border-collapse text-left">
//                                     <thead>
//                                         <tr className="bg-slate-100/50 border-b border-slate-200">
//                                             <th colSpan="2" className="py-2.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Apply to All Below →</th>
//                                             {['can_view', 'can_edit', 'can_upload', 'can_download_secure', 'can_download_original', 'can_delete', 'can_redact'].map(field => {
//                                                 const isAllChecked = field === 'can_upload'
//                                                     ? (displayFolders.length > 0 && displayFolders.every(f => permissions[`${selectedGroup}_fol_${f.id}`]?.can_upload))
//                                                     : (displayDocs.length > 0 && displayDocs.every(d => permissions[`${selectedGroup}_doc_${d.id}`]?.[field]));

//                                                 return (
//                                                     <th key={`bulk_${field}`} className="py-2.5 px-3 text-center">
//                                                         <button onClick={() => toggleAllForGroup(selectedGroup, field)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors border ${isAllChecked ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
//                                                             {isAllChecked ? 'Uncheck All' : 'Check All'}
//                                                         </button>
//                                                     </th>
//                                                 );
//                                             })}
//                                         </tr>

//                                         <tr className="border-b border-slate-100 bg-slate-50/60">
//                                             <th className="py-3.5 px-4 w-16 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Index</th>
//                                             <th className="py-3.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <FaEye className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         View
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <FaEdit className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         Edit
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <FaUpload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         Upload
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <FaShieldAlt className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         DL Secure
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <FaDownload className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors" />
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         DL Original
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <svg
//                                                         xmlns="http://www.w3.org/2000/svg"
//                                                         width="16"
//                                                         height="16"
//                                                         viewBox="0 0 24 24"
//                                                         fill="none"
//                                                         stroke="currentColor"
//                                                         strokeWidth="2"
//                                                         className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors"
//                                                     >
//                                                         <path d="M3 6h18" />
//                                                         <path d="M8 6V4h8v2" />
//                                                         <path d="M19 6l-1 14H6L5 6" />
//                                                     </svg>

//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         Delete
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                             <th className="py-3.5 px-3 w-24 text-center">
//                                                 <div className="inline-block relative group cursor-pointer">
//                                                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-500 text-[16px] group-hover:text-slate-900 transition-colors"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
//                                                     <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] rounded py-1 px-2 pointer-events-none top-1/2 right-full -translate-y-1/2 mr-1.5 whitespace-nowrap z-50 shadow-sm font-medium tracking-wide">
//                                                         Redaction
//                                                         <div className="absolute top-1/2 left-full -translate-y-1/2 border-[3px] border-transparent border-l-slate-800"></div>
//                                                     </div>
//                                                 </div>
//                                             </th>
//                                         </tr>
//                                     </thead>
//                                     <tbody className="divide-y divide-slate-50">

//                                         {displayFolders.map(folder => {
//                                             const toggles = [
//                                                 { field: 'can_view', color: 'bg-brand' }, { field: 'can_edit', color: 'bg-brand-dark' },
//                                                 { field: 'can_upload', color: 'bg-purple-600' }, { field: 'can_download_secure', color: 'bg-emerald-600' },
//                                                 { field: 'can_download_original', color: 'bg-orange-500' },
//                                                 { field: 'can_delete', color: 'bg-red-600' },
//                                                 { field: 'can_redact', color: 'bg-slate-800' },
//                                             ];

//                                             return (
//                                                 <tr key={folder.id} className="group hover:bg-slate-50/60 transition-all duration-150 cursor-pointer" onDoubleClick={() => setCurrentFolderId(folder.id)}>
//                                                     <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{folder.displayIndex}</td>
//                                                     <td className="py-3.5 px-3" onClick={() => setCurrentFolderId(folder.id)}>
//                                                         <div className="flex items-center gap-3">
//                                                             <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 border border-amber-100 text-amber-500">
//                                                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
//                                                             </div>
//                                                             <div><p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px] group-hover:underline decoration-slate-300 underline-offset-2">{folder.name}</p></div>
//                                                         </div>
//                                                     </td>

//                                                     {toggles.map(({ field, color }) => {
//                                                         if (field === 'can_upload') {
//                                                             const isActive = permissions[`${selectedGroup}_fol_${folder.id}`]?.can_upload;
//                                                             const isSaving = saving[`${selectedGroup}_fol_${folder.id}_can_upload`];
//                                                             return (
//                                                                 <td key={field} className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
//                                                                     <button onClick={() => togglePermission(selectedGroup, folder.id, 'fol', 'can_upload')} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${isActive ? color : 'bg-slate-200'}`}>
//                                                                         <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
//                                                                     </button>
//                                                                 </td>
//                                                             );
//                                                         } else {
//                                                             const state = getFolderBulkState(selectedGroup, folder.id, field);
//                                                             return (
//                                                                 <td key={field} className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
//                                                                     <button onClick={() => toggleFolderBulk(selectedGroup, folder.id, field)} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${state === 'all' ? color : state === 'some' ? 'bg-slate-400' : 'bg-slate-200'}`} title={state === 'some' ? 'Partial Access' : ''}>
//                                                                         <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${state === 'all' ? 'left-0.5 translate-x-5' : state === 'some' ? 'left-[12px]' : 'left-0.5 translate-x-0'}`} />
//                                                                     </button>
//                                                                 </td>
//                                                             );
//                                                         }
//                                                     })}
//                                                 </tr>
//                                             );
//                                         })}

//                                         {displayDocs.map((doc) => {
//                                             const key = `${selectedGroup}_doc_${doc.id}`;
//                                             const perm = permissions[key] || { can_view: false, can_edit: false, can_upload: false, can_download_secure: false, can_download_original: false, can_delete: false };
//                                             const ext = doc.name.split('.').pop().toLowerCase();
//                                             const iconClass = { pdf: 'bg-rose-50 border-rose-100 text-rose-600', xlsx: 'bg-emerald-50 border-emerald-100 text-emerald-600', docx: 'bg-indigo-50 border-indigo-100 text-indigo-600' }[ext] || 'bg-slate-50 border-slate-200 text-slate-400';

//                                             return (
//                                                 <tr key={doc.id} className="group hover:bg-slate-50/60 transition-all duration-150">
//                                                     <td className="py-3.5 px-4 text-center font-mono text-[11.5px] font-semibold text-slate-400">{doc.displayIndex}</td>
//                                                     <td className="py-3.5 px-3">
//                                                         <div className="flex items-center gap-3">
//                                                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border ${iconClass}`}>
//                                                                 {ext.toUpperCase().slice(0, 3)}
//                                                             </div>
//                                                             <p className="font-semibold text-[13px] text-slate-700 truncate max-w-[240px]">{doc.name}</p>
//                                                         </div>
//                                                     </td>

//                                                     {[{ field: 'can_view', color: 'bg-brand' }, { field: 'can_edit', color: 'bg-brand-dark' }, { field: 'can_upload', color: 'bg-purple-600' }, { field: 'can_download_secure', color: 'bg-emerald-600' }, { field: 'can_download_original', color: 'bg-orange-500' }, { field: 'can_delete', color: 'bg-red-600' }, { field: 'can_redact', color: 'bg-slate-800' }].map(({ field, color }) => {
//                                                         if (field === 'can_upload') {
//                                                             return (
//                                                                 <td key={field} className="py-3.5 px-3 text-center">
//                                                                     <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', 'can_upload')} className="relative w-11 h-6 rounded-full bg-slate-100 cursor-not-allowed mx-auto block opacity-60" title="Upload is only for folders">
//                                                                         <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
//                                                                     </button>
//                                                                 </td>
//                                                             );
//                                                         }

//                                                         const isActive = perm[field];
//                                                         const isSaving = saving[`${key}_${field}`];
//                                                         return (
//                                                             <td key={field} className="py-3.5 px-3 text-center">
//                                                                 <button onClick={() => togglePermission(selectedGroup, doc.id, 'doc', field)} disabled={isSaving} className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block ${isActive ? color : 'bg-slate-200'} ${isSaving ? 'opacity-50' : ''}`}>
//                                                                     <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${isActive ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'}`} />
//                                                                 </button>
//                                                             </td>
//                                                         );
//                                                     })}
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* RETURN/SUBMIT BUTTON & INLINE MESSAGES */}
//                 <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-3">

//                     {/* 🔥 INLINE MESSAGE BOX (Replaces the Alert) */}
//                     {saveMessage.text && (
//                         <div className={`px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-lg flex items-center gap-2 animate-fade-in-up ${saveMessage.type === 'success'
//                             ? 'bg-emerald-500 text-white border border-emerald-600'
//                             : 'bg-red-500 text-white border border-red-600'
//                             }`}>
//                             {saveMessage.text}
//                         </div>
//                     )}

//                     <button
//                         onClick={handleSaveAndReturn}
//                         disabled={isSubmitting}
//                         className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold shadow-lg transition-all active:scale-95 ${Object.keys(pendingChanges).length > 0
//                             ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
//                             : 'bg-brand hover:bg-brand-dark text-white'
//                             } ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
//                     >
//                         <span>{isSubmitting ? 'Saving Changes...' : (Object.keys(pendingChanges).length > 0 ? 'Save & Return' : 'Return (No Changes)')}</span>
//                         {!isSubmitting && (
//                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                                 <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
//                             </svg>
//                         )}
//                     </button>
//                 </div>

//                 {/* RETURN/SUBMIT BUTTON */}
//                 {/* <div className="absolute bottom-8 right-8 z-50">
//                     <button onClick={() => {
//                         if (selectedGroup === 'subadmin') {
//                             router.push('/groups/subadmin?view=permissions');
//                         } else if (selectedGroup) {
//                             router.push(`/groups/${selectedGroup}?view=permissions`);
//                         } else {
//                             router.push('/groups');
//                         }
//                     }} className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:bg-brand-dark hover:-translate-y-0.5 transition-all active:scale-95">
//                         <span>Submit & Return</span>
//                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
//                     </button>
//                 </div> */}
//             </div>
//         </div>
//     );
// }










