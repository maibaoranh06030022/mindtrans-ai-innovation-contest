import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || ''
    const id = url.searchParams.get('id')
    const tags = url.searchParams.getAll('tag') || []
    const limit = parseInt(url.searchParams.get('limit') || '200')

    let query = supabase.from('documents').select('*')

    // Query by ID
    if (id) {
      query = query.eq('id', parseInt(id))
      const { data, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }

    if (tags.length > 0) {
      // filter documents that contain all provided tags
      query = query.contains('tags', tags)
    }

    if (q) {
      // use OR on topic or content_vi
      query = query.or(`topic.ilike.%${q}%,content_vi.ilike.%${q}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
