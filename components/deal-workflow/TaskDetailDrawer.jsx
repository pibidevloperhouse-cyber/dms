"use client";

import React, { useState } from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import {
  FileText,
  Paperclip,
  Clock,
  CheckCircle2,
  User,
  ListTodo,
  Trash2,
  Send,
  MessageSquare,
  Lock,
  Globe,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function TaskDetailDrawer() {
  const {
    currentUser,
    selectedTask,
    setSelectedTask,
    claimTask,
    submitForReview,
    approveAndComplete,
    sendBack,
    toggleSubtask,
    addComment,
    deleteTask,
    canUserClaimTask,
    canUserSubmitForReview,
    canUserApproveTask,
    isTaskCreator,
    isTaskAssignee,
    setSigningModalTask,
    setCertificateModalTask,
  } = useDealWorkflow();

  const [commentText, setCommentText] = useState('');
  const [commentScope, setCommentScope] = useState('INTERNAL');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!selectedTask) return null;

  const isCreator = isTaskCreator ? isTaskCreator(selectedTask, currentUser) : false;
  const isAssignee = isTaskAssignee ? isTaskAssignee(selectedTask, currentUser) : (selectedTask.assigned_to_user === currentUser.name);

  const isCreatorSide = currentUser.side === selectedTask.creator_side;
  const isTargetSide = currentUser.side === selectedTask.target_side;

  const subtasksList = selectedTask.subtasks || [];
  const totalSubtasks = subtasksList.length;
  const completedSubtasks = subtasksList.filter((s) => s.status === 'DONE').length;

  const mySubtasks = subtasksList.filter(
    (s) => s.assignedMember === currentUser.name || s.assigned_to_user === currentUser.name
  );

  const statusSteps = [
    { key: 'TO_DO', label: 'To Do' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'REVIEW', label: 'Review' },
    { key: 'DONE', label: 'Done' },
  ];
  const currentStepIndex = statusSteps.findIndex((s) => s.key === selectedTask.status);

  // Collect all attachments from task and subtasks
  const allAttachments = [];
  if (selectedTask.linked_document) {
    allAttachments.push({
      name: selectedTask.linked_document,
      type: 'Linked Document',
      source: 'Main Task',
      signed: Boolean(selectedTask.digital_signature),
    });
  }
  subtasksList.forEach((st) => {
    (st.attachments || []).forEach((att) => {
      allAttachments.push({
        name: att.name || att,
        size: att.size || null,
        type: 'Subtask Attachment',
        source: st.title,
      });
    });
  });


  const isSigningEligible =
    selectedTask.linked_document &&
    selectedTask.status === 'IN_PROGRESS' &&
    !isCreator &&
    (selectedTask.assigned_to_user === currentUser.name || currentUser.role.includes('Admin')) &&
    isTargetSide &&
    !selectedTask.digital_signature;

  const canClaim = canUserClaimTask ? canUserClaimTask(selectedTask, currentUser) : false;
  const canSubmit = canUserSubmitForReview ? canUserSubmitForReview(selectedTask, currentUser) : false;
  const canApprove = canUserApproveTask ? canUserApproveTask(selectedTask, currentUser) : false;

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      await addComment(selectedTask.task_id, commentText, commentScope);
      setCommentText('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteTask(selectedTask.task_id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Comments filtered by bilateral visibility
  const commentsList = (selectedTask.comments || []).filter((c) => {
    if (c.scope === 'EXTERNAL') return true;
    return c.company === currentUser.company;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div
        className="absolute inset-0"
        onClick={() => setSelectedTask(null)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-[540px] sm:max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-300">

          {/* ========================================================================= */}
          {/* HEADER */}
          {/* ========================================================================= */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {selectedTask.task_id}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${selectedTask.priority === 'High'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : selectedTask.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                  {selectedTask.priority}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Delete Task Button */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Task"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-3.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Delete Confirmation Modal / Banner */}
            {showDeleteConfirm && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Permanently delete this task?</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      This will remove the task, all subtasks, audit logs, and notes from the database.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleDeleteTask}
                        disabled={isDeleting}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-xs cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 bg-white border border-rose-200 text-slate-700 font-semibold text-xs rounded-md hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900 mt-2 tracking-tight leading-snug">
              {selectedTask.title}
            </h2>

            {/* 4-Stage Workflow Stepper Bar */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {statusSteps.map((step, idx) => {
                const isCurrent = step.key === selectedTask.status;
                const isPassed = idx < currentStepIndex;

                let btnStyle = 'bg-slate-100/80 text-slate-400';
                if (isCurrent) {
                  btnStyle = 'bg-[#006666] text-white font-bold shadow-xs';
                } else if (isPassed || selectedTask.status === 'DONE') {
                  btnStyle = 'bg-emerald-100/70 text-emerald-800 font-semibold border border-emerald-200/60';
                }

                return (
                  <div
                    key={step.key}
                    className={`py-1.5 px-2 rounded-lg text-xs text-center transition-all ${btnStyle}`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BODY CONTENT */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs text-slate-700">

            {/* --------------------------------------------------------------------- */}
            {/* STAGE 1: TO DO (JUST A LIST OF ASSIGNED TASKS / SUBTASKS) */}
            {/* --------------------------------------------------------------------- */}
            {selectedTask.status === 'TO_DO' && (
              <div className="bg-[#f0fdfa]/70 border border-teal-100 rounded-xl p-4 shadow-2xs">
                {/* Task Creator Notice Banner */}
                {isCreator && (
                  <div className="mb-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-indigo-950">Task Creator Mode (Cannot Claim)</p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        You created this task. Task creators cannot claim their own task. It is awaiting claim by the assigned member or group.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-[#006666]" />
                    <span>Assigned Tasks & Subtasks</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {subtasksList.length > 0 ? `${subtasksList.length} items` : '1 item'}
                  </span>
                </div>

                {subtasksList.length > 0 ? (
                  <div className="space-y-2">
                    {subtasksList.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-lg bg-white/90 border border-teal-100/80 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 leading-snug">
                            {st.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            To Do
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                          {st.assignedGroup && (
                            <span className="font-medium text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                              {st.assignedGroup}
                            </span>
                          )}
                          {st.dueDate && <span>Due {st.dueDate}</span>}
                          <span>·</span>
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="w-3 h-3 text-slate-400" />
                            Assigned to: <strong className="text-slate-900">{st.assignedMember || st.assigned_to_user || 'Unassigned'}</strong>
                          </span>
                        </div>
                        {st.attachments && st.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {st.attachments.map((att, aIdx) => (
                              <span
                                key={aIdx}
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                              >
                                <Paperclip className="w-2.5 h-2.5 text-[#006666]" />
                                <span className="truncate max-w-[200px] text-teal-800">{att.name || att}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-white/90 border border-teal-100/80 shadow-2xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900 leading-snug">
                        {selectedTask.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        To Do
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                      <span>Due {selectedTask.due_date}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        Assigned to: <strong className="text-slate-900">{selectedTask.assigned_to_user || selectedTask.assigned_to_group || 'Unassigned (Claimable)'}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* STAGE 2: IN PROGRESS (CHECKLIST UI EXACTLY AS IN IMAGE) */}
            {/* --------------------------------------------------------------------- */}
            {selectedTask.status === 'IN_PROGRESS' && (
              <div className="bg-[#f0fdfa]/70 border border-teal-100 rounded-xl p-4 shadow-2xs">
                {/* Role Awareness Banner for In Progress */}
                {isCreator ? (
                  <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-950">In Progress — Progress Monitoring Mode</p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        This task is being worked on by <strong>{selectedTask.assigned_to_user || 'Assignee'}</strong>. You can view the progress, but only the assigned member can submit for review.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-teal-950">Task In Progress — Assigned to You</p>
                      <p className="text-[11px] text-teal-700 mt-0.5">
                        Complete your deliverables and checklist items below, then click &quot;Submit Review&quot; in the bottom bar to forward to creator for sign-off.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Subtasks
                  </h4>
                  <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {subtasksList.length > 0 ? `${completedSubtasks}/${totalSubtasks} completed` : 'In Progress'}
                  </span>
                </div>

                {subtasksList.length > 0 ? (
                  <div className="space-y-2">
                    {subtasksList.map((st) => {
                      const isDone = st.status === 'DONE';
                      const isMine = st.assignedMember === currentUser.name || st.assigned_to_user === currentUser.name;
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (!isCreator) toggleSubtask(selectedTask.task_id, st.id);
                          }}
                          className={`flex items-start justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-teal-100/70 transition-colors ${
                            isCreator ? 'cursor-default' : 'hover:bg-white hover:border-teal-200 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isDone}
                              disabled={isCreator}
                              onChange={() => { }}
                              className="w-4 h-4 mt-0.5 rounded text-[#006666] border-slate-300 accent-[#006666] disabled:cursor-not-allowed cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className={`font-medium text-xs leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {st.title}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                {st.assignedGroup && (
                                  <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {st.assignedGroup}
                                  </span>
                                )}
                                {st.dueDate && <span>Due {st.dueDate}</span>}
                                <span>·</span>
                                <span className={`font-medium ${isMine ? 'text-[#006666] font-semibold' : 'text-slate-600'}`}>
                                  {st.assignedMember || st.assigned_to_user || 'Unassigned'}
                                </span>
                              </div>
                              {st.attachments && st.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {st.attachments.map((att, aIdx) => (
                                    <span
                                      key={aIdx}
                                      className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                                    >
                                      <Paperclip className="w-2.5 h-2.5 text-[#006666]" />
                                      <span className="truncate max-w-[200px] text-teal-800 font-medium">{att.name || att}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className={`text-[11px] font-medium shrink-0 ${isDone ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                            {isDone ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/80 border border-teal-100/70 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {selectedTask.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due {selectedTask.due_date} · Assigned to {selectedTask.assigned_to_user || 'You'}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      In Progress
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* STAGE 3 & 4: REVIEW & DONE (SHOW ONLY 1 TASK) */}
            {/* --------------------------------------------------------------------- */}
            {(selectedTask.status === 'REVIEW' || selectedTask.status === 'DONE') && (
              <div className="bg-[#f0fdfa]/70 border border-teal-100 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedTask.status === 'REVIEW' ? 'Task Under Review' : 'Completed Task'}
                  </h4>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${selectedTask.status === 'DONE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                    {selectedTask.status === 'DONE' ? 'Done' : 'Review'}
                  </span>
                </div>

                {/* Creator Review vs Assignee Banner */}
                {selectedTask.status === 'REVIEW' && (
                  isCreator ? (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">Review Stage — Creator Sign-Off Required</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Submitted for review by <strong>{selectedTask.assigned_to_user || 'Assignee'}</strong>. Inspect the deliverables below and click <strong>&quot;Review & Mark as Done&quot;</strong> in the bottom bar to complete, or <strong>&quot;Request Changes&quot;</strong> to send back for revisions.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">Submitted for Review</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          This task is currently under review by task creator <strong>{selectedTask.created_by || 'Creator'}</strong>. Waiting for final review and sign-off.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {(() => {
                  const singleItem = subtasksList.length > 0 ? subtasksList[0] : null;
                  const itemTitle = singleItem ? singleItem.title : selectedTask.title;
                  const itemAssignee = singleItem ? (singleItem.assignedMember || singleItem.assigned_to_user || 'Assigned') : (selectedTask.assigned_to_user || 'Assigned');
                  const itemDueDate = singleItem?.dueDate || selectedTask.due_date;
                  const isDone = selectedTask.status === 'DONE' || singleItem?.status === 'DONE';

                  return (
                    <div className="p-3 rounded-lg bg-white/90 border border-teal-100/80 shadow-2xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${isDone ? 'text-emerald-600' : 'text-amber-500'}`} />
                          <span className="font-semibold text-xs text-slate-900 leading-snug">
                            {itemTitle}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${selectedTask.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                          {selectedTask.status === 'DONE' ? 'Done' : 'Under Review'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                        {itemDueDate && <span>Due {itemDueDate}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          Assigned to: <strong className="text-slate-900">{itemAssignee}</strong>
                        </span>
                      </div>
                      {singleItem?.attachments && singleItem.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {singleItem.attachments.map((att, aIdx) => (
                            <span
                              key={aIdx}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                            >
                              <Paperclip className="w-2.5 h-2.5 text-[#006666]" />
                              <span className="truncate max-w-[200px] text-teal-800">{att.name || att}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Task details Section */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                Task details
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                {selectedTask.description || 'No description provided.'}
              </p>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Visibility</span>
                  <span className="col-span-2 text-slate-800 font-semibold capitalize">
                    {selectedTask.visibility.toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Assigned group</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.assigned_to_group}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Assignee</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.assigned_to_user || <span className="text-slate-400">Unassigned (Claimable)</span>}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.department || selectedTask.workstream}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Deal stage</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.deal_stage}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Due date</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.due_date}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Requested by</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {isCreatorSide ? 'Own team' : selectedTask.creator_company}
                  </span>
                </div>
              </div>
            </div>

            {/* Attached Documents Section (if any) */}
            {allAttachments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  Attached Documents ({allAttachments.length})
                </h4>
                <div className="space-y-2">
                  {allAttachments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#006666] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {doc.type} · from {doc.source}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.signed && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Signed
                          </span>
                        )}
                        <span className="text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-white cursor-pointer">
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* COMMENTS & ACTIVITY NOTES SECTION (Fully Backend Connected) */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#006666]" />
                  <span>Discussion & Notes</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {commentsList.length} {commentsList.length === 1 ? 'note' : 'notes'}
                </span>
              </div>

              {/* Comments List */}
              <div className="space-y-2.5 mb-3 max-h-60 overflow-y-auto pr-1">
                {commentsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No notes or comments yet. Add an internal or shared note below.
                  </p>
                ) : (
                  commentsList.map((comm) => {
                    const isInternal = comm.scope === 'INTERNAL';
                    return (
                      <div
                        key={comm.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          isInternal
                            ? 'bg-slate-50/80 border-slate-200'
                            : 'bg-purple-50/50 border-purple-200/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{comm.author}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({comm.company})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                                isInternal
                                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                                  : 'bg-purple-100/70 text-purple-700 border-purple-200'
                              }`}
                            >
                              {isInternal ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                              <span>{isInternal ? 'Internal' : 'External'}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{comm.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{comm.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handlePostComment} className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-600">Add Note:</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setCommentScope('INTERNAL')}
                      className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                        commentScope === 'INTERNAL'
                          ? 'bg-[#006666] text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-2.5 h-2.5" />
                      <span>Internal (My Team)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentScope('EXTERNAL')}
                      className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                        commentScope === 'EXTERNAL'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>External (Shared)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      commentScope === 'INTERNAL'
                        ? 'Write an internal note for your team...'
                        : 'Write a note visible to counterparty...'
                    }
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#006666]"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 text-white transition-all ${
                      commentText.trim() && !isSubmittingComment
                        ? 'bg-[#006666] hover:bg-[#005555] shadow-xs cursor-pointer'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmittingComment ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* DRAWER FOOTER ACTIONS */}
          {/* ========================================================================= */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2.5">
            {/* If task is TO_DO */}
            {selectedTask.status === 'TO_DO' && (
              canClaim ? (
                <button
                  type="button"
                  onClick={() => claimTask(selectedTask.task_id)}
                  className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Claim Task</span>
                </button>
              ) : isCreator ? (
                <span className="text-xs text-slate-700 font-medium px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Created by You (Tracking Mode · Cannot Claim)</span>
                </span>
              ) : (
                <span className="text-xs text-slate-600 font-medium px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                  <span>Assigned to {selectedTask.assigned_to_user || selectedTask.assigned_to_group}</span>
                </span>
              )
            )}

            {/* If task is IN_PROGRESS */}
            {selectedTask.status === 'IN_PROGRESS' && (
              isCreator ? (
                <span className="text-xs text-blue-800 font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Progress Monitoring · {selectedTask.assigned_to_user || 'Assignee'} working</span>
                </span>
              ) : isSigningEligible ? (
                <button
                  type="button"
                  onClick={() => setSigningModalTask(selectedTask)}
                  className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Review & Sign Document</span>
                </button>
              ) : canSubmit ? (
                <button
                  type="button"
                  onClick={() => submitForReview(selectedTask.task_id)}
                  className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Submit Review</span>
                </button>
              ) : (
                <span className="text-xs text-blue-800 font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Work in progress by {selectedTask.assigned_to_user || selectedTask.assigned_to_group}</span>
                </span>
              )
            )}

            {/* If task is in REVIEW */}
            {selectedTask.status === 'REVIEW' && (
              canApprove ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt('Specify revisions required:', 'Revisions requested by reviewer') || 'Revisions requested by reviewer';
                      sendBack(selectedTask.task_id, reason);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => approveAndComplete(selectedTask.task_id)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Review & Mark as Done</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Waiting for Review by {selectedTask.created_by || 'Task Creator'}</span>
                </div>
              )
            )}

            {/* If task is DONE */}
            {selectedTask.status === 'DONE' && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marked as Done ✓</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
