"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
  FileDown,
  FileSpreadsheet,
  SearchX,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Column<T> {
  key: keyof T | string
  title: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: "left" | "center" | "right"
  exportable?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    onPageChange: (page: number, pageSize: number) => void
  }
  selection?: {
    selectedRowKeys: string[]
    onSelectionChange: (selectedRowKeys: string[], selectedRows: T[]) => void
    getRowKey: (record: T) => string
  }
  actions?: {
    onView?: (record: T) => void
    onEdit?: (record: T) => void
    onDelete?: (record: T) => void
    customActions?: Array<{
      key: string
      label: string
      icon?: React.ReactNode
      onClick: (record: T) => void
      disabled?: (record: T) => boolean
    }>
  }
  filters?: {
    search?: {
      placeholder?: string
      onSearch: (value: string) => void
    }
    customFilters?: Array<{
      key: string
      label: string
      options: Array<{ label: string; value: string }>
      onFilter: (value: string) => void
    }>
  }
  toolbar?: {
    title?: string
    description?: string
    actions?: React.ReactNode
    selectedActions?: React.ReactNode
  }
  emptyState?: {
    title: string
    description: string
    action?: React.ReactNode
  }
  onRefresh?: () => Promise<void>
  exportConfig?: {
    filename?: string
    sheetName?: string
    excludeColumns?: string[]
  }
  originalDataLength?: number
  hasActiveFilters?: boolean
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  selection,
  actions,
  filters,
  toolbar,
  emptyState,
  onRefresh,
  exportConfig,
  originalDataLength = 0,
  hasActiveFilters = false,
  className,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key]
      const bValue = (b as any)[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        }
      }
      return { key, direction: "asc" }
    })
  }

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return

    if (checked) {
      const allKeys = data.map(selection.getRowKey)
      selection.onSelectionChange(allKeys, data)
    } else {
      selection.onSelectionChange([], [])
    }
  }

  const handleSelectRow = (record: T, checked: boolean) => {
    if (!selection) return

    const key = selection.getRowKey(record)
    let newSelectedKeys = [...selection.selectedRowKeys]

    if (checked) {
      newSelectedKeys.push(key)
    } else {
      newSelectedKeys = newSelectedKeys.filter((k) => k !== key)
    }

    const selectedRows = data.filter((item) => newSelectedKeys.includes(selection.getRowKey(item)))

    selection.onSelectionChange(newSelectedKeys, selectedRows)
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return
    
    setRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (filters?.search?.onSearch) {
      filters.search.onSearch(value)
    }
  }

  // Get exportable data
  const getExportableData = () => {
    const exportableColumns = columns.filter(col => 
      col.exportable !== false && 
      !exportConfig?.excludeColumns?.includes(col.key as string)
    )

    const headers = exportableColumns.map(col => col.title)
    
    const rows = data.map(record => 
      exportableColumns.map(col => {
        const value = (record as any)[col.key]
        
        if (value === null || value === undefined) return ""
        if (typeof value === "boolean") return value ? "Yes" : "No"
        if (typeof value === "object" && value.toString) return value.toString()
        if (Array.isArray(value)) return value.join(", ")
        
        return String(value)
      })
    )

    return { headers, rows }
  }

  // Download CSV
  const downloadCSV = () => {
    setExporting(true)
    try {
      const { headers, rows } = getExportableData()
      const csvContent = [
        headers.join(","),
        ...rows.map(row => 
          row.map(cell => 
            typeof cell === "string" && (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          ).join(",")
        )
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      link.setAttribute("href", url)
      link.setAttribute("download", `${exportConfig?.filename || "data"}.csv`)
      link.style.visibility = "hidden"
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading CSV:", error)
    } finally {
      setExporting(false)
    }
  }

  // Download Excel
  const downloadExcel = async () => {
    setExporting(true)
    try {
      const XLSX = await import("xlsx")
      
      const { headers, rows } = getExportableData()
      const worksheetData = [headers, ...rows]
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      
      const colWidths = headers.map(() => ({ wch: 15 }))
      worksheet["!cols"] = colWidths
      
      XLSX.utils.book_append_sheet(
        workbook, 
        worksheet, 
        exportConfig?.sheetName || "Data"
      )
      
      XLSX.writeFile(workbook, `${exportConfig?.filename || "data"}.xlsx`)
    } catch (error) {
      console.error("Error downloading Excel:", error)
    } finally {
      setExporting(false)
    }
  }

  // Render empty table row
  const renderEmptyTableRow = () => {
    const colSpan = (selection ? 1 : 0) + columns.length + (actions ? 1 : 0)
    
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-24 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            {hasActiveFilters ? (
              <>
                <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No matching results</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No items match your current search and filter criteria.
                  <br />
                  Try adjusting your search terms or clearing filters.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchValue("")
                      if (filters?.search?.onSearch) {
                        filters.search.onSearch("")
                      }
                    }}
                  >
                    Clear Search
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {emptyState?.title || "No data available"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {emptyState?.description || "No items to display"}
                </p>
                {emptyState?.action}
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  //  Render pagination
  const renderPagination = () => {
    if (!pagination) return null

    const { current, pageSize, total, showSizeChanger, pageSizeOptions, onPageChange } = pagination
    const totalPages = Math.ceil(total / pageSize)
    const startItem = (current - 1) * pageSize + 1
    const endItem = Math.min(current * pageSize, total)

    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {total} entries
          </p>

          {showSizeChanger && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageChange(1, Number.parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(pageSizeOptions || [10, 20, 50, 100]).map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onPageChange(1, pageSize)} disabled={current === 1}>
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(current - 1, pageSize)}
            disabled={current === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber
              if (totalPages <= 5) {
                pageNumber = i + 1
              } else if (current <= 3) {
                pageNumber = i + 1
              } else if (current >= totalPages - 2) {
                pageNumber = totalPages - 4 + i
              } else {
                pageNumber = current - 2 + i
              }

              return (
                <Button
                  key={pageNumber}
                  variant={current === pageNumber ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(pageNumber, pageSize)}
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(current + 1, pageSize)}
            disabled={current === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages, pageSize)}
            disabled={current === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Render skeleton loading
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {selection && (
                    <TableHead className="w-12">
                      <Skeleton className="h-4 w-4" />
                    </TableHead>
                  )}
                  {columns.map((_, index) => (
                    <TableHead key={index}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead>
                      <Skeleton className="h-4 w-16" />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {selection && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      {pagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return renderSkeleton()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {toolbar && (
        <div className="flex items-center justify-between">
          <div>
            {toolbar.title && <h2 className="text-xl font-semibold text-foreground">{toolbar.title}</h2>}
            {toolbar.description && <p className="text-sm text-muted-foreground">{toolbar.description}</p>}
          </div>
          {toolbar.actions}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {filters?.search && (
          <div className="relative flex-1 min-w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={filters.search.placeholder || "Search..."}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {filters?.customFilters?.map((filter) => (
          <Select key={filter.key} onValueChange={filter.onFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing || !onRefresh}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>

        {/* Download Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={exporting || (data.length === 0 && originalDataLength === 0)}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={downloadCSV} 
              disabled={exporting || (data.length === 0 && originalDataLength === 0)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={downloadExcel} 
              disabled={exporting || (data.length === 0 && originalDataLength === 0)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Download Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selection Info */}
      {selection && selection.selectedRowKeys.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">{selection.selectedRowKeys.length} item(s) selected</span>
          <div className="flex items-center gap-2">
            {toolbar?.selectedActions}
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {selection && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={data.length > 0 && selection.selectedRowKeys.length === data.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                        disabled={data.length === 0}
                      />
                    </TableHead>
                  )}

                  {columns.map((column) => (
                    <TableHead
                      key={column.key as string}
                      className={`${column.width ? `w-${column.width}` : ""} ${
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {column.sortable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 font-medium"
                          onClick={() => handleSort(column.key as string)}
                          disabled={data.length === 0}
                        >
                          {column.title}
                          {sortConfig?.key === column.key && (
                            <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                          )}
                        </Button>
                      ) : (
                        column.title
                      )}
                    </TableHead>
                  ))}

                  {actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.length === 0 ? (
                  renderEmptyTableRow()
                ) : (
                  sortedData.map((record, index) => {
                    const rowKey = selection?.getRowKey(record) || index.toString()
                    const isSelected = selection?.selectedRowKeys.includes(rowKey) || false

                    return (
                      <TableRow key={rowKey} className={`hover:bg-muted/50 ${isSelected ? "bg-muted/30" : ""}`}>
                        {selection && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectRow(record, e.target.checked)}
                              className="rounded"
                            />
                          </TableCell>
                        )}

                        {columns.map((column) => (
                          <TableCell
                            key={column.key as string}
                            className={
                              column.align === "center"
                                ? "text-center"
                                : column.align === "right"
                                  ? "text-right"
                                  : "text-left"
                            }
                          >
                            {column.render
                              ? column.render((record as any)[column.key], record, index)
                              : (record as any)[column.key]}
                          </TableCell>
                        ))}

                        {actions && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {actions.onView && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => actions.onView!(record)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}

                              {actions.onEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => actions.onEdit!(record)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}

                              {actions.onDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => actions.onDelete!(record)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Pagination - Restored */}
      {pagination && <div className="mt-4">{renderPagination()}</div>}
    </div>
  )
}
