"use client";

import React from 'react';
import { useDealWorkflow } from './DealWorkflowContext';
import { 
  FileText, 
  Paperclip
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
    setSigningModalTask,
    setCertificateModalTask,
  } = useDealWorkflow();

  if (!selectedTask) return null;

  const isCreatorSide = currentUser.side === selectedTask.creator_side;
  const isTargetSide = currentUser.side === selectedTask.target_side;

  const isSigningEligible = 
    selectedTask.linked_document && 
    selectedTask.status === 'IN_PROGRESS' && 
    (selectedTask.assigned_to_user === currentUser.name || currentUser.role.includes('Admin')) &&
    isTargetSide &&
    !selectedTask.digital_signature;

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div 
        className="absolute inset-0" 
        onClick={() => setSelectedTask(null)} 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-[500px] sm:max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-300">
          
          {/* ========================================================================= */}
          {/* HEADER */}
          {/* ========================================================================= */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {selectedTask.task_id}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                  selectedTask.priority === 'High' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : selectedTask.priority === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-3.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

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

            {/* Subtasks Section (if subtasks exist) */}
            {subtasksList.length > 0 && (
              <div className="border-l-4 border-l-[#006666] bg-[#f0fdfa]/70 border border-teal-100 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    {mySubtasks.length > 0 && mySubtasks.length < totalSubtasks 
                      ? 'Subtasks & Assigned Work' 
                      : 'Subtasks'}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {completedSubtasks}/{totalSubtasks} completed
                  </span>
                </div>

                <div className="space-y-2">
                  {subtasksList.map((st) => {
                    const isDone = st.status === 'DONE';
                    const isMine = st.assignedMember === currentUser.name || st.assigned_to_user === currentUser.name;
                    return (
                      <div 
                        key={st.id} 
                        onClick={() => toggleSubtask(selectedTask.task_id, st.id)}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-teal-100/70 hover:bg-white hover:border-teal-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}}
                            className="w-4 h-4 mt-0.5 rounded text-[#006666] border-slate-300 cursor-pointer accent-[#006666]"
                          />
                          <div className="min-w-0">
                            <div className={`font-medium text-xs leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {st.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {st.dueDate && <span>Due {st.dueDate}</span>}
                              <span>·</span>
                              <span className={`font-medium ${isMine ? 'text-[#006666] font-semibold' : 'text-slate-600'}`}>
                                {isMine ? 'Assigned to you' : (st.assignedMember || st.assigned_to_user || 'Unassigned')}
                              </span>
                            </div>
                            {st.attachments && st.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {st.attachments.map((att, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                                  >
                                    <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="truncate max-w-[160px]">{att.name || att}</span>
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
              </div>
            )}

            {/* If no subtasks, but main task is assigned to currentUser */}
            {subtasksList.length === 0 && selectedTask.assigned_to_user === currentUser.name && (
              <div className="border-l-4 border-l-[#006666] bg-[#f0fdfa]/70 border border-teal-100 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    You are assigned to this task
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Due {selectedTask.due_date}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  selectedTask.status === 'DONE' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
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
                    {selectedTask.assigned_to_user || <span className="italic text-slate-400">Unassigned (Claimable)</span>}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Workstream</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {selectedTask.workstream}
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

          </div>

          {/* ========================================================================= */}
          {/* DRAWER FOOTER ACTIONS */}
          {/* ========================================================================= */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2.5">
            {/* If task is in REVIEW */}
            {selectedTask.status === 'REVIEW' && (
              <>
                <button
                  type="button"
                  onClick={() => sendBack(selectedTask.task_id)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Send Back
                </button>
                <button
                  type="button"
                  onClick={() => approveAndComplete(selectedTask.task_id)}
                  className="px-4 py-2 rounded-lg bg-[#008060] hover:bg-[#006e52] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Approve & Complete
                </button>
              </>
            )}

            {/* If task is IN_PROGRESS */}
            {selectedTask.status === 'IN_PROGRESS' && (
              isSigningEligible ? (
                <button
                  type="button"
                  onClick={() => setSigningModalTask(selectedTask)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Review & Sign NDA
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submitForReview(selectedTask.task_id)}
                  className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Submit for Review
                </button>
              )
            )}

            {/* If task is TO_DO */}
            {selectedTask.status === 'TO_DO' && (
              <button
                type="button"
                onClick={() => claimTask(selectedTask.task_id)}
                className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Claim Task
              </button>
            )}

            {/* If task is DONE */}
            {selectedTask.status === 'DONE' && (
              <button
                type="button"
                onClick={() => setCertificateModalTask(selectedTask)}
                className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Compliance Certificate
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
