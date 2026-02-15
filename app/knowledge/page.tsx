'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { KnowledgeMap, DocumentNodeData } from '@/components/features/KnowledgeMap'
import { Button } from '@/components/ui/button'
import { Loader2, Map, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

export default function KnowledgePage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all documents for the knowledge map
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Fetch all documents from API
        const res = await fetch('/api/search?limit=100')
        const data = await res.json()
        if (data.data) {
          // Add mock status for demo (in real app, this would come from user data)
          const docsWithStatus = data.data.map((doc: any, index: number) => ({
            ...doc,
            status: ['unread', 'read', 'saved', 'noted'][index % 4],
            notesCount: Math.floor(Math.random() * 5),
          }))
          setDocuments(docsWithStatus)
        }
      } catch (err) {
        setError('Không thể tải dữ liệu bản đồ tri thức')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Handle node click (show details)
  const handleNodeClick = useCallback((nodeId: string, data: DocumentNodeData) => {
    console.log('Node clicked:', nodeId, data)
  }, [])

  // Handle node double-click (navigate to document)
  const handleNodeDoubleClick = useCallback(
    (nodeId: string, data: DocumentNodeData) => {
      router.push(`/document/${data.id}`)
    },
    [router]
  )

  return (
    <div className="min-h-screen bg-[var(--mindtrans-bg)] flex flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="container-responsive py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Map className="h-4 w-4 text-primary" />
            <span>Bản đồ tri thức</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải bản đồ tri thức...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Chưa có bài báo nào</h2>
              <p className="text-muted-foreground mb-4">
                Hãy dịch một số bài báo để xây dựng bản đồ tri thức của bạn.
              </p>
              <Link href="/analyze">
                <Button>Dịch bài báo mới</Button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <KnowledgeMap
              initialDocuments={documents}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
            />

            {/* Help tooltip */}
            <div className="absolute bottom-20 sm:bottom-4 left-4 z-10">
              <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 shadow-lg max-w-xs">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Hướng dẫn:</p>
                    <ul className="space-y-0.5">
                      <li>• Click vào node để xem chi tiết</li>
                      <li>• Double-click để mở bài báo</li>
                      <li>• Kéo để di chuyển node</li>
                      <li>• Kéo từ ⚫ để tạo kết nối</li>
                      <li>• Scroll để zoom</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
