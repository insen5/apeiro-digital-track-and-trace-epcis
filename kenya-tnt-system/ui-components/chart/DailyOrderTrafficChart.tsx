"use client";

import React from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { time: "00", orders: 450 },
  { time: "04", orders: 320 },
  { time: "08", orders: 890 },
  { time: "12", orders: 1200 },
  { time: "14", orders: 980 },
  { time: "16", orders: 1350 },
  { time: "18", orders: 300 },
];

const DailyOrderTrafficChart: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            {/* Only X Axis */}
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [value.toLocaleString(), "Orders"]}
            />

            {/* Gradient for tube-like bars */}
            <defs>
              <linearGradient id="tubeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0077B6" stopOpacity={1} />
                <stop offset="100%" stopColor="#48CAE4" stopOpacity={1} />
              </linearGradient>
            </defs>

            {/* Bars - thin, tube style */}
            <Bar
              dataKey="orders"
              fill="url(#tubeGradient)"
              radius={[20, 20, 0, 0]} // Rounded tube-like tops
              barSize={18} // Thin bars
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-b from-[#0077B6] to-[#48CAE4] rounded-sm"></div>
          <span className="text-xs text-gray-600">Orders</span>
          <span className="text-xs text-gray-400 mx-2">•</span>
          <span className="text-xs text-gray-500">Time (24h format)</span>
        </div>
      </div>
    </div>
  );
};

export default DailyOrderTrafficChart;
