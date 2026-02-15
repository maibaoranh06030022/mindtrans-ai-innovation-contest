'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layout,
  RefreshCw,
  X,
  ChevronRight,
  Circle,
  CheckCircle,
  Bookmark,
  MessageSquare,
} from 'lucide-react'

import { DocumentNode } from './DocumentNode'
import {
  DocumentNode as DocumentNodeType,
  RelationshipEdge,
  DocumentNodeData,
  DocumentStatus,
  CATEGORY_COLORS,
  STATUS_COLORS,
} from './types'

// Register custom node types
const nodeTypes: NodeTypes = {
  document: DocumentNode as any,
}

// Props
interface KnowledgeMapProps {
  initialDocuments?: any[]
  onNodeClick?: (nodeId: string, data: DocumentNodeData) => void
  onNodeDoubleClick?: (nodeId: string, data: DocumentNodeData) => void
  className?: string
}

// Convert API documents to graph nodes
function documentsToNodes(documents: any[]): DocumentNodeType[] {
  const categoryPositions: Record<string, { x: number; count: number }> = {}
  let categoryIndex = 0

  return documents.map((doc, index) => {
    const category = doc.category || 'default'
    
    // Initialize category position if not exists
    if (!categoryPositions[category]) {
      categoryPositions[category] = {
        x: categoryIndex * 350,
        count: 0,
      }
      categoryIndex++
    }

    const pos = categoryPositions[category]
    const nodeX = pos.x + (Math.random() * 100 - 50)
    const nodeY = pos.count * 180 + (Math.random() * 40 - 20)
    pos.count++

    return {
      id: String(doc.id),
      type: 'document',
      position: { x: nodeX, y: nodeY },
      data: {
        id: doc.id,
        topic: doc.topic,
        category: category,
        tags: doc.tags || [],
        url: doc.url,
        status: (doc.status as DocumentStatus) || 'unread',
        notesCount: doc.notesCount || 0,
        createdAt: doc.created_at || new Date().toISOString(),
        lastAccessed: doc.lastAccessed,
        summary: doc.summary,
      },
    }
  })
}

// Generate edges based on shared tags/categories
function generateEdges(nodes: DocumentNodeType[]): RelationshipEdge[] {
  const edges: RelationshipEdge[] = []
  const addedPairs = new Set<string>()

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i]
      const nodeB = nodes[j]
      const pairKey = `${nodeA.id}-${nodeB.id}`

      if (addedPairs.has(pairKey)) continue

      // Same category connection
      if (nodeA.data.category === nodeB.data.category) {
        edges.push({
          id: `e-cat-${nodeA.id}-${nodeB.id}`,
          source: nodeA.id,
          target: nodeB.id,
          type: 'default',
          animated: false,
          style: { stroke: CATEGORY_COLORS[nodeA.data.category] || '#94a3b8', strokeWidth: 1, opacity: 0.4 },
          data: { type: 'same_category', strength: 0.3 },
        })
        addedPairs.add(pairKey)
        continue
      }

      // Shared tags connection
      const sharedTags = nodeA.data.tags.filter((t) => nodeB.data.tags.includes(t))
      if (sharedTags.length > 0) {
        const strength = Math.min(sharedTags.length / 3, 1)
        edges.push({
          id: `e-tag-${nodeA.id}-${nodeB.id}`,
          source: nodeA.id,
          target: nodeB.id,
          type: 'default',
          animated: strength > 0.5,
          style: { stroke: '#f9bc60', strokeWidth: 1 + strength, opacity: 0.3 + strength * 0.4 },
          label: sharedTags.length > 1 ? `${sharedTags.length} tags` : sharedTags[0],
          labelStyle: { fontSize: 9, fill: '#94a3b8' },
          data: { type: 'same_tag', strength, label: sharedTags.join(', ') },
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#f9bc60' },
        })
        addedPairs.add(pairKey)
      }
    }
  }

  return edges
}

