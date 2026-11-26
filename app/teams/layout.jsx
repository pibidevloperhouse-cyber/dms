"use client";

import MobileNavigation from "@/components/MobileNavigation";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import MainSidebar from '@/components/MainSidebar';

export default function TeamsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    const verifyAccess = async () => {
      const raw = localStorage.getItem("vdr_session");
      if (!raw) {
        router.push('/login');
        return;
      }
      const session = JSON.parse(raw);
      setSessionUser(session);

      // Removed role restriction so any role can open Teams
      // if (!authorizedRoles.includes(session.role)) {
      //   router.push('/documents');
      //   return;
      // }

      setLoading(false);
    };

    verifyAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#F8FAFC]">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-medium">Loading Teams Space…</p>
          </div>
        </div>
      </div>
    );
  }

  // The custom Teams shield-with-person icon
  const TEAMS_SHIELD_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
      <path d="M6 16.5c0-2 2.5-3 6-3s6 1 6 3" />
    </svg>
  );

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-sans relative">
      {/* Top gradient accent overlay */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[var(--brand)]/8 to-transparent pointer-events-none z-0"></div>

      {/* Main Left Sidebar */}
      <MainSidebar />

      {/* Teams Sub-Sidebar */}
      <MobileNavigation label="Teams menu">
        <div className="w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200/80 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(28,127,159,0.06)]">
        {/* Header with Teams icon and label */}
        <div className="p-6 border-b border-gray-100/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center shadow-sm">
              {TEAMS_SHIELD_ICON}
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Teams</h1>
              <p className="text-[11px] text-gray-400 font-medium">Access Management</p>
            </div>
          </div>
        </div>

        {/* Sub Navigation Options */}
        <div className="flex flex-col p-3 gap-1 mt-1">
          {/* Manage Admin */}
          <Link 
            href="/teams/manage-admin"
            className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${
              pathname === '/teams/manage-admin'
                ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Manage Admin
          </Link>

          {/* Manage Users */}
          <Link 
            href="/teams/manage-users"
            className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${
              pathname === '/teams/manage-users'
                ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Manage Users
          </Link>

          {/* Manage Groups */}
          <Link 
            href="/teams/manage-groups"
            className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${
              pathname === '/teams/manage-groups'
                ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18l-8-4-8 4z" />
            </svg>
            Manage Groups
          </Link>
        </div>
        </div>
      </MobileNavigation>

      {/* Main Page Content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
