import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Package,
  Clock,
  CreditCard,
  User,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Truck,
  Star,
  MessageSquare,
  Loader2,
} from "lucide-react";
import type { Order } from "@/types";
import { ORDER_STATUSES } from "@/constants";
import { AdminFirebaseDeliveryService } from "@/services/firebase-admin-deliveries";
import { AdminFirebaseDeliveryPartnerService } from "@/services/firebase-admin-delivery-partnerService";

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order["status"]) => Promise<void>;
  onPaymentVerificationUpdate: (
    orderId: string,
    status: "verified" | "rejected",
    reason?: string
  ) => Promise<void>;
}

export function OrderDetails({
  order,
  onClose,
  onStatusUpdate,
  onPaymentVerificationUpdate,
}: OrderDetailsProps) {
  const [localOrder, setLocalOrder] = useState<Order>(order);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState(false);
  const [showPaymentImage, setShowPaymentImage] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const unsub = AdminFirebaseDeliveryPartnerService.subscribeToPartners(
      (list) => setPartners(list)
    );
    return () => unsub();
  }, []);


  useEffect(() => {
    const unsub = AdminFirebaseDeliveryService.subscribeToDeliveries(
      (list) => setDeliveries(list)
    );

    return () => unsub();
  }, []);

  // Update local order when prop changes (for real-time updates)
  useEffect(() => {
    setLocalOrder(order);
  }, [order]);

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
    const d = date?.toDate?.() || new Date(date);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: Order["status"]) => {
    if (statusUpdating) return;

    setStatusUpdating(true);

    // Optimistic update
    const updatedOrder = {
      ...localOrder,
      status: newStatus,
      updatedAt: new Date(),
    };

    // Update tracking based on status with proper type safety
    const currentTracking = localOrder.orderTracking || { placedAt: localOrder.createdAt };

    if (newStatus === "confirmed" && !currentTracking.confirmedAt) {
      updatedOrder.orderTracking = {
        ...currentTracking,
        placedAt: currentTracking.placedAt || localOrder.createdAt,
        confirmedAt: new Date(),
      };
    } else if (newStatus === "preparing" && !currentTracking.preparingAt) {
      updatedOrder.orderTracking = {
        ...currentTracking,
        placedAt: currentTracking.placedAt || localOrder.createdAt,
        preparingAt: new Date(),
      };
    } else if (newStatus === "out_for_delivery" && !currentTracking.outForDeliveryAt) {
      updatedOrder.orderTracking = {
        ...currentTracking,
        placedAt: currentTracking.placedAt || localOrder.createdAt,
        outForDeliveryAt: new Date(),
      };
    } else if (newStatus === "delivered" && !currentTracking.deliveredAt) {
      updatedOrder.orderTracking = {
        ...currentTracking,
        placedAt: currentTracking.placedAt || localOrder.createdAt,
        deliveredAt: new Date(),
      };
      updatedOrder.paymentStatus = "completed" as const;
      updatedOrder.deliverySlot = {
        ...localOrder.deliverySlot,
        actualDeliveryTime: new Date()
      };
    }

    setLocalOrder(updatedOrder);

    try {
      await onStatusUpdate(localOrder.id, newStatus);
    } catch (error) {
      // Revert optimistic update on error
      setLocalOrder(order);
    } finally {
      setStatusUpdating(false);
    }
  };
  // Handle payment verification update with optimistic UI
  const handleVerificationUpdate = async (status: "verified" | "rejected") => {
    if (verifyingPayment || rejectingPayment) return;

    if (status === "verified") {
      setVerifyingPayment(true);
    } else {
      setRejectingPayment(true);
    }

    // Optimistic update
    const updatedOrder = {
      ...localOrder,
      paymentDetails: {
        ...localOrder.paymentDetails,
        verificationStatus: status,
      },
      paymentStatus: status === "verified" ? "completed" : "failed",
      updatedAt: new Date(),
    };

    setLocalOrder(updatedOrder as Order);

    try {
      await onPaymentVerificationUpdate(localOrder.id, status);
    } catch (error) {
      // Revert optimistic update on error
      setLocalOrder(order);
    } finally {
      setVerifyingPayment(false);
      setRejectingPayment(false);
    }
  };

  // Get verification status
  const verificationStatus =
    localOrder.paymentDetails?.verificationStatus || "pending";
  const isUpiPayment = localOrder.paymentMethod === "upi_online";

  return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="order-details-description">
          <DialogDescription id="order-details-description">
            Detailed information about the order, including items, timeline, customer, payment, and delivery details.
          </DialogDescription>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Order #{localOrder.orderNumber}</span>
              {getStatusBadge(localOrder.status)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(localOrder.createdAt)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items ({localOrder.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {localOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {item.productName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} ×{" "}
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(localOrder.subtotal)}</span>
                  </div>
                  {localOrder.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(localOrder.deliveryFee)}</span>
                    </div>
                  )}
                  {localOrder.taxes > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Taxes:</span>
                      <span>{formatCurrency(localOrder.taxes)}</span>
                    </div>
                  )}
                  {localOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(localOrder.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(localOrder.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Placed */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          localOrder.orderTracking?.placedAt ||
                          localOrder.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Order Confirmed */}
                  {localOrder.orderTracking?.confirmedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(localOrder.orderTracking.confirmedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preparing */}
                  {localOrder.orderTracking?.preparingAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Preparing Order</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(localOrder.orderTracking.preparingAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Out for Delivery */}
                  {localOrder.orderTracking?.outForDeliveryAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Out for Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(
                            localOrder.orderTracking.outForDeliveryAt
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Delivered */}
                  {localOrder.orderTracking?.deliveredAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Order Delivered</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(localOrder.orderTracking.deliveredAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estimated Delivery */}
                  {localOrder.status !== "delivered" && (
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-3 h-3 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium">Estimated Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(localOrder.estimatedDeliveryTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Review */}
            {localOrder.rating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Customer Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < localOrder.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                            }`}
                        />
                      ))}
                      <span className="font-medium">{localOrder.rating}/5</span>
                    </div>
                    {localOrder.review && (
                      <p className="text-sm text-muted-foreground">
                        {localOrder.review}
                      </p>
                    )}
                    {localOrder.reviewedAt && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed on {formatDate(localOrder.reviewedAt)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Customer Info & Actions */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary">
                      {localOrder.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{localOrder.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Customer ID: {localOrder.customerId}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{localOrder.customerPhone}</span>
                  </div>

                  {localOrder.customerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{localOrder.customerEmail}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">
                        {localOrder.deliveryAddress.receiverName}
                      </p>
                      <p>{localOrder.deliveryAddress.fullAddress}</p>
                      <p className="text-muted-foreground">
                        {localOrder.deliveryAddress.city},{" "}
                        {localOrder.deliveryAddress.state} -{" "}
                        {localOrder.deliveryAddress.pinCode}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Method:
                    </span>
                    <Badge variant="outline">
                      {localOrder.paymentMethod === "cash_on_delivery"
                        ? "Cash on Delivery"
                        : "UPI Online"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      className={
                        localOrder.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : localOrder.paymentStatus === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {localOrder.paymentStatus?.charAt(0).toUpperCase() +
                        localOrder.paymentStatus?.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Verification:
                    </span>
                    <Badge
                      className={
                        verificationStatus === "verified"
                          ? "bg-green-100 text-green-800"
                          : verificationStatus === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {verificationStatus === "verified"
                        ? "Verified"
                        : verificationStatus === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Amount:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(localOrder.total)}
                    </span>
                  </div>
                </div>

                {/* UPI Payment Details */}
                {isUpiPayment &&
                  localOrder.paymentDetails &&
                  "upiTransactionId" in localOrder.paymentDetails && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="font-medium text-sm">
                        UPI Transaction Details
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Transaction ID:
                          </span>
                          <span className="font-mono text-xs">
                            {localOrder.paymentDetails.upiTransactionId}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">UPI ID:</span>
                          <span className="text-xs">
                            {localOrder.paymentDetails.upiId}
                          </span>
                        </div>

                        {localOrder.paymentDetails.paymentScreenshot && (
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">
                              Payment Screenshot:
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setShowPaymentImage(true)}
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              View Screenshot
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Payment Verification Actions */}
                {verificationStatus === "pending" && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="font-medium text-sm">Verify Payment</h4>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleVerificationUpdate("verified")}
                        disabled={verifyingPayment || rejectingPayment}
                      >
                        {verifyingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Verify
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleVerificationUpdate("rejected")}
                        disabled={verifyingPayment || rejectingPayment}
                      >
                        {rejectingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {localOrder.deliverySlot.type.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Estimated Time:
                  </span>
                  <span className="text-sm">
                    {formatDate(localOrder.deliverySlot.estimatedTime)}
                  </span>
                </div>

                {localOrder.deliverySlot.actualDeliveryTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Actual Delivery:
                    </span>
                    <span className="text-sm">
                      {formatDate(localOrder.deliverySlot.actualDeliveryTime)}
                    </span>
                  </div>
                )}

                {localOrder.deliverySlot.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Delivery Fee:
                    </span>
                    <span className="text-sm">
                      {formatCurrency(localOrder.deliverySlot.fee)}
                    </span>
                  </div>
                )}

                {localOrder.deliverySlot.scheduledDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Scheduled Date:
                    </span>
                    <span className="text-sm">
                      {localOrder.deliverySlot.scheduledDate}
                    </span>
                  </div>
                )}

                {localOrder.deliverySlot.scheduledTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Scheduled Time:
                    </span>
                    <span className="text-sm">
                      {localOrder.deliverySlot.scheduledTime}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Update Order Status
                  </label>
                  <Select
                    value={localOrder.status}
                    onValueChange={(value) =>
                      handleStatusUpdate(value as Order["status"])
                    }
                    disabled={statusUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {statusUpdating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating status...
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(localOrder.notes || localOrder.specialInstructions) && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {localOrder.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">
                        Customer Notes:
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {localOrder.notes}
                      </p>
                    </div>
                  )}
                  {localOrder.specialInstructions && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">
                        Special Instructions:
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {localOrder.specialInstructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Payment Screenshot Modal */}
        {showPaymentImage &&
          isUpiPayment &&
          localOrder.paymentDetails &&
          "paymentScreenshot" in localOrder.paymentDetails && (
            <Dialog open={showPaymentImage} onOpenChange={setShowPaymentImage}>
              <DialogContent className="max-w-2xl" aria-describedby="payment-screenshot-description">
                <DialogDescription id="payment-screenshot-description">
                  Screenshot of the payment made for this order.
                </DialogDescription>
                <DialogHeader>
                  <DialogTitle>Payment Screenshot</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <img
                    src={localOrder.paymentDetails.paymentScreenshot}
                    alt="Payment Screenshot"
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setShowPaymentImage(false)}>
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
      </DialogContent>
    </Dialog>
  );
}
