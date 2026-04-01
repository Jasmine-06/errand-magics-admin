import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Category } from "@/types";
import { DataTable } from "../ui/data-table";
import { formatDate } from "@/lib/formateDate";

interface CategoriesManagementProps {
  categories: Category[];
  loading: boolean;
  onCreateCategory: (categoryData: Omit<Category, "id">) => Promise<void>;
  onUpdateCategory: (
    id: string,
    categoryData: Partial<Category>
  ) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoriesManagement({
  categories,
  loading,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  console.log("Categories data:", categories);

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Paginate filtered categories
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + pageSize
  );

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          ...formData,
        });
      } else {
        await onCreateCategory({
          ...formData,
        });
      }
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      isActive: category.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await onDeleteCategory(id);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const truncateDescription = (description: string | undefined | null) => {
    if (!description || description.trim() === "") return "No description";
    return description.length > 50 
      ? description.slice(0, 50) + "..." 
      : description;
  };

  const columns = [
    {
      key: "name" as keyof Category,
      title: "Category Name",
      render: (value: any, record: Category) => ( 
        <div>
          <div className="font-medium text-foreground">{record.name}</div>
          <div className="text-sm text-muted-foreground">
            {truncateDescription(record.description)}
          </div>
        </div>
      ),
    },
    {
      key: "isActive" as keyof Category,
      title: "Status",
      render: (value: any, record: Category) => ( 
        <Badge variant={record.isActive ? "default" : "secondary"}>
          {record.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt" as keyof Category,
      title: "Created",
      render: (value: any, record: Category) => ( 
        <div className="text-sm text-muted-foreground">
          {formatDate(record.createdAt)}
        </div>
      ),
    },
    {
      key: "updatedAt" as keyof Category,
      title: "Last Updated",
      render: (value: any, record: Category) => ( 
        <div className="text-sm text-muted-foreground">
          {formatDate(record.updatedAt)}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and classifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update category information"
                  : "Add a new category to organize your products"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter category description"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <DataTable
        data={paginatedCategories}
        columns={columns}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredCategories.length,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onPageChange: handlePageChange,
        }}
        actions={{
          onEdit: handleEdit,
          onDelete: (category: Category) => handleDelete(category.id),
        }}
        filters={{
          search: {
            placeholder: "Search categories...",
            onSearch: setSearchValue,
          },
        }}
        emptyState={{
          title: "No categories found",
          description: "Get started by creating your first category",
          action: (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          ),
        }}
      />
    </div>
  );
}
