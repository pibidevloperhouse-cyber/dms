"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  X,
  MessageSquare,
  Hash,
  AtSign,
  ArrowRight,
  Clock,
} from 'lucide-react';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
}

export default function NotificationBell({ placement = 'dropdown', dropdownAlign = 'right' }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentionsCount, setMentionsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'mentions'
  const [markingAll, setMarkingAll] = useState(false);
  const popoverRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Fetch notifications
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const rawSession = localStorage.getItem('vdr_session');
        if (!rawSession) return;
        const session = JSON.parse(rawSession);
        const userId = session?.id;
        if (!userId) return;

        const activeWorkspaceId = session?.active_workspace_id || '';
        const url = `/api/communication/notifications?userId=${encodeURIComponent(userId)}${
          activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''
        }`;

        const res = await fetch(url);
        const data = await res.json();

        if (isMounted && data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
          setMentionsCount(typeof data.unreadMentionsCount === 'number' ? data.unreadMentionsCount : 0);
        }
      } catch (err) {
        console.warn('Failed to fetch notifications:', err);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync state via window events dispatched by CommunicationNotificationManager
  useEffect(() => {
    const handleUnreadUpdated = (e) => {
      if (typeof e?.detail?.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      }
    };

    const handleReadEvent = (e) => {
      const readChannelId = e?.detail?.channelId;
      if (readChannelId) {
        setNotifications((prev) =>
          prev.map((n) => (n.channelId === readChannelId ? { ...n, isUnread: false } : n))
        );
      }
    };

    window.addEventListener('communication_unread_updated', handleUnreadUpdated);
    window.addEventListener('communication_read', handleReadEvent);

    return () => {
      window.removeEventListener('communication_unread_updated', handleUnreadUpdated);
      window.removeEventListener('communication_read', handleReadEvent);
    };
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    try {
      const rawSession = localStorage.getItem('vdr_session');
      const userId = rawSession ? JSON.parse(rawSession)?.id : null;
      if (!userId) return;

      await fetch('/api/communication/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // Optimistically clear unread indicators
      setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
      setUnreadCount(0);
      setMentionsCount(0);

      window.dispatchEvent(
        new CustomEvent('communication_unread_updated', {
          detail: { unreadCount: 0, channels: [] },
        })
      );
    } catch (err) {
      console.warn('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Open notification: mark channel as read and navigate
  const handleNotificationClick = async (notif) => {
    setIsOpen(false);

    try {
      const rawSession = localStorage.getItem('vdr_session');
      const userId = rawSession ? JSON.parse(rawSession)?.id : null;

      if (userId && notif.isUnread) {
        fetch(`/api/communication/channels/${notif.channelId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }).catch(() => {});

        setNotifications((prev) =>
          prev.map((n) => (n.channelId === notif.channelId ? { ...n, isUnread: false } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        window.dispatchEvent(
          new CustomEvent('communication_read', {
            detail: { channelId: notif.channelId },
          })
        );
      }
    } catch (_) {}

    router.push(`/communication/${notif.channelId}`);
  };

  // Filter notifications according to active tab
  const displayedNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return notif.isUnread;
    if (activeTab === 'mentions') return notif.isMention;
    return true; // 'all'
  });

  // Popover position styling
  let popoverPositionClass = '';
  if (placement === 'sidebar') {
    popoverPositionClass = 'fixed left-20 bottom-6 sm:bottom-10 z-[99999] w-[360px] sm:w-[400px]';
  } else if (dropdownAlign === 'left') {
    popoverPositionClass = 'absolute left-0 top-full mt-2.5 z-50 w-[350px] sm:w-[390px] max-w-[calc(100vw-24px)]';
  } else {
    popoverPositionClass = 'absolute right-0 top-full mt-2.5 z-50 w-[350px] sm:w-[390px] max-w-[calc(100vw-24px)]';
  }

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Bell Trigger Button */}
      {placement === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Notifications"
          className="group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
              isOpen
                ? 'bg-[var(--brand)]/15 text-[var(--brand)] shadow-inner font-semibold'
                : 'text-gray-400 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-[var(--brand,#1C7F9F)] to-[var(--brand-secondary,#2BB8A6)] text-white text-[10px] font-bold flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in-75">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="absolute left-16 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 whitespace-nowrap shadow-xl z-50">
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Notifications"
          className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer ${
            isOpen
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs ring-2 ring-blue-500/10'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-slate-200/60 bg-white shadow-2xs'
          }`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand,#1C7F9F)] to-[var(--brand-secondary,#2BB8A6)] text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-in zoom-in-75">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`${popoverPositionClass} bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150 flex flex-col`}
          style={{ maxHeight: 'calc(100vh - 100px)' }}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <Bell size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[var(--brand,#1C7F9F)] to-[var(--brand-secondary,#2BB8A6)] text-white text-[10px] font-bold shadow-2xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 flex items-center gap-1.5 bg-white">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'mentions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              Mentions {mentionsCount > 0 ? `(${mentionsCount})` : ''}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
                  <CheckCircle2 size={22} />
                </div>
                <p className="text-sm font-bold text-slate-800">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                  {activeTab === 'unread'
                    ? 'No unread notifications across your group conversations.'
                    : activeTab === 'mentions'
                    ? 'No mentions found in any of your groups.'
                    : 'No notifications found.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const avatarColor = getAvatarColor(notif.senderName);
                const initials = getInitials(notif.senderName);

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                      notif.isUnread ? 'bg-blue-50/35 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    {/* User Avatar with Badge */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white text-white ${
                          notif.isMention ? 'bg-purple-600' : 'bg-blue-600'
                        }`}
                      >
                        {notif.isMention ? <AtSign size={9} /> : <MessageSquare size={9} />}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      {/* Top Row: Sender + in + Channel + Time */}
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {notif.senderName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">in</span>
                          <span className="text-[11px] font-semibold text-blue-600 truncate">
                            #{notif.channelName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-0.5">
                          <Clock size={10} />
                          {notif.timeAgo}
                        </span>
                      </div>

                      {/* Mention Tag */}
                      {notif.isMention && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 mb-1">
                          <AtSign size={10} />
                          <span>Mentioned you</span>
                        </div>
                      )}

                      {/* Message Preview Text */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.messageText}
                      </p>

                      {/* Channel metadata pills */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {notif.department && (
                          <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.2 bg-slate-100 rounded-md">
                            {notif.department}
                          </span>
                        )}
                        {notif.isUnread && (
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            New message
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot indicator */}
                    {notif.isUnread && (
                      <div className="shrink-0 mt-1.5">
                        <span className="block w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1">
              <Hash size={12} />
              Communication Center
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/communication');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
