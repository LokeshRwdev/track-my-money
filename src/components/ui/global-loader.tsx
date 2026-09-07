'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useGlobalLoading } from '@/components/providers/loading-provider'

export function GlobalLoader() {
  const { isLoading, activeCount } = useGlobalLoading()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999]"
    >
      {/* Top glowing indeterminate progress bar */}
      <div
        className={`relative h-[3px] w-full overflow-hidden bg-primary/10 transition-opacity duration-300 ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="global-loader-bar absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-emerald-500 via-primary to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
      </div>

      {/* Floating Glassmorphic Status Pill */}
      <div
        className={`fixed top-3.5 right-6 z-[9999] transition-all duration-300 ease-out ${
          isLoading
            ? 'translate-y-0 scale-100 opacity-100'
            : '-translate-y-2 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
          <span>
            {activeCount > 1 ? `Updating (${activeCount})...` : 'Updating...'}
          </span>
        </div>
      </div>
    </div>
  )
}
