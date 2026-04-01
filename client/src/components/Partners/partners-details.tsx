import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { DeliveryPartner, Order } from "@/types/index";

interface PartnerDetailsProps {
    partner: DeliveryPartner;
    orders: Order[],
    todayDeliveries: number;
    onClose: () => void;
    onSave: (data: Partial<DeliveryPartner>) => Promise<void>;
}

export function PartnerDetails({ partner, todayDeliveries, onClose, onSave }: PartnerDetailsProps) {
    const [localPartner, setLocalPartner] = useState<DeliveryPartner>(partner);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLocalPartner(partner);
    }, [partner]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(localPartner);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Partner Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={localPartner.name}
                            onChange={(e) => setLocalPartner({ ...localPartner, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={localPartner.email || ""}
                            onChange={(e) => setLocalPartner({ ...localPartner, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input
                            value={localPartner.phone || ""}
                            onChange={(e) => setLocalPartner({ ...localPartner, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select
                            value={localPartner.status}
                            onValueChange={(value) =>
                                setLocalPartner({ ...localPartner, status: value as DeliveryPartner["status"] })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
                                <SelectItem value="busy">Busy</SelectItem>
                            </SelectContent>
                        </Select>
                        <Badge
                            className={
                                localPartner.status === "online"
                                    ? "bg-green-100 text-green-800"
                                    : localPartner.status === "offline"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-yellow-100 text-yellow-800"
                            }
                        >
                            {localPartner.status}
                        </Badge>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Admin Approved</label>
                        <Select
                            value={localPartner.adminApproved ? "approved" : "not_approved"}
                            onValueChange={(value) =>
                                setLocalPartner({ ...localPartner, adminApproved: value === "approved" })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="not_approved">Not Approved</SelectItem>
                            </SelectContent>
                        </Select>
                        <Badge
                            className={localPartner.adminApproved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                            {localPartner.adminApproved ? "Approved" : "Not Approved"}
                        </Badge>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Today's Deliveries</label>
                        <span className="ml-2 font-semibold">{todayDeliveries}</span>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
