"use client";

import React from 'react';
import { Users, FileText, Info, Pin, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ContextPanel({ channel, group, members = [] }) {
  const channelName = group?.name || channel?.name || 'Group Conversation';
  const department = group?.department || channel?.department || 'General';
  const description = group?.description || channel?.description || 'Collaborative group conversation';

  return (
    <div className="w-[320px] flex-shrink-0 border-l border-slate-200 bg-white h-full flex flex-col hidden lg:flex font-sans">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Group Details</h3>
          <p className="text-[11px] text-slate-400 font-medium">{department}</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
          {members.length}
        </div>
      </div>

      <Tabs defaultValue="members" className="flex-1 flex flex-col">
        <div className="px-4 pt-3 border-b border-slate-100">
          <TabsList className="w-full grid grid-cols-2 bg-transparent">
            <TabsTrigger
              value="members"
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none text-xs font-semibold"
            >
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="data-[state=active]:bg-slate-100 data-[state=active]:shadow-none text-xs font-semibold"
            >
              About
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="members" className="p-4 mt-0 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Verified Group Members
            </p>
            {members.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No members assigned to this group yet.</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {(member.name || member.email || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {member.name || 'Member'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  {member.role && (
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      {member.role}
                    </span>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="about" className="p-4 space-y-5 mt-0">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Info size={14} className="text-blue-500" /> Description
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <ShieldCheck size={14} className="text-emerald-500" /> Access & Security
              </h4>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-semibold">Authoritative Group Membership</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Only users explicitly registered in the Groups module for {channelName} have access
                  to this conversation.
                </p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
