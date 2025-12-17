"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { FaChevronDown } from "react-icons/fa";
import { showToast } from "@/lib/toast";

const data = [
  {
    name: 0,
    Penadol: 280,
    Leopix: 500,
    Brufen: 820,
    Catyler: 320,
    Crossin: 600,
  },
  {
    name: 1,
    Penadol: 580,
    Leopix: 820,
    Brufen: 690,
    Catyler: 510,
    Crossin: 350,
  },
  {
    name: 2,
    Penadol: 1000,
    Leopix: 100,
    Brufen: 770,
    Catyler: 900,
    Crossin: 1000,
  },
  {
    name: 3,
    Penadol: 180,
    Leopix: 500,
    Brufen: 480,
    Catyler: 700,
    Crossin: 90,
  },
  {
    name: 4,
    Penadol: 220,
    Leopix: 760,
    Brufen: 720,
    Catyler: 850,
    Crossin: 100,
  },
  {
    name: 5,
    Penadol: 1000,
    Leopix: 780,
    Brufen: 490,
    Catyler: 910,
    Crossin: 990,
  },
  {
    name: 6,
    Penadol: 900,
    Leopix: 770,
    Brufen: 520,
    Catyler: 870,
    Crossin: 950,
  },
  {
    name: 7,
    Penadol: 760,
    Leopix: 270,
    Brufen: 780,
    Catyler: 660,
    Crossin: 820,
  },
  {
    name: 8,
    Penadol: 720,
    Leopix: 450,
    Brufen: 610,
    Catyler: 580,
    Crossin: 430,
  },
  {
    name: 9,
    Penadol: 510,
    Leopix: 140,
    Brufen: 490,
    Catyler: 980,
    Crossin: 110,
  },
];

const colors = {
  Penadol: "#2e7d32",
  Leopix: "#3e2723",
  Brufen: "#6a1b9a",
  Catyler: "#aeea00",
  Crossin: "#004d40",
};

const products = ["Penadol", "Leopix", "Brufen", "Catyler", "Crossin"];

const ProductsBarChart = () => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(products);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProducts(value === "all" ? products : [value]);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products Sale Data");
    XLSX.writeFile(workbook, "products_sale_data.xlsx");
    setShowExportOptions(false);
    showToast.success("Excel file downloaded successfully");
  };

  const exportToCSV = () => {
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "products_sale_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
    showToast.success("CSV file downloaded successfully");
  };

  return (
    <div className="w-full">
      <div className="mt-[10px] mb-[7px]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-black text-[18px] not-italic font-normal leading-normal">
            Products Sale
          </h2>
          <div className="flex gap-4">
            <select
              onChange={handleProductChange}
              className="bg-white text-[#005C28] cursor-pointer p-3 border-[0.2px] flex items-center justify-between border-[#A19C9C] text-sm py-2 mr-3 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="all">All Products</option>
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>

            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="bg-white text-[#005C28] cursor-pointer p-4 border-[0.2px] flex items-center justify-between border-[#A19C9C] text-sm py-2 mr-3"
              >
                Export
                <FaChevronDown className="ml-2" />
              </button>

              {showExportOptions && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    onClick={exportToExcel}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100"
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#FFF]">
        <div className="w-full h-[294px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 40, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <Legend
                layout="horizontal"
                verticalAlign="top"
                align="center"
                wrapperStyle={{
                  top: 10,
                  left: 0,
                }}
              />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {selectedProducts.map((product) => (
                <Bar
                  key={product}
                  dataKey={product}
                  fill={colors[product as keyof typeof colors]}
                  barSize={20}
                ></Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProductsBarChart;
