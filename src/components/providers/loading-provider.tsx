'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface LoadingContextType {
  isLoading: boolean
  activeCount: number
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  activeCount: 0,
  startLoading: () => {},
  stopLoading: () => {},
  withLoading: async (fn) => fn(),
})

export const useGlobalLoading = () => useContext(LoadingContext)

const SHOW_DELAY_MS = 60 // Prevent flashing for instant responses (< 60ms)
const MIN_DURATION_MS = 350 // Once shown, stay visible at least this long for smooth UX

function NavigationListener({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    onNavigate()
  }, [pathname, searchParams, onNavigate])

  return null
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  const activeCountRef = useRef(0)
  const showTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const visibleStartTimeRef = useRef<number | null>(null)

  const startRequest = useCallback(() => {
    activeCountRef.current += 1
    setActiveCount(activeCountRef.current)

    if (activeCountRef.current === 1) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }

      showTimerRef.current = setTimeout(() => {
        setIsLoading(true)
        visibleStartTimeRef.current = Date.now()
        showTimerRef.current = null
      }, SHOW_DELAY_MS)
    }
  }, [])

  const endRequest = useCallback(() => {
    activeCountRef.current = Math.max(0, activeCountRef.current - 1)
    setActiveCount(activeCountRef.current)

    if (activeCountRef.current === 0) {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }

      if (visibleStartTimeRef.current !== null) {
        const elapsed = Date.now() - visibleStartTimeRef.current
        const remaining = Math.max(0, MIN_DURATION_MS - elapsed)

        hideTimerRef.current = setTimeout(() => {
          setIsLoading(false)
          visibleStartTimeRef.current = null
          hideTimerRef.current = null
        }, remaining)
      } else {
        setIsLoading(false)
      }
    }
  }, [])

  const handleNavigationChange = useCallback(() => {
    if (activeCountRef.current === 0 && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
        visibleStartTimeRef.current = null
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Programmatic helper
  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startRequest()
      try {
        return await fn()
      } finally {
        endRequest()
      }
    },
    [startRequest, endRequest]
  )

  // Setup global fetch interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch

    window.fetch = async function (...args) {
      startRequest()
      try {
        const response = await originalFetch.apply(this, args)
        return response
      } finally {
        endRequest()
      }
    }

    return () => {
      window.fetch = originalFetch
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [startRequest, endRequest])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        activeCount,
        startLoading: startRequest,
        stopLoading: endRequest,
        withLoading,
      }}
    >
      <Suspense fallback={null}>
        <NavigationListener onNavigate={handleNavigationChange} />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  )
}
