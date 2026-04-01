import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, IndianRupee, Package2, Clock, ArrowUp, ArrowDown } from "lucide-react"
import type { DashboardMetrics } from "@/types"

interface DashboardMetricsProps {
  metrics: DashboardMetrics
  loading?: boolean
}

export function DashboardMetricsGrid({ metrics, loading }: DashboardMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const metricsData = [
    {
      title: "Total Orders",
      value: metrics.totalOrders.toLocaleString(),
      change: `+${metrics.orderGrowth.toFixed(1)}%`,
      changeType: metrics.orderGrowth >= 0 ? "positive" : "negative",
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
      description: "Orders this month",
    },
    {
      title: "Daily Revenue",
      value: formatCurrency(metrics.dailyRevenue),
      change: `+${metrics.revenueGrowth.toFixed(1)}%`,
      changeType: metrics.revenueGrowth >= 0 ? "positive" : "negative",
      icon: IndianRupee,
      color: "from-green-500 to-green-600",
      description: "Compared to yesterday",
    },
    {
      title: "Active Products",
      value: metrics.totalProducts.toLocaleString(),
      change: "+5 this week",
      changeType: "positive",
      icon: Package2,
      color: "from-purple-500 to-purple-600",
      description: "In catalog",
    },
    {
      title: "Pending Orders",
      value: metrics.pendingOrders.toLocaleString(),
      change: "Needs attention",
      changeType: metrics.pendingOrders > 10 ? "negative" : "neutral",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      description: "Awaiting processing",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                  <div className="h-3 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="w-16 h-16 bg-muted rounded-2xl"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm flex items-center gap-1 ${
                          metric.changeType === "positive"
                            ? "text-green-600"
                            : metric.changeType === "negative"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {metric.changeType === "positive" && <ArrowUp className="w-3 h-3" />}
                        {metric.changeType === "negative" && <ArrowDown className="w-3 h-3" />}
                        {metric.change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
