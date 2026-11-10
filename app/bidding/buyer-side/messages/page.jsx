"use client";

import React, { useState, useEffect, useRef } from 'react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function BuyerMessagesPage() {
  const [dealName, setDealName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [buyerUserId, setBuyerUserId] = useState('');
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
        if (user?.company_name) setBuyerCompany(user.company_name);
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

  // Resolve real deal metadata & counterparty from DB
  useEffect(() => {
    fetch('/api/deal-workflow/active-stage')
      .then((res) => res.json())
      .then((data) => {
        const dm = data.dealMeta;
        if (dm?.dealName) setDealName(dm.dealName);
        else if (data.negotiationInvitation?.dealName) setDealName(data.negotiationInvitation.dealName);
        if (dm?.sellerSuperAdminName) setSellerName(dm.sellerSuperAdminName);
        if (dm?.buyerCompany) setBuyerCompany((prev) => prev || dm.buyerCompany);
        if (dm?.buyerName) setCurrentUserName((prev) => prev || dm.buyerName);
        if (dm?.buyerId) setBuyerUserId((prev) => prev || dm.buyerId);
      })
      .catch(() => { });
  }, []);

  // Fetch live messages from DB API
  const loadMessages = () => {
    const query = buyerUserId ? `?buyerId=${encodeURIComponent(buyerUserId)}` : '';
    fetch(`/api/bidding/messages${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.dealMeta) {
          if (data.dealMeta.dealName) setDealName((prev) => prev || data.dealMeta.dealName);
          if (data.dealMeta.sellerName) setSellerName((prev) => prev || data.dealMeta.sellerName);
          if (data.dealMeta.buyerCompany) setBuyerCompany((prev) => prev || data.dealMeta.buyerCompany);
          if (data.dealMeta.buyerId) setBuyerUserId((prev) => prev || data.dealMeta.buyerId);
        }
        if (data.conversation?.threads && Array.isArray(data.conversation.threads)) {
          const mapped = data.conversation.threads.map((t, idx) => {
            const isBuyer =
              t.senderRole === 'buyer' ||
              t.sender?.includes('Guest Admin') ||
              t.sender === 'You';

            const isSeller =
              t.senderRole === 'seller' ||
              t.sender?.includes('Super Admin') ||
              t.sender?.includes('Seller');

            const isMe = isBuyer && !isSeller;

            return {
              id: t.id || `bmsg-${idx}-${t.timestamp || t.createdAt || 't'}`,
              sender: isMe
                ? 'You (Guest Admin)'
                : (t.sender || sellerName || 'Seller Admin'),
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
        } else {
          setMessages([]);
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
          buyerId: buyerUserId || undefined,
          text: textToSend,
          sender: `${currentUserName || 'Buyer'} (Guest Admin)`,
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
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed h-full flex flex-col overflow-hidden antialiased">
      {/* Top Bidding Navigation Tabs */}
      <div className="shrink-0">
        <BiddingHeaderNav portal="buyer" activeTab="messages" />
      </div>

      {/* Main Messages Container */}
      <div className="w-full mx-auto px-3 py-3 md:px-5 md:py-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border-2 border-gray-300 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col shadow-md shadow-gray-300/80 min-h-0">

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 m-0 flex items-center gap-2">
                <span>Direct Negotiation{dealName ? ` — ${dealName}` : ''}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active Channel"></span>
              </h1>
              <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                Counterparty: <strong className="text-slate-800">{sellerName || 'Seller Super Admin'}</strong> (Seller Super Admin) · Buyer: <strong className="text-slate-800">{currentUserName || 'Buyer'}</strong> ({buyerCompany ? `Guest Admin · ${buyerCompany}` : 'Guest Admin'})
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
                <p className="text-xs">Send a direct message to {sellerName || 'Seller Super Admin'} regarding acquisition valuation or term sheet.</p>
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
                placeholder={`Write a message to ${sellerName || 'Seller Super Admin'}...`}
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
