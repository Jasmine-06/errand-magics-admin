import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  setDoc,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Building2,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  Plus,
  Edit,
  Trash2,
  Menu,
  DollarSign,
  TrendingUp,
  Package2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Eye,
  Filter,
  Download,
  Upload,
  Star,
  AlertTriangle,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Target,
  Zap,
  Shield,
  Activity,
  PieChart,
  LineChart,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Percent,
  IndianRupee,
  User,
  Store,
  Tag,
  Layers,
  Timer,
  Award,
  BookOpen,
  MessageSquare,
  Home,
  ChevronDown,
  ChevronRight,
  FileText,
  Briefcase,
  Database,
  Cpu,
  Wifi,
  Lock,
  LogOut
} from 'lucide-react';

// Enhanced Types with better structure
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sub-admin';
  managedCategory?: string;
  avatar?: string;
  lastLogin?: any;
  isActive: boolean;
  createdAt: any;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  vendorId: string;
  vendorName?: string;
  available: boolean;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  description?: string;
  images?: string[];
  tags?: string[];
  rating?: number;
  totalSales?: number;
  createdAt: any;
  updatedAt?: any;
}

interface Vendor {
  id: string;
  name: string;
  location: string;
  commission: number;
  specialty: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rating?: number;
  isActive: boolean;
  totalProducts?: number;
  totalOrders?: number;
  createdAt: any;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  total: number;
  deliveryFee: number;
  discount?: number;
  status: 'pending' | 'processing' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'refunded';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDelivery?: any;
  actualDelivery?: any;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

interface TimeRules {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

interface DashboardMetrics {
  totalOrders: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  activeUsers: number;
  totalProducts: number;
  totalVendors: number;
  pendingOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  topSellingCategory: string;
  revenueGrowth: number;
  orderGrowth: number;
}

// Enhanced constants
const CATEGORIES = [
  'Vegetables',
  'Groceries',
  'Medicine',
  'Snacks',
  'Biryani',
  'Fruits',
  'Dairy',
  'Bakery',
  'Beverages',
  'Personal Care',
  'Household',
  'Electronics'
];

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (6AM-12PM)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (12PM-6PM)', icon: '☀️' },
  { value: 'evening', label: 'Evening (6PM-12AM)', icon: '🌙' }
];

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'preparing', label: 'Preparing', color: 'bg-yellow-100 text-yellow-800', icon: Package },
  { value: 'out-for-delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', icon: Truck },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'refunded', label: 'Refunded', color: 'bg-orange-100 text-orange-800', icon: ArrowDown }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600' }
];

