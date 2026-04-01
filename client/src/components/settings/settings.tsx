import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Timer, Globe, CheckCircle, Plus, Trash2, Edit, Clock, Loader2, CreditCard, Upload, Image as ImageIcon, X, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import type { TimeRulesConfig, Category, TimeSlot, CategoryReference, UpiPaymentMethod } from "@/types"




interface SettingsProps {
  timeRules: TimeRulesConfig
  categories: Category[]
  timeSlots: TimeSlot[]
  onUpdateTimeRules: (rules: TimeRulesConfig) => Promise<void>
  onCreateTimeSlot: (timeSlot: Omit<TimeSlot, "id">) => Promise<void>
  onUpdateTimeSlot: (id: string, timeSlot: Partial<TimeSlot>) => Promise<void>
  onDeleteTimeSlot: (id: string) => Promise<void>
  // New UPI payment methods props
  upiMethods?: UpiPaymentMethod[]
  onCreateUpiMethod?: (method: Omit<UpiPaymentMethod, "id">) => Promise<void>
  onUpdateUpiMethod?: (id: string, method: Partial<UpiPaymentMethod>) => Promise<void>
  onDeleteUpiMethod?: (id: string) => Promise<void>
  loading?: boolean
}

// Predefined time slot templates
const TIME_SLOT_TEMPLATES = [
  { value: "morning", label: "Morning", icon: "🌅", defaultStart: "06:00", defaultEnd: "12:00" },
  { value: "afternoon", label: "Afternoon", icon: "☀️", defaultStart: "12:00", defaultEnd: "18:00" },
  { value: "evening", label: "Evening", icon: "🌆", defaultStart: "18:00", defaultEnd: "22:00" },
  { value: "night", label: "Night", icon: "🌙", defaultStart: "22:00", defaultEnd: "06:00" },
]

// Time options for 12-hour format
const generateTimeOptions = () => {
  const times = []
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString()
      const minuteStr = minute.toString().padStart(2, '0')
      times.push(`${hourStr}:${minuteStr} AM`)
      times.push(`${hourStr}:${minuteStr} PM`)
    }
  }
  return times
}

