"use client";

import React from "react";
import { Check, X, Clock, AlertTriangle, Lock, Shield, Minus } from "lucide-react";

export default function StatusBadge({
  status,
  label,
  size = "md", // sm | md | lg
  showIcon = true,
  className = "",
}) {
  const normalized = (status || "").toLowerCase().replace(/[\s_-]+/g, "_");

  const config = {
    // Allowed / Completed / Success
    allowed: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Allowed",
    },
    completed: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Completed",
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Success",
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Approved",
    },
    active: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Active",
    },
    mitigated: {
      bg: "bg-emerald-50 border-emerald-200/80 text-emerald-700",
      icon: Check,
      defaultLabel: "Mitigated",
    },

    // Denied / Blocked / Failed / Rejected
    denied: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: X,
      defaultLabel: "Denied",
    },
    blocked: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: X,
      defaultLabel: "Blocked",
    },
    failed: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: X,
      defaultLabel: "Failed",
    },
    failure: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: X,
      defaultLabel: "Failure",
    },
    rejected: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: X,
      defaultLabel: "Rejected",
    },
    escalated: {
      bg: "bg-rose-50 border-rose-200/80 text-rose-700",
      icon: AlertTriangle,
      defaultLabel: "Escalated",
    },

    // Pending / In Progress / Overdue / Action Required
    pending: {
      bg: "bg-amber-50 border-amber-200/80 text-amber-700",
      icon: Clock,
      defaultLabel: "Pending",
    },
    in_progress: {
      bg: "bg-blue-50 border-blue-200/80 text-[var(--brand)]",
      icon: Clock,
      defaultLabel: "In Progress",
    },
    in_review: {
      bg: "bg-amber-50 border-amber-200/80 text-amber-700",
      icon: Clock,
      defaultLabel: "In Review",
    },
    overdue: {
      bg: "bg-rose-50 border-rose-300 text-rose-700 font-bold",
      icon: AlertTriangle,
      defaultLabel: "Overdue",
    },
    flagged: {
      bg: "bg-amber-50 border-amber-200/80 text-amber-700",
      icon: AlertTriangle,
      defaultLabel: "Flagged",
    },

    // Locked / Queued / NA / Muted
    locked: {
      bg: "bg-slate-100 border-slate-200 text-slate-500",
      icon: Lock,
      defaultLabel: "Locked",
    },
    queued: {
      bg: "bg-slate-100 border-slate-200 text-slate-500",
      icon: Clock,
      defaultLabel: "Queued",
    },
    na: {
      bg: "bg-slate-50 border-slate-200/60 text-slate-400",
      icon: Minus,
      defaultLabel: "—",
    },
    not_applicable: {
      bg: "bg-slate-50 border-slate-200/60 text-slate-400",
      icon: Minus,
      defaultLabel: "Not Applicable",
    },
    inactive: {
      bg: "bg-slate-100 border-slate-200 text-slate-500",
      icon: Minus,
      defaultLabel: "Inactive",
    },
  };

  const style = config[normalized] || {
    bg: "bg-slate-100 border-slate-200 text-slate-700",
    icon: Shield,
    defaultLabel: status || "Unknown",
  };

  const IconComponent = style.icon;
  const displayLabel = label || style.defaultLabel;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2 font-semibold",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  }[size] || 13;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shrink-0 transition-colors ${style.bg} ${sizeClasses} ${className}`}
    >
      {showIcon && <IconComponent size={iconSizes} strokeWidth={2.5} className="shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );
}
