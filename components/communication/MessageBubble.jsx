"use client";

import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  CheckCheck,
  Smile,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

function renderFormattedContent(text, isMe) {
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

    // Tokenize line content for bold, italic, code, mentions
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
              isMe ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
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
              "inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold text-xs mx-0.5 select-none transition-colors",
              isMe
                ? "bg-white/25 text-white underline decoration-white/30"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
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
          <span className={cn("shrink-0 select-none font-bold", isMe ? "text-white/80" : "text-blue-500")}>•</span>
          <div className="flex-1">{renderedTokens}</div>
        </div>
      );
    }

    if (lineType === 'numbered') {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5">
          <span className={cn("shrink-0 select-none font-mono text-xs font-bold mt-0.5", isMe ? "text-white/80" : "text-blue-600")}>
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
            isMe ? "border-white/50 text-white/90" : "border-slate-300 text-slate-600 bg-slate-50/50 py-0.5 rounded-r"
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

export default function MessageBubble({ message, onEdit, onDelete }) {
  const isMe = message.isMine;
  const displayName = message.senderName || message.senderEmail || 'User';
  const role = message.senderRole || message.role || '';
  const text = message.messageText || message.text || '';

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // 'me' | 'everyone' | null
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(text);
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  showDeleteModal === 'everyone'
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {showDeleteModal === 'everyone' ? 'Delete for everyone?' : 'Delete for me?'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {showDeleteModal === 'everyone'
                    ? 'This message will be permanently deleted for all group members.'
                    : 'This message will be removed from your chat view only.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const mode = showDeleteModal;
                  setShowDeleteModal(null);
                  if (onDelete) onDelete(message.id, mode);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors shadow-xs",
                  showDeleteModal === 'everyone'
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-slate-800 hover:bg-slate-900"
                )}
              >
                {showDeleteModal === 'everyone' ? 'Delete for everyone' : 'Delete for me'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={cn("flex gap-3 mb-4 group", isMe ? "flex-row-reverse" : "flex-row")}>
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback
            className={
              isMe ? "bg-blue-600 text-white font-bold" : "bg-slate-200 text-slate-700 font-bold"
            }
          >
            {displayName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
          <div className={cn("flex items-center gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
            <span className="text-xs font-bold text-slate-800">{displayName}</span>
            {!isMe && role && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 font-medium"
              >
                {role}
              </Badge>
            )}
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              {message.timestamp}
              {message.isEdited && (
                <span className="text-[10px] text-slate-400 italic font-normal select-none">
                  (edited)
                </span>
              )}
            </span>
          </div>

          {isEditing ? (
            <div className="w-full min-w-[300px] max-w-[480px] bg-white border border-blue-200 shadow-lg shadow-slate-200/60 rounded-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 outline-none resize-none transition-all font-normal leading-relaxed min-h-[72px]"
                rows={Math.max(2, (editText || '').split('\n').length)}
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || editText.trim() === text}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "relative px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed shadow-xs transition-all",
                isMe
                  ? "bg-blue-600 text-white rounded-tr-xs font-normal"
                  : "bg-slate-100 text-slate-800 rounded-tl-xs font-normal"
              )}
            >
              {renderFormattedContent(text, isMe)}

              {/* Attachments Preview */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {message.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border",
                        isMe ? "bg-blue-700/50 border-blue-500" : "bg-white border-slate-200"
                      )}
                    >
                      <Paperclip size={14} />
                      <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions & Threads */}
          <div className={cn("flex items-center gap-2 mt-1", isMe ? "flex-row-reverse" : "flex-row")}>
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1">
                {message.reactions.map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600"
                  >
                    {r.emoji} {r.count}
                  </span>
                ))}
              </div>
            )}

            {message.threadCount > 0 && (
              <button className="text-xs font-medium text-blue-600 flex items-center gap-1 hover:underline">
                <MessageSquare size={12} />
                {message.threadCount} replies
              </button>
            )}

            {isMe && (
              <div className="text-slate-400">
                {message.seen ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
              </div>
            )}
          </div>
        </div>

        {/* Hover Actions Menu */}
        <div
          className={cn(
            "flex items-center gap-0.5 transition-opacity self-start mt-4 bg-white border border-slate-200 rounded-lg shadow-sm p-0.5 z-10",
            isMe ? "mr-1" : "ml-1",
            isMenuOpen || isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {/* Quick Edit button for sender */}
          {isMe && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditText(text);
                setIsEditing(true);
              }}
              title="Edit message"
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Pencil size={14} />
            </button>
          )}

          {/* More actions dropdown (Delete for me, Delete for everyone) */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More message actions"
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={isMe ? "end" : "start"}
              className="w-48 bg-white border border-slate-200 rounded-xl p-1 shadow-lg z-50"
            >
              {isMe && !isEditing && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditText(text);
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <Pencil size={14} className="text-blue-600" />
                  <span>Edit message</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowDeleteModal('me');
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Trash2 size={14} className="text-slate-500" />
                <span>Delete for me</span>
              </DropdownMenuItem>

              {isMe && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsMenuOpen(false);
                    setShowDeleteModal('everyone');
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-lg hover:bg-rose-50 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                >
                  <Trash2 size={14} className="text-rose-600" />
                  <span>Delete for everyone</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
