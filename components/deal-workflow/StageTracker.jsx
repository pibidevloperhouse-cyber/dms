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
  } = useDealWorkflow();

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
  const isSuperAdmin = normalizeRole(currentUser?.role) === 'super_admin';

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
        const isActive = stage.isActive;
        const isDisabled = stage.isDisabled;
        const isSelected = selectedDealStage === stage.name;
        const pendingCount = Math.max(0, stage.total - stage.done);

        return (
          <div
            key={stage.name}
            onClick={() => handleStageClick(stage)}
            className={`bg-white rounded-2xl py-3 px-3.5 sm:py-3.5 sm:px-4 border border-slate-200 hover:border-slate-300 transition-all duration-200 select-none cursor-pointer shadow-2xs hover:shadow-xs ${
              isSelected ? 'ring-2 ring-slate-200' : ''
            }`}
          >
            {/* Top Row: Step Number Circle + Title & Status Badge / Toggle */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Step Circle (clean light grey matching img 2) */}
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {isSuperAdmin && stage.isCompleted ? (
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
                {isSuperAdmin ? (
                  /* Super Admin: Interactive Stage Activation Toggle (matches img 2) */
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isActive ? 'text-[#006666]' : 'text-slate-400'
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
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive
                          ? 'bg-[#006666]'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  /* Non-Super Admin: Status Badge Pill only */
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
                    {stage.done} / {stage.total} Done ({stage.percent}%)
                  </span>
                </div>

                {/* Progress Bar (smooth & clean, matches img 2) */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stage.isCompleted ? 'bg-emerald-500' : 'bg-[#006666]'
                    }`}
                    style={{ width: `${stage.percent}%` }}
                  />
                </div>

                {/* Bottom Row: Orange bullet + pending tasks & Toggle to activate (matches img 2) */}
                <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
                  <div className="flex items-center gap-1.5">
                    {stage.total === 0 ? (
                      <span className="text-slate-400 font-normal">No tasks yet</span>
                    ) : stage.isCompleted ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="text-emerald-700 font-semibold">
                          All tasks completed
                        </span>
                      </>
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
                        Toggle to activate
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
                {isActive ? (
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

                {isActive && (
                  <span className="text-[#006666] font-bold text-xs">
                    ● Active
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
