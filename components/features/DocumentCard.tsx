'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ExternalLink,
  BookOpen,
  Brain,
  Clock,
  Tag,
  Folder,
  Copy,
  Check,
  BookMarked,
  Minus,
  Plus,
  Lightbulb,
  Link2,
  Wrench,
  AlertTriangle,
  MapPin,
  Sparkles,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { MindmapViewer } from './MindmapViewer'
import { cn } from '@/lib/utils'

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
  // 🆕 Enhanced fields
  implementation_suggestions?: {
    ideas: string[]
    tools: string[]
    challenges: string[]
    vn_context?: string
  }
  key_contributions?: string[]
}

interface RelatedPaper {
  id: number
  topic: string
  tags: string[]
  category: string
  matchScore: number
  sharedTags: string[]
}

interface DocumentCardProps {
  document: Document
  variant?: 'compact' | 'full'
}

export function DocumentCard({ document, variant = 'compact' }: DocumentCardProps) {
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState(16) // Base font size
  const [readingMode, setReadingMode] = useState(false)
  const [relatedPapers, setRelatedPapers] = useState<RelatedPaper[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch related papers when tab is opened
  const fetchRelatedPapers = async () => {
    if (relatedPapers.length > 0 || isLoadingRelated) return
    
    setIsLoadingRelated(true)
    try {
      const res = await fetch(`/api/related?document_id=${document.id}&limit=5`)
      const data = await res.json()
      if (data.data) {
        setRelatedPapers(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch related papers:', err)
    } finally {
      setIsLoadingRelated(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(document.url || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.min(24, Math.max(12, prev + delta)))
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ duration: 0.3 }}
      >
        <Link href={`/document/${document.id}`}>
          <Card className="h-full card-neumorphic cursor-pointer group overflow-hidden">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <div className="flex items-start justify-between gap-2">
                <Badge className="text-[10px] sm:text-xs bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-headline)] border-[var(--mindtrans-stroke)]">
                  <Folder className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  {document.category || 'General'}
                </Badge>
                <span className="text-[10px] sm:text-xs text-[var(--mindtrans-paragraph)]/70 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {new Date(document.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <CardTitle className="text-sm sm:text-base line-clamp-2 text-[var(--mindtrans-headline)] group-hover:text-[var(--mindtrans-highlight)] transition-colors">
                {document.topic}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xs sm:text-sm text-[var(--mindtrans-paragraph)] line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3">
                {document.content_vi}
              </p>
              <div className="flex flex-wrap gap-1">
                {document.tags?.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] sm:text-xs border-[var(--mindtrans-stroke)] text-[var(--mindtrans-secondary)] hover:bg-[var(--mindtrans-main)]/30">
                    {tag}
                  </Badge>
                ))}
                {document.tags?.length > 2 && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs border-[var(--mindtrans-highlight)] text-[var(--mindtrans-highlight)]">
                    +{document.tags.length - 2}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    )
  }

  // Full variant with responsive tabs
  return (
    <Card className="w-full card-neumorphic overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-[var(--mindtrans-highlight)]/20 text-[var(--mindtrans-highlight)] border-[var(--mindtrans-highlight)]/30">
                <Folder className="h-3 w-3 mr-1" />
                {document.category || 'General'}
              </Badge>
              <span className="text-xs sm:text-sm text-[var(--mindtrans-paragraph)]/70 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(document.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl text-[var(--mindtrans-headline)] break-words">
              {document.topic}
            </CardTitle>
            <div className="flex flex-wrap gap-1">
              {document.tags?.slice(0, 5).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] sm:text-xs border-[var(--mindtrans-stroke)] text-[var(--mindtrans-secondary)] hover:bg-[var(--mindtrans-main)]/30 transition-colors">
                  <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {document.tags?.length > 5 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs border-[var(--mindtrans-highlight)] text-[var(--mindtrans-highlight)]">
                  +{document.tags.length - 5}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {document.url && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyLink} 
                  className="touch-target border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)] rounded-xl"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <a href={document.url} target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="touch-target border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)] rounded-xl"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <Tabs defaultValue="summary" className="w-full">
          {/* Responsive Tab List - scrollable on mobile */}
          <div className="relative">
            <TabsList className="w-full flex bg-[var(--mindtrans-main)]/30 rounded-xl p-1 overflow-x-auto scroll-snap-x no-scrollbar">
              <TabsTrigger 
                value="summary" 
                className="flex-1 min-w-[90px] gap-1.5 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] scroll-snap-item touch-target"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[11px] sm:text-sm">Tóm tắt</span>
              </TabsTrigger>
              <TabsTrigger 
                value="mindmap" 
                className="flex-1 min-w-[90px] gap-1.5 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] scroll-snap-item touch-target"
              >
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[11px] sm:text-sm">Mindmap</span>
              </TabsTrigger>
              <TabsTrigger 
                value="implementation" 
                className="flex-1 min-w-[90px] gap-1.5 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] scroll-snap-item touch-target"
              >
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[11px] sm:text-sm">Triển khai</span>
              </TabsTrigger>
              <TabsTrigger 
                value="related" 
                onClick={fetchRelatedPapers}
                className="flex-1 min-w-[90px] gap-1.5 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] scroll-snap-item touch-target"
              >
                <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[11px] sm:text-sm">Liên quan</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-4">
            {/* Reading Controls */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReadingMode(!readingMode)}
                  className={cn(
                    "gap-1 sm:gap-2 rounded-xl text-xs touch-target",
                    readingMode 
                      ? "bg-[var(--mindtrans-highlight)] text-[var(--mindtrans-button-text)]"
                      : "border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)]"
                  )}
                >
                  <BookMarked className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Đọc tập trung</span>
                </Button>
              </div>
              
              <div className="flex items-center gap-1 bg-[var(--mindtrans-main)]/30 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => adjustFontSize(-2)}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                  disabled={fontSize <= 12}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-xs text-[var(--mindtrans-paragraph)] min-w-[40px] text-center">
                  {fontSize}px
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => adjustFontSize(2)}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg"
                  disabled={fontSize >= 24}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <ScrollArea 
              className={cn(
                "rounded-xl border border-[var(--mindtrans-stroke)] p-3 sm:p-4 bg-[var(--mindtrans-main)]/10 transition-all",
                readingMode ? "h-[70vh]" : "h-[300px] sm:h-[400px]"
              )}
            >
              <div 
                ref={contentRef}
                className={cn(
                  "max-w-none",
                  readingMode && "max-w-2xl mx-auto"
                )}
                style={{ fontSize: `${fontSize}px` }}
              >
                <p 
                  className={cn(
                    "text-[var(--mindtrans-paragraph)] whitespace-pre-wrap",
                    readingMode ? "leading-[1.9] tracking-wide" : "leading-relaxed"
                  )}
                >
                  {document.content_vi}
                </p>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Mindmap Tab */}
          <TabsContent value="mindmap" className="mt-4">
            <div className="rounded-xl border border-[var(--mindtrans-stroke)] bg-[var(--mindtrans-main)]/10 h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
              <MindmapViewer code={document.mindmap_code} className="h-full" />
            </div>
          </TabsContent>

          {/* 🆕 Implementation Suggestions Tab */}
          <TabsContent value="implementation" className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px] rounded-xl border border-[var(--mindtrans-stroke)] bg-[var(--mindtrans-main)]/10 p-4">
              {document.implementation_suggestions ? (
                <div className="space-y-6">
                  {/* Ideas */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--mindtrans-headline)] mb-3">
                      <Lightbulb className="h-4 w-4 text-[var(--mindtrans-highlight)]" />
                      Ý tưởng áp dụng
                    </h3>
                    <ul className="space-y-2">
                      {document.implementation_suggestions.ideas?.map((idea, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--mindtrans-paragraph)]">
                          <Sparkles className="h-4 w-4 text-[var(--mindtrans-tertiary)] mt-0.5 flex-shrink-0" />
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tools */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--mindtrans-headline)] mb-3">
                      <Wrench className="h-4 w-4 text-[var(--mindtrans-secondary)]" />
                      Công cụ & Framework
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {document.implementation_suggestions.tools?.map((tool, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-[var(--mindtrans-main)]/40">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Challenges */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--mindtrans-headline)] mb-3">
                      <AlertTriangle className="h-4 w-4 text-[var(--mindtrans-tertiary)]" />
                      Thách thức & Giải pháp
                    </h3>
                    <ul className="space-y-2">
                      {document.implementation_suggestions.challenges?.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--mindtrans-paragraph)]">
                          <ChevronRight className="h-4 w-4 text-[var(--mindtrans-highlight)] mt-0.5 flex-shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* VN Context */}
                  {document.implementation_suggestions.vn_context && (
                    <div className="p-3 rounded-lg bg-[var(--mindtrans-highlight)]/10 border border-[var(--mindtrans-highlight)]/30">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--mindtrans-headline)] mb-2">
                        <MapPin className="h-4 w-4 text-[var(--mindtrans-highlight)]" />
                        Bối cảnh Việt Nam
                      </h3>
                      <p className="text-sm text-[var(--mindtrans-paragraph)]">
                        {document.implementation_suggestions.vn_context}
                      </p>
                    </div>
                  )}

                  {/* Key Contributions */}
                  {document.key_contributions && document.key_contributions.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--mindtrans-headline)] mb-3">
                        <Sparkles className="h-4 w-4 text-[var(--mindtrans-highlight)]" />
                        Đóng góp chính của nghiên cứu
                      </h3>
                      <ul className="space-y-2">
                        {document.key_contributions.map((contrib, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--mindtrans-paragraph)]">
                            <Badge className="text-[10px] bg-[var(--mindtrans-highlight)] text-white px-1.5 py-0 mt-0.5">
                              {i + 1}
                            </Badge>
                            <span>{contrib}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--mindtrans-paragraph)]">
                  <Lightbulb className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chưa có gợi ý triển khai cho bài báo này.</p>
                  <p className="text-xs mt-1 opacity-70">Tính năng này sẽ được tạo tự động khi phân tích bài báo mới.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* 🆕 Related Papers Tab */}
          <TabsContent value="related" className="mt-4">
            <ScrollArea className="h-[300px] sm:h-[400px] rounded-xl border border-[var(--mindtrans-stroke)] bg-[var(--mindtrans-main)]/10 p-4">
              {isLoadingRelated ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--mindtrans-highlight)]" />
                  <p className="text-sm text-[var(--mindtrans-paragraph)] mt-2">Đang tìm bài liên quan...</p>
                </div>
              ) : relatedPapers.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--mindtrans-paragraph)] mb-4">
                    Tìm thấy {relatedPapers.length} bài báo có nội dung liên quan dựa trên tags và category.
                  </p>
                  {relatedPapers.map((paper) => (
                    <Link key={paper.id} href={`/document/${paper.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        className="p-3 rounded-lg border border-[var(--mindtrans-stroke)] bg-card hover:border-[var(--mindtrans-highlight)]/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-medium text-[var(--mindtrans-headline)] line-clamp-2">
                            {paper.topic}
                          </h4>
                          <Badge 
                            className="text-[10px] px-1.5 py-0 flex-shrink-0"
                            style={{
                              backgroundColor: `hsl(${paper.matchScore * 1.2}, 70%, 50%)`,
                              color: 'white'
                            }}
                          >
                            {paper.matchScore}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            <Folder className="h-2.5 w-2.5 mr-1" />
                            {paper.category}
                          </Badge>
                        </div>
                        {paper.sharedTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-[10px] text-[var(--mindtrans-paragraph)]">Tags chung:</span>
                            {paper.sharedTags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0 bg-[var(--mindtrans-highlight)]/20 text-[var(--mindtrans-highlight)]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[var(--mindtrans-paragraph)]">
                  <Link2 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Không tìm thấy bài báo liên quan.</p>
                  <p className="text-xs mt-1 opacity-70">Thêm nhiều bài báo hơn để xây dựng mạng lưới kiến thức.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
