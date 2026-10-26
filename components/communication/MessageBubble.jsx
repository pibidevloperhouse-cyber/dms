import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Smile, MessageSquare, MoreHorizontal, Paperclip } from 'lucide-react';
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

export default function MessageBubble({ message }) {
  const isMe = message.isMine;
  const displayName = message.senderName || message.senderEmail || 'User';
  const role = message.senderRole || message.role || '';
  const text = message.messageText || message.text || '';

  return (
    <div className={cn("flex gap-3 mb-4 group", isMe ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback className={isMe ? "bg-blue-600 text-white font-bold" : "bg-slate-200 text-slate-700 font-bold"}>
          {displayName.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
        <div className={cn("flex items-center gap-2 mb-1", isMe ? "flex-row-reverse" : "flex-row")}>
          <span className="text-xs font-bold text-slate-800">{displayName}</span>
          {!isMe && role && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 font-medium">
              {role}
            </Badge>
          )}
          <span className="text-[11px] text-slate-400 font-medium">{message.timestamp}</span>
        </div>

        <div className={cn(
          "relative px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed shadow-xs",
          isMe 
            ? "bg-blue-600 text-white rounded-tr-xs font-normal" 
            : "bg-slate-100 text-slate-800 rounded-tl-xs font-normal"
        )}>
          {renderFormattedContent(text, isMe)}
          
          {/* Attachments Preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {message.attachments.map((file, idx) => (
                <div key={idx} className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border",
                  isMe ? "bg-blue-700/50 border-blue-500" : "bg-white border-slate-200"
                )}>
                  <Paperclip size={14} />
                  <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reactions & Threads */}
        <div className={cn("flex items-center gap-2 mt-1", isMe ? "flex-row-reverse" : "flex-row")}>
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1">
              {message.reactions.map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
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

      {/* Hover Actions */}
      <div className={cn(
        "hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-4 bg-white border border-slate-200 rounded-md shadow-sm p-0.5",
        isMe ? "mr-2" : "ml-2"
      )}>
        <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><Smile size={16} /></button>
        <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><MessageSquare size={16} /></button>
        <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><MoreHorizontal size={16} /></button>
      </div>
    </div>
  );
}