// Convert 12-hour to 24-hour format
const convertTo24Hour = (time12: string) => {
  const [time, period] = time12.split(' ')
  const [hours, minutes] = time.split(':')
  let hour24 = parseInt(hours)
  
  if (period === 'AM' && hour24 === 12) {
    hour24 = 0
  } else if (period === 'PM' && hour24 !== 12) {
    hour24 += 12
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`
}

// Convert 24-hour to 12-hour format
const convertTo12Hour = (time24: string) => {
  if (!time24) return ""
  
  const [hours, minutes] = time24.split(':')
  let hour12 = parseInt(hours)
  const period = hour12 >= 12 ? 'PM' : 'AM'
  
  if (hour12 === 0) {
    hour12 = 12
  } else if (hour12 > 12) {
    hour12 -= 12
  }
  
  return `${hour12}:${minutes} ${period}`
}

export function Settings({ 
  timeRules, 
  categories, 
  timeSlots,
  onUpdateTimeRules,
  onCreateTimeSlot,
  onUpdateTimeSlot,
  onDeleteTimeSlot,
  upiMethods = [],
  onCreateUpiMethod,
  onUpdateUpiMethod,
  onDeleteUpiMethod,
  loading 
}: SettingsProps) {
  const [localTimeRules, setLocalTimeRules] = useState<TimeRulesConfig>(timeRules)
  const [saving, setSaving] = useState(false)
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false)
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deletingTimeSlot, setDeletingTimeSlot] = useState<string | null>(null)
  
  // UPI Payment Method states
  const [showUpiDialog, setShowUpiDialog] = useState(false)
  const [editingUpiMethod, setEditingUpiMethod] = useState<UpiPaymentMethod | null>(null)
  const [upiFormSubmitting, setUpiFormSubmitting] = useState(false)
  const [deletingUpiMethod, setDeletingUpiMethod] = useState<string | null>(null)
  const [qrImageUploading, setQrImageUploading] = useState(false)
  const [qrImagePreview, setQrImagePreview] = useState<string>("")
  
  const [timeSlotForm, setTimeSlotForm] = useState({
    name: "",
    label: "",
    icon: "",
    startTime12: "",
    endTime12: "",
    isActive: true,
    order: 0,
  })

  const [upiForm, setUpiForm] = useState({
    name: "",
    upiId: "",
    qrImageUrl: "",
    isActive: true,
  })

  const timeOptions = generateTimeOptions()

  // Upload QR image to Cloudinary
  const uploadQrImageToCloudinary = async (file: File) => {
    const cloudinaryData = new FormData()
    cloudinaryData.append("file", file)
    cloudinaryData.append("upload_preset", "Images")
    cloudinaryData.append("asset_folder", "UpiQrCodes")
    cloudinaryData.append("cloud_name", "dqoo1d1ip")
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dqoo1d1ip/image/upload`,
      {
        method: 'POST',
        body: cloudinaryData,
      }
    )

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.secure_url
  }

  // Handle QR image upload
  const handleQrImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF, WebP)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    try {
      setQrImageUploading(true)
      
      const previewUrl = URL.createObjectURL(file)
      setQrImagePreview(previewUrl)

      const cloudinaryUrl = await uploadQrImageToCloudinary(file)
      
      setUpiForm(prev => ({ ...prev, qrImageUrl: cloudinaryUrl }))
      
      URL.revokeObjectURL(previewUrl)
      setQrImagePreview(cloudinaryUrl)
      
    } catch (error: any) {
      console.error("Error uploading QR image:", error)
      alert("Failed to upload QR image. Please try again.")
      setQrImagePreview("")
      setUpiForm(prev => ({ ...prev, qrImageUrl: "" }))
    } finally {
      setQrImageUploading(false)
    }
  }

  // Remove QR image
  const handleRemoveQrImage = () => {
    setQrImagePreview("")
    setUpiForm(prev => ({ ...prev, qrImageUrl: "" }))
  }

  // Reset UPI form
  const resetUpiForm = () => {
    setUpiForm({
      name: "",
      upiId: "",
      qrImageUrl: "",
      isActive: true,
    })
    setQrImagePreview("")
    setEditingUpiMethod(null)
  }

  // Handle UPI method submit
  const handleUpiMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!upiForm.name || !upiForm.upiId) {
      alert("Please fill in all required fields")
      return
    }

    if (!upiForm.qrImageUrl) {
      alert("Please upload a QR code image")
      return
    }

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z]+$/
    if (!upiRegex.test(upiForm.upiId)) {
      alert("Please enter a valid UPI ID (e.g., user@paytm)")
      return
    }

    setUpiFormSubmitting(true)
    try {
      const methodData = {
        name: upiForm.name,
        upiId: upiForm.upiId,
        qrImageUrl: upiForm.qrImageUrl,
        isActive: upiForm.isActive,
      }

      if (editingUpiMethod && onUpdateUpiMethod) {
        await onUpdateUpiMethod(editingUpiMethod.id, methodData)
      } else if (onCreateUpiMethod) {
        await onCreateUpiMethod(methodData)
      }

      resetUpiForm()
      setShowUpiDialog(false)
    } catch (error) {
      console.error("Error saving UPI method:", error)
      alert("Failed to save UPI method. Please try again.")
    } finally {
      setUpiFormSubmitting(false)
    }
  }

  // Handle edit UPI method
  const handleEditUpiMethod = (method: UpiPaymentMethod) => {
    setUpiForm({
      name: method.name,
      upiId: method.upiId,
      qrImageUrl: method.qrImageUrl,
      isActive: method.isActive,
    })
    setQrImagePreview(method.qrImageUrl)
    setEditingUpiMethod(method)
    setShowUpiDialog(true)
  }

  // Handle delete UPI method
  const handleDeleteUpiMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this UPI payment method? This action cannot be undone.")) {
      return
    }

    setDeletingUpiMethod(methodId)
    try {
      if (onDeleteUpiMethod) {
        await onDeleteUpiMethod(methodId)
      }
    } catch (error) {
      console.error("Error deleting UPI method:", error)
      alert("Failed to delete UPI method. Please try again.")
    } finally {
      setDeletingUpiMethod(null)
    }
  }

  // Get current time slot based on time
  const getCurrentTimeSlot = () => {
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    return timeSlots.find(slot => {
      if (!slot.isActive) return false
      
      const [startHour, startMin] = slot.startTime.split(':').map(Number)
      const [endHour, endMin] = slot.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      let endMinutes = endHour * 60 + endMin
      
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60
        return currentTime >= startMinutes || currentTime <= (endMinutes - 24 * 60)
      }
      
      return currentTime >= startMinutes && currentTime <= endMinutes
    })
  }

  // Get available categories for current time
  const getAvailableCategories = () => {
    const currentSlot = getCurrentTimeSlot()
    if (!currentSlot || !localTimeRules[currentSlot.id]) return []
    
    return localTimeRules[currentSlot.id].allowedCategories || []
  }

  // Updated time rule change handler with proper structure
  const handleTimeRuleChange = (timeSlotId: string, categoryId: string, checked: boolean) => {
    const timeSlot = timeSlots.find(ts => ts.id === timeSlotId)
    if (!timeSlot) return

    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    const newRules = { ...localTimeRules }
    
    if (!newRules[timeSlotId]) {
      newRules[timeSlotId] = {
        timeSlotName: timeSlot.name,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        allowedCategories: [],
        isActive: timeSlot.isActive,
      }
    }

    const categoryRef: CategoryReference = {
      id: category.id,
      name: category.name,
    }

    if (checked) {
      const existingIndex = newRules[timeSlotId].allowedCategories.findIndex(c => c.id === categoryId)
      if (existingIndex === -1) {
        newRules[timeSlotId].allowedCategories.push(categoryRef)
      }
    } else {
      newRules[timeSlotId].allowedCategories = newRules[timeSlotId].allowedCategories.filter(
        c => c.id !== categoryId
      )
    }

    setLocalTimeRules(newRules)
  }

  // Check if category is selected for a time slot
  const isCategorySelected = (timeSlotId: string, categoryId: string): boolean => {
    const rule = localTimeRules[timeSlotId]
    if (!rule) return false
    
    return rule.allowedCategories.some(c => c.id === categoryId)
  }

  const handleSaveTimeRules = async () => {
    setSaving(true)
    try {
      await onUpdateTimeRules(localTimeRules)
    } catch (error) {
      console.error("Error saving time rules:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleTemplateSelect = (template: typeof TIME_SLOT_TEMPLATES[0]) => {
    setTimeSlotForm({
      ...timeSlotForm,
      name: template.value,
      label: template.label,
      icon: template.icon,
      startTime12: convertTo12Hour(template.defaultStart),
      endTime12: convertTo12Hour(template.defaultEnd),
    })
  }

  const handleTimeSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!timeSlotForm.startTime12 || !timeSlotForm.endTime12) {
      alert("Please select both start and end times")
      return
    }

    setFormSubmitting(true)
    try {
      const startTime24 = convertTo24Hour(timeSlotForm.startTime12)
      const endTime24 = convertTo24Hour(timeSlotForm.endTime12)

      const timeSlotData = {
        name: timeSlotForm.name,
        label: timeSlotForm.label,
        icon: timeSlotForm.icon || "⏰",
        startTime: startTime24,
        endTime: endTime24,
        isActive: timeSlotForm.isActive,
        order: timeSlotForm.order,
      }

      if (editingTimeSlot) {
        await onUpdateTimeSlot(editingTimeSlot.id, timeSlotData)
      } else {
        await onCreateTimeSlot(timeSlotData)
      }
      resetTimeSlotForm()
      setShowTimeSlotDialog(false)
    } catch (error) {
      console.error("Error saving time slot:", error)
    } finally {
      setFormSubmitting(false)
    }
  }

  const resetTimeSlotForm = () => {
    setTimeSlotForm({
      name: "",
      label: "",
      icon: "",
      startTime12: "",
      endTime12: "",
      isActive: true,
      order: timeSlots.length,
    })
    setEditingTimeSlot(null)
  }

  const handleEditTimeSlot = (timeSlot: TimeSlot) => {
    setTimeSlotForm({
      name: timeSlot.name,
      label: timeSlot.label,
      icon: timeSlot.icon,
      startTime12: convertTo12Hour(timeSlot.startTime),
      endTime12: convertTo12Hour(timeSlot.endTime),
      isActive: timeSlot.isActive,
      order: timeSlot.order,
    })
    setEditingTimeSlot(timeSlot)
    setShowTimeSlotDialog(true)
  }

  const handleDeleteTimeSlot = async (timeSlotId: string) => {
    if (!confirm("Are you sure you want to delete this time slot? This action cannot be undone.")) {
      return
    }

    setDeletingTimeSlot(timeSlotId)
    try {
      await onDeleteTimeSlot(timeSlotId)
      
      const newRules = { ...localTimeRules }
      delete newRules[timeSlotId]
      setLocalTimeRules(newRules)
      
    } catch (error) {
      console.error("Error deleting time slot:", error)
    } finally {
      setDeletingTimeSlot(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="h-12 bg-muted rounded"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSlot = getCurrentTimeSlot()
  const availableCategories = getAvailableCategories()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure your admin panel and business rules</p>
      </div>

      <Tabs defaultValue="time-rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time-rules">Time Rules</TabsTrigger>
          <TabsTrigger value="time-slots">Time Slots</TabsTrigger>
          <TabsTrigger value="manual-payments">Manual Payments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="time-rules" className="space-y-6">
          {/* Current Active Slot Info */}
          {currentSlot && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{currentSlot.icon}</span>
                  <div>
                    <h3 className="font-semibold text-primary">Currently Active: {currentSlot.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {convertTo12Hour(currentSlot.startTime)} - {convertTo12Hour(currentSlot.endTime)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <Badge key={cat.id} variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Time-Based Category Rules
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure which categories are available during specific time slots
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {timeSlots
                .filter(slot => slot.isActive)
                .sort((a, b) => a.order - b.order)
                .map((slot) => (
                <div key={slot.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{slot.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{slot.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                      </p>
                    </div>
                    {localTimeRules[slot.id] && (
                      <Badge variant="outline" className="ml-auto">
                        {localTimeRules[slot.id].allowedCategories.length} categories
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categories
                      .filter(cat => cat.isActive)
                      .map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${slot.id}-${category.id}`}
                          checked={isCategorySelected(slot.id, category.id)}
                          onChange={(e) =>
                            handleTimeRuleChange(slot.id, category.id, e.target.checked)
                          }
                          className="rounded"
                          disabled={saving}
                        />
                        <Label htmlFor={`${slot.id}-${category.id}`} className="text-sm">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border">
                <Button onClick={handleSaveTimeRules} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Time Rules
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Slots Tab - Same as before */}
        <TabsContent value="time-slots" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Slots Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create and manage time slots for category availability
                  </p>
                </div>
                <Dialog open={showTimeSlotDialog} onOpenChange={setShowTimeSlotDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetTimeSlotForm} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Time Slot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTimeSlot ? "Edit Time Slot" : "Create New Time Slot"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure the time slot details and availability window
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTimeSlotSubmit} className="space-y-4">
                      {!editingTimeSlot && (
                        <div className="space-y-2">
                          <Label>Quick Templates</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {TIME_SLOT_TEMPLATES.map((template) => (
                              <Button
                                key={template.value}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTemplateSelect(template)}
                                className="justify-start gap-2"
                                disabled={formSubmitting}
                              >
                                <span>{template.icon}</span>
                                {template.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={timeSlotForm.name}
                          onChange={(e) => setTimeSlotForm({...timeSlotForm, name: e.target.value})}
                          placeholder="e.g., morning"
                          required
                          disabled={formSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="label">Display Label *</Label>
                        <Input
                          id="label"
                          value={timeSlotForm.label}
                          onChange={(e) => setTimeSlotForm({...timeSlotForm, label: e.target.value})}
                          placeholder="e.g., Morning"
                          required
                          disabled={formSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="icon">Icon (Optional)</Label>
                        <Input
                          id="icon"
                          value={timeSlotForm.icon}
                          onChange={(e) => setTimeSlotForm({...timeSlotForm, icon: e.target.value})}
                          placeholder="🌅 (emoji or leave empty for default)"
                          disabled={formSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time *</Label>
                          <Select
                            value={timeSlotForm.startTime12}
                            onValueChange={(value) => setTimeSlotForm({...timeSlotForm, startTime12: value})}
                            required
                            disabled={formSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time *</Label>
                          <Select
                            value={timeSlotForm.endTime12}
                            onValueChange={(value) => setTimeSlotForm({...timeSlotForm, endTime12: value})}
                            required
                            disabled={formSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={timeSlotForm.isActive}
                          onCheckedChange={(checked) => setTimeSlotForm({...timeSlotForm, isActive: checked})}
                          disabled={formSubmitting}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowTimeSlotDialog(false)}
                          disabled={formSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={formSubmitting}>
                          {formSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              {editingTimeSlot ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            editingTimeSlot ? "Update Time Slot" : "Create Time Slot"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSlots
                  .sort((a, b) => a.order - b.order)
                  .map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{slot.icon}</span>
                      <div>
                        <h3 className="font-semibold">{slot.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {convertTo12Hour(slot.startTime)} - {convertTo12Hour(slot.endTime)}
                        </p>
                        {localTimeRules[slot.id] && (
                          <p className="text-xs text-muted-foreground">
                            {localTimeRules[slot.id].allowedCategories.length} categories assigned
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={slot.isActive ? "default" : "secondary"}>
                        {slot.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTimeSlot(slot)}
                        disabled={formSubmitting || deletingTimeSlot === slot.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTimeSlot(slot.id)}
                        disabled={formSubmitting || deletingTimeSlot === slot.id}
                      >
                        {deletingTimeSlot === slot.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {timeSlots.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No time slots created yet</p>
                    <p className="text-sm">Add your first time slot to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW Manual Payments Tab */}
        <TabsContent value="manual-payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Manual Payment Methods
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure UPI payment methods with QR codes for manual transactions
                  </p>
                </div>
                <Dialog open={showUpiDialog} onOpenChange={setShowUpiDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetUpiForm} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add UPI Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingUpiMethod ? "Edit UPI Payment Method" : "Add New UPI Payment Method"}
                      </DialogTitle>
                      <DialogDescription>
                        Configure UPI payment details and upload QR code for customers
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpiMethodSubmit} className="space-y-4">
                      {/* QR Code Image Upload */}
                      <div className="space-y-2">
                        <Label>QR Code Image *</Label>
                        
                        {!qrImagePreview ? (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                            <div className="space-y-4">
                              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                              <div className="space-y-2">
                                <Label htmlFor="qr-upload" className="cursor-pointer">
                                  <div className="flex items-center justify-center gap-2">
                                    {qrImageUploading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Upload QR Code
                                      </>
                                    )}
                                  </div>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  PNG, JPG, GIF, WebP up to 5MB
                                </p>
                              </div>
                              <Input
                                id="qr-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleQrImageChange}
                                disabled={qrImageUploading || upiFormSubmitting}
                                className="sr-only"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={qrImagePreview}
                                alt="QR Code preview"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleRemoveQrImage}
                                  disabled={qrImageUploading || upiFormSubmitting}
                                  className="gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 text-center">
                              <Label htmlFor="qr-replace" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                Click to replace QR code
                              </Label>
                              <Input
                                id="qr-replace"
                                type="file"
                                accept="image/*"
                                onChange={handleQrImageChange}
                                disabled={qrImageUploading || upiFormSubmitting}
                                className="sr-only"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upi-name">Payment Method Name *</Label>
                        <Input
                          id="upi-name"
                          value={upiForm.name}
                          onChange={(e) => setUpiForm({...upiForm, name: e.target.value})}
                          placeholder="e.g., Main UPI Account, Business Account"
                          required
                          disabled={upiFormSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upi-id">UPI ID *</Label>
                        <div className="flex">
                          <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <Input
                            id="upi-id"
                            value={upiForm.upiId}
                            onChange={(e) => setUpiForm({...upiForm, upiId: e.target.value})}
                            placeholder="username@paytm"
                            required
                            disabled={upiFormSubmitting}
                            className="rounded-l-none"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter your UPI ID (e.g., user@paytm, user@phonepe)
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="upi-active"
                          checked={upiForm.isActive}
                          onCheckedChange={(checked) => setUpiForm({...upiForm, isActive: checked})}
                          disabled={upiFormSubmitting}
                        />
                        <Label htmlFor="upi-active">Active</Label>
                      </div>

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowUpiDialog(false)}
                          disabled={upiFormSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={upiFormSubmitting || qrImageUploading}>
                          {upiFormSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              {editingUpiMethod ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            editingUpiMethod ? "Update Method" : "Add Method"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upiMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border">
                        <img
                          src={method.qrImageUrl}
                          alt={`QR Code for ${method.name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{method.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {method.upiId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {method.createdAt ? new Date(method.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={method.isActive ? "default" : "secondary"}>
                        {method.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUpiMethod(method)}
                        disabled={upiFormSubmitting || deletingUpiMethod === method.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUpiMethod(method.id)}
                        disabled={upiFormSubmitting || deletingUpiMethod === method.id}
                      >
                        {deletingUpiMethod === method.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {upiMethods.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No UPI payment methods configured</p>
                    <p className="text-sm">Add your first UPI method to accept manual payments</p>
                  </div>
                )}
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
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">SMS Service</h3>
                    <Badge variant="outline">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Send order updates and notifications via SMS</p>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
