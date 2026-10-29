"use client";

import React, { useState, useRef } from 'react';
import { exportIndexToExcel, exportIndexToPDF } from '@/utils/exportIndexService';

function Modal({ children, onClose, maxWidth = 'max-w-md' }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} p-6 z-10 animate-in fade-in zoom-in-95 duration-150`}>
                {children}
            </div>
        </div>
    );
}

export default function DocumentsTable({
    items = [],
    activeStage,
    stages = [],
    isStageLocked = false,
    viewMode = 'seller',
    onViewItem,
    onRefreshStages,
    showToast = () => { }
}) {
    const isBuyerMode = viewMode === 'buyer';

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Modals & Menu State
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [targetStageId, setTargetStageId] = useState('');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isExportIndexOpen, setIsExportIndexOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    // Filter Items by Search & Type
    const filteredItems = (items || []).filter(item => {
        const matchesSearch = !searchQuery.trim() || (item.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim());
        const ext = (item.name || '').split('.').pop()?.toLowerCase() || '';
        const itemType = (item.type || '').toLowerCase();

        const matchesType = typeFilter === 'all' ||
            (typeFilter === 'folder' && item.isFolder) ||
            (typeFilter === 'pdf' && (itemType === 'pdf' || ext === 'pdf')) ||
            (typeFilter === 'excel' && (itemType.includes('xls') || ['xlsx', 'xls', 'csv'].includes(ext))) ||
            (typeFilter === 'doc' && (itemType.includes('doc') || ['docx', 'doc', 'rtf'].includes(ext)));

        return matchesSearch && matchesType;
    });

    const isAllSelected = filteredItems.length > 0 && filteredItems.every(i => selectedIds.has(i.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        }
    };

    const toggleSelect = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    // Helper to get session safely
    const getSession = () => {
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('vdr_session');
            if (raw) {
                try { return JSON.parse(raw); } catch (e) { }
            }
        }
        return {};
    };

    // 1. ADD FOLDER
    const handleAddFolder = async (e) => {
        e?.preventDefault();
        if (!folderName.trim() || !activeStage?.id) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_folder',
                    name: folderName.trim(),
                    stageId: activeStage.id,
                    session: getSession()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create folder');
            showToast(`Folder "${folderName.trim()}" created!`);
            setFolderName('');
            setIsAddFolderOpen(false);
            if (onRefreshStages) await onRefreshStages();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. RENAME
    const handleRename = async (e) => {
        e?.preventDefault();
        if (!renameValue.trim() || selectedIds.size !== 1) return;
        const selectedId = [...selectedIds][0];
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'rename_item',
                    itemId: selectedId,
                    newName: renameValue.trim(),
                    session: getSession()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to rename item');
            showToast(`Renamed to "${renameValue.trim()}"!`);
            setIsRenameOpen(false);
            if (onRefreshStages) await onRefreshStages();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. MOVE TO ANOTHER STAGE
    const handleMoveStage = async () => {
        if (!targetStageId || selectedIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'move_stage',
                    itemIds: [...selectedIds],
                    targetStageId,
                    session: getSession()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to move items');
            showToast(data.message || 'Moved items successfully!');
            setIsMoveOpen(false);
            setSelectedIds(new Set());
            if (onRefreshStages) await onRefreshStages();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 4. DELETE
    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete_item',
                    itemIds: [...selectedIds],
                    session: getSession()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete items');
            showToast(data.message || 'Items deleted from stage');
            setIsDeleteOpen(false);
            setSelectedIds(new Set());
            if (onRefreshStages) await onRefreshStages();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. UPLOAD FILE
    const handleFileUpload = async (e) => {
        const uploadedFiles = Array.from(e.target.files || []);
        if (uploadedFiles.length === 0 || !activeStage?.id) return;

        setIsSubmitting(true);
        let successCount = 0;

        for (const file of uploadedFiles) {
            try {
                const res = await fetch('/api/documents/buyer-disclosure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'copy_item',
                        item: {
                            name: file.name,
                            isFolder: false,
                            type: file.name.split('.').pop() || 'file',
                            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                        },
                        targetStageId: activeStage.id,
                        session: getSession()
                    })
                });
                if (res.ok) successCount++;
            } catch (err) {
                console.error('File upload error:', err);
            }
        }

        setIsSubmitting(false);
        showToast(`Uploaded ${successCount} file(s) to ${activeStage?.name || 'stage'}!`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onRefreshStages) await onRefreshStages();
    };

    // 6. DOWNLOAD ORIGINAL FILE DIRECTLY
    const handleDownloadOriginal = async (specificItem = null) => {
        let filesToDownload = [];
        if (specificItem && !specificItem.isFolder) {
            filesToDownload = [specificItem];
        } else {
            filesToDownload = filteredItems.filter(i => selectedIds.has(i.id) && !i.isFolder);
            if (filesToDownload.length === 0) {
                const anyNonFolder = filteredItems.find(i => !i.isFolder);
                if (anyNonFolder) {
                    filesToDownload = [anyNonFolder];
                } else {
                    showToast('No downloadable files found in this stage', 'warning');
                    return;
                }
            }
        }

        for (const item of filesToDownload) {
            try {
                showToast(`Downloading "${item.name}"...`);
                const res = await fetch('/api/documents/buyer-disclosure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'download_file',
                        itemId: item.id,
                        session: getSession()
                    })
                });

                if (!res.ok) throw new Error('Download failed');

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = item.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showToast(`Downloaded "${item.name}"!`);
            } catch (err) {
                console.error('Download error:', err);
                showToast(`Failed to download ${item.name}`, 'error');
            }
        }
    };

    // 7. REBUILD INDEX
    const handleRebuildIndex = async () => {
        showToast('Rebuilding index...');
        if (onRefreshStages) await onRefreshStages();
        showToast('Index successfully rebuilt');
    };

    // 8. EXPORT INDEX
    const handleExportExcel = () => {
        setIsExportIndexOpen(false);
        try {
            exportIndexToExcel(
                items.map(it => ({ id: it.id, name: it.name, is_folder: it.isFolder, type: it.type, size: it.size })),
                new Set(),
                `VDR Buyer Disclosure - ${activeStage?.name || 'Index'}`
            );
            showToast('Document Index exported as Excel (.xlsx)');
        } catch (err) {
            showToast('Excel export failed: ' + err.message, 'error');
        }
    };

    const handleExportPDF = async () => {
        setIsExportIndexOpen(false);
        try {
            await exportIndexToPDF(
                items.map(it => ({ id: it.id, name: it.name, is_folder: it.isFolder, type: it.type, size: it.size })),
                new Set(),
                `VDR Buyer Disclosure - ${activeStage?.name || 'Index'}`
            );
            showToast('Document Index exported as PDF');
        } catch (err) {
            showToast('PDF export failed: ' + err.message, 'error');
        }
    };

    // Single selected item for rename
    const singleSelectedItem = selectedIds.size === 1 ? items.find(i => i.id === [...selectedIds][0]) : null;

    // Available target stages for move (exclude active stage)
    const otherStages = stages.filter(s => s.id !== activeStage?.id && s.stageNumber !== activeStage?.stageNumber);

    return (
        <div className="space-y-3">
            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* ── 1. WHITE SEARCH BAR ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0e7490] transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none hover:bg-slate-100 transition-colors"
                    >
                        <option value="all">All types</option>
                        <option value="folder">Folders</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">Word / Documents</option>
                        <option value="excel">Excel</option>
                    </select>

                    <span className="text-[12px] font-bold text-slate-500 whitespace-nowrap px-1">
                        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>

            {/* ── 2. ACTION TOOLBAR ── */}
            <div className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto gap-2">
                <div className="flex items-center gap-1.5 flex-nowrap">
                    {!isBuyerMode && (
                        <>
                            {/* Upload */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0e7490] rounded-lg transition-colors whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Upload
                            </button>

                            {/* Add Folder */}
                            <button
                                type="button"
                                onClick={() => { setFolderName(''); setIsAddFolderOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0e7490] rounded-lg transition-colors whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                                Add Folder
                            </button>
                        </>
                    )}

                    {/* Export Index Dropdown */}
                    <div className="relative" onMouseLeave={() => setIsExportIndexOpen(false)}>
                        <button
                            type="button"
                            onClick={() => setIsExportIndexOpen(!isExportIndexOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0e7490] rounded-lg transition-colors whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            Export Index
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${isExportIndexOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {isExportIndexOpen && (
                            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    className="w-full text-left px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-emerald-600">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" />
                                    </svg>
                                    Excel (.xlsx)
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    className="w-full text-left px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-rose-600">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="M10 12v5" /><path d="M14 12v5" />
                                    </svg>
                                    PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Rebuild Index */}
                    <button
                        type="button"
                        onClick={handleRebuildIndex}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0e7490] rounded-lg transition-colors whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 2v6h-6" />
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                            <path d="M3 22v-6h6" />
                            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                        Rebuild Index
                    </button>

                    {!isBuyerMode && (
                        <>
                            {/* Rename */}
                            <button
                                type="button"
                                disabled={selectedIds.size !== 1}
                                onClick={() => {
                                    if (singleSelectedItem) {
                                        setRenameValue(singleSelectedItem.name);
                                        setIsRenameOpen(true);
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors whitespace-nowrap ${selectedIds.size !== 1
                                        ? 'text-slate-400 cursor-not-allowed opacity-50'
                                        : 'text-slate-700 hover:bg-teal-50 hover:text-[#0e7490]'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                Rename
                            </button>

                            {/* Move to another stage */}
                            <button
                                type="button"
                                disabled={selectedIds.size === 0}
                                onClick={() => {
                                    const firstTarget = otherStages[0]?.id || '';
                                    setTargetStageId(firstTarget);
                                    setIsMoveOpen(true);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors whitespace-nowrap ${selectedIds.size === 0
                                        ? 'text-slate-400 cursor-not-allowed opacity-50'
                                        : 'text-[#0e7490] hover:bg-teal-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="5 9 2 12 5 15" />
                                    <polyline points="9 5 12 2 15 5" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <line x1="12" y1="2" x2="12" y2="22" />
                                </svg>
                                Move to another stage
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                disabled={selectedIds.size === 0}
                                onClick={() => setIsDeleteOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors whitespace-nowrap ${selectedIds.size === 0
                                        ? 'text-slate-400 cursor-not-allowed opacity-50'
                                        : 'text-rose-600 hover:bg-rose-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6M14 11v6" />
                                    <path d="M9 6V4h6v2" />
                                </svg>
                                Delete
                            </button>
                        </>
                    )}
                </div>

                {/* Right: Download Action */}
                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={() => handleDownloadOriginal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[#0e7490] rounded-lg transition-colors whitespace-nowrap"
                        title={selectedIds.size > 0 ? "Download selected files" : "Download files from this stage"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                    </button>
                </div>
            </div>

            {/* ── 3. DOCUMENTS TABLE ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="py-3.5 px-5 w-10">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                    />
                                </th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Version</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Created at</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Size</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Buyer access</th>
                                <th className="py-3.5 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#fcd34d" className="opacity-80">
                                                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                            </svg>
                                            <p className="text-[13px] font-bold text-slate-600">
                                                {searchQuery ? 'No documents match your search' : 'No documents in this stage'}
                                            </p>
                                            <p className="text-[12px] text-slate-400">
                                                {isBuyerMode ? 'Documents will appear here when granted access by seller' : 'Upload files or create folders to get started'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isSelected = selectedIds.has(item.id);
                                    const isVisibleToBuyer = !isStageLocked;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`group transition-colors ${isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50/70'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="py-3.5 px-5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(item.id)}
                                                    className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                                />
                                            </td>

                                            {/* Name */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    {item.isFolder ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fcd34d" className="shrink-0">
                                                            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                                        </svg>
                                                    ) : (
                                                        <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded text-[9px] font-black text-slate-600 flex items-center justify-center shrink-0">
                                                            {(item.type || 'FILE').toUpperCase().slice(0, 3)}
                                                        </div>
                                                    )}

                                                    <span
                                                        className="text-[13px] font-semibold text-slate-800 hover:text-[#0e7490] hover:underline cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            if (item.isFolder) {
                                                                onViewItem?.(item);
                                                            } else {
                                                                handleDownloadOriginal(item);
                                                            }
                                                        }}
                                                        title={item.isFolder ? 'Open folder' : 'Download original file'}
                                                    >
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Version */}
                                            <td className="py-3.5 px-4 text-[12px] font-semibold text-slate-500">
                                                {item.version || 'V1'}
                                            </td>

                                            {/* Created At */}
                                            <td className="py-3.5 px-4 text-[12px] font-semibold text-slate-500 whitespace-nowrap">
                                                {item.createdAt || 'Oct 23, 2026'}
                                            </td>

                                            {/* Size */}
                                            <td className="py-3.5 px-4 text-[12px] font-semibold text-slate-500">
                                                {item.size || '--'}
                                            </td>

                                            {/* Buyer Access */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isVisibleToBuyer ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Visible
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                        Hidden
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {!item.isFolder && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadOriginal(item)}
                                                            className="p-1.5 text-slate-500 hover:text-[#0e7490] hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="Download file"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="7 10 12 15 17 10" />
                                                                <line x1="12" y1="15" x2="12" y2="3" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onViewItem?.(item)}
                                                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                                        title="View details"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODALS ── */}

            {/* 1. Add Folder Modal */}
            {isAddFolderOpen && (
                <Modal onClose={() => setIsAddFolderOpen(false)}>
                    <form onSubmit={handleAddFolder}>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0e7490] flex items-center justify-center font-bold mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Folder</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Folder will be created under {activeStage?.name || 'this stage'}.
                        </p>
                        <input
                            type="text"
                            placeholder="Folder Name (e.g., HR, Financials)"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            autoFocus
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:bg-white mb-5"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsAddFolderOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !folderName.trim()}
                                className="flex-1 py-2.5 bg-[#0e7490] hover:bg-[#0c627a] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* 2. Rename Modal */}
            {isRenameOpen && (
                <Modal onClose={() => setIsRenameOpen(false)}>
                    <form onSubmit={handleRename}>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0e7490] flex items-center justify-center font-bold mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Rename Item</h3>
                        <p className="text-xs text-slate-500 mb-4">Enter a new name for the selected item.</p>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:bg-white mb-5"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsRenameOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !renameValue.trim()}
                                className="flex-1 py-2.5 bg-[#0e7490] hover:bg-[#0c627a] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* 3. Move to Another Stage Modal */}
            {isMoveOpen && (
                <Modal onClose={() => setIsMoveOpen(false)}>
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0e7490] flex items-center justify-center font-bold mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="5 9 2 12 5 15" />
                                <polyline points="9 5 12 2 15 5" />
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Move to Another Stage</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Select destination stage for {selectedIds.size} selected item(s).
                        </p>

                        <div className="space-y-2 mb-5">
                            {otherStages.map((stg) => (
                                <label
                                    key={stg.id}
                                    onClick={() => setTargetStageId(stg.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${targetStageId === stg.id
                                            ? 'border-[#0e7490] bg-teal-50/40 text-slate-900 font-bold'
                                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="moveStageRadio"
                                            checked={targetStageId === stg.id}
                                            onChange={() => setTargetStageId(stg.id)}
                                            className="accent-[#0e7490]"
                                        />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{stg.name}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {stg.itemCount ?? (stg.items ? stg.items.length : 0)} items • {stg.buyerAccess === 'can_view' ? 'Buyer can view' : 'Hidden from buyer'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stg.buyerAccess === 'can_view'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {stg.buyerAccess === 'can_view' ? 'Visible' : 'Hidden'}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsMoveOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleMoveStage}
                                disabled={isSubmitting || !targetStageId}
                                className="flex-1 py-2.5 bg-[#0e7490] hover:bg-[#0c627a] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Moving...' : 'Confirm Move'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* 4. Delete Confirmation Modal */}
            {isDeleteOpen && (
                <Modal onClose={() => setIsDeleteOpen(false)}>
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4h6v2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Selected Items?</h3>
                        <p className="text-xs text-slate-500 mb-5">
                            Are you sure you want to remove {selectedIds.size} item(s) from {activeStage?.name || 'this stage'}?
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Deleting...' : 'Delete Items'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
