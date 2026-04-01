// types/index.ts - Updated for Food Delivery Admin Panel

// Base Firebase document interface
export interface FirebaseDocument {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Admin User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "subadmin";
  avatar?: string;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  managedCategory?: string;
}

// Customer interface from main app
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  payments: PaymentMethod[];
  cart?: CartItem[];
  preferences: UserPreferences;
  emailVerified?: boolean;
  profileCompleted?: boolean;
  authProvider?: 'email' | 'google';
  lastLoginAt?: string;
  lastLogoutAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  receiverName: string;
  receiverPhone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  fullAddress: string;
  isDefault: boolean;
  addressType?: 'home' | 'work' | 'other';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  name: string;
  details: string;
  isDefault: boolean;
  lastUsed?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardHolderName?: string;
  cardType?: 'visa' | 'mastercard' | 'rupay';
  upiId?: string;
}

export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryReference {
  id: string;
  name: string;
}

export interface TimeSlot {
  id: string;
  name: string;
  label: string;
  icon: string;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  isActive: boolean;
  order: number; // For sorting
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeRulesConfig {
  [timeSlotId: string]: {
    timeSlotName: string;
    startTime: string;
    endTime: string;
    allowedCategories: CategoryReference[];
    isActive: boolean;
  };
}

export interface Vendor {
  id: string;
  name: string;
  location: string;
  commission: number;
  category: string[];
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  totalProducts: number;
  totalOrders: number;
  rating: number;
}

export interface Product {
  id: string;
  name: string;
  categories: Category[];
  price: number; // Original price
  discountedPrice?: number; // Optional - only exists when hasDiscount is true
  discountPercentage?: number; // Optional - only exists when hasDiscount is true
  hasDiscount: boolean; // Whether product has discount or not
  stock: number;
  vendors: Vendor[];
  description: string;
  tags: string[];
  available: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string;
  // Rating fields
  averageRating: number;
  totalRatings: number;
  ratingBreakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CartItem extends FirebaseDocument {
  userId: string;
  productId: string;
  quantity: number;
  variant?: string;
  product?: Product;
}

export interface UpiPaymentMethod {
  id: string;
  name: string;
  upiId: string;
  qrImageUrl: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Updated Order types matching main delivery app
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
  variant?: string;
}

export interface DeliverySlot {
  id: string;
  type: "immediate" | "express" | "scheduled";
  label: string;
  description: string;
  fee: number;
  estimatedMinutes: number;
  isAvailable: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface Order {
  id: string;
  orderNumber: string;

  // Customer Information
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Delivery Information
  deliveryAddress: Address;
  items: OrderItem[];

  // Pricing
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  total: number;

  // Status Management
  status: "placed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "cash_on_delivery" | "upi_online";

  // Payment Details (Union type for different payment methods)
  paymentDetails?: {
    // For UPI payments - all required
    upiTransactionId: string;
    paymentScreenshot: string;
    upiId: string;
    verificationStatus: "pending" | "verified" | "rejected";
  } | {
    // For COD payments - only verification status required
    verificationStatus: "pending" | "verified" | "rejected";
  };

  // Delivery Information
  deliverySlot: {
    type: "immediate" | "express" | "scheduled";
    estimatedTime: Date;
    actualDeliveryTime?: Date;
    fee: number;
    // Only include these for scheduled delivery
    scheduledDate?: string;
    scheduledTime?: string;
  };

  // Additional Information
  notes?: string;
  specialInstructions?: string;

  // Order Tracking
  orderTracking?: {
    placedAt: Date;
    confirmedAt?: Date;
    preparingAt?: Date;
    outForDeliveryAt?: Date;
    deliveredAt?: Date;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Order Properties
  isRefundable: boolean;
  isCancellable: boolean;
  estimatedDeliveryTime: Date;

  // Customer Feedback
  rating?: number;
  review?: string;
  reviewedAt?: Date;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  discount: number;
  total: number;
}

export interface DashboardMetrics {
  totalOrders: number;
  dailyRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  orderGrowth: number;
  revenueGrowth: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  search: string;
  category: string;
  status: string;
  dateRange: string;
  vendor: string;
  priceRange: { min: string; max: string };
}

// Notification interface for order updates
export interface OrderNotification {
  id: string;
  type: "admin_order_placed" | "customer_order_placed" | "order_status_update" | "payment_verification";
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  total?: number;
  isRead: boolean;
  targetAudience: "admin" | "customer";
  createdAt: string;
  priority: "low" | "normal" | "high";
}

export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  status: "online" | "offline";
  totalDeliveries: number;
  adminApproved: boolean;
  createdAt: Date | any;
  updatedAt: Date | any;
}


export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  isRead: boolean;
  targetAudience: "admin";
  createdAt: string;
  priority: "low" | "medium" | "high";
  readAt?: string;
}
// Order status constants
export const ORDER_STATUSES = [
  { value: "placed", label: "Order Placed", color: "bg-blue-100 text-blue-800" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-800" },
  { value: "preparing", label: "Preparing", color: "bg-yellow-100 text-yellow-800" },
  { value: "out_for_delivery", label: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800" },
];

export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800" },
];

export const VERIFICATION_STATUSES = [
  { value: "pending", label: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
  { value: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
];

// Input/Update types
export type CreateUser = Omit<User, keyof FirebaseDocument>;
export type CreateCategory = Omit<Category, keyof FirebaseDocument>;
export type CreateProduct = Omit<Product, keyof FirebaseDocument>;
export type CreateOrder = Omit<Order, keyof FirebaseDocument>;

export type UpdateUser = Partial<CreateUser>;
export type UpdateCategory = Partial<CreateCategory>;
export type UpdateProduct = Partial<CreateProduct>;
export type UpdateOrder = Partial<CreateOrder>;