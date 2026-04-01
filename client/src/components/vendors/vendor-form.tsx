import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building2, Loader2, X } from "lucide-react"
import type { Category, Vendor } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"

interface VendorFormProps {
  vendor?: Vendor | null
  categories: Category[]
  onSubmit: (vendor: Omit<Vendor, "id">) => Promise<void>
  onCancel: () => void
}

export function VendorForm({ vendor, onSubmit, categories, onCancel }: VendorFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    commission: "",
    category: [] as string[],
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  })

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        location: vendor.location,
        commission: vendor.commission.toString(),
        category: vendor.category || [],
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        email: vendor.email || "",
        address: vendor.address,
      })
    }
  }, [vendor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const vendorData = {
        name: formData.name,
        location: formData.location,
        commission: Number.parseFloat(formData.commission),
        category: formData.category,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        rating: vendor?.rating || 0,
        isActive: vendor?.isActive ?? true,
        totalProducts: vendor?.totalProducts || 0,
        totalOrders: vendor?.totalOrders || 0,
      }

      await onSubmit(vendorData)
    } catch (error: any) {
      console.error("Error saving vendor:", error)
      alert(error.message || "Failed to save vendor. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle multiple category selection
  const handleCategoryToggle = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(categoryName)
        ? prev.category.filter(cat => cat !== categoryName)
        : [...prev.category, categoryName]
    }))
  }

  // Remove category from selection
  const removeCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.filter(cat => cat !== categoryToRemove)
    }))
  }

  const activeCategoriesList = categories.filter((cat) => cat.isActive)

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {vendor ? "Edit Vendor" : "Add New Vendor"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name *</Label>
              <Input
                id="vendorName"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter vendor name"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateFormData("location", e.target.value)}
                placeholder="Enter location"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => updateFormData("contactPerson", e.target.value)}
                placeholder="Enter contact person name"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="Enter phone number"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission (%) *</Label>
              <Input
                id="commission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.commission}
                onChange={(e) => updateFormData("commission", e.target.value)}
                placeholder="0.0"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Multi-select Categories */}
          <div className="space-y-2">
            <Label>Categories * (Select multiple)</Label>
            
            {/* Selected Categories Display */}
            {formData.category.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-muted/50 min-h-[40px]">
                {formData.category.map((categoryName) => (
                  <Badge key={categoryName} variant="secondary" className="flex items-center gap-1">
                    {categoryName}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeCategory(categoryName)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Category Selection Checkboxes */}
            <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {activeCategoriesList.length > 0 ? (
                  activeCategoriesList.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.category.includes(category.name)}
                        onCheckedChange={() => handleCategoryToggle(category.name)}
                        disabled={loading}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                        {category.name}
                        {category.description && (
                          <span className="text-xs text-muted-foreground ml-2">
                            - {category.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No active categories available
                  </p>
                )}
              </div>
            </div>
            
            {formData.category.length === 0 && (
              <p className="text-sm text-destructive">Please select at least one category</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Full Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              placeholder="Enter complete address"
              rows={3}
              disabled={loading}
              required
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || formData.category.length === 0} 
              className="bg-gradient-to-r from-primary to-accent min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                vendor ? "Update Vendor" : "Add Vendor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
