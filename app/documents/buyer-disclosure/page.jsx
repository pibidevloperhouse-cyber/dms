"use client";

import React, { useState, useEffect, useCallback } from 'react';
import StageCards from '@/components/documents/buyer-disclosure/StageCards';
import DocumentsTable from '@/components/documents/buyer-disclosure/DocumentsTable';
import AccessModal from '@/components/documents/buyer-disclosure/AccessModal';

export default function BuyerDisclosurePage() {
    const [session, setSession] = useState(null);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStageId, setActiveStageId] = useState(null);
    const [viewMode, setViewMode] = useState('seller');
    
    // Modal controls
    const [accessModalState, setAccessModalState] = useState({
        isOpen: false,
        stage: null,
        mode: 'grant'
    });
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Load stages from backend database
    const loadStages = useCallback(async (userSession) => {
        let s = userSession;
        if (!s && typeof window !== 'undefined') {
            const raw = localStorage.getItem('vdr_session');
            if (raw) {
                try { s = JSON.parse(raw); } catch (e) {}
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
                setStages(data.stages);
                setActiveStageId(prev => {
                    if (prev && data.stages.some(st => st.id === prev || st.stageNumber === prev)) {
                        return prev;
                    }
                    return data.stages[0].id;
                });
                localStorage.setItem('vdr_buyer_disclosure_stages', JSON.stringify(data.stages));
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
            } catch (e) {}
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
                loadStages(s);
            } catch (e) {
                loadStages({});
            }
        } else {
            loadStages({});
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
    }, []);

    const activeStage = stages.find(s => s.id === activeStageId || s.stageNumber === activeStageId) || stages[0];

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
                    try { currentSession = JSON.parse(raw); } catch (e) {}
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

            if (mode === 'grant') {
                showToast(`Buyer access granted to ${activeStage?.name || 'stage'}!`, 'success');
            } else {
                showToast(`Buyer access revoked for ${activeStage?.name || 'stage'}.`, 'warning');
            }
        } catch (err) {
            console.error('Error updating access:', err);
            showToast('Failed to update stage access', 'error');
        }
    };

    const handleViewItem = (item) => {
        showToast(`Opening viewer for "${item.name}"...`, 'info');
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#f8f9fb] overflow-y-auto">
            {/* Main Content Area */}
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
                {/* Stage Cards Row (Compact, matching img2 exactly) */}
                <StageCards
                    stages={stages}
                    activeStageId={activeStage?.id}
                    onSelectStage={setActiveStageId}
                    onOpenAccessModal={handleOpenAccessModal}
                    viewMode={viewMode}
                />

                {/* Documents Table with Search bar and Action Toolbar */}
                <DocumentsTable
                    items={activeStage?.items || []}
                    activeStage={activeStage}
                    stages={stages}
                    isStageLocked={activeStage?.buyerAccess === 'hidden'}
                    viewMode={viewMode}
                    onViewItem={handleViewItem}
                    onRefreshStages={loadStages}
                    showToast={showToast}
                />
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
                    maxWidth: '360px'
                }}>
                    {toastMessage.message}
                </div>
            )}
        </div>
    );
}
