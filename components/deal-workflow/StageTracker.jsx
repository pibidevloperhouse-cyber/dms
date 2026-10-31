"use client";

import React from 'react';
import { useDealWorkflow, normalizeRole } from './DealWorkflowContext';
import { CheckCircle2, Lock, Zap } from 'lucide-react';

export default function StageTracker() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    stageTrackerInfo,
    selectedDealStage,
    setSelectedDealStage,
    activeDealStage,
    activateStage,
    currentUser,
    trackingSection,
    normalizeStage,
    requestSuperAdminStageAdvance,
  } = useDealWorkflow();

  const [adminRequestModal, setAdminRequestModal] = React.useState({ isOpen: false, targetStage: '' });
  const [isSubmittingReq, setIsSubmittingReq] = React.useState(false);
  const [reqSuccess, setReqSuccess] = React.useState(false);

  if (!mounted || !stageTrackerInfo || !stageTrackerInfo.stages) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['Preparation', 'Due Diligence', 'Negotiation'].map((name, idx) => (
          <div
            key={name}
            className="bg-white rounded-2xl py-3 px-3.5 sm:py-3.5 sm:px-4 border border-slate-200 min-h-[96px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                  {idx + 1}
                </div>
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-600">{name}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const { stages } = stageTrackerInfo;
  const isBuyerSide = currentUser?.side === 'buyer';
  const normRole = normalizeRole(currentUser?.role);
  const isSuperAdmin = normRole === 'super_admin' || normRole === 'guest_admin';
  const isAdmin = normRole === 'admin' || normRole === 'advisor';

  const handleAdminToggle = (stage) => {
    if (stage.isActive) return;
    const activeStageObj = stages.find((s) => normalizeStage(s.name) === normalizeStage(activeDealStage));
    const isStageAllDone = activeStageObj && activeStageObj.total > 0 && activeStageObj.done === activeStageObj.total;
    if (!isStageAllDone) {
      alert(`All tasks in the ${activeDealStage} stage must be completed before requesting the next stage.`);
      return;
    }
    setAdminRequestModal({ isOpen: true, targetStage: stage.name });
  };

  const handleStageClick = (stage) => {
    // Clicking the card selects the stage for viewing/filtering
    // It does NOT activate the stage; stage activation is exclusively handled by the toggle switch
    if (setSelectedDealStage) {
      setSelectedDealStage(stage.name);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stages.map((stage, idx) => {
        const isPrepStage = normalizeStage(stage.name) === 'Preparation';
        const isCompletedOnBuyer = isBuyerSide && isPrepStage;
        const isStageDone = isCompletedOnBuyer || stage.isCompleted;

        const isActive = stage.isActive;
        const isDisabled = stage.isDisabled;
        const isSelected = selectedDealStage === stage.name;
        const pendingCount = Math.max(0, stage.total - stage.done);

        return (
          <div
            key={stage.name}
            onClick={() => handleStageClick(stage)}
            className={`bg-white rounded-2xl py-3 px-3.5 sm:py-3.5 sm:px-4 border transition-all duration-200 select-none cursor-pointer shadow-2xs hover:shadow-xs ${isSelected ? 'ring-2 ring-[#006666] border-[#006666]/40 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
          >
            {/* Top Row: Step Number Circle + Title & Status Badge / Toggle */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Step Circle: Step Number */}
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {stage.isCompleted && !isCompletedOnBuyer ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Title */}
                <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 truncate tracking-tight">
                  {stage.name}
                </h3>
              </div>

              {/* Status Badge / Interactive Toggle */}
              <div className="shrink-0 flex items-center">
                {isCompletedOnBuyer ? (
                  /* Buyer Side Preparation: Replace toggle button with tick mark */
                  <div className="flex items-center gap-1.5" title="Preparation stage completed by Seller">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      COMPLETED
                    </span>
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ) : isSuperAdmin ? (
                  /* Super Admin: Interactive Stage Activation Toggle (matches img 2) */
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${isActive ? 'text-[#006666]' : 'text-slate-400'
                        }`}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activateStage) {
                          activateStage(stage.name);
                        }
                      }}
                      title={
                        isActive
                          ? `${stage.name} is currently active`
                          : `Toggle to activate ${stage.name}`
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive
                          ? 'bg-[#006666]'
                          : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                ) : isAdmin ? (
                  /* Admin: Interactive Stage Activation Toggle that triggers Super Admin Request */
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${isActive ? 'text-[#006666]' : 'text-slate-400'
                        }`}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminToggle(stage);
                      }}
                      title={
                        isActive
                          ? `${stage.name} is currently active`
                          : `Toggle to request Super Admin to enable ${stage.name}`
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive
                          ? 'bg-[#006666]'
                          : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                ) : (
                  /* Non-Admin: Status Badge Pill only */
                  isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                      Active Stage
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Disabled
                    </span>
                  )
                )}
              </div>
            </div>

            {/* ============================================================= */}
            {/* SUPER ADMIN VIEW: FULL ANALYSIS (matches img 2)              */}
            {/* ============================================================= */}
            {isSuperAdmin ? (
              <>
                {/* Middle Row: Tasks Progress Labels (NO colon, matches img 2) */}
                <div className="flex items-center justify-between mt-2.5 text-xs">
                  <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Tasks Progress</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    {isCompletedOnBuyer
                      ? `${stage.total > 0 ? `${stage.total} / ${stage.total}` : '5 / 5'} Done (100%)`
                      : `${stage.done} / ${stage.total} Done (${stage.percent}%)`}
                  </span>
                </div>

                {/* Progress Bar (smooth & clean, matches img 2) */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isStageDone ? 'bg-emerald-500' : 'bg-[#006666]'
                      }`}
                    style={{ width: isCompletedOnBuyer ? '100%' : `${stage.percent}%` }}
                  />
                </div>

                {/* Bottom Row: Orange/Green bullet + pending tasks & Toggle to activate (matches img 2) */}
                <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
                  <div className="flex items-center gap-1.5">
                    {isStageDone ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-emerald-700 font-semibold">
                          All tasks completed
                        </span>
                      </>
                    ) : stage.total === 0 ? (
                      <span className="text-slate-400 font-normal">No tasks yet</span>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="text-slate-700 font-medium">
                          <strong className="font-bold text-slate-900">{pendingCount}</strong> pending tasks
                        </span>
                      </>
                    )}
                  </div>

                  <div>
                    {isActive ? (
                      <span className="text-[#006666] font-semibold text-[11px] sm:text-xs flex items-center gap-1">
                        Currently active
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal text-[11px] sm:text-xs">
                        {isCompletedOnBuyer ? 'Completed' : 'Toggle to activate'}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* ============================================================= */
              /* OTHERS VIEW (Admin, Sub Admin, Internal User)                */
              /* ============================================================= */
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {isCompletedOnBuyer ? (
                  <div className="text-emerald-700 font-medium text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Stage completed by Seller</span>
                  </div>
                ) : isActive ? (
                  <div className="text-teal-700 font-medium text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Current active deal stage</span>
                  </div>
                ) : (
                  <div className="text-slate-400 font-normal text-xs flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Stage disabled by Super Admin</span>
                  </div>
                )}

                {isCompletedOnBuyer ? (
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                    ● Completed
                  </span>
                ) : isActive ? (
                  <span className="text-[#006666] font-bold text-xs">
                    ● Active
                  </span>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      {adminRequestModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#006666] flex items-center justify-center border border-teal-200 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Enable Next Stage
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 leading-relaxed font-medium">
                  You need to request super admin to enable the next stage{adminRequestModal.targetStage ? ` (${adminRequestModal.targetStage})` : ''}.
                </p>
              </div>
            </div>

            {reqSuccess ? (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Request sent to Super Admin successfully!</span>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdminRequestModal({ isOpen: false, targetStage: '' })}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReq}
                  onClick={async () => {
                    setIsSubmittingReq(true);
                    try {
                      await requestSuperAdminStageAdvance({ stage: activeDealStage, nextStage: adminRequestModal.targetStage });
                      setReqSuccess(true);
                      setTimeout(() => {
                        setAdminRequestModal({ isOpen: false, targetStage: '' });
                        setReqSuccess(false);
                      }, 1200);
                    } catch (e) {
                      console.error('Error requesting super admin:', e);
                    } finally {
                      setIsSubmittingReq(false);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006666] hover:bg-[#005252] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingReq ? 'Requesting...' : 'Request Super Admin'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
