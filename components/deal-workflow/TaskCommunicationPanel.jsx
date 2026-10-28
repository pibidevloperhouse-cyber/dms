"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Paperclip,
  X,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Shield,
  RefreshCw,
  ExternalLink,
  Lock,
  UserCheck,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  Bold,
  Italic,
  List,
  AtSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useDealWorkflow } from './DealWorkflowContext';

function renderFormattedContent(text, isMine) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let lineType = 'normal';
    let content = line;
    let listMarker = null;

    if (/^[\u2022\u2219\*\-]\s+/.test(line)) {
      lineType = 'bullet';
      content = line.replace(/^[\u2022\u2219\*\-]\s+/, '');
    } else if (/^(\d+)\.\s+/.test(line)) {
      lineType = 'numbered';
      const m = line.match(/^(\d+)\.\s+/);
      listMarker = m ? m[1] : '1';
      content = line.replace(/^(\d+)\.\s+/, '');
    } else if (/^>\s*/.test(line)) {
      lineType = 'quote';
      content = line.replace(/^>\s*/, '');
    }

    if (content === '' && lineType === 'normal') {
      return <div key={lineIdx} className="h-3" />;
    }

    const regex = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`|@[A-Za-z0-9_]+(?:\s[A-Za-z0-9_]+)?)/g;
    const tokens = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        tokens.push({ type: 'bold', content: token.slice(2, -2) });
      } else if (token.startsWith('*') && token.endsWith('*')) {
        tokens.push({ type: 'italic', content: token.slice(1, -1) });
      } else if (token.startsWith('`') && token.endsWith('`')) {
        tokens.push({ type: 'code', content: token.slice(1, -1) });
      } else if (token.startsWith('@')) {
        tokens.push({ type: 'mention', content: token });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      tokens.push({ type: 'text', content: content.substring(lastIndex) });
    }

    const renderedTokens = tokens.map((t, idx) => {
      if (t.type === 'bold') {
        return <strong key={idx} className="font-bold">{t.content}</strong>;
      }
      if (t.type === 'italic') {
        return <em key={idx} className="italic">{t.content}</em>;
      }
      if (t.type === 'code') {
        return (
          <code
            key={idx}
            className={cn(
              "px-1.5 py-0.5 rounded text-xs font-mono font-medium mx-0.5",
              isMine ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
            )}
          >
            {t.content}
          </code>
        );
      }
      if (t.type === 'mention') {
        return (
          <span
            key={idx}
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold text-xs mx-0.5 select-none",
              isMine
                ? "bg-white/25 text-white underline decoration-white/30"
                : "bg-teal-100 text-[#006666] hover:bg-teal-200"
            )}
          >
            {t.content}
          </span>
        );
      }
      return <span key={idx}>{t.content}</span>;
    });

    if (lineType === 'bullet') {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5">
          <span className={cn("shrink-0 select-none font-bold", isMine ? "text-teal-100" : "text-[#006666]")}>•</span>
          <div className="flex-1">{renderedTokens}</div>
        </div>
      );
    }

    if (lineType === 'numbered') {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5">
          <span className={cn("shrink-0 select-none font-mono text-xs font-bold mt-0.5", isMine ? "text-teal-100" : "text-[#006666]")}>
            {listMarker}.
          </span>
          <div className="flex-1">{renderedTokens}</div>
        </div>
      );
    }

    if (lineType === 'quote') {
      return (
        <div
          key={lineIdx}
          className={cn(
            "border-l-2 pl-2.5 my-1.5 italic",
            isMine ? "border-white/50 text-white/90" : "border-slate-300 text-slate-600 bg-slate-50/50 py-0.5 rounded-r"
          )}
        >
          {renderedTokens}
        </div>
      );
    }

    return (
      <div key={lineIdx} className={lineIdx > 0 ? "min-h-[1.25rem]" : ""}>
        {renderedTokens}
      </div>
    );
  });
}

function TaskMessageItem({
  message,
  isAdminOrCreator,
  onEdit,
  onOpenDeleteModal,
}) {
  const isMine = message.isMine;
  const text = message.messageText || message.text || '';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleSave = () => {
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(text);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`flex gap-2.5 items-end group ${isMine ? 'justify-end' : 'justify-start'}`}>
      {!isMine && (
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
          title={message.senderName}
        >
          {(message.senderName || 'U')[0].toUpperCase()}
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
              {message.senderName}
            </span>
            {message.senderRole && (
              <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded uppercase tracking-wider">
                {message.senderRole}
              </span>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="w-full min-w-[280px] sm:min-w-[340px] bg-white border border-teal-300 shadow-xl rounded-2xl p-3 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-[#006666] font-bold text-xs">
                <Pencil size={13} />
                <span>Edit message</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Esc to cancel • Enter to save
              </span>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#006666]/20 focus:border-[#006666] resize-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!editText.trim()}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#006666] hover:bg-[#005555] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Check size={12} />
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group/bubble flex items-center">
            {/* Action Menu Trigger (hover) */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10 ${
                isMine ? '-left-8' : '-right-8'
              }`}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer transition-all"
                    title="Message options"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isMine ? "end" : "start"} className="w-44 p-1 rounded-xl shadow-xl border border-slate-100 font-sans z-[9999]">
                  {isMine && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditText(text);
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                    >
                      <Pencil size={13} className="text-slate-400" />
                      <span>Edit message</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onOpenDeleteModal(message.id, 'me')}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer font-medium"
                  >
                    <Trash2 size={13} className="text-slate-400" />
                    <span>Delete for me</span>
                  </DropdownMenuItem>
                  {(isMine || isAdminOrCreator) && (
                    <>
                      <DropdownMenuSeparator className="my-1 bg-slate-100" />
                      <DropdownMenuItem
                        onClick={() => onOpenDeleteModal(message.id, 'everyone')}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer font-semibold"
                      >
                        <Trash2 size={13} className="text-rose-500" />
                        <span>Delete for everyone</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Message Bubble Body */}
            <div
              className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                isMine
                  ? 'bg-[#006666] text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
              }`}
            >
              <div className="break-words">
                {renderFormattedContent(text, isMine)}
              </div>

              {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                  {message.attachments.map((att, attIdx) => (
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
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10px] text-slate-400 font-medium">
            {message.timestamp}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-slate-400 italic font-normal select-none">
              (edited)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskCommunicationPanel({
  activeTask,
  onClose,
  isExpanded,
  onToggleExpand,
  onOpenTaskDetails,
}) {
  const { currentUser } = useDealWorkflow();

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
  const [deleteModalState, setDeleteModalState] = useState(null); // { messageId, mode: 'me' | 'everyone' }

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
    let isMounted = true;
    const run = async () => {
      if (taskId) {
        await fetchTaskCommunication(true);
      } else if (isMounted) {
        setMessages([]);
        setParticipants([]);
        setTaskData(null);
        setAvailableThreads([]);
        setActiveTargetMember(null);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [taskId, fetchTaskCommunication]);

  // Handle switching member thread (for Admin/Subadmin)
  const handleSwitchThread = (memberName) => {
    setSelectedTargetMember(memberName);
    fetchTaskCommunication(true, memberName);
  };

  // Auto-poll messages every 3.5 seconds
  useEffect(() => {
    if (!taskId) return;
    const interval = setInterval(() => {
      fetchTaskCommunication(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [taskId, fetchTaskCommunication]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    const trimmed = inputMessage.trim();
    if (!trimmed || sending || !taskId) return;

    setSending(true);
    const targetToSend = selectedTargetMember || activeTargetMember;

    const tempId = `optimistic_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: currentUser?.id,
      senderName: currentUser?.name || 'You',
      senderEmail: currentUser?.email || '',
      senderRole: currentUser?.role || 'Admin',
      text: trimmed,
      messageText: trimmed,
      messageType: 'task',
      targetMember: targetToSend,
      attachments: [...attachments],
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      isEdited: false,
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

  // Edit message
  const handleEditMessage = async (messageId, newText) => {
    if (!newText?.trim() || !taskId) return;
    const trimmed = newText.trim();

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, text: trimmed, messageText: trimmed, isEdited: true }
          : m
      )
    );

    try {
      const res = await fetch(`/api/deal-tasks/${encodeURIComponent(taskId)}/communication`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          messageText: trimmed,
          userId: currentUser?.id,
          userName: currentUser?.name,
          userEmail: currentUser?.email,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.warn('Failed to edit task message:', data.error);
        fetchTaskCommunication(false);
      }
    } catch (err) {
      console.error('Error editing task message:', err);
      fetchTaskCommunication(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId, mode = 'me') => {
    if (!messageId || !taskId) return;

    // Optimistic removal
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      const params = new URLSearchParams({
        messageId,
        type: mode,
      });
      if (currentUser?.id) params.set('userId', currentUser.id);
      if (currentUser?.email) params.set('userEmail', currentUser.email);
      if (currentUser?.name) params.set('userName', currentUser.name);

      const res = await fetch(
        `/api/deal-tasks/${encodeURIComponent(taskId)}/communication?${params.toString()}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!data.success) {
        console.warn('Failed to delete task message:', data.error);
        fetchTaskCommunication(false);
      }
    } catch (err) {
      console.error('Error deleting task message:', err);
      fetchTaskCommunication(false);
    }
  };

  // Toolbar formatting helpers
  const wrapSelection = (before, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const val = inputMessage;

    if (start !== end) {
      const selected = val.substring(start, end);
      const replacement = `${before}${selected}${after}`;
      setInputMessage(val.substring(0, start) + replacement + val.substring(end));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + before.length, end + before.length);
      }, 0);
    } else {
      setInputMessage(val.substring(0, start) + before + after + val.substring(end));
      setTimeout(() => {
        el.focus();
        const nextPos = start + before.length;
        el.setSelectionRange(nextPos, nextPos);
      }, 0);
    }
  };

  const handleBold = () => wrapSelection('**', '**');
  const handleItalic = () => wrapSelection('*', '*');
  const handleBullet = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const val = inputMessage;
    const prevNewline = val.lastIndexOf('\n', start - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
    setInputMessage(val.substring(0, lineStart) + '• ' + val.substring(lineStart));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2);
    }, 0);
  };
  const handleMention = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const val = inputMessage;
    setInputMessage(val.substring(0, start) + '@' + val.substring(start));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      handleBold();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      handleItalic();
      return;
    }
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
        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">No active task selected</p>
        <p className="text-xs text-slate-400 mt-1">Select a task from the board to initiate communication</p>
      </div>
    );
  }

  const currentTask = taskData || activeTask;
  const currentAssigneeName = selectedTargetMember || activeTargetMember;

  return (
    <>
      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModalState && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  deleteModalState.mode === 'everyone'
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {deleteModalState.mode === 'everyone' ? 'Delete for everyone?' : 'Delete for me?'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {deleteModalState.mode === 'everyone'
                    ? 'This message will be permanently deleted for all team members.'
                    : 'This message will be removed from your chat view only.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalState(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const { messageId, mode } = deleteModalState;
                  setDeleteModalState(null);
                  handleDeleteMessage(messageId, mode);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer",
                  deleteModalState.mode === 'everyone'
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-slate-800 hover:bg-slate-900"
                )}
              >
                {deleteModalState.mode === 'everyone' ? 'Delete for everyone' : 'Delete for me'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex flex-col bg-white shadow-2xl relative overflow-hidden font-sans">
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
            messages.map((msg, index) => (
              <TaskMessageItem
                key={msg.id || index}
                message={msg}
                isAdminOrCreator={isAdminOrCreator}
                onEdit={handleEditMessage}
                onOpenDeleteModal={(messageId, mode) => setDeleteModalState({ messageId, mode })}
              />
            ))
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
        <div className="p-3.5 bg-white border-t border-slate-200">
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

          <form onSubmit={handleSendMessage} className="flex flex-col gap-1.5">
            <div className="border border-slate-300 rounded-2xl focus-within:ring-2 focus-within:ring-[#006666]/20 focus-within:border-[#006666] bg-slate-50/50 transition-all overflow-hidden">
              {/* Formatting Toolbar */}
              <div className="px-3 py-1.5 bg-white border-b border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleBold}
                    title="Bold (Ctrl+B)"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Bold size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleItalic}
                    title="Italic (Ctrl+I)"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Italic size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleBullet}
                    title="Bullet list"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <List size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleMention}
                    title="Mention member (@)"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <AtSign size={13} />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium select-none hidden sm:inline">
                  Shift+Enter for new line • Ctrl+B for bold
                </span>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasSpecificAssignments
                    ? `Message ${currentAssigneeName || 'Assignee'} directly...`
                    : `Message ${currentTask.assignedToGroup || 'Dev Team'}...`
                }
                className="w-full p-3 text-xs sm:text-sm bg-transparent outline-none resize-none text-slate-800 placeholder-slate-400"
              />

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-2 border-t border-slate-100 bg-white/70">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006666] hover:bg-[#005555] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
    </>
  );
}
