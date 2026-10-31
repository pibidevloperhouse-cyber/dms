"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FaArrowLeft,
    FaShieldAlt,
    FaEye,
    FaDownload,
    FaSearch,
    FaTimes,
    FaSave,
    FaCheckCircle
} from 'react-icons/fa';

export default function BuyerAccessControlPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full w-full bg-[#F8F9FB] text-slate-400 gap-3">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0e7490] rounded-full animate-spin" />
                <p className="text-[13px] font-bold text-slate-500">Loading access control...</p>
            </div>
        }>
            <BuyerAccessControlContent />
        </Suspense>
    );
}

function BuyerAccessControlContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlStage = searchParams.get('stage') || searchParams.get('stageId');

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

    // Data from Backend
    const [files, setFiles] = useState([]);
    const [stages, setStages] = useState([]);
    const [guestAdmin, setGuestAdmin] = useState(null);

    // Permissions State: { [fileId]: { can_view: boolean, can_download_secure: boolean, can_download_original: boolean } }
    const [permissions, setPermissions] = useState({});
    const [initialPermissions, setInitialPermissions] = useState({});

    // Filtering & Search: Default to active stage if provided, otherwise first stage
    const [activeStageFilter, setActiveStageFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const showToast = (text, type = 'success') => {
        setSaveMessage({ text, type });
        setTimeout(() => setSaveMessage({ text: '', type: '' }), 3500);
    };

    // Load Session
    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
            try {
                const s = JSON.parse(raw);
                setSession(s);
            } catch (e) {
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [router]);

    // Fetch Access Control Data
    const fetchData = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure/access-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_data',
                    session
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load access control data');

            setFiles(data.files || []);
            setStages(data.stages || []);
            setGuestAdmin(data.activeGuestAdmin || data.guestAdmins?.[0] || null);

            // If url stage is specified, set active stage filter to that stage
            if (urlStage && data.stages?.length > 0) {
                const matched = data.stages.find(
                    s => s.id === urlStage || s.stageNumber?.toString() === urlStage || s.name?.toLowerCase() === urlStage.toLowerCase()
                );
                if (matched) {
                    setActiveStageFilter(matched.id);
                } else if (data.stages.length > 0) {
                    setActiveStageFilter(data.stages[0].id);
                }
            } else if (data.stages?.length > 0 && activeStageFilter === 'all') {
                // Default to first stage for stage-wise workflow
                setActiveStageFilter(data.stages[0].id);
            }

            // Populate permissions map for each file
            const initialMap = {};
            (data.files || []).forEach(f => {
                const existing = data.permissions?.[f.id] || data.permissions?.[f.docId];
                if (existing) {
                    initialMap[f.id] = {
                        can_view: Boolean(existing.can_view),
                        can_download_secure: Boolean(existing.can_download_secure),
                        can_download_original: Boolean(existing.can_download_original)
                    };
                } else {
                    const stageMatch = (data.stages || []).find(st => st.id === f.stageId);
                    const isStageViewable = stageMatch?.buyerAccess === 'can_view';
                    initialMap[f.id] = {
                        can_view: isStageViewable,
                        can_download_secure: isStageViewable,
                        can_download_original: false
                    };
                }
            });

            setPermissions(initialMap);
            setInitialPermissions(JSON.parse(JSON.stringify(initialMap)));
        } catch (err) {
            console.error('Fetch access control error:', err);
            showToast(err.message || 'Error loading access control data', 'error');
        } finally {
            setLoading(false);
        }
    }, [session, urlStage]);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session]);

    // Permission Toggle with Cascade Logic (matching Access Control module)
    const togglePermission = (fileId, field) => {
        setPermissions(prev => {
            const current = prev[fileId] || { can_view: false, can_download_secure: false, can_download_original: false };
            const nextValue = !current[field];
            const updated = { ...current, [field]: nextValue };

            // Cascade rules:
            if (field === 'can_download_original' && nextValue) {
                updated.can_download_secure = true;
                updated.can_view = true;
            }
            if (field === 'can_download_secure' && nextValue) {
                updated.can_view = true;
            }
            if (field === 'can_view' && !nextValue) {
                updated.can_download_secure = false;
                updated.can_download_original = false;
            }
            if (field === 'can_download_secure' && !nextValue) {
                updated.can_download_original = false;
            }

            return { ...prev, [fileId]: updated };
        });
    };

    // Stage-wise Bulk Toggle for all files in a specific stage
    const handleStageBulk = (stageFiles, field) => {
        const allChecked = stageFiles.length > 0 && stageFiles.every(f => permissions[f.id]?.[field]);
        const targetValue = !allChecked;

        setPermissions(prev => {
            const next = { ...prev };
            stageFiles.forEach(f => {
                const current = next[f.id] || { can_view: false, can_download_secure: false, can_download_original: false };
                const updated = { ...current, [field]: targetValue };

                if (field === 'can_download_original' && targetValue) {
                    updated.can_download_secure = true;
                    updated.can_view = true;
                }
                if (field === 'can_download_secure' && targetValue) {
                    updated.can_view = true;
                }
                if (field === 'can_view' && !targetValue) {
                    updated.can_download_secure = false;
                    updated.can_download_original = false;
                }
                if (field === 'can_download_secure' && !targetValue) {
                    updated.can_download_original = false;
                }

                next[f.id] = updated;
            });
            return next;
        });
    };

    // Save Permissions to Backend
    const handleSave = async () => {
        if (!guestAdmin?.id) {
            showToast('Guest Admin not found', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure/access-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_permissions',
                    session,
                    guestAdminId: guestAdmin.id,
                    permissionsMap: permissions
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save permissions');

            setInitialPermissions(JSON.parse(JSON.stringify(permissions)));
            showToast('Saved successfully!', 'success');
        } catch (err) {
            console.error('Save error:', err);
            showToast(err.message || 'Failed to save permissions', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter Files by Search Query
    const searchFilteredFiles = useMemo(() => {
        return files.filter(f => {
            return !searchQuery.trim() ||
                (f.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                (f.folderName || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
        });
    }, [files, searchQuery]);

    // Group Files Stage-wise
    const groupedStages = useMemo(() => {
        const targetStages = activeStageFilter === 'all'
            ? stages
            : stages.filter(s => s.id === activeStageFilter || s.stageNumber?.toString() === activeStageFilter);

        return targetStages.map(stg => {
            const stageFiles = searchFilteredFiles.filter(f => f.stageId === stg.id || f.stageNumber === stg.stageNumber);
            return {
                ...stg,
                files: stageFiles
            };
        }).filter(stg => stg.files.length > 0 || activeStageFilter !== 'all');
    }, [stages, searchFilteredFiles, activeStageFilter]);

    const hasUnsavedChanges = useMemo(() => {
        return JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
    }, [permissions, initialPermissions]);

    const formatExt = (name = '') => {
        const ext = name.split('.').pop().toLowerCase();
        return ext.length <= 4 ? ext.toUpperCase() : 'DOC';
    };

    const getExtClass = (name = '') => {
        const ext = name.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'bg-rose-50 border-rose-100 text-rose-600';
        if (['xlsx', 'xls', 'csv'].includes(ext)) return 'bg-emerald-50 border-emerald-100 text-emerald-600';
        if (['docx', 'doc'].includes(ext)) return 'bg-indigo-50 border-indigo-100 text-indigo-600';
        return 'bg-slate-50 border-slate-200 text-slate-500';
    };

    return (
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8F9FB] overflow-hidden font-sans">
            {/* ── TOP HEADER (Clean style matching Access Control module) ── */}
            <div className="flex items-center justify-between px-7 pt-5 pb-4 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-3">
                    <Link
                        href="/documents/buyer-disclosure"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Back to Buyer Disclosure"
                    >
                        <FaArrowLeft className="text-sm" />
                    </Link>
                    <div className="w-9 h-9 rounded-xl bg-[#0e7490] flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow-2xs">
                        <FaShieldAlt className="text-base" />
                    </div>
                    <div>
                        <p className="text-[14px] font-black text-slate-800">Buyer Access Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Field */}
                    <div className="relative w-56">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    {/* Save Button */}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl transition-all shadow-xs ${
                            hasUnsavedChanges
                                ? 'bg-[#0e7490] hover:bg-[#0c627a] text-white cursor-pointer ring-2 ring-teal-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <FaSave className="text-xs" />
                                <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>



            {/* ── MAIN STAGE-WISE FILES VIEW ── */}
            <div className="flex-1 overflow-auto px-7 py-5 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0e7490] rounded-full animate-spin" />
                        <p className="text-[13px] font-bold text-slate-500">Loading access rules...</p>
                    </div>
                ) : groupedStages.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                        <p className="text-[13px] font-bold">No documents found in this stage</p>
                    </div>
                ) : (
                    groupedStages.map(stage => (
                        <div key={stage.id} className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">


                            {/* Stage Files Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/40">
                                            <th className="py-3 px-4 w-14 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                                #
                                            </th>
                                            <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Name
                                            </th>
                                            <th className="py-3 px-3 w-28 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-600">
                                                        <FaEye className="text-slate-500 text-[14px] group-hover:text-slate-900 transition-colors" />
                                                        <span className="text-[11px] font-bold">Can View</span>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3 px-3 w-28 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-600">
                                                        <FaShieldAlt className="text-slate-500 text-[14px] group-hover:text-slate-900 transition-colors" />
                                                        <span className="text-[11px] font-bold">DL Secure</span>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="py-3 px-3 w-28 text-center">
                                                <div className="inline-block relative group cursor-pointer">
                                                    <div className="flex items-center justify-center gap-1.5 text-slate-600">
                                                        <FaDownload className="text-slate-500 text-[14px] group-hover:text-slate-900 transition-colors" />
                                                        <span className="text-[11px] font-bold">DL Original</span>
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-50">
                                        {stage.files.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-6 text-center text-xs text-slate-400 italic">
                                                    No documents linked to this stage
                                                </td>
                                            </tr>
                                        ) : (
                                            stage.files.map((file, idx) => {
                                                const perm = permissions[file.id] || { can_view: false, can_download_secure: false, can_download_original: false };
                                                return (
                                                    <tr key={file.id} className="group hover:bg-slate-50/60 transition-all duration-150">
                                                        {/* Index Number */}
                                                        <td className="py-3.5 px-4 text-center font-mono text-[11px] font-semibold text-slate-400">
                                                            {idx + 1}
                                                        </td>

                                                        {/* Document Name & Details */}
                                                        <td className="py-3.5 px-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black border ${getExtClass(file.name)}`}>
                                                                    {formatExt(file.name)}
                                                                </div>
                                                                <div className="min-w-0 flex items-center gap-2">
                                                                    <p className="font-semibold text-[13px] text-slate-700 truncate max-w-[280px] md:max-w-md" title={file.name}>
                                                                        {file.name}
                                                                    </p>
                                                                    {file.isRedacted && (
                                                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                                            Redacted
                                                                        </span>
                                                                    )}
                                                                    {/* Small detail info icon with hover tooltip */}
                                                                    <div className="relative group/detail inline-flex items-center shrink-0">
                                                                        <button
                                                                            type="button"
                                                                            className="text-slate-400 hover:text-[#0e7490] p-0.5 rounded transition-colors cursor-pointer"
                                                                            aria-label="File details"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <circle cx="12" cy="12" r="10" />
                                                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                                                            </svg>
                                                                        </button>
                                                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/detail:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none font-medium">
                                                                            <span className="text-teal-300 font-bold">{file.stageName}</span>
                                                                            <span className="text-slate-500">•</span>
                                                                            <span>📁 {file.folderName}</span>
                                                                            <span className="text-slate-500">•</span>
                                                                            <span className="text-slate-300">{file.size}</span>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Can View Toggle */}
                                                        <td className="py-3.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(file.id, 'can_view')}
                                                                className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${
                                                                    perm.can_view ? 'bg-[#0e7490]' : 'bg-slate-200'
                                                                }`}
                                                                title="Can View"
                                                            >
                                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                                                    perm.can_view ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </td>

                                                        {/* Download Secure Toggle */}
                                                        <td className="py-3.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(file.id, 'can_download_secure')}
                                                                className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${
                                                                    perm.can_download_secure ? 'bg-[#0e7490]' : 'bg-slate-200'
                                                                }`}
                                                                title="Download Secure"
                                                            >
                                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                                                    perm.can_download_secure ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </td>

                                                        {/* Download Original Toggle */}
                                                        <td className="py-3.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => togglePermission(file.id, 'can_download_original')}
                                                                className={`relative w-11 h-6 rounded-full transition-all duration-200 mx-auto block cursor-pointer ${
                                                                    perm.can_download_original ? 'bg-[#0e7490]' : 'bg-slate-200'
                                                                }`}
                                                                title="Download Original"
                                                            >
                                                                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                                                    perm.can_download_original ? 'left-0.5 translate-x-5' : 'left-0.5 translate-x-0'
                                                                }`} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ── TOAST NOTIFICATION ── */}
            {saveMessage.text && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    background: saveMessage.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                    border: `1px solid ${saveMessage.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
                    color: saveMessage.type === 'error' ? '#DC2626' : '#16A34A',
                    fontSize: '12px', fontWeight: '700'
                }}>
                    <FaCheckCircle className="text-sm shrink-0" />
                    <span>{saveMessage.text}</span>
                </div>
            )}
        </div>
    );
}
