"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: 17, primary: 12000, secondary: 8000 },
  { day: 18, primary: 15000, secondary: 10000 },
  { day: 19, primary: 18000, secondary: 12000 },
  { day: 20, primary: 22000, secondary: 15000 },
  { day: 21, primary: 25000, secondary: 18000 },
  { day: 22, primary: 28000, secondary: 20000 },
  { day: 23, primary: 32000, secondary: 22000 },
  { day: 24, primary: 35000, secondary: 25000 },
  { day: 25, primary: 38000, secondary: 28000 },
];

const WeeklyRevenueChart: React.FC = () => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
          />
          {/* ❌ Removed YAxis to hide left-side money values */}
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name === "Primary Revenue"
                ? "Primary Revenue"
                : "Secondary Revenue",
            ]}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              paddingBottom: "10px",
            }}
          />
          <Bar
            dataKey="secondary"
            stackId="revenue"
            fill="#38bdf8"
            radius={[0, 0, 0, 0]}
            barSize={10}
            name="Secondary Revenue"
          />
          <Bar
            dataKey="primary"
            stackId="revenue"
            fill="#8b5cf6"
            radius={[20, 20, 0, 0]}
            barSize={10}
            name="Primary Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeeklyRevenueChart;
