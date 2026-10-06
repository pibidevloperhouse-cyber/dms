"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import TaskCard from './TaskCard';
import {
  Search,
  Filter,
  X,
  Plus,
  Inbox,
  Send,
  Clock,
  Lock,
  Zap,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { PRIORITIES, DEAL_STAGES, normalizeRole, normalizeStage } from './DealWorkflowContext';
import StageTracker from './StageTracker';
import TaskCreationStudio from './TaskCreationStudio';

export default function TaskBoardView() {
  const {
    visibleTasks,
    kpiCounts,
    setSelectedTask,
    setIsCreateModalOpen,
    searchQuery,
    setSearchQuery,
    departments,
    selectedDepartment,
    setSelectedDepartment,
    selectedGroup,
    setSelectedGroup,
    memberFilter,
    setMemberFilter,
    getGroupsForDepartment,
    getMembersForGroup,
    getMembersForDepartment,
    allUsers,
    currentUser,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
    selectedVisibility,
    setSelectedVisibility,
    selectedDealStage,
    setSelectedDealStage,
    trackingSection,
    setTrackingSection,
    trackingCounts,
    clearFilters,
    hasActiveFilters,
    permittedTasks,
    stageTrackerInfo,
    stageNotification,
    dismissStageNotification,
  } = useDealWorkflow();

  // 1. Available groups inside the selected department
  const availableGroups = useMemo(() => {
    if (!getGroupsForDepartment) return [];
    const raw = getGroupsForDepartment(selectedDepartment) || [];
    return Array.from(new Set(raw.filter(Boolean)));
  }, [selectedDepartment, getGroupsForDepartment]);

  // 2. Available assignees inside the selected group or department
  const availableAssignees = useMemo(() => {
    let list = [];
    if (selectedGroup && selectedGroup !== 'ALL') {
      list = getMembersForGroup ? getMembersForGroup(selectedGroup) : [];
    } else if (selectedDepartment && selectedDepartment !== 'ALL') {
      list = getMembersForDepartment ? getMembersForDepartment(selectedDepartment) : [];
    } else {
      list = allUsers ? allUsers.map((u) => (typeof u === 'string' ? u : u?.name)) : [];
    }
    let cleanList = (list || [])
      .map((item) => (typeof item === 'string' ? item : item?.name))
      .filter((n) => typeof n === 'string' && n.trim().length > 0)
      .map((n) => n.trim());

    // In 'Created by You' section, exclude creator themselves from assignees filter
    if (trackingSection === 'CREATED_BY_ME' && currentUser?.name) {
      const creatorName = currentUser.name.trim().toLowerCase();
      cleanList = cleanList.filter((n) => n.toLowerCase() !== creatorName);
    }

    return Array.from(new Set(cleanList));
  }, [selectedGroup, selectedDepartment, getMembersForGroup, getMembersForDepartment, allUsers, trackingSection, currentUser]);

  // If currently in 'Created by You' section, 'Assigned to Me' is not applicable, so reset to 'ALL'
  useEffect(() => {
    if (trackingSection === 'CREATED_BY_ME' && memberFilter === 'MY_TASKS') {
      setMemberFilter('ALL');
    }
  }, [trackingSection, memberFilter, setMemberFilter]);

  const handleDepartmentChange = (newDept) => {
    setSelectedDepartment(newDept);
    // When department changes, if the current group is not in this department, reset group to ALL
    if (newDept !== 'ALL') {
      const groupsInDept = getGroupsForDepartment ? getGroupsForDepartment(newDept) : [];
      if (selectedGroup !== 'ALL' && !groupsInDept.includes(selectedGroup)) {
        setSelectedGroup('ALL');
      }
    }
  };

  const handleGroupChange = (newGroup) => {
    setSelectedGroup(newGroup);
    // When group changes, if the current member is not in this group, reset member to ALL
    if (newGroup !== 'ALL' && memberFilter !== 'ALL' && memberFilter !== 'MY_TASKS') {
      const membersInGroup = getMembersForGroup ? getMembersForGroup(newGroup) : [];
      if (!membersInGroup.includes(memberFilter)) {
        setMemberFilter('ALL');
      }
    }
  };

  // Mobile active column tab
  const [mobileTab, setMobileTab] = useState('TO_DO');

  const stageLabel = selectedDealStage === 'ALL' ? '' : ` (${selectedDealStage})`;

  const columns = [
    {
      id: 'TO_DO',
      label: 'TO DO',
      sublabel: selectedDealStage === 'ALL' ? 'Pending Claim / Action' : `Pending in ${selectedDealStage}`,
      color: 'border-slate-300 text-slate-700 bg-slate-100',
      badgeColor: 'bg-slate-200 text-slate-700',
      dotColor: 'bg-slate-400',
      count: visibleTasks.filter((t) => t.status === 'TO_DO').length,
    },
    {
      id: 'IN_PROGRESS',
      label: 'IN PROGRESS',
      sublabel: selectedDealStage === 'ALL' ? 'Claimed & In Motion' : `In Motion in ${selectedDealStage}`,
      color: 'border-blue-400 text-blue-800 bg-blue-50/70',
      badgeColor: 'bg-blue-100 text-blue-800',
      dotColor: 'bg-blue-600',
      count: visibleTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    },
    {
      id: 'REVIEW',
      label: 'REVIEW',
      sublabel: selectedDealStage === 'ALL' ? 'Submitted for Approval' : `In Review in ${selectedDealStage}`,
      color: 'border-amber-400 text-amber-800 bg-amber-50/70',
      badgeColor: 'bg-amber-100 text-amber-800',
      dotColor: 'bg-amber-500',
      count: visibleTasks.filter((t) => t.status === 'REVIEW').length,
    },
    {
      id: 'DONE',
      label: 'DONE',
      sublabel: selectedDealStage === 'ALL' ? 'Completed & Certified' : `Completed in ${selectedDealStage}`,
      color: 'border-emerald-400 text-emerald-800 bg-emerald-50/70',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      dotColor: 'bg-emerald-600',
      count: visibleTasks.filter((t) => t.status === 'DONE').length,
    },
  ];

  // Check if current user is super_admin or internal_user
  const isSuperAdmin = normalizeRole(currentUser?.role) === 'super_admin';
  const isInternalUser = normalizeRole(currentUser?.role) === 'internal_user';

  // Current stage tracking metadata
  const currentStageObj = useMemo(() => {
    if (!stageTrackerInfo?.stages) return null;
    return stageTrackerInfo.stages.find(
      (s) => normalizeStage(s.name) === normalizeStage(selectedDealStage)
    );
  }, [stageTrackerInfo, selectedDealStage]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-12 pt-2">

      {/* ========================================================================= */}
      {/* PAGE HEADER: TASK & WORKFLOW */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Task & Workflow
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track deal milestones, manage team responsibilities, and execute workflow tasks.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* DEAL STAGE TRACKER */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-1 pb-4 mb-1 sm:mb-1.5">
        <StageTracker />
      </div>

      {/* ========================================================================= */}
      {/* STAGE ACTIVATION NOTIFICATION BANNER */}
      {/* ========================================================================= */}
      {stageNotification && (
        <div className="px-4 sm:px-6 lg:px-8 pt-1 pb-2 mb-2">
          <div className="p-3 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200/90 rounded-xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 min-w-0">

              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>Stage Activated:</span>
                  <span className="text-[#006666] bg-teal-100/80 px-2 py-0.5 rounded-md font-extrabold text-xs">
                    {stageNotification.stage}
                  </span>
                  <span className="text-[10px] text-teal-700 bg-white/80 border border-teal-200 px-1.5 py-0.5 rounded-full font-medium">
                    By Super Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  Super Admin has activated the <strong className="text-slate-800">{stageNotification.stage}</strong> stage. You can now enable the tasks you created for this stage in Task Creation!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {trackingSection !== 'TASK_CREATION' && !isInternalUser && (
                <button
                  type="button"
                  onClick={() => {
                    setTrackingSection('TASK_CREATION');
                    if (setSelectedDealStage) {
                      setSelectedDealStage(stageNotification.stage);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Enable Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={dismissStageNotification}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-md transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW SWITCH BAR (MATCHING NDA TABS STYLE) */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-2 sm:pt-2.5 pb-2">
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            {!isSuperAdmin && (
              <button
                onClick={() => setTrackingSection('ASSIGNED_TO_ME')}
                className={`pb-2 text-xs sm:text-[13px] font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${trackingSection === 'ASSIGNED_TO_ME'
                  ? 'text-[#006666]'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>Assigned to You</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${trackingSection === 'ASSIGNED_TO_ME'
                  ? 'bg-teal-50 text-[#006666] border border-teal-200/80 font-bold'
                  : 'bg-slate-100 text-slate-500'
                  }`}>
                  {trackingCounts?.totalAssignedByOthers ?? trackingCounts?.assignedByOthers ?? 0}
                </span>
                {trackingSection === 'ASSIGNED_TO_ME' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#006666] rounded-t-full"></span>
                )}
              </button>
            )}

            {!isInternalUser && (
              <button
                onClick={() => {
                  setTrackingSection('CREATED_BY_ME');
                  if (memberFilter === 'MY_TASKS') setMemberFilter('ALL');
                }}
                className={`pb-2 text-xs sm:text-[13px] font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${trackingSection === 'CREATED_BY_ME'
                  ? 'text-[#006666]'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>Created by You</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${trackingSection === 'CREATED_BY_ME'
                  ? 'bg-teal-50 text-[#006666] border border-teal-200/80 font-bold'
                  : 'bg-slate-100 text-slate-500'
                  }`}>
                  {trackingCounts?.totalCreatedByMe ?? trackingCounts?.createdByMe ?? 0}
                </span>
                {trackingSection === 'CREATED_BY_ME' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#006666] rounded-t-full"></span>
                )}
              </button>
            )}

            {!isInternalUser && (
              <button
                onClick={() => {
                  setTrackingSection('TASK_CREATION');
                }}
                className={`pb-2 text-xs sm:text-[13px] font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${trackingSection === 'TASK_CREATION'
                  ? 'text-[#006666]'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>Task Creation</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${trackingSection === 'TASK_CREATION'
                  ? 'bg-teal-50 text-[#006666] border border-teal-200/80 font-bold'
                  : 'bg-slate-100 text-slate-500'
                  }`}>
                  {trackingCounts?.totalTaskCreation ?? 0}
                </span>
                {trackingSection === 'TASK_CREATION' && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#006666] rounded-t-full"></span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {trackingSection === 'TASK_CREATION' ? (
        <TaskCreationStudio />
      ) : (
        <>

          {/* ========================================================================= */}
          {/* FILTERS & SEARCH BAR */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* FILTERS & SEARCH BAR (SINGLE HORIZONTAL LINE MATCHING TASK CREATION)      */}
          {/* ========================================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, ID, document, assignee, or group..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Right Controls: Filter Dropdowns + Clear Filters + Count Indicator */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* 1. Departments Filter */}
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Departments</option>
                    {Array.from(new Set((departments || []).filter(Boolean))).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 2. Groups Filter */}
                <div className="relative">
                  <select
                    value={selectedGroup}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Groups</option>
                    {availableGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 3. Assignees Filter */}
                <div className="relative">
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Assignees</option>
                    {trackingSection !== 'CREATED_BY_ME' && (
                      <option value="MY_TASKS">Assigned to Me</option>
                    )}
                    {availableAssignees.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 4. Priorities Filter */}
                <div className="relative">
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Priorities</option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* 5. Visibility Filter */}
                <div className="relative">
                  <select
                    value={selectedVisibility}
                    onChange={(e) => setSelectedVisibility(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">Internal & External</option>
                    <option value="INTERNAL">Internal Only</option>
                    <option value="EXTERNAL">External Only</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 px-2.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Clear all active filters"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE STATUS TABS SWITCHER */}
          {/* ========================================================================= */}
          <div className="md:hidden px-4 pt-2">
            <div className="grid grid-cols-4 bg-slate-200 p-1 rounded-xl text-xs font-bold text-center">
              {columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setMobileTab(col.id)}
                  className={`py-1.5 rounded-lg transition-all ${mobileTab === col.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <div>{col.label}</div>
                  <div className="text-[10px] font-normal">({col.count})</div>
                </button>
              ))}
            </div>
          </div>





          {/* Informative Stage Waiting Banner for Assignees */}
          {trackingSection === 'ASSIGNED_TO_ME' && currentStageObj?.isMyTasksCompleted && !currentStageObj?.isCompleted && (
            <div className="mx-4 sm:mx-6 lg:mx-8 mb-3 bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs">
                  <span className="font-bold">Stage Pending:</span> You have completed your task(s) for{' '}
                  <span className="font-semibold">{selectedDealStage}</span>. Waiting for{' '}
                  <span className="font-bold">{currentStageObj.dealPending} remaining task(s)</span> from other team members{' '}
                  ({currentStageObj.dealDone} / {currentStageObj.dealTotal} completed).
                </div>
              </div>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-700" />
                Next stage unlocks when all {currentStageObj.dealTotal} tasks are done
              </span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* KANBAN TASK BOARD COLUMNS */}
          {/* ========================================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 pt-2 flex-1">

            {/* Desktop & Tablet: Horizontal columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {columns.map((col) => {
                const colTasks = visibleTasks.filter((t) => t.status === col.id);
                const isHiddenOnMobile = mobileTab !== col.id;

                return (
                  <div
                    key={col.id}
                    className={`flex flex-col bg-slate-100/80 rounded-2xl border border-slate-200/80 p-3 min-h-[500px] ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'
                      }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          {col.label}
                        </h2>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                          {col.count}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        {col.sublabel}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex flex-col gap-3 flex-1">
                      {colTasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-slate-300 bg-white/40 my-2">
                          <p className="text-xs font-medium text-slate-400">
                            No tasks in {col.label.toLowerCase()}
                          </p>
                          {col.id === 'TO_DO' && trackingSection === 'CREATED_BY_ME' && (
                            <button
                              onClick={() => setIsCreateModalOpen(true)}
                              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add new task
                            </button>
                          )}
                        </div>
                      ) : (
                        colTasks.map((task) => (
                          <TaskCard
                            key={task.task_id}
                            task={task}
                            onCardClick={setSelectedTask}
                          />
                        ))
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </>
      )}

    </div>
  );
}
