"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DocumentsSidebar({ isOpen = true }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'files';

    const [counts, setCounts] = useState({
        totalCount: 0,
        bookmarksCount: 0,
        recentCount: 0,
        downloadsCount: 0,
        trashCount: 0
    });

    useEffect(() => {
        const handleUpdate = (e) => {
            if (e.detail) {
                setCounts(e.detail);
            }
        };
        window.addEventListener('vdr-state-update', handleUpdate);
        
        // Dispatch request for initial counts
        window.dispatchEvent(new CustomEvent('vdr-state-request'));

        return () => {
            window.removeEventListener('vdr-state-update', handleUpdate);
        };
    }, []);

    const navItems = [
        {
            name: 'Files',
            href: '/documents?view=files',
            icon: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>,
            badge: counts.totalCount,
            isActive: currentView === 'files'
        },
        {
            name: 'Buyer Disclosure',
            href: '/documents/buyer-disclosure',
            icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4"/></>,
            isActive: pathname.startsWith('/documents/buyer-disclosure')
        },
        {
            name: 'New Document',
            href: '/documents?view=upload',
            icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 3v5h5M12 18v-6M9 15h6" /></>,
            isActive: currentView === 'upload'
        },
        {
            name: 'Recent',
            href: '/documents?view=recent',
            icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
            badge: counts.recentCount,
            isActive: currentView === 'recent'
        },
        {
            name: 'Downloads',
            href: '/documents?view=downloads',
            icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
            badge: counts.downloadsCount,
            isActive: currentView === 'downloads'
        },
        {
            name: 'Bookmarks',
            href: '/documents?view=bookmarks',
            icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>,
            badge: counts.bookmarksCount,
            isActive: currentView === 'bookmarks'
        },
        {
            name: 'Trash',
            href: '/documents?view=trash',
            icon: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
            badge: counts.trashCount,
            isActive: currentView === 'trash'
        },
    ];

    return (
        <aside className={`${isOpen ? 'w-64 border-r' : 'w-0 border-r-0'} transition-all duration-300 overflow-hidden bg-white border-gray-200 shrink-0 h-full hidden md:flex flex-col justify-between`}>
            <div className="w-64 flex-1 flex flex-col h-full overflow-y-auto">
                <div className="p-5">
                    <h2 className="text-[15px] font-bold text-gray-800 tracking-tight uppercase">Documents</h2>
                </div>

                <nav className="flex flex-col py-1">
                    {navItems.map((item) => {
                        const active = item.isActive;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center justify-between px-6 py-2.5 text-[14px] font-bold transition-colors ${active
                                        ? 'text-[var(--brand)] bg-[var(--brand-50)] border-r-2 border-[var(--brand)]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-[var(--brand)]' : 'text-gray-400'}>
                                        {item.icon}
                                    </svg>
                                    <span>{item.name}</span>
                                </div>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-[var(--brand-100)] text-[var(--brand)]' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Storage Indicator Panel */}
            <div className="p-5 border-t border-gray-100 w-64 bg-gray-50/30 select-none">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shadow-sm border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.74-3.5-3.5-3.5a5.5 5.5 0 0 0-5.38 4.25A4 4 0 0 0 2.5 14 4 4 0 0 0 6.5 18h11" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-[12px] font-bold text-gray-700">Storage</span>
                        <p className="text-[10px] font-semibold text-gray-400 mt-0.25">Standard Enterprise Plan</p>
                    </div>
                </div>

                {/* Progress gauge */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner my-2">
                    <div className="bg-[var(--brand)] h-full rounded-full w-[82%]"></div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                    <span>8.2 GB of 10.0 GB</span>
                    <span className="text-slate-600 hover:text-[var(--brand)] cursor-pointer hover:underline">Manage</span>
                </div>
            </div>
        </aside>
    );
}
