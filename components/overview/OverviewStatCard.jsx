"use client";

import React from "react";
import { FaChartLine } from "react-icons/fa";

/**
 * OverviewStatCard - Clean, Realistic KPI Card
 * 
 * Preserves the pristine look from the overview page while supporting
 * interactive click selection to switch the line chart analysis.
 */
export default function OverviewStatCard({
  id,
  title,
  value,
  badgeText,
  badgeType = "teal",
  icon: Icon,
  iconBgClass = "bg-teal-50 text-teal-600",
  isSelected = false,
  onClick,
  accentColor = "#008f70"
}) {
  const getBadgeClass = () => {
    switch (badgeType) {
      case "warning":
        return "text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full";
      case "purple":
        return "text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full";
      case "blue":
        return "text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full";
      case "teal":
      default:
        return "text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full";
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-pressed={isSelected}
      className={`bg-white p-6 rounded-xl flex flex-col justify-between text-left transition-all duration-200 cursor-pointer w-full focus:outline-none ${
        isSelected
          ? "border-2 shadow-md ring-2 ring-opacity-20"
          : "border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-gray-300"
      }`}
      style={{
        borderColor: isSelected ? accentColor : undefined,
        ...(isSelected ? { boxShadow: `0 4px 18px -2px ${accentColor}20` } : {})
      }}
    >
      {/* Top Row: Icon and Optional Badge */}
      <div className="flex justify-between items-start mb-4 w-full">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${iconBgClass}`}>
          {Icon ? <Icon /> : <FaChartLine />}
        </div>
        {badgeText && (
          <span className={getBadgeClass()}>{badgeText}</span>
        )}
      </div>

      {/* Content: Value and Label */}
      <div>
        <h3 className="text-3xl font-black text-gray-900 mb-1">{value}</h3>
        <p className="text-sm font-bold text-gray-500">{title}</p>
      </div>
    </button>
  );
}
