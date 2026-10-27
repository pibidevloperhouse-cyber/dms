"use client";

import React, { useState } from 'react';
import { useDealWorkflow, normalizeRole } from './DealWorkflowContext';
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
  ArrowRight,
  Edit3,
  RotateCcw,
  X,
  Folder,
  FolderUp,
  Upload,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import EditTaskModal from './EditTaskModal';

export default function TaskDetailDrawer() {
  const {
    currentUser,
    selectedTask,
    setSelectedTask,
    claimTask,
    submitForReview,
    approveAndComplete,
    sendBack,
    attachFilesToTask,
    removeFileFromTask,
    moveToDocumentsSection,
    informTaskQuery,
    toggleSubtask,
    addComment,
    deleteTask,
    canUserClaimTask,
    canUserSubmitForReview,
    canUserApproveTask,
    isTaskCreator,
    isTaskAssignee,
    isStageLockedForUser,
    setSigningModalTask,
    setCertificateModalTask,
  } = useDealWorkflow();

  const [commentText, setCommentText] = useState('');
  const [commentScope, setCommentScope] = useState('INTERNAL');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [requestChangesComment, setRequestChangesComment] = useState('');
  const [isSubmittingChanges, setIsSubmittingChanges] = useState(false);
  const [isAttachingFiles, setIsAttachingFiles] = useState(false);
  const [isMovingToDocs, setIsMovingToDocs] = useState(false);
  const [moveSuccessMessage, setMoveSuccessMessage] = useState(null);

  if (!selectedTask) return null;

  const isCreator = isTaskCreator ? isTaskCreator(selectedTask, currentUser) : false;
  const isAssignee = isTaskAssignee ? isTaskAssignee(selectedTask, currentUser) : (selectedTask.assigned_to_user === currentUser.name);
  const isStageLocked = isStageLockedForUser ? isStageLockedForUser(selectedTask, currentUser) : false;
  const canApprove = canUserApproveTask ? canUserApproveTask(selectedTask, currentUser) : isCreator;

  const isCreatorSide = currentUser.side === selectedTask.creator_side;
  const isTargetSide = currentUser.side === selectedTask.target_side;

  const subtasksList = selectedTask.subtasks || [];
  const isAdmin = normalizeRole(currentUser?.role) === 'super_admin' || normalizeRole(currentUser?.role) === 'admin';

  // If user is creator, they see all subtasks created.
  // For assigned members (like Pranav or Lakshmi), ONLY tasks/subtasks assigned to them are shown!
  const myName = (currentUser?.name || '').trim().toLowerCase();
  const myEmail = (currentUser?.email || '').trim().toLowerCase();
  const myId = (currentUser?.id || '').trim().toLowerCase();

  const displayedSubtasks = isCreator
    ? subtasksList
    : subtasksList.filter((s) => {
      const member = (s.assignedMember || s.assigned_to_user || '').trim().toLowerCase();
      return member && (member === myName || member === myEmail || (myId !== 'session_user' && member === myId));
    });

  const totalSubtasks = displayedSubtasks.length;
  const completedSubtasks = displayedSubtasks.filter((s) => s.status === 'DONE').length;

  const statusSteps = [
    { key: 'TO_DO', label: 'To Do' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'REVIEW', label: 'Review' },
    { key: 'DONE', label: 'Done' },
  ];
  const currentStepIndex = statusSteps.findIndex((s) => s.key === selectedTask.status);

  const isPrepStage = (selectedTask.deal_stage || '').trim().toLowerCase().includes('prep');

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
  (selectedTask.attachments || []).forEach((att) => {
    allAttachments.push({
      name: att.name || att,
      size: att.size || null,
      type: 'Deliverable File',
      source: att.uploadedBy ? `Uploaded by ${att.uploadedBy}` : 'Task Deliverable',
    });
  });
  displayedSubtasks.forEach((st) => {
    (st.attachments || []).forEach((att) => {
      allAttachments.push({
        name: att.name || att,
        size: att.size || null,
        type: 'Subtask Attachment',
        source: st.title,
      });
    });
  });

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsAttachingFiles(true);
    try {
      await attachFilesToTask(selectedTask.task_id, files);
    } catch (err) {
      console.error('Error attaching files:', err);
    } finally {
      setIsAttachingFiles(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (fileName, idx) => {
    if (!removeFileFromTask) return;
    await removeFileFromTask(selectedTask.task_id, fileName, idx);
  };

  const handleViewFile = (file) => {
    if (!file) return;
    const fileName = file.name || file;

    // 1. If file already has a blobUrl in active memory
    if (file.blobUrl) {
      window.open(file.blobUrl, '_blank');
      return;
    }

    // 2. If file has a base64 dataUrl
    if (file.dataUrl && typeof window !== 'undefined') {
      try {
        const parts = file.dataUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (err) {
        console.warn('Error converting dataUrl to blob, falling back to endpoint:', err);
      }
    }

    // 3. If file has a direct view URL
    if (file.url && file.url.startsWith('http')) {
      window.open(file.url, '_blank');
      return;
    }

    // 4. Default to secure inline browser view endpoint
    const taskId = selectedTask?.task_id || '';
    const fileId = file.id || '';
    const endpoint = `/api/deal-tasks/view-attachment?taskId=${encodeURIComponent(taskId)}&fileName=${encodeURIComponent(fileName)}&fileId=${encodeURIComponent(fileId)}`;
    window.open(endpoint, '_blank');
  };

  const handleMoveToDocuments = async () => {
    if (isMovingToDocs) return;
    setIsMovingToDocs(true);
    setMoveSuccessMessage(null);
    try {
      const res = await moveToDocumentsSection(selectedTask.task_id);
      if (res && res.success) {
        setMoveSuccessMessage(
          `Files successfully moved directly to Documents section under folder "${res.targetFolderName || selectedTask.folder_name || 'Preparation Documents'}"! Task marked as Done.`
        );
      }
    } catch (e) {
      console.error('Error moving to documents:', e);
    } finally {
      setIsMovingToDocs(false);
    }
  };

  const isSigningEligible =
    selectedTask.linked_document &&
    selectedTask.status === 'IN_PROGRESS' &&
    !isCreator &&
    (selectedTask.assigned_to_user === currentUser.name || currentUser.role.includes('Admin')) &&
    isTargetSide &&
    !selectedTask.digital_signature;

  const canClaim = canUserClaimTask ? canUserClaimTask(selectedTask, currentUser) : false;
  const canSubmit = canUserSubmitForReview ? canUserSubmitForReview(selectedTask, currentUser) : false;

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

  const handleConfirmRequestChanges = async (e) => {
    e.preventDefault();
    const comment = requestChangesComment.trim();
    if (!comment || isSubmittingChanges) return;

    setIsSubmittingChanges(true);
    try {
      if (informTaskQuery) {
        await informTaskQuery(selectedTask.task_id, comment);
      } else {
        await sendBack(selectedTask.task_id, comment);
      }
      setShowRequestChangesModal(false);
      setRequestChangesComment('');
    } catch (err) {
      console.error('Error informing query:', err);
    } finally {
      setIsSubmittingChanges(false);
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
                {/* Edit Task Button - allows task creator to edit task after assignment */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    title="Edit Task"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#006666] hover:bg-teal-50 hover:border-teal-200 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {/* Delete Task Button - only for creator */}
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete Task"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

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

            {/* Move to Documents Success Notification */}
            {moveSuccessMessage && (
              <div className="mt-3 p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-[#006666] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-[#006666] text-xs sm:text-sm">Files Moved to Documents Section!</p>
                    <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">{moveSuccessMessage}</p>
                    <a
                      href="/documents"
                      className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-md bg-[#006666] hover:bg-[#005252] text-white text-[11px] font-semibold transition-all shadow-2xs"
                    >
                      <Folder className="w-3 h-3 text-white" />
                      <span>Open Documents Section</span>
                      <ArrowRight className="w-3 h-3 text-white" />
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMoveSuccessMessage(null)}
                  className="text-teal-600 hover:text-teal-900 p-1 rounded-lg hover:bg-teal-100/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
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

                {/* Assigned Folder Upload Target Banner */}
                {(selectedTask.folder_name || selectedTask.assigned_folder) && (
                  <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-start gap-2.5">
                    <Folder className="w-4 h-4 text-[#006666] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#006666]">
                        Assigned Documents Folder: <span className="text-slate-900">{selectedTask.folder_name || selectedTask.assigned_folder}</span>
                        {(selectedTask.subfolder_name || selectedTask.assigned_subfolder) && (
                          <span className="text-teal-700 font-semibold"> / {selectedTask.subfolder_name || selectedTask.assigned_subfolder}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        Assigned team members should upload requested preparation documents into this folder under Documents.
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
                    {displayedSubtasks.length > 0 ? `${displayedSubtasks.length} item${displayedSubtasks.length > 1 ? 's' : ''}` : '1 item'}
                  </span>
                </div>

                {displayedSubtasks.length > 0 ? (
                  <div className="space-y-2">
                    {displayedSubtasks.map((st) => (
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
                ) : isAssignee ? (
                  <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-teal-950">Task In Progress — Assigned to You</p>
                      <p className="text-[11px] text-teal-700 mt-0.5">
                        Complete your deliverables and checklist items below, then click &quot;Submit Review&quot; in the bottom bar to forward to creator for sign-off.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">Task In Progress</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Being worked on by <strong>{selectedTask.assigned_to_user || 'Assignee'}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Subtasks
                  </h4>
                  <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {displayedSubtasks.length > 0 ? `${completedSubtasks}/${totalSubtasks} completed` : 'In Progress'}
                  </span>
                </div>

                {displayedSubtasks.length > 0 ? (
                  <div className="space-y-2">
                    {displayedSubtasks.map((st) => {
                      const isDone = st.status === 'DONE';
                      const isMine = st.assignedMember === currentUser.name || st.assigned_to_user === currentUser.name;
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (!isCreator) toggleSubtask(selectedTask.task_id, st.id);
                          }}
                          className={`flex items-start justify-between gap-2 p-2.5 rounded-lg bg-white/80 border border-teal-100/70 transition-colors ${isCreator ? 'cursor-default' : 'hover:bg-white hover:border-teal-200 cursor-pointer'
                            }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {isCreator ? (
                              isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                              )
                            ) : (
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => { }}
                                className="w-4 h-4 mt-0.5 rounded text-[#006666] border-slate-300 accent-[#006666] cursor-pointer"
                              />
                            )}
                            <div className="min-w-0">
                              <div className={`font-medium text-xs leading-snug ${isDone ? (isCreator ? 'text-slate-600 font-semibold' : 'line-through text-slate-400') : 'text-slate-800'}`}>
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

                {/* ------------------------------------------------------------- */}
                {/* ATTACH PREPARATION FILES SECTION (INTERNAL USER DELIVERABLES) */}
                {/* ------------------------------------------------------------- */}
                <div className="mt-3.5 pt-3 border-t border-teal-100">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#006666]" />
                      <span>Attach Files for Sub Admin Review</span>
                    </h5>
                    <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {(selectedTask.attachments || []).length} attached
                    </span>
                  </div>

                  {/* Target Folder Reminder */}
                  {(selectedTask.folder_name || selectedTask.assigned_folder) && (
                    <div className="mb-2.5 text-[11px] text-teal-900 bg-white/90 p-2 rounded-lg border border-teal-200/80 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-[#006666] shrink-0" />
                      <span>
                        Target Documents Folder: <strong className="text-slate-900">{selectedTask.folder_name || selectedTask.assigned_folder}</strong>
                        {(selectedTask.subfolder_name || selectedTask.assigned_subfolder) && (
                          <span className="text-[#006666] font-semibold"> / {selectedTask.subfolder_name || selectedTask.assigned_subfolder}</span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Upload Area for Assignee */}
                  {!isCreator && (
                    <div className="mb-2.5">
                      <input
                        type="file"
                        multiple
                        id="drawer-file-uploader"
                        className="hidden"
                        onChange={handleFilesSelected}
                      />
                      <label
                        htmlFor="drawer-file-uploader"
                        className="border-2 border-dashed border-teal-300 hover:border-[#006666] bg-white hover:bg-teal-50/50 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center group"
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-[#006666] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-[#006666]">
                          {isAttachingFiles ? 'Attaching file(s)...' : 'Click to Upload Deliverable Files'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Attach the files you need to submit for Sub Admin review (PDF, Excel, Word, etc.)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* List of Attached Files */}
                  {Array.isArray(selectedTask.attachments) && selectedTask.attachments.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedTask.attachments.map((file, fIdx) => (
                        <div
                          key={file.id || fIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-teal-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded bg-teal-50 text-[#006666] flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate max-w-[220px]">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {file.size} {file.uploadedBy ? `· by ${file.uploadedBy}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleViewFile(file)}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#006666] bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="View file in browser"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            {!isCreator && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(file.name, fIdx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic bg-white/70 p-2 rounded border border-dashed border-slate-200 text-center">
                      No files attached yet. Attach your files above before submitting for review.
                    </p>
                  )}
                </div>
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

                {/* Creator / Sub Admin Review vs Assignee Banner */}
                {selectedTask.status === 'REVIEW' && (
                  (isCreator || canApprove) ? (
                    <div className="mb-3 p-3 rounded-lg bg-teal-50/90 border border-teal-200 text-xs text-teal-950 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#006666] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[#006666]">
                          {isPrepStage ? 'Preparation Review — Sub Admin Sign-Off Required' : 'Review Stage — Sign-Off Required'}
                        </p>
                        <p className="text-[11px] text-teal-800 mt-0.5">
                          {isPrepStage
                            ? <>Submitted for review by <strong>{selectedTask.assigned_to_user || 'Assignee'}</strong>. Inspect the uploaded files below. If approved, click <strong>&quot;Move to Documents Section&quot;</strong> in the bottom bar to directly upload these files to Documents. If changes are needed, click <strong>&quot;Inform Query&quot;</strong>.</>
                            : <>Submitted for review by <strong>{selectedTask.assigned_to_user || 'Assignee'}</strong>. Inspect the deliverables below and click <strong>&quot;Mark as Done&quot;</strong> to complete, or <strong>&quot;Inform Query&quot;</strong> to send back for revisions.</>}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">Submitted for Review</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          This task is currently under review by <strong>{selectedTask.created_by || 'Sub Admin'}</strong>. Waiting for final review and sign-off.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {(() => {
                  const singleItem = displayedSubtasks.length > 0 ? displayedSubtasks[0] : (subtasksList.length > 0 ? subtasksList[0] : null);
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

                {(selectedTask.folder_name || selectedTask.assigned_folder) && (
                  <div className="grid grid-cols-3 py-2 bg-teal-50/50 px-2 rounded-lg my-1">
                    <span className="text-teal-800 font-semibold flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-[#006666]" />
                      <span>Assigned folder</span>
                    </span>
                    <span className="col-span-2 text-slate-900 font-bold flex items-center gap-1.5 truncate">
                      <span>{selectedTask.folder_name || selectedTask.assigned_folder}</span>
                      {(selectedTask.subfolder_name || selectedTask.assigned_subfolder) && (
                        <span className="text-[#006666] font-semibold">
                          / {selectedTask.subfolder_name || selectedTask.assigned_subfolder}
                        </span>
                      )}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 py-2">
                  <span className="text-slate-500 font-medium">Assignee</span>
                  <span className="col-span-2 text-slate-800 font-semibold">
                    {!isCreator && displayedSubtasks.length > 0
                      ? currentUser.name
                      : (selectedTask.assigned_to_user || <span className="text-slate-400">Unassigned (Claimable)</span>)}
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
                        <button
                          type="button"
                          onClick={() => handleViewFile(doc)}
                          className="text-[11px] text-[#006666] hover:text-[#004d4d] bg-teal-50 hover:bg-teal-100 font-semibold px-2.5 py-1 rounded-md border border-teal-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
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
            {/* If task is TO_DO */}
            {selectedTask.status === 'TO_DO' && (
              isStageLocked ? (
                <span className="text-xs text-slate-500 font-medium px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Stage Locked · Complete previous stage first</span>
                </span>
              ) : canClaim ? (
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
              ) : selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                (() => {
                  const totalSub = selectedTask.subtasks.length;
                  const doneSub = selectedTask.subtasks.filter((s) => s.status === 'DONE').length;
                  const mySubDone = displayedSubtasks.length > 0 && displayedSubtasks.every((s) => s.status === 'DONE');
                  return (
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${
                      mySubDone
                        ? 'text-teal-800 bg-teal-50 border-teal-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {mySubDone
                          ? `Your deliverable completed ✓ (${doneSub}/${totalSub} Done · Waiting for remaining assignees)`
                          : `In Progress (${doneSub}/${totalSub} Subtasks Completed)`}
                      </span>
                    </span>
                  );
                })()
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
                  {/* Button 2: Inform Query (Always available for reviewer to raise query) */}
                  <button
                    type="button"
                    onClick={() => {
                      setRequestChangesComment('');
                      setShowRequestChangesModal(true);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Inform query to internal user to revise files"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Inform Query</span>
                  </button>

                  {/* Button 1: Move to Documents Section (In Preparation stage) or Mark as Done (in other stages) */}
                  {isPrepStage ? (
                    <button
                      type="button"
                      onClick={handleMoveToDocuments}
                      disabled={isMovingToDocs}
                      className="px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005252] text-white font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Directly upload reviewed files to the Documents section"
                    >
                      {isMovingToDocs ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin text-white" />
                          <span>Moving to Documents...</span>
                        </>
                      ) : (
                        <>
                          <FolderUp className="w-4 h-4" />
                          <span>Move to Documents Section</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => approveAndComplete(selectedTask.task_id)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Done</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending Sub Admin Review & Sign-off</span>
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

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <EditTaskModal
          task={selectedTask}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Inform Query Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Inform Query</h3>
                  <p className="text-[11px] text-slate-500">
                    Query will be informed to {selectedTask.assigned_to_user || 'Assignee'} and task returned to In Progress
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingChanges) {
                    setShowRequestChangesModal(false);
                    setRequestChangesComment('');
                  }
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleConfirmRequestChanges} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Query Details / Reason Results Not OK <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={requestChangesComment}
                  onChange={(e) => setRequestChangesComment(e.target.value)}
                  placeholder="Specify what query or revisions are needed for the assignee to update (e.g. Schedule C is missing, please re-upload signed document)..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none transition-all placeholder:text-slate-400"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  <span>The assignee will see this query in task communications and can upload updated files.</span>
                </p>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingChanges}
                  onClick={() => {
                    setShowRequestChangesModal(false);
                    setRequestChangesComment('');
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!requestChangesComment.trim() || isSubmittingChanges}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSubmittingChanges ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Informing Query...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Inform Query & Move to In Progress</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
