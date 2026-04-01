import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { OrderDetails } from "./order-details";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import type { Order } from "@/types";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/constants";

interface OrdersManagementProps {
  orders: Order[];
  loading?: boolean;
  onUpdateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<void>;
  onUpdatePaymentVerification: (
    orderId: string,
    status: "verified" | "rejected",
    reason?: string
  ) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

interface OrderWithExportData extends Order {
  customerInfo: string;
  itemsInfo: string;
  paymentInfo: string;
  deliveryInfo: string;
  orderDate: string;
}

export function OrdersManagement({
  orders,
  loading,
  onUpdateOrderStatus,
  onUpdatePaymentVerification,
  onRefresh,
}: OrdersManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Order[]>([]);

  // Helper function to safely convert timestamp to Date
  const getDateFromTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date(0);

    // If it's already a Date object
    if (timestamp instanceof Date) return timestamp;

    // If it's a Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }

    // If it's a string or number, try to create Date
    return new Date(timestamp);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: any) => {
    const d = getDateFromTimestamp(date);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  // Get date for filtering - FIXED
  const getOrderDate = (order: Order): Date => {
    return getDateFromTimestamp(order.createdAt);
  };

  // Date filter logic
  const matchesDateFilter = (order: Order): boolean => {
    if (dateFilter === "all") return true;

    const orderDate = getOrderDate(order);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "today":
        return orderDate >= today;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate >= yesterday && orderDate < today;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return orderDate >= weekStart;
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return orderDate >= monthStart;
      default:
        return true;
    }
  };

