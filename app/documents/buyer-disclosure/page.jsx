"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StageCards from '@/components/documents/buyer-disclosure/StageCards';
import DocumentsTable from '@/components/documents/buyer-disclosure/DocumentsTable';
import AccessModal from '@/components/documents/buyer-disclosure/AccessModal';

export default function BuyerDisclosurePage() {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStageId, setActiveStageId] = useState(null);

    // Modal controls
    const [accessModalState, setAccessModalState] = useState({
        isOpen: false,
        stage: null,
        mode: 'grant'
    });
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Load stages from backend database
    const loadStages = useCallback(async (userSession) => {
        let s = userSession;
        if (!s && typeof window !== 'undefined') {
            const raw = localStorage.getItem('vdr_session');
            if (raw) {
                try { s = JSON.parse(raw); } catch (e) { }
            }
        }
        s = s || {};

        try {
            setLoading(true);
            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_stages', session: s })
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.stages) && data.stages.length > 0) {
                // Deduplicate stages to prevent duplicate stage cards
                const uniqueStages = [];
                const seen = new Set();
                for (const st of data.stages) {
                    const key = st.stageNumber ?? st.name ?? st.id;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueStages.push(st);
                    }
                }
                setStages(uniqueStages);
                setActiveStageId(prev => {
                    if (prev && uniqueStages.some(st => st.id === prev || st.stageNumber === prev)) {
                        return prev;
                    }
                    return uniqueStages[0].id;
                });
                localStorage.setItem('vdr_buyer_disclosure_stages', JSON.stringify(uniqueStages));
            }
        } catch (err) {
            console.error('Failed to load disclosure stages:', err);
            try {
                const cached = localStorage.getItem('vdr_buyer_disclosure_stages');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setStages(parsed);
                    if (parsed.length > 0) setActiveStageId(parsed[0].id);
                }
            } catch (e) { }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
            try {
                const s = JSON.parse(raw);
                setSession(s);
                const isBuyer = s?.dms_role === 'buyer' || ['buyer', 'guest_admin', 'guest_lead', 'advisor', 'external_user'].includes(s?.role);
                const isSellerAdmin = !isBuyer && ['super_admin', 'admin'].includes(s?.role);
                if (!isSellerAdmin) {
                    router.replace('/documents');
                    return;
                }
                loadStages(s);
            } catch (e) {
                router.replace('/documents');
                return;
            }
        } else {
            router.replace('/login');
            return;
        }

        // Auto-refresh when window regains focus or storage changes (e.g. copied from Files)
        const handleRefresh = () => {
            const curRaw = localStorage.getItem('vdr_session');
            if (curRaw) {
                try {
                    loadStages(JSON.parse(curRaw));
                } catch (e) {
                    loadStages({});
                }
            } else {
                loadStages({});
            }
        };

        window.addEventListener('storage', handleRefresh);
        window.addEventListener('focus', handleRefresh);
        return () => {
            window.removeEventListener('storage', handleRefresh);
            window.removeEventListener('focus', handleRefresh);
        };
    }, [loadStages]);

    const activeStage = stages.find(s => s.id === activeStageId || s.stageNumber === activeStageId) || stages[0] || null;

    // Handle Open Access Modal
    const handleOpenAccessModal = (stage, mode) => {
        setAccessModalState({
            isOpen: true,
            stage,
            mode
        });
    };

    // Handle Confirm Access (Grant or Revoke)
    const handleConfirmAccess = async (stageId, mode, options) => {
        try {
            let currentSession = session;
            if (!currentSession && typeof window !== 'undefined') {
                const raw = localStorage.getItem('vdr_session');
                if (raw) {
                    try { currentSession = JSON.parse(raw); } catch (e) { }
                }
            }
            currentSession = currentSession || {};

            const res = await fetch('/api/documents/buyer-disclosure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_access',
                    stageId,
                    mode,
                    options,
                    session: currentSession
                })
            });
            const data = await res.json();
            if (data.success && data.stages) {
                setStages(data.stages);
                localStorage.setItem('vdr_buyer_disclosure_stages', JSON.stringify(data.stages));
            }

            const targetStage = stages.find(s => s.id === stageId || s.stageNumber === stageId) || activeStage;
            const stageName = targetStage?.name || 'stage';

            if (mode === 'grant') {
                showToast(`Buyer access granted to ${stageName}!`, 'success');
            } else {
                showToast(`Buyer access revoked for ${stageName}.`, 'warning');
            }
        } catch (err) {
            console.error('Error updating access:', err);
            showToast('Failed to update stage access', 'error');
        }
    };

    const handleViewItem = (item) => {
        if (!item) return;
        if (item.isFolder) {
            const fId = item.folderId || item.originalFolderId;
            if (fId) {
                router.push(`/documents?folderId=${fId}`);
            }
        } else {
            const docId = item.docId || item.originalDocumentId || item.id;
            if (docId) {
                if (item.isRedacted) {
                    window.open(`/redaction/view?id=${docId}`, '_blank');
                } else {
                    window.open(`/view/${docId}`, '_blank');
                }
            }
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#f8f9fb] overflow-y-auto">
            {/* Top Header Banner (Seller View only - matching img2) */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Buyer Disclosure</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Stage-gate confidential disclosure controls and due diligence packages.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
                {loading && stages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16">
                        <div className="w-9 h-9 border-3 border-slate-200 border-t-[#0e7490] rounded-full animate-spin mb-3" />
                        <p className="text-xs font-bold text-slate-500">Loading disclosure stages...</p>
                    </div>
                ) : (
                    <>
                        {/* Stage Cards Row */}
                        <StageCards
                            stages={stages}
                            activeStageId={activeStage?.id}
                            onSelectStage={setActiveStageId}
                            onOpenAccessModal={handleOpenAccessModal}
                        />

                        {/* Documents Table with Search bar and Action Toolbar */}
                        <DocumentsTable
                            items={activeStage?.items || []}
                            activeStage={activeStage}
                            stages={stages}
                            onViewItem={handleViewItem}
                            onRefreshStages={loadStages}
                            showToast={showToast}
                        />
                    </>
                )}
            </div>

            {/* Access Modal (for Revoke access / Grant buyer access) */}
            <AccessModal
                isOpen={accessModalState.isOpen}
                onClose={() => setAccessModalState({ isOpen: false, stage: null, mode: 'grant' })}
                mode={accessModalState.mode}
                stage={accessModalState.stage}
                onConfirm={handleConfirmAccess}
            />

            {/* Toast Notifications */}
            {toastMessage && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 18px', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    background: toastMessage.type === 'error' ? '#FEF2F2' : toastMessage.type === 'warning' ? '#FFFBEB' : '#F0FDF4',
                    border: `1.5px solid ${toastMessage.type === 'error' ? '#FCA5A5' : toastMessage.type === 'warning' ? '#FCD34D' : '#86EFAC'}`,
                    color: toastMessage.type === 'error' ? '#DC2626' : toastMessage.type === 'warning' ? '#D97706' : '#16A34A',
                    fontSize: '13px', fontWeight: '700',
                    maxWidth: '380px'
                }}>
                    {toastMessage.message}
                </div>
            )}
        </div>
    );
}
