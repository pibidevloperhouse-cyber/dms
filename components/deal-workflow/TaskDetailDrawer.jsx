"use client";

import React, { useState } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { 
  X, 
  Lock, 
  Globe, 
  Calendar, 
  User, 
  Users, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  FileCheck2, 
  Eye, 
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

export default function TaskDetailDrawer() {
  const {
    currentUser,
    selectedTask,
    setSelectedTask,
    isAuditModeActive,
    canUserClaimTask,
    canUserSubmitForReview,
    canUserApproveTask,
    claimTask,
    submitForReview,
    approveAndComplete,
    addComment,
    setSigningModalTask,
    setCertificateModalTask,
  } = useDealWorkflow();

  const [commentText, setCommentText] = useState('');
  const [commentScope, setCommentScope] = useState('INTERNAL'); // 'INTERNAL' or 'EXTERNAL'
  const [isAuditCollapsed, setIsAuditCollapsed] = useState(false);

  if (!selectedTask) return null;

  const isInternal = selectedTask.visibility === 'INTERNAL';
  const isCreatorSide = currentUser.side === selectedTask.creator_side;
  const isTargetSide = currentUser.side === selectedTask.target_side;

  const canClaim = canUserClaimTask(selectedTask);
  const canSubmit = canUserSubmitForReview(selectedTask);
  const canApprove = canUserApproveTask(selectedTask);

  const isSigningEligible = 
    selectedTask.linked_document && 
    selectedTask.status === 'IN_PROGRESS' && 
    (selectedTask.assigned_to_user === currentUser.name || currentUser.role.includes('Admin')) &&
    isTargetSide &&
    !selectedTask.digital_signature;

  // Filter comments based on permission scope (Rule 3 & 17)
  // Internal comments are strictly visible ONLY to the company that wrote them!
  const visibleComments = (selectedTask.comments || []).filter((c) => {
    if (c.scope === 'INTERNAL') {
      return c.company === currentUser.company;
    }
    return true; // EXTERNAL comments are visible to both parties
  });

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(selectedTask.task_id, commentText, commentScope);
    setCommentText('');
  };

  const statusSteps = ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const currentStepIndex = statusSteps.indexOf(selectedTask.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div 
        className="absolute inset-0" 
        onClick={() => setSelectedTask(null)} 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-300">
          
          {/* ========================================================================= */}
          {/* DRAWER TOP BAR */}
          {/* ========================================================================= */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {selectedTask.task_id}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                selectedTask.priority === 'High' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedTask.priority} Priority
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedTask.status === 'DONE' && (
                <button
                  onClick={() => setCertificateModalTask(selectedTask)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Compliance Certificate</span>
                </button>
              )}
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DRAWER CONTENT BODY */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
            
            {/* Header Information */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedTask.title}
              </h2>
              {selectedTask.description && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedTask.description}
                </p>
              )}
            </div>

            {/* Workflow Progress Stepper */}
            <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Controlled Workflow Stage
              </p>
              <div className="grid grid-cols-4 gap-1 relative">
                {statusSteps.map((step, idx) => {
                  const isPassed = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                        isCurrent 
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                          : isPassed 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isPassed && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${
                        isCurrent ? 'text-blue-700' : isPassed ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button inside drawer for easy progression */}
              <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Current Status: <strong className="text-slate-900 capitalize">{selectedTask.status.replace('_', ' ').toLowerCase()}</strong>
                </span>

                <div>
                  {selectedTask.status === 'TO_DO' && canClaim && (
                    <button
                      onClick={() => claimTask(selectedTask.task_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                    >
                      <span>Claim Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {selectedTask.status === 'IN_PROGRESS' && (
                    isSigningEligible ? (
                      <button
                        onClick={() => setSigningModalTask(selectedTask)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Review & Sign NDA</span>
                      </button>
                    ) : canSubmit ? (
                      <button
                        onClick={() => submitForReview(selectedTask.task_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                      >
                        <span>Submit for Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null
                  )}

                  {selectedTask.status === 'REVIEW' && canApprove && (
                    <button
                      onClick={() => approveAndComplete(selectedTask.task_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Two-Sided Ownership & Visibility Scope Banner */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Two-Party Deal Assignment
                </span>
                {isInternal ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3 text-slate-600" />
                    Internal — {selectedTask.creator_company}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    <Globe className="w-3 h-3 text-blue-600" />
                    External Deal Task
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Created By:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTask.created_by} ({selectedTask.creator_role})
                  </span>
                  <div className="text-[10px] text-slate-500">{selectedTask.creator_company}</div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Assigned Group:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTask.assigned_to_group}
                  </span>
                  <div className="text-[10px] text-slate-500">Target: {selectedTask.target_company}</div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Assigned Individual:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTask.assigned_to_user || 'Unassigned (Role Claimable)'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Due Date:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {selectedTask.due_date}
                  </span>
                </div>
              </div>

              {/* Explanatory security callout */}
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {isInternal
                    ? `Confidential item owned strictly by ${selectedTask.creator_company}. Opposite party cannot inspect or claim this task.`
                    : `Dispatched item bridging ${selectedTask.creator_company} and ${selectedTask.target_company}. Opposite party sees status but not private internal company notes.`}
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 13. DOCUMENTS SECTION */}
            {/* ========================================================================= */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Transaction Documents
                </h3>
              </div>

              {selectedTask.linked_document ? (
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{selectedTask.linked_document}</p>
                      <p className="text-[10px] text-slate-400">PDF Document • Virtual Data Room Room Index #1.04</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSigningModalTask(selectedTask)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Preview</span>
                    </button>

                    {isSigningEligible && (
                      <button
                        onClick={() => setSigningModalTask(selectedTask)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Sign</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-slate-100">
                  No document attached to this task.
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 13. ACTIVITY TIMELINE */}
            {/* ========================================================================= */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Activity Timeline & Audit Trail
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-6">
                {(selectedTask.audit_trail || []).map((ev, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{ev.action}</span>
                        <span className="text-slate-400 text-[10px]">{ev.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Performed by <strong className="text-slate-800">{ev.performed_by}</strong> ({ev.role})
                        {isAuditModeActive && ev.ip && (
                          <span className="ml-1.5 font-mono text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            IP: {ev.ip}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 13. SCOPED COMMENTS SECTION */}
            {/* ========================================================================= */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  Collaboration & Notes
                </h3>
                <span className="text-[10px] text-slate-400">
                  {visibleComments.length} notes in current scope
                </span>
              </div>

              {/* Comments stream */}
              <div className="space-y-2.5 mb-3">
                {visibleComments.length === 0 ? (
                  <div className="p-3 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-slate-100 text-center">
                    No comments in this scope yet.
                  </div>
                ) : (
                  visibleComments.map((c) => {
                    const isInternalNote = c.scope === 'INTERNAL';
                    return (
                      <div 
                        key={c.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isInternalNote 
                            ? 'bg-amber-50/40 border-amber-200/80' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{c.author}</span>
                            <span className="text-slate-400">({c.company})</span>
                            {isInternalNote ? (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Private to {c.company}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 flex items-center gap-0.5">
                                <Globe className="w-2.5 h-2.5" /> Shared Across Parties
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                        </div>
                        <p className="text-slate-700 leading-normal">{c.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleSendComment} className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Add Discussion Note:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="commentScope" 
                        value="INTERNAL" 
                        checked={commentScope === 'INTERNAL'} 
                        onChange={() => setCommentScope('INTERNAL')} 
                      />
                      <span className="font-medium text-slate-700">Internal Note ({currentUser.company} only)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="commentScope" 
                        value="EXTERNAL" 
                        checked={commentScope === 'EXTERNAL'} 
                        onChange={() => setCommentScope('EXTERNAL')} 
                      />
                      <span className="font-medium text-slate-700">Shared with Counterparty</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      commentScope === 'INTERNAL' 
                        ? `Private note visible ONLY to ${currentUser.company} users...` 
                        : "Message visible to both Seller & Buyer..."
                    }
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ========================================================================= */}
            {/* 12 & 13. AUDIT / COMPLIANCE COLLAPSIBLE SECTION */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-amber-300 bg-amber-50/50 overflow-hidden">
              <button
                onClick={() => setIsAuditCollapsed(!isAuditCollapsed)}
                className="w-full px-4 py-3 flex items-center justify-between text-left font-bold text-amber-900 text-xs bg-amber-100/60"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>M&A Forensic Compliance & Audit Log</span>
                  {isAuditModeActive && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                {isAuditCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              {!isAuditCollapsed && (
                <div className="p-4 space-y-2.5 text-xs text-amber-950 font-mono">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-amber-700 block font-sans font-bold">Deal Identifier:</span>
                      <span>#DL-2026-TITAN-M&A</span>
                    </div>
                    <div>
                      <span className="text-amber-700 block font-sans font-bold">Chain of Custody Status:</span>
                      <span className="text-emerald-700 font-bold">VERIFIED IMMUTABLE</span>
                    </div>
                  </div>

                  {selectedTask.digital_signature ? (
                    <div className="p-3 rounded-lg bg-white border border-amber-200 space-y-1 text-[11px]">
                      <div className="font-sans font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Digital Execution Verification
                      </div>
                      <div>Signer: <strong className="font-sans text-slate-900">{selectedTask.digital_signature.signer}</strong> ({selectedTask.digital_signature.role})</div>
                      <div>Timestamp: {selectedTask.digital_signature.timestamp}</div>
                      <div>IP Address: {selectedTask.digital_signature.ip}</div>
                      <div className="break-all text-[10px] text-slate-500">Hash: {selectedTask.digital_signature.hash}</div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 font-sans italic">
                      Task in progress. No digital signature applied yet.
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-[10px] text-amber-800 font-sans">
                    <span>Audit Trail Log Entries: {selectedTask.audit_trail?.length || 0}</span>
                    <button
                      onClick={() => setCertificateModalTask(selectedTask)}
                      className="font-bold text-amber-900 hover:underline flex items-center gap-1"
                    >
                      Export Audit Certificate <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
