"use client";

import React from "react";
import {
  Download,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  KeyRound,
  HelpCircle,
  MessageSquare,
  Milestone,
  AlertOctagon,
  Activity,
  ChevronRight,
  Trash2,
  Clock,
  FileText,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export function getActionIcon(action = "") {
  const norm = action.toLowerCase();
  if (norm.includes("download")) return <Download className="w-3.5 h-3.5 text-emerald-600" />;
  if (norm.includes("upload")) return <Upload className="w-3.5 h-3.5 text-blue-600" />;
  if (norm.includes("view")) return <Eye className="w-3.5 h-3.5 text-sky-600" />;
  if (norm.includes("delet") || norm.includes("trash")) return <Trash2 className="w-3.5 h-3.5 text-rose-600" />;
  if (norm.includes("approv")) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  if (norm.includes("login") || norm.includes("sign")) return <KeyRound className="w-3.5 h-3.5 text-indigo-600" />;
  if (norm.includes("denied") || norm.includes("fail")) return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
  if (norm.includes("permission")) return <KeyRound className="w-3.5 h-3.5 text-amber-600" />;
  if (norm.includes("asked")) return <HelpCircle className="w-3.5 h-3.5 text-purple-600" />;
  if (norm.includes("answered")) return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
  if (norm.includes("stage") || norm.includes("gate")) return <Milestone className="w-3.5 h-3.5 text-[var(--brand)]" />;
  if (norm.includes("policy") || norm.includes("violation")) return <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />;
  return <Activity className="w-3.5 h-3.5 text-slate-600" />;
}

export function formatAuditDate(dateString) {
  if (!dateString) return { date: "—", time: "", full: "—" };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { date: String(dateString), time: "", full: String(dateString) };
    }

    // Convert to Indian Standard Time (Asia/Kolkata, UTC + 5:30 = 19,800,000 ms)
    const istTime = new Date(d.getTime() + 19800000);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const month = months[istTime.getUTCMonth()];
    const day = String(istTime.getUTCDate()).padStart(2, "0");
    const year = istTime.getUTCFullYear();

    let h = istTime.getUTCHours();
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = String(h % 12 || 12).padStart(2, "0");
    const minutes = String(istTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(istTime.getUTCSeconds()).padStart(2, "0");

    const dateFormatted = `${month} ${day}, ${year}`;
    const timeFormatted = `${hour12}:${minutes}:${seconds} ${ampm}`;
    const fullFormatted = `${month} ${day}, ${year} at ${timeFormatted} (IST)`;

    return {
      date: dateFormatted,
      time: timeFormatted,
      full: fullFormatted,
    };
  } catch {
    return { date: String(dateString), time: "", full: String(dateString) };
  }
}

export default function AuditEventRow({
  event,
  onClick,
  layout = "table", // 'table' | 'feed'
  isCompact = false,
  moduleView = "all", // 'all' | 'Authentication' | 'Documents'
}) {
  const { date, time, full } = formatAuditDate(event.timestamp);

  if (layout === "feed") {
    return (
      <div
        onClick={() => onClick && onClick(event)}
        className="group p-3.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all cursor-pointer flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          {getActionIcon(event.action)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {event.user}
              </span>
              {event.side === "buyer" ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                  Buyer
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                  Seller
                </span>
              )}
            </div>
            <StatusBadge status={event.result} size="sm" showIcon={false} />
          </div>
          <p className="text-xs text-slate-600 font-medium truncate mb-1">
            {event.action} — <span className="text-slate-800 font-semibold">{event.resource}</span>
          </p>
          <div suppressHydrationWarning className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap">
            <span>{date} {time} IST</span>
            {event.durationText && event.durationText !== '—' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-mono font-bold border border-sky-200/70">
                <Clock size={10} className="text-sky-600" />
                <span>{event.durationText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full table row
  return (
    <tr
      onClick={() => onClick && onClick(event)}
      className="border-b border-slate-100 hover:bg-[var(--brand-50)]/40 transition-colors cursor-pointer text-xs font-sans group"
    >
      {/* User */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 uppercase border border-slate-200">
            {event.user ? event.user.split(" ").map((n) => n[0]).join("") : "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-slate-900 truncate group-hover:text-[var(--brand)] transition-colors">
                {event.user}
              </p>
              {event.side === "buyer" ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80 shrink-0">
                  Buyer
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200/80 shrink-0">
                  Seller
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate font-mono">
              {event.userEmail || event.userRole}
            </p>
          </div>
        </div>
      </td>

      {/* Action */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            {getActionIcon(event.action)}
          </span>
          <span className="font-semibold text-slate-800 whitespace-nowrap">
            {event.action}
          </span>
        </div>
      </td>

      {/* Resource / Target / Document File / Auth Detail */}
      <td className="px-4 py-3.5 max-w-[240px]">
        {moduleView === "Authentication" ? (
          event.failureReason ? (
            <span
              className="text-rose-600 font-semibold truncate block text-xs"
              title={`Authentication Failed: ${event.failureReason}`}
            >
              Failed: {event.failureReason}
            </span>
          ) : (
            <span
              className="text-slate-700 font-medium truncate block text-xs"
              title={event.resource || "User Portal Session"}
            >
              {event.resource || "User Portal Session"}
            </span>
          )
        ) : moduleView === "Documents" ? (
          <div className="flex items-center gap-2 min-w-0" title={event.resource || "Document"}>
            <FileText size={14} className="text-sky-600 shrink-0" />
            <span className="font-semibold text-slate-800 truncate text-xs">
              {event.resource || "Document"}
            </span>
          </div>
        ) : (
          <span
            className={`font-medium truncate block ${
              event.failureReason ? "text-rose-700 font-semibold" : "text-slate-700"
            }`}
            title={event.resource}
          >
            {event.resource}
          </span>
        )}
      </td>

      {/* Duration / View Time (Only rendered for Documents and All Modules, omitted for Authentication) */}
      {moduleView !== "Authentication" && (
        <td className="px-4 py-3.5 whitespace-nowrap">
          {event.durationText && event.durationText !== "—" ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-mono font-semibold text-[11px] border border-sky-200/80">
              <Clock size={11} className="text-sky-600 shrink-0" />
              <span>{event.durationText}</span>
            </div>
          ) : (
            <span className="text-slate-400 text-[11px] font-mono">—</span>
          )}
        </td>
      )}

      {/* Deal Context / Organization */}
      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
        <div className="flex flex-col min-w-0">
          <span
            className="text-[11px] font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200/80 inline-block truncate max-w-[200px]"
            title={event.deal}
          >
            {event.deal || event.companyName || "Corporate Access"}
          </span>
          {event.projectName && event.projectName !== event.deal && (
            <span
              className="text-[10px] text-slate-400 font-medium px-1 mt-0.5 truncate max-w-[200px]"
              title={event.projectName}
            >
              {event.projectName}
            </span>
          )}
        </div>
      </td>

      {/* Result */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={event.result} size="sm" />
      </td>

      {/* Date & Time (Indian Standard Time - Asia/Kolkata) */}
      <td
        suppressHydrationWarning
        className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600"
        title={full}
      >
        <div suppressHydrationWarning>{date}</div>
        <div suppressHydrationWarning className="text-slate-400 text-[10px]">{time} IST</div>
      </td>
    </tr>
  );
}
