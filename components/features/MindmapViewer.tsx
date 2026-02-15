'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MindmapViewerProps {
  code: string
  className?: string
}

export function MindmapViewer({ code, className = '' }: MindmapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    })
  }, [])

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Clear previous content
        containerRef.current.innerHTML = ''

        // Generate unique ID
        const id = `mermaid-${Date.now()}`

        // Render mermaid diagram
        const { svg } = await mermaid.render(id, code)
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Không thể render mindmap. Vui lòng kiểm tra lại code.')
      } finally {
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [code])

  if (!code) {
    return (
      <div className={`flex items-center justify-center p-8 text-[var(--mindtrans-paragraph)] ${className}`}>
        Không có dữ liệu mindmap
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--mindtrans-highlight)]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <p className="text-[var(--mindtrans-tertiary)] mb-4">{error}</p>
        <pre className="text-xs bg-[var(--mindtrans-main)]/30 text-[var(--mindtrans-paragraph)] p-4 rounded-xl overflow-auto max-w-full border border-[var(--mindtrans-stroke)]">
          {code}
        </pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center p-4 overflow-auto [&_svg]:max-w-full ${className}`}
    />
  )
}
