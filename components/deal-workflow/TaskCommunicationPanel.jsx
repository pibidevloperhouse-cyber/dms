"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Paperclip,
  X,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Shield,
  CheckSquare,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { useDealWorkflow, normalizeRole } from './DealWorkflowContext';

export default function TaskCommunicationPanel({
  activeTask,
  onClose,
  isExpanded,
  onToggleExpand,
  onOpenTaskDetails
}) {
  const { currentUser, allUsers } = useDealWorkflow();

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [taskData, setTaskData] = useState(activeTask || null);
  const [hasSpecificAssignments, setHasSpecificAssignments] = useState(false);
  const [availableThreads, setAvailableThreads] = useState([]);
  const [activeTargetMember, setActiveTargetMember] = useState(null);
  const [selectedTargetMember, setSelectedTargetMember] = useState(null);
  const [isAdminOrCreator, setIsAdminOrCreator] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMembersList, setShowMembersList] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const taskId = activeTask?.id || activeTask?.task_id || activeTask?.taskId;

  // Fetch messages and participants for this task and active thread
  const fetchTaskCommunication = useCallback(async (isInitial = false, targetOverride = null) => {
    if (!taskId) return;
    if (isInitial) setLoading(true);

    try {
      const params = new URLSearchParams();
      if (currentUser?.id) params.set('userId', currentUser.id);
      if (currentUser?.email) params.set('userEmail', currentUser.email);
      if (currentUser?.name) params.set('userName', currentUser.name);
      if (currentUser?.role) params.set('userRole', currentUser.role);

      const targetToUse = targetOverride || selectedTargetMember || '';
      if (targetToUse) {
        params.set('targetMember', targetToUse);
      }

      const res = await fetch(`/api/deal-tasks/${encodeURIComponent(taskId)}/communication?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
        setParticipants(data.participants || []);
        setHasSpecificAssignments(Boolean(data.hasSpecificAssignments));
        setAvailableThreads(data.availableThreads || []);
        setActiveTargetMember(data.activeTargetMember || null);
        setIsAdminOrCreator(Boolean(data.isAdminOrCreator));

        // If no explicit selectedTargetMember yet, sync with backend's resolved target
        if (!selectedTargetMember && data.activeTargetMember) {
          setSelectedTargetMember(data.activeTargetMember);
        }

        if (data.task) {
          setTaskData((prev) => ({ ...(prev || {}), ...data.task }));
        }
      }
    } catch (err) {
      console.error('Error fetching task communication:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [taskId, currentUser, selectedTargetMember]);

  // When task changes, reset selected target and reload
  useEffect(() => {
    setSelectedTargetMember(null);
    if (taskId) {
      fetchTaskCommunication(true);
    } else {
      setMessages([]);
      setParticipants([]);
      setTaskData(null);
      setAvailableThreads([]);
      setActiveTargetMember(null);
    }
  }, [taskId]);

  // Handle switching member thread (for Admin/Subadmin)
  const handleSwitchThread = (memberName) => {
    setSelectedTargetMember(memberName);
    fetchTaskCommunication(true, memberName);
  };

  // Auto-poll messages every 2.5 seconds
  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(() => {
      fetchTaskCommunication(false);
    }, 2500);
    return () => clearInterval(interval);
  }, [taskId, fetchTaskCommunication]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    const trimmed = inputMessage.trim();
    if (!trimmed || sending || !taskId) return;

    setSending(true);

    const targetToSend = selectedTargetMember || activeTargetMember;

    // Optimistic message
    const tempId = `optimistic_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'You',
      senderEmail: currentUser?.email || '',
      senderRole: currentUser?.role || 'Admin',
      text: trimmed,
      messageType: 'task',
      targetMember: targetToSend,
      attachments: [...attachments],
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage('');
    setAttachments([]);

    try {
      const res = await fetch(`/api/deal-tasks/${encodeURIComponent(taskId)}/communication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userName: currentUser?.name,
          userEmail: currentUser?.email,
          userRole: currentUser?.role,
          messageText: trimmed,
          targetMember: targetToSend,
          attachments,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, isMine: true } : m))
        );
      } else {
        fetchTaskCommunication(false);
      }
    } catch (err) {
      console.error('Error sending task message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputMessage(trimmed);
    } finally {
      setSending(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments = files.map((file) => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || 'file',
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const quickPills = hasSpecificAssignments
    ? [
        '🚀 Subtask deliverable ready for review',
        '⏳ Currently in progress on this subtask',
        '✅ Subtask completed and verified',
        '❓ Question regarding this specific assignment',
      ]
    : [
        '🚀 Ready for team review',
        '⏳ Working on task items',
        '✅ Completed and verified',
        '❓ Need clarification from Admin',
      ];

  if (!activeTask) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#006666] mb-4 shadow-xs">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Task Communication
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          Select any task on the board to open its direct, task-based communication overlay.
        </p>
      </div>
    );
  }

  const currentTask = taskData || activeTask;
  const currentAssigneeName = selectedTargetMember || activeTargetMember;

  return (
    <div className="h-full flex flex-col bg-white shadow-2xl relative overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: ACTIVE TASK METADATA & CONTROLS */}
      {/* ========================================================================= */}
      <div className="p-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-teal-50/40">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 text-[#006666] border border-teal-200">
                <MessageSquare className="w-3 h-3 text-teal-600" />
                {currentTask.taskId || currentTask.task_id}
              </span>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                {currentTask.status?.replace('_', ' ')}
              </span>

              {hasSpecificAssignments ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs">
                  <Lock className="w-3 h-3 text-indigo-600" />
                  <span>Direct Subtask Channel</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>Group:</span>
                  <strong className="text-slate-800">{currentTask.assignedToGroup || 'Dev Team'}</strong>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight" title={currentTask.title}>
              {currentTask.title}
            </h2>
          </div>

          {/* Action buttons: Open Details & Close Overlay */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenTaskDetails && (
              <button
                type="button"
                onClick={() => onOpenTaskDetails(currentTask)}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#006666] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-teal-200"
                title="View Full Task Details & Documents"
              >
                <span>Task Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close Overlay"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SPECIFIC ASSIGNEE SUBTASK CHANNEL INDICATOR & SELECTOR */}
        {/* ========================================================================= */}
        {hasSpecificAssignments && availableThreads.length > 1 && isAdminOrCreator && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Select Subtask Assignee Channel:</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {availableThreads.map((thread) => {
                const isSelected = (selectedTargetMember || activeTargetMember) === thread.memberName;
                return (
                  <button
                    key={thread.memberName}
                    type="button"
                    onClick={() => handleSwitchThread(thread.memberName)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#006666] text-white shadow-xs ring-1 ring-[#006666]'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{thread.memberName}</span>
                    <span className={`text-[10px] px-1 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {thread.subtaskTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1-on-1 Privacy Banner */}
        {hasSpecificAssignments && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-teal-50/70 border border-teal-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-teal-900 min-w-0">
              <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="truncate">
                Direct Channel: <strong>{currentTask.createdBy || 'Admin'}</strong> ↔ <strong>{currentAssigneeName || 'Assigned Member'}</strong>
              </span>
            </div>
            <span className="text-[10px] text-teal-700 font-semibold bg-white border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
              Private 1-on-1
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MESSAGE TIMELINE */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#F8FAFC]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-[#006666] rounded-full animate-spin mb-2.5" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#006666] mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800">No messages yet in this direct channel</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              {hasSpecificAssignments ? (
                <>Start 1-on-1 task communication between <strong>{currentTask.createdBy || 'Admin'}</strong> and <strong>{currentAssigneeName || 'Assigned Member'}</strong>.</>
              ) : (
                <>Start task-based communication with <strong>{currentTask.assignedToGroup}</strong>.</>
              )}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.isMine;

            return (
              <div
                key={msg.id || index}
                className={`flex gap-2.5 items-end ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {!isMine && (
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
                    title={msg.senderName}
                  >
                    {(msg.senderName || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                        {msg.senderName}
                      </span>
                      {msg.senderRole && (
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded uppercase tracking-wider">
                          {msg.senderRole}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                      isMine
                        ? 'bg-[#006666] text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                        {msg.attachments.map((att, attIdx) => (
                          <div
                            key={attIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                              isMine ? 'bg-black/15 text-teal-50' : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate flex-1 font-medium">{att.name || att}</span>
                            {att.size && <span className="text-[10px] opacity-75">{att.size}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ========================================================================= */}
      {/* 4. QUICK RESPONSE PILLS */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputMessage(pill)}
            className="text-[11px] font-medium text-slate-600 bg-white hover:bg-teal-50 hover:text-[#006666] border border-slate-200/90 hover:border-teal-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 5. RICH MESSAGE COMPOSER */}
      {/* ========================================================================= */}
      <div className="p-4 bg-white border-t border-slate-200">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-[#006666] px-2.5 py-1 rounded-lg text-xs"
              >
                <Paperclip className="w-3 h-3" />
                <span className="max-w-[140px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="hover:text-rose-600 cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="relative border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-[#006666] focus-within:border-transparent bg-slate-50/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasSpecificAssignments
                  ? `Message ${currentAssigneeName || 'Assignee'} directly... (Enter to send, Shift+Enter for new line)`
                  : `Message ${currentTask.assignedToGroup || 'Dev Team'}... (Enter to send, Shift+Enter for new line)`
              }
              className="w-full p-3 text-xs sm:text-sm bg-transparent outline-none resize-none text-slate-800 placeholder-slate-400"
            />

            <div className="flex items-center justify-between p-2 border-t border-slate-100 bg-white/70 rounded-b-xl">
              <label className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors relative" title="Attach Document">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#006666] hover:bg-[#005555] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                {sending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
