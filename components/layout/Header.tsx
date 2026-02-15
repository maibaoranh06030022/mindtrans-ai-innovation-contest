'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import {
  Search,
  Menu,
  Moon,
  Sun,
  Plus,
  BookOpen,
  Sparkles,
  StickyNote,
  Map,
  X,
  PanelLeftOpen,
  PanelRightOpen,
} from 'lucide-react'
import { useLayoutSafe } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onSearch?: (query: string) => void
  onToggleNotes?: () => void
  showNotes?: boolean
}

export function Header({ onSearch, onToggleNotes, showNotes }: HeaderProps) {
  const pathname = usePathname()
  const layout = useLayoutSafe()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true
      const saved = localStorage.getItem('mindtrans-theme')
      if (saved) return saved === 'dark'
      return document.documentElement.classList.contains('dark')
    } catch (e) {
      return true
    }
  })

  // ensure document class matches preference on mount
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('mindtrans-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('mindtrans-theme', 'light')
      }
    } catch (e) {
      // ignore in non-browser env
    }
  }, [isDark])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    try {
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('mindtrans-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('mindtrans-theme', 'light')
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--mindtrans-stroke)] bg-[var(--mindtrans-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--mindtrans-bg)]/80 shadow-lg safe-top">
      <div className="container-responsive flex h-14 sm:h-16 items-center justify-between">
        {/* Left Section: Menu + Logo */}
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle - Tablet/Desktop */}
          {layout && !layout.isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={layout.toggleSidebar}
              className="hidden sm:flex touch-target text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <div className="relative p-1.5 sm:p-2 rounded-xl bg-[var(--mindtrans-main)]/20 group-hover:bg-[var(--mindtrans-highlight)]/30 transition-all duration-300">
              {/* MT Logo */}
              <span className="text-lg sm:text-xl font-black text-[var(--mindtrans-highlight)] tracking-tighter">
                MT
              </span>
              <Sparkles className="h-2 w-2 sm:h-3 sm:w-3 text-[var(--mindtrans-tertiary)] absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>
            <span className="hidden sm:inline-block text-[var(--mindtrans-headline)] font-extrabold tracking-tight text-base lg:text-xl">
              MindTrans <span className="text-[var(--mindtrans-highlight)]">AI</span>
            </span>
          </Link>
        </div>

        {/* Center Section: Search Bar - Desktop Only */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mindtrans-paragraph)]" />
            <Input
              type="search"
              placeholder="Tìm kiếm bài báo, tags..."
              className="pl-10 pr-4 bg-[var(--mindtrans-main)]/30 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 focus:border-[var(--mindtrans-highlight)] focus:ring-[var(--mindtrans-highlight)]/30 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="lg:hidden touch-target text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl"
          >
            {showMobileSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 rounded-xl transition-all",
                  pathname === '/'
                    ? 'bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)]'
                    : 'text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30'
                )}
              >
                <BookOpen className="h-4 w-4" />
                Thư viện
              </Button>
            </Link>
            <Link href="/knowledge">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 rounded-xl transition-all",
                  pathname === '/knowledge'
                    ? 'bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)]'
                    : 'text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30'
                )}
              >
                <Map className="h-4 w-4" />
                Bản đồ
              </Button>
            </Link>
          </nav>

          {/* Notes Toggle - Desktop */}
          <Button
            variant={showNotes || layout?.notesPanelOpen ? "default" : "outline"}
            size="sm"
            onClick={layout?.toggleNotesPanel || onToggleNotes}
            className={cn(
              "hidden md:flex gap-2 rounded-xl transition-all duration-300 touch-target",
              showNotes || layout?.notesPanelOpen
                ? 'bg-[var(--mindtrans-highlight)] text-[var(--mindtrans-button-text)] hover:bg-[var(--mindtrans-highlight)]/90' 
                : 'border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)]'
            )}
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden lg:inline">Notes</span>
          </Button>

          {/* New Analysis Button - Tablet/Desktop */}
          <Link href="/analyze" className="hidden sm:block">
            <Button 
              size="sm" 
              className="gap-2 btn-highlight rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 touch-target"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Phân tích mới</span>
              <span className="lg:hidden">Mới</span>
            </Button>
          </Link>

          {/* Theme Toggle - Tablet/Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden sm:flex touch-target text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl"
              >
                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--mindtrans-bg)] border-[var(--mindtrans-stroke)] rounded-xl shadow-neumorphic">
              <DropdownMenuItem onClick={() => { setIsDark(false); document.documentElement.classList.remove('dark'); localStorage.setItem('mindtrans-theme', 'light') }} className="text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)] rounded-lg cursor-pointer">
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsDark(true); document.documentElement.classList.add('dark'); localStorage.setItem('mindtrans-theme', 'dark') }} className="text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)] rounded-lg cursor-pointer">
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="touch-target text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[var(--mindtrans-bg)] border-l-[var(--mindtrans-stroke)] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--mindtrans-stroke)]">
                  <span className="font-bold text-[var(--mindtrans-headline)]">Menu</span>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="touch-target">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex flex-col gap-2 p-4 flex-1">
                  <SheetClose asChild>
                    <Link href="/">
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "w-full justify-start gap-3 rounded-xl touch-target text-base",
                          pathname === '/'
                            ? 'bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)]'
                            : 'text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30'
                        )}
                      >
                        <BookOpen className="h-5 w-5" /> Thư viện
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/analyze">
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "w-full justify-start gap-3 rounded-xl touch-target text-base",
                          pathname === '/analyze'
                            ? 'bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)]'
                            : 'text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30'
                        )}
                      >
                        <Plus className="h-5 w-5" /> Phân tích mới
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/knowledge">
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "w-full justify-start gap-3 rounded-xl touch-target text-base",
                          pathname === '/knowledge'
                            ? 'bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)]'
                            : 'text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30'
                        )}
                      >
                        <Map className="h-5 w-5" /> Bản đồ tri thức
                      </Button>
                    </Link>
                  </SheetClose>
                  
                  <div className="h-px bg-[var(--mindtrans-stroke)] my-2" />
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-xl touch-target text-base text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30" 
                    onClick={toggleTheme}
                  >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {isDark ? 'Chế độ sáng' : 'Chế độ tối'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search Bar - Expandable */}
      {showMobileSearch && (
        <div className="lg:hidden border-t border-[var(--mindtrans-stroke)] p-3 bg-[var(--mindtrans-bg)]">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mindtrans-paragraph)]" />
              <Input
                type="search"
                placeholder="Tìm kiếm bài báo, tags..."
                className="pl-10 bg-[var(--mindtrans-main)]/30 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
    </header>
  )
}
