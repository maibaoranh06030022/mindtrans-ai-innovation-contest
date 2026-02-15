import { NextResponse } from 'next/server'

// User Reading History API
// Tracks: read status, saved, notes count, time spent, scroll position

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const TABLE = 'user_document_history'

async function supabaseFetch(path: string, opts: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase env not configured')
  }
  const url = `${SUPABASE_URL}/rest/v1/${path}`
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(opts.headers || {}),
  }
  return fetch(url, { ...opts, headers })
}

// GET: Get user's reading history
// Query params: user_id, document_id, status, limit
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const document_id = searchParams.get('document_id')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '50'

    let url = `${TABLE}?select=*&order=last_accessed.desc&limit=${limit}`
    
    if (user_id) url += `&user_id=eq.${user_id}`
    if (document_id) url += `&document_id=eq.${document_id}`
    if (status) url += `&status=eq.${status}`

    const res = await supabaseFetch(url, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Create or update reading history (upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 })
    }

    // Upsert: if exists, update; else insert
    const res = await supabaseFetch(TABLE, {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: body.user_id || null,
        document_id: body.document_id,
        status: body.status || 'read',
        notes_count: body.notes_count ?? 0,
        last_accessed: new Date().toISOString(),
        time_spent_seconds: body.time_spent_seconds ?? 0,
        scroll_position: body.scroll_position ?? 0,
      }),
    })

    const data = await res.json()
    return NextResponse.json({ data: Array.isArray(data) ? data[0] : data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH: Update specific fields
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { user_id, document_id, ...updates } = body

    if (!document_id) {
      return NextResponse.json({ error: 'document_id required' }, { status: 400 })
    }

    let url = `${TABLE}?document_id=eq.${document_id}`
    if (user_id) url += `&user_id=eq.${user_id}`
    else url += `&user_id=is.null`

    const res = await supabaseFetch(url, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    const data = await res.json()
    return NextResponse.json({ data: Array.isArray(data) ? data[0] : data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Remove from history
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const document_id = searchParams.get('document_id')
    const user_id = searchParams.get('user_id')

    if (!id && !document_id) {
      return NextResponse.json({ error: 'id or document_id required' }, { status: 400 })
    }

    let url = TABLE
    if (id) {
      url += `?id=eq.${id}`
    } else {
      url += `?document_id=eq.${document_id}`
      if (user_id) url += `&user_id=eq.${user_id}`
      else url += `&user_id=is.null`
    }

    const res = await supabaseFetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
