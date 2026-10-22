"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MessageSquare } from 'lucide-react';

export default function CommunicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasNoChannels, setHasNoChannels] = useState(false);

  useEffect(() => {
    const resolveInitialChannel = async () => {
      try {
        const rawSession = localStorage.getItem('vdr_session');
        if (!rawSession) {
          router.push('/login');
          return;
        }

        const session = JSON.parse(rawSession);
        const userId = session?.id;
        if (!userId) {
          router.push('/login');
          return;
        }

        const activeWorkspaceId = session?.active_workspace_id || '';
        const url = `/api/communication/channels?userId=${encodeURIComponent(userId)}${
          activeWorkspaceId ? `&workspaceId=${encodeURIComponent(activeWorkspaceId)}` : ''
        }`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.channels && data.channels.length > 0) {
          router.replace(`/communication/${data.channels[0].id}`);
          return;
        }

        setHasNoChannels(true);
      } catch (err) {
        console.error('Failed to resolve initial channel:', err);
        setHasNoChannels(true);
      } finally {
        setLoading(false);
      }
    };

    resolveInitialChannel();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] font-sans bg-[#F8F9FB]">
        <div className="w-9 h-9 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
          Loading group conversations...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] p-8 font-sans text-center bg-[#F8F9FB]">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-xs">
        <Users size={30} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No Group Conversations Found</h2>
      <p className="text-slate-500 text-sm max-w-md leading-relaxed">
        You are not currently a member of any active groups. Once an administrator adds you to a group
        in the Groups module, your group conversation will automatically appear here.
      </p>
    </div>
  );
}
