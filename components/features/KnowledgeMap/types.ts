// ===== Knowledge Map Types =====

import type { Node, Edge } from '@xyflow/react'

// Document status tracking
export type DocumentStatus = 'unread' | 'read' | 'saved' | 'noted'

// Relationship types between documents
export type RelationshipType = 
  | 'same_category'    // Documents in same category
  | 'same_tag'         // Share common tags
  | 'citation'         // One cites the other
  | 'user_linked'      // User manually linked

// Document node data
export interface DocumentNodeData {
  id: number
  topic: string
  category: string
  tags: string[]
  url?: string
  status: DocumentStatus
  notesCount: number
  createdAt: string
  lastAccessed?: string
  summary?: string
  [key: string]: unknown // Index signature for React Flow compatibility
}

// Custom node type for documents
export type DocumentNode = Node<DocumentNodeData, 'document'>

// Custom edge data
export interface RelationshipEdgeData {
  type: RelationshipType
  strength?: number // 0-1, how strong the connection is
  label?: string
  [key: string]: unknown // Index signature for React Flow compatibility
}

// Custom edge type
export type RelationshipEdge = Edge<RelationshipEdgeData>

// Category info for grouping
export interface CategoryInfo {
  id: string
  name: string
  color: string
  documentCount: number
}

// Knowledge map state
export interface KnowledgeMapState {
  nodes: DocumentNode[]
  edges: RelationshipEdge[]
  categories: CategoryInfo[]
  selectedNodeId: string | null
  filters: {
    categories: string[]
    statuses: DocumentStatus[]
    searchQuery: string
  }
}

// Category colors palette
export const CATEGORY_COLORS: Record<string, string> = {
  'AI/ML': '#f9bc60',
  'NLP': '#e16162',
  'Computer Vision': '#60a5fa',
  'Robotics': '#abd1c6',
  'Data Science': '#c084fc',
  'Security': '#fb923c',
  'Networks': '#4ade80',
  'HCI': '#f472b6',
  'default': '#94a3b8',
}

// Status colors
export const STATUS_COLORS: Record<DocumentStatus, string> = {
  unread: '#94a3b8',
  read: '#60a5fa',
  saved: '#f9bc60',
  noted: '#4ade80',
}

// Status icons mapping
export const STATUS_ICONS = {
  unread: 'Circle',
  read: 'CheckCircle',
  saved: 'Bookmark',
  noted: 'MessageSquare',
} as const
