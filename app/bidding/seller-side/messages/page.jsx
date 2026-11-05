"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState({});
  const [selectedBuyerId, setSelectedBuyerId] = useState('c');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/bidding/messages');
      if (res.ok) {
        const data = await res.json();
        if (data.conversations) {
          setConversations(data.conversations);
          if (!selectedBuyerId && Object.keys(data.conversations).length > 0) {
            setSelectedBuyerId(Object.keys(data.conversations)[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/bidding/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: selectedBuyerId,
          text: inputMessage.trim(),
          sender: 'You',
          senderRole: 'seller',
          category: selectedCategory
        })
      });
      if (res.ok) {
        setInputMessage('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const convList = Array.from(new Map(Object.values(conversations || {}).filter(c => c && (c.buyerId || c.id)).map(c => [c.buyerId || c.id, c])).values());
  const currentConv = conversations[selectedBuyerId] || convList[0];

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed min-h-screen flex flex-col antialiased">
      {/* Top Bidding Navigation Tabs - Buyers tab removed */}
      <div className="flex gap-[2px] px-7 border-b border-slate-200 bg-white">
        <Link href="/bidding/seller-side" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Bidding</Link>
        <Link href="/bidding/seller-side/term-sheet" className="px-4 py-[13px] text-[13px] text-slate-500 hover:text-slate-900 border-b-2 border-transparent">Term sheet</Link>
        <Link href="/bidding/seller-side/messages" className="px-4 py-[13px] text-[13px] text-slate-900 border-b-2 border-blue-600 font-medium">Messages</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] m-7 border border-slate-200 rounded-xl bg-white overflow-hidden flex-1 min-h-[540px] shadow-sm">
        {/* Buyer conversations sidebar */}
        <div className="border-r border-slate-100 overflow-y-auto flex flex-col bg-white">
          <div className="px-[18px] py-4 border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wide font-semibold">
            Buyer conversations
          </div>

          {convList.map((conv) => {
            const isSelected = conv.buyerId === selectedBuyerId;
            const lastMsg = conv.threads?.[conv.threads.length - 1];
            return (
              <div
                key={conv.buyerId}
                onClick={() => setSelectedBuyerId(conv.buyerId)}
                className={`px-[18px] py-3.5 border-b border-slate-100 cursor-pointer flex gap-2.5 transition-colors ${
                  isSelected ? 'bg-blue-50/70 border-r-2 border-r-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {conv.mark || conv.buyerName?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 flex justify-between items-center">
                    <span className="truncate">{conv.buyerName}</span>
                    {conv.unreadCount > 0 && !isSelected && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 font-medium mt-1 truncate">
                    {lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : 'No messages yet'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{lastMsg?.timestamp || 'Recent'}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Thread view */}
        <div className="flex flex-col bg-[#F8F9FB]">
          {currentConv ? (
            <>
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10 shadow-xs">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900 m-0">{currentConv.buyerName}</h2>
                  <div className="text-[11.5px] text-slate-400 mt-0.5 font-medium">
                    Lead: {currentConv.leadName || 'R. Okafor'} · Advisor: {currentConv.advisorName || 'Linklane LLP'} · Current offer {currentConv.currentOffer || '$100.0M'}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  currentConv.status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  currentConv.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {currentConv.status || 'Active'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {(currentConv.threads || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[72%] ${msg.isMe ? 'self-end' : 'self-start'}`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                        msg.isMe
                          ? 'bg-slate-900 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`text-[11px] text-slate-400 mt-1 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                      {msg.sender} · {msg.timestamp}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 px-5 py-3.5 bg-white">
                <textarea
                  rows="3"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write a message to ${currentConv.buyerName}...`}
                  className="w-full font-sans text-[13px] px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 outline-none focus:border-blue-500 resize-none shadow-2xs"
                />
                <div className="flex justify-between items-center mt-2.5 flex-wrap gap-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {['General', 'Financials', 'Legal', 'Operations'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-colors border ${
                          selectedCategory === cat
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !inputMessage.trim()}
                    className="font-sans text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    {isSending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a buyer conversation from the left to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
