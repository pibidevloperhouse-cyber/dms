"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useControlsAudit } from "@/components/controls-audit/ControlsAuditContext";
import {
  LayoutDashboard,
  KeyRound,
  Milestone,
  CheckSquare,
  ScrollText,
  AlertTriangle,
  BarChart3,
  Settings,
} from "lucide-react";

export const CONTROLS_AUDIT_NAV_ITEMS = [
  {
    key: "overview",
    label: "Overview",
    href: "/control-audits",
    exact: true,
    icon: LayoutDashboard,
  },
  {
    key: "permissions",
    label: "Permissions",
    href: "/control-audits/permissions",
    icon: KeyRound,
  },
  {
    key: "stage-control",
    label: "Stage Control",
    href: "/control-audits/stage-control",
    icon: Milestone,
    badge: "Gate 3",
    badgeType: "brand",
  },
  {
    key: "audit-trail",
    label: "Audit Trail",
    href: "/control-audits/audit-trail",
    icon: ScrollText,
  },
  {
    key: "risks-alerts",
    label: "Risks & Alerts",
    href: "/control-audits/risks-alerts",
    icon: AlertTriangle,
    badge: 3,
    badgeType: "rose",
  },
  {
    key: "reports",
    label: "Reports",
    href: "/control-audits/reports",
    icon: BarChart3,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/control-audits/settings",
    icon: Settings,
  },
];

export default function ControlsAuditNav() {
  const pathname = usePathname();
  let currentStageOrder = 2;
  try {
    const controlsContext = useControlsAudit();
    if (controlsContext?.currentStage?.order) {
      currentStageOrder = controlsContext.currentStage.order;
    }
  } catch (e) {}

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
    if (type === "amber") {
      return active
        ? "bg-amber-100 text-amber-800 font-bold"
        : "bg-amber-50 text-amber-700 border border-amber-200/60";
    }
    if (type === "brand") {
      return active
        ? "bg-[var(--brand)] text-white font-bold"
        : "bg-blue-50 text-[var(--brand)] border border-blue-200/60";
    }
    return active
      ? "bg-slate-200 text-slate-800 font-bold"
      : "bg-slate-100 text-slate-600";
  };

  return (
    <nav className="bg-white border-b border-slate-200/80 px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto min-w-0 font-sans shadow-2xs shrink-0 select-none scrollbar-none">
      {CONTROLS_AUDIT_NAV_ITEMS.map((item) => {
        const active = isItemActive(item);
        const Icon = item.icon;
        const displayBadge = item.key === "stage-control" ? `Gate ${currentStageOrder}` : item.badge;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`group relative flex items-center gap-2 pt-3 pb-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 rounded-t-lg shrink-0 ${
              active
                ? "text-[var(--brand)] font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Icon
              size={15}
              className={`transition-colors shrink-0 ${
                active
                  ? "text-[var(--brand)]"
                  : "text-slate-400 group-hover:text-slate-700"
              }`}
            />

            <span>{item.label}</span>

            {displayBadge !== undefined && (
              <span
                className={`px-1.5 py-0.5 min-w-[18px] text-center rounded-full text-[10px] font-semibold leading-none ${getBadgeStyle(
                  item.badgeType,
                  active
                )}`}
              >
                {displayBadge}
              </span>
            )}

            {/* Active underline indicator matching app/settings/nda/page.jsx pattern */}
            {active && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[var(--brand)] rounded-t-full shadow-xs" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
