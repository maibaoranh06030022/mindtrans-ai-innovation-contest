'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  X,
  Plus,
  GripVertical,
  Trash2,
  Palette,
} from 'lucide-react'

interface Note {
  id: string
  content: string
  color: string
  x: number
  y: number
  width: number
  height: number
}

const COLORS = [
  'bg-[#f9bc60]/90 dark:bg-[#f9bc60]/30',
  'bg-[#e16162]/80 dark:bg-[#e16162]/30',
  'bg-[#abd1c6]/90 dark:bg-[#abd1c6]/30',
  'bg-[#004643]/90 dark:bg-[#004643]/50 text-[#fffffe]',
  'bg-purple-300/90 dark:bg-purple-800/50',
  'bg-orange-300/90 dark:bg-orange-800/50',
]

interface StickyNotesProps {
  isVisible: boolean
  onClose: () => void
}

export function StickyNotes({ isVisible, onClose }: StickyNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mindtrans-notes')
    if (saved) {
      try {
        setNotes(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load notes')
      }
    }
  }, [])

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('mindtrans-notes', JSON.stringify(notes))
  }, [notes])

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      x: 50 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 250,
      height: 200,
    }
    setNotes([...notes, newNote])
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ))
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const cycleColor = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      const currentIndex = COLORS.indexOf(note.color)
      const nextIndex = (currentIndex + 1) % COLORS.length
      updateNote(id, { color: COLORS[nextIndex] })
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none"
        ref={containerRef}
      >
        {/* Control Panel */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-20 right-4 z-50 flex gap-2 pointer-events-auto"
        >
          <Button
            onClick={addNote}
            size="sm"
            className="gap-2 shadow-lg btn-highlight rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Thêm ghi chú
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="shadow-lg border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Notes */}
        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={(_, info) => {
              updateNote(note.id, {
                x: note.x + info.offset.x,
                y: note.y + info.offset.y,
              })
            }}
            style={{
              left: note.x,
              top: note.y,
              width: note.width,
              minHeight: note.height,
            }}
            className={`fixed pointer-events-auto rounded-lg shadow-xl ${note.color} border border-black/10 dark:border-white/10`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 cursor-grab active:cursor-grabbing border-b border-black/10 dark:border-white/20">
              <GripVertical className="h-4 w-4 opacity-60" />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-70 hover:opacity-100"
                  onClick={() => cycleColor(note.id)}
                >
                  <Palette className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--mindtrans-tertiary)] hover:bg-[var(--mindtrans-tertiary)]/20"
                  onClick={() => deleteNote(note.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <Textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, { content: e.target.value })}
              placeholder="Ghi chú của bạn..."
              className="border-0 bg-transparent resize-none focus-visible:ring-0 min-h-[150px] placeholder:opacity-50"
            />
          </motion.div>
        ))}

        {/* Empty State */}
        {notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto"
          >
            <div className="card-neumorphic p-8">
              <p className="text-[var(--mindtrans-paragraph)] mb-4">Chưa có ghi chú nào</p>
              <Button onClick={addNote} className="gap-2 btn-highlight rounded-xl">
                <Plus className="h-4 w-4" />
                Tạo ghi chú đầu tiên
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
