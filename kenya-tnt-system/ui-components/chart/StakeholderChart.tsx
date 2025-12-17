"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

type StakeholderType = "Suppliers" | "Facilities" | "Manufacturers";

const colors: Record<StakeholderType, string> = {
  Suppliers: "#14532d",
  Facilities: "#38bdf8",
  Manufacturers: "#a16207",
};

type ChartDataPoint = {
  date: string;
  Suppliers: number;
  Facilities: number;
  Manufacturers: number;
};

type StakeholderChartProps = {
  data: ChartDataPoint[];
};

const StakeholderChart: React.FC<StakeholderChartProps> = ({ data }) => {
  const [selectedStakeholder, setSelectedStakeholder] = useState<
    "All" | StakeholderType
  >("All");

  const stakeholderOptions: ("All" | StakeholderType)[] = [
    "All",
    "Suppliers",
    "Facilities",
    "Manufacturers",
  ];

  const filteredKeys =
    selectedStakeholder === "All"
      ? (Object.keys(colors) as StakeholderType[])
      : [selectedStakeholder];

  return (
    <div className="w-full h-full p-2 ">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-black text-[18px] not-italic font-normal leading-normal">
          Stakeholder Onboarding
        </h2>
        <div>
          <select
            className="bg-white text-[#005C28] cursor-pointer p-3 border-[0.2px] flex items-center justify-between border-[#A19C9C] text-sm py-2 mr-3 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
            value={selectedStakeholder}
            onChange={(e) =>
              setSelectedStakeholder(e.target.value as "All" | StakeholderType)
            }
          >
            {stakeholderOptions.map((stakeholder) => (
              <option key={stakeholder} value={stakeholder}>
                {stakeholder}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white pt-[15px]">
        <div className="flex justify-center flex-wrap gap-4 mb-6">
          {filteredKeys.map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[label] }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {filteredKeys.map((key) => (
                  <linearGradient
                    id={`color${key}`}
                    key={key}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={colors[key]} stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor={colors[key]}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(dateStr) => format(parseISO(dateStr), "MMM dd")}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.ceil(dataMax + 5)]}
              />
              <Tooltip
                labelFormatter={(label) => format(parseISO(label), "PPP")}
              />
              {filteredKeys.map((key) => (
                <Area
                  key={key}
                  type="linear"
                  dataKey={key}
                  stroke={colors[key]}
                  fill={`url(#color${key})`}
                  dot={{ r: 3 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StakeholderChart;
