'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLayout } from '@/contexts/LayoutContext'
import {
  Home,
  Search,
  Sparkles,
  StickyNote,
  User,
  Map,
} from 'lucide-react'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  action?: () => void
}

export function BottomNav() {
  const pathname = usePathname()
  const { isMobile, toggleNotesPanel } = useLayout()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    
    if (currentScrollY < 50) {
      setIsVisible(true)
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false) // Scrolling down
    } else if (currentScrollY < lastScrollY) {
      setIsVisible(true) // Scrolling up
    }
    
    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  useEffect(() => {
    if (!isMobile) return

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMobile, handleScroll])

  // Don't render on non-mobile
  if (!isMobile) return null

  const navItems: NavItem[] = [
    { icon: Home, label: 'Trang chủ', href: '/' },
    { icon: Search, label: 'Tìm kiếm', href: '/search' },
    { icon: Sparkles, label: 'Phân tích', href: '/analyze' },
    { icon: Map, label: 'Bản đồ', href: '/knowledge' },
    { icon: StickyNote, label: 'Ghi chú', href: '#', action: toggleNotesPanel },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        >
          {/* Glass morphism background */}
          <div className="bg-card/90 backdrop-blur-xl border-t border-border safe-bottom">
            <div className="flex items-center justify-around px-2 py-2">
              {navItems.map((item) => {
                const isActive = item.href !== '#' && pathname === item.href
                const Icon = item.icon

                if (item.action) {
                  return (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target',
                        'active:scale-95'
                      )}
                    >
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'p-2 rounded-xl transition-colors',
                          'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {item.label}
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target',
                      'active:scale-95'
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        'p-2 rounded-xl transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <span
                      className={cn(
                        'text-[10px] font-medium',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
