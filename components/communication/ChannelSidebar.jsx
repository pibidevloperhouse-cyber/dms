"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hash, Lock, Search, Users, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

export default function ChannelSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState([]);
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

      const activeWorkspaceId = session?.active_workspace_id || '';
      const url = `/api/communication/channels?userId=${encodeURIComponent(userId)}${
        activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''
      }`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setChannels(data.channels || []);
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

    const interval = setInterval(() => {
      fetchChannels();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchChannels]);

  const filteredChannels = channels.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[300px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Communication</h2>
          <p className="text-xs text-slate-400 font-medium">Group Conversations</p>
        </div>
        <button
          onClick={fetchChannels}
          title="Refresh conversations"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="channels" className="w-full flex-1 flex flex-col">
        <div className="px-3.5 pt-3">
          <TabsList className="w-full grid grid-cols-2 bg-slate-100/80 p-1 rounded-xl h-9">
            <TabsTrigger value="channels">Group Channels</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
        </div>

        <div className="px-3.5 py-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search groups..."
              className="w-full pl-9 pr-3 h-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/15 transition-all shadow-2xs font-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <TabsContent value="channels" className="mt-0 space-y-1">
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
                <p className="text-xs font-semibold text-slate-600">No Groups Found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You are not currently assigned to any group conversations.
                </p>
              </div>
            ) : (
              filteredChannels.map((channel) => {
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
                    {channel.memberCount > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 shrink-0 ml-2">
                        {channel.memberCount}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-0 p-3">
            <div className="text-xs text-slate-500 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-700">Group-Based Chat</p>
              <p>
                Group conversations in Communication are strictly synchronized with your team
                memberships in the Groups module.
              </p>
              <p>
                Only authorized members of a group can view message history or post replies.
              </p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
