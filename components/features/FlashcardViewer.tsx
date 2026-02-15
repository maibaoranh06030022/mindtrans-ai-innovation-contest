'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Check,
  X,
} from 'lucide-react'

interface Flashcard {
  q: string
  a: string
}

interface FlashcardViewerProps {
  flashcards: Flashcard[]
  className?: string
}

export function FlashcardViewer({ flashcards, className = '' }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(flashcards)

  const currentCard = shuffledCards[currentIndex]

  const nextCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffledCards.length)
    }, 150)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length)
    }, 150)
  }

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownCards(new Set())
  }

  const resetCards = () => {
    setShuffledCards(flashcards)
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownCards(new Set())
  }

  const markAsKnown = () => {
    setKnownCards(new Set([...knownCards, currentIndex]))
    nextCard()
  }

  const markAsUnknown = () => {
    knownCards.delete(currentIndex)
    setKnownCards(new Set(knownCards))
    nextCard()
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-[var(--mindtrans-paragraph)] ${className}`}>
        Không có flashcards
      </div>
    )
  }

  const progress = ((currentIndex + 1) / shuffledCards.length) * 100
  const knownProgress = (knownCards.size / shuffledCards.length) * 100

  return (
    <div className={`flex flex-col items-center gap-6 p-4 ${className}`}>
      {/* Progress */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-[var(--mindtrans-paragraph)]">
          <span>Thẻ {currentIndex + 1} / {shuffledCards.length}</span>
          <span className="text-[var(--mindtrans-tertiary)]">{knownCards.size} đã thuộc</span>
        </div>
        <div className="relative h-2 bg-[var(--mindtrans-main)]/30 rounded-full overflow-hidden">
          <motion.div
            className="absolute h-full bg-[var(--mindtrans-highlight)]/30"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
          <motion.div
            className="absolute h-full bg-[var(--mindtrans-tertiary)]"
            initial={{ width: 0 }}
            animate={{ width: `${knownProgress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full max-w-md aspect-[3/2] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${isFlipped}`}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Card className={`w-full h-full border-2 transition-all duration-300 ${
              isFlipped 
                ? 'bg-gradient-to-br from-[var(--mindtrans-tertiary)]/10 to-[var(--mindtrans-tertiary)]/5 border-[var(--mindtrans-tertiary)]/30' 
                : 'bg-gradient-to-br from-[var(--mindtrans-highlight)]/10 to-[var(--mindtrans-main)]/20 border-[var(--mindtrans-highlight)]/30'
            }`}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                <span className={`text-xs font-medium mb-4 px-3 py-1 rounded-full ${
                  isFlipped 
                    ? 'bg-[var(--mindtrans-tertiary)]/20 text-[var(--mindtrans-tertiary)]' 
                    : 'bg-[var(--mindtrans-highlight)]/20 text-[var(--mindtrans-highlight)]'
                }`}>
                  {isFlipped ? 'TRẢ LỜI' : 'CÂU HỎI'}
                </span>
                <p className="text-lg font-medium leading-relaxed text-[var(--mindtrans-headline)]">
                  {isFlipped ? currentCard?.a : currentCard?.q}
                </p>
                <p className="text-xs text-[var(--mindtrans-paragraph)]/70 mt-4">
                  Click để lật thẻ
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Known indicator */}
        {knownCards.has(currentIndex) && (
          <div className="absolute -top-2 -right-2 bg-[var(--mindtrans-tertiary)] rounded-full p-1 shadow-lg">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={prevCard} className="rounded-xl border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)]">
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={markAsUnknown}
          className="gap-2 rounded-xl border-[var(--mindtrans-tertiary)]/50 text-[var(--mindtrans-tertiary)] hover:bg-[var(--mindtrans-tertiary)]/10 hover:border-[var(--mindtrans-tertiary)]"
        >
          <X className="h-4 w-4" />
          Chưa thuộc
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={markAsKnown}
          className="gap-2 rounded-xl border-[var(--mindtrans-highlight)]/50 text-[var(--mindtrans-highlight)] hover:bg-[var(--mindtrans-highlight)]/10 hover:border-[var(--mindtrans-highlight)]"
        >
          <Check className="h-4 w-4" />
          Đã thuộc
        </Button>

        <Button variant="outline" size="icon" onClick={nextCard} className="rounded-xl border-[var(--mindtrans-stroke)] text-[var(--mindtrans-paragraph)] hover:bg-[var(--mindtrans-main)]/30 hover:text-[var(--mindtrans-headline)]">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={shuffleCards} className="gap-2 text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl">
          <Shuffle className="h-4 w-4" />
          Xáo trộn
        </Button>
        <Button variant="ghost" size="sm" onClick={resetCards} className="gap-2 text-[var(--mindtrans-paragraph)] hover:text-[var(--mindtrans-headline)] hover:bg-[var(--mindtrans-main)]/30 rounded-xl">
          <RotateCcw className="h-4 w-4" />
          Làm lại
        </Button>
      </div>
    </div>
  )
}
