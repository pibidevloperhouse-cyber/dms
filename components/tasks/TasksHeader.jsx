"use client";

import React from 'react';
import { useTasks } from './TasksContext';

export default function TasksHeader() {
  const { currentDealStage, viewMode, setIsCreating, isBuyerUser } = useTasks();

  const isBuyer = isBuyerUser || viewMode === 'Buyer';

  return (
    <div className="bg-gradient-to-r from-[var(--brand-50,theme(colors.blue.50))] to-white border-b border-[var(--brand-100,theme(colors.blue.100))] shrink-0 relative z-10">
      {/* Premium brand accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--brand,theme(colors.blue.600))] to-[var(--brand-secondary,theme(colors.teal.500))]"></div>

      <div className="w-full px-8 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center py-4 lg:py-6 gap-4 lg:gap-0">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2 lg:gap-4">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-[var(--brand-dark,theme(colors.slate.900))]">
                {isBuyer ? 'Buyer Task & Workflow' : 'Task & Workflow'}
              </h1>
              <span className="text-[10px] lg:text-[11px] font-bold tracking-wider uppercase px-2 lg:px-2.5 py-1 rounded-md bg-white text-[var(--brand,theme(colors.blue.600))] border border-[var(--brand-200,theme(colors.blue.200))] flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand,theme(colors.blue.500))] animate-pulse"></span>
                STAGE: {currentDealStage}
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-500 mt-1">
              {isBuyer
                ? 'Track and complete your assigned deal requests and diligence items.'
                : 'Streamline deal execution and track milestones.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:gap-5 w-full lg:w-auto">

            {/* Locked Role Badge (No switching allowed) */}
            <div className="flex items-center px-4 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-inner gap-2">
              <span className={`w-2 h-2 rounded-full ${isBuyer ? 'bg-teal-500' : 'bg-blue-600'}`}></span>
              <span>{isBuyer ? 'Buyer View' : 'Seller View'}</span>
            </div>

            {!isBuyer && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--brand,theme(colors.blue.600))] hover:bg-[var(--brand,theme(colors.blue.700))] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                New Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
