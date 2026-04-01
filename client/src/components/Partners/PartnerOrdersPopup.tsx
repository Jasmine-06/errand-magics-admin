import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function PartnerOrdersPopup({ partner, orders, onClose }: any) {
    return (
        <Dialog open={!!partner} onOpenChange={onClose}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Orders Accepted by {partner?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {orders.length === 0 && (
                        <p className="text-gray-500 text-sm text-center">No accepted orders.</p>
                    )}

                    {orders.map((order: any) => (
                        <div
                            key={order.id}
                            className="border rounded-lg p-4 shadow-sm hover:bg-blue-500 transition"
                        >
                            <div className="flex justify-between">
                                <h3 className="font-semibold">Order #{order.id}</h3>
                                <Badge>
                                    {order.status}
                                </Badge>
                            </div>

                            <p className="text-sm text-gray-600 mt-1">
                                Customer: {order.customerName}
                            </p>

                            <p className="text-sm">
                                Amount: ₹{order.total}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                                Update At: {new Date(order.updatedAt).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
