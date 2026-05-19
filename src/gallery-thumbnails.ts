export async function generateImageThumbnail(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  })
  try {
    const maxSize = 640
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context unavailable")
    ctx.drawImage(bitmap, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.78,
      ),
    )
  } finally {
    bitmap.close()
  }
}
