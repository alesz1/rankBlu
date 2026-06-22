import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { getAvatarUrl } from '../utils/format'
import {
  getAllSellerPhotos,
  removeSellerPhoto,
  uploadSellerPhoto,
} from '../services/photoService'
import type { Seller } from '../types'

interface PhotoManagerModalProps {
  open: boolean
  sellers: Seller[]
  onClose: () => void
  onPhotosUpdated: (photos: Record<string, string>) => void
}

export function PhotoManagerModal({
  open,
  sellers,
  onClose,
  onPhotosUpdated,
}: PhotoManagerModalProps) {
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const selectedSellerRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) return

    setLoading(true)
    getAllSellerPhotos()
      .then(setPhotos)
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const filteredSellers = sellers.filter((seller) =>
    seller.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const handlePickPhoto = (sellerId: string) => {
    selectedSellerRef.current = sellerId
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const sellerId = selectedSellerRef.current

    event.target.value = ''
    selectedSellerRef.current = null

    if (!file || !sellerId) return
    if (!file.type.startsWith('image/')) {
      window.alert('Selecione um arquivo de imagem válido.')
      return
    }

    try {
      setUploadingId(sellerId)
      const publicUrl = await uploadSellerPhoto(sellerId, file)
      const nextPhotos = { ...photos, [sellerId]: publicUrl }
      setPhotos(nextPhotos)
      onPhotosUpdated(nextPhotos)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erro ao importar foto.')
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemovePhoto = async (sellerId: string) => {
    try {
      setUploadingId(sellerId)
      await removeSellerPhoto(sellerId)
      const nextPhotos = { ...photos }
      delete nextPhotos[sellerId]
      setPhotos(nextPhotos)
      onPhotosUpdated(nextPhotos)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Erro ao remover foto.')
    } finally {
      setUploadingId(null)
    }
  }

  const photosCount = Object.keys(photos).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="photo-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="photo-modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="photo-modal-header">
              <div>
                <h2>Fotos dos vendedores</h2>
                <p>Importe a foto de cada vendedor. As imagens são salvas no Supabase.</p>
              </div>
              <button className="photo-modal-close" onClick={onClose} title="Fechar">
                ✕
              </button>
            </div>

            <div className="photo-modal-toolbar">
              <input
                type="search"
                className="photo-search"
                placeholder="Buscar vendedor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className="photo-count">
                {photosCount} de {sellers.length} com foto
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            <div className="photo-modal-list">
              {loading ? (
                <div className="photo-modal-empty">Carregando fotos...</div>
              ) : filteredSellers.length === 0 ? (
                <div className="photo-modal-empty">Nenhum vendedor encontrado.</div>
              ) : (
                filteredSellers.map((seller) => {
                  const hasPhoto = Boolean(photos[seller.id])
                  const isUploading = uploadingId === seller.id

                  return (
                    <div key={seller.id} className="photo-row">
                      <img
                        src={photos[seller.id] ?? getAvatarUrl(seller.name)}
                        alt={seller.name}
                        className="photo-row-avatar"
                      />

                      <div className="photo-row-info">
                        <strong>{seller.name}</strong>
                        <span>{hasPhoto ? 'Foto personalizada' : 'Usando iniciais'}</span>
                      </div>

                      <div className="photo-row-actions">
                        <button
                          className="photo-btn primary"
                          onClick={() => handlePickPhoto(seller.id)}
                          disabled={isUploading}
                        >
                          {isUploading ? 'Salvando...' : hasPhoto ? 'Trocar foto' : 'Importar foto'}
                        </button>

                        {hasPhoto && (
                          <button
                            className="photo-btn danger"
                            onClick={() => void handleRemovePhoto(seller.id)}
                            disabled={isUploading}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
