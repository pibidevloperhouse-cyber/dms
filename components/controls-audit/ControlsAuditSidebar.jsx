"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  Milestone,
  ScrollText,
  AlertTriangle,
  BarChart3,
  Settings,
} from "lucide-react";

export const CONTROLS_AUDIT_SIDEBAR_ITEMS = [
  {
    key: "overview",
    name: "Overview",
    href: "/control-audits",
    exact: true,
    icon: LayoutDashboard,
  },
  {
    key: "permissions",
    name: "Permissions",
    href: "/control-audits/permissions",
    icon: KeyRound,
  },
  {
    key: "stage-control",
    name: "Stage Control",
    href: "/control-audits/stage-control",
    icon: Milestone,
    badge: "Gate 3",
    badgeType: "brand",
  },
  {
    key: "audit-trail",
    name: "Audit Trail",
    href: "/control-audits/audit-trail",
    icon: ScrollText,
  },
  {
    key: "risks-alerts",
    name: "Risks & Alerts",
    href: "/control-audits/risks-alerts",
    icon: AlertTriangle,
    badge: 3,
    badgeType: "rose",
  },
  {
    key: "reports",
    name: "Reports",
    href: "/control-audits/reports",
    icon: BarChart3,
  },

];

export default function ControlsAuditSidebar({ isOpen = true }) {
  const pathname = usePathname();

  const isItemActive = (item) => {
    if (item.exact) {
      return pathname === item.href || pathname === `${item.href}/`;
    }
    return pathname?.startsWith(item.href);
  };

  const getBadgeStyle = (type, active) => {
    if (type === "rose") {
      return active
        ? "bg-rose-100 text-rose-700 font-bold"
        : "bg-rose-50 text-rose-600 border border-rose-200/60";
    }
    if (type === "brand") {
      return active
        ? "bg-[var(--brand)] text-white font-bold"
        : "bg-[var(--brand-100)] text-[var(--brand)] border border-[var(--brand)]/20";
    }
    return active
      ? "bg-slate-200 text-slate-800 font-bold"
      : "bg-gray-100 text-gray-500";
  };

  return (
    <aside
      className={`${isOpen ? "w-64 border-r" : "w-0 border-r-0"
        } transition-all duration-300 overflow-hidden bg-white border-gray-200 shrink-0 h-full flex flex-col justify-between font-sans select-none z-20`}
    >
      <div className="w-64 flex-1 flex flex-col h-full overflow-y-auto">
        {/* Module Sidebar Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-bold font-sans text-gray-800 tracking-tight uppercase">
            Controls & Audit
          </h2>
        </div>

        {/* Navigation Items */}
        <nav className="py-2 flex flex-col">
          {CONTROLS_AUDIT_SIDEBAR_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`group flex items-center justify-between px-6 py-2.5 text-[14px] transition-all ${active
                  ? "bg-[var(--brand-50)] border-r-2 border-[var(--brand)] text-[var(--brand)] font-bold"
                  : "text-gray-600 hover:bg-gray-50 font-medium"
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${active
                      ? "text-[var(--brand)]"
                      : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${getBadgeStyle(
                      item.badgeType,
                      active
                    )}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Compliance / Status footer panel (matching DocumentsSidebar storage panel style) */}
      <div className="p-4 border-t border-gray-100 w-64 bg-slate-50/50 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-800 block truncate">
              Ledger Active
            </span>
            <p className="text-[10px] text-slate-400 truncate">
              WORM Immutable Standard
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