// ===== Main Component =====
export function KnowledgeMap({
  initialDocuments = [],
  onNodeClick,
  onNodeDoubleClick,
  className,
}: KnowledgeMapProps) {
  // Convert documents to nodes/edges
  const initialNodes = useMemo(() => documentsToNodes(initialDocuments), [initialDocuments])
  const initialEdges = useMemo(() => generateEdges(initialNodes), [initialNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<DocumentStatus[]>([])
  const [selectedNode, setSelectedNode] = useState<DocumentNodeType | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(initialNodes.map((n) => n.data.category))
    return Array.from(cats)
  }, [initialNodes])

  // Filter nodes
  useEffect(() => {
    let filtered = initialNodes

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.data.topic.toLowerCase().includes(q) ||
          n.data.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((n) => selectedCategories.includes(n.data.category))
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((n) => selectedStatuses.includes(n.data.status))
    }

    setNodes(filtered)
    setEdges(generateEdges(filtered))
  }, [searchQuery, selectedCategories, selectedStatuses, initialNodes, setNodes, setEdges])

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'default',
            animated: true,
            style: { stroke: '#c084fc', strokeWidth: 2 },
            data: { type: 'user_linked' },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  // Handle node click
  const handleNodeClick = useCallback(
    (_: any, node: DocumentNodeType) => {
      setSelectedNode(node)
      onNodeClick?.(node.id, node.data)
    },
    [onNodeClick]
  )

  // Handle node double-click (navigate)
  const handleNodeDoubleClick = useCallback(
    (_: any, node: DocumentNodeType) => {
      onNodeDoubleClick?.(node.id, node.data)
    },
    [onNodeDoubleClick]
  )

  // Toggle category filter
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  // Toggle status filter
  const toggleStatus = (status: DocumentStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategories([])
    setSelectedStatuses([])
  }

  return (
    <div className={cn('w-full h-full relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'default',
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        {/* Background */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--mindtrans-stroke)" />

        {/* Controls */}
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !shadow-lg !rounded-xl"
        />

        {/* MiniMap */}
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as DocumentNodeData
            return CATEGORY_COLORS[data?.category] || CATEGORY_COLORS.default
          }}
          maskColor="rgba(0,0,0,0.1)"
          className="!bg-card !border-border !rounded-xl"
          pannable
          zoomable
        />

        {/* Top Panel - Search & Filters */}
        <Panel position="top-left" className="!m-4">
          <div className="flex flex-col gap-2">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm bài báo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-card"
                />
              </div>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              {(searchQuery || selectedCategories.length > 0 || selectedStatuses.length > 0) && (
                <Button variant="ghost" size="icon" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card border border-border rounded-xl p-3 shadow-lg overflow-hidden"
                >
                  {/* Categories */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Danh mục</div>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs"
                          style={{
                            backgroundColor: selectedCategories.includes(cat)
                              ? CATEGORY_COLORS[cat]
                              : undefined,
                            color: selectedCategories.includes(cat) ? 'white' : undefined,
                          }}
                          onClick={() => toggleCategory(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Statuses */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Trạng thái</div>
                    <div className="flex flex-wrap gap-1">
                      {(['unread', 'read', 'saved', 'noted'] as DocumentStatus[]).map((status) => (
                        <Badge
                          key={status}
                          variant={selectedStatuses.includes(status) ? 'default' : 'outline'}
                          className="cursor-pointer text-xs gap-1"
                          onClick={() => toggleStatus(status)}
                        >
                          {status === 'unread' && <Circle className="h-3 w-3" />}
                          {status === 'read' && <CheckCircle className="h-3 w-3" />}
                          {status === 'saved' && <Bookmark className="h-3 w-3" />}
                          {status === 'noted' && <MessageSquare className="h-3 w-3" />}
                          {status === 'unread' && 'Chưa đọc'}
                          {status === 'read' && 'Đã đọc'}
                          {status === 'saved' && 'Đã lưu'}
                          {status === 'noted' && 'Có ghi chú'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right" className="!m-4">
          <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
            <div className="text-xs text-muted-foreground mb-1">Bản đồ tri thức</div>
            <div className="text-2xl font-bold text-foreground">{nodes.length}</div>
            <div className="text-xs text-muted-foreground">bài báo</div>
            <div className="text-sm font-medium text-primary mt-1">{edges.length} kết nối</div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Selected Node Detail (Sidebar) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="absolute top-0 right-0 w-80 h-full bg-card border-l border-border shadow-lg z-10"
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Chi tiết bài báo</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {/* Category */}
                  <Badge
                    style={{
                      backgroundColor: CATEGORY_COLORS[selectedNode.data.category],
                      color: 'white',
                    }}
                  >
                    {selectedNode.data.category}
                  </Badge>

                  {/* Title */}
                  <h2 className="text-lg font-semibold leading-tight">{selectedNode.data.topic}</h2>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.data.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Trạng thái:</span>
                    <Badge
                      variant="outline"
                      style={{ borderColor: STATUS_COLORS[selectedNode.data.status] }}
                    >
                      {selectedNode.data.status}
                    </Badge>
                  </div>

                  {/* Notes count */}
                  {selectedNode.data.notesCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedNode.data.notesCount} ghi chú</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-sm text-muted-foreground">
                    Ngày thêm: {new Date(selectedNode.data.createdAt).toLocaleDateString('vi-VN')}
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-4">
                    <Button
                      className="w-full"
                      onClick={() => onNodeDoubleClick?.(selectedNode.id, selectedNode.data)}
                    >
                      Xem chi tiết
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    {selectedNode.data.url && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={selectedNode.data.url} target="_blank" rel="noopener noreferrer">
                          Xem nguồn gốc
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
