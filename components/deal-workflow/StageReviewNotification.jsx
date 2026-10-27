"use client";

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  FileCheck2,
  RotateCcw,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useDealWorkflow, normalizeRole, getNextStage } from './DealWorkflowContext';
import StageQueryModal from './StageQueryModal';

export default function StageReviewNotification({ inDropdown = false }) {
  const {
    currentUser,
    activeDealStage,
    stageTrackerInfo,
    stageQuery,
    clearStageQuery,
    approveStageAndAdvance,
    tasks,
    normalizeStage,
    stageAdvanceRequest,
    requestSuperAdminStageAdvance,
  } = useDealWorkflow();

  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const normRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = normRole === 'super_admin';
  const isAdmin = normRole === 'admin';

  // Get active stage details from stageTrackerInfo
  const activeStageObj = stageTrackerInfo?.stages?.find(
    (s) => normalizeStage(s.name) === normalizeStage(activeDealStage)
  );

  const totalTasks = activeStageObj?.total || 0;
  const doneTasks = activeStageObj?.done || 0;
  const isStageAllDone = totalTasks > 0 && doneTasks === totalTasks;
  const nextStage = getNextStage(activeDealStage);

  const isPendingRequest = Boolean(
    stageAdvanceRequest &&
    stageAdvanceRequest.status === 'PENDING_SUPER_ADMIN_APPROVAL' &&
    normalizeStage(stageAdvanceRequest.stage) === normalizeStage(activeDealStage)
  );

  // Check if an active query exists for the current stage
  const hasActiveQuery = Boolean(
    stageQuery &&
    stageQuery.status === 'PENDING_RESOLUTION' &&
    normalizeStage(stageQuery.stage) === normalizeStage(activeDealStage)
  );

  const handleApprove = async () => {
    if (!nextStage) return;
    setIsAdvancing(true);
    try {
      await approveStageAndAdvance(nextStage);
    } catch (e) {
      console.error('Error advancing stage:', e);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleAdminRequest = async () => {
    if (!nextStage) return;
    setIsRequesting(true);
    try {
      await requestSuperAdminStageAdvance({ stage: activeDealStage, nextStage });
    } catch (e) {
      console.error('Error requesting super admin:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  // Case 1: Super Admin has an active query pending resolution
  if (hasActiveQuery) {
    return (
      <>
        <div className={inDropdown ? "w-full" : "px-4 sm:px-6 lg:px-8 mb-3"}>
          <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 text-amber-950 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Super Admin Review Query
                    </span>
                    <span className="text-xs text-amber-700">
                      Stage: <strong className="text-amber-950">{stageQuery.stage}</strong>
                    </span>
                    {stageQuery.createdAt && (
                      <span className="text-[11px] text-amber-600/90 font-mono">
                        · {new Date(stageQuery.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-amber-950 mt-1">
                    Super Admin Query on {stageQuery.stage} Stage Results
                  </h3>

                  {/* Query message card */}
                  <div className="mt-2 p-3 bg-white border border-amber-200/80 rounded-xl text-slate-800 text-xs sm:text-[13px] leading-relaxed shadow-2xs">
                    <div className="font-semibold text-slate-900 mb-0.5 flex items-center gap-1.5 text-xs text-amber-900">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>{stageQuery.queryBy || 'Super Admin'} specified:</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{stageQuery.queryText}</p>
                  </div>

                  {/* Targeted tasks notice if any */}
                  {Array.isArray(stageQuery.targetTaskIds) && stageQuery.targetTaskIds.length > 0 && (
                    <div className="mt-2 text-[11px] text-amber-800 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold">Reopened tasks for rework:</span>
                      {stageQuery.targetTaskIds.map((tid) => (
                        <span key={tid} className="bg-amber-100 px-1.5 py-0.2 rounded font-mono text-[10px] text-amber-900 font-medium">
                          {tid}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isSuperAdmin && (
                    <p className="text-xs text-amber-800/90 mt-2">
                      Please address this query and update the relevant tasks. Once resolved, Super Admin will review and enable the next stage.
                    </p>
                  )}
                </div>
              </div>

              {/* Super Admin Query Actions */}
              {isSuperAdmin && (
                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={clearStageQuery}
                    className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/60 text-amber-900 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Mark query as resolved"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Clear / Resolve Query</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQueryModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-100/60 hover:bg-amber-200 text-amber-900 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Edit Query</span>
                  </button>
                  {isStageAllDone && nextStage && (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isAdvancing}
                      className="px-3.5 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Results OK — Enable {nextStage}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <StageQueryModal
          isOpen={isQueryModalOpen}
          onClose={() => setIsQueryModalOpen(false)}
          stageName={activeDealStage}
        />
      </>
    );
  }

  // Case 2: All tasks in the active stage are completed
  if (isStageAllDone) {
    // Only show to Super Admin if Admin has sent the advance request
    if (isSuperAdmin && !isPendingRequest) {
      return null;
    }

    return (
      <>
        <div className={inDropdown ? "w-full" : "px-4 sm:px-6 lg:px-8 mb-3"}>
          {isSuperAdmin ? (
            /* ============================================================= */
            /* SUPER ADMIN REVIEW CARD: RESULTS OK OR INFORM QUERY          */
            /* ============================================================= */
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 sm:p-4.5 text-slate-900 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col justify-between gap-3">
              {/* Top: Message spanning full width */}
              <div>
                {stageAdvanceRequest?.requestedBy && (
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="bg-teal-100 text-[#006666] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Stage Advance Request
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Requested by Admin: <strong className="text-slate-900">{stageAdvanceRequest.requestedBy}</strong>
                    </span>
                    {stageAdvanceRequest.createdAt && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        · {new Date(stageAdvanceRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  All {activeDealStage} tasks are completed! Please review results to enable next stage.
                </h3>
                {stageAdvanceRequest?.requestedBy && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Admin <strong className="text-slate-800">{stageAdvanceRequest.requestedBy}</strong> has requested to enable {nextStage ? `the ${nextStage} stage` : 'next stage'}.
                  </p>
                )}
              </div>

              {/* Bottom: Buttons on Left Side and Metric Badge in Right Corner */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80 flex-wrap">
                {/* Left side: Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Results NOT OK Button: Opens Query Modal */}
                  <button
                    type="button"
                    onClick={() => setIsQueryModalOpen(true)}
                    className="px-3.5 py-2 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-xs font-semibold shadow-2xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Results Not OK — Inform Query</span>
                  </button>

                  {/* Results OK Button: Enables Next Stage */}
                  {nextStage ? (
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={isAdvancing}
                      className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span>{isAdvancing ? 'Enabling...' : `Results OK — Enable ${nextStage}`}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Final Stage Complete</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            /* ============================================================= */
            /* ADMIN VIEW: REQUEST SUPER ADMIN TO ENABLE NEXT STAGE          */
            /* ============================================================= */
            isPendingRequest ? (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 sm:p-4 text-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Request Sent to Super Admin</span>
                      <span className="text-[10px] bg-teal-100 text-[#006666] px-2 py-0.5 rounded-full font-semibold">
                        Pending Review
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      You have requested Super Admin to enable the next stage{nextStage ? ` (${nextStage})` : ''}. Awaiting Super Admin review.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-teal-800 bg-white border border-teal-200/80 px-2.5 py-1 rounded-lg shrink-0">
                  Awaiting Super Admin Review
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 sm:p-4.5 text-slate-900 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                        All {activeDealStage} tasks are completed!
                      </h3>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-semibold">
                        100% Done
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      You need to request super admin to enable the next stage{nextStage ? ` (${nextStage})` : ''}.
                    </p>
                  </div>
                </div>

                {nextStage && (
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/80 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAdminRequest}
                      disabled={isRequesting}
                      className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span>{isRequesting ? 'Sending Request...' : 'Request Super Admin'}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <span className="text-[11px] font-semibold text-slate-500">
                      Super Admin will be notified
                    </span>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ============================================================= */
            /* NON-ADMIN VIEW: AWAITING SUPER ADMIN REVIEW                   */
            /* ============================================================= */
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 sm:p-4 text-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>All {activeDealStage} Tasks Completed!</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-semibold">
                      100% Done
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Awaiting Super Admin to review the stage completion results and enable the next stage {nextStage ? `(${nextStage})` : ''}.
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-teal-800 bg-white border border-teal-200/80 px-2.5 py-1 rounded-lg shrink-0">
                Awaiting Super Admin Review
              </span>
            </div>
          )}
        </div>

        <StageQueryModal
          isOpen={isQueryModalOpen}
          onClose={() => setIsQueryModalOpen(false)}
          stageName={activeDealStage}
        />
      </>
    );
  }

  return null;
}
