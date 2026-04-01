import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VendorForm } from "./vendor-form"
import { Plus, Building2, MapPin, User, Phone, Mail} from "lucide-react"
import { DataTable } from "../ui/data-table"
import type { Category, Vendor } from "@/types"
import { formatDate } from "@/lib/formateDate"

interface VendorsManagementProps {
  vendors: Vendor[]
  loading?: boolean
  categories: Category[]
  onCreateVendor: (vendor: Omit<Vendor, "id">) => Promise<void>
  onUpdateVendor: (id: string, vendor: Partial<Vendor>) => Promise<void>
  onDeleteVendor: (id: string) => Promise<void>
}


export function VendorsManagement({
  vendors,
  loading = false,
  categories, 
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
}: VendorsManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    vendor.location.toLowerCase().includes(searchValue.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchValue.toLowerCase()) ||
    vendor.category.some(cat => cat.toLowerCase().includes(searchValue.toLowerCase()))
  )

  // Paginate filtered vendors
  const startIndex = (currentPage - 1) * pageSize
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + pageSize)

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setShowAddForm(true)
  }

  const handleFormSubmit = async (vendorData: Omit<Vendor, "id">) => {
    if (editingVendor) {
      await onUpdateVendor(editingVendor.id, vendorData)
    } else {
      await onCreateVendor(vendorData)
    }
    setShowAddForm(false)
    setEditingVendor(null)
  }

  const handleFormCancel = () => {
    setShowAddForm(false)
    setEditingVendor(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      try {
        await onDeleteVendor(id)
      } catch (error) {
        console.error("Error deleting vendor:", error)
      }
    }
  }

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  const columns = [
    {
      key: "name" as keyof Vendor,
      title: "Vendor Details",
      render: (value: any, vendor: Vendor) => (
        <div>
          <div className="font-medium text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {vendor.name}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {vendor.location}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contactPerson" as keyof Vendor,
      title: "Contact Information",
      render: (value: any, vendor: Vendor) => (
        <div>
          <div className="font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            {vendor.contactPerson}
          </div>
          <div className="text-sm text-muted-foreground space-y-1 mt-1">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {vendor.phone}
            </div>
            {vendor.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {vendor.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category" as keyof Vendor,
      title: "Categories",
      render: (value: any, vendor: Vendor) => (
        <div className="flex flex-wrap gap-1">
          {vendor.category.map((cat, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "commission" as keyof Vendor,
      title: "Commission",
      render: (value: any, vendor: Vendor) => (
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{vendor.commission}%</div>
        </div>
      ),
    },
    {
      key: "stats" as keyof Vendor,
      title: "Statistics",
      render: (value: any, vendor: Vendor) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{vendor.totalProducts || 0}</span>{" "}
            <span className="text-muted-foreground">Products</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{vendor.totalOrders || 0}</span>{" "}
            <span className="text-muted-foreground">Orders</span>
          </div>
        </div>
      ),
    },
    {
      key: "isActive" as keyof Vendor,
      title: "Status",
      render: (value: any, vendor: Vendor) => (
        <Badge variant={vendor.isActive ? "default" : "secondary"}>
          {vendor.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt" as keyof Vendor,
      title: "Created",
      render: (value: any, vendor: Vendor) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(vendor.createdAt)}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground">Manage your supplier network and partnerships</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)} 
          className="gap-2 bg-gradient-to-r from-primary to-accent"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </Button>
      </div>

      {/* Vendors Table */}
      <DataTable
        data={paginatedVendors}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredVendors.length,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onPageChange: handlePageChange
        }}
        actions={{
          onEdit: handleEdit,
          onDelete: (vendor: Vendor) => handleDelete(vendor.id),
        }}
        filters={{
          search: {
            placeholder: "Search vendors...",
            onSearch: setSearchValue,
          }
        }}
        emptyState={{
          title: "No vendors found",
          description: "Start building your supplier network by adding vendors",
          action: (
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vendor
            </Button>
          )
        }}
      />

      {/* Vendor Form Modal */}
      {showAddForm && (
        <VendorForm 
          vendor={editingVendor} 
          categories={categories} 
          onSubmit={handleFormSubmit} 
          onCancel={handleFormCancel} 
        />
      )}
    </div>
  )
}
