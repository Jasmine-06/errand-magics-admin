"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  X,
  Loader2,
  CreditCard,
  ChevronDown,
  MoreHorizontal,
  Store,
  CheckCircle,
  Circle,
} from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { AdminNotification, Order } from "@/types";
import { AdminFirebaseNotificationService } from "@/services/firebase-admin-notification-service";
import { OrderDetails } from "../orders/order-details";
import { AdminFirebaseOrderService } from "@/services/firebase-order-admin-service";
import { FirebaseService } from "@/services/firebase-service";
import { FCMService } from "@/services/fcm-service";
import { useAuth } from "@/hooks/use-auth";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
//admin notificatoin bell
interface AdminNotificationBellProps {
  onNotificationCount?: (count: number) => void;
}

export function AdminNotificationBell({
  onNotificationCount,
}: AdminNotificationBellProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<
    AdminNotification[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string>("");
  const [showAll, setShowAll] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fcmInitialized, setFcmInitialized] = useState(false);

  const { user } = useAuth();

  // Constants for UI limits
  const INITIAL_DISPLAY_LIMIT = 8;
  const MAX_NOTIFICATIONS = 50;

  // Audio reference for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const notificationIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef<boolean>(false);

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

  // Debug: Monitor notifications collection broadly
  useEffect(() => {
    try {
      console.log('🔍 [DEBUG] Starting broad notifications monitor...');
      const notificationsColl = collection(db, "notifications");
      const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
        console.log(`📊 [DEBUG] Total RAW notifications in DB: ${snap.size}`);
        if (snap.size > 0) {
          console.log('📄 [DEBUG] Most recent RAW notifications:');
          snap.docs.slice(0, 3).forEach(d => {
            const data = d.data();
            console.log(`   - ID: ${d.id}, Target: ${data.targetAudience}, Type: ${data.type}`);
          });
        } else {
          console.log('📄 [DEBUG] No notifications found in the entire collection.');
        }
      }, (err) => {
        console.error('❌ [DEBUG] Error in broad monitor:', err);
      });
      return unsub;
    } catch (e) {
      console.error('❌ [DEBUG] Failed to setup broad monitor:', e);
    }
  }, []);

  // Initialize FCM for push notifications
  useEffect(() => {
    const initializeFCM = async () => {
      if (fcmInitialized || !user) return;

      try {
        console.log('🔔 Initializing FCM for admin notifications...');

        // Check if notifications are supported
        if (!FCMService.isNotificationSupported()) {
          console.warn('Push notifications are not supported in this browser');
          return;
        }

        // Check current permission status
        const permissionStatus = FCMService.getPermissionStatus();
        console.log('Current notification permission:', permissionStatus);

        // Request permission and get token
        const token = await FCMService.requestPermissionAndGetToken();

        if (token) {
          console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');

          // Save token to admin document
          await FCMService.saveAdminFCMToken(user.id, token);
          console.log('✅ FCM token saved for admin');

          // Setup foreground message listener
          const unsubscribe = FCMService.setupForegroundMessageListener((payload) => {
            console.log('📬 Foreground FCM message received:', payload);

            // Play notification sound
            playNotificationSound();

            // Show toast notification
            toast({
              title: payload.notification?.title || 'New Notification',
              description: payload.notification?.body || '',
              variant: 'default',
            });
          });

          setFcmInitialized(true);
          console.log('✅ FCM initialized successfully');

          return () => {
            unsubscribe();
          };
        } else {
          console.log('❌ Failed to get FCM token');
        }
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, [user, fcmInitialized]);


  // Initialize audio
  useEffect(() => {
    const initializeAudio = async () => {
      const audioSources = [
        "/sound/notification-sound.mp3",
      ];

      for (const source of audioSources) {
        try {
          const audio = new Audio();

          const canLoad = new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 3000);

            const handleSuccess = () => {
              clearTimeout(timeout);
              audio.removeEventListener("canplay", handleSuccess);
              audio.removeEventListener("loadeddata", handleSuccess);
              audio.removeEventListener("error", handleError);
              resolve(true);
            };

            const handleError = () => {
              clearTimeout(timeout);
              audio.removeEventListener("canplay", handleSuccess);
              audio.removeEventListener("loadeddata", handleSuccess);
              audio.removeEventListener("error", handleError);
              resolve(false);
            };

            audio.addEventListener("canplay", handleSuccess);
            audio.addEventListener("loadeddata", handleSuccess);
            audio.addEventListener("error", handleError);

            audio.src = source;
            audio.load();
          });

          const loaded = await canLoad;

          if (loaded) {
            // Increased volume for better notification sound
            audio.volume = 0.9;
            audio.preload = "auto";

            audioRef.current = audio;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    };

    initializeAudio();
  }, []);

  // Create fallback sound using Web Audio API
  const playFallbackSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create notification sound with higher volume
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      // Increased gain (volume) for fallback sound
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.4
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);

      setAudioEnabled(true);
    } catch (error) {
      // Silent error handling
    }
  }, []);

  // Enable audio on user interaction
  const enableAudio = useCallback(async () => {
    if (audioEnabled) return;

    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          await playPromise;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioEnabled(true);
        }
      } catch (error) {
        playFallbackSound();
      }
    } else {
      playFallbackSound();
    }
  }, [audioEnabled, playFallbackSound]);

  // Set up interaction listeners
  useEffect(() => {
    const handleUserInteraction = async () => {
      await enableAudio();
    };

    if (!audioEnabled) {
      document.addEventListener("click", handleUserInteraction, {
        once: true,
        passive: true,
      });
      document.addEventListener("touchstart", handleUserInteraction, {
        once: true,
        passive: true,
      });
      document.addEventListener("keydown", handleUserInteraction, {
        once: true,
        passive: true,
      });
    }

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, [audioEnabled, enableAudio]);

  // Play notification sound
  const playNotificationSound = useCallback(async () => {
    if (audioRef.current && audioEnabled) {
      try {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          await playPromise;
          return;
        }
      } catch (error) {
        // Fallback to beep sound on error
      }
    }

    // Use fallback sound
    playFallbackSound();
  }, [audioEnabled, playFallbackSound]);

  // Detect new notifications and play sound
  useEffect(() => {
    if (!hasInitializedRef.current || isLoading) {
      notificationIdsRef.current = new Set(notifications.map((n) => n.id));
      return;
    }

    const currentIds = new Set(notifications.map((n) => n.id));
    const previousIds = notificationIdsRef.current;

    const newNotificationIds = Array.from(currentIds).filter(
      (id) => !previousIds.has(id)
    );

    if (newNotificationIds.length > 0) {
      const newNotifications = notifications.filter(
        (n) => newNotificationIds.includes(n.id) && !n.isRead
      );

      if (newNotifications.length > 0) {
        playNotificationSound();

        newNotifications.forEach((notification) => {
          toast({
            title: notification.title,
            description: notification.message,
            variant:
              notification.priority === "high" ? "destructive" : "info",
          });
        });
      }
    }

    notificationIdsRef.current = currentIds;
  }, [notifications, isLoading, playNotificationSound]);

  // Update displayed notifications based on showAll state
  useEffect(() => {
    if (notifications.length <= INITIAL_DISPLAY_LIMIT) {
      setDisplayedNotifications(notifications);
    } else {
      if (showAll) {
        setDisplayedNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
      } else {
        setDisplayedNotifications(
          notifications.slice(0, INITIAL_DISPLAY_LIMIT)
        );
      }
    }
  }, [notifications, showAll]);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Get admin notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
      case "admin_order_placed":
      case "order_update":
        return ShoppingCart;
      case "new_user_registered":
        return Users;
      case "vendor_application":
        return Store;
      case "product_update":
        return Package;
      case "payment_issue":
        return CreditCard;
      case "system_alert":
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  // Get admin notification icon color (using CSS variables for dark mode support)
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "new_order":
      case "admin_order_placed":
        return "text-accent";
      case "new_user_registered":
        return "text-primary";
      case "vendor_application":
        return "text-purple-600 dark:text-purple-400";
      case "product_update":
        return "text-orange-600 dark:text-orange-400";
      case "payment_issue":
        return "text-destructive";
      case "system_alert":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };

  // Get notification background color for priority (dark mode compatible)
  const getNotificationBackgroundColor = (notification: AdminNotification) => {
    if (notification.priority === "high") {
      return notification.isRead
        ? "bg-destructive/5 dark:bg-destructive/10"
        : "bg-destructive/10 dark:bg-destructive/20";
    }
    return notification.isRead ? "" : "bg-primary/5 dark:bg-primary/10";
  };

  // Load admin notifications
  useEffect(() => {
    // Wait for user to be authenticated before subscribing
    // The security rules require an authenticated user
    if (!user) {
      console.log('⏳ [DEBUG] Waiting for user to be authenticated before subscribing to notifications...');
      return;
    }

    if (!hasInitializedRef.current) {
      setIsLoading(true);
      hasInitializedRef.current = true;
    }

    console.log('✅ [DEBUG] User authenticated, starting admin notification subscription...');

    const unsubscribeOrders = AdminFirebaseOrderService.subscribeToOrders((ordersData) => {
      setOrders(ordersData);
    });

    const unsubscribeNotifications =
      AdminFirebaseNotificationService.subscribeToAdminNotifications(
        (newNotifications) => {
          const limitedNotifications = newNotifications.slice(
            0,
            MAX_NOTIFICATIONS
          );

          setNotifications(limitedNotifications);
          const newUnreadCount = limitedNotifications.filter(
            (n) => !n.isRead
          ).length;

          setUnreadCount(newUnreadCount);
          setIsLoading(false);

          if (onNotificationCount) {
            onNotificationCount(newUnreadCount);
          }
        },
        (error: any) => {
          console.error('❌ [DEBUG] Notification subscription failed:', error);
          setIsLoading(false);

          if (error.code === 'failed-precondition') {
            toast({
              title: "Firestore Index Required",
              description: "Please check your browser console for the index creation link.",
              variant: "destructive",
            });
          }

          if (error.message.includes('permission')) {
            console.warn('⚠️ [DEBUG] Permission denied. This usually happens if the user session is still initializing.');
          }
        }
      );

    return () => {
      unsubscribeOrders();
      unsubscribeNotifications();
    };
  }, [onNotificationCount, user]);

  // Handle notification bell click
  const handleNotificationClick = async () => {
    await enableAudio();
    setShowNotifications(!showNotifications);

    if (!showNotifications && unreadCount > 0) {
      try {
        await AdminFirebaseNotificationService.markAllAdminNotificationsAsRead();
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // Handle individual notification click
  const handleNotificationItemClick = async (
    notification: AdminNotification
  ) => {
    setSelectedOrder(orders.filter((item) => item.orderNumber === notification.orderNumber)[0])

    if (!notification.isRead) {
      setMarkingAsRead(notification.id);
      try {
        await AdminFirebaseNotificationService.markNotificationAsRead(
          notification.id
        );


      } catch (error) {
        // Silent error handling
      } finally {
        setMarkingAsRead("");
      }
    }
  };

  // Handle show more/less notifications
  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showNotifications &&
        !target.closest('[data-testid="admin-notifications-dropdown"]')
      ) {
        setShowNotifications(false);
        setShowAll(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const hasMoreNotifications = notifications.length > INITIAL_DISPLAY_LIMIT;
  const hiddenNotificationsCount = notifications.length - INITIAL_DISPLAY_LIMIT;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative border rounded-full hover:bg-gray-300 hover:text-black"
        onClick={handleNotificationClick}
        data-testid="admin-notifications-button"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        {isLoading && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary rounded-full loading-pulse"></div>
        )}
      </Button>

      {showNotifications && (
        <div
          className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-[60] animate-in slide-in-from-top-2 duration-200"
          data-testid="admin-notifications-dropdown"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-card-foreground">
                  Admin Notifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} new notifications`
                    : notifications.length > 0
                      ? `${notifications.length} total notifications`
                      : "All caught up!"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNotifications(false);
                  setShowAll(false);
                }}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading admin notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="font-medium text-sm mb-2 text-card-foreground">
                  No notifications yet
                </h4>
                <p className="text-xs text-muted-foreground">
                  Admin notifications will appear here
                </p>
              </div>
            ) : (
              <>
                {displayedNotifications.map((notification, index) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const isMarking = markingAsRead === notification.id;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${getNotificationBackgroundColor(
                        notification
                      )} ${index === displayedNotifications.length - 1 &&
                        !hasMoreNotifications
                        ? "border-b-0"
                        : ""
                        }`}
                      onClick={() => handleNotificationItemClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-full bg-muted ${getNotificationIconColor(
                            notification.type
                          )} relative flex-shrink-0`}
                        >
                          <IconComponent size={16} />
                          {isMarking && (
                            <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-full">
                              <Loader2 size={12} className="animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate text-card-foreground">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                            {notification.message}
                          </p>

                          {/* Order Details for admin_order_placed */}
                          {notification.type === "admin_order_placed" && (
                            <div className="flex items-center mt-2 space-x-2 flex-wrap">
                              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                                ₹{notification.total}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                by {notification.customerName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(new Date(notification.createdAt))}
                            </p>

                            {notification.priority === "high" && (
                              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full flex items-center flex-shrink-0 border border-destructive/20">
                                <AlertTriangle size={10} className="mr-1" />
                                Priority
                              </span>
                            )}
                            {notification.isRead ? (
                              <CheckCircle size={14} className="text-green-500 ml-2" />

                            ) : (
                              <Circle size={10} className="text-primary ml-2" />
                            )}
                          </div>
                        </div>
                      </div>


                    </div>
                  );
                })}



                {hasMoreNotifications && (
                  <div className="p-3 border-t border-border bg-muted/30">
                    <Button
                      variant="ghost"
                      className="w-full text-sm flex items-center justify-center space-x-2"
                      onClick={handleToggleShowAll}
                    >
                      {showAll ? (
                        <>
                          <ChevronDown size={16} className="rotate-180" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <MoreHorizontal size={16} />
                          <span>Show {hiddenNotificationsCount} More</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleUpdateOrderStatus}
          onPaymentVerificationUpdate={handleUpdatePaymentVerification}
        />
      )}
    </div>
  );
}
