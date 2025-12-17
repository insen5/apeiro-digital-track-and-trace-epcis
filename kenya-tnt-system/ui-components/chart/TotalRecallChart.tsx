"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type ChartDatum = { name: string; value: number; color: string };

const data: ChartDatum[] = [
  { name: "Processed", value: 63, color: "#1E90FF" }, // dark blue
  { name: "Completed", value: 25, color: "#6AD2FF" }, // light blue
  { name: "Pending", value: 12, color: "#EFF4FB" }, // grey
];

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDatum;
  }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="text-sm font-semibold text-gray-800">
            {data.payload.name}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{data.value}%</span> of total recalls
        </div>
      </div>
    );
  }
  return null;
};

const TotalRecallChart: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center">
      {/* Chart - positioned higher */}
      <div
        className="flex justify-center relative"
        style={{ marginTop: "-35px" }}
      >
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="40%" // move chart up
              outerRadius={85}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with only Processed and Completed */}
      <div className="flex gap-8 w-full max-w-sm mt-4">
        {/* Processed */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data[0].color }}
          />
          <span className="text-sm text-gray-600">{data[0].name}</span>
          <span className="text-sm font-semibold text-gray-800 ml-auto">
            {data[0].value}%
          </span>
        </div>

        {/* Completed */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data[1].color }}
          />
          <span className="text-sm text-gray-600">{data[1].name}</span>
          <span className="text-sm font-semibold text-gray-800 ml-auto">
            {data[1].value}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default TotalRecallChart;
