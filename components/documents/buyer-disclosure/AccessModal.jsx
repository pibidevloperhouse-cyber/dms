"use client";

import React, { useState } from 'react';
import { FaShieldAlt, FaLock, FaExclamationTriangle, FaCheck, FaTimes, FaFileAlt } from 'react-icons/fa';

export default function AccessModal({ isOpen, onClose, mode = 'grant', stage, onConfirm }) {
    const [allowDownload, setAllowDownload] = useState(false);
    const [applyWatermark, setApplyWatermark] = useState(true);
    const [notifyBuyers, setNotifyBuyers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !stage) return null;

    const isGrant = mode === 'grant';

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(stage.id, mode, {
                allowDownload,
                applyWatermark,
                notifyBuyers
            });
            onClose();
        } catch (err) {
            console.error("Access modal error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
            <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 border-b flex items-start justify-between ${isGrant ? 'bg-gradient-to-r from-teal-50/60 to-cyan-50/40 border-teal-100' : 'bg-gradient-to-r from-rose-50/70 to-red-50/30 border-rose-100'}`}>
                    <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${isGrant ? 'bg-teal-600 text-white' : 'bg-rose-500 text-white'}`}>
                            {isGrant ? <FaShieldAlt className="text-xl" /> : <FaExclamationTriangle className="text-lg" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {isGrant ? `Grant Access: ${stage.name}` : `Revoke Access: ${stage.name}`}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isGrant
                                    ? `Allow buyer parties to view documents under ${stage.name}.`
                                    : `Remove buyer visibility to documents under ${stage.name}.`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        disabled={isSubmitting}
                    >
                        <FaTimes className="text-sm" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Stage Info Card */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                                {stage.stageNumber || stage.name.replace(/[^0-9]/g, '') || '1'}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{stage.name}</h4>
                                <span className="text-xs text-slate-500">{stage.itemCount || (stage.items ? stage.items.length : 0)} items included</span>
                            </div>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isGrant
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            Current: {isGrant ? 'Hidden from buyer' : 'Buyer can view'}
                        </span>
                    </div>

                    {isGrant ? (
                        <div className="space-y-3.5">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Access Configuration</p>

                            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={applyWatermark}
                                    onChange={(e) => setApplyWatermark(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">Dynamic Watermarking</span>
                                    <p className="text-xs text-slate-500">Stamps buyer email, timestamp, and IP on all documents</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={allowDownload}
                                    onChange={(e) => setAllowDownload(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">Allow Encrypted Downloads</span>
                                    <p className="text-xs text-slate-500">Permit buyer to save offline DRM-protected copies</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifyBuyers}
                                    onChange={(e) => setNotifyBuyers(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">Notify Buyer Leads</span>
                                    <p className="text-xs text-slate-500">Send an automated email notification about unlocked stage</p>
                                </div>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <FaLock className="text-rose-600" />
                                    <span>Immediate Revocation Warning</span>
                                </div>
                                Revoking buyer access will immediately hide all folders and files in this stage from the buyer preview and buyer portal. Active viewer sessions will be terminated.
                            </div>

                            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-rose-300 transition-colors cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifyBuyers}
                                    onChange={(e) => setNotifyBuyers(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">Notify Buyers of Stage Closure</span>
                                    <p className="text-xs text-slate-500">Send email alert stating that this stage documents are now closed</p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition-all ${isGrant
                            ? 'bg-[#0e6f7c] hover:bg-[#09525c] active:scale-95'
                            : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isGrant ? (
                            <>
                                <FaCheck className="text-xs" />
                                Grant Access
                            </>
                        ) : (
                            <>
                                <FaLock className="text-xs" />
                                Revoke Access Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
