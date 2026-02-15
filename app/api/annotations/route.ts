import { NextResponse } from 'next/server'

// Lightweight annotations API using Supabase REST via env vars (SUPABASE_URL, SUPABASE_KEY)
// If project has a Supabase client utility, replace fetch with that.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const TABLE = 'annotations'

async function supabaseFetch(path: string, opts: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase env not configured: SUPABASE_URL/SUPABASE_KEY')
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const document_id = searchParams.get('document_id')
    const user_id = searchParams.get('user_id')

    let url = `${TABLE}?select=*`
    if (document_id) url += `&document_id=eq.${document_id}`
    if (user_id) url += `&user_id=eq.${user_id}`

    const res = await supabaseFetch(url, { method: 'GET' })
    const data = await res.json()
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Validation (simple)
    if (!body || !body.type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const res = await supabaseFetch(TABLE, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json({ data: data[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    if (!body || !body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const id = body.id
    delete body.id

    const res = await supabaseFetch(`${TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json({ data: data[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const res = await supabaseFetch(`${TABLE}?id=eq.${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
