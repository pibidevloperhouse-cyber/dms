"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Lock, ShieldX, RefreshCw, MessageSquare, Menu } from 'lucide-react';
import MessageTimeline from '@/components/communication/MessageTimeline';
import RichComposer from '@/components/communication/RichComposer';
import ContextPanel from '@/components/communication/ContextPanel';
import { useCommunicationRealtime } from '@/hooks/useCommunicationRealtime';

export default function ChannelPage({ params }) {
  const unwrappedParams = use(params);
  const channelId = unwrappedParams.channelId;
  const router = useRouter();

  // Lazy initializer to avoid synchronous setState inside an effect
  const [session] = useState(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('vdr_session');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [channelData, setChannelData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!session?.id && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [session, router]);

  // Fetch channel details and members
  const fetchChannelDetails = useCallback(async () => {
    if (!channelId || !session?.id) return;
    try {
      const activeWorkspaceId = session.active_workspace_id || '';
      const url = `/api/communication/channels/${channelId}?userId=${encodeURIComponent(
        session.id
      )}${activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 403) {
          setAuthError(data.error || 'Access Denied: You are not authorized to view this group conversation.');
        } else if (res.status === 404) {
          setAuthError('Conversation or associated group not found.');
        } else {
          setAuthError(data.error || 'Failed to load conversation.');
        }
        setChannelData(null);
        return;
      }

      setChannelData(data.channel);
      setMembers(data.members || []);
      setAuthError(null);
    } catch (err) {
      console.error('Channel detail error:', err);
      setAuthError(err.message);
    }
  }, [channelId, session]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!channelId || !session?.id) return;
    try {
      const activeWorkspaceId = session.active_workspace_id || '';
      const url = `/api/communication/messages?channelId=${encodeURIComponent(
        channelId
      )}&userId=${encodeURIComponent(session.id)}${
        activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''
      }`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [channelId, session]);

  useEffect(() => {
    if (!session?.id) return;

    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await Promise.all([fetchChannelDetails(), fetchMessages()]);
      }
    };
    load();

    // Poll messages every 2.5 seconds for instant two-account sync
    const interval = setInterval(() => {
      fetchMessages();
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session, fetchChannelDetails, fetchMessages]);

  // Realtime subscription (Supabase WebSocket when available)
  const handleNewRealtimeMessage = useCallback(
    (newMsg) => {
      if (!newMsg || newMsg.channel_id !== channelId) return;
      fetchMessages();
    },
    [channelId, fetchMessages]
  );

  useCommunicationRealtime({
    channelId,
    onNewMessage: handleNewRealtimeMessage,
  });

  // Send message
  const handleSendMessage = async (text) => {
    if (!text?.trim() || !session?.id || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/communication/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId,
          messageText: text.trim(),
          userId: session.id,
          session,
          workspaceId: session.active_workspace_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to send message');
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev;
        return [...prev, data.message];
      });
    } catch (err) {
      console.error('Send message error:', err);
      alert('Error sending message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  // Loading state
  if (loading && !channelData && !authError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8F9FB] font-sans">
        <div className="w-9 h-9 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Loading group conversation...
        </p>
      </div>
    );
  }

  // Access denied / Error state
  if (authError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#F8F9FB] p-8 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
          <ShieldX size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          {authError}
        </p>
        <button
          onClick={() => router.push('/groups')}
          className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-50 shadow-xs cursor-pointer transition-all"
        >
          Return to Groups
        </button>
      </div>
    );
  }

  const channelName = channelData?.groupName || channelData?.name || 'Group Conversation';
  const isPrivate = channelData?.type === 'private';
  const memberCount = members.length;

  return (
    <div className="flex w-full h-full font-sans">
      <div className="flex-1 flex flex-col min-w-0 h-full border-r border-slate-200 bg-white">
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                isPrivate ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600 font-bold'
              }`}
            >
              {isPrivate ? <Lock size={20} /> : <Hash size={20} />}
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-800 text-base leading-tight truncate">
                  {channelName}
                </h1>
                {channelData?.department && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    {channelData.department}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">
                {memberCount} verified member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              title="Refresh messages"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              title="Toggle Group Details"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F9FB]">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Welcome to {channelName}</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              This conversation is strictly accessible only to authorized members of {channelName}.
              Type a message below to start the conversation!
            </p>
          </div>
        ) : (
          <MessageTimeline messages={messages} />
        )}

        <RichComposer onSend={handleSendMessage} disabled={sending} members={members} />
      </div>

      <ContextPanel
        channel={channelData}
        group={channelData}
        members={members}
        showOnMobile={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </div>
  );
}
