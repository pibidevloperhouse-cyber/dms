"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, User, Calendar, Trash2, Paperclip, X, Users, Edit3, Plus, ShieldCheck, Globe } from 'lucide-react';
import { PRIORITIES, DEAL_STAGES } from './DealWorkflowContext';

export default function EditTaskModal({ task, isOpen, onClose }) {
  const {
    currentUser,
    updateTask,
    departments,
    workflowGroups,
    externalGroups,
    getGroupsForDepartment,
    getAssignableMembersForGroup,
    roleHierarchy,
    normalizeRole,
    getRoleLabel,
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

  // Subtask creation state
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskMember, setSubtaskMember] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState('High');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskAttachments, setSubtaskAttachments] = useState([]);

  // Populate form with task details whenever task changes or modal opens
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setVisibility(task.visibility || 'INTERNAL');
      setDepartment(task.department || task.workstream || (departments[0] || 'General'));
      setAssignedGroup(task.assigned_to_group || '');
      setAssignedMember(task.assigned_to_user || '');
      setPriority(task.priority || 'High');
      setDealStage(task.deal_stage || 'Preparation');
      setDueDate(task.due_date || '');
      setSubtasks(Array.isArray(task.subtasks) ? [...task.subtasks] : []);
    }
  }, [task, isOpen, departments]);

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

    // Always preserve currently assigned group if editing
    list = list.filter((g) => {
      if (task?.assigned_to_group && g.name === task.assigned_to_group) return true;
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
  }, [visibility, department, workflowGroups, externalGroups, isSuperAdmin, currentUser, roleHierarchy, normalizeRole, getRoleLabel, task]);

  // Subordinate members available for assignment strictly within assignedGroup
  const assignableMembers = useMemo(() => {
    if (!assignedGroup) return [];
    if (getAssignableMembersForGroup) {
      return getAssignableMembersForGroup(assignedGroup, currentUser);
    }
    return [];
  }, [assignedGroup, getAssignableMembersForGroup, currentUser]);

  // Sync subtask default member when modal opens
  useEffect(() => {
    if (assignableMembers.length > 0) {
      if (!subtaskMember || !assignableMembers.some((m) => m.name === subtaskMember)) {
        setSubtaskMember(assignableMembers[0].name);
      }
    } else {
      setSubtaskMember('');
    }
  }, [assignableMembers, subtaskMember, isAddSubtaskModalOpen]);

  if (!isOpen || !task) return null;

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

  const handleRemoveAttachment = (idxToRemove) => {
    setSubtaskAttachments((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleAddSubtaskSubmit = (e) => {
    if (e) e.preventDefault();
    if (!subtaskTitle.trim()) return;

    const newSubtask = {
      id: `sub_${Date.now()}`,
      title: subtaskTitle.trim(),
      description: subtaskDescription.trim(),
      assignedGroup: assignedGroup || '',
      assignedMember: subtaskMember || (assignableMembers.length > 0 ? assignableMembers[0].name : 'Unassigned'),
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

  const handleRemoveSubtask = (idxToRemove) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleUpdateSubtaskMember = (subtaskId, newMember) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, assignedMember: newMember } : st))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    // Check final assignee
    const firstAssigned = subtasks.find((st) => st.assignedMember && st.assignedMember !== 'Unassigned');
    const finalAssignee = assignedMember || firstAssigned?.assignedMember || null;

    // RULE: Task creator cannot assign to themselves
    if (finalAssignee && currentUser?.name && finalAssignee.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      alert('Task creator cannot assign tasks to themselves. Please select a subordinate team member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isExternal = visibility === 'EXTERNAL';
      const targetSide = isExternal ? (currentUser?.side === 'seller' ? 'buyer' : 'seller') : (currentUser?.side || 'seller');
      const targetCompany = isExternal ? (currentUser?.side === 'seller' ? 'XYZ Capital' : 'ABC Textiles') : (currentUser?.company || 'Company');

      await updateTask(task.task_id, {
        title: title.trim(),
        description: description.trim(),
        visibility,
        target_side: targetSide,
        target_company: targetCompany,
        department: department || 'General',
        workstream: department || 'General',
        assigned_to_group: assignedGroup || '',
        assigned_to_user: finalAssignee,
        priority,
        deal_stage: dealStage,
        due_date: dueDate || null,
        subtasks,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[540px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#006666] flex items-center justify-center border border-teal-200">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Edit Task Details
                </h2>
                <div className="text-xs text-slate-500">
                  Editing task <span className="font-mono font-semibold text-slate-700">{task.task_id}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
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
                placeholder="Add task details, requirements, or instructions..."
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
                    className={`w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all ${
                      !isSuperAdmin ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'cursor-pointer'
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      const newGroups = getGroupsForDepartment(e.target.value, visibility);
                      if (newGroups.length > 0) setAssignedGroup(newGroups[0]);
                    }}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                    required
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* External Buyer Assignment Notification Banner */}
            {visibility === 'EXTERNAL' && (
              <div className="bg-purple-50/90 border border-purple-200/90 rounded-xl p-2.5 flex items-start gap-2 text-purple-950 text-xs">
                <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Assigning to External Buyer Group</span> — This task will be assigned across party lines to <span className="font-semibold">XYZ Capital (Buyer)</span>.
                </div>
              </div>
            )}

            {/* Row: Assign to group & Priority */}
            <div className="grid grid-cols-2 gap-3.5">
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
                      <option value="">No {visibility === 'EXTERNAL' ? 'buyer' : 'subordinate'} groups in department</option>
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
                      <option key={s} value={s}>{s}</option>
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
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assigned Subtasks ({subtasks.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Re-assign members or add new subtask deliverables
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSubtaskModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#006666] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subtask</span>
                </button>
              </div>

              {subtasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  No subtasks configured yet
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subtasks.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate flex-1">
                          {st.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                            st.status === 'DONE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {st.status === 'DONE' ? 'Done' : 'To Do'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remove subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        {/* Assignee Selector for Subtask */}
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-600" />
                          <select
                            value={st.assignedMember || ''}
                            onChange={(e) => handleUpdateSubtaskMember(st.id, e.target.value)}
                            className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#006666]"
                          >
                            <option value="">Unassigned</option>
                            {assignableMembers.map((m) => (
                              <option key={m.id || m.name} value={m.name}>
                                {m.name} ({m.roleLabel || m.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {st.dueDate && <span>Due {st.dueDate}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD SUBTASK MODAL */}
      {/* ========================================================================= */}
      {isAddSubtaskModalOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddSubtaskModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[440px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Add Subtask
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubtaskModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubtaskSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtask title *
                </label>
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="e.g. Verify tax filings for FY 2024"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign To Subordinate *
                </label>
                <div className="relative">
                  <select
                    value={subtaskMember}
                    onChange={(e) => setSubtaskMember(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white cursor-pointer"
                    required
                  >
                    {assignableMembers.length === 0 ? (
                      <option value="">No subordinate members in group</option>
                    ) : (
                      assignableMembers.map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name} ({m.roleLabel || m.role})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={subtaskPriority}
                    onChange={(e) => setSubtaskPriority(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due date
                  </label>
                  <input
                    type="date"
                    value={subtaskDueDate}
                    onChange={(e) => setSubtaskDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#006666] bg-white font-sans"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubtaskModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#006666] hover:bg-[#005555] text-white text-xs font-semibold shadow-xs"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
