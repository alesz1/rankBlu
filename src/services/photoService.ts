import { getSupabase } from '../lib/supabase'
import { compressImageToBlob } from '../utils/image'

const BUCKET = 'vendedores-fotos'

interface VendedorPhotoRow {
  id: string
  foto: string | null
}

export async function getAllSellerPhotos(): Promise<Record<string, string>> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('vendedores')
    .select('id, foto')
    .not('foto', 'is', null)

  if (error) {
    throw new Error(`Erro ao carregar fotos: ${error.message}`)
  }

  const photos: Record<string, string> = {}
  for (const row of (data ?? []) as VendedorPhotoRow[]) {
    if (row.foto) photos[row.id] = row.foto
  }

  return photos
}

export async function uploadSellerPhoto(
  sellerId: string,
  file: File,
): Promise<string> {
  const supabase = getSupabase()
  const blob = await compressImageToBlob(file)
  const path = `${sellerId}.jpg`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(`Erro ao enviar foto: ${uploadError.message}`)
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('vendedores')
    .update({ foto: publicUrl })
    .eq('id', sellerId)

  if (updateError) {
    throw new Error(`Erro ao salvar URL da foto: ${updateError.message}`)
  }

  return publicUrl
}

export async function removeSellerPhoto(sellerId: string): Promise<void> {
  const supabase = getSupabase()
  const path = `${sellerId}.jpg`

  await supabase.storage.from(BUCKET).remove([path])

  const { error } = await supabase
    .from('vendedores')
    .update({ foto: null })
    .eq('id', sellerId)

  if (error) {
    throw new Error(`Erro ao remover foto: ${error.message}`)
  }
}
