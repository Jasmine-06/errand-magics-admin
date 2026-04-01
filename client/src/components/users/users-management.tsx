import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { UserForm } from "./user-form"
import { Plus, User, Trash2 } from "lucide-react"
import type { User as UserType } from "@/types"
import { USER_ROLES } from "@/constants"
import { useToast } from "@/hooks/use-toast"

interface UsersManagementProps {
  users: UserType[]
  loading?: boolean
  onCreateUser: (user: Omit<UserType, "id">) => Promise<void>
  onUpdateUser: (id: string, user: Partial<UserType>) => Promise<void>
  onDeleteUser: (id: string) => Promise<void>
  onRefresh?: () => Promise<void>
}

interface UserWithExportData extends UserType {
  roleLabel?: string
  statusLabel?: string
  lastLoginFormatted?: string
  createdAtFormatted?: string
}

export function UsersManagement({ 
  users, 
  loading, 
  onCreateUser, 
  onUpdateUser, 
  onDeleteUser, 
  onRefresh 
}: UsersManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedRows, setSelectedRows] = useState<UserType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { toast } = useToast()

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchValue === "" || 
      user.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      user.role.toLowerCase().includes(searchValue.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalItems = filteredUsers.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const formatDate = (date: any) => {
    if (!date) return "Never"
    const d = date?.toDate?.() || new Date(date)
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  const columns: Column<UserWithExportData>[] = [
    {
      key: "name",
      title: "User",
      exportable: true,
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-foreground">{record.name}</p>
            <p className="text-sm text-muted-foreground">{record.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Role",
      exportable: false,
      render: (value) => {
        const roleConfig = USER_ROLES.find((r) => r.value === value)
        return (
          <Badge
            className={
              value === "admin"
                ? "bg-blue-100 text-blue-800"
                : value === "manager"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
            }
          >
            {roleConfig?.label || value}
          </Badge>
        )
      },
    },
    {
      key: "isActive",
      title: "Status",
      exportable: false,
      render: (value) => (
        <Badge className={value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      title: "Last Login",
      exportable: false,
      render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
    },
    {
      key: "createdAt",
      title: "Created",
      exportable: false,
      render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
    },
  ]

  const handleEdit = (user: UserType) => {
    setEditingUser(user)
    setShowAddForm(true)
  }

  const handleDelete = async (user: UserType) => {
    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      try {
        await onDeleteUser(user.id)
        // Remove from selection if it was selected
        if (selectedRowKeys.includes(user.id)) {
          const newSelectedKeys = selectedRowKeys.filter(key => key !== user.id)
          const newSelectedRows = selectedRows.filter(row => row.id !== user.id)
          setSelectedRowKeys(newSelectedKeys)
          setSelectedRows(newSelectedRows)
        }
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const handleMultipleDelete = async () => {
    if (selectedRows.length === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedRows.length} selected user(s)? This action cannot be undone.`
    
    if (confirm(confirmMessage)) {
      try {
        await Promise.all(selectedRows.map(user => onDeleteUser(user.id)))
        setSelectedRowKeys([])
        setSelectedRows([])
        toast({
          title: "Success",
          description: `${selectedRows.length} user(s) deleted successfully`,
        })
      } catch (error) {
        console.error("Error deleting users:", error)
        toast({
          title: "Error",
          description: "Failed to delete some users",
          variant: "destructive",
        })
      }
    }
  }

  const handleFormSubmit = async (userData: Omit<UserType, "id">) => {
    if (editingUser) {
      await onUpdateUser(editingUser.id, userData)
    } else {
      await onCreateUser(userData)
    }
    setShowAddForm(false)
    setEditingUser(null)
  }

  const handleFormCancel = () => {
    setShowAddForm(false)
    setEditingUser(null)
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    setCurrentPage(1) // Reset to first page when searching
  }
  const handleSelectionChange = (keys: string[], rows: UserWithExportData[]) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows as UserType[])
  }

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      try {
        await onRefresh()
        toast({
          title: "Success",
          description: "Users data refreshed successfully",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to refresh data",
          variant: "destructive",
        })
      }
    }
  }


  const exportData: UserWithExportData[] = paginatedUsers.map(user => ({
    ...user,
    roleLabel: USER_ROLES.find(r => r.value === user.role)?.label || user.role,
    statusLabel: user.isActive ? "Active" : "Inactive",
    lastLoginFormatted: formatDate(user.lastLogin),
    createdAtFormatted: formatDate(user.createdAt),
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system users and access control</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2 bg-gradient-to-r from-primary to-accent">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <DataTable
        data={exportData}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50, 100],
          onPageChange: handlePageChange,
        }}
        selection={{
          selectedRowKeys,
          onSelectionChange: handleSelectionChange,
          getRowKey: (record) => record.id,
        }}
        actions={{
          onEdit: (record) => handleEdit(record as UserType),
          onDelete: (record) => handleDelete(record as UserType),
        }}
        filters={{
          search: {
            placeholder: "Search users by name, email, or role...",
            onSearch: handleSearch,
          },
          customFilters: [
            {
              key: "role",
              label: "Filter by role",
              options: [
                { label: "All Roles", value: "all" },
                ...USER_ROLES.map((role) => ({
                  label: role.label,
                  value: role.value,
                })),
              ],
              onFilter: (value) => {
                setRoleFilter(value)
                setCurrentPage(1) // Reset to first page when filtering
              },
            },
            {
              key: "status",
              label: "Filter by status",
              options: [
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
              onFilter: (value) => {
                setStatusFilter(value)
                setCurrentPage(1) // Reset to first page when filtering
              },
            },
          ],
        }}
        toolbar={{
          selectedActions: selectedRowKeys.length > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleMultipleDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedRowKeys.length})
            </Button>
          ) : undefined,
        }}
        exportConfig={{
          filename: `users-${new Date().toISOString().split('T')[0]}`,
          sheetName: "Users",
          excludeColumns: ["role", "isActive", "lastLogin", "createdAt"], // Exclude original columns, keep formatted ones
        }}
        onRefresh={handleRefresh}
        originalDataLength={users.length}
        hasActiveFilters={searchValue !== "" || roleFilter !== "all" || statusFilter !== "all"}
        emptyState={{
          title: "No users found",
          description: "Add users to manage system access and permissions",
          action: (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First User
            </Button>
          ),
        }}
      />

      {/* User Form Modal */}
      {showAddForm && <UserForm user={editingUser} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />}
    </div>
  )
}
