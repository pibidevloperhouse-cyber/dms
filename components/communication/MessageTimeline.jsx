"use client";

import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MessageTimeline({ messages, onEditMessage, onDeleteMessage }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 bg-[#F8F9FB] p-6 relative">
      <div className="flex flex-col gap-2">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </ScrollArea>
  );
}
