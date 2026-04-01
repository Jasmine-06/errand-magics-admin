import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Package2,
  Building2,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  Store,
  User,
  LogOut,
  Tag,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUser: {
    name: string;
    role: string;
  };
  metrics: {
    totalProducts: number;
    totalVendors: number;
    pendingOrders: number;
    totalUsers: number;
    totalPartners: number;
  };
}

const navigationItems = [
  {
    id: "dashboard",
    icon: Home,
    label: "Dashboard",
    desc: "Overview & Analytics",
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "products",
    icon: Package2,
    label: "Products",
    desc: "Catalog Management",
    countKey: "totalProducts" as const,
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "categories",
    icon: Tag,
    label: "Categories",
    desc: "Product Categories",
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "vendors",
    icon: Building2,
    label: "Vendors",
    desc: "Supplier Network",
    countKey: "totalVendors" as const,
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "partners",
    icon: Users,
    label: "Partners",
    desc: "Delivery Partners Management",
    countKey: "totalPartners" as const,
    roles: ["admin", "subadmin"],
  },
  {
    id: "orders",
    icon: ShoppingCart,
    label: "Orders",
    desc: "Order Management",
    countKey: "pendingOrders" as const,
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "users",
    icon: Users,
    label: "Users",
    desc: "Access Control",
    countKey: "totalUsers" as const,
    roles: ["admin"], // ✅ Only available for admin
  },
  {
    id: "analytics",
    icon: TrendingUp,
    label: "Analytics",
    desc: "Business Intelligence",
    roles: ["admin", "subadmin"], // Available for both admin and subadmin
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    desc: "System Configuration",
    roles: ["admin"], // ✅ Only available for admin
  },
];

export function Sidebar({
  activeView,
  onViewChange,
  currentUser,
  metrics,
}: SidebarProps) {
  const { logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ✅ Filter navigation items based on user role
  const allowedNavigationItems = navigationItems.filter(item =>
    item.roles.includes(currentUser.role)
  );

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [activeView]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    closeMobileMenu(); // Close mobile menu when navigation item is clicked
  };

  return (
    <>
      {/* Mobile Menu Button - Fixed position */}
      {!isMobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[60] lg:hidden bg-background border border-border shadow-md"
          onClick={toggleMobileMenu}
          aria-label="Toggle sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72
          ${isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
          transition-transform duration-300 ease-in-out
          bg-card border-r border-border 
          flex flex-col h-screen shadow-lg lg:shadow-none
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-3 mr-2 lg:mr-0">
              <div className="h-12 w-12 flex items-center justify-center bg-white rounded-full overflow-hidden shrink-0 shadow-sm border-2 border-white/10">
                <img src="/logo2.jpeg" alt="Errand Magics" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                  Errand Magics
                </h1>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-wider">
                  Quick Commerce Platform
                </p>
              </div>
            </div>

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 border"
              onClick={closeMobileMenu}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-2">
            {/* ✅ Use filtered navigation items */}
            {allowedNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const count = item.countKey ? metrics[item.countKey] : undefined;

              return (
                <div key={item.id}>
                  <Button
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full group relative flex items-center space-x-3 py-[1.6rem] rounded-xl transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    variant="ghost"
                  >
                    <Icon
                      className={`w-5 h-5 ${isActive ? "text-white" : ""
                        } flex-shrink-0`}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <span className="font-medium block truncate">
                        {item.label}
                      </span>
                      <p
                        className={`text-xs truncate ${isActive ? "text-white/80" : "text-muted-foreground"
                          }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                    {count !== undefined && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={`text-xs flex-shrink-0 ${isActive
                          ? "bg-white/20 text-white border-white/30"
                          : ""
                          }`}
                      >
                        {count}
                      </Badge>
                    )}
                  </Button>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 p-3 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentUser.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
