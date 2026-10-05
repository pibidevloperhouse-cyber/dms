"use client";

import React from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { CheckCircle2, Lock } from 'lucide-react';

export default function StageTracker() {
  const {
    stageTrackerInfo,
    selectedDealStage,
    setSelectedDealStage,
    trackingSection,
  } = useDealWorkflow();

  if (!stageTrackerInfo || !stageTrackerInfo.stages) {
    return null;
  }

  const { stages } = stageTrackerInfo;

  const handleStageClick = (stage) => {
    if (stage.isLocked) return;
    setSelectedDealStage(stage.name);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stages.map((stage, idx) => {
        const isSelected = selectedDealStage === stage.name;
        const pendingCount = Math.max(0, stage.total - stage.done);

        return (
          <div
            key={stage.name}
            onClick={() => handleStageClick(stage)}
            className={`bg-white rounded-xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 select-none ${
              stage.isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
            } ${
              isSelected
                ? 'border-2 border-slate-300 shadow-xs'
                : 'border border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {/* Top Row: Step Number Circle + Title & Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    stage.isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : (stage.isActive || isSelected) && stage.total > 0
                      ? 'bg-[#11707E] text-white shadow-xs'
                      : isSelected
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 font-semibold'
                  }`}
                >
                  {stage.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Stage Title */}
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                  {stage.name}
                </h3>
              </div>

              {/* Status Badge Pill */}
              <div className="shrink-0">
                {stage.total === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    No Tasks
                  </span>
                ) : stage.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Completed ✓
                  </span>
                ) : stage.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1967D2] bg-[#E8F0FE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Active Stage
                  </span>
                ) : stage.isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Locked 🔒
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Available
                  </span>
                )}
              </div>
            </div>

            {/* Middle Row: Tasks Progress Labels */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400 font-normal text-[11px] sm:text-xs">Tasks Progress:</span>
              <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                {stage.done} / {stage.total} Done ({stage.percent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stage.isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-[#11707E]'
                }`}
                style={{ width: `${stage.percent}%` }}
              />
            </div>

            {/* Bottom Row: Pending status on left, Filtering/Filter button on right */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
              {/* Left description */}
              <div>
                {stage.total === 0 ? (
                  <div className="text-slate-400 text-[11px] sm:text-xs">
                    {trackingSection === 'CREATED_BY_ME' ? 'No tasks created by you' : 'No tasks yet'}
                  </div>
                ) : stage.isLocked ? (
                  <div className="flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>
                      {stage.index === 1 && stages[0]?.dealPending > 0
                        ? `Locked · Waiting for Preparation (${stages[0].dealPending} pending)`
                        : stage.index === 2 && stages[1]?.dealPending > 0
                        ? `Locked · Waiting for Due Diligence (${stages[1].dealPending} pending)`
                        : 'Prerequisite stage incomplete'}
                    </span>
                  </div>
                ) : stage.isCompleted ? (
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px] sm:text-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{trackingSection === 'CREATED_BY_ME' ? 'All your tasks completed ✓' : 'All stage tasks completed ✓'}</span>
                  </div>
                ) : stage.isMyTasksCompleted && trackingSection === 'ASSIGNED_TO_ME' ? (
                  <div className="text-teal-700 font-semibold text-[11px] sm:text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>Your task done ✓ · Waiting for {stage.dealPending || pendingCount} remaining</span>
                  </div>
                ) : (stage.dealPending || pendingCount) > 0 ? (
                  <div className="text-amber-700 font-semibold text-[11px] sm:text-xs">
                    {stage.dealPending || pendingCount} pending task(s)
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] sm:text-xs">
                    No tasks yet
                  </div>
                )}
              </div>

              {/* Right Filter status */}
              <div>
                {isSelected ? (
                  <div className="text-[#006666] font-bold text-[11px] sm:text-xs flex items-center gap-1">
                    <span>✓ Filtering</span>
                  </div>
                ) : stage.isLocked ? (
                  <div className="text-slate-400 font-medium text-[11px] sm:text-xs">
                    Stage locked
                  </div>
                ) : (
                  <div className="text-[#006666] font-semibold text-[11px] sm:text-xs hover:underline cursor-pointer">
                    Click to filter
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
