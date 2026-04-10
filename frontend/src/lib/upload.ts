// comunikit — image upload utility
// Routes uploads through the backend (/api/upload/*) which uses the Supabase
// service_role key, bypassing Storage RLS policies that block the anon key.

import { supabase } from './supabase'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

export async function uploadImage(
  file: File,
  bucket: 'listing_images' | 'avatars',
  _folder?: string
): Promise<string> {
  // Determine the backend endpoint based on bucket
  const endpoint = bucket === 'avatars'
    ? '/api/upload/avatar'
    : '/api/upload/listing-image'

  // Get auth token for the request
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new Error('Необходимо авторизоваться для загрузки файлов')
  }

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // NOTE: do NOT set Content-Type — browser will set it with boundary for multipart
    },
    body: formData,
  })

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
