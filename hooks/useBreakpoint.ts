'use client'

import { useState, useEffect, useCallback } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

interface BreakpointConfig {
  mobile: number  // <768px
  tablet: number  // 768-1023px
  desktop: number // ≥1024px
}

const BREAKPOINTS: BreakpointConfig = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  const getBreakpoint = useCallback((): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    if (width < BREAKPOINTS.tablet) return 'mobile'
    if (width < BREAKPOINTS.desktop) return 'tablet'
    return 'desktop'
  }, [])

  useEffect(() => {
    // Set initial breakpoint
    setBreakpoint(getBreakpoint())

    const handleResize = () => {
      setBreakpoint(getBreakpoint())
    }

    // Debounce resize event
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [getBreakpoint])

  return breakpoint
}

// Additional hooks for specific checks
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'mobile'
}

export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'tablet'
}

export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint()
  return breakpoint === 'desktop'
}

// Hook to get window dimensions
export function useWindowSize() {
  const [size, setSize] = useState({ width: 1024, height: 768 })

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
