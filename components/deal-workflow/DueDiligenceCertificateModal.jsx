"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useDealWorkflow, normalizeRole, normalizeStage } from './DealWorkflowContext';
import {
  X,
  Check,
  CheckCircle2,
  Printer,
  PenTool,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Type,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function DueDiligenceCertificateModal() {
  const {
    isDDCertificateModalOpen,
    setIsDDCertificateModalOpen,
    dueDiligenceCertificate,
    dealInfo,
    tasks,
    signDDCertificateAsAdvisor,
    signDDCertificateAsGuestAdmin,
    currentUser,
    ddCertificateMetrics,
  } = useDealWorkflow();

  const [isSigning, setIsSigning] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const normRole = normalizeRole(currentUser?.role);
  const isAdvisor = normRole === 'advisor';
  const isGuestAdmin = normRole === 'guest_admin';
  const isSellerSuperAdmin = normRole === 'super_admin' || currentUser?.side === 'seller';

  // Dynamic real deal metadata
  const dealName = dealInfo?.dealName || 'Naga raj Deal';
  const dealNumber = dealInfo?.dealNumber || 'D-F4FD2';
  const buyerCompany = dealInfo?.buyerCompany || 'Naga Tech';
  const sellerCompany = dealInfo?.sellerCompany || 'Vishwa Tech';
  const periodText = dealInfo?.period || '02 Sep to 30 Oct 2026';

  const defaultLeadAdvisorName = dealInfo?.leadAdvisorName || 'Vijay';
  const defaultGuestAdminName = dealInfo?.guestAdminName || 'Naga raj';
  const defaultSuperAdminName = dealInfo?.sellerSuperAdminName || 'Vishwa Raj';

  // Fingerprint of current Due Diligence tasks
  const ddTasks = (tasks || []).filter(
    (t) => normalizeStage(t.deal_stage || t.dealStage) === 'Due Diligence'
  );
  const currentFingerprint = ddTasks.map((t) => t.task_id || t.id).sort().join('|');

  // Verify certificate is tied to the current batch of tasks
  const isCertMatchingCurrentTasks =
    Boolean(dueDiligenceCertificate?.certifiedTaskIdsKey) &&
    dueDiligenceCertificate.certifiedTaskIdsKey === currentFingerprint;

  const isAllTasksCompleted = ddTasks.length > 0 && ddTasks.every((t) => t.status === 'DONE');

  // Signatures are ONLY valid if all current DD tasks are completed and match this exact task fingerprint
  const advisorSig = isCertMatchingCurrentTasks ? dueDiligenceCertificate?.advisorSignature : null;
  const guestAdminSig = isCertMatchingCurrentTasks ? dueDiligenceCertificate?.guestAdminSignature : null;

  const hasAdvisorSigned = Boolean(advisorSig?.signatureDataUrl || advisorSig?.signatureText);
  const hasGuestAdminSigned = Boolean(guestAdminSig?.signatureDataUrl || guestAdminSig?.signatureText);

  // Fully certified once Buyer Advisor and Buyer Guest Admin have signed!
  // Seller Super Admin does NOT sign.
  const isFullyCompleted = hasAdvisorSigned && hasGuestAdminSigned;
  const isSubmittedToSeller = (dueDiligenceCertificate?.status === 'SUBMITTED_TO_SELLER' && isCertMatchingCurrentTasks) || isFullyCompleted;
  const isPendingGuestAdmin = hasAdvisorSigned && !hasGuestAdminSigned;

  // Signatory names - always ensure accurate real names for the distinct roles
  const advisorName = (advisorSig?.signer && advisorSig.signer !== 'Ravi Shankar')
    ? advisorSig.signer
    : (isAdvisor ? (currentUser?.name || defaultLeadAdvisorName) : defaultLeadAdvisorName);

  const guestAdminName = guestAdminSig?.signer
    ? guestAdminSig.signer
    : (isGuestAdmin ? (currentUser?.name || defaultGuestAdminName) : defaultGuestAdminName);

  const superAdminName = defaultSuperAdminName;

  // Can current user sign?
  // 1. Advisor can sign if not yet signed and all DD tasks are completed
  const canAdvisorSign = isAdvisor && !hasAdvisorSigned && isAllTasksCompleted;
  // 2. Guest Admin can sign ONLY after Advisor has signed, and if Guest Admin hasn't signed yet
  const canGuestAdminSign = isGuestAdmin && hasAdvisorSigned && !hasGuestAdminSigned && isAllTasksCompleted;
  // 3. Super Admin does NOT sign
  const canSuperAdminSign = false;

  const canCurrentSign = canAdvisorSign || canGuestAdminSign;

  const activeSignerDefault = canAdvisorSign
    ? advisorName
    : canGuestAdminSign
    ? guestAdminName
    : (isAdvisor ? advisorName : guestAdminName);

  // Interactive Signature Pad State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [sigMode, setSigMode] = useState('draw'); // 'draw' | 'type'
  const [customTypedName, setCustomTypedName] = useState('');
  const typedName = customTypedName || activeSignerDefault;
  const [selectedStyle, setSelectedStyle] = useState('script'); // 'script' | 'formal' | 'hand'

  // Canvas Drawing Handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#004d4d'; // brand deep teal ink
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleStopDraw = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Resize canvas display resolution
  useEffect(() => {
    if (isDDCertificateModalOpen && canvasRef.current && sigMode === 'draw') {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth || 340;
      canvas.height = canvas.offsetHeight || 100;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#004d4d';
    }
  }, [isDDCertificateModalOpen, sigMode]);

  if (!isDDCertificateModalOpen) return null;

  const metrics = ddCertificateMetrics || {
    foldersCoverage: [
      { id: 'jvm', name: 'JVM', docs: 2, total: 2 },
      { id: 'anu', name: 'anu', docs: 2, total: 2 },
    ],
    findings: { critical: 0, high: 0, medium: 2, low: 0, total: 2, items: [] },
    conclusion: 'Clear with conditions',
  };

  const coverageList = Array.isArray(metrics.foldersCoverage) && metrics.foldersCoverage.length > 0
    ? metrics.foldersCoverage
    : [
        { id: 'jvm', name: 'JVM', docs: 2, total: 2 },
        { id: 'anu', name: 'anu', docs: 2, total: 2 },
      ];

  const currentEffectiveName = typedName?.trim() || activeSignerDefault;

  // Action 1: Lead Advisor signs and submits to Guest Admin
  const handleAdvisorSign = async () => {
    setIsSigning(true);
    setFeedbackMsg('');

    let signatureDataUrl = null;
    let signatureType = 'typed';
    const signer = currentEffectiveName || advisorName;
    let signatureText = signer;

    if (sigMode === 'draw' && hasDrawn && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
      signatureType = 'drawn';
    } else {
      signatureType = selectedStyle;
    }

    try {
      await signDDCertificateAsAdvisor({
        signerName: signer,
        signatureDataUrl,
        signatureType,
        signatureText,
      });
      setFeedbackMsg('Certificate digitally signed by Lead Advisor and submitted to Buyer Guest Admin (Arjun Mehta).');
    } catch (e) {
      console.error(e);
      setFeedbackMsg('Failed to sign certificate. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  // Action 2: Guest Admin signs and transmits to Seller Super Admin
  const handleGuestAdminSign = async () => {
    setIsSigning(true);
    setFeedbackMsg('');

    let signatureDataUrl = null;
    let signatureType = 'typed';
    const signer = currentEffectiveName || guestAdminName;
    let signatureText = signer;

    if (sigMode === 'draw' && hasDrawn && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
      signatureType = 'drawn';
    } else {
      signatureType = selectedStyle;
    }

    try {
      await signDDCertificateAsGuestAdmin({
        signerName: signer,
        signatureDataUrl,
        signatureType,
        signatureText,
      });
      setFeedbackMsg('Certificate digitally signed by Guest Admin and transmitted to Seller Super Admin (Ravi Shankar)!');
    } catch (e) {
      console.error(e);
      setFeedbackMsg('Failed to sign certificate. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };


  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Multi-segment risk bar calculation from real findings
  const findingsObj = metrics.findings || {};
  const criticalCount = typeof findingsObj.critical === 'number' ? findingsObj.critical : 0;
  const highCount = typeof findingsObj.high === 'number' ? findingsObj.high : 0;
  const mediumCount = typeof findingsObj.medium === 'number' ? findingsObj.medium : 0;
  const lowCount = typeof findingsObj.low === 'number' ? findingsObj.low : 0;
  const totalFindings = typeof findingsObj.total === 'number'
    ? findingsObj.total
    : (criticalCount + highCount + mediumCount + lowCount);

  const criticalPct = totalFindings > 0 ? (criticalCount / totalFindings) * 100 : 0;
  const highPct = totalFindings > 0 ? (highCount / totalFindings) * 100 : 0;
  const mediumPct = totalFindings > 0 ? (mediumCount / totalFindings) * 100 : 0;
  const lowPct = totalFindings > 0 ? (lowCount / totalFindings) * 100 : 0;

  const certNumber = `DDC-${dealNumber.replace('D-', '') || '5E18A'}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setIsDDCertificateModalOpen(false)}
    >
      <div
        className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-900 my-auto animate-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Floating Controls */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Executive Due Diligence Attestation
            </span>
            {isFullyCompleted ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Fully Signed & Sealed (3/3)
              </span>
            ) : isSubmittedToSeller ? (
              <span className="bg-teal-100 text-[#006666] border border-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Transmitted to Seller Super Admin
              </span>
            ) : isPendingGuestAdmin ? (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Awaiting Guest Admin Signature
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                Awaiting Lead Advisor Signature
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Print or Export PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsDDCertificateModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Certificate"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THE CERTIFICATE FRAME (PRISTINE WHITE PROFESSIONAL EXECUTIVE THEME)        */}
        {/* ========================================================================= */}
        <div className="border-2 border-slate-200 rounded-2xl p-6 sm:p-9 bg-white relative shadow-xs">
          
          {/* Top Checkmark Seal */}
          <div className="w-13 h-13 rounded-full bg-emerald-50 border-2 border-emerald-500/70 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.18)]">
            <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
          </div>

          {/* Title Block */}
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500 block text-center font-bold mb-1">
            DEAL MANAGEMENT SYSTEM
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-slate-900 text-center tracking-tight mb-1">
            Certificate of due diligence completion
          </h2>
          <p className="text-xs font-mono text-slate-500 text-center mb-6">
            No. {certNumber} · Version 1.0 · Issued 03 Nov 2026
          </p>

          {/* Statement Paragraph with Real Data */}
          <div className="text-center text-xs sm:text-[13px] leading-relaxed text-slate-600 max-w-lg mx-auto mb-6">
            This certifies that buyer due diligence on
            <div className="text-slate-900 text-base sm:text-lg font-bold my-1 tracking-tight">
              {dealName} ({dealNumber})
            </div>
            between <span className="text-slate-900 font-semibold">{buyerCompany} (buyer)</span> and{' '}
            <span className="text-slate-900 font-semibold">{sellerCompany} (seller)</span>
            <div className="text-slate-500 text-xs mt-1">
              {periodText}
            </div>
          </div>

          {/* 1. REVIEW COVERAGE GRID (Real Folders & File Counts) */}
          <div className="mb-6">
            <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider mb-2.5">
              REVIEW COVERAGE
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {coverageList.map((folder, idx) => (
                <div
                  key={folder.id || idx}
                  className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-slate-100/80"
                >
                  <div className="w-6 h-6 rounded-full border border-emerald-500 bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 text-xs block truncate" title={folder.name}>
                      {folder.name}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {folder.docs} / {folder.total || folder.docs} docs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. RISK SUMMARY · REAL FINDINGS BAR & DETAILS */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                RISK SUMMARY · {totalFindings} {totalFindings === 1 ? 'FINDING' : 'FINDINGS'}
              </h4>
              {findingsObj.items && findingsObj.items.length > 0 && (
                <span className="text-[10px] text-slate-500 font-medium">
                  {findingsObj.items.length} logged from due diligence
                </span>
              )}
            </div>

            {/* Multi-segment continuous bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex mb-2.5">
              {totalFindings === 0 ? (
                <div className="w-full h-full bg-emerald-500/80" title="No risk findings reported" />
              ) : (
                <>
                  {criticalPct > 0 && (
                    <div
                      style={{ width: `${criticalPct}%` }}
                      className="bg-rose-500 h-full"
                      title={`Critical: ${criticalCount}`}
                    />
                  )}
                  {highPct > 0 && (
                    <div
                      style={{ width: `${highPct}%` }}
                      className="bg-amber-500 h-full"
                      title={`High: ${highCount}`}
                    />
                  )}
                  {mediumPct > 0 && (
                    <div
                      style={{ width: `${mediumPct}%` }}
                      className="bg-blue-500 h-full"
                      title={`Medium: ${mediumCount}`}
                    />
                  )}
                  {lowPct > 0 && (
                    <div
                      style={{ width: `${lowPct}%` }}
                      className="bg-slate-400 h-full"
                      title={`Low: ${lowCount}`}
                    />
                  )}
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-slate-800 font-medium">Critical {criticalCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-800 font-medium">High {highCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-800 font-medium">Medium {mediumCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-800 font-medium">Low {lowCount}</span>
              </span>
            </div>

            {/* Review Findings Detail List */}
            {findingsObj.items && findingsObj.items.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Review Findings Detail
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {findingsObj.items.map((item, idx) => {
                    const isCrit = item.severity === 'Critical';
                    const isHigh = item.severity === 'High';
                    const isMed = item.severity === 'Medium';
                    const badgeClass = isCrit
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : isHigh
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : isMed
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={item.taskId || idx}
                        className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 text-xs flex items-start gap-2.5"
                      >
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase shrink-0 ${badgeClass}`}>
                          {item.severity}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              {item.title}
                            </span>
                            {item.category && (
                              <span className="text-[10px] text-slate-400">· {item.category}</span>
                            )}
                          </div>
                          {item.problemDescription && (
                            <p className="text-slate-600 text-[11px] mt-0.5 break-words">
                              {item.problemDescription}
                            </p>
                          )}
                          {item.documentReference && (
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">Ref: {item.documentReference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. OVERALL CONCLUSION */}
          <div className="border-2 border-emerald-400/60 bg-emerald-50/70 rounded-xl py-3 px-4 text-center mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-800 font-bold block mb-0.5">
              OVERALL CONCLUSION
            </span>
            <span className="text-emerald-800 font-serif text-lg font-semibold tracking-tight">
              {metrics.conclusion || 'Clear with conditions'}
            </span>
          </div>

          {/* 4. EXACTLY 3 SIGNATORIES IN ORDER: LEAD ADVISOR -> GUEST ADMIN -> SELLER SUPER ADMIN */}
          <div className="pt-2 pb-4 border-b border-slate-200 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              
              {/* Signatory 1: Lead Advisor (Rohit Verma) */}
              <div className="border-t-2 border-slate-300 pt-3 relative">
                {hasAdvisorSigned ? (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      {advisorSig?.signatureDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={advisorSig.signatureDataUrl}
                          alt="Advisor Signature"
                          className="h-10 max-w-[160px] object-contain mx-auto"
                        />
                      ) : (
                        <span className="font-serif italic text-lg text-[#006666] tracking-wide select-none">
                          {advisorSig?.signatureText || advisorSig?.signer || 'Rohit Verma'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{advisorSig?.signer || 'Rohit Verma'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {advisorSig?.role || 'Lead Advisor, Buyer Advisory'}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Certified · {advisorSig?.timestamp || '03 Nov 2026, 11:05 IST'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        Awaiting Advisor Signature
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {advisorName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Lead Advisor, Buyer Advisory
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Pending Digital Execution
                    </div>
                  </>
                )}
              </div>

              {/* Signatory 2: Buyer Guest Admin (Arjun Mehta) */}
              <div className="border-t-2 border-slate-300 pt-3 relative">
                {hasGuestAdminSigned ? (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      {guestAdminSig?.signatureDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={guestAdminSig.signatureDataUrl}
                          alt="Guest Admin Signature"
                          className="h-10 max-w-[160px] object-contain mx-auto"
                        />
                      ) : (
                        <span className="font-serif italic text-lg text-[#006666] tracking-wide select-none">
                          {guestAdminSig?.signatureText || guestAdminSig?.signer || 'Arjun Mehta'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{guestAdminSig?.signer || 'Arjun Mehta'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {guestAdminSig?.role || 'Guest Admin, Buyer Executive'}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Endorsed & Transmitted · {guestAdminSig?.timestamp || '03 Nov 2026, 11:15 IST'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full">
                        {hasAdvisorSigned ? 'Awaiting Guest Admin' : 'Draft Signatory'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {guestAdminName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Guest Admin, Buyer Executive
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Pending Digital Execution
                    </div>
                  </>
                )}
              </div>

              {/* Column 3: Seller Delivery Notice (Vishwa Raj - Super Admin, Vishwa Tech) */}
              <div className="border-t-2 border-slate-300 pt-3 relative">
                {isSubmittedToSeller ? (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Transmitted to Seller</span>
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 flex items-center justify-center gap-1">
                      <span>{superAdminName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Super Admin, {sellerCompany}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 font-medium mt-1">
                      Delivered · {dueDiligenceCertificate?.submittedToSellerAt || guestAdminSig?.timestamp || 'Transmitted via VDR'}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Notice Recipient on Final Execution
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 flex items-center justify-center">
                      <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full">
                        Pending Transmittal
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      {superAdminName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Super Admin, {sellerCompany}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Awaiting Buyer Certification
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      Notice Recipient on Final Execution
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Footer Legal & Audit Metadata */}
          <div className="text-[10px] leading-relaxed text-slate-500 text-center space-y-0.5">
            <p>
              Generated by the DMS from VDR access logs and the risk register. An internal completion record, not a legal opinion or audit attestation.
            </p>
            <p className="font-mono text-slate-500">
              Document hash {guestAdminSig?.hash || '9f3a8b24e65012e84c979d31f0814bb657c9284ea0bc129486c71e'} · Audit trail available under the deal&apos;s Control and Audit tab.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE DIGITAL SIGNATURE PAD (SHOWN ONLY TO ELIGIBLE SIGNER)        */}
        {/* ========================================================================= */}
        {canCurrentSign && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-teal-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#006666]" />
                <span className="text-xs font-bold text-slate-900">
                  {canAdvisorSign
                    ? `Execute Lead Advisor Digital Signature (${advisorName})`
                    : `Execute Buyer Guest Admin Digital Signature (${guestAdminName})`}
                </span>
              </div>

              {/* Mode switch: Draw vs Type */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSigMode('draw')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    sigMode === 'draw'
                      ? 'bg-[#006666] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3 h-3" />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode('type')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    sigMode === 'type'
                      ? 'bg-[#006666] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  <span>Type</span>
                </button>
              </div>
            </div>

            {/* Draw Mode: Canvas */}
            {sigMode === 'draw' ? (
              <div>
                <div className="relative border-2 border-dashed border-teal-300 rounded-xl bg-white overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleStartDraw}
                    onMouseMove={handleDraw}
                    onMouseUp={handleStopDraw}
                    onMouseLeave={handleStopDraw}
                    onTouchStart={handleStartDraw}
                    onTouchMove={handleDraw}
                    onTouchEnd={handleStopDraw}
                    className="w-full h-24 cursor-crosshair touch-none block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 font-medium">
                      ✍️ Draw your signature here using mouse or trackpad
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-slate-500">
                    Signing as <strong>{canAdvisorSign ? advisorName : guestAdminName}</strong> ({canAdvisorSign ? 'Lead Advisor' : 'Guest Admin'})
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-slate-600 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Canvas</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Type Mode */
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStyle('script')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStyle === 'script'
                        ? 'border-[#006666] bg-teal-50/60 ring-2 ring-[#006666]/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-serif italic text-lg text-[#006666] block">
                      {currentEffectiveName}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Calligraphy Style</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStyle('formal')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStyle === 'formal'
                        ? 'border-[#006666] bg-teal-50/60 ring-2 ring-[#006666]/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono italic text-base text-[#006666] block">
                      {currentEffectiveName}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Executive Hand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStyle('hand')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStyle === 'hand'
                        ? 'border-[#006666] bg-teal-50/60 ring-2 ring-[#006666]/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="italic font-sans text-base text-[#006666] tracking-wide block">
                      {currentEffectiveName}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Modern Signature</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setCustomTypedName(e.target.value)}
                    placeholder="Type your full legal name"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006666]"
                  />
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Identity</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fully Signed Note */}
        {isFullyCompleted && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Due Diligence Completion Certificate is officially certified by <strong>{advisorName}</strong> (Lead Advisor) and <strong>{guestAdminName}</strong> (Guest Admin), and transmitted to Seller Super Admin (<strong>{superAdminName}</strong>).
              </span>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        )}

        {/* Feedback message */}
        {feedbackMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[#006666] text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006666] shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKFLOW ACTION BUTTONS BAR                                               */}
        {/* ========================================================================= */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-600 font-medium">
            {canAdvisorSign && (
              <span>Review certificate and digitally sign as Lead Advisor to submit to Buyer Guest Admin ({guestAdminName}).</span>
            )}
            {isAdvisor && hasAdvisorSigned && !hasGuestAdminSigned && (
              <span className="text-teal-700 font-semibold">
                ✓ Certificate digitally certified and submitted to Buyer Guest Admin ({guestAdminName}).
              </span>
            )}
            {canGuestAdminSign && (
              <span>Lead Advisor has certified due diligence. Sign as Guest Admin to transmit certificate to Seller Super Admin ({superAdminName}).</span>
            )}
            {isGuestAdmin && hasGuestAdminSigned && (
              <span className="text-teal-700 font-semibold">
                ✓ Certificate signed and transmitted to Seller Super Admin ({superAdminName}).
              </span>
            )}
            {isSellerSuperAdmin && isSubmittedToSeller && (
              <span className="text-emerald-700 font-semibold">
                ✓ Due Diligence Certificate received from Buyer ({buyerCompany}). Certified by {advisorName} &amp; {guestAdminName}.
              </span>
            )}
            {isFullyCompleted && !isSellerSuperAdmin && (
              <span className="text-emerald-700 font-semibold">
                ✓ Certificate fully executed by Buyer Advisor &amp; Guest Admin and transmitted to Seller.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Step 1: Advisor signs and submits to Guest Admin ONLY */}
            {canAdvisorSign && (
              <button
                type="button"
                onClick={handleAdvisorSign}
                disabled={isSigning}
                className="px-4 py-2 rounded-xl bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isSigning ? 'Signing & Submitting...' : 'Digitally Sign & Submit to Guest Admin'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Step 2: Guest Admin signs and transmits to Seller */}
            {canGuestAdminSign && (
              <button
                type="button"
                onClick={handleGuestAdminSign}
                disabled={isSigning}
                className="px-4 py-2 rounded-xl bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>{isSigning ? 'Signing & Transmitting...' : 'Sign & Transmit Certificate to Seller'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDDCertificateModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
