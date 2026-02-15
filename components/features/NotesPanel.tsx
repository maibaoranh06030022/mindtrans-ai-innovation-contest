'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  Search,
  X,
  Download,
  Trash2,
  Edit3,
  ExternalLink,
  Highlighter,
  MessageSquare,
  PenTool,
  Filter,
  Check,
  RefreshCw,
} from 'lucide-react'

// ===== Types =====
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough' | 'note' | 'drawing'

export interface Annotation {
  id: string
  document_id?: number | string
  user_id?: string | null
  type: AnnotationType
  color?: string
  content?: string | null
  position_data?: any
  layer?: 'original' | 'translated'
  created_at?: string
  updated_at?: string
}

interface NotesPanelProps {
  documentId?: number | string
  onClose?: () => void
  onSelect?: (annotation: Annotation) => void
  onDelete?: (id: string) => void
  onUpdate?: (annotation: Annotation) => void
  className?: string
}

const TYPE_ICONS: Record<AnnotationType, React.ReactNode> = {
  highlight: <Highlighter className="h-3.5 w-3.5" />,
  underline: <span className="text-xs underline font-bold">U</span>,
  strikethrough: <span className="text-xs line-through font-bold">S</span>,
  note: <MessageSquare className="h-3.5 w-3.5" />,
  drawing: <PenTool className="h-3.5 w-3.5" />,
}

const TYPE_LABELS: Record<AnnotationType, string> = {
  highlight: 'Highlight',
  underline: 'Gạch chân',
  strikethrough: 'Gạch ngang',
  note: 'Ghi chú',
  drawing: 'Vẽ',
}

// ===== Main Component =====
export function NotesPanel({
  documentId,
  onClose,
  onSelect,
  onDelete,
  onUpdate,
  className,
}: NotesPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<AnnotationType | 'all'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // ===== Fetch Annotations =====
  const fetchAnnotations = useCallback(async () => {
    if (!documentId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/annotations?document_id=${documentId}`)
      const data = await res.json()
      if (data?.data) {
        setAnnotations(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch annotations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchAnnotations()
  }, [fetchAnnotations])

  // ===== Filter & Search =====
  const filtered = annotations.filter((a) => {
    const matchesSearch = (a.content || '').toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || a.type === filterType
    return matchesSearch && matchesType
  })

  // ===== Delete Annotation =====
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/annotations?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAnnotations((prev) => prev.filter((a) => a.id !== id))
        onDelete?.(id)
      }
    } catch (err) {
      console.error('Failed to delete annotation:', err)
    }
  }

  // ===== Edit Annotation =====
  const startEditing = (annotation: Annotation) => {
    setEditingId(annotation.id)
    setEditContent(annotation.content || '')
  }

  const saveEdit = async () => {
    if (!editingId) return

    const annotation = annotations.find((a) => a.id === editingId)
    if (!annotation) return

    const updated: Annotation = { ...annotation, content: editContent, updated_at: new Date().toISOString() }

    try {
      const res = await fetch('/api/annotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })

      if (res.ok) {
        setAnnotations((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
        onUpdate?.(updated)
      }
    } catch (err) {
      console.error('Failed to update annotation:', err)
    }

    setEditingId(null)
    setEditContent('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // ===== Jump to Annotation =====
  const jumpToAnnotation = (annotation: Annotation) => {
    onSelect?.(annotation)

    // Scroll to position if available
    const pos = annotation.position_data
    if (pos?.y !== undefined) {
      const scrollY = (pos.scrollY || 0) + pos.y - 100
      window.scrollTo({ top: scrollY, behavior: 'smooth' })
    }
  }

  // ===== Export JSON =====
  const exportJson = () => {
    const dataStr = JSON.stringify(annotations, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `annotations-${documentId || 'export'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===== Format Date =====
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ===== Render =====
  return (
    <div className={cn('w-full h-full flex flex-col bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Ghi chú & Annotations</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchAnnotations} disabled={isLoading} title="Làm mới">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ghi chú..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant={filterType === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterType('all')}
          >
            <Filter className="h-3 w-3 mr-1" />
            Tất cả
          </Badge>
          {(Object.keys(TYPE_LABELS) as AnnotationType[]).map((type) => (
            <Badge
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterType(type)}
            >
              {TYPE_ICONS[type]}
              <span className="ml-1">{TYPE_LABELS[type]}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Annotations List */}
      <ScrollArea className="flex-1 px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Không có ghi chú nào.</p>
            <p className="text-sm mt-1">Chọn văn bản để highlight hoặc thêm ghi chú.</p>
          </div>
        ) : (
          <AnimatePresence>
            <ul className="space-y-2">
              {filtered.map((item) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          <Check className="h-3 w-3 mr-1" />
                          Lưu
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs py-0">
                            {TYPE_ICONS[item.type]}
                            <span className="ml-1">{TYPE_LABELS[item.type]}</span>
                          </Badge>
                          {item.color && (
                            <div
                              className="h-3 w-3 rounded-full border border-border"
                              style={{ backgroundColor: item.color }}
                            />
                          )}
                          {item.layer && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {item.layer === 'original' ? 'Gốc' : 'Dịch'}
                            </Badge>
                          )}
                        </div>

                        {item.content && (
                          <p className="text-sm text-foreground line-clamp-3">{item.content}</p>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {formatDate(item.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => jumpToAnnotation(item)}
                          title="Đi đến"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>

                        {(item.type === 'note' || item.type === 'highlight') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEditing(item)}
                            title="Sửa"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa ghi chú?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Ghi chú sẽ bị xóa vĩnh viễn.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {filtered.length} / {annotations.length} mục
          </span>
        </div>
        <Button variant="outline" className="w-full" onClick={exportJson} disabled={annotations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
      </div>
    </div>
  )
}