const AdminPanel: React.FC = () => {
  // Enhanced state management
  const [currentUser] = useState<User>({
    id: '1',
    name: 'System Administrator',
    email: 'admin@pakurmart.com',
    role: 'admin',
    avatar: '',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date()
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Data states with better organization
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeRules, setTimeRules] = useState<TimeRules>({
    morning: ['Vegetables', 'Fruits', 'Dairy'],
    afternoon: ['Groceries', 'Medicine', 'Snacks', 'Personal Care', 'Household'],
    evening: ['Biryani', 'Snacks', 'Beverages']
  });

  // Enhanced modal states
  const [modals, setModals] = useState({
    addProduct: false,
    editProduct: false,
    addVendor: false,
    editVendor: false,
    addUser: false,
    editUser: false,
    orderDetails: false,
    bulkActions: false,
    settings: false
  });

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Enhanced form states
  const [forms, setForms] = useState({
    product: {
      name: '',
      category: '',
      price: '',
      stock: '',
      vendorId: '',
      timeSlot: '',
      description: '',
      tags: '',
      available: true
    },
    vendor: {
      name: '',
      location: '',
      commission: '',
      specialty: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    },
    user: {
      name: '',
      email: '',
      role: '',
      managedCategory: ''
    }
  });

  // Enhanced filter and search states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    dateRange: '',
    vendor: '',
    priceRange: { min: '', max: '' }
  });

  const [loading, setLoading] = useState({
    global: false,
    products: false,
    vendors: false,
    orders: false,
    users: false
  });

  const { toast } = useToast();

  // Enhanced Firebase real-time listeners with error handling
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Products listener with enhanced error handling
    const unsubscribeProducts = onSnapshot(
      query(collection(db, 'products'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
        setLoading(prev => ({ ...prev, products: false }));
      },
      (error) => {
        console.error('Error fetching products:', error);
        toast({
          title: "Connection Error",
          description: "Failed to sync products. Retrying...",
          variant: "destructive"
        });
        setLoading(prev => ({ ...prev, products: false }));
      }
    );
    unsubscribers.push(unsubscribeProducts);

    // Vendors listener
    const unsubscribeVendors = onSnapshot(
      query(collection(db, 'vendors'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const vendorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];
        setVendors(vendorsData);
        setLoading(prev => ({ ...prev, vendors: false }));
      },
      (error) => {
        console.error('Error fetching vendors:', error);
        setLoading(prev => ({ ...prev, vendors: false }));
      }
    );
    unsubscribers.push(unsubscribeVendors);

    // Orders listener with real-time updates
    const unsubscribeOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
        setLoading(prev => ({ ...prev, orders: false }));
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(prev => ({ ...prev, orders: false }));
      }
    );
    unsubscribers.push(unsubscribeOrders);

    // Users listener
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);
        setLoading(prev => ({ ...prev, users: false }));
      },
      (error) => {
        console.error('Error fetching users:', error);
        setLoading(prev => ({ ...prev, users: false }));
      }
    );
    unsubscribers.push(unsubscribeUsers);

    // Settings listener
    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'timeRules'),
      (snapshot) => {
        if (snapshot.exists()) {
          setTimeRules(snapshot.data() as TimeRules);
        }
      },
      (error) => {
        console.error('Error fetching settings:', error);
      }
    );
    unsubscribers.push(unsubscribeSettings);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [toast]);

  // Enhanced theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('pakurmart-theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pakurmart-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pakurmart-theme', 'light');
    }
  }, [darkMode]);

  // Enhanced computed values with analytics
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Today's orders and revenue
    const todayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= todayStart;
    });

    // This month's orders and revenue
    const thisMonthOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= monthStart;
    });

    // Last month's orders for growth calculation
    const lastMonthOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
    });

    const dailyRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const monthlyRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter(order =>
      ['pending', 'processing', 'confirmed', 'preparing'].includes(order.status)
    ).length;

    const completedOrders = orders.filter(order =>
      order.status === 'delivered'
    ).length;

    const averageOrderValue = orders.length > 0
      ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
      : 0;

    // Top selling category
    const categoryStats = orders.reduce((acc, order) => {
      order.items.forEach(item => {
        acc[item.category] = (acc[item.category] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    const topSellingCategory = Object.entries(categoryStats).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Growth calculations
    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const orderGrowth = lastMonthOrders.length > 0
      ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
      : 0;

    return {
      totalOrders: orders.length,
      dailyRevenue,
      monthlyRevenue,
      activeUsers: users.filter(u => u.isActive).length,
      totalProducts: products.length,
      totalVendors: vendors.length,
      pendingOrders,
      completedOrders,
      averageOrderValue,
      topSellingCategory,
      revenueGrowth,
      orderGrowth
    };
  }, [orders, users, products, vendors]);

  // Enhanced filtered data with role-based access
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Role-based filtering for sub-admins
    if (currentUser.role === 'sub-admin' && currentUser.managedCategory) {
      filtered = filtered.filter(p => p.category === currentUser.managedCategory);
    }

    // Search filtering
    if (filters.search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.vendorName?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filtering
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Price range filtering
    if (filters.priceRange.min) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.priceRange.min));
    }
    if (filters.priceRange.max) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.priceRange.max));
    }

    return filtered;
  }, [products, currentUser, filters]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Role-based filtering for sub-admins
    if (currentUser.role === 'sub-admin' && currentUser.managedCategory) {
      filtered = filtered.filter(order =>
        order.items.some(item => item.category === currentUser.managedCategory)
      );
    }

    // Search filtering
    if (filters.search) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customerPhone.includes(filters.search)
      );
    }

    // Status filtering
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    return filtered;
  }, [orders, currentUser, filters]);

  // Enhanced CRUD Operations with better error handling
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, products: true }));

    try {
      const vendor = vendors.find(v => v.id === forms.product.vendorId);
      if (!vendor) {
        throw new Error('Please select a valid vendor');
      }

      const productData = {
        name: forms.product.name,
        category: forms.product.category,
        price: parseFloat(forms.product.price),
        stock: parseInt(forms.product.stock),
        vendorId: forms.product.vendorId,
        vendorName: vendor.name,
        timeSlot: forms.product.timeSlot,
        description: forms.product.description,
        tags: forms.product.tags ? forms.product.tags.split(',').map(tag => tag.trim()) : [],
        available: forms.product.available,
        rating: 0,
        totalSales: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);

      toast({
        title: "Success",
        description: `Product "${forms.product.name}" added successfully`
      });

      setModals(prev => ({ ...prev, addProduct: false }));
      setForms(prev => ({
        ...prev,
        product: {
          name: '',
          category: '',
          price: '',
          stock: '',
          vendorId: '',
          timeSlot: '',
          description: '',
          tags: '',
          available: true
        }
      }));
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, vendors: true }));

    try {
      const vendorData = {
        name: forms.vendor.name,
        location: forms.vendor.location,
        commission: parseFloat(forms.vendor.commission),
        specialty: forms.vendor.specialty,
        contactPerson: forms.vendor.contactPerson,
        phone: forms.vendor.phone,
        email: forms.vendor.email,
        address: forms.vendor.address,
        rating: 0,
        isActive: true,
        totalProducts: 0,
        totalOrders: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'vendors'), vendorData);

      toast({
        title: "Success",
        description: `Vendor "${forms.vendor.name}" added successfully`
      });

      setModals(prev => ({ ...prev, addVendor: false }));
      setForms(prev => ({
        ...prev,
        vendor: {
          name: '',
          location: '',
          commission: '',
          specialty: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: ''
        }
      }));
    } catch (error: any) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, vendors: false }));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: `Order status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Chart rendering function
  const renderSalesChart = () => {
    const chartData = [
      { day: 'Mon', revenue: 2400, orders: 12 },
      { day: 'Tue', revenue: 1398, orders: 8 },
      { day: 'Wed', revenue: 9800, orders: 18 },
      { day: 'Thu', revenue: 3908, orders: 14 },
      { day: 'Fri', revenue: 4800, orders: 22 },
      { day: 'Sat', revenue: 3800, orders: 16 },
      { day: 'Sun', revenue: 4300, orders: 19 }
    ];

    const maxRevenue = Math.max(...chartData.map(d => d.revenue));
    const maxOrders = Math.max(...chartData.map(d => d.orders));

    return (
      <div className="w-full h-full p-4">
        <div className="flex justify-between items-center mb-4">
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
        </div>

        <div className="relative h-60 flex items-end justify-around gap-2 px-4">
          {chartData.map((data, index) => (
            <div key={data.day} className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-end gap-1 h-48">
                {/* Revenue Bar */}
                <div
                  className="bg-primary rounded-t-lg w-6 transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                  style={{ height: `${(data.revenue / maxRevenue) * 180}px` }}
                  title={`Revenue: ₹${data.revenue.toLocaleString()}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{data.revenue.toLocaleString()}
                  </div>
                </div>

                {/* Orders Bar */}
                <div
                  className="bg-accent rounded-t-lg w-6 transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                  style={{ height: `${(data.orders / maxOrders) * 180}px` }}
                  title={`Orders: ${data.orders}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.orders} orders
                  </div>
                </div>
              </div>

              <span className="text-sm font-medium text-muted-foreground">{data.day}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-lg font-bold text-primary">₹{chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-lg font-bold text-accent">{chartData.reduce((sum, d) => sum + d.orders, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
        </div>
      </div>
    );
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: any) => {
    const d = date?.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getStatusBadge = (status: string, type: 'order' | 'product' | 'vendor' = 'order') => {
    if (type === 'order') {
      const statusConfig = ORDER_STATUSES.find(s => s.value === status);
      const Icon = statusConfig?.icon || Clock;
      return (
        <Badge className={`${statusConfig?.color} flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {statusConfig?.label || status}
        </Badge>
      );
    }
    return <Badge>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.value === priority);
    return (
      <Badge className={priorityConfig?.color || 'bg-gray-100 text-gray-600'}>
        {priorityConfig?.label || priority}
      </Badge>
    );
  };

  // Enhanced Sidebar Component
  const renderSidebar = () => (
    <aside
      className={`${sidebarCollapsed ? 'w-16' : 'w-72'
        } transition-all duration-300 bg-card border-r border-border flex flex-col h-screen shadow-lg`}
      data-testid="sidebar"
    >
      {/* Enhanced Header */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-foreground">Bolpur Mart</h1>
              <p className="text-sm text-muted-foreground">Enterprise Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard', desc: 'Overview & Analytics' },
          { id: 'products', icon: Package2, label: 'Products', desc: 'Catalog Management', count: products.length },
          { id: 'vendors', icon: Building2, label: 'Vendors', desc: 'Supplier Network', count: vendors.length },
          { id: 'orders', icon: ShoppingCart, label: 'Orders', desc: 'Order Management', count: dashboardMetrics.pendingOrders },
          { id: 'users', icon: Users, label: 'Users', desc: 'Access Control', count: users.length },
          { id: 'analytics', icon: TrendingUp, label: 'Analytics', desc: 'Business Intelligence' },
          { id: 'settings', icon: Settings, label: 'Settings', desc: 'System Configuration' }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => setActiveView(item.id)}
                className={`w-full group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{item.label}</span>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {item.desc}
                      </p>
                    </div>
                    {item.count !== undefined && (
                      <Badge
                        variant={isActive ? 'secondary' : 'outline'}
                        className={`text-xs ${isActive ? 'bg-white/20 text-white border-white/30' : ''}`}
                      >
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Enhanced User Profile */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-card shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );

  // Enhanced Top Bar Component
  const renderTopBar = () => (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-40" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-muted"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-foreground capitalize">{activeView}</h2>
            <Badge variant="outline" className="text-xs">
              {activeView === 'dashboard' && 'Real-time'}
              {activeView === 'products' && `${filteredProducts.length} items`}
              {activeView === 'orders' && `${filteredOrders.length} orders`}
              {activeView === 'vendors' && `${vendors.length} vendors`}
              {activeView === 'users' && `${users.length} users`}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Enhanced Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search anything..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-80 pl-10 bg-background/50"
              data-testid="input-search"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {dashboardMetrics.pendingOrders}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="hover:bg-muted"
              data-testid="button-toggle-theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

  // Enhanced Dashboard Component
  const renderDashboard = () => (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {currentUser.name}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your business today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              System Online
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Orders',
            value: dashboardMetrics.totalOrders.toLocaleString(),
            change: `+${dashboardMetrics.orderGrowth.toFixed(1)}%`,
            changeType: dashboardMetrics.orderGrowth >= 0 ? 'positive' : 'negative',
            icon: ShoppingCart,
            color: 'from-blue-500 to-blue-600',
            description: 'Orders this month'
          },
          {
            title: 'Daily Revenue',
            value: formatCurrency(dashboardMetrics.dailyRevenue),
            change: `+${dashboardMetrics.revenueGrowth.toFixed(1)}%`,
            changeType: dashboardMetrics.revenueGrowth >= 0 ? 'positive' : 'negative',
            icon: IndianRupee,
            color: 'from-green-500 to-green-600',
            description: 'Compared to yesterday'
          },
          {
            title: 'Active Products',
            value: dashboardMetrics.totalProducts.toLocaleString(),
            change: '+5 this week',
            changeType: 'positive',
            icon: Package2,
            color: 'from-purple-500 to-purple-600',
            description: 'In catalog'
          },
          {
            title: 'Pending Orders',
            value: dashboardMetrics.pendingOrders.toLocaleString(),
            change: 'Needs attention',
            changeType: dashboardMetrics.pendingOrders > 10 ? 'negative' : 'neutral',
            icon: Clock,
            color: 'from-orange-500 to-orange-600',
            description: 'Awaiting processing'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-foreground" data-testid={`text-${metric.title.toLowerCase().replace(' ', '-')}`}>
                        {metric.value}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm flex items-center gap-1 ${metric.changeType === 'positive' ? 'text-green-600' :
                          metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                          {metric.changeType === 'positive' && <ArrowUp className="w-3 h-3" />}
                          {metric.changeType === 'negative' && <ArrowDown className="w-3 h-3" />}
                          {metric.change}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${metric.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Real-time Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Sales Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Revenue and order trends</p>
            </div>
            <Select defaultValue="7days">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-80 relative">
              {renderSalesChart()}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveView('orders')}>
              <Eye className="w-4 h-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {orders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items • {formatCurrency(order.total)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(order.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <p className="text-sm text-muted-foreground">Orders will appear here once customers start placing them</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Top Category</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {dashboardMetrics.topSellingCategory}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Most popular</p>
              </div>
              <Award className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Avg Order Value</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(dashboardMetrics.averageOrderValue)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Per transaction</p>
              </div>
              <Target className="w-12 h-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {orders.length > 0 ? Math.round((dashboardMetrics.completedOrders / orders.length) * 100) : 0}%
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Orders delivered</p>
              </div>
              <CheckCircle className="w-12 h-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Enhanced Products Management
  const renderProducts = () => (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted-foreground">Manage your product catalog and inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          <Dialog open={modals.addProduct} onOpenChange={(open) => setModals(prev => ({ ...prev, addProduct: open }))}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package2 className="w-5 h-5" />
                  Add New Product
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={forms.product.name}
                      onChange={(e) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, name: e.target.value }
                      }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={forms.product.category}
                      onValueChange={(value) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, category: value }
                      }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={forms.product.price}
                      onChange={(e) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, price: e.target.value }
                      }))}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={forms.product.stock}
                      onChange={(e) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, stock: e.target.value }
                      }))}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select
                      value={forms.product.vendorId}
                      onValueChange={(value) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, vendorId: value }
                      }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name} - {vendor.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot *</Label>
                    <Select
                      value={forms.product.timeSlot}
                      onValueChange={(value) => setForms(prev => ({
                        ...prev,
                        product: { ...prev.product, timeSlot: value }
                      }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(slot => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.icon} {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={forms.product.description}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      product: { ...prev.product, description: e.target.value }
                    }))}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={forms.product.tags}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      product: { ...prev.product, tags: e.target.value }
                    }))}
                    placeholder="organic, fresh, premium"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={forms.product.available}
                    onCheckedChange={(checked) => setForms(prev => ({
                      ...prev,
                      product: { ...prev.product, available: checked }
                    }))}
                  />
                  <Label htmlFor="available">Available for sale</Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModals(prev => ({ ...prev, addProduct: false }))}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading.products}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {loading.products ? 'Adding...' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded" />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`${product.stock < 10 ? 'text-red-600' : 'text-foreground'}`}>
                          {product.stock}
                        </span>
                        {product.stock < 10 && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{product.vendorName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {TIME_SLOTS.find(s => s.value === product.timeSlot)?.icon}
                        <span className="text-sm capitalize">{product.timeSlot}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {product.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.category
                    ? 'Try adjusting your filters to see more products'
                    : 'Get started by adding your first product'
                  }
                </p>
                {!filters.search && !filters.category && (
                  <Button
                    onClick={() => setModals(prev => ({ ...prev, addProduct: true }))}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Vendors Management
  const renderVendors = () => (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Manage your supplier network and partnerships</p>
        </div>
        <Dialog open={modals.addVendor} onOpenChange={(open) => setModals(prev => ({ ...prev, addVendor: open }))}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Add New Vendor
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorName">Vendor Name *</Label>
                  <Input
                    id="vendorName"
                    value={forms.vendor.name}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, name: e.target.value }
                    }))}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={forms.vendor.location}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, location: e.target.value }
                    }))}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={forms.vendor.contactPerson}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, contactPerson: e.target.value }
                    }))}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={forms.vendor.phone}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, phone: e.target.value }
                    }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={forms.vendor.email}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, email: e.target.value }
                    }))}
                    placeholder="Enter email address"
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
                    value={forms.vendor.commission}
                    onChange={(e) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, commission: e.target.value }
                    }))}
                    placeholder="0.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty *</Label>
                  <Select
                    value={forms.vendor.specialty}
                    onValueChange={(value) => setForms(prev => ({
                      ...prev,
                      vendor: { ...prev.vendor, specialty: value }
                    }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Textarea
                  id="address"
                  value={forms.vendor.address}
                  onChange={(e) => setForms(prev => ({
                    ...prev,
                    vendor: { ...prev.vendor, address: e.target.value }
                  }))}
                  placeholder="Enter complete address"
                  rows={3}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModals(prev => ({ ...prev, addVendor: false }))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading.vendors}
                  className="bg-gradient-to-r from-primary to-accent"
                >
                  {loading.vendors ? 'Adding...' : 'Add Vendor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{vendor.specialty}</p>
                  </div>
                </div>
                <Badge className={vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {vendor.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="w-4 h-4 mr-2" />
                  {vendor.contactPerson}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  {vendor.phone}
                </div>
                {vendor.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    {vendor.email}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{vendor.commission}%</p>
                  <p className="text-xs text-muted-foreground">Commission</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{vendor.totalProducts || 0}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{vendor.totalOrders || 0}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vendors.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No vendors added yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your supplier network by adding vendors
            </p>
            <Button
              onClick={() => setModals(prev => ({ ...prev, addVendor: true }))}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Vendor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Enhanced Orders Management
  const renderOrders = () => (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground">Track and manage customer orders in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ORDER_STATUSES.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          {filters.status && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
              className="gap-1"
            >
              <XCircle className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ORDER_STATUSES.slice(0, 4).map((status) => {
          const count = orders.filter(order => order.status === status.value).length;
          const Icon = status.icon;
          return (
            <Card key={status.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.quantity}x</span> {item.productName}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select
                          value={order.status}
                          onValueChange={(status) => handleUpdateOrderStatus(order.id, status as Order['status'])}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {filters.search || filters.status
                    ? 'Try adjusting your filters to see more orders'
                    : 'Orders will appear here once customers start placing them'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Settings Component
  const renderSettings = () => (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure your admin panel and business rules</p>
      </div>

      <Tabs defaultValue="time-rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time-rules">Time Rules</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="time-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Time-Based Ordering Rules
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure which product categories are available during specific time slots
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {TIME_SLOTS.map((slot) => (
                <div key={slot.value} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{slot.icon}</span>
                    <h3 className="font-semibold text-foreground">{slot.label}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CATEGORIES.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${slot.value}-${category}`}
                          checked={timeRules[slot.value as keyof TimeRules]?.includes(category)}
                          onChange={(e) => {
                            const newRules = { ...timeRules };
                            if (e.target.checked) {
                              newRules[slot.value as keyof TimeRules] = [
                                ...newRules[slot.value as keyof TimeRules],
                                category
                              ];
                            } else {
                              newRules[slot.value as keyof TimeRules] =
                                newRules[slot.value as keyof TimeRules].filter(cat => cat !== category);
                            }
                            setTimeRules(newRules);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`${slot.value}-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={async () => {
                    try {
                      await setDoc(doc(db, 'settings', 'timeRules'), timeRules);
                      toast({
                        title: "Success",
                        description: "Time rules updated successfully"
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update time rules",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save Time Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Order Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert when product stock is running low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Reports</p>
                    <p className="text-sm text-muted-foreground">Receive daily business reports via email</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Third-party Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Payment Gateway</h3>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect your payment processor for seamless transactions
                  </p>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">SMS Service</h3>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send order updates and notifications via SMS
                  </p>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Enhanced Users Management
  const renderUsers = () => (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system users and access control</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Category Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">System Administrator</p>
                        <p className="text-sm text-muted-foreground">admin@bolpurmart.com</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">All Categories</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">Just now</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Analytics Page
  const renderAnalytics = () => (
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
              {CATEGORIES.slice(0, 5).map((category, index) => {
                const percentage = Math.floor(Math.random() * 60) + 20;
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
                );
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
                const count = Math.floor(Math.random() * 50) + 5;
                return (
                  <div key={status.value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color.includes('blue') ? 'bg-blue-500' : status.color.includes('green') ? 'bg-green-500' : status.color.includes('red') ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                      <span className="text-sm font-medium">{status.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count} orders</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {renderSidebar()}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTopBar()}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'products' && renderProducts()}
          {activeView === 'vendors' && renderVendors()}
          {activeView === 'orders' && renderOrders()}
          {activeView === 'users' && renderUsers()}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'settings' && renderSettings()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;