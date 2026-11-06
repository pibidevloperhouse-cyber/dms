"use client";

import React, { useState, useEffect, useRef } from 'react';
import BiddingHeaderNav from '@/components/bidding/BiddingHeaderNav';

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState({});
  const [selectedBuyerId, setSelectedBuyerId] = useState('8ec0af77-0630-444f-8e1c-d362f35a2e13');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

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
    const interval = setInterval(fetchMessages, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedBuyerId]);

  const convList = Array.from(
    new Map(
      Object.values(conversations || {})
        .filter((c) => c && (c.buyerId || c.id))
        .map((c) => [c.buyerId || c.id, c])
    ).values()
  );

  const currentConv =
    conversations[selectedBuyerId] ||
    convList.find(
      (c) =>
        (c.buyerName && c.buyerName.toLowerCase().includes('naga')) ||
        c.buyerId === '8ec0af77-0630-444f-8e1c-d362f35a2e13'
    ) ||
    convList[0] || {
      buyerId: '8ec0af77-0630-444f-8e1c-d362f35a2e13',
      buyerName: 'Naga Tech',
      leadName: 'Naga raj',
      threads: []
    };

  const rawThreads = currentConv.threads && currentConv.threads.length > 0 ? currentConv.threads : [
    {
      id: 'sm-1',
      sender: 'V. Sharma',
      senderRole: 'seller',
      isMe: true,
      text: "Thanks for the revised offer. The board reviewed it this morning — we'd like to discuss the stock component a bit further before responding formally.",
      timestamp: '2 Sep, 2:15 PM'
    },
    {
      id: 'sm-2',
      sender: 'Naga raj (Buyer Lead)',
      senderRole: 'buyer',
      isMe: false,
      text: "Happy to walk through it. We're flexible on the vesting schedule if that helps move things along.",
      timestamp: '2 Sep, 3:40 PM'
    },
    {
      id: 'sm-3',
      sender: 'V. Sharma',
      senderRole: 'seller',
      isMe: true,
      text: "We've sent over a counter at $10.0M — full details are reflected in the term sheet draft. Let us know your thoughts by the deadline.",
      timestamp: '3 Sep, 9:05 AM'
    },
    {
      id: 'sm-4',
      sender: 'Linklane LLP (Seller Counsel)',
      senderRole: 'seller',
      isMe: true,
      text: "Escrow holdback period works for us — no further changes needed on our side once you confirm the price.",
      timestamp: '7 Sep, 11:40 AM'
    }
  ];

  const threads = rawThreads.map((t) => {
    const isSeller =
      t.senderRole === 'seller' ||
      t.isMe === true ||
      t.sender === 'You' ||
      t.sender?.includes('Seller') ||
      t.sender?.includes('Sharma') ||
      t.sender?.includes('Linklane');
    return {
      id: t.id || 'msg-' + Math.random(),
      sender: isSeller ? (t.sender?.includes('Counsel') ? 'Linklane LLP (Counsel)' : 'You (Seller Board)') : (t.sender === 'You' ? (currentConv.buyerName || 'Buyer') : t.sender),
      isMe: isSeller,
      text: t.text,
      timestamp: t.timestamp
    };
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;
    setIsSending(true);

    const targetBuyerId = currentConv.buyerId || currentConv.id || selectedBuyerId || '8ec0af77-0630-444f-8e1c-d362f35a2e13';

    let sellerName = 'V. Sharma (Seller Board)';
    try {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        const user = JSON.parse(raw);
        if (user.name) sellerName = `${user.name} (Seller)`;
      }
    } catch (e) {}

    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await fetch('/api/bidding/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: targetBuyerId,
          text: textToSend,
          sender: sellerName,
          senderRole: 'seller'
        })
      });
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#F8F9FB] text-slate-900 font-sans text-[14px] leading-relaxed h-[calc(100vh-58px)] flex flex-col overflow-hidden antialiased">
      {/* Top Bidding Navigation Tabs */}
      <div className="shrink-0">
        <BiddingHeaderNav portal="seller" activeTab="messages" />
      </div>

      {/* Main Messages Container - Single Chat (No Sidebar) matching Buyer Side */}
      <div className="max-w-[1240px] w-full mx-auto p-4 md:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden flex-1 flex flex-col shadow-sm min-h-0">

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h1 className="text-[16px] font-bold text-slate-900 m-0 flex items-center gap-2">
                <span>General — {currentConv.buyerName || 'Naga Tech'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" title="Active"></span>
              </h1>
              <div className="text-[12px] text-slate-500 mt-0.5 font-medium">
                Counterparty: {currentConv.leadName || 'Naga raj'} (Buyer Lead) · {currentConv.currentOffer ? `Offer: ${currentConv.currentOffer}` : 'Active Proposal'}
              </div>
            </div>
          </div>

          {/* Messages Thread - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FAFAFA] min-h-0">
            {threads.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[72%] ${msg.isMe ? 'self-end' : 'self-start'}`}
              >
                <div
                  className={`px-4.5 py-3 rounded-2xl text-[13px] leading-relaxed shadow-xs ${
                    msg.isMe
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
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="border-t border-slate-100 p-4 bg-white shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                rows="2"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Write a message to ${currentConv.buyerName || 'the buyer'}...`}
                className="w-full font-sans text-[13px] px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none bg-[#FAFAFA] focus:bg-white focus:border-[#006666] focus:ring-1 focus:ring-[#006666]/30 outline-none transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isSending || !inputMessage.trim()}
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
