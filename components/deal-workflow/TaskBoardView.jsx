"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  MessageSquare,
  Bell
} from 'lucide-react';
import { PRIORITIES, DEAL_STAGES, normalizeRole, normalizeStage } from './DealWorkflowContext';
import StageTracker from './StageTracker';
import StageReviewNotification from './StageReviewNotification';
import TaskCreationStudio from './TaskCreationStudio';
import TaskCommunicationPanel from './TaskCommunicationPanel';

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
    activeDealStage,
    stageQuery,
  } = useDealWorkflow();

  // Task-Based Communication Overlay Drawer state
  const [activeChatTaskId, setActiveChatTaskId] = useState(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // Dynamically resolve active chat task (defaults to first available task)
  const activeChatTask = useMemo(() => {
    if (!visibleTasks || visibleTasks.length === 0) return null;
    if (activeChatTaskId) {
      const found = visibleTasks.find(
        (t) => t.id === activeChatTaskId || t.task_id === activeChatTaskId || t.taskId === activeChatTaskId
      );
      if (found) return found;
    }
    return visibleTasks[0] || null;
  }, [activeChatTaskId, visibleTasks]);

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

  // Preparation stage is strictly internal - reset visibility filter if set to EXTERNAL
  const isPrepStage = normalizeStage(selectedDealStage) === 'Preparation';
  useEffect(() => {
    if (isPrepStage && selectedVisibility === 'EXTERNAL') {
      setSelectedVisibility('ALL');
    }
  }, [isPrepStage, selectedVisibility, setSelectedVisibility]);

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

  // Notification popover state & outside click handler
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Active notification metrics
  const activeStageObj = stageTrackerInfo?.stages?.find(
    (s) => normalizeStage(s.name) === normalizeStage(activeDealStage)
  );
  const activeStageTotalTasks = activeStageObj?.total || 0;
  const activeStageDoneTasks = activeStageObj?.done || 0;
  const isStageAllDone = activeStageTotalTasks > 0 && activeStageDoneTasks === activeStageTotalTasks;
  const hasActiveQuery = Boolean(
    stageQuery &&
    stageQuery.status === 'PENDING_RESOLUTION' &&
    normalizeStage(stageQuery.stage) === normalizeStage(activeDealStage)
  );
  let notificationCount = 0;
  if (isStageAllDone || hasActiveQuery) notificationCount += 1;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] pb-12 pt-2">

      {/* ========================================================================= */}
      {/* PAGE HEADER: TASK & WORKFLOW */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Task & Workflow</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track deal milestones, manage team responsibilities, and collaborate via task-based communication.
          </p>
        </div>

        {/* Header Actions: Notification Bell + Toggle Task Chat Overlay */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Bell Button & Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${isNotificationOpen
                ? 'bg-teal-50 border-teal-300 text-[#006666]'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              title="Stage Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotificationOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-[92vw] sm:w-[620px] md:w-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-teal-50 text-[#006666] flex items-center justify-center border border-teal-200/80">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900">Stage Notifications</span>
                    {notificationCount > 0 && (
                      <span className="text-[10px] font-bold bg-teal-100 text-[#006666] px-2 py-0.5 rounded-full">
                        {notificationCount} active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications List (The cards in the user image) */}
                <div className="space-y-3">
                  {/* Card 1: Stage Review Notification / Super Admin Review Card / Query */}
                  <StageReviewNotification inDropdown={true} />

                  {/* Empty state if nothing active */}
                  {notificationCount === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                      <Bell className="w-5 h-5 text-slate-300" />
                      <p className="font-semibold text-slate-700">No active stage notifications</p>
                      <p className="text-[11px] text-slate-400">
                        Notifications for stage completions and activations will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* <button
            type="button"
            onClick={() => setIsChatPanelOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs bg-white hover:bg-teal-50 text-slate-700 hover:text-[#006666] border-slate-200 hover:border-teal-300"
            title="Open Task Communication Overlay"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#006666]" />
            <span>Task Chat Overlay</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button> */}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DEAL STAGE TRACKER */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pt-1 pb-4 mb-1 sm:mb-1.5">
        <StageTracker />
      </div>

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
                    {isPrepStage ? (
                      <option value="ALL">Internal Only</option>
                    ) : (
                      <>
                        <option value="ALL">Internal & External</option>
                        <option value="INTERNAL">Internal Only</option>
                        <option value="EXTERNAL">External Only</option>
                      </>
                    )}
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
          {/* FULL-WIDTH KANBAN TASK BOARD (DOES NOT SHRINK) */}
          {/* ========================================================================= */}
          <div className="px-4 sm:px-6 lg:px-8 pt-2 flex-1 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start w-full">
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
                        colTasks.map((task) => {
                          const isTaskActive = activeChatTask && (
                            activeChatTask.task_id === task.task_id ||
                            activeChatTask.id === task.id ||
                            activeChatTask.taskId === task.taskId
                          );

                          return (
                            <TaskCard
                              key={task.task_id}
                              task={task}
                              isActive={isTaskActive && isChatPanelOpen}
                              onOpenChat={(t) => {
                                setActiveChatTaskId(t.id || t.task_id || t.taskId);
                                setIsChatPanelOpen(true);
                              }}
                              onOpenDetails={(t) => setSelectedTask(t)}
                              onCardClick={(t) => setSelectedTask(t)}
                            />
                          );
                        })
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SLIDE-OVER OVERLAY DRAWER: TASK-BASED COMMUNICATION */}
          {/* ========================================================================= */}
          {isChatPanelOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
              {/* Soft blur backdrop */}
              <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
                onClick={() => setIsChatPanelOpen(false)}
              />

              {/* Slide-over drawer */}
              <div className="relative z-50 w-full max-w-xl md:max-w-2xl h-full shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
                <TaskCommunicationPanel
                  activeTask={activeChatTask}
                  onClose={() => setIsChatPanelOpen(false)}
                  onOpenTaskDetails={(t) => {
                    setIsChatPanelOpen(false);
                    setSelectedTask(t);
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
