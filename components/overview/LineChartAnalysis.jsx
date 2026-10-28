"use client";

import React, { useState, useRef, useMemo } from "react";
import { buildSmoothSvgPath, buildSmoothSvgAreaPath } from "../../services/overviewAnalyticsService";

/**
 * LineChartAnalysis - Realistic, minimalist M&A activity line chart
 */
export default function LineChartAnalysis({
  data = [],
  metricConfig,
  height = 230
}) {
  const svgRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const W = 900;
  const H = height;
  const PL = 45; // Padding Left
  const PR = 25; // Padding Right
  const PT = 20; // Padding Top
  const PB = 35; // Padding Bottom

  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  // Determine Y-axis max with clean integer steps
  const { maxVal, minVal, yTicks } = useMemo(() => {
    if (!data || data.length === 0) return { maxVal: 5, minVal: 0, yTicks: [0, 1, 2, 3, 4, 5] };

    let m = 0;
    data.forEach((d) => {
      if (d.value > m) m = d.value;
    });

    const calculatedMax = Math.max(m + 1, 4);
    const tickStep = calculatedMax <= 6 ? 1 : Math.ceil(calculatedMax / 4);
    const ticks = [];
    for (let v = 0; v <= calculatedMax; v += tickStep) {
      ticks.push(v);
    }
    return { maxVal: ticks[ticks.length - 1], minVal: 0, yTicks: ticks };
  }, [data]);

  // Map coordinates
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const step = chartW / Math.max(data.length - 1, 1);

    return data.map((d, i) => {
      const x = PL + i * step;
      const normalizedY = (d.value - minVal) / (maxVal - minVal || 1);
      const y = PT + chartH - normalizedY * chartH;
      return { x, y, data: d, index: i };
    });
  }, [data, chartW, chartH, maxVal, minVal]);

  const linePath = useMemo(() => buildSmoothSvgPath(points), [points]);
  const areaPath = useMemo(() => buildSmoothSvgAreaPath(points, PT + chartH), [points, PT, chartH]);

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    let closest = points[0];
    let minDist = Math.abs(mouseX - points[0].x);

    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(mouseX - points[i].x);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }

    const screenX = (closest.x / W) * 100;
    const screenY = (closest.y / H) * 100;

    setHoveredPoint({
      ...closest,
      percentX: screenX,
      percentY: screenY
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const accent = metricConfig?.accentColor || "#008f70";
  const gradientId = `grad_${metricConfig?.id || 'default'}`;

  return (
    <div className="relative w-full select-none">
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((val) => {
            const y = PT + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;
            return (
              <g key={`y-${val}`}>
                <line
                  x1={PL}
                  x2={W - PR}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={PL - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Main Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={accent}
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Points */}
          {points.map((pt, idx) => (
            <circle
              key={`pt-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint?.index === idx ? 5.5 : 3.5}
              fill="#ffffff"
              stroke={accent}
              strokeWidth={hoveredPoint?.index === idx ? 3 : 2}
              className="transition-all duration-150"
            />
          ))}

          {/* Hover Crosshair indicator */}
          {hoveredPoint && (
            <g className="pointer-events-none">
              <line
                x1={hoveredPoint.x}
                x2={hoveredPoint.x}
                y1={PT}
                y2={PT + chartH}
                stroke={accent}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill={accent}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* X-axis labels */}
          {points.map((pt, idx) => (
            <text
              key={`x-${idx}`}
              x={pt.x}
              y={H - 12}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={hoveredPoint?.index === idx ? accent : "#94a3b8"}
              className="transition-colors duration-150"
            >
              {pt.data.label}
            </text>
          ))}
        </svg>

        {/* Clean, minimalist tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg shadow-lg text-xs transition-all duration-75"
            style={{
              left: `${hoveredPoint.percentX}%`,
              top: `${Math.max(10, hoveredPoint.percentY - 2)}%`
            }}
          >
            <div className="font-semibold text-gray-300 text-[10px]">
              {hoveredPoint.data.label}
            </div>
            <div className="font-extrabold text-sm text-white">
              {hoveredPoint.data.value} {metricConfig?.unit || ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
