import { useState, useEffect, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { LayoutProvider } from "@/components/layout/layout-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Analytics } from "@/components/analytics/analytics";
import { ProductsManagement } from "@/components/products/products-management";
import { VendorsManagement } from "@/components/vendors/vendors-management";
import { OrdersManagement } from "@/components/orders/orders-management";
import { UsersManagement } from "@/components/users/users-management";
import { CategoriesManagement } from "@/components/categories/categories-management";
import { Settings } from "@/components/settings/settings";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { FirebaseService } from "@/services/firebase-service";
import { AdminFirebaseOrderService } from "@/services/firebase-order-admin-service";
import { useToast } from "@/hooks/use-toast";
import type {
  Product,
  Vendor,
  Order,
  User,
  Category,
  TimeRulesConfig,
  DashboardMetrics,
  TimeSlot,
  UpiPaymentMethod,
  DeliveryPartner,
} from "@/types";
import { LoginPage } from "./login-page";
import { PartnersManagement } from "@/components/Partners/partners-management";

function AdminPanelContent() {
  // Auth state
  const { user, loading: authLoading } = useAuth();

  // Layout state
  const [activeView, setActiveView] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [timeRules, setTimeRules] = useState<TimeRulesConfig>({});
  const [upiMethods, setUpiMethods] = useState<UpiPaymentMethod[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState({
    global: true,
    products: true,
    vendors: true,
    orders: true,
    users: true,
    categories: true,
    deliveryPartners: true,
    timeSlots: true,
    timeRules: true,
  });

  const { toast } = useToast();

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("admin-theme", "light");
    }
  }, [darkMode]);

  // Initialize data with proper loading states
  useEffect(() => {
    if (!user) return;
    const initializeData = async () => {
      try {
        const rulesData = await FirebaseService.getTimeRules();
        setTimeRules(rulesData);
      } catch (error) {
        console.error("Error loading time rules:", error);
        toast({
          title: "Warning",
          description: "Failed to load time rules, using defaults",
          variant: "destructive",
        });
        setTimeRules({});
      } finally {
        setLoading((prev) => ({ ...prev, timeRules: false }));
      }
    };

    initializeData();
  }, [toast, user]);

  // Firebase real-time listeners
  useEffect(() => {
    if (!user) return;
    const unsubscribers: (() => void)[] = [];

    // Products listener
    const unsubscribeProducts = FirebaseService.subscribeToCollection<Product>(
      "products",
      (productsData) => {
        setProducts(productsData);
        setLoading((prev) => ({ ...prev, products: false }));
      }
    );
    unsubscribers.push(unsubscribeProducts);

    // Vendors listener
    const unsubscribeVendors = FirebaseService.subscribeToCollection<Vendor>(
      "vendors",
      (vendorsData) => {
        setVendors(vendorsData);
        setLoading((prev) => ({ ...prev, vendors: false }));
      }
    );
    unsubscribers.push(unsubscribeVendors);

    // Orders listener - Updated to use admin service
    const unsubscribeOrders = AdminFirebaseOrderService.subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading((prev) => ({ ...prev, orders: false }));
    });
    unsubscribers.push(unsubscribeOrders);

    // Users listener with client-side filtering
    const unsubscribeUsers = FirebaseService.subscribeToCollection<User>(
      "users",
      (usersData) => {
        const adminUsers = usersData.filter(
          (user) => user.role === "admin" || user.role === "subadmin"
        );
        setUsers(adminUsers);
        setLoading((prev) => ({ ...prev, users: false }));
      }
    );
    unsubscribers.push(unsubscribeUsers);

    // Categories listener
    const unsubscribeCategories = FirebaseService.subscribeToCollection<Category>(
      "categories",
      (categoriesData) => {
        setCategories(categoriesData);
        setLoading((prev) => ({ ...prev, categories: false }));
      }
    );
    unsubscribers.push(unsubscribeCategories);

    // Time Slots listener
    const unsubscribeTimeSlots = FirebaseService.subscribeToCollection<TimeSlot>(
      "timeSlots",
      (timeSlotsData) => {
        setTimeSlots(timeSlotsData);
        setLoading((prev) => ({ ...prev, timeSlots: false }));
      }
    );
    unsubscribers.push(unsubscribeTimeSlots);

    // UPI methods listener
    const unsubscribeUpiMethods = FirebaseService.subscribeToCollection<UpiPaymentMethod>(
      "upiPaymentMethods",
      (upiMethodsData) => {
        setUpiMethods(upiMethodsData);
      }
    );
    unsubscribers.push(unsubscribeUpiMethods);

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  // Update global loading state
  useEffect(() => {
    const isAnyLoading = Object.entries(loading)
      .filter(([key]) => key !== "global")
      .some(([_, isLoading]) => isLoading);

    setLoading((prev) => ({ ...prev, global: isAnyLoading }));
  }, [
    loading.products,
    loading.vendors,
    loading.orders,
    loading.users,
    loading.categories,
    loading.timeSlots,
    loading.timeRules,
  ]);

  useEffect(() => {
    if (!user) return;
    const unsubscribePartners = FirebaseService.subscribeToCollection<DeliveryPartner>(
      "deliveryPartners",
      (partnersData) => {
        setDeliveryPartners(partnersData);
        setLoading((prev) => ({ ...prev, deliveryPartners: false }));
      }
    );

    return () => {
      unsubscribePartners();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribeDeliveries = FirebaseService.subscribeToCollection<any>(
      "deliveries",
      (deliveriesData) => {
        setDeliveries(deliveriesData);
        setLoading((prev) => ({ ...prev, deliveries: false }));
      }
    );

    return () => unsubscribeDeliveries();
  }, [user]);


  // CREATE
  const handleCreatePartner = async (partnerData: any) => {
    try {
      await FirebaseService.create("deliveryPartners", partnerData);
      toast({ title: "Success", description: `Partner "${partnerData.name}" added.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add partner", variant: "destructive" });
      throw error;
    }
  };

  // UPDATE
  const handleUpdatePartner = async (id: string, partnerData: any) => {
    try {
      await FirebaseService.update("deliveryPartners", id, partnerData);
      toast({ title: "Success", description: "Partner updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update partner", variant: "destructive" });
      throw error;
    }
  };

  // DELETE
  const handleDeletePartner = async (id: string) => {
    try {
      await FirebaseService.delete("deliveryPartners", id);
      toast({ title: "Success", description: "Partner deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete partner", variant: "destructive" });
      throw error;
    }
  };


  // Helper function to safely get Date from createdAt
  const getDateFromTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date(0);
    if (timestamp instanceof Date) return timestamp;
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  };

  // Dashboard metrics calculation
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const todayOrders = orders.filter((order) => {
      const orderDate = getDateFromTimestamp(order.createdAt);
      return orderDate >= todayStart;
    });

    const thisMonthOrders = orders.filter((order) => {
      const orderDate = getDateFromTimestamp(order.createdAt);
      return orderDate >= monthStart;
    });

    const lastMonthOrders = orders.filter((order) => {
      const orderDate = getDateFromTimestamp(order.createdAt);
      return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
    });

    const dailyRevenue = todayOrders
      .filter(order => order.status === "delivered")
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter((order) =>
      ["placed", "confirmed", "preparing", "out_for_delivery"].includes(order.status)
    ).length;

    const revenueGrowth =
      lastMonthOrders.length > 0
        ? ((thisMonthOrders.reduce((sum, order) =>
          order.status === "delivered" ? sum + order.total : sum, 0) -
          lastMonthOrders.reduce((sum, order) =>
            order.status === "delivered" ? sum + order.total : sum, 0)) /
          lastMonthOrders.reduce((sum, order) =>
            order.status === "delivered" ? sum + order.total : sum, 0)) * 100
        : 0;

    const orderGrowth =
      lastMonthOrders.length > 0
        ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
        : 0;

    return {
      totalOrders: orders.length,
      dailyRevenue,
      totalProducts: products.length,
      pendingOrders,
      orderGrowth,
      revenueGrowth,
    };
  }, [orders, products]);

  // Additional dashboard metrics
  const additionalMetrics = useMemo(() => {
    const categoryOrderCount: { [categoryName: string]: number } = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product && Array.isArray(product.categories)) {
          product.categories.forEach((category) => {
            const categoryName = category.name;
            categoryOrderCount[categoryName] = (categoryOrderCount[categoryName] || 0) + item.quantity;
          });
        }
      });
    });

    const topCategory = Object.entries(categoryOrderCount).reduce(
      (max, [categoryName, count]) =>
        count > max.count ? { category: categoryName, count } : max,
      { category: "N/A", count: 0 }
    );

    const avgOrderValue =
      orders.length > 0
        ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
        : 0;

    const completionRate =
      orders.length > 0
        ? Math.round(
          (orders.filter((order) => order.status === "delivered").length / orders.length) * 100
        )
        : 0;

    return {
      topCategory: topCategory.category,
      avgOrderValue,
      completionRate,
    };
  }, [orders, products]);

  // Enhanced refresh function
  const handleRefreshData = async () => {
    setLoading((prev) => ({ ...prev, global: true, timeRules: true }));
    try {
      const freshTimeRules = await FirebaseService.getTimeRules();
      setTimeRules(freshTimeRules);

      toast({
        title: "Success",
        description: "Dashboard data refreshed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, global: false, timeRules: false }));
    }
  };

  // View metrics for topbar
  const viewMetrics = {
    dashboard: "Real-time",
    products: `${products.length} items`,
    vendors: `${vendors.length} vendors`,
    orders: `${orders.length} orders`,
    users: `${users.length} users`,
    analytics: "Business Intelligence",
    settings: "System Configuration",
    categories: `${categories.length} categories`,
  };

  // Order management functions
  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await AdminFirebaseOrderService.updateOrderStatus(orderId, status);
      toast({
        title: "Success",
        description: `Order status updated to ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdatePaymentVerification = async (
    orderId: string,
    status: "verified" | "rejected",
    reason?: string
  ) => {
    try {
      await AdminFirebaseOrderService.updatePaymentVerification(orderId, status, reason);
      toast({
        title: "Success",
        description: `Payment ${status} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment verification",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRefreshOrders = async () => {
    setLoading((prev) => ({ ...prev, orders: true }));
    try {
      // Real-time listener will automatically update the orders
      toast({
        title: "Success",
        description: "Orders data refreshed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh orders data",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, orders: false }));
    }
  };

  // All other CRUD operations remain the same...
  const handleCreateProduct = async (productData: Omit<Product, "id">) => {
    try {
      await FirebaseService.create("products", productData);
      toast({
        title: "Success",
        description: `Product "${productData.name}" added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      await FirebaseService.update("products", id, productData);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await FirebaseService.delete("products", id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateVendor = async (vendorData: Omit<Vendor, "id">) => {
    try {
      await FirebaseService.create("vendors", vendorData);
      toast({
        title: "Success",
        description: `Vendor "${vendorData.name}" added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateVendor = async (
    id: string,
    vendorData: Partial<Vendor>
  ) => {
    try {
      await FirebaseService.update("vendors", id, vendorData);
      // Don't show toast for background product count updates
      if (!vendorData.totalProducts) {
        toast({
          title: "Success",
          description: "Vendor updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      if (!vendorData.totalProducts) {
        toast({
          title: "Error",
          description: error.message || "Failed to update vendor",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      await FirebaseService.delete("vendors", id);
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor",
        variant: "destructive",
      });
      throw error;
    }
  };



  const handleCreateUser = async (userData: Omit<User, "id">) => {
    try {
      await FirebaseService.create("users", userData);
      toast({
        title: "Success",
        description: `User "${userData.name}" added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      await FirebaseService.update("users", id, userData);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await FirebaseService.delete("users", id);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateCategory = async (categoryData: Omit<Category, "id">) => {
    try {
      await FirebaseService.create("categories", categoryData);
      toast({
        title: "Success",
        description: `Category "${categoryData.name}" added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateCategory = async (
    id: string,
    categoryData: Partial<Category>
  ) => {
    try {
      await FirebaseService.update("categories", id, categoryData);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await FirebaseService.delete("categories", id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateTimeSlot = async (timeSlotData: Omit<TimeSlot, "id">) => {
    try {
      await FirebaseService.create("timeSlots", timeSlotData);
      toast({
        title: "Success",
        description: `Time slot "${timeSlotData.name}" created successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create time slot",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateTimeSlot = async (
    id: string,
    timeSlotData: Partial<TimeSlot>
  ) => {
    try {
      await FirebaseService.update("timeSlots", id, timeSlotData);
      toast({
        title: "Success",
        description: "Time slot updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update time slot",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    try {
      await FirebaseService.delete("timeSlots", id);

      const updatedTimeRules = { ...timeRules };
      delete updatedTimeRules[id];
      await handleUpdateTimeRules(updatedTimeRules);

      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time slot",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateTimeRules = async (rules: TimeRulesConfig) => {
    setLoading((prev) => ({ ...prev, timeRules: true }));
    try {
      await FirebaseService.updateTimeRules(rules);
      setTimeRules(rules);
      toast({
        title: "Success",
        description: "Time rules updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating time rules:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update time rules",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, timeRules: false }));
    }
  };
  // Add CRUD handlers for UPI methods
  const handleCreateUpiMethod = async (
    methodData: Omit<UpiPaymentMethod, "id">
  ) => {
    try {
      await FirebaseService.create("upiPaymentMethods", methodData);
      toast({
        title: "Success",
        description: `UPI method "${methodData.name}" added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add UPI method",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateUpiMethod = async (
    id: string,
    methodData: Partial<UpiPaymentMethod>
  ) => {
    try {
      await FirebaseService.update("upiPaymentMethods", id, methodData);
      toast({
        title: "Success",
        description: "UPI method updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update UPI method",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteUpiMethod = async (id: string) => {
    try {
      await FirebaseService.delete("upiPaymentMethods", id);
      toast({
        title: "Success",
        description: "UPI method deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete UPI method",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRefreshProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      toast({
        title: "Success",
        description: "Products data refreshed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh products data",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const getCurrentTimeSlot = (): TimeSlot | null => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return (
      timeSlots.find((slot) => {
        if (!slot.isActive) return false;

        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        const [endHour, endMin] = slot.endTime.split(":").map(Number);
        const startMinutes = startHour * 60 + startMin;
        let endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60;
          return (
            currentTime >= startMinutes || currentTime <= endMinutes - 24 * 60
          );
        }

        return currentTime >= startMinutes && currentTime <= endMinutes;
      }) || null
    );
  };

  // Render main content based on active view
  const renderMainContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <Dashboard
            metrics={dashboardMetrics}
            additionalMetrics={additionalMetrics}
            orders={orders}
            currentUser={user!}
            loading={loading.global}
            onViewChange={setActiveView}
            onRefresh={handleRefreshData}
          />
        );
      case "products":
        return (
          <ProductsManagement
            products={products}
            vendors={vendors}
            categories={categories}
            loading={loading.products}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateVendor={handleUpdateVendor}
            onRefresh={async () => {
              setLoading((prev) => ({ ...prev, products: true }));
              // Real-time listener will update automatically
              setLoading((prev) => ({ ...prev, products: false }));
            }}
          />
        );
      case "orders":
        return (
          <OrdersManagement
            orders={orders}
            loading={loading.orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdatePaymentVerification={handleUpdatePaymentVerification}
            onRefresh={handleRefreshOrders}
          />
        );
      case "partners":
        return (
          <PartnersManagement
            partners={deliveryPartners.map((dp) => ({
              ...dp,
              status: dp.status === "online" ? "active" : "inactive",
              createdAt: dp.createdAt instanceof Date ? dp.createdAt : dp.createdAt.toDate?.(),
            })) as any}
            orders={orders}
            loading={loading.deliveryPartners}
            onCreatePartner={handleCreatePartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
            onRefresh={async () => {
              setLoading((prev) => ({ ...prev, deliveryPartners: true }));
              setLoading((prev) => ({ ...prev, deliveryPartners: false }));
            }}
            deliveries={deliveries}
          />

        );

      case "vendors":
        return (
          <VendorsManagement
            vendors={vendors}
            loading={loading.vendors}
            categories={categories}
            onCreateVendor={handleCreateVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        );
      case "users":
        return (
          <UsersManagement
            users={users}
            loading={loading.users}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onRefresh={async () => {
              setLoading((prev) => ({ ...prev, users: true }));
              try {
                toast({
                  title: "Success",
                  description: "Users data refreshed successfully",
                });
              } catch (error: any) {
                toast({
                  title: "Error",
                  description: "Failed to refresh users data",
                  variant: "destructive",
                });
              } finally {
                setLoading((prev) => ({ ...prev, users: false }));
              }
            }}
          />
        );
      case "categories":
        return (
          <CategoriesManagement
            categories={categories}
            loading={loading.categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case "analytics":
        return <Analytics loading={loading.global} />;
      case "settings":
        return (
          <Settings
            timeRules={timeRules}
            categories={categories}
            timeSlots={timeSlots}
            onUpdateTimeRules={handleUpdateTimeRules}
            onCreateTimeSlot={handleCreateTimeSlot}
            onUpdateTimeSlot={handleUpdateTimeSlot}
            onDeleteTimeSlot={handleDeleteTimeSlot}
            upiMethods={upiMethods}
            onCreateUpiMethod={handleCreateUpiMethod}
            onUpdateUpiMethod={handleUpdateUpiMethod}
            onDeleteUpiMethod={handleDeleteUpiMethod}
            loading={loading.timeRules}
          />
        );
      default:
        return (
          <Dashboard
            metrics={dashboardMetrics}
            additionalMetrics={additionalMetrics}
            orders={orders}
            currentUser={user!}
            loading={loading.global}
            onViewChange={setActiveView}
            onRefresh={handleRefreshData}
          />
        );
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <LayoutProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          currentUser={user}
          metrics={{
            totalProducts: products.length,
            totalVendors: vendors.length,
            pendingOrders: dashboardMetrics.pendingOrders,
            totalUsers: users.length,
            totalPartners: deliveryPartners.length,
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar
            activeView={activeView}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            pendingNotifications={dashboardMetrics.pendingOrders}
            viewMetrics={viewMetrics}
          />

          <main className="flex-1 overflow-y-auto">{renderMainContent()}</main>
        </div>
      </div>

      <Toaster />
    </LayoutProvider>
  );
}

export default function AdminPanel() {
  return (
    <AuthProvider>
      <AdminPanelContent />
    </AuthProvider>
  );
}
