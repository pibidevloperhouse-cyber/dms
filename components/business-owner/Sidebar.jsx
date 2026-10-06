"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaTimes,
  FaChartPie,
  FaBuilding,
  FaDatabase,
  FaTags,
  FaShoppingCart,
  FaEnvelopeOpenText,
  FaCog,
  FaShieldAlt,
  FaExternalLinkAlt,
  FaUserCheck,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { name: 'Overview', href: '/business-owner', icon: FaChartPie, exact: true },
  { name: 'Organizations', href: '/business-owner/organizations', icon: FaBuilding },
  { name: 'Storage', href: '/business-owner/storage', icon: FaDatabase },
  { name: 'Plans', href: '/business-owner/plans', icon: FaTags },
  { name: 'Identity Verifications', href: '/business-owner/verifications', icon: FaUserCheck },
  { name: 'Email Templates', href: '/business-owner/email-templates', icon: FaEnvelopeOpenText },
  { name: 'Settings', href: '/business-owner/settings', icon: FaCog },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const isCurrentRoute = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen shrink-0 overflow-y-auto bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-[4px_0_24px_rgba(28,127,159,0.04)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Header & Brand */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200">
            <Link href="/business-owner" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--brand)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-base shadow-sm group-hover:scale-105 transition-all">
                <FaShieldAlt />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-extrabold text-slate-900 tracking-tight leading-none">
                  PiBi <span className="text-[var(--brand)]">VDR</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400 mt-0.5">
                  Business Owner
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <FaTimes />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 text-[12px] font-bold text-slate-400">
              Admin Menu
            </div>

            {NAV_ITEMS.map((item) => {
              const active = isCurrentRoute(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose && onClose()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                    active
                      ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                      : 'text-slate-600 hover:text-[var(--brand)] hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`text-base shrink-0 ${
                      active ? 'text-[var(--brand)]' : 'text-slate-400 group-hover:text-[var(--brand)]'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <Link
            href="/documents"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[13px] font-semibold text-slate-700 transition-colors shadow-2xs group"
          >
            <span>Tenant Deal Room</span>
            <FaExternalLinkAlt className="text-xs text-slate-400 group-hover:text-[var(--brand)]" />
          </Link>

          <div className="px-3.5 py-1.5 text-xs text-slate-500 flex items-center justify-between font-medium">
            <span>System Status</span>
            <span className="font-bold text-emerald-600">Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
