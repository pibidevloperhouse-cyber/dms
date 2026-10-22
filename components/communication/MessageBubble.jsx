import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck, Smile, MessageSquare, MoreHorizontal, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

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
          {text}
          
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
