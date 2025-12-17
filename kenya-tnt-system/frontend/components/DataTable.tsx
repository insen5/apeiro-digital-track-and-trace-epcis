"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
// import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface TableProps<T> {
  data: T[];
  columns: {
    label: string;
    key: string;
    className?: string;
    filterOptions?: {
      type: "dropdown";
      options: Array<{ value: string; label: string }>;
    };
  }[];
  renderRow: (item: T) => React.ReactNode;
  title: string;
  showFilters?: boolean;
  loading?: boolean;
  filters?: Array<{
    key: string;
    label: string;
    type?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  pagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  extraHeaderContent?: React.ReactNode;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  showExportButton?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  renderRow,
  title = "Data Table",
  showFilters = false,
  filters = [],
  pagination = false,
  itemsPerPage = 5,
  currentPage: controlledCurrentPage,
  extraHeaderContent,
  loading = false,
  onPageChange,
  totalItems: totalItemsFromParent,
  showExportButton = false,
}: TableProps<T> & {
  extraHeaderContent?: React.ReactNode;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  showExportButton?: boolean;
}) {
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tempFilterValues, setTempFilterValues] = useState<
    Record<string, string>
  >({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Re-introduce internal state for uncontrolled mode
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);

  const filterRef = useRef<HTMLDivElement>(null);

  // Determine if the component is controlled or uncontrolled
  const isControlled = controlledCurrentPage !== undefined;
  const currentPage = isControlled
    ? controlledCurrentPage
    : internalCurrentPage;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleApplyFilters = () => {
    setFilterValues(tempFilterValues);
    if (!isControlled) {
      setInternalCurrentPage(1);
    }
    setShowFilterDropdown(false);
  };

  const handleClearFilters = () => {
    setTempFilterValues({});
    setFilterValues({});
    if (!isControlled) {
      setInternalCurrentPage(1);
    }
    setShowFilterDropdown(false);
  };

  const handleTempFilterChange = (key: string, value: string) => {
    setTempFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const filteredData = useMemo(() => {
    if (!showFilters || Object.keys(filterValues).length === 0) {
      return data;
    }
    return data.filter((item) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;

        // Special case for Quantity filtering
        if (key === "productRow.quantity") {
          const productRowsLength = item.productRows?.length || 0;
          return productRowsLength.toString() === value;
        }

        // Handle nested object properties
        const itemValue = key.split(".").reduce((obj, k) => {
          if (obj === undefined || obj === null) return "";
          return obj[k];
        }, item);

        // Handle arrays (like productRows)
        if (Array.isArray(itemValue)) {
          return itemValue.length.toString().includes(value.toLowerCase());
        }

        // Handle date comparison
        if (key === "expectedDeliveryDate") {
          try {
            // Convert the filter value from DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = value.split("/");
            const filterDate = new Date(`${year}-${month}-${day}`);

            // Convert the item's date string to YYYY-MM-DD
            const itemDateStr = String(itemValue);
            const itemDate = new Date(itemDateStr);

            // Compare dates by their YYYY-MM-DD format
            return (
              itemDate.toISOString().split("T")[0] ===
              filterDate.toISOString().split("T")[0]
            );
          } catch (error) {
            console.error("Error comparing dates:", error);
            return false;
          }
        }

        // Convert both values to strings and make them lowercase for case-insensitive comparison
        const stringValue = String(itemValue || "").toLowerCase();
        const filterValue = value.toLowerCase();

        // Check if the string value contains the filter value
        return stringValue.includes(filterValue);
      });
    });
  }, [data, filterValues, showFilters]);

  // Pagination logic now uses the determined 'currentPage'
  const totalItems = totalItemsFromParent ?? filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // If totalItemsFromParent is provided, we assume server-side pagination
  // and the 'data' prop already contains the correctly paginated data.
  const paginatedData = totalItemsFromParent
    ? filteredData
    : filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      // If uncontrolled, update internal state
      if (!isControlled) {
        setInternalCurrentPage(page);
      }
      // Always notify parent if a handler is provided
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  const handleFilterDropdownToggle = () => {
    if (!showFilterDropdown) {
      setTempFilterValues(filterValues);
    }
    setShowFilterDropdown(!showFilterDropdown);
  };

  const exportToCSV = () => {
    const csvData = filteredData.map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        // Skip the action column
        if (col.key === "action") return;

        let value: string | number = "";
        // Special case for manufacturer data
        if (title === "Recent Batches") {
          switch (col.key) {
            case "sno":
              value = item.id || "";
              break;
            case "name":
              value = item.customer || "";
              break;
            case "manufacturer":
              value = item.userDetails?.email || "";
              break;
            case "qty":
              value = item.productRows?.length || 0;
              break;
            case "expectedDeliveryDate":
              value = item.expectedDeliveryDate || "";
              break;
            default:
              value = "";
          }
        } else {
          // Handle nested properties for other cases
          const nestedValue = col.key.split(".").reduce((obj, k) => {
            if (obj === undefined || obj === null) return "";
            return obj[k];
          }, item);
          value = String(nestedValue || "");
        }

        row[col.label] = value;
      });
      return row;
    });

    const csvHeaders =
      columns
        .filter((col) => col.key !== "action")
        .map((col) => col.label)
        .join(",") + "\n";

    const csvRows = csvData
      .map((row) =>
        columns
          .filter((col) => col.key !== "action")
          .map((col) => row[col.label])
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvHeaders + csvRows], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(
      blob,
      `${title.replace(/ /g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // const exportToExcel = () => {
  //   const excelData = filteredData.map((item) => {
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     const row: Record<string, any> = {};
  //     columns.forEach((col) => {
  //       // Skip the action column
  //       if (col.key === "action") return;

  //       let value: string | number = "";
  //       // Special case for manufacturer data
  //       if (title === "Recent Batches") {
  //         switch (col.key) {
  //           case "sno":
  //             value = item.id || "";
  //             break;
  //           case "name":
  //             value = item.customer || "";
  //             break;
  //           case "manufacturer":
  //             value = item.userDetails?.email || "";
  //             break;
  //           case "qty":
  //             value = item.productRows?.length || 0;
  //             break;
  //           case "expectedDeliveryDate":
  //             value = item.expectedDeliveryDate || "";
  //             break;
  //           default:
  //             value = "";
  //         }
  //       } else {
  //         // Handle nested properties for other cases
  //         const nestedValue = col.key.split(".").reduce((obj, k) => {
  //           if (obj === undefined || obj === null) return "";
  //           return obj[k];
  //         }, item);
  //         value = String(nestedValue || "");
  //       }

  //       row[col.label] = value;
  //     });
  //     return row;
  //   });

  //   const worksheet = XLSX.utils.json_to_sheet(excelData);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  //   XLSX.writeFile(
  //     workbook,
  //     `${title.replace(/ /g, "_")}_${new Date()
  //       .toISOString()
  //       .slice(0, 10)}.xlsx`
  //   );
  // };

  return (
    <div className="w-full overflow-scroll min-h-[300px]">
      <div className="flex justify-between items-center px-1 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
          {extraHeaderContent && <div>{extraHeaderContent}</div>}

          {showFilters && (
            <div className="relative" ref={filterRef}>
              {Object.keys(filterValues).length > 0 && (
                <div className="bg-green-600 absolute -top-2 -right-2 text-white text-xs font-bold px-1.5 py-1 rounded-full min-w-[18px] h-5 flex items-center justify-center shadow-md border-1 border-white">
                  {Object.keys(filterValues).length}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilterDropdownToggle}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg z-10 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {filters.map((filter) => (
                      <div key={filter.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {filter.label}
                        </label>
                        {filter.type === "dropdown" && filter.options ? (
                          <select
                            className="w-full p-2 border rounded"
                            value={tempFilterValues[filter.key] || ""}
                            onChange={(e) =>
                              handleTempFilterChange(filter.key, e.target.value)
                            }
                          >
                            <option value="">All</option>
                            {filter.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : filter.type === "date" ? (
                          <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={
                              tempFilterValues[filter.key]
                                ? tempFilterValues[filter.key]
                                    .split("/")
                                    .reverse()
                                    .join("-")
                                : ""
                            }
                            onChange={(e) => {
                              const date = e.target.value;
                              if (date) {
                                // Convert YYYY-MM-DD to DD/MM/YYYY
                                const [year, month, day] = date.split("-");
                                const formattedDate = `${day}/${month}/${year}`;
                                handleTempFilterChange(
                                  filter.key,
                                  formattedDate
                                );
                              } else {
                                handleTempFilterChange(filter.key, "");
                              }
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={tempFilterValues[filter.key] || ""}
                            onChange={(e) =>
                              handleTempFilterChange(filter.key, e.target.value)
                            }
                            placeholder={`Enter ${filter.label}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyFilters}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {showExportButton && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          )}
          {/* <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button> */}
        </div>
      </div>
      <Table className="border rounded">
        <TableHeader className="bg-gray-100">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${column.className}`}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <TableRow
                key={index}
                className="bg-white border-none hover:bg-gray-50"
              >
                {renderRow(item)}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-4">
                No data found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination && totalItems > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{" "}
            {totalItems} entries
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  className={`cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      : "bg-transparent text-gray-400"
                  }`}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
