"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { TooltipProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

// default data
const defaultData = [
  { month: "SEP", current: 37500, previous: 30000 },
  { month: "OCT", current: 42000, previous: 34000 },
  { month: "NOV", current: 39000, previous: 36000 },
  { month: "DEC", current: 45000, previous: 38000 },
  { month: "JAN", current: 43000, previous: 40000 },
  { month: "FEB", current: 47000, previous: 42000 },
];

type ChartData = {
  month: string;
  current: number;
  previous: number;
};

interface MonthlyEarningsChartProps {
  data?: ChartData[];
  height?: number | string;
}

// ✅ Custom tooltip with correct types
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const currentData = payload.find((item) => item.dataKey === "current");
    const previousData = payload.find((item) => item.dataKey === "previous");

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="text-sm font-semibold text-gray-800 mb-2">{label}</div>
        <div className="space-y-1">
          {currentData && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4]"></div>
              <span className="text-xs text-gray-600">Current:</span>
              <span className="text-xs font-semibold text-gray-800">
                ${Number(currentData.value).toLocaleString()}
              </span>
            </div>
          )}
          {previousData && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#06B6D4]"></div>
              <span className="text-xs text-gray-600">Previous:</span>
              <span className="text-xs font-semibold text-gray-800">
                ${Number(previousData.value).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function MonthlyEarningsChart({
  data = defaultData,
}: MonthlyEarningsChartProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={1} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 10,
                fill: "#6B7280",
              }}
              interval={0}
              tickMargin={8}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={false} />

            <Line
              type="monotone"
              dataKey="current"
              stroke="url(#colorCurrent)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4.5, fill: "#2563EB" }}
            />

            <Line
              type="monotone"
              dataKey="previous"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4">
        {/* Current */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#06B6D4]"></div>
          <span className="text-xs text-gray-600">Current</span>
        </div>

        {/* Previous */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#06B6D4]"></div>
          <span className="text-xs text-gray-600">Previous</span>
        </div>
      </div>
    </div>
  );
}
