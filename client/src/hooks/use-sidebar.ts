import { useState, useEffect } from "react"

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1024 // lg breakpoint

      if (isLargeScreen) {
        // On large screens, close mobile sidebar
        setIsMobileOpen(false)
      } else {
        // On small screens, ensure sidebar is not collapsed (when mobile menu opens, it should be full width)
        if (isMobileOpen) {
          setIsCollapsed(false)
        }
      }
    }

    // Initial check
    handleResize()

    // Listen for resize events
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [isMobileOpen])

  // Close mobile sidebar when clicking outside or navigating
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false)
      }
    }

    if (isMobileOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  const toggleSidebar = () => {
    const isLargeScreen = window.innerWidth >= 1024

    if (isLargeScreen) {
      // On desktop, toggle collapsed state
      setIsCollapsed(!isCollapsed)
    } else {
      // On mobile, toggle mobile sidebar
      setIsMobileOpen(!isMobileOpen)
    }
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    closeMobileSidebar,
    setIsCollapsed,
    setIsMobileOpen,
  }
}
