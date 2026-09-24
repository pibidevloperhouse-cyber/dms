"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTasks } from './TasksContext';

export default function TasksNav() {
  const pathname = usePathname();
  const { viewMode, isBuyerUser } = useTasks();

  const isBuyer = isBuyerUser || viewMode === 'Buyer';

  const tabs = isBuyer 
    ? [ { id: 'board', label: 'My Tasks', path: '/tasks/board' } ]
    : [
        { id: 'board', label: 'Task Board', path: '/tasks/board' },
        { id: 'control-center', label: 'Control Center', path: '/tasks/control-center' }
      ];

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-[var(--brand-100,theme(colors.blue.100))] px-8 lg:px-10 shrink-0">
      <div className="flex space-x-2 mt-2 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map(tab => {
          const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--brand,theme(colors.blue.600))] to-[var(--brand-secondary,theme(colors.teal.500))] text-white shadow-md shadow-[var(--brand-200,theme(colors.blue.200))] border-transparent scale-[1.02]'
                  : 'bg-transparent text-slate-500 hover:text-[var(--brand-dark,theme(colors.slate.800))] hover:bg-[var(--brand-50,theme(colors.slate.100))]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
