'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GrowthChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  totalValue: number;
  growthPercentage?: number | null;
  className?: string;
}

export const GrowthChart = ({
  data,
  title,
  totalValue,
  growthPercentage,
  className,
}: GrowthChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    value: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);

  // Calculate dimensions and scaling
  const width = 400;
  const height = 120;
  const padding = 20;

  // Date formatting utility: "DD/MM" -> "DD MMM"
  const formatDate = (dateStr: string) => {
    const [day, month] = dateStr.split('/').map(Number);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${day} ${months[month - 1]}`;
  };

  if (data.length === 0) {
    return (
      <div className={cn('bg-neutral-900/50 rounded-2xl p-6', className)}>
        <div className="text-neutral-400 text-center">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue || 1;

  // Create smooth path for area chart
  const createPath = () => {
    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
      const y =
        height -
        padding -
        ((d.value - minValue) / valueRange) * (height - 2 * padding);
      return [x, y];
    });

    // Create smooth curve using cubic bezier
    let path = `M ${points[0][0]} ${points[0][1]}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      const cp1x = prev[0] + (curr[0] - prev[0]) * 0.5;
      const cp1y = prev[1];
      const cp2x = curr[0] - (next ? (next[0] - curr[0]) * 0.3 : 0);
      const cp2y = curr[1];

      if (i === 1) {
        path += ` Q ${cp1x} ${cp1y} ${curr[0]} ${curr[1]}`;
      } else {
        path += ` S ${cp2x} ${cp2y} ${curr[0]} ${curr[1]}`;
      }
    }

    return path;
  };

  const createAreaPath = () => {
    const linePath = createPath();

    const x1 = padding;
    const x2 =
      padding + ((data.length - 1) * (width - 2 * padding)) / (data.length - 1);
    const bottomY = height - padding;

    return `${linePath} L ${x2} ${bottomY} L ${x1} ${bottomY} Z`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Calculate data point positions for invisible dots
  const getDataPoints = () => {
    return data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
      const y =
        height -
        padding -
        ((d.value - minValue) / valueRange) * (height - 2 * padding);
      return { x, y, value: d.value, date: d.date };
    });
  };

  return (
    <div
      className={cn(
        'bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800/50',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-neutral-400 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-white">
            {formatNumber(totalValue)}
          </span>
          {growthPercentage !== null && growthPercentage !== undefined && (
            <span className="text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              +{growthPercentage}% from last month
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area */}
          <motion.path
            d={createAreaPath()}
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />

          {/* Line */}
          <motion.path
            d={createPath()}
            stroke="#ffffff"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* Invisible hover dots */}
          {getDataPoints().map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="10"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() =>
                setHoveredPoint({
                  value: point.value,
                  date: formatDate(point.date),
                  x: point.x,
                  y: point.y,
                })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* On-chart tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-50 bg-black/90 text-white px-3 py-2 rounded-lg text-sm border border-neutral-700 pointer-events-none"
            style={{
              left: hoveredPoint.x - 30,
              top: hoveredPoint.y - 50,
            }}
          >
            <div className="font-semibold">
              {formatNumber(hoveredPoint.value)}
            </div>
            <div className="text-neutral-400">
              Total as of {hoveredPoint.date}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
