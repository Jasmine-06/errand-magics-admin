import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ORDER_STATUSES,DEFAULT_CATEGORIES } from "@/constants"
import { Target, Star, Clock, RefreshCw } from "lucide-react"


interface AnalyticsProps {
  loading?: boolean
}

export function Analytics({ loading }: AnalyticsProps) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground">Comprehensive business analytics and performance insights</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">3.2%</p>
                <p className="text-sm text-green-600">+0.5% from last month</p>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-foreground">4.8/5</p>
                <p className="text-sm text-green-600">+0.2 from last month</p>
              </div>
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-foreground">28 min</p>
                <p className="text-sm text-red-600">+3 min from last month</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Return Rate</p>
                <p className="text-2xl font-bold text-foreground">2.1%</p>
                <p className="text-sm text-green-600">-0.3% from last month</p>
              </div>
              <RefreshCw className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEFAULT_CATEGORIES.slice(0, 5).map((category, index) => {
                const percentage = Math.floor(Math.random() * 60) + 20
                return (
                  <div key={category} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{category}</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-sm text-muted-foreground">{percentage}%</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ORDER_STATUSES.slice(0, 5).map((status, index) => {
                const count = Math.floor(Math.random() * 50) + 5
                return (
                  <div key={status.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status.color.includes("blue")
                            ? "bg-blue-500"
                            : status.color.includes("green")
                              ? "bg-green-500"
                              : status.color.includes("red")
                                ? "bg-red-500"
                                : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count} orders</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
