import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * Related Papers Finder API
 * Finds similar papers based on shared tags and category
 * Returns up to 5 related papers with match score
 */

interface RelatedPaper {
  id: number
  topic: string
  tags: string[]
  category: string
  url?: string
  matchScore: number // 0-100
  sharedTags: string[]
}

function calculateMatchScore(
  sourceTags: string[],
  sourceCategory: string,
  targetTags: string[],
  targetCategory: string
): { score: number; sharedTags: string[] } {
  // Find shared tags
  const sourceTagsLower = sourceTags.map(t => t.toLowerCase())
  const sharedTags = targetTags.filter(t => 
    sourceTagsLower.includes(t.toLowerCase())
  )
  
  // Calculate score components
  let score = 0
  
  // Tag similarity: up to 60 points
  const tagSimilarity = sharedTags.length / Math.max(sourceTags.length, targetTags.length, 1)
  score += Math.round(tagSimilarity * 60)
  
  // Category match: 30 points
  if (sourceCategory === targetCategory) {
    score += 30
  } else if (
    sourceCategory.includes(targetCategory) || 
    targetCategory.includes(sourceCategory)
  ) {
    score += 15 // Partial match
  }
  
  // Bonus for multiple shared tags: up to 10 points
  score += Math.min(sharedTags.length * 2, 10)
  
  return { score: Math.min(score, 100), sharedTags }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('document_id')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '5')

    // Need either document_id or tags to find related papers
    if (!documentId && (!tags || tags.length === 0)) {
      return NextResponse.json(
        { error: 'Provide document_id or tags parameter' },
        { status: 400 }
      )
    }

    let sourceTags: string[] = tags || []
    let sourceCategory: string = category || ''
    let sourceId: number | null = null

    // If document_id provided, fetch that document first
    if (documentId) {
      const { data: sourceDoc, error: sourceError } = await supabase
        .from('documents')
        .select('id, tags, category')
        .eq('id', documentId)
        .single()

      if (sourceError || !sourceDoc) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        )
      }

      sourceId = sourceDoc.id
      sourceTags = sourceDoc.tags || []
      sourceCategory = sourceDoc.category || ''
    }

    if (sourceTags.length === 0) {
      return NextResponse.json({ data: [], message: 'No tags to match' })
    }

    // Fetch candidate documents
    // Get documents that share at least one tag or same category
    let query = supabase
      .from('documents')
      .select('id, topic, tags, category, url, created_at')
      .limit(50) // Fetch more to filter later

    // Exclude source document
    if (sourceId) {
      query = query.neq('id', sourceId)
    }

    const { data: candidates, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Calculate match scores
    const scored: RelatedPaper[] = candidates
      .map(doc => {
        const { score, sharedTags } = calculateMatchScore(
          sourceTags,
          sourceCategory,
          doc.tags || [],
          doc.category || ''
        )
        return {
          id: doc.id,
          topic: doc.topic,
          tags: doc.tags || [],
          category: doc.category || '',
          url: doc.url,
          matchScore: score,
          sharedTags,
        }
      })
      .filter(doc => doc.matchScore > 0) // Only include documents with some match
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by score descending
      .slice(0, limit) // Take top N

    return NextResponse.json({
      data: scored,
      sourceInfo: {
        id: sourceId,
        tags: sourceTags,
        category: sourceCategory,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
