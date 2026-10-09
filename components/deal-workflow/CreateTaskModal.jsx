"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, User, Calendar, Trash2, Paperclip, FileText, X, Users, Lock, Globe } from 'lucide-react';
import { PRIORITIES, DEAL_STAGES, normalizeStage } from './DealWorkflowContext';

export default function CreateTaskModal() {
  const {
    currentUser,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createTask,
    departments,
    workflowGroups,
    externalGroups,
    getGroupsForDepartment,
    getMembersForGroup,
    getAssignableMembersForGroup,
    roleHierarchy,
    normalizeRole,
    getRoleLabel,
    selectedDealStage,
    activeDealStage,
  } = useDealWorkflow();

  const isSuperAdmin = normalizeRole(currentUser?.role) === 'super_admin';

  // Main task fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('INTERNAL');
  const [department, setDepartment] = useState('');
  const [assignedGroup, setAssignedGroup] = useState('');
  const [assignedMember, setAssignedMember] = useState('');
  const [priority, setPriority] = useState('High');
  const [dealStage, setDealStage] = useState('Preparation');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subtask modal state
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskMember, setSubtaskMember] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState('High');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskAttachments, setSubtaskAttachments] = useState([]);

  // Helper to resolve group's normalized role
  const resolveGroupRole = (g) => {
    if (g?.role) return normalizeRole(g.role);
    const lower = (g?.name || '').toLowerCase();
    if (lower.includes('super')) return 'super_admin';
    if (lower.includes('sub')) return 'sub_admin';
    if (lower.includes('admin')) return 'admin';
    return 'internal_user';
  };

  // Available groups for the selected department, strictly excluding creator's own role and higher roles
  // If visibility is EXTERNAL, show buyer groups (allowed exclusively for Super Admin)
  const availableGroups = useMemo(() => {
    const isExternal = visibility === 'EXTERNAL';

    // Cross-party delegation rule: ONLY Super Admin can assign external groups
    if (isExternal && !isSuperAdmin) {
      return [];
    }

    const creatorRole = normalizeRole(currentUser?.role);
    const allowedRoles = roleHierarchy?.[creatorRole]?.canAssignTo || [];

    let list = isExternal
      ? (Array.isArray(externalGroups) && externalGroups.length > 0 ? externalGroups : [])
      : (Array.isArray(workflowGroups) && workflowGroups.length > 0 ? workflowGroups.filter((g) => g.side !== 'buyer') : []);

    if (department && department !== 'ALL') {
      const filteredByDept = list.filter(
        (g) => (g.department || '').trim().toLowerCase() === department.trim().toLowerCase()
      );
      if (filteredByDept.length > 0) {
        list = filteredByDept;
      }
    }

    // Rule: Exclude groups matching creator's own role (e.g. admin cannot assign to admin groups)
    // Rule: Creator can only assign down the hierarchy to subordinate roles
    list = list.filter((g) => {
      const gRole = resolveGroupRole(g);
      if (gRole === creatorRole) return false;
      return allowedRoles.includes(gRole);
    });

    return list.map((g) => {
      const gRole = resolveGroupRole(g);
      const roleStr = getRoleLabel ? getRoleLabel(gRole) : gRole;
      const isExternalGroup = isExternal || g.side === 'buyer';
      return {
        id: g.id || g.name,
        name: g.name,
        role: gRole,
        roleLabel: roleStr,
        isExternal: isExternalGroup,
        side: g.side || (isExternalGroup ? 'buyer' : 'seller'),
        company: g.company || (isExternalGroup ? 'XYZ Capital' : (currentUser?.company || 'Company')),
        displayName: isExternalGroup
          ? `🌐 ${g.name} (${roleStr}) · Buyer Group`
          : `${g.name} (${roleStr})`,
      };
    });
  }, [visibility, department, workflowGroups, externalGroups, isSuperAdmin, currentUser, roleHierarchy, normalizeRole, getRoleLabel]);

  // Subordinate members available for subtask assignment strictly within assignedGroup
  const subtaskAssignableMembers = useMemo(() => {
    if (!assignedGroup) return [];
    if (getAssignableMembersForGroup) {
      return getAssignableMembersForGroup(assignedGroup, currentUser);
    }
    return [];
  }, [assignedGroup, getAssignableMembersForGroup, currentUser]);

  // Sync default department when departments load
  useEffect(() => {
    if (departments.length > 0 && (!department || !departments.includes(department))) {
      setDepartment(departments[0]);
    }
  }, [departments, department]);

  // Sync default deal stage from currently viewed board stage
  useEffect(() => {
    if (isCreateModalOpen) {
      if (selectedDealStage && selectedDealStage !== 'ALL') {
        setDealStage(selectedDealStage);
      }
    }
  }, [isCreateModalOpen, selectedDealStage]);

  // Sync assigned group when availableGroups change
  useEffect(() => {
    if (availableGroups.length > 0) {
      if (!assignedGroup || !availableGroups.some((g) => g.name === assignedGroup)) {
        setAssignedGroup(availableGroups[0].name);
      }
    } else {
      setAssignedGroup('');
    }
  }, [availableGroups, assignedGroup]);

  // Sync subtask member when subtaskAssignableMembers change or subtask modal opens
  useEffect(() => {
    if (subtaskAssignableMembers.length > 0) {
      if (!subtaskMember || !subtaskAssignableMembers.some((m) => m.name === subtaskMember)) {
        setSubtaskMember(subtaskAssignableMembers[0].name);
      }
    } else {
      setSubtaskMember('');
    }
  }, [subtaskAssignableMembers, subtaskMember, isAddSubtaskModalOpen]);

  if (!isCreateModalOpen) return null;

  const isSeller = currentUser?.side === 'seller';

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setVisibility('INTERNAL');
    setDepartment(departments[0] || '');
    setAssignedGroup(availableGroups[0] || '');
    setAssignedMember('');
    setPriority('High');
    setDealStage('Preparation');
    setDueDate('');
    setSubtasks([]);
    setSubtaskAttachments([]);
    setIsAddSubtaskModalOpen(false);
    setIsCreateModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // First assigned subordinate from subtasks if available
    const firstAssigned = subtasks.find((st) => st.assignedMember && st.assignedMember !== 'Unassigned');
    const finalAssignee = assignedMember || firstAssigned?.assignedMember || null;

    // RULE: Task creator cannot assign the task to their own
    if (finalAssignee && currentUser?.name && finalAssignee.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      alert('Task creator cannot assign tasks to themselves. Please select a subordinate team member.');
      return;
    }

    const isStageActive = normalizeStage(dealStage) === normalizeStage(activeDealStage);
    const isExternal = visibility === 'EXTERNAL';
    const targetSide = isExternal ? (currentUser?.side === 'seller' ? 'buyer' : 'seller') : (currentUser?.side || 'seller');
    const targetCompany = isExternal ? (currentUser?.side === 'seller' ? 'XYZ Capital' : 'ABC Textiles') : (currentUser?.company || 'Company');

    setIsSubmitting(true);
    try {
      const created = await createTask({
        title: title.trim(),
        description: description.trim(),
        visibility,
        target_side: targetSide,
        target_company: targetCompany,
        creator_side: currentUser?.side || 'seller',
        creator_company: currentUser?.company || 'ABC Textiles',
        department: department || 'General',
        workstream: department || 'General',
        assigned_to_group: assignedGroup || '',
        assigned_to_user: finalAssignee,
        priority,
        deal_stage: dealStage,
        is_enabled: isStageActive,
        due_date: dueDate || null,
        subtasks: subtasks,
        claimable_by_role: true,
        created_by: currentUser?.name || 'Creator',
        creator_role: currentUser?.role || 'admin',
      });

      if (created) {
        handleClose();
      }
    } catch (err) {
      console.error('Error submitting new task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`,
    }));
    setSubtaskAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setSubtaskAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddSubtaskSubmit = (e) => {
    if (e) e.preventDefault();
    if (!subtaskTitle.trim()) return;

    const newSubtask = {
      id: `sub_${Date.now()}`,
      title: subtaskTitle.trim(),
      description: subtaskDescription.trim(),
      assignedGroup: assignedGroup || '',
      assignedMember: subtaskMember || (subtaskAssignableMembers.length > 0 ? subtaskAssignableMembers[0].name : 'Unassigned'),
      priority: subtaskPriority,
      dueDate: subtaskDueDate,
      attachments: subtaskAttachments,
      status: 'TO_DO',
    };

    setSubtasks((prev) => [...prev, newSubtask]);
    setSubtaskTitle('');
    setSubtaskDescription('');
    setSubtaskDueDate('');
    setSubtaskPriority('High');
    setSubtaskAttachments([]);
    setIsAddSubtaskModalOpen(false);
  };

  const handleRemoveSubtask = (indexToRemove) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  if (!isCreateModalOpen) return null;
  if (normalizeRole(currentUser?.role) === 'internal_user') return null;

  return (
    <>
      {/* ========================================================================= */}
      {/* MAIN CREATE NEW TASK MODAL */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
            {/* Modal Title & Subtitle */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Task
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Creating as <span className="font-semibold text-slate-700">{currentUser?.name || 'User'}</span> · {currentUser?.company || 'Company'} ({isSeller ? 'Seller' : 'Buyer'})
              </div>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Financial Due Diligence"
                className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 bg-white"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add task details, requirements, or links..."
                className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
              />
            </div>

            {/* Row: Visibility & Department */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Visibility</span>
                  {isSuperAdmin && (
                    <span className="text-[10px] font-normal text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                      Cross-Party Access
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => {
                      if (!isSuperAdmin && e.target.value === 'EXTERNAL') return;
                      setVisibility(e.target.value);
                    }}
                    disabled={!isSuperAdmin}
                    className={`w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all ${!isSuperAdmin ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                  >
                    <option value="INTERNAL">Internal ({currentUser?.company || 'Internal Team'})</option>
                    {isSuperAdmin ? (
                      <option value="EXTERNAL">External (Buyer Side)</option>
                    ) : (
                      <option value="EXTERNAL" disabled>External (Super Admin only)</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only Super Admin can assign tasks to external counterparty groups.
                  </p>
                )}
              </div>

              {/* Department Field (Replaces Workstream) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {departments.length === 0 ? (
                      <option value="">No departments found</option>
                    ) : (
                      departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>



            {/* Row: Assign to group & Priority */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Dynamic Group List based on chosen Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{visibility === 'EXTERNAL' ? 'Assign to buyer group *' : 'Assign to group *'}</span>
                  {visibility === 'EXTERNAL' && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-medium">
                      Counterparty
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={assignedGroup}
                    onChange={(e) => setAssignedGroup(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {availableGroups.length === 0 ? (
                      <option value="">No {visibility === 'EXTERNAL' ? 'buyer' : 'subordinate'} groups in this department</option>
                    ) : (
                      availableGroups.map((g) => (
                        <option key={g.id || g.name} value={g.name}>
                          {g.displayName}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assign to Member (Role Hierarchy Enforced & Creator Excluded) */}


            {/* Row: Deal stage & Due date */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deal stage
                </label>
                <div className="relative">
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s} {normalizeStage(s) === normalizeStage(activeDealStage) ? '(Active)' : '(Disabled)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due date
                </label>
                <div className="relative">
                  <input
                    type={dueDate ? "date" : "text"}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all placeholder:text-slate-400 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Informative Staging Note for Non-Active Stage Creation */}
            {normalizeStage(dealStage) !== normalizeStage(activeDealStage) && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{dealStage} is currently disabled</span> (Active stage is <span className="font-bold">{activeDealStage}</span>). This task will be saved in <span className="font-bold">Task Creation</span> and can be enabled once Super Admin activates {dealStage}.
                </div>
              </div>
            )}

            {/* Subtasks Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Subtasks
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubtaskModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs transition-colors cursor-pointer"
                >
                  + Add Subtask
                </button>
              </div>

              {subtasks.length === 0 ? (
                <p className="text-sm text-slate-500 font-normal mt-2.5">
                  No subtasks added yet
                </p>
              ) : (
                <div className="space-y-2 mt-3 max-h-44 overflow-y-auto pr-1">
                  {subtasks.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {st.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {st.assignedGroup && (
                            <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                              <Users className="w-3 h-3 text-slate-400" />
                              {st.assignedGroup}
                            </span>
                          )}
                          {st.assignedMember && (
                            <span className="inline-flex items-center gap-1 text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                              <User className="w-3 h-3 text-teal-600" />
                              {st.assignedMember}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${st.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : st.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                          >
                            {st.priority}
                          </span>
                          {st.dueDate && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {st.dueDate}
                            </span>
                          )}
                          {st.attachments && st.attachments.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              {st.attachments.length} {st.attachments.length === 1 ? 'file' : 'files'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Remove subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Cancel & Create Main Task buttons */}
            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Main Task</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD SUBTASK MODAL - DYNAMIC GROUP -> MEMBERS CASCADE */}
      {/* ========================================================================= */}
      {isAddSubtaskModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddSubtaskModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[490px] p-5 sm:p-6 space-y-3.5 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Add Subtask
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Parent task: <span className="font-semibold text-slate-700">{title.trim() || 'New task'}</span> · Group: <span className="font-semibold text-[#006666]">{assignedGroup || 'General'}</span>
                </div>
              </div>

              {/* Subtask Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtask title *
                </label>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="e.g. Prepare financial statement reconciliation"
                  className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 bg-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={subtaskDescription}
                  onChange={(e) => setSubtaskDescription(e.target.value)}
                  placeholder="Add specific instructions for this subtask..."
                  className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
                />
              </div>

              {/* Assign Member (Members of selected group according to role hierarchy) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assign member *
                  </label>
                  {assignedGroup && (
                    <span className="text-[10px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {assignedGroup}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={subtaskMember}
                    onChange={(e) => setSubtaskMember(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {subtaskAssignableMembers.length === 0 ? (
                      <option value="">No subordinate members available in {assignedGroup || 'group'}</option>
                    ) : (
                      subtaskAssignableMembers.map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name} ({m.roleLabel || m.role})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {subtaskAssignableMembers.length > 0 ? (
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    <span>
                      {roleHierarchy?.[normalizeRole(currentUser?.role)]?.desc || 'Select subordinate member in this group'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <p className="font-semibold">⚠️ Cannot assign members in {assignedGroup || 'this group'}</p>
                    <p className="mt-0.5">
                      {roleHierarchy?.[normalizeRole(currentUser?.role)]?.desc || 'You can only assign to lower roles.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Row: Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={subtaskPriority}
                      onChange={(e) => setSubtaskPriority(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due date
                  </label>
                  <div className="relative">
                    <input
                      type={subtaskDueDate ? "date" : "text"}
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      value={subtaskDueDate}
                      onChange={(e) => setSubtaskDueDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all placeholder:text-slate-400 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attachments
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    id="subtask-file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="subtask-file-upload"
                    className="flex items-center justify-between w-full px-3 py-2 text-xs text-slate-600 rounded-lg border border-dashed border-slate-300 hover:border-[#006666] bg-slate-50/70 hover:bg-slate-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-[#006666] transition-colors" />
                      <span className="font-medium text-slate-600 group-hover:text-slate-800">
                        Attach documents or files
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs group-hover:border-[#006666]/40 transition-colors">
                      Browse
                    </span>
                  </label>
                </div>

                {/* Attached Files List */}
                {subtaskAttachments.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-0.5">
                    {subtaskAttachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#006666] shrink-0" />
                          <span className="truncate font-medium text-slate-800 max-w-[240px]">
                            {file.name}
                          </span>
                          {file.size && (
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              ({file.size})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Cancel & Add Subtask buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddSubtaskModalOpen(false)}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSubtaskSubmit}
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Add Subtask
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
