"use client";

import React, { useState, useMemo } from 'react';
import { useDealWorkflow, normalizeRole, normalizeStage, DEAL_STAGES } from './DealWorkflowContext';
import {
  Plus,
  Search,
  X,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  User,
  Building,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  ChevronDown,
  Edit3,
  Trash2
} from 'lucide-react';
import EditTaskModal from './EditTaskModal';

export default function TaskCreationStudio() {
  const {
    tasks,
    currentUser,
    activeDealStage,
    activateStage,
    toggleTaskEnabled,
    deleteTask,
    setIsCreateModalOpen,
    setSelectedTask,
    isTaskCreator,
    canManageTaskInStudio,
    setSelectedDealStage,
  } = useDealWorkflow();

  const isSuperAdmin = normalizeRole(currentUser?.role) === 'super_admin';

  const [mounted, setMounted] = useState(false);
  const [viewMode] = useState('list'); // Fixed to list view only

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filters state
  const [selectedStageTab, setSelectedStageTab] = useState('ALL'); // 'ALL' | 'Preparation' | 'Due Diligence' | 'Negotiation'
  const [enablementFilter, setEnablementFilter] = useState('ALL'); // 'ALL' | 'ENABLED' | 'STAGED'
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'High' | 'Medium' | 'Low'
  const [searchQuery, setSearchQuery] = useState('');
  const [lastCreatedTaskId, setLastCreatedTaskId] = useState(null);

  // 3-dots action menu state & edit modal state
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, right: 0 });
  const [editingTask, setEditingTask] = useState(null);

  // Close 3-dots action menu on outside click, scroll, or window resize
  React.useEffect(() => {
    const handleClose = () => setOpenActionMenuId(null);
    if (openActionMenuId) {
      document.addEventListener('click', handleClose);
      window.addEventListener('scroll', handleClose, true);
      window.addEventListener('resize', handleClose);
      return () => {
        document.removeEventListener('click', handleClose);
        window.removeEventListener('scroll', handleClose, true);
        window.removeEventListener('resize', handleClose);
      };
    }
  }, [openActionMenuId]);

  // All tasks created by the logged-in user in Task Creation Studio
  const relevantTasks = useMemo(() => {
    return tasks.filter((t) => isTaskCreator(t, currentUser));
  }, [tasks, currentUser, isTaskCreator]);

  // When a new task is created, automatically switch filters so it is immediately visible!
  const prevTasksCountRef = React.useRef(tasks.length);
  React.useEffect(() => {
    if (tasks.length > prevTasksCountRef.current) {
      const newestTask = tasks[0];
      if (newestTask && newestTask.task_id) {
        setLastCreatedTaskId(newestTask.task_id);
        const taskStage = newestTask.deal_stage || 'Preparation';
        if (selectedStageTab !== 'ALL' && normalizeStage(selectedStageTab) !== normalizeStage(taskStage)) {
          setSelectedStageTab('ALL');
        }
        if (enablementFilter === 'ENABLED' && newestTask.is_enabled === false) {
          setEnablementFilter('ALL');
        }
        if (enablementFilter === 'STAGED' && newestTask.is_enabled !== false) {
          setEnablementFilter('ALL');
        }
        setSearchQuery('');
      }
    }
    prevTasksCountRef.current = tasks.length;
  }, [tasks, selectedStageTab, enablementFilter]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return relevantTasks.filter((task) => {
      // Stage filter
      if (selectedStageTab !== 'ALL') {
        if (normalizeStage(task.deal_stage) !== normalizeStage(selectedStageTab)) {
          return false;
        }
      }

      // Enablement filter
      if (enablementFilter === 'ENABLED' && task.is_enabled === false) {
        return false;
      }
      if (enablementFilter === 'STAGED' && task.is_enabled !== false) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        if ((task.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (task.title || '').toLowerCase().includes(q);
        const matchesId = (task.task_id || '').toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesAssignee = (task.assigned_to_user || '').toLowerCase().includes(q);
        const matchesGroup = (task.assigned_to_group || '').toLowerCase().includes(q);
        const matchesDept = (task.department || task.workstream || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDesc && !matchesAssignee && !matchesGroup && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [relevantTasks, selectedStageTab, enablementFilter, priorityFilter, searchQuery]);

  // Summary counts
  const countsByStage = useMemo(() => {
    const counts = { ALL: relevantTasks.length };
    DEAL_STAGES.forEach((s) => {
      counts[s] = relevantTasks.filter((t) => normalizeStage(t.deal_stage) === normalizeStage(s)).length;
    });
    return counts;
  }, [relevantTasks]);

  const enabledCount = useMemo(() => {
    return relevantTasks.filter((t) => t.is_enabled !== false).length;
  }, [relevantTasks]);

  const stagedCount = useMemo(() => {
    return relevantTasks.filter((t) => t.is_enabled === false).length;
  }, [relevantTasks]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* STUDIO HEADER & ACTIVE STAGE CONTEXT */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SEARCH & FILTERS BAR (EXACT DESIGN MATCHING IMG 4)                        */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Input (matches img 4) */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, ID, assignee, department, group..."
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

          {/* Right Controls: Status Select + Priority Select + Box | List Toggle + Create Button (matches img 4) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* All statuses dropdown (matches img 4) */}
            <div className="relative">
              <select
                value={enablementFilter}
                onChange={(e) => setEnablementFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All statuses</option>
                <option value="ENABLED">Enabled ({enabledCount})</option>
                <option value="STAGED">Staged ({stagedCount})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* All priorities dropdown (matches img 4) */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-[#006666] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>



            {/* Create New Task Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#006666] hover:bg-[#005555] text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TASK LIST (BOX VIEW OR LIST VIEW)                                         */}
      {/* ========================================================================= */}
      <div className="px-4 sm:px-6 lg:px-8 pb-10 flex-1">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center flex flex-col items-center justify-center my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No tasks found in Task Creation
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery || selectedStageTab !== 'ALL' || enablementFilter !== 'ALL'
                ? 'Try adjusting your filters or search query.'
                : 'Get started by drafting and creating your tasks for any deal stage.'}
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ========================================================================= */
          /* LIST / TABLE VIEW                                                         */
          /* ========================================================================= */
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-3">Department & Group</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task, index) => {
                    const taskStage = task.deal_stage || 'Preparation';
                    const isTaskStageActive = normalizeStage(taskStage) === normalizeStage(activeDealStage);
                    const isEnabled = task.is_enabled !== false;
                    const isJustCreated = task.task_id === lastCreatedTaskId;
                    const subtaskCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;

                    return (
                      <tr
                        key={task.task_id}
                        onClick={() => setSelectedTask(task)}
                        className={`hover:bg-teal-50/40 transition-colors cursor-pointer select-none ${
                          isJustCreated ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        {/* Task ID & Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                              {task.task_id}
                            </span>
                            {isJustCreated && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white shrink-0 animate-pulse">
                                New
                              </span>
                            )}
                            <span className="font-semibold text-slate-900 hover:text-[#006666] line-clamp-1 max-w-[280px]">
                              {task.title}
                            </span>
                            {subtaskCount > 0 && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-full shrink-0">
                                {subtaskCount} subtask{subtaskCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stage */}
                        <td className="py-3 px-3 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                taskStage === 'Preparation'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : taskStage === 'Due Diligence'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}
                            >
                              {taskStage}
                            </span>
                            {isTaskStageActive ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" title="Active Stage"></span>
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" title="Stage Disabled" />
                            )}
                          </div>
                        </td>

                        {/* Department & Group */}
                        <td className="py-3 px-3 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px] font-medium">
                              {task.department || 'General'}
                            </span>
                            {task.assigned_to_group && (
                              <span className="text-slate-400 text-[11px] truncate max-w-[110px]">
                                · {task.assigned_to_group}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                              task.priority === 'High'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : task.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {isEnabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md shrink-0">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              Staged
                            </span>
                          )}
                        </td>

                        {/* Action Menu (Fixed Viewport Position to avoid overflow/scroll clipping) */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openActionMenuId === task.task_id) {
                                  setOpenActionMenuId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const menuHeight = 160;
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  let topPos = rect.bottom + 6;
                                  if (spaceBelow < menuHeight && rect.top > menuHeight) {
                                    topPos = rect.top - menuHeight - 6;
                                  }
                                  setActionMenuPos({
                                    top: topPos,
                                    right: window.innerWidth - rect.right,
                                  });
                                  setOpenActionMenuId(task.task_id);
                                }
                              }}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-auto"
                              title="Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openActionMenuId === task.task_id && (
                              <div
                                style={{
                                  position: 'fixed',
                                  top: `${actionMenuPos.top}px`,
                                  right: `${actionMenuPos.right}px`,
                                }}
                                className="w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-[9999] text-left animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isTaskStageActive ? (
                                  isEnabled ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskEnabled(task.task_id, false);
                                        setOpenActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                                    >
                                      Disable task
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskEnabled(task.task_id, true);
                                        setOpenActionMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                                    >
                                      Enable task
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="w-full text-left px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed font-medium"
                                    title={`Stage '${taskStage}' is currently disabled. Super Admin must activate this stage before enabling.`}
                                  >
                                    Stage disabled
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask(task);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                                >
                                  Edit task
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTask(task);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                                >
                                  View details
                                </button>

                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenActionMenuId(null);
                                    if (window.confirm(`Are you sure you want to delete task "${task.title}" (${task.task_id})?`)) {
                                      await deleteTask(task.task_id);
                                    }
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer font-medium"
                                >
                                  Delete task
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* BOX / GRID VIEW (CARDS)                                                   */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredTasks.map((task) => {
              const taskStage = task.deal_stage || 'Preparation';
              const isTaskStageActive = normalizeStage(taskStage) === normalizeStage(activeDealStage);
              const isEnabled = task.is_enabled !== false;

              const isJustCreated = task.task_id === lastCreatedTaskId;

              return (
                <div
                  key={task.task_id}
                  onClick={() => setSelectedTask(task)}
                  className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer select-none ${isJustCreated
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : !isTaskStageActive
                        ? 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        : isEnabled
                          ? 'border-teal-200/90 hover:border-[#006666]/60'
                          : 'border-amber-200/90 hover:border-amber-400/80'
                    }`}
                >
                  {/* Top Row: Task ID + Stage Badge + Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {task.task_id}
                        </span>

                        {isJustCreated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                            Just Created
                          </span>
                        )}

                        {/* Stage Pill */}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${taskStage === 'Preparation'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : taskStage === 'Due Diligence'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                          {taskStage}
                        </span>
                      </div>

                      {/* Stage Active / Inactive Badge */}
                      <div>
                        {isTaskStageActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            Active Stage
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            Stage Disabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mt-1">
                      {task.title}
                    </h3>

                    {/* Description preview */}
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-600">
                      {/* Department / Group */}
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">{task.department || 'General'}</span>
                        {task.assigned_to_group && (
                          <span className="text-slate-400">· {task.assigned_to_group}</span>
                        )}
                      </div>

                      {/* Assignee */}
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">
                          {task.assigned_to_user || 'Unassigned'}
                        </span>
                      </div>

                      {/* Priority */}
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${task.priority === 'High'
                        ? 'bg-rose-50 text-rose-700'
                        : task.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                        }`}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Row: Enablement Status & Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {/* Left: State Pill */}
                    <div>
                      {isEnabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          Enabled on Board
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Staged (Draft)
                        </span>
                      )}
                    </div>

                    {/* Right: Enable / Disable Button */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {isTaskStageActive ? (
                        isEnabled ? (
                          <button
                            type="button"
                            onClick={() => toggleTaskEnabled(task.task_id, false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleTaskEnabled(task.task_id, true)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            Enable Task
                          </button>
                        )
                      ) : (
                        <div className="flex flex-col items-end">
                          <button
                            type="button"
                            disabled
                            title={`Stage '${taskStage}' is currently disabled. Super Admin must activate this stage before enabling.`}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 flex items-center gap-1 cursor-not-allowed"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            Stage Disabled
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
