'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { StickyNotes } from '@/components/features/StickyNotes'
import { DocumentCard } from '@/components/features/DocumentCard'
import { AnnotationLayer, Annotation } from '@/components/features/AnnotationLayer'
import { NotesPanel } from '@/components/features/NotesPanel'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Loader2, ArrowLeft, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { useLayout } from '@/contexts/LayoutContext'

interface Document {
  id: number
  topic: string
  content_vi: string
  mindmap_code: string
  flashcards?: { q: string; a: string }[]
  tags: string[]
  category: string
  url: string
  created_at: string
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const layout = useLayout()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)

  // Fetch document
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/search?id=${resolvedParams.id}`)
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          setDocument(data.data[0])
        } else {
          setError('Không tìm thấy bài báo')
        }
      } catch (err) {
        setError('Lỗi khi tải bài báo')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocument()
  }, [resolvedParams.id])

  // Handle annotation creation - save to API
  const handleAnnotationCreate = useCallback(async (annotation: Annotation) => {
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotation),
      })
      if (res.ok) {
        setAnnotations(prev => [...prev, annotation])
      }
    } catch (err) {
      console.error('Failed to save annotation:', err)
    }
  }, [])

  // Handle annotation deletion
  const handleAnnotationDelete = useCallback(async (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id))
  }, [])

  // Handle annotation update
  const handleAnnotationUpdate = useCallback((annotation: Annotation) => {
    setAnnotations(prev => prev.map(a => a.id === annotation.id ? annotation : a))
  }, [])

  // Handle annotation selection (jump-to)
  const handleAnnotationSelect = useCallback((annotation: Annotation) => {
    setSelectedAnnotation(annotation)
    // Focus/scroll handled in NotesPanel
  }, [])

  return (
    <div className="min-h-screen bg-[var(--mindtrans-bg)]">
      <Header />
      
      {/* Sticky Notes Panel - desktop */}
      <StickyNotes 
        isVisible={layout.notesPanelOpen && !layout.isMobile} 
        onClose={layout.toggleNotesPanel} 
      />

      {/* Annotations/Notes Panel - Desktop sidebar */}
      <AnimatePresence>
        {layout.notesPanelOpen && !layout.isMobile && document && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] z-30 border-l border-border bg-card shadow-lg"
          >
            <NotesPanel
              documentId={document.id}
              onClose={layout.toggleNotesPanel}
              onSelect={handleAnnotationSelect}
              onDelete={handleAnnotationDelete}
              onUpdate={handleAnnotationUpdate}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Notes Panel - Bottom Sheet */}
      <Sheet open={layout.notesPanelOpen && layout.isMobile} onOpenChange={layout.toggleNotesPanel}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Ghi chú</SheetTitle>
          </SheetHeader>
          {document && (
            <NotesPanel
              documentId={document.id}
              onClose={layout.toggleNotesPanel}
              onSelect={handleAnnotationSelect}
              onDelete={handleAnnotationDelete}
              onUpdate={handleAnnotationUpdate}
            />
          )}
        </SheetContent>
      </Sheet>

      <main className="container-responsive py-4 sm:py-6 lg:py-8 pb-24 sm:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/">
            <Button 
              variant="ghost" 
              className="mb-4 sm:mb-6 gap-2 text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl touch-target"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm sm:text-base">Quay lại</span>
            </Button>
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--mindtrans-highlight)]" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-[var(--mindtrans-paragraph)]">{error}</p>
              <Link href="/">
                <Button variant="link" className="text-[var(--mindtrans-highlight)]">Về trang chủ</Button>
              </Link>
            </div>
          ) : document ? (
            <div className="relative">
              <DocumentCard document={document} variant="full" />
              
              {/* Annotation Layer - overlays document content */}
              <AnnotationLayer
                documentId={document.id}
                layer="translated"
                onCreate={handleAnnotationCreate}
                onUpdate={handleAnnotationUpdate}
                onDelete={handleAnnotationDelete}
                onSelect={handleAnnotationSelect}
                initialAnnotations={annotations}
              />
            </div>
          ) : null}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
