'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  MousePointer2,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Highlighter,
  MessageSquare,
  X,
} from 'lucide-react'

// ===== Types =====
export type AnnotationType = 'highlight' | 'underline' | 'strikethrough' | 'note' | 'drawing'
export type DrawTool = 'pen' | 'eraser'

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

interface Stroke {
  tool: DrawTool
  color: string
  lineWidth: number
  points: { x: number; y: number }[]
}

interface AnnotationLayerProps {
  documentId?: number | string
  layer?: 'original' | 'translated'
  onCreate?: (annotation: Annotation) => void
  onUpdate?: (annotation: Annotation) => void
  onDelete?: (id: string) => void
  onSelect?: (annotation: Annotation) => void
  initialAnnotations?: Annotation[]
  className?: string
  disabled?: boolean
}

const HIGHLIGHT_COLORS = [
  '#f9bc60', // Yellow (default)
  '#e16162', // Red
  '#abd1c6', // Green
  '#60a5fa', // Blue
  '#c084fc', // Purple
  '#fb923c', // Orange
]

// ===== Generate UUID =====
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ===== Main Component =====
export function AnnotationLayer({
  documentId,
  layer = 'original',
  onCreate,
  onUpdate,
  onDelete,
  onSelect,
  initialAnnotations = [],
  className,
  disabled = false,
}: AnnotationLayerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // State
  const [mode, setMode] = useState<'select' | 'draw'>('select')
  const [drawTool, setDrawTool] = useState<DrawTool>('pen')
  const [isDrawing, setIsDrawing] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0])
  const [drawColor, setDrawColor] = useState('#f9bc60')
  const [lineWidth, setLineWidth] = useState(3)

  // Drawing history for undo/redo
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const currentStrokeRef = useRef<Stroke | null>(null)

  // Context menu for text selection
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    selectedText: string
    range: Range | null
  }>({ visible: false, x: 0, y: 0, selectedText: '', range: null })

  // ===== Canvas Setup =====
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(devicePixelRatio, devicePixelRatio)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctxRef.current = ctx
        redrawStrokes()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ===== Redraw all strokes =====
  const redrawStrokes = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio)

    strokes.forEach((stroke) => {
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.lineWidth

      if (stroke.points.length < 2) return

      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    })

    ctx.globalCompositeOperation = 'source-over'
  }, [strokes])

  useEffect(() => {
    redrawStrokes()
  }, [strokes, redrawStrokes])

  // ===== Drawing Handlers =====
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode !== 'draw' || disabled) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    currentStrokeRef.current = {
      tool: drawTool,
      color: drawTool === 'eraser' ? '#000' : drawColor,
      lineWidth: drawTool === 'eraser' ? lineWidth * 3 : lineWidth,
      points: [{ x, y }],
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode !== 'draw' || !isDrawing || !currentStrokeRef.current) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    currentStrokeRef.current.points.push({ x, y })

    // Live draw
    const ctx = ctxRef.current
    const stroke = currentStrokeRef.current
    if (ctx && stroke.points.length >= 2) {
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.lineWidth
      ctx.beginPath()
      const pts = stroke.points
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  const handlePointerUp = () => {
    if (mode !== 'draw' || !currentStrokeRef.current) return

    setIsDrawing(false)

    if (currentStrokeRef.current.points.length > 1) {
      setStrokes((prev) => [...prev, currentStrokeRef.current!])
      setRedoStack([]) // Clear redo on new stroke

      // Save as annotation
      const annotation: Annotation = {
        id: generateId(),
        document_id: documentId,
        type: 'drawing',
        color: currentStrokeRef.current.color,
        content: null,
        position_data: {
          strokes: [...strokes, currentStrokeRef.current],
          layer,
        },
        created_at: new Date().toISOString(),
      }
      onCreate?.(annotation)
    }

    currentStrokeRef.current = null
  }

  // ===== Undo / Redo =====
  const handleUndo = () => {
    if (strokes.length === 0) return
    const lastStroke = strokes[strokes.length - 1]
    setStrokes((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, lastStroke])
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    const strokeToRedo = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setStrokes((prev) => [...prev, strokeToRedo])
  }

  const handleClearCanvas = () => {
    setStrokes([])
    setRedoStack([])
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // ===== Text Selection Handler =====
  const handleDocumentMouseUp = useCallback(
    (e: MouseEvent) => {
      if (mode !== 'select' || disabled) return

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setContextMenu((prev) => ({ ...prev, visible: false }))
        return
      }

      const selectedText = selection.toString().trim()
      if (!selectedText) {
        setContextMenu((prev) => ({ ...prev, visible: false }))
        return
      }

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setContextMenu({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        selectedText,
        range: range.cloneRange(),
      })
    },
    [mode, disabled]
  )

  useEffect(() => {
    document.addEventListener('mouseup', handleDocumentMouseUp)
    return () => document.removeEventListener('mouseup', handleDocumentMouseUp)
  }, [handleDocumentMouseUp])

  // ===== Create Highlight =====
  const createHighlight = (type: 'highlight' | 'underline' | 'strikethrough' = 'highlight') => {
    if (!contextMenu.range) return

    const rect = contextMenu.range.getBoundingClientRect()

    const annotation: Annotation = {
      id: generateId(),
      document_id: documentId,
      type,
      color: highlightColor,
      content: contextMenu.selectedText,
      position_data: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        scrollY: window.scrollY,
        layer,
      },
      created_at: new Date().toISOString(),
    }

    setAnnotations((prev) => [...prev, annotation])
    onCreate?.(annotation)
    setContextMenu((prev) => ({ ...prev, visible: false }))
    window.getSelection()?.removeAllRanges()
  }

  // ===== Create Note =====
  const createNote = () => {
    if (!contextMenu.range) return

    const rect = contextMenu.range.getBoundingClientRect()
    const noteContent = prompt('Nhập ghi chú:')
    if (!noteContent) return

    const annotation: Annotation = {
      id: generateId(),
      document_id: documentId,
      type: 'note',
      color: highlightColor,
      content: noteContent,
      position_data: {
        x: rect.x,
        y: rect.y,
        selectedText: contextMenu.selectedText,
        layer,
      },
      created_at: new Date().toISOString(),
    }

    setAnnotations((prev) => [...prev, annotation])
    onCreate?.(annotation)
    setContextMenu((prev) => ({ ...prev, visible: false }))
    window.getSelection()?.removeAllRanges()
  }

  // ===== Render =====
  if (disabled) return null

  return (
    <div ref={containerRef} className={cn('absolute inset-0 pointer-events-none z-30', className)}>
      {/* ===== Toolbar ===== */}
      <div className="absolute top-2 right-2 z-50 pointer-events-auto">
        <div className="flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur rounded-xl border border-border shadow-lg">
          {/* Mode Toggle */}
          <Button
            variant={mode === 'select' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setMode('select')}
            title="Chọn văn bản"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === 'draw' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setMode('draw')}
            title="Vẽ"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Draw Tools (visible when in draw mode) */}
          {mode === 'draw' && (
            <>
              <Button
                variant={drawTool === 'pen' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setDrawTool('pen')}
                title="Bút"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={drawTool === 'eraser' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setDrawTool('eraser')}
                title="Tẩy"
              >
                <Eraser className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                title="Hoàn tác"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Làm lại"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleClearCanvas}
                title="Xóa tất cả"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />
            </>
          )}

          {/* Color Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Chọn màu">
                <div
                  className="h-5 w-5 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: mode === 'draw' ? drawColor : highlightColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                      (mode === 'draw' ? drawColor : highlightColor) === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (mode === 'draw') setDrawColor(color)
                      else setHighlightColor(color)
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                className="w-full h-8 mt-2 rounded cursor-pointer"
                value={mode === 'draw' ? drawColor : highlightColor}
                onChange={(e) => {
                  if (mode === 'draw') setDrawColor(e.target.value)
                  else setHighlightColor(e.target.value)
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Line Width (draw mode) */}
          {mode === 'draw' && (
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-16 h-2 accent-primary"
              title={`Độ dày: ${lineWidth}px`}
            />
          )}
        </div>
      </div>

      {/* ===== Context Menu for Text Selection ===== */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="fixed z-[100] pointer-events-auto"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-lg shadow-xl">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => createHighlight('highlight')}
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" style={{ color: highlightColor }} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={createNote}
                title="Thêm ghi chú"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              {HIGHLIGHT_COLORS.slice(0, 4).map((color) => (
                <button
                  key={color}
                  className={cn(
                    'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                    highlightColor === color ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setHighlightColor(color)}
                />
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Highlights Overlay ===== */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {annotations
          .filter((a) => a.type === 'highlight' || a.type === 'underline' || a.type === 'strikethrough')
          .map((a) => {
            const pos = a.position_data
            if (!pos) return null

            let style: React.CSSProperties = {
              position: 'absolute',
              left: pos.x,
              top: pos.y - (pos.scrollY || 0) + window.scrollY,
              width: pos.width,
              height: pos.height,
            }

            if (a.type === 'highlight') {
              style.backgroundColor = `${a.color}40`
              style.borderRadius = '2px'
            } else if (a.type === 'underline') {
              style.borderBottom = `2px solid ${a.color}`
              style.backgroundColor = 'transparent'
            } else if (a.type === 'strikethrough') {
              style.background = `linear-gradient(transparent 45%, ${a.color} 45%, ${a.color} 55%, transparent 55%)`
            }

            return (
              <div
                key={a.id}
                className="pointer-events-auto cursor-pointer hover:ring-2 hover:ring-primary/50"
                style={style}
                onClick={() => onSelect?.(a)}
                title={a.content || ''}
              />
            )
          })}
      </div>

      {/* ===== Notes Indicators ===== */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        {annotations
          .filter((a) => a.type === 'note')
          .map((a) => {
            const pos = a.position_data
            if (!pos) return null

            return (
              <div
                key={a.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: (pos.x || 0) + (pos.width || 0) + 5,
                  top: pos.y - (pos.scrollY || 0) + window.scrollY,
                }}
                onClick={() => onSelect?.(a)}
                title={a.content || ''}
              >
                <div
                  className="h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                  style={{ backgroundColor: a.color || '#f9bc60' }}
                >
                  <MessageSquare className="h-3 w-3" />
                </div>
              </div>
            )
          })}
      </div>

      {/* ===== Drawing Canvas ===== */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          'absolute inset-0 z-20',
          mode === 'draw' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        )}
        style={{ touchAction: 'none' }}
      />
    </div>
  )
}
