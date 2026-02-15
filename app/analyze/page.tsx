'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { StickyNotes } from '@/components/features/StickyNotes'
import { DocumentCard } from '@/components/features/DocumentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Link2,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useLayout } from '@/contexts/LayoutContext'

interface AnalysisResult {
  saved: boolean
  alreadyInDatabase?: boolean
  previouslySkipped?: boolean
  reason?: string
  message?: string
  tags?: string[]
  category?: string
  title?: string
  id?: number
  existingData?: {
    id: number
    title: string
    tags: string[]
    category: string
  }
  error?: string
}

export default function AnalyzePage() {
  const layout = useLayout()
  const [inputType, setInputType] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzedDoc, setAnalyzedDoc] = useState<any>(null)

  const handleAnalyze = async () => {
    if (inputType === 'url' && !url) return
    if (inputType === 'text' && !text) return

    setIsAnalyzing(true)
    setResult(null)
    setAnalyzedDoc(null)

    try {
      const body = inputType === 'url' 
        ? { url }
        : { text, title: title || undefined }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      setResult(data)

      // If saved, fetch the full document
      if (data.saved && data.id) {
        const docRes = await fetch(`/api/search?id=${data.id}`)
        const docData = await docRes.json()
        if (docData.data && docData.data.length > 0) {
          setAnalyzedDoc(docData.data[0])
        }
      }
    } catch (err: any) {
      setResult({ saved: false, error: err.message })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getResultIcon = () => {
    if (!result) return null
    if (result.error) return <XCircle className="h-6 w-6 text-red-500" />
    if (result.alreadyInDatabase) return <AlertCircle className="h-6 w-6 text-yellow-500" />
    if (result.previouslySkipped) return <AlertCircle className="h-6 w-6 text-orange-500" />
    if (result.saved) return <CheckCircle className="h-6 w-6 text-green-500" />
    return <XCircle className="h-6 w-6 text-red-500" />
  }

  const getResultMessage = () => {
    if (!result) return null
    if (result.error) return `Lỗi: ${result.error}`
    if (result.alreadyInDatabase) return 'Bài báo này đã có trong thư viện!'
    if (result.previouslySkipped) return `Đã từng phân tích: ${result.message}`
    if (result.saved) return 'Đã phân tích và lưu thành công!'
    return result.message || 'Không đủ điều kiện để lưu vào thư viện'
  }

  return (
    <div className="min-h-screen bg-[var(--mindtrans-bg)]">
      <Header />
      
      {/* Notes Panel */}
      <StickyNotes 
        isVisible={layout.notesPanelOpen && !layout.isMobile} 
        onClose={layout.toggleNotesPanel} 
      />

      <main className="container-responsive py-4 sm:py-6 lg:py-8 pb-24 sm:pb-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/">
            <Button variant="ghost" className="mb-4 sm:mb-6 gap-2 text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl touch-target">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm sm:text-base">Quay lại</span>
            </Button>
          </Link>

          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--mindtrans-highlight)]/20 text-[var(--mindtrans-highlight)] mb-3 sm:mb-4 shadow-neumorphic">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm font-medium">AI Analysis</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-[var(--mindtrans-headline)]">
              Phân tích bài báo mới
            </h1>
            <p className="text-sm sm:text-base text-[var(--mindtrans-paragraph)] px-4">
              Paste link hoặc nội dung để AI phân tích, dịch thuật và tạo mindmap
            </p>
          </div>

          <Card className="card-neumorphic border-none">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-[var(--mindtrans-headline)]">Nhập dữ liệu</CardTitle>
              <CardDescription className="text-sm text-[var(--mindtrans-paragraph)]">
                Chọn cách nhập dữ liệu: URL bài báo hoặc paste trực tiếp nội dung
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'url' | 'text')}>
                <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-[var(--mindtrans-main)]/30 rounded-xl p-1">
                  <TabsTrigger value="url" className="gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] text-xs sm:text-sm touch-target">
                    <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">URL / DOI Link</span>
                    <span className="sm:hidden">URL</span>
                  </TabsTrigger>
                  <TabsTrigger value="text" className="gap-1 sm:gap-2 rounded-lg data-[state=active]:bg-[var(--mindtrans-highlight)] data-[state=active]:text-[var(--mindtrans-button-text)] text-[var(--mindtrans-paragraph)] text-xs sm:text-sm touch-target">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Paste nội dung</span>
                    <span className="sm:hidden">Text</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block text-[var(--mindtrans-headline)]">
                        URL bài báo hoặc DOI
                      </label>
                      <Input
                        type="url"
                        placeholder="https://doi.org/10.1016/... hoặc URL bài báo"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="h-10 sm:h-12 bg-[var(--mindtrans-main)]/20 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 focus:border-[var(--mindtrans-highlight)] rounded-xl text-sm sm:text-base"
                      />
                      <p className="text-[10px] sm:text-xs text-[var(--mindtrans-paragraph)]/70 mt-2">
                        Hỗ trợ: DOI links, tạp chí khoa học, blog công nghệ...
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block text-[var(--mindtrans-headline)]">
                        Tiêu đề (tùy chọn)
                      </label>
                      <Input
                        placeholder="Tiêu đề bài báo..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-10 sm:h-auto bg-[var(--mindtrans-main)]/20 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 focus:border-[var(--mindtrans-highlight)] rounded-xl text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-2 block text-[var(--mindtrans-headline)]">
                        Nội dung bài báo
                      </label>
                      <Textarea
                        placeholder="Paste nội dung bài báo tại đây..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[150px] sm:min-h-[200px] bg-[var(--mindtrans-main)]/20 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-headline)] placeholder:text-[var(--mindtrans-paragraph)]/60 focus:border-[var(--mindtrans-highlight)] rounded-xl text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (inputType === 'url' ? !url : !text)}
                className="w-full mt-4 sm:mt-6 h-10 sm:h-12 gap-2 btn-highlight rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 text-sm sm:text-base touch-target"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Đang phân tích với AI...</span>
                    <span className="sm:hidden">Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    Phân tích ngay
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8"
              >
                <Card className={`border-2 rounded-xl ${
                  result.error 
                    ? 'border-[var(--mindtrans-tertiary)]/50 bg-[var(--mindtrans-tertiary)]/10' 
                    : result.alreadyInDatabase 
                      ? 'border-[var(--mindtrans-highlight)]/50 bg-[var(--mindtrans-highlight)]/10'
                      : result.saved 
                        ? 'border-[var(--mindtrans-secondary)]/50 bg-[var(--mindtrans-secondary)]/10' 
                        : 'border-orange-500/50 bg-orange-500/10'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {getResultIcon()}
                      <div className="flex-1">
                        <p className="font-medium mb-2 text-[var(--mindtrans-headline)]">{getResultMessage()}</p>
                        
                        {result.title && (
                          <p className="text-sm text-[var(--mindtrans-paragraph)] mb-2">
                            <strong>Tiêu đề:</strong> {result.title}
                          </p>
                        )}

                        {(result.tags || result.existingData?.tags) && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(result.tags || result.existingData?.tags)?.map((tag, i) => (
                              <Badge key={i} className="bg-[var(--mindtrans-main)]/40 text-[var(--mindtrans-secondary)]">{tag}</Badge>
                            ))}
                          </div>
                        )}

                        {(result.category || result.existingData?.category) && (
                          <Badge variant="outline" className="border-[var(--mindtrans-highlight)] text-[var(--mindtrans-highlight)]">
                            {result.category || result.existingData?.category}
                          </Badge>
                        )}

                        {result.alreadyInDatabase && result.existingData && (
                          <div className="mt-4">
                            <Link href={`/document/${result.existingData.id}`}>
                              <Button variant="outline" className="gap-2 border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl">
                                Xem bài báo
                              </Button>
                            </Link>
                          </div>
                        )}

                        {result.saved && result.id && (
                          <div className="mt-4">
                            <Link href={`/document/${result.id}`}>
                              <Button className="gap-2 btn-highlight rounded-xl">
                                <CheckCircle className="h-4 w-4" />
                                Xem bài đã lưu
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Show full analyzed document */}
                {analyzedDoc && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 sm:mt-6"
                  >
                    <DocumentCard document={analyzedDoc} variant="full" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
