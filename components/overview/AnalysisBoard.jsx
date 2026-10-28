"use client";

import React, { useState, useMemo } from "react";
import {
  METRIC_CONFIGS,
  TIMEFRAMES,
  getMetricTrendData
} from "../../services/overviewAnalyticsService";
import LineChartAnalysis from "./LineChartAnalysis";

/**
 * AnalysisBoard - Clean, Realistic Deal Flow Analysis Board
 * 
 * Dynamically presents line chart trends based on card selection
 * without visual clutter or redundant metrics.
 */
export default function AnalysisBoard({
  selectedMetric,
  counts = {},
  onSelectMetric
}) {
  const [timeframe, setTimeframe] = useState(TIMEFRAMES.MONTHLY);

  const metricConfig = METRIC_CONFIGS[selectedMetric] || METRIC_CONFIGS.matching_opportunities;

  const currentCount = useMemo(() => {
    switch (selectedMetric) {
      case 'matching_opportunities':
        return counts.opportunitiesCount ?? 2;
      case 'active_pipelines':
        return counts.pipelinesCount ?? 2;
      case 'pending_nda':
        return counts.pendingNdaCount ?? 0;
      case 'completed_nda':
        return counts.completedNdaCount ?? 4;
      default:
        return 0;
    }
  }, [selectedMetric, counts]);

  const trendData = useMemo(() => {
    return getMetricTrendData(selectedMetric, timeframe, currentCount);
  }, [selectedMetric, timeframe, currentCount]);

  const accentColor = metricConfig.accentColor;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_15px_rgb(0,0,0,0.02)] p-6 md:p-8 mb-10 transition-all duration-300">
      {/* Header with Title and Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {metricConfig.chartTitle}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {metricConfig.subtitle}
          </p>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
          {Object.values(TIMEFRAMES).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={timeframe === tf ? { color: accentColor } : {}}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Realistic Line Chart */}
      <div className="w-full">
        <LineChartAnalysis
          data={trendData}
          metricConfig={metricConfig}
          height={220}
        />
      </div>
    </div>
  );
}
