"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import MainSidebar from '@/components/MainSidebar';
import { hasPermission } from '@/lib/access/permissions';

function LayoutContent({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [session, setSession] = useState(null);
    const [hasDeleteAccess, setHasDeleteAccess] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('vdr_session');
        if (raw) {
            const s = JSON.parse(raw);
            setSession(s);
            checkDeleteAccess(s);
        }
    }, []);

    // 🔥 SECURITY CHECK: Hitting the Backend instead of Supabase directly
    const checkDeleteAccess = async (userSession) => {
        if (userSession.role === 'super_admin') {
            setHasDeleteAccess(true);
            return;
        }
        try {
            const res = await fetch('/api/user/nav-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session: userSession })
            });
            const data = await res.json();
            if (data.hasDeleteAccess) setHasDeleteAccess(true);
        } catch (err) {
            console.error("Trash access check failed", err);
        }
    };

    const isSuperAdmin = session?.role === 'super_admin';
    const hasAccessControlAccess = session ? hasPermission(session.role, 'manage_access') : false;
    const currentView = searchParams.get('view');

    const isActive = (href) => {
        if (href === '/documents/access') return pathname === '/documents/access';
        if (href === '/documents/versions') return pathname === '/documents/versions';
        if (href.includes('?view=')) return pathname === '/documents' && currentView === href.split('view=')[1];
        if (href === '/documents') return pathname === '/documents' && (!currentView || currentView === 'files');
        return pathname === href;
    };

    const navItems = [
        {
            href: '/documents', label: 'Files',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
        },
        {
            href: '/documents?view=buyers_side', label: 'Buyers Side Documents',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4"/></svg>
        },
        ...(hasAccessControlAccess ? [{
            href: '/documents/access', label: 'Access Control',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        }] : []),
        {
            href: '/documents/versions', label: 'Document Versions',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        },

        {
            href: '/documents?view=downloads', label: 'My Downloads',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        },
        {
            href: '/documents?view=bookmarks', label: 'Bookmarks',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        },
        // 🔥 TRASH TAB DYNAMICALLY INJECTED HERE
        ...(hasDeleteAccess ? [{
            href: '/documents?view=trash', label: 'Trash',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
        }] : [])
    ];

    return (
        <div className="flex w-full h-screen overflow-hidden bg-[#F8F9FB] font-sans">
            <MainSidebar />
            <nav className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">

                <div className="px-6 py-6 border-b border-slate-100 flex items-center hover:opacity-80 transition-opacity">
                    <span className="text-[15px] font-black text-brand tracking-tight">VDR Vault</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navItems.map(item => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.label} href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all 
                                ${active ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-brand-soft hover:text-brand'}`}>
                                <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Removed session block as requested */}
            </nav>
            <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative">
                {children}
            </main>
        </div>
    );
}

