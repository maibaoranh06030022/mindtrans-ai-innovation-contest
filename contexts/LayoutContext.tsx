'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useBreakpoint, type Breakpoint } from '@/hooks/useBreakpoint'

interface LayoutContextType {
  // Breakpoint info
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  
  // Sidebar state
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Notes panel state
  notesPanelOpen: boolean
  toggleNotesPanel: () => void
  setNotesPanelOpen: (open: boolean) => void
  
  // Mobile bottom sheet state
  bottomSheetOpen: boolean
  bottomSheetContent: 'notes' | 'menu' | null
  openBottomSheet: (content: 'notes' | 'menu') => void
  closeBottomSheet: () => void
  
  // Reading mode
  readingMode: boolean
  toggleReadingMode: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'mobile'
  const isTablet = breakpoint === 'tablet'
  const isDesktop = breakpoint === 'desktop'

  // Sidebar - collapsed by default on mobile/tablet
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Notes panel - open by default on desktop only
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)
  
  // Mobile bottom sheet
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [bottomSheetContent, setBottomSheetContent] = useState<'notes' | 'menu' | null>(null)
  
  // Reading mode
  const [readingMode, setReadingMode] = useState(false)

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const toggleNotesPanel = useCallback(() => {
    if (isMobile) {
      // On mobile, use bottom sheet instead
      if (bottomSheetOpen && bottomSheetContent === 'notes') {
        setBottomSheetOpen(false)
        setBottomSheetContent(null)
      } else {
        setBottomSheetOpen(true)
        setBottomSheetContent('notes')
      }
    } else {
      setNotesPanelOpen(prev => !prev)
    }
  }, [isMobile, bottomSheetOpen, bottomSheetContent])

  const openBottomSheet = useCallback((content: 'notes' | 'menu') => {
    setBottomSheetOpen(true)
    setBottomSheetContent(content)
  }, [])

  const closeBottomSheet = useCallback(() => {
    setBottomSheetOpen(false)
    setBottomSheetContent(null)
  }, [])

  const toggleReadingMode = useCallback(() => {
    setReadingMode(prev => !prev)
  }, [])

  return (
    <LayoutContext.Provider
      value={{
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        notesPanelOpen,
        toggleNotesPanel,
        setNotesPanelOpen,
        bottomSheetOpen,
        bottomSheetContent,
        openBottomSheet,
        closeBottomSheet,
        readingMode,
        toggleReadingMode,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

// Export a non-throwing version for components that might render outside provider
export function useLayoutSafe(): LayoutContextType | null {
  return useContext(LayoutContext) ?? null
}
