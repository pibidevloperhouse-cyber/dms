"use client";

import MobileNavigation from "@/components/MobileNavigation";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import MainSidebar from '@/components/MainSidebar';

export default function SettingsLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState({ settings: false, branding: false, watermark: false, nda: false });

  useEffect(() => {
    const verifyAccess = async () => {
      const raw = localStorage.getItem("vdr_session");
      if (!raw) { router.push('/login'); return; }
      const session = JSON.parse(raw);

      try {
        const res = await fetch('/api/settings/layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session })
        });
        const json = await res.json();

        if (json.success) {
          const { settings, branding, watermark, nda } = json.perms;

          // If they don't even have basic settings access, kick out completely
          if (!settings) {
            router.push('/documents');
            return;
          }

          // If they try to type a blocked URL, gently push them to the blank settings page
          if (pathname.includes('/branding') && !branding) {
            router.push('/settings');
            return;
          }
          if (pathname.includes('/watermark') && !watermark) {
            router.push('/settings');
            return;
          }
          if (pathname.includes('/nda') && !nda) {
            router.push('/settings');
            return;
          }

          setPerms({ settings, branding, watermark, nda });
        } else {
          router.push('/documents');
          return;
        }
      } catch (err) {
        console.error("Error fetching permissions:", err);
        router.push('/documents');
        return;
      }

      setLoading(false);
    };

    verifyAccess();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#F8FAFC]">
        <MainSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--brand)]/20 border-t-[var(--brand)] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400 font-medium">Loading settings…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!perms.settings) return null;

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-sans relative">
      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[var(--brand)]/8 to-transparent pointer-events-none z-0"></div>

      <MainSidebar />

      {/* VERTICAL SETTINGS SIDEBAR */}
      <MobileNavigation label="Settings menu">
        <div className="w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200/80 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(28,127,159,0.06)]">
        {/* Sidebar Header with PiBi accent */}
        <div className="p-6 border-b border-gray-100/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Settings</h1>
              <p className="text-[11px] text-gray-400 font-medium">Workspace config</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-3 gap-1 mt-1">
          {perms.branding && (
            <Link href="/settings/branding"
              className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${pathname.includes('/branding')
                  ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                  : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
                }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              Branding & Identity
            </Link>
          )}

          {perms.watermark && (
            <Link href="/settings/watermark"
              className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${pathname.includes('/watermark')
                  ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                  : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
                }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
              Document Watermarks
            </Link>
          )}

          {perms.nda && (
            <Link href="/settings/nda"
              className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-3 group ${pathname.includes('/nda')
                  ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-md shadow-[0_8px_30px_rgba(var(--brand-rgb),0.14)]'
                  : 'text-gray-600 hover:bg-[var(--brand)]/8 hover:text-[var(--brand)]'
                }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              NDA
            </Link>
          )}

          {!perms.branding && !perms.watermark && !perms.nda && (
            <div className="px-4 py-6 text-center text-xs text-gray-400 font-medium border-2 border-dashed border-gray-100 rounded-xl">
              No menu options assigned
            </div>
          )}
        </div>
        </div>
      </MobileNavigation>

      {/* ACTUAL PAGE CONTENT */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {children}
      </div>
    </div>
  );
}
