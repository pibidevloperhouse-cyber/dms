"use client";

import React, { useState, useMemo } from 'react';
import {
  Paperclip,
  Smile,
  Send,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  AtSign,
  Users,
  Search,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RichComposer({ onSend, disabled = false, members = [] }) {
  const [message, setMessage] = useState('');
  const [mentionPopoverOpen, setMentionPopoverOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  // Inline mention autocomplete state
  const [showInlineMentions, setShowInlineMentions] = useState(false);
  const [inlineMentionQuery, setInlineMentionQuery] = useState('');
  const [inlineMentionIndex, setInlineMentionIndex] = useState(-1);
  const [inlineSelectedIndex, setInlineSelectedIndex] = useState(0);

  // Helper to get textarea element reliably without triggering React Compiler ref restrictions
  const getTextarea = () => {
    if (typeof document === 'undefined') return null;
    return document.getElementById('communication-composer-textarea');
  };

  // Focus textarea when popover closes
  const handleSend = () => {
    if (message.trim() && onSend && !disabled) {
      onSend(message);
      setMessage('');
      setShowInlineMentions(false);
      const el = getTextarea();
      if (el) {
        el.style.height = 'auto';
      }
    }
  };

  // Wrap selected text or insert formatting tags
  const wrapSelection = (before, after = before) => {
    const el = getTextarea();
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const currentVal = message;

    if (start !== end) {
      const selected = currentVal.substring(start, end);
      const replacement = `${before}${selected}${after}`;
      const newMsg = currentVal.substring(0, start) + replacement + currentVal.substring(end);
      setMessage(newMsg);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + before.length, end + before.length);
      });
    } else {
      const newMsg = currentVal.substring(0, start) + before + after + currentVal.substring(end);
      setMessage(newMsg);
      requestAnimationFrame(() => {
        el.focus();
        const cursorPosition = start + before.length;
        el.setSelectionRange(cursorPosition, cursorPosition);
      });
    }
  };

  const handleBold = () => wrapSelection('**', '**');
  const handleItalic = () => wrapSelection('*', '*');

  // Insert or toggle line prefixes (lists, quotes)
  const insertLinePrefix = (prefix) => {
    const el = getTextarea();
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const currentVal = message;

    const prevNewline = currentVal.lastIndexOf('\n', start - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
    const nextNewline = currentVal.indexOf('\n', end);
    const lineEnd = nextNewline === -1 ? currentVal.length : nextNewline;

    const selectedBlock = currentVal.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');
    const allHavePrefix = lines.every((l) => l.startsWith(prefix));

    const updatedLines = lines.map((l) => {
      if (allHavePrefix) {
        return l.startsWith(prefix) ? l.substring(prefix.length) : l;
      }
      return `${prefix}${l}`;
    });

    const newBlock = updatedLines.join('\n');
    const newMsg = currentVal.substring(0, lineStart) + newBlock + currentVal.substring(lineEnd);
    setMessage(newMsg);

    requestAnimationFrame(() => {
      el.focus();
      const offset = allHavePrefix ? -prefix.length : prefix.length;
      const newCursor = Math.max(lineStart, Math.min(newMsg.length, start + offset));
      el.setSelectionRange(newCursor, newCursor);
    });
  };

  // Mention options (Everyone + Group Members)
  const allMentionOptions = useMemo(() => {
    const list = [
      {
        id: 'everyone',
        name: 'everyone',
        subtitle: 'Notify all verified members',
        isBroadcast: true,
      },
    ];

    if (Array.isArray(members)) {
      members.forEach((m) => {
        list.push({
          id: m.id || m.email,
          name: m.name || m.email?.split('@')[0] || 'Member',
          email: m.email,
          role: m.role,
          isBroadcast: false,
        });
      });
    }
    return list;
  }, [members]);

  // Filtered members for popover
  const filteredPopoverMembers = useMemo(() => {
    if (!mentionSearch.trim()) return allMentionOptions;
    const q = mentionSearch.toLowerCase();
    return allMentionOptions.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [allMentionOptions, mentionSearch]);

  // Filtered members for inline mention
  const filteredInlineMembers = useMemo(() => {
    const q = (inlineMentionQuery || '').toLowerCase();
    return allMentionOptions.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [allMentionOptions, inlineMentionQuery]);

  // Insert mention into textarea
  const insertMention = (name, atIndex = -1) => {
    const el = getTextarea();
    const mentionTag = `@${name} `;

    if (atIndex >= 0) {
      const cursorPos = el ? el.selectionStart : message.length;
      const before = message.substring(0, atIndex);
      const after = message.substring(cursorPos);
      const newMsg = before + mentionTag + after;
      setMessage(newMsg);
      setShowInlineMentions(false);
      setInlineMentionQuery('');
      requestAnimationFrame(() => {
        const target = getTextarea();
        if (target) {
          target.focus();
          const newPos = atIndex + mentionTag.length;
          target.setSelectionRange(newPos, newPos);
        }
      });
    } else {
      const start = el ? el.selectionStart : message.length;
      const end = el ? el.selectionEnd : message.length;
      const before = message.substring(0, start);
      const after = message.substring(end);
      const newMsg = before + mentionTag + after;
      setMessage(newMsg);
      setMentionPopoverOpen(false);
      setShowInlineMentions(false);
      requestAnimationFrame(() => {
        const target = getTextarea();
        if (target) {
          target.focus();
          const newPos = start + mentionTag.length;
          target.setSelectionRange(newPos, newPos);
        }
      });
    }
  };

  // Textarea change handler with inline @ detection
  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      // Valid mention query: no spaces, newlines, and reasonable length
      if (!/[\s\n]/.test(query) && query.length <= 25) {
        setInlineMentionQuery(query);
        setInlineMentionIndex(lastAtIndex);
        setShowInlineMentions(true);
        setInlineSelectedIndex(0);
        return;
      }
    }
    setShowInlineMentions(false);
  };

  // Keyboard navigation & shortcuts
  const handleKeyDown = (e) => {
    // Bold shortcut (Ctrl+B / Cmd+B)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      handleBold();
      return;
    }

    // Italic shortcut (Ctrl+I / Cmd+I)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      handleItalic();
      return;
    }

    // Inline mention navigation
    if (showInlineMentions && filteredInlineMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setInlineSelectedIndex((prev) => (prev + 1) % filteredInlineMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setInlineSelectedIndex((prev) => (prev - 1 + filteredInlineMembers.length) % filteredInlineMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredInlineMembers[inlineSelectedIndex] || filteredInlineMembers[0];
        if (selected) {
          insertMention(selected.name, inlineMentionIndex);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowInlineMentions(false);
        return;
      }
    }

    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-slate-200 relative">
      {/* Floating Inline Mention Autocomplete Card */}
      {showInlineMentions && filteredInlineMembers.length > 0 && (
        <div className="absolute bottom-[calc(100%-8px)] left-8 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
            <span>Mention Member</span>
            <span className="text-[10px] text-slate-400 font-normal">↑↓ to navigate, ↵ to select</span>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredInlineMembers.map((item, idx) => {
              const isSelected = idx === inlineSelectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(item.name, inlineMentionIndex);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer',
                    isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isBroadcast ? (
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={14} />
                      </div>
                    ) : (
                      <Avatar className="w-7 h-7 shrink-0 text-xs font-bold">
                        <AvatarFallback className="bg-slate-100 text-slate-700">
                          {item.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-semibold truncate leading-tight">
                        @{item.name}
                      </p>
                      {item.subtitle ? (
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      ) : (
                        item.email && <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                      )}
                    </div>
                  </div>
                  {item.role && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 font-medium shrink-0 ml-1">
                      {item.role}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col border border-slate-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm">
        
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          {/* Bold Button */}
          <button
            type="button"
            onClick={handleBold}
            title="Bold (Ctrl+B)"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors active:scale-95"
          >
            <Bold size={16} />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onClick={handleItalic}
            title="Italic (Ctrl+I)"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors active:scale-95"
          >
            <Italic size={16} />
          </button>

          {/* Hamburger Menu / Lists Formatting Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Formatting & List Menu (Lists, Quotes, Code)"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors active:scale-95 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-800"
              >
                <List size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-52 bg-white border border-slate-200 shadow-lg rounded-xl p-1 z-50">
              <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                List & Block Styles
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => insertLinePrefix('• ')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <List size={15} className="text-blue-600" />
                <span>Bulleted List</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => insertLinePrefix('1. ')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <ListOrdered size={15} className="text-emerald-600" />
                <span>Numbered List</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                onClick={() => insertLinePrefix('> ')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Quote size={15} className="text-amber-600" />
                <span>Blockquote</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => wrapSelection('`', '`')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 text-slate-700"
              >
                <Code size={15} className="text-indigo-600" />
                <span>Inline Code</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-4 bg-slate-300 mx-1"></div>

          {/* @ Mention Popover Button */}
          <Popover open={mentionPopoverOpen} onOpenChange={setMentionPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Mention group members (@)"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors active:scale-95 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-800"
              >
                <AtSign size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-72 p-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50">
              <div className="px-2 py-1 border-b border-slate-100 mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mention Member
                </p>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={mentionSearch}
                    onChange={(e) => setMentionSearch(e.target.value)}
                    placeholder="Search verified members..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {filteredPopoverMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No members found</p>
                ) : (
                  filteredPopoverMembers.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insertMention(item.name)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isBroadcast ? (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Users size={14} />
                          </div>
                        ) : (
                          <Avatar className="w-7 h-7 shrink-0 text-xs font-bold">
                            <AvatarFallback className="bg-slate-100 text-slate-700">
                              {item.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate leading-tight group-hover:text-blue-600">
                            @{item.name}
                          </p>
                          {item.subtitle ? (
                            <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                          ) : (
                            item.email && <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                          )}
                        </div>
                      </div>
                      {item.role && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 font-medium shrink-0 ml-1">
                          {item.role}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Input Area */}
        <textarea
          id="communication-composer-textarea"
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift + Enter for new line, @ to mention, Ctrl+B for bold)"
          disabled={disabled}
          className="w-full min-h-[80px] max-h-[200px] p-3 resize-none outline-none text-sm bg-transparent placeholder:text-slate-400 disabled:opacity-50"
          rows={2}
        />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative group"
            >
              <Paperclip size={18} />
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Smile size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-white border border-slate-200 shadow-lg rounded-xl" side="top">
                <div className="grid grid-cols-6 gap-2">
                  {['👍', '🔥', '🚀', '👀', '🎉', '👏', '❤️', '💯', '✨', '✅', '🙏', '💡'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="text-xl hover:bg-slate-100 rounded p-1 transition-colors"
                      onClick={() => {
                        setMessage((prev) => prev + emoji);
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-blue-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
            title="Send Message"
          >
            <Send size={16} className="translate-x-[1px] translate-y-[-1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
