/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { format } from "date-fns";

type Batch = {
  quantity: number;
  productCode?: any;
  batchNumber?: any;
  productionDate?: any;
};

type AreaChartProps = {
  codeGeneration: any;
};

const AreaChartComponent: React.FC<AreaChartProps> = ({ codeGeneration }) => {
  const [selectedDrug, setSelectedDrug] = useState<"All" | string>("All");

  if (
    !codeGeneration ||
    typeof codeGeneration !== "object" ||
    Object.keys(codeGeneration).length === 0
  ) {
    return (
      <div className="w-full h-full p-4 text-center text-gray-500">
        No data available to display.
      </div>
    );
  }

  const rawData: Record<string, Batch[]> = codeGeneration;
  const generateRenameMap = (keys: string[]): Record<string, string> => {
    const map: Record<string, string> = {};
    keys.forEach((fullName) => {
      const shortName = fullName.replace(/\d+mg/i, "").trim();
      map[fullName] = shortName;
    });
    return map;
  };

  const renameMap = generateRenameMap(Object.keys(rawData));

  const getAllDates = (data: Record<string, Batch[]>): string[] => {
    const dateSet = new Set<string>();
    Object.values(data).forEach((batches) =>
      batches.forEach(({ productionDate }) => dateSet.add(productionDate))
    );
    return Array.from(dateSet).sort((a, b) => (a > b ? 1 : -1));
  };

  const allDates = getAllDates(rawData);

  const data = allDates.map((date) => {
    const entry: Record<string, any> = { date };
    for (const fullName in rawData) {
      const shortName = renameMap[fullName];
      const batch = rawData[fullName].find((b) => b.productionDate === date);
      entry[shortName] = batch ? batch.quantity : 0;
    }
    return entry;
  });

  const drugNames = Array.from(new Set(Object.values(renameMap))).sort();

  const baseColors = [
    "#4CAF50", // green
    "#2196F3", // blue
    "#FF9800", // orange
    "#9C27B0", // purple
    "#00BCD4", // teal
    "#E91E63", // pink
    "#8BC34A", // light green
  ];

  const colors: Record<string, string> = {};
  drugNames.forEach((drug, i) => {
    colors[drug] = baseColors[i % baseColors.length];
  });

  // Helper to add day suffix (st, nd, rd, th)
  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return "th"; // special case 11-20
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Format full date like "May 15th, 2025" for tooltip
  const formatFullDateWithSuffix = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, `MMMM do, yyyy`);
  };

  // Format XAxis tick like "15th May"
  const formatXAxisTick = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    return `${day}${suffix} ${format(date, "MMM")}`;
  };
  const drugOptions = ["All", ...drugNames];
  const filteredKeys = selectedDrug === "All" ? drugNames : [selectedDrug];

  return (
    <div className="w-full h-full p-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-800 text-[18px] font-medium leading-normal">
          Codes Generation
        </h2>
        <select
          className="bg-white text-[#005C28] cursor-pointer border border-gray-300 text-sm px-3 py-2 rounded shadow-sm hover:bg-gray-50 focus:outline-none"
          value={selectedDrug}
          onChange={(e) => setSelectedDrug(e.target.value)}
        >
          {drugOptions.map((drug) => (
            <option key={drug} value={drug}>
              {drug}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="bg-white pt-3">
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

        <div className="w-full h-[250px]">
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
                      stopOpacity={0.3}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={10}
                tickFormatter={formatXAxisTick}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatFullDateWithSuffix} />
              {filteredKeys.map((key) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[key]}
                  fill={`url(#color${key})`}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AreaChartComponent;
