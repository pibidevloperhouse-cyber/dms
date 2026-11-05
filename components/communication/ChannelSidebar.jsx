"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hash, Lock, Search, Users, RefreshCw, User, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import NotificationBell from '@/components/communication/NotificationBell';

export default function ChannelSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState([]);
  const [activeDeal, setActiveDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChannels = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      const rawSession = localStorage.getItem('vdr_session');
      if (!rawSession) {
        setLoading(false);
        return;
      }
      const session = JSON.parse(rawSession);
      const userId = session?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const activeWorkspaceId =
        session?.active_workspace_id ||
        session?.active_deal_id ||
        localStorage.getItem('active_deal_id') ||
        localStorage.getItem('active_workspace_id') ||
        '';

      const url = `/api/communication/channels?userId=${encodeURIComponent(userId)}${
        activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''
      }`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setChannels(data.channels || []);
        if (data.activeDeal) {
          setActiveDeal(data.activeDeal);
        } else if (session?.active_deal_name || localStorage.getItem('active_deal_name')) {
          setActiveDeal({
            id: activeWorkspaceId,
            name: session?.active_deal_name || localStorage.getItem('active_deal_name'),
          });
        }
        setError(null);
      } else {
        setError(data.error || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (isMounted) {
        await fetchChannels();
      }
    };
    run();

    const handleReadEvent = (e) => {
      const readChannelId = e?.detail?.channelId;
      if (readChannelId) {
        setChannels((prev) =>
          prev.map((c) => (c.id === readChannelId ? { ...c, unreadCount: 0, unreadMentionsCount: 0 } : c))
        );
      }
    };

    const handleUnreadUpdated = (e) => {
      if (Array.isArray(e?.detail?.channels) && e.detail.channels.length > 0) {
        setChannels(e.detail.channels);
        setLoading(false);
      }
    };

    window.addEventListener('communication_read', handleReadEvent);
    window.addEventListener('communication_unread_updated', handleUnreadUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('communication_read', handleReadEvent);
      window.removeEventListener('communication_unread_updated', handleUnreadUpdated);
    };
  }, [fetchChannels]);

  const filteredChannels = channels.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const directChannels = filteredChannels.filter((c) => c.type === 'direct_message' || c.isDirectMessage);
  const groupChannels = filteredChannels.filter((c) => c.type !== 'direct_message' && !c.isDirectMessage);

  return (
    <div className="w-[300px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Communication</h2>
          <p className="text-xs text-slate-400 font-medium">
            {activeDeal?.name ? `Deal: ${activeDeal.name}` : 'Conversations'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell placement="dropdown" dropdownAlign="left" />
          <button
            onClick={fetchChannels}
            title="Refresh conversations"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Active Deal Banner */}
      {activeDeal?.name && (
        <div className="mx-3.5 mt-2.5 mb-1 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/70 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <div className="min-w-0 truncate">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 leading-none mb-0.5">Active Deal</p>
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {activeDeal.name}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200/80 shadow-2xs shrink-0">
            Active
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="channels" className="w-full flex-1 flex flex-col">
        <div className="px-3.5 pt-3">
          <TabsList className="w-full grid grid-cols-2 bg-slate-100/80 p-1 rounded-xl h-9">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
        </div>

        <div className="px-3.5 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 h-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs font-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <TabsContent value="channels" className="mt-0 space-y-2">
            {loading && channels.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Loading conversations...
              </div>
            ) : error ? (
              <div className="py-6 px-3 text-center text-xs text-rose-500 font-medium">
                {error}
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Users size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-600">No Conversations Found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You are not currently assigned to any conversations in this deal.
                </p>
              </div>
            ) : (
              <>
                {/* 1:1 Direct Messages Section */}
                {directChannels.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Direct Message (1:1)</span>
                      <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                        1:1
                      </span>
                    </div>
                    {directChannels.map((channel) => {
                      const isActive = pathname === `/communication/${channel.id}`;
                      return (
                        <Link
                          key={channel.id}
                          href={`/communication/${channel.id}`}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200/70 shadow-2xs font-medium'
                              : 'hover:bg-slate-50/90 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                  : 'bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100'
                              }`}
                            >
                              <User size={15} />
                            </div>
                            <div className="truncate min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-sm font-semibold truncate ${
                                    isActive ? 'text-indigo-950 font-bold' : 'text-slate-800'
                                  }`}
                                >
                                  {channel.name}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {channel.latestMessage?.messageText || '1:1 Direct Conversation'}
                              </p>
                            </div>
                          </div>
                          {!isActive && (channel.unreadCount || 0) > 0 ? (
                            <span
                              title={`${channel.unreadCount} unread message${channel.unreadCount > 1 ? 's' : ''}`}
                              className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs ml-2 shrink-0 animate-in zoom-in-75"
                            >
                              {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50/80 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0 ml-2">
                              Direct
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Groups Section */}
                {groupChannels.length > 0 && (
                  <div className="space-y-1">
                    {directChannels.length > 0 && (
                      <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>{activeDeal ? 'Deal Groups' : 'Group Conversations'}</span>
                        <span className="text-[9px] text-slate-400">{groupChannels.length}</span>
                      </div>
                    )}
                    {groupChannels.map((channel) => {
                      const isActive = pathname === `/communication/${channel.id}`;
                      return (
                        <Link
                          key={channel.id}
                          href={`/communication/${channel.id}`}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isActive
                              ? 'bg-blue-50/90 text-blue-900 border border-blue-200/70 shadow-2xs font-medium'
                              : 'hover:bg-slate-50/90 text-slate-700 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden min-w-0">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                                isActive
                                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                                  : 'bg-slate-100 text-slate-500 font-semibold'
                              }`}
                            >
                              {channel.type === 'private' ? (
                                <Lock size={15} />
                              ) : (
                                <Hash size={15} />
                              )}
                            </div>
                            <div className="truncate min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-sm font-semibold truncate ${
                                    isActive ? 'text-blue-900 font-bold' : 'text-slate-800'
                                  }`}
                                >
                                  {channel.name}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {channel.latestMessage?.messageText ||
                                  `${channel.memberCount} member${channel.memberCount !== 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                          {!isActive && (channel.unreadCount || 0) > 0 ? (
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {(channel.unreadMentionsCount || 0) > 0 && (
                                <span
                                  title={`${channel.unreadMentionsCount} mention${channel.unreadMentionsCount > 1 ? 's' : ''}`}
                                  className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200/80 animate-pulse"
                                >
                                  @{channel.unreadMentionsCount}
                                </span>
                              )}
                              <span
                                title={`${channel.unreadCount} unread message${channel.unreadCount > 1 ? 's' : ''}`}
                                className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs animate-in zoom-in-75"
                              >
                                {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                              </span>
                            </div>
                          ) : (
                            channel.memberCount > 0 && (
                              <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 shrink-0 ml-2">
                                {channel.memberCount}
                              </span>
                            )
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-0 p-3">
            <div className="text-xs text-slate-500 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              <p className="font-semibold text-slate-700">Deal-Scoped Communication</p>
              <p>
                In an active deal, communication is private and restricted strictly to authorized deal members:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong className="text-slate-700">1:1 Direct Message:</strong> Private conversation between Buyer and Seller.</li>
                <li><strong className="text-slate-700">Deal Groups:</strong> Collaborative channels where buyer-side groups and the seller can communicate together.</li>
              </ul>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
