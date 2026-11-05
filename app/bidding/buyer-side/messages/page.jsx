"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function MessagesPage() {
  const [messages, setMessages] = useState([
    {
      id: "bm-1",
      sender: "V. Sharma",
      isMe: false,
      text: "Thanks for the revised offer. The board reviewed it this morning — we'd like to discuss the stock component a bit further before responding formally.",
      timestamp: "2 Sep, 2:15 PM"
    },
    {
      id: "bm-2",
      sender: "You",
      isMe: true,
      text: "Happy to walk through it. We're flexible on the vesting schedule if that helps move things along.",
      timestamp: "2 Sep, 3:40 PM"
    },
    {
      id: "bm-3",
      sender: "V. Sharma",
      isMe: false,
      text: "We've sent over a counter at $100.0M — full details are in the term sheet draft. Let us know your thoughts by the 6th.",
      timestamp: "3 Sep, 9:05 AM"
    },
    {
      id: "bm-4",
      sender: "V. Sharma",
      isMe: false,
      text: "Escrow holdback period works for us — no further changes needed on our side once you confirm the price.",
      timestamp: "7 Sep, 11:40 AM"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch live messages from API if available
  useEffect(() => {
    let buyerId = '3e5cac9b-e809-4a2a-a95d-35e9baa6eddf';
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user.id) buyerId = user.id;
      }
    } catch (e) {}

    fetch(`/api/bidding/messages?buyerId=${buyerId}`)
      .then(res => res.json())
      .then(data => {
        if (data.conversation?.threads && data.conversation.threads.length > 0) {
          const mapped = data.conversation.threads.map(t => ({
            id: t.id,
            sender: t.sender === 'You' ? (t.senderRole === 'buyer' ? 'You' : 'Ohm Priya (Seller)') : (t.senderRole === 'buyer' ? 'You' : t.sender),
            isMe: t.senderRole === 'buyer' || t.sender === 'You' || t.sender === 'Naga raj' || t.sender === 'Test User',
            text: t.text,
            timestamp: t.timestamp
          }));
          setMessages(mapped);
        }
      })
      .catch(() => { });
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);

    let buyerId = '3e5cac9b-e809-4a2a-a95d-35e9baa6eddf';
    let buyerName = 'You';
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user.id) buyerId = user.id;
        if (user.name) buyerName = user.name;
      }
    } catch (e) {}

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMsg = {
      id: "bm-" + Date.now(),
      sender: "You",
      isMe: true,
      text: inputText.trim(),
      timestamp
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      await fetch('/api/bidding/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId,
          text: newMsg.text,
          sender: buyerName,
          senderRole: 'buyer'
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed h-screen max-h-screen flex flex-col overflow-hidden antialiased">
      {/* Top Navigation Tabs - Fixed, not scrollable */}
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white shrink-0">
        <Link href="/bidding/buyer-side/my-bid" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">My bid</Link>
        <Link href="/bidding/buyer-side/bid-history" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bid history</Link>
        <Link href="/bidding/buyer-side/messages" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Messages</Link>
        <Link href="/bidding/buyer-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
      </div>

      {/* Main Container - Fits exact viewport height without outer scrolling */}
      <div className="max-w-[1240px] w-full mx-auto p-4 md:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col shadow-sm min-h-0">

          {/* Chat Header - Fixed, shrink-0, img3 (audit trail) REMOVED */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 m-0 flex items-center gap-2">
                <span>General — ABC Technologies</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Active"></span>
              </h1>
              <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                Seller team: V. Sharma (Finance), Linklane LLP (Counsel)
              </div>
            </div>
          </div>

          {/* Messages Thread - ONLY this section scrolls! (flex-1 overflow-y-auto min-h-0) */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FAFAFA] min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[72%] ${msg.isMe ? 'self-end' : 'self-start'}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-xs ${msg.isMe
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                    }`}
                >
                  {msg.text}
                </div>
                <div className={`text-[11px] text-slate-400 mt-1.5 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                  {msg.sender} · {msg.timestamp}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply & Send Box - Fixed at bottom, shrink-0, img2 (topic pills) REMOVED */}
          <div className="border-t border-slate-100 p-4 bg-white shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                rows="2"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Write a message to the seller..."
                className="w-full font-sans text-[13px] px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none bg-[#FAFAFA] focus:bg-white focus:border-slate-400 outline-none transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending || !inputText.trim()}
                className="font-sans text-[13px] font-semibold px-6 py-2.5 rounded-xl cursor-pointer border border-slate-900 bg-slate-900 text-white hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm shrink-0 h-[44px]"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
