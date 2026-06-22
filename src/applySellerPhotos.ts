import { getAvatarUrl } from './utils/format'
import type { Seller } from './types'

export function applyPhotosMap(sellers: Seller[], photos: Record<string, string>): Seller[] {
  return sellers.map((seller) => ({
    ...seller,
    avatar: photos[seller.id] ?? getAvatarUrl(seller.name),
  }))
}