export default function DocumentsLayout({ children }) {
    return (
        <Suspense fallback={<div className="flex items-center justify-center w-full h-screen bg-[#FAFBFD]"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" /></div>}>
            <LayoutContent>{children}</LayoutContent>
        </Suspense>
    );
}




//static doc page no permission based
// "use client";


// import React, { useEffect, useState, Suspense } from 'react';
// import Link from 'next/link';
// import { usePathname, useSearchParams } from 'next/navigation';
// import MainSidebar from '@/components/MainSidebar';

// function LayoutContent({ children }) {
//     const pathname = usePathname();
//     const searchParams = useSearchParams();
//     const [session, setSession] = useState(null);

//     useEffect(() => {
//         const raw = localStorage.getItem('vdr_session');
//         if (raw) setSession(JSON.parse(raw));
//     }, []);

//     const isAdmin = session?.role === 'admin' || session?.role === 'super_admin';
//     const currentView = searchParams.get('view');

//     const isActive = (href) => {
//         if (href === '/documents/access') return pathname === '/documents/access';
//         if (href === '/settings') return pathname.startsWith('/settings');
//         if (href.includes('?view=')) {
//             const view = href.split('view=')[1];
//             return pathname === '/documents' && currentView === view;
//         }
//         return pathname === '/documents' && (!currentView || currentView === 'files');
//     };

//     const navItems = [
//         {
//             href: '/documents',
//             label: 'Files',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
//                 </svg>
//             ),
//         },
//         ...(isAdmin ? [{
//             href: '/documents/access',
//             label: 'Access',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
//                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//                 </svg>
//             ),
//         }] : []),
//         ...(!isAdmin ? [{
//             href: '/documents?view=downloads',
//             label: 'Downloads',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                     <polyline points="7 10 12 15 17 10" />
//                     <line x1="12" y1="15" x2="12" y2="3" />
//                 </svg>
//             ),
//         }] : []),
//         {
//             href: '/documents?view=bookmarks',
//             label: 'Bookmarks',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                 </svg>
//             ),
//         },
//         {
//             href: '/documents?view=trash',
//             label: 'Trash',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <polyline points="3 6 5 6 21 6" />
//                     <path d="M19 6l-1 14H6L5 6" />
//                     <path d="M10 11v6M14 11v6" />
//                     <path d="M9 6V4h6v2" />
//                 </svg>
//             ),
//         }
//     ];

//     return (
//         <div className="flex w-full h-screen overflow-hidden bg-[#F8F9FB]">
//             <MainSidebar />
//             {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
//             <nav className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">

//                 {/* Logo — clicking goes to /dashboard */}
//                 <Link href="/dashboard" className="px-5 pt-6 pb-5 border-b border-slate-100 flex items-center hover:opacity-80 transition-opacity">
//                     <span className="text-[14px] font-black text-brand tracking-tight">VDR Portal</span>
//                 </Link>

//                 {/* Nav items */}
//                 <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
//                     {navItems.map(item => {
//                         const active = isActive(item.href);
//                         return (
//                             <Link
//                                 key={item.label}
//                                 href={item.href}
//                                 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all
//                                     ${active
//                                         ? 'bg-brand text-white'
//                                         : 'text-slate-600 hover:bg-brand-soft hover:text-brand'
//                                     }`}
//                             >
//                                 <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}>
//                                     {item.icon}
//                                 </span>
//                                 {item.label}
//                             </Link>
//                         );
//                     })}
//                 </div>

//                 {/* User footer + Logout */}
//                 {session && (
//                     <div className="p-4 border-t border-slate-100">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2.5 min-w-0">
//                                 <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center text-[11px] font-black text-white shrink-0">
//                                     {session.name?.charAt(0).toUpperCase() || 'U'}
//                                 </div>
//                                 <div className="min-w-0">
//                                     <p className="text-[12px] font-bold text-slate-800 truncate">{session.name}</p>
//                                     <p className="text-[10px] text-slate-400 truncate capitalize">{session.role || 'user'}</p>
//                                 </div>
//                             </div>

//                             {/* 🔥 QUICK LOGOUT BUTTON */}
//                             <button
//                                 onClick={() => {
//                                     localStorage.removeItem('vdr_session');
//                                     window.location.href = '/login';
//                                 }}
//                                 className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
//                                 title="Log Out"
//                             >
//                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                                     <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
//                                     <polyline points="16 17 21 12 16 7"></polyline>
//                                     <line x1="21" y1="12" x2="9" y2="12"></line>
//                                 </svg>
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </nav>

//             {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
//             <main className="flex-1 min-w-0 h-full overflow-hidden">
//                 {children}
//             </main>
//         </div>
//     );
// }

// export default function DocumentsLayout({ children }) {
//     return (
//         <Suspense fallback={
//             <div className="flex items-center justify-center w-full h-screen bg-[#FAFBFD]">
//                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//             </div>
//         }>
//             <LayoutContent>{children}</LayoutContent>
//         </Suspense>
//     );
// }



// "use client";

// // /app/documents/layout.jsx
// // - VDR logo links to /dashboard (home)
// // - Nav: Files, Access (admin only), Downloads, Bookmarks, Trash
// // - NO "New Document", NO "Recent"
// // - Single sidebar only — page.jsx handles the inner folder panel

// import React, { useEffect, useState, Suspense } from 'react';
// import Link from 'next/link';
// import { usePathname, useSearchParams } from 'next/navigation';

// function LayoutContent({ children }) {
//     const pathname = usePathname();
//     const searchParams = useSearchParams();
//     const [session, setSession] = useState(null);

//     useEffect(() => {
//         const raw = localStorage.getItem('vdr_session');
//         if (raw) setSession(JSON.parse(raw));
//     }, []);

//     const isAdmin = session?.role === 'admin';
//     const currentView = searchParams.get('view');

//     const isActive = (href) => {
//         if (href === '/documents/access') return pathname === '/documents/access';
//         if (href.includes('?view=')) {
//             const view = href.split('view=')[1];
//             return pathname === '/documents' && currentView === view;
//         }
//         return pathname === '/documents' && (!currentView || currentView === 'files');
//     };

//     const navItems = [
//         {
//             href: '/documents',
//             label: 'Files',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
//                 </svg>
//             ),
//         },
//         ...(isAdmin ? [{
//             href: '/documents/access',
//             label: 'Access',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
//                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//                 </svg>
//             ),
//         }] : []),
//         {
//             href: '/documents?view=downloads',
//             label: 'Downloads',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                     <polyline points="7 10 12 15 17 10" />
//                     <line x1="12" y1="15" x2="12" y2="3" />
//                 </svg>
//             ),
//         },
//         {
//             href: '/documents?view=bookmarks',
//             label: 'Bookmarks',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
//                 </svg>
//             ),
//         },
//         {
//             href: '/documents?view=trash',
//             label: 'Trash',
//             icon: (
//                 <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <polyline points="3 6 5 6 21 6" />
//                     <path d="M19 6l-1 14H6L5 6" />
//                     <path d="M10 11v6M14 11v6" />
//                     <path d="M9 6V4h6v2" />
//                 </svg>
//             ),
//         },
//     ];

//     return (
//         <div className="flex w-full h-screen overflow-hidden bg-[#F8F9FB]">

//             {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
//             <nav className="w-[220px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">

//                 {/* Logo — clicking goes to /dashboard */}
//                 <Link href="/dashboard" className="px-5 pt-6 pb-5 border-b border-slate-100 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
//                     <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
//                             <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
//                             <path d="M7 11V7a5 5 0 0 1 10 0v4" />
//                         </svg>
//                     </div>
//                     <span className="text-[14px] font-black text-brand tracking-tight">VDR Portal</span>
//                 </Link>

//                 {/* Nav items */}
//                 <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
//                     {navItems.map(item => {
//                         const active = isActive(item.href);
//                         return (
//                             <Link
//                                 key={item.label}
//                                 href={item.href}
//                                 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all
//                                     ${active
//                                         ? 'bg-brand text-white'
//                                         : 'text-slate-600 hover:bg-brand-soft hover:text-brand'
//                                     }`}
//                             >
//                                 <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}>
//                                     {item.icon}
//                                 </span>
//                                 {item.label}
//                             </Link>
//                         );
//                     })}
//                 </div>

//                 {/* User footer */}
//                 {session && (
//                     <div className="p-4 border-t border-slate-100">
//                         <div className="flex items-center gap-2.5">
//                             <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center text-[11px] font-black text-white shrink-0">
//                                 {session.name?.charAt(0).toUpperCase() || 'U'}
//                             </div>
//                             <div className="min-w-0">
//                                 <p className="text-[12px] font-bold text-slate-800 truncate">{session.name}</p>
//                                 <p className="text-[10px] text-slate-400 truncate capitalize">{session.role || 'user'}</p>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </nav>

//             {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
//             <main className="flex-1 min-w-0 h-full overflow-hidden">
//                 {children}
//             </main>
//         </div>
//     );
// }

// export default function DocumentsLayout({ children }) {
//     return (
//         <Suspense fallback={
//             <div className="flex items-center justify-center w-full h-screen bg-[#FAFBFD]">
//                 <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
//             </div>
//         }>
//             <LayoutContent>{children}</LayoutContent>
//         </Suspense>
//     );
// }