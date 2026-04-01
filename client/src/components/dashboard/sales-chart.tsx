import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@/types";

interface SalesChartProps {
  orders?: Order[];
  loading?: boolean;
}

export function SalesChart({ orders = [], loading }: SalesChartProps) {
  const [timeRange, setTimeRange] = useState("7days");

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

  // Generate dynamic chart data based on orders and time range
  const getChartData = () => {
    const now = new Date();
    let days: Date[] = [];
    let dayLabels: string[] = [];

    switch (timeRange) {
      case "7days":
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          days.push(date);
          dayLabels.push(
            date.toLocaleDateString("en-US", { weekday: "short" })
          );
        }
        break;
      case "30days":
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          days.push(date);
          dayLabels.push(date.getDate().toString());
        }
        break;
      case "3months":
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          days.push(date);
          dayLabels.push(date.toLocaleDateString("en-US", { month: "short" }));
        }
        break;
      default:
        days = [];
        dayLabels = [];
    }

    return days.map((date, index) => {
      let dayOrders: Order[] = [];

      if (timeRange === "3months") {
        // For months, get all orders in that month
        dayOrders = orders.filter((order) => {
          const orderDate = getDateFromTimestamp(order.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        });
      } else {
        // For days, get orders on that specific day
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        dayOrders = orders.filter((order) => {
          const orderDate = getDateFromTimestamp(order.createdAt);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });
      }

      const revenue = dayOrders
        .filter((order) => order.status === "delivered") // Only count delivered orders for revenue
        .reduce((sum, order) => sum + (order.total || 0), 0);
      const orderCount = dayOrders.length;

      return {
        day: dayLabels[index],
        revenue,
        orders: orderCount,
        date: date.toISOString().split("T")[0], // For tooltips
      };
    });
  };

  const chartData = getChartData();
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1); // Minimum 1 to avoid division by zero
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 1); // Minimum 1 to avoid division by zero

  // Calculate period totals
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  // Get period label
  const getPeriodLabel = () => {
    switch (timeRange) {
      case "7days":
        return "Last 7 Days";
      case "30days":
        return "Last 30 Days";
      case "3months":
        return "Last 3 Months";
      default:
        return "Period";
    }
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

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>
          <div className="h-10 bg-muted rounded w-full sm:w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6">
        <div>
          <CardTitle className="text-lg font-semibold">
            Sales Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue and order trends • {getPeriodLabel()}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="w-full h-full p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="text-muted-foreground">Orders</span>
              </div>
            </div>
            {chartData.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No data available
              </span>
            )}
          </div>

          <div className="relative h-48 sm:h-60 flex items-end justify-around gap-1 sm:gap-2 px-1 sm:px-4 overflow-x-auto min-w-0">
            {chartData.length > 0 ? (
              chartData.map((data, index) => (
                <div
                  key={`${data.day}-${index}`}
                  className="flex flex-col items-center gap-1 sm:gap-2 flex-shrink-0"
                  style={{ minWidth: timeRange === "30days" ? "20px" : "32px" }}
                >
                  <div className="flex items-end gap-1 h-36 sm:h-48">
                    {/* Revenue Bar */}
                    <div
                      className="bg-primary rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                      style={{
                        height: `${Math.max(
                          (data.revenue / maxRevenue) *
                            (typeof window !== "undefined" &&
                            window.innerWidth < 640
                              ? 140
                              : 180),
                          2
                        )}px`,
                        width:
                          timeRange === "30days"
                            ? typeof window !== "undefined" &&
                              window.innerWidth < 640
                              ? "6px"
                              : "8px"
                            : typeof window !== "undefined" &&
                              window.innerWidth < 640
                            ? "16px"
                            : "24px",
                      }}
                      title={`Revenue: ${formatCurrency(data.revenue)} on ${
                        data.date
                      }`}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatCurrency(data.revenue)}
                      </div>
                    </div>

                    {/* Orders Bar */}
                    <div
                      className="bg-accent rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                      style={{
                        height: `${Math.max(
                          (data.orders / maxOrders) *
                            (typeof window !== "undefined" &&
                            window.innerWidth < 640
                              ? 140
                              : 180),
                          2
                        )}px`,
                        width:
                          timeRange === "30days"
                            ? typeof window !== "undefined" &&
                              window.innerWidth < 640
                              ? "6px"
                              : "8px"
                            : typeof window !== "undefined" &&
                              window.innerWidth < 640
                            ? "16px"
                            : "24px",
                      }}
                      title={`Orders: ${data.orders} on ${data.date}`}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {data.orders} orders
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium text-muted-foreground truncate ${
                      timeRange === "30days" ? "max-w-4" : "max-w-8"
                    }`}
                  >
                    {data.day}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-36 sm:h-48 w-full">
                <div className="text-center">
                  <div className="text-2xl sm:text-4xl mb-2">📊</div>
                  <p className="text-muted-foreground text-sm">
                    No sales data available
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Orders will appear here once placed
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <p className="text-base sm:text-lg font-bold text-primary">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total Revenue
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-accent/10 rounded-lg">
              <p className="text-base sm:text-lg font-bold text-accent">
                {totalOrders}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total Orders
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          {totalOrders > 0 && (
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-semibold">
                  {formatCurrency(Math.round(totalRevenue / totalOrders))}
                </p>
                <p className="text-muted-foreground">Avg Order</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-semibold">
                  {Math.max(...chartData.map((d) => d.orders))}
                </p>
                <p className="text-muted-foreground">Peak Day</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="font-semibold">
                  {formatCurrency(Math.max(...chartData.map((d) => d.revenue)))}
                </p>
                <p className="text-muted-foreground">Best Revenue</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
