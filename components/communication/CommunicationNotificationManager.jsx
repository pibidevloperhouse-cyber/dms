"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Hash, X, ArrowRight, AtSign, Bell } from 'lucide-react';

/**
 * Lightweight, zero-dependency synthesised notification chime
 */
function playNotificationChime() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant two-tone chime (F5 -> A5)
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted by autoplay policy before user interaction
  }
}

export default function CommunicationNotificationManager() {
  const pathname = usePathname();
  const router = useRouter();

  const [toasts, setToasts] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
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
  const knownMessageIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  // Sync session on storage changes
  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem('vdr_session');
        const parsed = raw ? JSON.parse(raw) : null;
        setCurrentUser((prev) => (prev?.id !== parsed?.id ? parsed : prev));
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleOpenConversation = useCallback(
    (channelId, toastId) => {
      dismissToast(toastId);
      router.push(`/communication/${channelId}`);
    },
    [router, dismissToast]
  );

  const isFetchingRef = useRef(false);

  // Poll channels and detect new incoming messages
  const checkNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const activeWorkspaceId = currentUser.active_workspace_id || '';
      const url = `/api/communication/channels?userId=${encodeURIComponent(
        currentUser.id
      )}${activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success || !Array.isArray(data.channels)) return;

      const channels = data.channels;
      const totalUnread = channels.reduce((sum, ch) => sum + (ch.unreadCount || 0), 0);

      // Broadcast unread update to MainSidebar and ChannelSidebar
      window.dispatchEvent(
        new CustomEvent('communication_unread_updated', {
          detail: { unreadCount: totalUnread, channels },
        })
      );

      // On initial load: seed known messages without popping toasts
      if (!isInitializedRef.current) {
        channels.forEach((ch) => {
          if (ch.latestMessage?.id) {
            knownMessageIdsRef.current.add(ch.latestMessage.id);
          }
        });
        isInitializedRef.current = true;
        return;
      }

      // Detect new incoming messages
      channels.forEach((ch) => {
        const msg = ch.latestMessage;
        if (!msg?.id) return;

        if (!knownMessageIdsRef.current.has(msg.id)) {
          knownMessageIdsRef.current.add(msg.id);

          // Only alert if sent by someone else and user is not currently viewing that channel
          const isSender = msg.senderId === currentUser.id;
          const isCurrentlyActiveInChannel = pathname === `/communication/${ch.id}`;

          if (!isSender && !isCurrentlyActiveInChannel) {
            const userNameLower = (currentUser.name || '').toLowerCase();
            const textLower = (msg.messageText || '').toLowerCase();
            const isMention =
              textLower.includes('@everyone') ||
              (userNameLower && textLower.includes(`@${userNameLower.split(' ')[0]}`)) ||
              (ch.unreadMentionsCount || 0) > 0;

            const newToast = {
              id: msg.id,
              channelId: ch.id,
              channelName: ch.name,
              senderName: msg.senderName || 'Teammate',
              text: msg.messageText || '',
              createdAt: msg.createdAt,
              isMention,
            };

            setToasts((prev) => {
              // Avoid duplicate toasts for same message
              if (prev.some((t) => t.id === newToast.id)) return prev;
              return [newToast, ...prev].slice(0, 4); // Max 4 concurrent toasts
            });

            playNotificationChime();
          }
        }
      });
    } catch (err) {
      console.warn('Notification check failed:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentUser, pathname]);

  // Periodic polling throttled to 7.5s and pauses on hidden tab
  useEffect(() => {
    if (!currentUser?.id) return;

    checkNotifications();
    const interval = setInterval(checkNotifications, 7500);

    return () => clearInterval(interval);
  }, [currentUser, checkNotifications]);

  // Auto-dismiss toasts after 7 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, prev.length - 1));
    }, 7000);

    return () => clearTimeout(timer);
  }, [toasts]);

  if (!currentUser || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full font-sans"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-4 transition-all duration-300 animate-in slide-in-from-top-4 fade-in hover:shadow-2xl"
        >
          {/* Header row: Group tag + Mention badge + Close */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 truncate">
                <Hash size={12} className="shrink-0 text-blue-500" />
                <span className="truncate">{toast.channelName}</span>
              </span>

              {toast.isMention && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200 shrink-0 animate-pulse">
                  <AtSign size={11} className="shrink-0 text-purple-600" />
                  Mentioned You
                </span>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Dismiss"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="flex items-start gap-3 my-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {(toast.senderName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate mb-0.5">
                {toast.senderName}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed break-words">
                {toast.text}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => dismissToast(toast.id)}
              className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleOpenConversation(toast.channelId, toast.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>View Chat</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
