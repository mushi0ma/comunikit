// comunikit — image upload utility
// Routes uploads through the backend (/api/upload/*) which uses the Supabase
// service_role key, bypassing Storage RLS policies that block the anon key.

import { supabase } from './supabase'

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001")

export async function uploadImage(
  file: File,
  bucket: 'listing_images' | 'avatars',
  _folder?: string
): Promise<string> {
  // Determine the backend endpoint based on bucket
  const endpoint = bucket === 'avatars'
    ? '/api/upload/avatar'
    : '/api/upload/listing-image'

  // Get auth token for the request, refreshing if near expiry.
  let { data: { session } } = await supabase.auth.getSession()
  if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    session = refreshed.session
  }
  let token = session?.access_token
  if (!token) {
    throw new Error('Необходимо авторизоваться для загрузки файлов')
  }

  const formData = new FormData()
  formData.append('file', file)

  let res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // NOTE: do NOT set Content-Type — browser will set it with boundary for multipart
    },
    body: formData,
  })

  // Retry once on 401 — token may have expired between refresh check and request.
  if (res.status === 401) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession()
      if (refreshed.session) {
        token = refreshed.session.access_token
        res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
      }
    } catch {
      // Refresh failed — fall through to original error handling.
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body: unknown = await res.json()
      if (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string') {
        message = (body as { error: string }).error
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  const body: unknown = await res.json()

  // BFF envelope: { success, data: { url } }
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data: { url: string } }).data
    return data.url
  }

  throw new Error('Unexpected response format')
}
