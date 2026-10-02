"use client";

import React from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import {
  Lock,
  Globe,
  FileText,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck2,
  AlertCircle,
  CheckSquare
} from 'lucide-react';

export default function TaskCard({ task, onCardClick }) {
  const {
    currentUser,
    isAuditModeActive,
    canUserClaimTask,
    canUserSubmitForReview,
    canUserApproveTask,
    claimTask,
    submitForReview,
    approveAndComplete,
    setSigningModalTask,
    setCertificateModalTask,
  } = useDealWorkflow();

  const isInternal = task.visibility === 'INTERNAL';
  const isCreatorParty = currentUser.side === task.creator_side;
  const isTargetParty = currentUser.side === task.target_side;

  const canClaim = canUserClaimTask(task);
  const canSubmit = canUserSubmitForReview(task);
  const canApprove = canUserApproveTask(task);

  // Special case: If task has linked document requiring signature (like NDA) and is in progress for the buyer legal assignee
  const isSigningEligible =
    task.linked_document &&
    task.status === 'IN_PROGRESS' &&
    (task.assigned_to_user === currentUser.name || currentUser.role.includes('Admin')) &&
    isTargetParty &&
    !task.digital_signature;

  // Priority color styling
  const priorityStyles = {
    High: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // Visibility explanation label based on prompt UX rule #18
  const visibilityBadge = isInternal ? (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
      title={`Visible only to ${task.creator_company}. Hidden from opposite party.`}
    >
      <Lock className="w-3 h-3 text-slate-500" />
      <span>Internal — {task.creator_company}</span>
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200"
      title={`Shared between ${task.creator_company} and ${task.target_company}.`}
    >
      <Globe className="w-3 h-3 text-purple-600" />
      <span>External — {task.assigned_to_group}</span>
    </span>
  );

  return (
    <div
      onClick={() => onCardClick?.(task)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-md transition-all duration-200 p-4 cursor-pointer flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Accent Stripe based on status and side */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] ${task.status === 'DONE'
          ? 'bg-emerald-500'
          : task.status === 'REVIEW'
            ? 'bg-amber-500'
            : task.status === 'IN_PROGRESS'
              ? 'bg-blue-600'
              : 'bg-slate-300'
          }`}
      />

      {/* Header: ID, Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {task.task_id}
            </span>
            {/* Origin indicator if external */}
            {!isInternal && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100 flex items-center gap-1">
                <Building2 className="w-2.5 h-2.5 text-slate-400" />
                From: {task.creator_company}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {task.title}
        </h3>

        {/* Visibility Badge & Department */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {visibilityBadge}
          <span className="text-[11px] font-medium text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
            {task.department || task.workstream}
          </span>
          <span className="text-[11px] font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/60">
            {task.deal_stage}
          </span>
        </div>

        {/* Assigned Group & User metadata */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              Assigned Group:
            </span>
            <span className="font-semibold text-slate-800 text-[11px] text-right truncate max-w-[140px]">
              {task.assigned_to_group}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              Assignee:
            </span>
            <span className="font-medium text-slate-700 text-[11px] text-right truncate max-w-[140px]">
              {task.assigned_to_user ? (
                <span className="font-semibold text-slate-900">{task.assigned_to_user}</span>
              ) : (
                <span className="text-slate-400">Unassigned (Claimable)</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Due Date:
            </span>
            <span className="font-medium text-slate-700 text-[11px]">
              {task.due_date}
            </span>
          </div>
        </div>

        {/* Subtasks Count Pill if present */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-teal-50/70 border border-teal-100 text-[11px] text-[#006666] mb-3">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#006666] shrink-0" />
              <span className="font-semibold">Subtasks</span>
            </div>
            <span className="font-bold text-[10px] bg-white px-1.5 py-0.2 rounded border border-teal-200">
              {task.subtasks.filter((s) => s.status === 'DONE').length}/{task.subtasks.length}
            </span>
          </div>
        )}

        {/* Linked Document Pill if present */}
        {task.linked_document && (
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-50/50 border border-blue-100/80 text-[11px] text-blue-800 mb-3">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate font-medium">{task.linked_document}</span>
            </div>
            {task.digital_signature && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded shrink-0">
                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                Signed
              </span>
            )}
          </div>
        )}

        {/* Audit Mode Information Pill (When Audit Mode is ON) */}
        {isAuditModeActive && (
          <div className="mb-3 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1 text-amber-800">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Forensic Audit Trail
              </span>
              <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-amber-200">
                {task.audit_trail.length} Logs
              </span>
            </div>
            {task.digital_signature ? (
              <div className="text-[10px] leading-tight pt-1 border-t border-amber-200/60 font-mono text-amber-800">
                <div>Signer: {task.digital_signature.signer}</div>
                <div>IP: {task.digital_signature.ip}</div>
                <div>Hash: {task.digital_signature.hash.substring(0, 18)}...</div>
              </div>
            ) : (
              <div className="text-[10px] text-amber-700">
                Last modified by: {task.audit_trail[task.audit_trail.length - 1]?.performed_by} ({task.audit_trail[task.audit_trail.length - 1]?.ip})
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer & Dynamic Status Actions */}
      <div
        className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto"
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking action button
      >
        {/* Status Indicator text */}
        <div className="text-[11px]">
          {task.status === 'DONE' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {task.completed_by ? `${task.completed_by} — Done` : 'Completed ✓'}
            </span>
          ) : task.status === 'REVIEW' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Waiting for Review
            </span>
          ) : task.status === 'IN_PROGRESS' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              In Progress
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              To Do
            </span>
          )}
        </div>

        {/* Action Buttons based on status & role */}
        <div>
          {task.status === 'TO_DO' && (
            canClaim ? (
              <button
                onClick={() => claimTask(task.task_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C7F9F] hover:bg-[#166882] text-white text-xs font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <span>Claim Task</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
                {(currentUser.name && task.created_by && currentUser.name.trim().toLowerCase() === task.created_by.trim().toLowerCase())
                  ? `Tracking · Assigned to ${task.assigned_to_group}`
                  : `Assigned to ${task.assigned_to_group}`}
              </span>
            )
          )}

          {task.status === 'IN_PROGRESS' && (
            isSigningEligible ? (
              <button
                onClick={() => setSigningModalTask(task)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C7F9F] hover:bg-[#166882] text-white text-xs font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <span>Submit Review</span>
              </button>
            ) : canSubmit ? (
              <button
                onClick={() => submitForReview(task.task_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C7F9F] hover:bg-[#166882] text-white text-xs font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <span>Submit Review</span>
              </button>
            ) : (
              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" />
                <span>In Motion: {task.assigned_to_user || task.assigned_to_group}</span>
              </span>
            )
          )}

          {task.status === 'REVIEW' && (
            canApprove ? (
              <button
                onClick={() => approveAndComplete(task.task_id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Approve & Complete</span>
              </button>
            ) : (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Awaiting Review</span>
              </span>
            )
          )}

          {task.status === 'DONE' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Marked as Done</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