  // Filter orders based on all criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      const matchesSearch =
        searchValue === "" ||
        order.customerName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.customerPhone?.includes(searchValue) ||
        order.orderNumber?.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.customerEmail?.toLowerCase().includes(searchValue.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      // Payment method filter
      const matchesPaymentMethod =
        paymentMethodFilter === "all" ||
        order.paymentMethod === paymentMethodFilter;

      // Verification filter
      const matchesVerification =
        verificationFilter === "all" ||
        (order.paymentDetails?.verificationStatus || "pending") ===
          verificationFilter;

      // Date filter
      const matchesDate = matchesDateFilter(order);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPaymentMethod &&
        matchesVerification &&
        matchesDate
      );
    });
  }, [
    orders,
    searchValue,
    statusFilter,
    paymentMethodFilter,
    verificationFilter,
    dateFilter,
  ]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  // Get verification status badge
  const getVerificationBadge = (order: Order) => {
    const verification = order.paymentDetails?.verificationStatus || "pending";

    let color = "bg-yellow-100 text-yellow-800";
    let icon = <AlertCircle className="w-3 h-3 mr-1" />;

    if (verification === "verified") {
      color = "bg-green-100 text-green-800";
      icon = <CheckCircle className="w-3 h-3 mr-1" />;
    } else if (verification === "rejected") {
      color = "bg-red-100 text-red-800";
      icon = <XCircle className="w-3 h-3 mr-1" />;
    }

    return (
      <Badge className={color}>
        {icon}
        {verification === "verified"
          ? "Verified"
          : verification === "rejected"
          ? "Rejected"
          : "Pending"}
      </Badge>
    );
  };

  // Table columns
  const columns: Column<OrderWithExportData>[] = [
    {
      key: "orderNumber",
      title: "Order #",
      exportable: true,
      render: (_, record) => (
        <span className="font-mono text-sm font-medium">
          #{record.orderNumber || "N/A"}
        </span>
      ),
    },
    {
      key: "customerInfo",
      title: "Customer",
      exportable: true,
      render: (_, record) => (
        <div>
          <p className="font-medium text-foreground">
            {record.customerName || "Unknown"}
          </p>
          <p className="text-sm text-muted-foreground">
            {record.customerPhone || "No phone"}
          </p>
          {record.customerEmail && (
            <p className="text-xs text-muted-foreground">
              {record.customerEmail}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "itemsInfo",
      title: "Items",
      exportable: true,
      render: (_, record) => (
        <div className="space-y-1">
          {record.items?.slice(0, 2).map((item: any, index: number) => (
            <div key={index} className="text-sm">
              <span className="font-medium">{item.quantity || 0}×</span>{" "}
              {item.productName || "Unknown Item"}
            </div>
          )) || <span className="text-muted-foreground text-sm">No items</span>}
          {record.items && record.items.length > 2 && (
            <p className="text-xs text-muted-foreground">
              +{record.items.length - 2} more items
            </p>
          )}
        </div>
      ),
    },
    {
      key: "total",
      title: "Total",
      exportable: true,
      render: (value) => (
        <span className="font-medium">{formatCurrency(value || 0)}</span>
      ),
    },
    {
      key: "paymentInfo",
      title: "Payment",
      exportable: true,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {record.paymentMethod === "cash_on_delivery"
              ? "Cash on Delivery"
              : record.paymentMethod === "upi_online"
              ? "UPI Online"
              : record.paymentMethod || "Unknown"}
          </div>
          {getVerificationBadge(record)}
        </div>
      ),
    },
    {
      key: "status",
      title: "Order Status",
      exportable: true,
      render: (value) => getStatusBadge(value || "pending"),
    },
    {
      key: "deliveryInfo",
      title: "Delivery",
      exportable: true,
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium capitalize">
            {record.deliverySlot?.type || "Standard"}
          </div>
          <div className="text-muted-foreground">
            {record.deliverySlot?.estimatedTime
              ? formatDate(record.deliverySlot.estimatedTime)
              : "TBD"}
          </div>
          {record.deliverySlot?.fee && record.deliverySlot.fee > 0 && (
            <div className="text-xs text-muted-foreground">
              Fee: {formatCurrency(record.deliverySlot.fee)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "orderDate",
      title: "Order Date",
      exportable: true,
      render: (_, record) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(record.createdAt)}
        </span>
      ),
    },
  ];

  // Handle view order
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Handle selection change
  const handleSelectionChange = (
    keys: string[],
    rows: OrderWithExportData[]
  ) => {
    setSelectedRowKeys(keys);
    setSelectedRows(rows as Order[]);
  };

  // Prepare data for export and pagination
  const exportData: OrderWithExportData[] = filteredOrders.map((order) => ({
    ...order,
    customerInfo: `${order.customerName || "Unknown"} - ${
      order.customerPhone || "No phone"
    }${order.customerEmail ? ` - ${order.customerEmail}` : ""}`,
    itemsInfo:
      order.items
        ?.map(
          (item) =>
            `${item.quantity || 0}× ${item.productName || "Unknown Item"}`
        )
        .join(", ") || "No items",
    paymentInfo: `${
      order.paymentMethod === "cash_on_delivery"
        ? "Cash on Delivery"
        : order.paymentMethod === "upi_online"
        ? "UPI Online"
        : order.paymentMethod || "Unknown"
    } - ${order.paymentDetails?.verificationStatus || "pending"}`,
    deliveryInfo: `${order.deliverySlot?.type || "Standard"} - ${
      order.deliverySlot?.estimatedTime
        ? formatDate(order.deliverySlot.estimatedTime)
        : "TBD"
    }`,
    orderDate: formatDate(order.createdAt),
  }));

  // Paginate data
  const totalItems = exportData.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = exportData.slice(startIndex, endIndex);

  // Calculate order statistics
  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) =>
      ["placed", "confirmed", "preparing"].includes(order.status || "pending")
    ).length;

    const deliveredToday = orders.filter((order) => {
      const today = new Date();
      const orderDate = getOrderDate(order);
      return (
        order.status === "delivered" &&
        orderDate.toDateString() === today.toDateString()
      );
    }).length;

    const pendingPayments = orders.filter(
      (order) =>
        (order.paymentDetails?.verificationStatus || "pending") === "pending"
    ).length;

    const todayRevenue = orders
      .filter((order) => {
        const today = new Date();
        const orderDate = getOrderDate(order);
        return (
          order.status === "delivered" &&
          orderDate.toDateString() === today.toDateString()
        );
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      deliveredToday,
      pendingPayments,
      todayRevenue,
    };
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Order Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage customer orders, payments, and deliveries
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats.totalOrders}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Orders
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats.pendingOrders}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Delivered Today
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats.deliveredToday}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {orderStats.pendingPayments}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(orderStats.todayRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <DataTable
        data={paginatedData}
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
          getRowKey: (record) => record.id || "",
        }}
        actions={{
          onView: handleViewOrder,
          customActions: [
            {
              key: "status",
              label: "Update Status",
              onClick: (record) => {
                setSelectedOrder(record as Order);
              },
            },
          ],
        }}
        filters={{
          search: {
            placeholder: "Search by order number, customer name or phone...",
            onSearch: handleSearch,
          },
          customFilters: [
            {
              key: "status",
              label: "Filter by Order Status",
              options: [
                { label: "All Orders", value: "all" },
                ...ORDER_STATUSES.map((status) => ({
                  label: status.label,
                  value: status.value,
                })),
              ],
              onFilter: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              },
            },
            {
              key: "paymentMethod",
              label: "Filter by Payment Method",
              options: [
                { label: "All Methods", value: "all" },
                { label: "Cash on Delivery", value: "cash_on_delivery" },
                { label: "UPI Online", value: "upi_online" },
              ],
              onFilter: (value) => {
                setPaymentMethodFilter(value);
                setCurrentPage(1);
              },
            },
            {
              key: "verification",
              label: "Filter by Verification Status",
              options: [
                { label: "All Status", value: "all" },
                { label: "Pending Verification", value: "pending" },
                { label: "Verified", value: "verified" },
                { label: "Rejected", value: "rejected" },
              ],
              onFilter: (value) => {
                setVerificationFilter(value);
                setCurrentPage(1);
              },
            },
            {
              key: "date",
              label: "Filter by Date",
              options: [
                { label: "All Time", value: "all" },
                { label: "Today", value: "today" },
                { label: "Yesterday", value: "yesterday" },
                { label: "This Week", value: "week" },
                { label: "This Month", value: "month" },
              ],
              onFilter: (value) => {
                setDateFilter(value);
                setCurrentPage(1);
              },
            },
          ],
        }}
        exportConfig={{
          filename: `orders-${new Date().toISOString().split("T")[0]}`,
          sheetName: "Orders",
          excludeColumns: ["items", "paymentDetails", "deliverySlot"],
        }}
        onRefresh={onRefresh}
        originalDataLength={orders.length}
        hasActiveFilters={
          searchValue !== "" ||
          statusFilter !== "all" ||
          paymentMethodFilter !== "all" ||
          verificationFilter !== "all" ||
          dateFilter !== "all"
        }
        emptyState={{
          title: "No orders found",
          description:
            "Orders will appear here once customers start placing them",
        }}
      />

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={onUpdateOrderStatus}
          onPaymentVerificationUpdate={onUpdatePaymentVerification}
        />
      )}
    </div>
  );
}
