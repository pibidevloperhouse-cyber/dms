"use client";

import React, { useState, useEffect } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { ChevronDown, User, Calendar, Trash2, Paperclip, FileText, X } from 'lucide-react';
import { WORKSTREAMS, PRIORITIES, DEAL_STAGES } from './DealWorkflowContext';

const GROUP_MEMBERS = {
  'Seller Finance Team': ['Ravi', 'Lakshmi'],
  'Seller Legal Team': ['Ravi', 'Seller Legal Counsel'],
  'Seller Operations Team': ['Ravi', 'Operations Lead'],
  'Buyer Legal Team': ['Arjun', 'Priya Sharma'],
  'Buyer Finance Team': ['Arjun', 'Buyer Finance Lead'],
  'Buyer Operations Team': ['Arjun', 'Buyer Operations Lead'],
};

export default function CreateTaskModal() {
  const {
    currentUser,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createTask,
    getSmartGroupsForVisibility,
  } = useDealWorkflow();

  // Main task fields matching Image 2
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('INTERNAL');
  const [assignedGroup, setAssignedGroup] = useState('Seller Finance Team');
  const [workstream, setWorkstream] = useState('Finance');
  const [priority, setPriority] = useState('High');
  const [dealStage, setDealStage] = useState('Due Diligence');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  // Subtask modal state matching Image 3
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskMember, setSubtaskMember] = useState('Ravi');
  const [subtaskPriority, setSubtaskPriority] = useState('High');
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [subtaskAttachments, setSubtaskAttachments] = useState([]);

  // Available groups dynamically computed based on currentUser + visibility
  const availableGroups = getSmartGroupsForVisibility(visibility, currentUser);

  // Members list for the currently assigned group
  const membersForGroup = GROUP_MEMBERS[assignedGroup] || [currentUser.name, 'Team Member'];

  useEffect(() => {
    if (availableGroups.length > 0 && (!assignedGroup || !availableGroups.includes(assignedGroup))) {
      setAssignedGroup(availableGroups[0]);
    }
  }, [visibility, currentUser, availableGroups, assignedGroup]);

  // Keep subtask member in sync with the assigned group
  useEffect(() => {
    if (membersForGroup.length > 0 && !membersForGroup.includes(subtaskMember)) {
      setSubtaskMember(membersForGroup[0]);
    }
  }, [assignedGroup, membersForGroup, subtaskMember]);

  if (!isCreateModalOpen) return null;

  const isSeller = currentUser.side === 'seller';

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setVisibility('INTERNAL');
    setAssignedGroup(availableGroups[0] || 'Seller Finance Team');
    setWorkstream('Finance');
    setPriority('High');
    setDealStage('Due Diligence');
    setDueDate('');
    setSubtasks([]);
    setSubtaskAttachments([]);
    setIsAddSubtaskModalOpen(false);
    setIsCreateModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title: title.trim(),
      description: description.trim(),
      visibility,
      assigned_to_group: assignedGroup || availableGroups[0],
      workstream,
      priority,
      deal_stage: dealStage,
      due_date: dueDate || '2026-10-15',
      subtasks: subtasks,
      claimable_by_role: true,
    });

    handleClose();
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
      assignedMember: subtaskMember || membersForGroup[0] || currentUser.name,
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

  return (
    <>
      {/* ========================================================================= */}
      {/* IMAGE 2: CREATE NEW TASK MODAL */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[490px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
            {/* Modal Title & Subtitle */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Create New Task
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Creating as <span className="font-semibold text-slate-700">{currentUser.name}</span> · {currentUser.company} ({isSeller ? 'Seller' : 'Buyer'})
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
                className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all placeholder:text-slate-400 bg-white"
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
                className="w-full px-3 py-1.5 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
              />
            </div>

            {/* Row: Visibility & Assign to group */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visibility
                </label>
                <div className="relative">
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workstream
                </label>
                <div className="relative">
                  <select
                    value={workstream}
                    onChange={(e) => setWorkstream(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {WORKSTREAMS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Row: Workstream & Priority */}
            <div className="grid grid-cols-2 gap-3.5">

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign to group
                </label>
                <div className="relative">
                  <select
                    value={assignedGroup}
                    onChange={(e) => setAssignedGroup(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer truncate"
                  >
                    {availableGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
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
                          {st.assignedMember && (
                            <span className="inline-flex items-center gap-1 text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              <User className="w-3 h-3 text-slate-400" />
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
                className="px-5 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                Create Main Task
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMAGE 3: ADD SUBTASK MODAL */}
      {/* ========================================================================= */}
      {isAddSubtaskModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddSubtaskModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[480px] p-5 sm:p-6 space-y-3.5 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
              {/* Header */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Add Subtask
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Parent task: {title.trim() || 'New task'}
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
                  className="w-full px-3 py-2 text-sm text-slate-900 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none transition-all resize-y bg-white min-h-[58px]"
                />
              </div>

              {/* Assign Member */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign member * <span className="font-normal text-slate-500">(members of {assignedGroup} only)</span>
                </label>
                <div className="relative">
                  <select
                    value={subtaskMember}
                    onChange={(e) => setSubtaskMember(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm text-slate-800 rounded-lg border border-slate-200 hover:border-slate-300 focus:border-[#006666] focus:outline-none bg-white transition-all cursor-pointer"
                  >
                    {membersForGroup.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
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
