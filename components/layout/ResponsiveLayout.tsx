'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResponsiveLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  notesPanel?: ReactNode
  showSidebar?: boolean
  showNotesPanel?: boolean
  className?: string
}

export function ResponsiveLayout({
  children,
  sidebar,
  notesPanel,
  showSidebar = true,
  showNotesPanel = true,
  className,
}: ResponsiveLayoutProps) {
  const {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    sidebarOpen,
    toggleSidebar,
    notesPanelOpen,
    toggleNotesPanel,
    bottomSheetOpen,
    bottomSheetContent,
    closeBottomSheet,
  } = useLayout()

  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Main Layout Container */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* === SIDEBAR === */}
        {showSidebar && sidebar && (
          <>
            {/* Desktop Sidebar - Always visible, collapsible */}
            {isDesktop && (
              <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 280 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:block bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden flex-shrink-0"
              >
                <div className="w-[280px] h-full overflow-y-auto">
                  {sidebar}
                </div>
              </motion.aside>
            )}

            {/* Desktop Sidebar Toggle */}
            {isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 h-12 w-6 rounded-l-none rounded-r-lg bg-card border border-l-0 border-border hover:bg-muted"
                style={{ left: sidebarOpen ? 280 : 0 }}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Tablet/Mobile Sidebar - Overlay */}
            {!isDesktop && (
              <AnimatePresence>
                {sidebarOpen && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={toggleSidebar}
                      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                    {/* Sidebar Panel */}
                    <motion.aside
                      initial={{ x: -280 }}
                      animate={{ x: 0 }}
                      exit={{ x: -280 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar text-sidebar-foreground z-50 overflow-y-auto lg:hidden"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="absolute top-4 right-4"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      {sidebar}
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>
            )}
          </>
        )}

        {/* === MAIN CONTENT === */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            // Add padding at bottom for mobile nav
            isMobile && 'pb-20'
          )}
        >
          {children}
        </main>

        {/* === NOTES PANEL === */}
        {showNotesPanel && notesPanel && (
          <>
            {/* Desktop Notes Panel - Slide from right */}
            {isDesktop && (
              <motion.aside
                initial={false}
                animate={{ width: notesPanelOpen ? 360 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:block bg-card border-l border-border overflow-hidden flex-shrink-0"
              >
                <div className="w-[360px] h-full overflow-y-auto">
                  {notesPanel}
                </div>
              </motion.aside>
            )}

            {/* Tablet Notes - Right overlay */}
            {isTablet && (
              <AnimatePresence>
                {notesPanelOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={toggleNotesPanel}
                      className="fixed inset-0 bg-black/50 z-40"
                    />
                    <motion.aside
                      initial={{ x: 360 }}
                      animate={{ x: 0 }}
                      exit={{ x: 360 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="fixed right-0 top-0 bottom-0 w-[360px] bg-card z-50 overflow-y-auto border-l border-border"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleNotesPanel}
                        className="absolute top-4 right-4"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      {notesPanel}
                    </motion.aside>
                  </>
                )}
              </AnimatePresence>
            )}
          </>
        )}
      </div>

      {/* === MOBILE BOTTOM SHEET === */}
      {isMobile && (
        <AnimatePresence>
          {bottomSheetOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeBottomSheet}
                className="fixed inset-0 bg-black/50 z-40"
              />
              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[85vh] overflow-hidden"
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                  <h3 className="font-semibold text-lg">
                    {bottomSheetContent === 'notes' && 'Ghi chú'}
                    {bottomSheetContent === 'menu' && 'Menu'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={closeBottomSheet}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-4">
                  {bottomSheetContent === 'notes' && notesPanel}
                  {bottomSheetContent === 'menu' && sidebar}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// Export sub-components for flexibility
export function LayoutSidebar({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function LayoutMain({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function LayoutNotesPanel({ children }: { children: ReactNode }) {
  return <>{children}</>
}
