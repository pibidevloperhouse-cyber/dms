"use client";

import MobileNavigation from "@/components/MobileNavigation";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ANALYTICS_NAV_ITEMS = [
    { name: 'Group insights', href: '/analytics/group-insights' },
    { name: 'Folder activity', href: '/analytics/folder-activity' },
    { name: 'File activity', href: '/analytics/file-activity' },
    { name: 'Group & Users', href: '/analytics/group-users' },
];

export default function AnalyticsSidebar({ isOpen = true }) {
    const pathname = usePathname();

    return (
        <MobileNavigation label="Analytics menu">
          <aside className={`${isOpen ? 'w-64 border-r border-gray-200' : 'w-0 border-r-0'} transition-all duration-300 bg-white flex flex-col h-screen sticky top-0 shrink-0 font-sans overflow-hidden`}>
            <div className="flex-1 overflow-y-auto">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">Analytics</h2>
                </div>

                <nav className="py-2">
                    {ANALYTICS_NAV_ITEMS.map((item) => {
                        const active = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center justify-between px-6 py-3 transition-all ${active
                                    ? 'bg-[var(--brand-50)] border-r-2 border-[var(--brand)] text-[var(--brand)] font-bold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-[14px] font-sans truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
          </aside>
        </MobileNavigation>
    );
}
