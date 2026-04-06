import { supabase } from './supabase'

export async function uploadImage(
  file: File,
  bucket: 'listing_images' | 'avatars',
  folder?: string
): Promise<string> {
  const ext = file.name.split('.').pop()
  const filename = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename)

  return data.publicUrl
}
