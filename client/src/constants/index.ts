export const TIME_SLOTS = [
  { value: "morning", label: "Morning (6 AM - 12 PM)", icon: "🌅" },
  { value: "afternoon", label: "Afternoon (12 PM - 6 PM)", icon: "☀️" },
  { value: "evening", label: "Evening (6 PM - 12 AM)", icon: "🌆" },
]

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "preparing", label: "Preparing", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "ready", label: "Ready", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
]

export const USER_ROLES = [
  { value: "admin", label: "Administrator" },
  { value: "subadmin", label: "Sub Administrator" },
]

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash on Delivery" },
  { value: "online", label: "Online Payment" },
]

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
]

export const DEFAULT_CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Groceries",
  "Medicine",
  "Snacks",
  "Personal Care",
  "Household",
  "Biryani",
  "Beverages",
]
