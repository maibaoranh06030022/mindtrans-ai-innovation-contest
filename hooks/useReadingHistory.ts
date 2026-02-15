'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type DocumentStatus = 'unread' | 'read' | 'saved' | 'noted'

export interface ReadingHistory {
  id?: string
  user_id?: string | null
  document_id: number
  status: DocumentStatus
  notes_count: number
  last_accessed: string
  time_spent_seconds: number
  scroll_position: number
}

interface UseReadingHistoryOptions {
  documentId: number
  userId?: string | null
  autoTrack?: boolean
  trackInterval?: number // ms
}

interface UseReadingHistoryReturn {
  history: ReadingHistory | null
  isLoading: boolean
  error: string | null
  // Actions
  markAsRead: () => Promise<void>
  toggleSaved: () => Promise<void>
  updateNotesCount: (count: number) => Promise<void>
  updateScrollPosition: (position: number) => void
  refresh: () => Promise<void>
}

// Local storage key prefix
const STORAGE_KEY_PREFIX = 'mindtrans-history-'

/**
 * Hook for tracking user reading history on a document.
 * - Auto-tracks time spent and scroll position
 * - Syncs with API (if available) or localStorage (fallback)
 */
export function useReadingHistory({
  documentId,
  userId = null,
  autoTrack = true,
  trackInterval = 30000, // 30 seconds
}: UseReadingHistoryOptions): UseReadingHistoryReturn {
  const [history, setHistory] = useState<ReadingHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track time spent
  const startTimeRef = useRef<number>(Date.now())
  const totalTimeRef = useRef<number>(0)
  const scrollPositionRef = useRef<number>(0)

  // Generate local storage key
  const storageKey = `${STORAGE_KEY_PREFIX}${documentId}`

  // Load from localStorage (fallback)
  const loadFromStorage = useCallback((): ReadingHistory | null => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e)
    }
    return null
  }, [storageKey])

  // Save to localStorage
  const saveToStorage = useCallback((data: ReadingHistory) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }, [storageKey])

  // Fetch history from API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ document_id: String(documentId) })
      if (userId) params.append('user_id', userId)

      const res = await fetch(`/api/history?${params}`)
      const json = await res.json()

      if (json.data && json.data.length > 0) {
        const apiHistory = json.data[0]
        setHistory(apiHistory)
        saveToStorage(apiHistory)
        totalTimeRef.current = apiHistory.time_spent_seconds || 0
      } else {
        // No API record, check localStorage
        const localHistory = loadFromStorage()
        if (localHistory) {
          setHistory(localHistory)
          totalTimeRef.current = localHistory.time_spent_seconds || 0
        } else {
          // New document, create initial record
          const newHistory: ReadingHistory = {
            document_id: documentId,
            user_id: userId,
            status: 'unread',
            notes_count: 0,
            last_accessed: new Date().toISOString(),
            time_spent_seconds: 0,
            scroll_position: 0,
          }
          setHistory(newHistory)
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch history from API, using localStorage:', err)
      // Fallback to localStorage
      const localHistory = loadFromStorage()
      setHistory(localHistory || {
        document_id: documentId,
        user_id: userId,
        status: 'unread',
        notes_count: 0,
        last_accessed: new Date().toISOString(),
        time_spent_seconds: 0,
        scroll_position: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [documentId, userId, loadFromStorage, saveToStorage])

  // Save history to API
  const saveHistory = useCallback(async (updates: Partial<ReadingHistory>) => {
    const currentHistory = history || {
      document_id: documentId,
      user_id: userId,
      status: 'unread' as DocumentStatus,
      notes_count: 0,
      last_accessed: new Date().toISOString(),
      time_spent_seconds: 0,
      scroll_position: 0,
    }

    const updated: ReadingHistory = {
      ...currentHistory,
      ...updates,
      last_accessed: new Date().toISOString(),
    }

    setHistory(updated)
    saveToStorage(updated)

    // Try to sync with API
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
    } catch (err) {
      console.warn('Failed to sync history with API:', err)
    }
  }, [history, documentId, userId, saveToStorage])

  // Initial fetch
  useEffect(() => {
    fetchHistory()
    startTimeRef.current = Date.now()
  }, [fetchHistory])

  // Auto-track time spent
  useEffect(() => {
    if (!autoTrack) return

    const interval = setInterval(() => {
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const newTotalTime = totalTimeRef.current + sessionTime
      startTimeRef.current = Date.now() // Reset for next interval
      totalTimeRef.current = newTotalTime

      saveHistory({
        time_spent_seconds: newTotalTime,
        scroll_position: scrollPositionRef.current,
      })
    }, trackInterval)

    // Save on unmount
    return () => {
      clearInterval(interval)
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const finalTime = totalTimeRef.current + sessionTime

      saveHistory({
        time_spent_seconds: finalTime,
        scroll_position: scrollPositionRef.current,
      })
    }
  }, [autoTrack, trackInterval, saveHistory])

  // Track scroll position
  useEffect(() => {
    if (!autoTrack) return

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const position = scrollHeight > 0 ? window.scrollY / scrollHeight : 0
      scrollPositionRef.current = Math.min(1, Math.max(0, position))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [autoTrack])

  // Action: Mark as read
  const markAsRead = useCallback(async () => {
    await saveHistory({ status: 'read' })
  }, [saveHistory])

  // Action: Toggle saved
  const toggleSaved = useCallback(async () => {
    const newStatus: DocumentStatus = history?.status === 'saved' ? 'read' : 'saved'
    await saveHistory({ status: newStatus })
  }, [history, saveHistory])

  // Action: Update notes count
  const updateNotesCount = useCallback(async (count: number) => {
    await saveHistory({ 
      notes_count: count,
      status: count > 0 ? 'noted' : history?.status || 'read',
    })
  }, [history, saveHistory])

  // Action: Update scroll position (called externally)
  const updateScrollPosition = useCallback((position: number) => {
    scrollPositionRef.current = position
  }, [])

  // Action: Refresh from server
  const refresh = useCallback(async () => {
    await fetchHistory()
  }, [fetchHistory])

  return {
    history,
    isLoading,
    error,
    markAsRead,
    toggleSaved,
    updateNotesCount,
    updateScrollPosition,
    refresh,
  }
}
