import { useState, useCallback, useMemo } from "react"
import { FirebaseService } from "@/services/firebase-service"

export interface UseDataTableOptions<T> {
  collectionName: string
  pageSize?: number
  initialFilters?: Record<string, any>
  searchFields?: (keyof T)[]
}

export function useDataTable<T>({
  collectionName,
  pageSize = 10,
  initialFilters = {},
  searchFields = [],
}: UseDataTableOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize,
    total: 0,
  })
  const [filters, setFilters] = useState(initialFilters)
  const [searchValue, setSearchValue] = useState("")
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!searchValue || searchFields.length === 0) return data

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = (item as any)[field]
        return value?.toString().toLowerCase().includes(searchValue.toLowerCase())
      }),
    )
  }, [data, searchValue, searchFields])

  // Load data
  const loadData = useCallback(
    async (page = 1, size = pageSize, newFilters = filters) => {
      setLoading(true)
      try {
        const result = await FirebaseService.getPaginated<T>(collectionName, size, undefined, newFilters)

        setData(result.data)
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: size,
          total: result.data.length, // This would need to be updated with actual total count
        }))
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    },
    [collectionName, pageSize, filters],
  )

  // Handle pagination change
  const handlePageChange = useCallback(
    (page: number, size: number) => {
      loadData(page, size)
    },
    [loadData],
  )

  // Handle filter change
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      loadData(1, pagination.pageSize, newFilters)
    },
    [filters, pagination.pageSize, loadData],
  )

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  // Handle selection
  const handleSelectionChange = useCallback((keys: string[], rows: T[]) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }, [])

  // CRUD operations
  const createRecord = useCallback(
    async (record: Omit<T, "id">) => {
      try {
        await FirebaseService.create(collectionName, record)
        loadData(pagination.current, pagination.pageSize)
      } catch (error) {
        console.error("Error creating record:", error)
        throw error
      }
    },
    [collectionName, pagination, loadData],
  )

  const updateRecord = useCallback(
    async (id: string, record: Partial<T>) => {
      try {
        await FirebaseService.update(collectionName, id, record)
        loadData(pagination.current, pagination.pageSize)
      } catch (error) {
        console.error("Error updating record:", error)
        throw error
      }
    },
    [collectionName, pagination, loadData],
  )

  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        await FirebaseService.delete(collectionName, id)
        loadData(pagination.current, pagination.pageSize)
      } catch (error) {
        console.error("Error deleting record:", error)
        throw error
      }
    },
    [collectionName, pagination, loadData],
  )

  return {
    // Data
    data: filteredData,
    loading,
    pagination,
    filters,
    searchValue,
    selectedRowKeys,
    selectedRows,

    // Actions
    loadData,
    handlePageChange,
    handleFilterChange,
    handleSearch,
    handleSelectionChange,
    createRecord,
    updateRecord,
    deleteRecord,

    // Utilities
    refresh: () => loadData(pagination.current, pagination.pageSize),
    clearSelection: () => {
      setSelectedRowKeys([])
      setSelectedRows([])
    },
  }
}
