'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { StickyNotes } from '@/components/features/StickyNotes'
import { DocumentCard } from '@/components/features/DocumentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Search,
  Sparkles,
  BookOpen,
  Brain,
  Layers,
  TrendingUp,
  Loader2,
  ArrowRight,
  Filter,
} from 'lucide-react'
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

const CATEGORIES = [
  'Tất cả',
  'Artificial Intelligence',
  'Engineering & Manufacturing',
  'Construction & Architecture',
  'Data & Analytics',
  'IoT & Smart Systems',
  'Healthcare',
  'Security',
]

export default function HomePage() {
  const layout = useLayout()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch('/api/search?limit=50')
        const data = await res.json()
        if (data.data) {
          setDocuments(data.data)
          setFilteredDocs(data.data)

          // Extract all unique tags
          const tags = new Set<string>()
          data.data.forEach((doc: Document) => {
            doc.tags?.forEach(tag => tags.add(tag))
          })
          setAllTags(Array.from(tags).slice(0, 20))
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Filter documents
  useEffect(() => {
    let result = documents

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(doc =>
        doc.topic.toLowerCase().includes(query) ||
        doc.content_vi.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedCategory !== 'Tất cả') {
      result = result.filter(doc => doc.category === selectedCategory)
    }

    if (selectedTag) {
      result = result.filter(doc => doc.tags?.includes(selectedTag))
    }

    setFilteredDocs(result)
  }, [searchQuery, selectedCategory, selectedTag, documents])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const stats = {
    total: documents.length,
    categories: new Set(documents.map(d => d.category)).size,
    tags: allTags.length,
  }

  return (
    <div className="min-h-screen bg-[var(--mindtrans-bg)]">
      <Header 
        onSearch={handleSearch}
      />
      
      {/* Notes Panel - shown via layout context on non-mobile */}
      <StickyNotes 
        isVisible={layout.notesPanelOpen && !layout.isMobile} 
        onClose={layout.toggleNotesPanel} 
      />

      <main className="container-responsive py-4 sm:py-6 lg:py-8 pb-24 sm:pb-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--mindtrans-highlight)]/20 text-[var(--mindtrans-highlight)] mb-4 sm:mb-6 shadow-neumorphic">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm font-medium">Powered by Gemini AI</span>
          </div>
          
          <h1 className="text-responsive-2xl font-bold mb-3 sm:mb-4 text-[var(--mindtrans-headline)]">
            MindTrans <span className="text-[var(--mindtrans-highlight)]">AI</span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-lg text-[var(--mindtrans-paragraph)] max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Dịch thuật và phân tích bài báo khoa học với AI. 
            Tạo mindmap tự động để học hiệu quả hơn.
          </p>

          {/* Search - Hidden on mobile (use header search) */}
          <div className="hidden sm:block max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--mindtrans-paragraph)]" />
              <Input
                type="search"
                placeholder="Tìm kiếm bài báo, chủ đề..."
                className="pl-12 pr-4 h-12 text-lg rounded-full bg-[var(--mindtrans-main)]/30 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 focus:border-[var(--mindtrans-highlight)] shadow-neumorphic-inset"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/analyze">
              <Button size="lg" className="gap-2 rounded-full btn-highlight shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 touch-target text-sm sm:text-base">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Phân tích bài mới</span>
                <span className="sm:hidden">Phân tích</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-12"
        >
          <Card className="card-neumorphic border-none">
            <CardContent className="flex flex-col items-center justify-center p-3 sm:p-6">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--mindtrans-highlight)] mb-1 sm:mb-2" />
              <span className="text-xl sm:text-3xl font-bold text-[var(--mindtrans-headline)]">{stats.total}</span>
              <span className="text-[10px] sm:text-sm text-[var(--mindtrans-paragraph)]">Bài báo</span>
            </CardContent>
          </Card>
          <Card className="card-neumorphic border-none">
            <CardContent className="flex flex-col items-center justify-center p-3 sm:p-6">
              <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--mindtrans-secondary)] mb-1 sm:mb-2" />
              <span className="text-xl sm:text-3xl font-bold text-[var(--mindtrans-headline)]">{stats.categories}</span>
              <span className="text-[10px] sm:text-sm text-[var(--mindtrans-paragraph)]">Danh mục</span>
            </CardContent>
          </Card>
          <Card className="card-neumorphic border-none">
            <CardContent className="flex flex-col items-center justify-center p-3 sm:p-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--mindtrans-tertiary)] mb-1 sm:mb-2" />
              <span className="text-xl sm:text-3xl font-bold text-[var(--mindtrans-headline)]">{stats.tags}</span>
              <span className="text-[10px] sm:text-sm text-[var(--mindtrans-paragraph)]">Chủ đề</span>
            </CardContent>
          </Card>
        </motion.section>

        {/* Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          {/* Categories */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--mindtrans-paragraph)]" />
              <span className="text-xs sm:text-sm font-medium text-[var(--mindtrans-headline)]">Danh mục</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 sm:gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full transition-all duration-300 text-xs sm:text-sm touch-target ${
                      selectedCategory === cat 
                        ? 'btn-highlight' 
                        : 'border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)]'
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--mindtrans-paragraph)]" />
              <span className="text-xs sm:text-sm font-medium text-[var(--mindtrans-headline)]">Tags phổ biến</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 sm:gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? 'default' : 'secondary'}
                    className={`cursor-pointer transition-all duration-300 text-[10px] sm:text-xs ${
                      selectedTag === tag 
                        ? 'bg-[var(--mindtrans-highlight)] text-[var(--mindtrans-button-text)]' 
                        : 'bg-[var(--mindtrans-main)]/30 text-[var(--mindtrans-secondary)] hover:bg-[var(--mindtrans-highlight)]/50 hover:text-[var(--mindtrans-headline)]'
                    }`}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </motion.section>

        {/* Results */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-xl font-semibold text-[var(--mindtrans-headline)]">
              {searchQuery || selectedCategory !== 'Tất cả' || selectedTag
                ? `Kết quả (${filteredDocs.length})`
                : 'Bài báo mới nhất'}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--mindtrans-highlight)]" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <Card className="card-neumorphic border-none">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-[var(--mindtrans-paragraph)] mb-4" />
                <p className="text-[var(--mindtrans-paragraph)] text-sm sm:text-base">Không tìm thấy bài báo nào</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('Tất cả')
                    setSelectedTag(null)
                  }}
                  className="text-[var(--mindtrans-highlight)]"
                >
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DocumentCard document={doc} variant="compact" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--mindtrans-stroke)] mt-8 sm:mt-16 hidden sm:block">
        <div className="container-responsive py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-[var(--mindtrans-highlight)]">MT</span>
              <span className="font-semibold text-[var(--mindtrans-headline)]">MindTrans AI</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--mindtrans-paragraph)]">
              © 2026 MindTrans AI - Innovation Contest Project
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
