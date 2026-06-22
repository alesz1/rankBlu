const DB_NAME = 'public-rank-photos'
const STORE_NAME = 'seller-photos'
const DB_VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error('Erro ao abrir banco de fotos.'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function getAllSellerPhotos(): Promise<Record<string, string>> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    const keysRequest = store.getAllKeys()

    request.onerror = () => reject(request.error ?? new Error('Erro ao ler fotos.'))
    keysRequest.onerror = () => reject(keysRequest.error ?? new Error('Erro ao ler fotos.'))

    transaction.oncomplete = () => {
      const photos: Record<string, string> = {}
      const keys = keysRequest.result as string[]
      const values = request.result as string[]

      keys.forEach((key, index) => {
        if (values[index]) photos[key] = values[index]
      })

      resolve(photos)
    }
  })
}

export async function setSellerPhoto(sellerId: string, dataUrl: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(dataUrl, sellerId)

    request.onerror = () => reject(request.error ?? new Error('Erro ao salvar foto.'))
    transaction.oncomplete = () => resolve()
  })
}

export async function removeSellerPhoto(sellerId: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(sellerId)

    request.onerror = () => reject(request.error ?? new Error('Erro ao remover foto.'))
    transaction.oncomplete = () => resolve()
  })
}

export async function compressImage(file: File, maxSize = 320): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Não foi possível processar a imagem.')
  }

  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Erro ao ler arquivo.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Imagem inválida.'))
    image.src = src
  })
}
