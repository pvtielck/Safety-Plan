import { PHOTO_MAX_DIMENSION, PHOTO_QUALITY } from '../config/app'

/**
 * Shrinks a photo on the device and returns it as a JPEG data URL small enough for
 * localStorage (typically 50 to 150 KB).
 *
 * Re-drawing through a canvas also strips EXIF metadata, including GPS location, so a photo
 * of someone's home never carries its coordinates inside the saved plan or an exported PDF.
 */
export async function compressImage(
  file: Blob,
  maxDimension = PHOTO_MAX_DIMENSION,
  quality = PHOTO_QUALITY,
): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url)
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not available')
    // JPEG has no transparency; paint white first so transparent PNGs don't turn black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('This file could not be opened as an image'))
    image.src = src
  })
}
