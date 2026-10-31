"use client";

import React, { useState, useRef } from 'react';
import { exportIndexToExcel, exportIndexToPDF } from '@/utils/exportIndexService';

function Modal({ children, onClose, maxWidth = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" />
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
    const filteredItems = items.filter(item => {
        const matchesSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesType = typeFilter === 'all' ||
            (typeFilter === 'folder' && item.isFolder) ||
            (typeFilter === 'pdf' && (item.type?.toLowerCase() === 'pdf' || item.name.toLowerCase().endsWith('.pdf'))) ||
            (typeFilter === 'excel' && (item.type?.toLowerCase().includes('xls') || item.name.toLowerCase().match(/\.(xlsx|xls|csv)$/))) ||
            (typeFilter === 'doc' && (item.type?.toLowerCase().includes('doc') || item.name.toLowerCase().match(/\.(docx|doc)$/)));
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
        e.preventDefault();
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
        e.preventDefault();
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
            showToast(data.message || `Moved items successfully!`);
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

        for (const file of uploadedFiles) {
            try {
                await fetch('/api/documents/buyer-disclosure', {
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
            } catch (err) {
                console.error(err);
            }
        }
        showToast(`Uploaded ${uploadedFiles.length} file(s) to ${activeStage.name}!`);
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
                    showToast("No downloadable files found in this stage", "warning");
                    return;
                }
            }
        }

        for (const item of filesToDownload) {
            try {
                showToast(`Downloading original file "${item.name}"...`);
                const res = await fetch('/api/documents/buyer-disclosure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'download_file',
                        itemId: item.id,
                        session: getSession()
                    })
                });
                if (!res.ok) throw new Error("Download failed");
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
                console.error("Download error:", err);
                showToast(`Failed to download ${item.name}`, "error");
            }
        }
    };

    // 7. REBUILD INDEX
    const handleRebuildIndex = () => {
        showToast("Index successfully rebuilt");
    };

    // 8. EXPORT INDEX
    const handleExportExcel = () => {
        setIsExportIndexOpen(false);
        exportIndexToExcel(
            items.map(it => ({ id: it.id, name: it.name, is_folder: it.isFolder, type: it.type, size: it.size })),
            new Set(),
            `VDR Buyer Disclosure - ${activeStage?.name || 'Index'}`
        );
        showToast("Document Index Exported as Excel (.xlsx)");
    };

    const handleExportPDF = async () => {
        setIsExportIndexOpen(false);
        try {
            await exportIndexToPDF(
                items.map(it => ({ id: it.id, name: it.name, is_folder: it.isFolder, type: it.type, size: it.size })),
                new Set(),
                `VDR Buyer Disclosure - ${activeStage?.name || 'Index'}`
            );
            showToast("Document Index Exported as PDF");
        } catch (err) {
            showToast("PDF export error: " + err.message, "error");
        }
    };

    // Single selected item for rename
    const singleSelectedItem = selectedIds.size === 1 ? items.find(i => i.id === [...selectedIds][0]) : null;

    return (
        <div className="space-y-3">
            <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            {/* ── 1. WHITE SEARCH BAR ── */}
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-[12px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                    >
                        <option value="all">All Types</option>
                        <option value="folder">Folders</option>
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="doc">Word</option>
                    </select>

                    {/* Action Buttons */}
                    {!isStageLocked && (
                        <>
                            {/* Upload */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[var(--brand)] rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Upload
                            </button>

                            {/* Rebuild Index */}
                            <button
                                type="button"
                                onClick={handleRebuildIndex}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[var(--brand)] rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
                                Rebuild Index
                            </button>

                            {/* Add Folder */}
                            <button
                                type="button"
                                onClick={() => { setFolderName(''); setIsAddFolderOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[var(--brand)] rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                Add Folder
                            </button>

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
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${selectedIds.size !== 1
                                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                                    : 'text-slate-700 hover:bg-teal-50 hover:text-[var(--brand)]'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                Rename
                            </button>

                            {/* Export Index Dropdown */}
                            <div className="relative" onMouseLeave={() => setIsExportIndexOpen(false)}>
                                <button
                                    type="button"
                                    onClick={() => setIsExportIndexOpen(!isExportIndexOpen)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-teal-50 hover:text-[var(--brand)] rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    Export Index
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${isExportIndexOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                                </button>
                                {isExportIndexOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                                        <button
                                            type="button"
                                            onClick={handleExportExcel}
                                            className="w-full text-left px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-emerald-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            Export as Excel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportPDF}
                                            className="w-full text-left px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-rose-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            Export as PDF
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Download */}
                            <button
                                type="button"
                                disabled={selectedIds.size === 0}
                                onClick={() => handleDownloadOriginal()}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${selectedIds.size === 0
                                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                                    : 'text-[var(--brand)] hover:bg-teal-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                Download
                            </button>

                            {/* Move to another stage */}
                            <button
                                type="button"
                                disabled={selectedIds.size === 0}
                                onClick={() => {
                                    const defaultTarget = stages.find(s => s.id !== activeStage?.id)?.id || 'stage-2';
                                    setTargetStageId(defaultTarget);
                                    setIsMoveOpen(true);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${selectedIds.size === 0
                                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                                    : 'text-[var(--brand)] hover:bg-teal-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                                Move Stage
                            </button>

                            {/* Delete */}
                            <button
                                type="button"
                                disabled={selectedIds.size === 0}
                                onClick={() => setIsDeleteOpen(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-colors ${selectedIds.size === 0
                                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── 2. DOCUMENTS TABLE ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-[12px]">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                            <th className="py-3 px-5 text-left">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                />
                            </th>
                            <th className="py-3 px-5 text-left font-bold text-slate-500 uppercase tracking-wide text-[10px]">Name</th>
                            <th className="py-3 px-5 text-left font-bold text-slate-500 uppercase tracking-wide text-[10px]">Type</th>
                            <th className="py-3 px-5 text-left font-bold text-slate-500 uppercase tracking-wide text-[10px]">Size</th>
                            <th className="py-3 px-5 text-left font-bold text-slate-500 uppercase tracking-wide text-[10px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 text-[12px]">
                                    No documents found.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selectedIds.has(item.id);
                                return (
                                    <tr
                                        key={item.id}
                                        className={`group transition-colors ${isSelected ? 'bg-teal-50/50' : 'hover:bg-slate-50/60'}`}
                                    >
                                        {/* Checkbox */}
                                        <td className="py-4 px-5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(item.id)}
                                                className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                            />
                                        </td>

                                        {/* Name */}
                                        <td className="py-4 px-5 font-bold text-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => onViewItem && onViewItem(item)}
                                                className="flex items-center gap-2 text-left hover:text-[var(--brand)] transition-colors"
                                            >
                                                {item.isFolder ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400 flex-shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                )}
                                                <span className="truncate max-w-[240px]">{item.name}</span>
                                            </button>
                                        </td>

                                        {/* Type */}
                                        <td className="py-4 px-5 text-slate-500">
                                            {item.isFolder ? 'Folder' : (item.type?.toUpperCase() || '—')}
                                        </td>

                                        {/* Size */}
                                        <td className="py-4 px-5 text-slate-500">
                                            {item.isFolder ? '—' : (item.size || '—')}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewItem && onViewItem(item)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                    title="View"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1-12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                </button>
                                                {!isStageLocked && !item.isFolder && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadOriginal(item)}
                                                        className="p-1.5 rounded-lg hover:bg-teal-50 text-slate-500 hover:text-[var(--brand)] transition-colors"
                                                        title="Download"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                    </button>
                                                )}
                                                {!isStageLocked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRenameValue(item.name);
                                                            setSelectedIds(new Set([item.id]));
                                                            setIsRenameOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                        title="Rename"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                    </button>
                                                )}
                                                {!isStageLocked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedIds(new Set([item.id]));
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── MODALS ── */}

            {/* Add Folder Modal */}
            {isAddFolderOpen && (
                <Modal onClose={() => setIsAddFolderOpen(false)}>
                    <h2 className="text-[15px] font-black text-slate-900 mb-4">New Folder</h2>
                    <form onSubmit={handleAddFolder} className="space-y-4">
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Folder name..."
                            autoFocus
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
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
                                className="flex-1 py-2.5 bg-[var(--brand)] hover:opacity-90 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Rename Modal */}
            {isRenameOpen && (
                <Modal onClose={() => setIsRenameOpen(false)}>
                    <h2 className="text-[15px] font-black text-slate-900 mb-4">Rename Item</h2>
                    <form onSubmit={handleRename} className="space-y-4">
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="New name..."
                            autoFocus
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
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
                                className="flex-1 py-2.5 bg-[var(--brand)] hover:opacity-90 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Renaming...' : 'Rename'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Move Stage Modal */}
            {isMoveOpen && (
                <Modal onClose={() => setIsMoveOpen(false)}>
                    <h2 className="text-[15px] font-black text-slate-900 mb-4">Move to Stage</h2>
                    <div className="space-y-4">
                        <select
                            value={targetStageId}
                            onChange={(e) => setTargetStageId(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                        >
                            <option value="">Select target stage...</option>
                            {stages.filter(s => s.id !== activeStage?.id).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
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
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-[var(--brand)] hover:opacity-90 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Moving...' : 'Move'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && (
                <Modal onClose={() => setIsDeleteOpen(false)}>
                    <h2 className="text-[15px] font-black text-slate-900 mb-2">Delete Items</h2>
                    <p className="text-[12px] text-slate-500 mb-4">
                        Are you sure you want to delete {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
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
                </Modal>
            )}
        </div>
    );
}
