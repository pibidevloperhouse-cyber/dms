"use client";

import React, { useState, useEffect, useRef } from 'react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BuyerMessagesPage() {
  const [dealName, setDealName] = useState('VDR Sell');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('Naga raj');
  const [buyerUserId, setBuyerUserId] = useState('8ec0af77-0630-444f-8e1c-d362f35a2e13');
  const messagesEndRef = useRef(null);
  const prevCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.name) setCurrentUserName(user.name);
        if (user?.id) setBuyerUserId(user.id);
      }
    } catch (_) { }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (isFirstLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstLoadRef.current = false;
      prevCountRef.current = messages.length;
    } else if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevCountRef.current = messages.length;
    }
  }, [messages.length]);

  // Resolve deal name
  useEffect(() => {
    try {
      const rawInv = localStorage.getItem('dms_negotiation_invitation');
      if (rawInv) {
        const inv = JSON.parse(rawInv);
        if (inv.dealName) setDealName(inv.dealName);
      }
    } catch (e) { }

    fetch('/api/deal-workflow/active-stage')
      .then((res) => res.json())
      .then((data) => {
        if (data.dealMeta?.dealName) setDealName(data.dealMeta.dealName);
        else if (data.negotiationInvitation?.dealName) setDealName(data.negotiationInvitation.dealName);
      })
      .catch(() => { });
  }, []);

  // Fetch live messages from API
  const loadMessages = () => {
    const idToQuery = buyerUserId || '8ec0af77-0630-444f-8e1c-d362f35a2e13';
    fetch(`/api/bidding/messages?buyerId=${encodeURIComponent(idToQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.conversation?.threads && Array.isArray(data.conversation.threads)) {
          const mapped = data.conversation.threads.map((t, idx) => {
            const isBuyer =
              t.senderRole === 'buyer' ||
              t.sender?.includes('Guest Admin') ||
              t.sender?.includes('Naga') ||
              t.sender === 'You' ||
              t.isMe === true;

            const isSeller =
              t.senderRole === 'seller' ||
              t.sender?.includes('Super Admin') ||
              t.sender?.includes('Vishwa') ||
              t.sender?.includes('Seller');

            const isMe = isBuyer && !isSeller;

            return {
              id: t.id || `bmsg-${idx}-${t.timestamp || t.createdAt || 't'}`,
              sender: isMe
                ? 'You (Guest Admin)'
                : (t.sender || 'Vishwa Raj (Super Admin)'),
              isMe,
              text: t.text,
              timestamp: t.timestamp
            };
          });

          setMessages((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(mapped)) {
              return prev;
            }
            return mapped;
          });
        }
      })
      .catch((err) => console.error('Error loading buyer messages:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [buyerUserId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);

    const now = new Date();
    const timestamp =
      now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
      ', ' +
      now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const textToSend = inputText.trim();
    setInputText('');

    const newMsg = {
      id: 'bm-opt-' + Date.now(),
      sender: 'You (Guest Admin)',
      isMe: true,
      text: textToSend,
      timestamp
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await fetch('/api/bidding/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyerUserId || '8ec0af77-0630-444f-8e1c-d362f35a2e13',
          text: textToSend,
          sender: `${currentUserName} (Guest Admin)`,
          senderRole: 'buyer'
        })
      });
      loadMessages();
    } catch (e) {
      console.error('Error posting buyer message:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed h-[calc(100vh-58px)] flex flex-col overflow-hidden antialiased">
      {/* Top Bidding Navigation Tabs */}
      <div className="shrink-0">
        <BiddingHeaderNav portal="buyer" activeTab="messages" />
      </div>

      {/* Main Messages Container */}
      <div className="max-w-[1240px] w-full mx-auto p-4 md:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col shadow-sm min-h-0">

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 m-0 flex items-center gap-2">
                <span>Direct Negotiation — {dealName}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active Channel"></span>
              </h1>
              <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                Counterparty: <strong className="text-slate-800">Vishwa Raj</strong> (Seller Super Admin) · Buyer: <strong className="text-slate-800">{currentUserName}</strong> (Guest Admin · Naga Tech)
              </div>
            </div>
          </div>

          {/* Messages Thread - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FAFAFA] min-h-0">
            {loading && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#006666] animate-pulse"></div>
                  <span className="text-xs">Loading negotiation channel...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <p className="text-sm font-semibold text-slate-600 mb-1">Direct Seller Channel Active</p>
                <p className="text-xs">Send a direct message to Vishwa Raj (Seller Super Admin) regarding acquisition valuation or term sheet.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[72%] ${msg.isMe ? 'self-end' : 'self-start'}`}
                >
                  <div
                    className={`px-4.5 py-3 rounded-2xl text-[13px] leading-relaxed shadow-xs ${msg.isMe
                        ? 'bg-[#006666] text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                      }`}
                  >
                    {msg.text}
                  </div>
                  <div className={`text-[11px] text-slate-400 mt-1.5 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                    {msg.sender} · {msg.timestamp}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
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
                placeholder="Write a message to Vishwa Raj (Seller Super Admin)..."
                className="w-full font-sans text-[13px] px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none bg-[#FAFAFA] focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending || !inputText.trim()}
                className="font-sans text-[13px] font-semibold px-6 py-2.5 rounded-xl cursor-pointer bg-[#006666] hover:bg-[#005252] text-white disabled:opacity-40 transition-opacity shadow-sm shrink-0 h-[44px]"
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
