"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  FileText,
  X,
  // SlidersHorizontal
} from "lucide-react";
import * as XLSX from "xlsx";

// Status configuration with icons and colors
const STATUS_CONFIG = {
  all: { icon: null, label: "All", color: "bg-blue-500 text-white" },
  active: {
    icon: CheckCircle,
    label: "Active",
    color: "bg-green-100 text-green-800",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
  dispatched: {
    icon: Truck,
    label: "Dispatched",
    color: "bg-blue-100 text-blue-800",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "bg-red-100 text-red-800",
  },
};

// Date helpers
function padToTwoDigits(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function isParsableDate(value: unknown): boolean {
  if (value == null) return false;
  const str = String(value);
  // Accept ISO-like or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return !isNaN(Date.parse(str));
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("/").map(Number);
    const d = new Date(yyyy, (mm || 1) - 1, dd || 1);
    return (
      d.getFullYear() === yyyy &&
      d.getMonth() === (mm || 1) - 1 &&
      d.getDate() === dd
    );
  }
  return false;
}

function toDdMmYyyy(value: unknown): string {
  if (!isParsableDate(value)) return String(value ?? "");
  const str = String(value);
  let d: Date;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("/").map(Number);
    d = new Date(yyyy, (mm || 1) - 1, dd || 1);
  } else {
    d = new Date(str);
  }
  const day = padToTwoDigits(d.getDate());
  const month = padToTwoDigits(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function toInputYyyyMmDd(value: unknown): string {
  if (!isParsableDate(value)) return "";
  const str = String(value);
  let d: Date;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("/");
    return `${yyyy}-${mm}-${dd}`;
  } else {
    d = new Date(str);
  }
  const y = d.getFullYear();
  const m = padToTwoDigits(d.getMonth() + 1);
  const day = padToTwoDigits(d.getDate());
  return `${y}-${m}-${day}`;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  className?: string;
  render?: (value: unknown, item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "dropdown" | "date" | "number" | "range";
  filterOptions?: Array<{ value: string; label: string }>;
}

export interface TableFilter {
  key: string;
  label: string;
  type: "text" | "dropdown" | "date" | "number" | "range";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface PaginationConfig {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface GenericTableProps<T> {
  // Data and columns
  data: T[];
  columns: TableColumn<T>[];

  // Table configuration
  title?: string;
  loading?: boolean;
  emptyMessage?: string;

  // Add button configuration
  showAddButton?: boolean;
  addButtonText?: string;
  onAddButtonClick?: () => void;

  // Status tabs configuration
  showStatusTabs?: boolean;
  statusTabs?: Array<keyof typeof STATUS_CONFIG>;
  selectedStatus?: keyof typeof STATUS_CONFIG;
  onStatusChange?: (status: keyof typeof STATUS_CONFIG) => void;

  // Custom tabs configuration
  showTabs?: boolean;
  tabs?: Array<{ key: string; label: string; icon?: React.ReactNode }>;
  selectedTab?: string;
  onTabChange?: (tabKey: string) => void;

  // Filtering
  showFilters?: boolean;
  filters?: TableFilter[];
  onFilterChange?: (filters: Record<string, unknown>) => void;

  // Pagination
  paginationType?: "ui" | "backend" | "both";
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;

  // Export
  showExport?: boolean;
  exportFormats?: ("pdf" | "excel")[];
  exportFileName?: string;

  // Actions
  renderActions?: (item: T) => React.ReactNode;

  // Custom styling
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
}

// Filter Popup Component
interface FilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TableFilter[];
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

function FilterPopup({
  isOpen,
  onClose,
  filters,
  filterValues,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
}: FilterPopupProps) {
  if (!isOpen) return null;

  const renderFilterInput = (filter: TableFilter) => {
    const value = filterValues[filter.key];

    switch (filter.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={String(value || "")}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        );

      case "dropdown":
        return (
          <Select
            value={String(value || "")}
            onValueChange={(val) =>
              onFilterChange(filter.key, val || undefined)
            }
          >
            <SelectTrigger className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder={`Enter ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__clear__">Clear Selection</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label}`}
            value={String(value || "")}
            onChange={(e) =>
              onFilterChange(
                filter.key,
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        );

      case "range":
        const rangeValue = (value as { min?: number; max?: number }) || {};
        return (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={rangeValue.min || ""}
              onChange={(e) => {
                const newValue = {
                  ...rangeValue,
                  min: e.target.value ? Number(e.target.value) : undefined,
                };
                onFilterChange(filter.key, newValue);
              }}
              className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={rangeValue.max || ""}
              onChange={(e) => {
                const newValue = {
                  ...rangeValue,
                  max: e.target.value ? Number(e.target.value) : undefined,
                };
                onFilterChange(filter.key, newValue);
              }}
              className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={toInputYyyyMmDd(value)}
            onChange={(e) => {
              const v = e.target.value; // YYYY-MM-DD
              if (!v) {
                onFilterChange(filter.key, "");
                return;
              }
              const [y, m, d] = v.split("-");
              onFilterChange(filter.key, `${d}/${m}/${y}`);
            }}
            className="w-full bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute top-45 right-35 z-50   max-w-lg w-full">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 border-1">
        {/* Header */}
        <div className="flex items-center justify-between py-3 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 cursor-pointer rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label
                  htmlFor={filter.key}
                  className="text-sm font-medium text-gray-700"
                >
                  {filter.label}
                </Label>
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center space-x-3 p-6">
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="px-4 py-2 bg-white border border-[#0077B6] text-[#0077B6] hover:text-[#3f9bcc] rounded-full w-48 cursor-pointer "
          >
            Cancel
          </Button>
          <Button
            onClick={onApplyFilters}
            className="px-4 py-2 bg-[#0077B6] hover:bg-[#3f9bcc] hover:text-white text-white rounded-full cursor-pointer w-48"
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GenericTable<T>({
  data,
  columns,
  title = "",
  loading = false,
  emptyMessage = "No data found",
  showAddButton = false,
  addButtonText = "Add New Product",
  onAddButtonClick,
  showTabs = false,
  tabs = [],
  selectedTab,
  onTabChange,
  showFilters = false,
  filters = [],
  onFilterChange,
  paginationType = "ui",
  pagination,
  onPageChange,
  onItemsPerPageChange,
  showExport = false,
  exportFormats = ["excel"],
  exportFileName,
  renderActions,
  className = "",
  headerClassName = "",
  rowClassName = "",
}: GenericTableProps<T>) {
  // Build filters from columns if not provided
  const builtFilters = useMemo(() => {
    if (filters.length > 0) return filters;
    return columns
      .filter((col) => col.filterable)
      .map((col) => ({
        key: String(col.key),
        label: col.label,
        type: col.filterType || "text",
        filterOptions: col.filterOptions,
      })) as TableFilter[];
  }, [filters, columns]);

  // Render filter and export buttons
  const renderFilterAndExportButtons = () => (
    <div className="flex items-center space-x-2">
      {showFilters && builtFilters.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsFilterPopupOpen(true)}
            className="flex px-3 py-2 justify-center items-center gap-[5px] rounded-[20px] border-[0.5px] border-white bg-[#0994dd54] hover:bg-[rgba(0,119,182,0.10)] cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="12"
              viewBox="0 0 13 12"
              fill="none"
            >
              <path
                d="M5.75 7.22363L1.76758 1.25H1.375V1H11.625V1.25H11.2324L7.25 7.22363V11.25H5.75V7.22363Z"
                stroke="#111111"
              />
            </svg>
            <span className="text-[#111] text-sm font-normal leading-[17.787px] tracking-[-0.28px]">
              Filters
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
            >
              <path
                d="M11.6938 5.13116C11.6357 5.07258 11.5665 5.02609 11.4904 4.99436C11.4142 4.96263 11.3325 4.94629 11.25 4.94629C11.1675 4.94629 11.0858 4.96263 11.0096 4.99436C10.9335 5.02609 10.8644 5.07258 10.8063 5.13116L7.94376 7.99366C7.88566 8.05224 7.81653 8.09873 7.74037 8.13046C7.66421 8.16219 7.58251 8.17853 7.50001 8.17853C7.4175 8.17853 7.33581 8.16219 7.25965 8.13046C7.18349 8.09873 7.11436 8.05224 7.05626 7.99366L4.19376 5.13116C4.13566 5.07258 4.06653 5.02609 3.99037 4.99436C3.91421 4.96263 3.83251 4.94629 3.75001 4.94629C3.6675 4.94629 3.58581 4.96263 3.50965 4.99436C3.43348 5.02609 3.36436 5.07258 3.30626 5.13116C3.18985 5.24826 3.12451 5.40667 3.12451 5.57179C3.12451 5.7369 3.18985 5.89531 3.30626 6.01241L6.17501 8.88116C6.52657 9.23228 7.00313 9.4295 7.50001 9.4295C7.99688 9.4295 8.47344 9.23228 8.82501 8.88116L11.6938 6.01241C11.8102 5.89531 11.8755 5.7369 11.8755 5.57179C11.8755 5.40667 11.8102 5.24826 11.6938 5.13116Z"
                fill="#111111"
              />
            </svg>
          </button>
          {Object.values(filterValues).some(
            (value) =>
              value !== undefined &&
              value !== null &&
              value !== "" &&
              value !== "__clear__"
          ) && (
              <span className="absolute top-1.5 right-1.5 bg-[#0077B6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white transform translate-x-1/2 -translate-y-1/2">
                {
                  Object.values(filterValues).filter(
                    (value) =>
                      value !== undefined &&
                      value !== null &&
                      value !== "" &&
                      value !== "__clear__"
                  ).length
                }
              </span>
            )}
        </div>
      )}

      {/* Export Buttons */}
      {showExport && (
        <>
          {exportFormats.includes("excel") && (
            <button
              className="flex px-[10px] py-[5px] justify-center items-center gap-[5px] rounded-[20px] border-[0.5px] border-white bg-[#0994dd54] hover:bg-[rgba(0,119,182,0.10)] cursor-pointer"
              onClick={exportToExcel}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
              >
                <path
                  d="M6.01609 10C6.21315 10.0003 6.40832 9.96172 6.5904 9.88638C6.77249 9.81105 6.93789 9.70047 7.07709 9.561L9.03659 7.6L8.32959 6.895L6.51309 8.712L6.50009 0.5H5.50009L5.51309 8.704L3.70309 6.894L2.99609 7.6L4.95559 9.5595C5.09464 9.69915 5.2599 9.80996 5.44189 9.88556C5.62389 9.96115 5.81902 10 6.01609 10Z"
                  fill="#111111"
                />
                <path
                  d="M11 8.5V11C11 11.1326 10.9473 11.2598 10.8536 11.3535C10.7598 11.4473 10.6326 11.5 10.5 11.5H1.5C1.36739 11.5 1.24021 11.4473 1.14645 11.3535C1.05268 11.2598 1 11.1326 1 11V8.5H0V11C0 11.3978 0.158035 11.7793 0.43934 12.0607C0.720644 12.342 1.10218 12.5 1.5 12.5H10.5C10.8978 12.5 11.2794 12.342 11.5607 12.0607C11.842 11.7793 12 11.3978 12 11V8.5H11Z"
                  fill="#111111"
                />
              </svg>
              <span className="text-[#111] text-sm font-normal leading-[17.787px] tracking-[-0.28px]">
                Download
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
              >
                <path
                  d="M11.6938 5.13116C11.6357 5.07258 11.5665 5.02609 11.4904 4.99436C11.4142 4.96263 11.3325 4.94629 11.25 4.94629C11.1675 4.94629 11.0858 4.96263 11.0096 4.99436C10.9335 5.02609 10.8644 5.07258 10.8063 5.13116L7.94376 7.99366C7.88566 8.05224 7.81653 8.09873 7.74037 8.13046C7.66421 8.16219 7.58251 8.17853 7.50001 8.17853C7.4175 8.17853 7.33581 8.16219 7.25965 8.13046C7.18349 8.09873 7.11436 8.05224 7.05626 7.99366L4.19376 5.13116C4.13566 5.07258 4.06653 5.02609 3.99037 4.99436C3.91421 4.96263 3.83251 4.94629 3.75001 4.94629C3.6675 4.94629 3.58581 4.96263 3.50965 4.99436C3.43348 5.02609 3.36436 5.07258 3.30626 5.13116C3.18985 5.24826 3.12451 5.40667 3.12451 5.57179C3.12451 5.7369 3.18985 5.89531 3.30626 6.01241L6.17501 8.88116C6.52657 9.23228 7.00313 9.4295 7.50001 9.4295C7.99688 9.4295 8.47344 9.23228 8.82501 8.88116L11.6938 6.01241C11.8102 5.89531 11.8755 5.7369 11.8755 5.57179C11.8755 5.40667 11.8102 5.24826 11.6938 5.13116Z"
                  fill="#111111"
                />
              </svg>
            </button>
          )}
          {exportFormats.includes("pdf") && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center space-x-2 opacity-50 cursor-not-allowed"
              title="PDF export requires jsPDF package"
            >
              <FileText className="h-4 w-4" />
              <span>PDF (Not Available)</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
  // Local state for UI pagination
  const [uiCurrentPage, setUiCurrentPage] = useState(1);
  const [uiItemsPerPage, setUiItemsPerPage] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // No UI filtering - all filtering handled by API

  // Determine pagination configuration
  const isBackendPagination =
    paginationType === "backend" || paginationType === "both";
  const isUiPagination = paginationType === "ui" || paginationType === "both";

  const currentPagination = pagination || {
    currentPage: uiCurrentPage,
    totalItems: data.length,
    itemsPerPage: uiItemsPerPage,
    totalPages: Math.ceil(data.length / uiItemsPerPage),
  };

  const currentPage = isBackendPagination
    ? currentPagination.currentPage
    : uiCurrentPage;
  const totalItems = currentPagination.totalItems;
  const itemsPerPage = currentPagination.itemsPerPage;
  const totalPages = currentPagination.totalPages;

  // For API-based filtering, use data as-is (no UI filtering)
  const filteredData = useMemo(() => {
    return data;
  }, [data]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    if (isBackendPagination) {
      return filteredData;
    }
    return filteredData;
  }, [filteredData, isBackendPagination]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      if (isUiPagination) {
        setUiCurrentPage(page);
      }
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (isUiPagination) {
      setUiItemsPerPage(newItemsPerPage);
      setUiCurrentPage(1);
    }
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: unknown) => {
    let filterValue = value;

    // Handle special clear value for dropdowns
    if (value === "__clear__") {
      filterValue = undefined;
    }

    const newFilters = { ...filterValues, [key]: filterValue };
    setFilterValues(newFilters);

    // Don't call onFilterChange here - only update temporary values
    // onFilterChange will be called only when Apply button is clicked
  };

  // Apply filters and close popup
  const handleApplyFilters = () => {
    setIsFilterPopupOpen(false);
    if (onFilterChange) {
      onFilterChange(filterValues);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterValues({});
    if (onFilterChange) {
      onFilterChange({});
    }
    setIsFilterPopupOpen(false);
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = paginatedData.map((item) => {
      const row: Record<string, unknown> = {};
      columns.forEach((col) => {
        if (col.key === "actions") return;

        const value = String(col.key)
          .split(".")
          .reduce((obj: unknown, k: string) => {
            if (obj === undefined || obj === null || typeof obj !== "object")
              return "";
            return (obj as Record<string, unknown>)[k];
          }, item as Record<string, unknown>);

        // Format dates for export consistently as DD/MM/YYYY
        const isDateCol =
          col.filterType === "date" ||
          (typeof value === "string" &&
            /(^\d{4}-\d{2}-\d{2})|(^\d{2}\/\d{2}\/\d{4}$)/.test(value));
        row[col.label] = isDateCol ? toDdMmYyyy(value) : value;
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const fileName =
      exportFileName ||
      `${title.replace(/ /g, "_")}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        // Handle any filter dropdown logic here if needed
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`w-full bg-white py-2 rounded-lg ${className}`}>
      {/* Header Section with Status Tabs and Controls */}
      <div className={`pb-4 mt-2 rounded-t-lg ${headerClassName}`}>
        <div className="flex items-center justify-between space-x-4">
          {title && (
            <h1 className="text-[25.2px] font-bold text-[#2B3674] leading-[31.13px] tracking-[-0.02em] ml-4">
              {title}
            </h1>
          )}

          {showAddButton && (
            <button
              className="inline-flex px-5 py-2.5 justify-center items-center gap-2.5 bg-[#0077B6] rounded-full cursor-pointer hover:bg-[#2f90c3] mr-2"
              onClick={onAddButtonClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <rect width="20" height="20" rx="10" fill="#F4F7FE" />
                <path
                  d="M9.39697 17V4H11.603V17H9.39697ZM4 11.603V9.39697H17V11.603H4Z"
                  fill="#0077B6"
                />
              </svg>
              <span className="text-white text-right font-inter text-sm font-normal leading-normal">
                {addButtonText}
              </span>
            </button>
          )}

          {/* Filters and Export Buttons - Show on same line when no add button */}
          {!showAddButton && (
            <div className="flex items-center justify-end space-x-2 mt-4 mr-2">
              {renderFilterAndExportButtons()}
            </div>
          )}
        </div>

        {/* Filters Row - Show below add button when add button is present and no tabs */}
        {showAddButton && (!showTabs || !tabs || tabs.length === 0) && (
          <div className="flex items-center justify-end space-x-2 mt-4 mr-2">
            {renderFilterAndExportButtons()}
          </div>
        )}

        {/* Tabs and Filters Row - Show below add button when add button is present and tabs exist */}
        {showAddButton && showTabs && tabs && tabs.length > 0 && (
          <div className="flex items-center justify-between space-x-4 mt-4">
            {/* Custom Tabs */}
            <div className="flex space-x-0 ml-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className={`flex items-center space-x-2 px-3 py-2 transition-colors border-b-2 cursor-pointer ${selectedTab === tab.key
                      ? "text-blue-700 border-blue-500 bg-blue-50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.icon && (
                    <span className="flex-shrink-0">{tab.icon}</span>
                  )}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Filter and Export Buttons */}
            <div className="flex items-center justify-end space-x-2 mr-2">
              {renderFilterAndExportButtons()}
            </div>
          </div>
        )}

        {/* Tabs Row - Show when no add button */}
        {!showAddButton && showTabs && tabs && tabs.length > 0 && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex space-x-0 ml-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className={`flex items-center space-x-2 px-3 py-2 transition-colors border-b-2 cursor-pointer ${selectedTab === tab.key
                      ? "text-blue-700 border-blue-500 bg-blue-50"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  {tab.icon && (
                    <span className="flex-shrink-0">{tab.icon}</span>
                  )}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Popup */}
      <FilterPopup
        isOpen={isFilterPopupOpen}
        onClose={() => setIsFilterPopupOpen(false)}
        filters={builtFilters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Table with integrated pagination */}
      <div id="generic-table" className="bg-white rounded-b-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-[#EBF4FB]">
            <TableRow className="border-b border-gray-200 hover:bg-[#EBF4FB]">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0 hover:bg-[#EBF4FB] ${column.className || ""
                    }`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 border-r border-gray-200"
                >
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={`bg-white border-b border-gray-200 hover:bg-gray-50 ${rowClassName}`}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className="px-4 py-3 border-r border-gray-200 last:border-r-0"
                    >
                      {column.key === "actions" && renderActions
                        ? renderActions(item)
                        : column.render
                          ? column.render(
                            String(column.key)
                              .split(".")
                              .reduce((obj: unknown, k: string) => {
                                if (
                                  obj === undefined ||
                                  obj === null ||
                                  typeof obj !== "object"
                                )
                                  return "";
                                return (obj as Record<string, unknown>)[k];
                              }, item as Record<string, unknown>),
                            item
                          )
                          : (() => {
                            const raw = String(column.key)
                              .split(".")
                              .reduce((obj: unknown, k: string) => {
                                if (
                                  obj === undefined ||
                                  obj === null ||
                                  typeof obj !== "object"
                                )
                                  return "";
                                return (obj as Record<string, unknown>)[k];
                              }, item as Record<string, unknown>);
                            const isDateColumn =
                              column.filterType === "date" ||
                              (typeof raw === "string" &&
                                /(^\d{4}-\d{2}-\d{2})|(^\d{2}\/\d{2}\/\d{4}$)/.test(
                                  raw
                                ));
                            const display = isDateColumn
                              ? toDdMmYyyy(raw)
                              : String(raw ?? "");
                            return <span>{display}</span>;
                          })()}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-500 border-r border-gray-200"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Section - Integrated within table */}
        {(totalItems > 0 || (paginationType === "backend" && pagination)) && (
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Rows per page */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Display Rows</span>
                <select
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                  value={itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(Number(e.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Load more button for backend pagination - only show when no regular pagination */}
              {/* Removed Display More button to use regular pagination controls */}

              <div className="text-sm text-gray-600 text-center">
                Showing{" "}
                <span className="font-bold text-black">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-black">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-bold text-black">{totalItems}</span>{" "}
                entries
              </div>

              {/* Pagination controls */}
              <div className="flex items-center space-x-2">
                <span
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`cursor-pointer px-1 text-gray-600 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </span>

                {/* Page numbers */}
                {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 8) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  const isLastItem = i === Math.min(8, totalPages) - 1;

                  return (
                    <span
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`cursor-pointer px-0 ${currentPage === pageNum
                          ? "font-bold text-black text-[14px]"
                          : "text-gray-600 text-[14px]"
                        }`}
                    >
                      {pageNum}
                      {!isLastItem ? "." : ""}
                    </span>
                  );
                })}

                <span
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`cursor-pointer px-1 text-gray-600 ${currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                    }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Items info */}
          </div>
        )}
      </div>
    </div>
  );
}
