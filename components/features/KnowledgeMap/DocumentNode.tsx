'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  FileText,
  Circle,
  CheckCircle,
  Bookmark,
  MessageSquare,
  ExternalLink,
  Tag,
} from 'lucide-react'
import {
  DocumentNodeData,
  CATEGORY_COLORS,
  STATUS_COLORS,
  DocumentStatus,
} from './types'

// Props type for custom node
interface DocumentNodeProps {
  data: DocumentNodeData
  selected?: boolean
}

// Status icon component
function StatusIcon({ status }: { status: DocumentStatus }) {
  const iconProps = { className: 'h-3.5 w-3.5' }
  
  switch (status) {
    case 'read':
      return <CheckCircle {...iconProps} />
    case 'saved':
      return <Bookmark {...iconProps} />
    case 'noted':
      return <MessageSquare {...iconProps} />
    default:
      return <Circle {...iconProps} />
  }
}

// Main Document Node Component
function DocumentNodeComponent({ data, selected }: DocumentNodeProps) {
  const categoryColor = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.default
  const statusColor = STATUS_COLORS[data.status]

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'relative w-56 p-3 rounded-xl border-2 shadow-lg cursor-pointer transition-all',
        'bg-card/95 backdrop-blur-sm',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
      )}
      style={{
        borderLeftColor: categoryColor,
        borderLeftWidth: 4,
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />

      {/* Header with status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {data.category}
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-xs"
          style={{ color: statusColor }}
          title={`Trạng thái: ${data.status}`}
        >
          <StatusIcon status={data.status} />
          {data.notesCount > 0 && (
            <span className="text-[10px] font-medium">{data.notesCount}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
        {data.topic}
      </h3>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {data.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{data.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 pt-2 border-t border-border">
        <span>{new Date(data.createdAt).toLocaleDateString('vi-VN')}</span>
        {data.url && (
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Link
          </a>
        )}
      </div>
    </motion.div>
  )
}

// Memoize for performance
export const DocumentNode = memo(DocumentNodeComponent)
