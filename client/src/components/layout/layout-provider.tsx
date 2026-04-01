import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface LayoutContextType {
  activeView: string
  setActiveView: (view: string) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  searchValue: string
  setSearchValue: (value: string) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState("dashboard")
  const [darkMode, setDarkMode] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme")
    if (savedTheme) {
      setDarkMode(savedTheme === "dark")
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(prefersDark)
    }
  }, [])

  // Apply theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("admin-theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("admin-theme", "light")
    }
  }, [darkMode])

  const value = {
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    searchValue,
    setSearchValue,
  }

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
