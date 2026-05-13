import { CloudArrowUp, UploadSimple } from "@phosphor-icons/react"
import { useMutation } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { ErrorMsg, Field, Modal } from "./gallery-modal"
import { btnPrimary, btnSecondary, inputCls } from "./gallery-shared"

async function generateVideoPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement("video")
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = "auto"
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve()
      video.onerror = () => reject(new Error("Failed to load video"))
    })
    const target = Math.min(0.1, (video.duration || 0) / 2)
    if (Math.abs(video.currentTime - target) > 0.01) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error("Failed to seek video"))
        video.currentTime = target
      })
    }
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context unavailable")
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.8,
      ),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function UploadModal({
  folderId,
  onClose,
  onUploaded,
}: {
  folderId?: Id<"folders">
  onClose: () => void
  onUploaded: () => void
}) {
  const { token } = useAuth()
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)
  const addImage = useMutation(api.images.add)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const uploadBlob = async (blob: Blob, contentType: string) => {
    const url = await generateUploadUrl({ token })
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const { storageId } = (await res.json()) as { storageId: string }
    return storageId as Id<"_storage">
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setErr(null)
    setUploading(true)
    try {
      const isVid = file.type.startsWith("video/")
      let posterStorageId: Id<"_storage"> | undefined
      if (isVid) {
        try {
          const poster = await generateVideoPoster(file)
          posterStorageId = await uploadBlob(poster, "image/jpeg")
        } catch (e) {
          console.warn("Poster generation failed", e)
        }
      }
      const storageId = await uploadBlob(file, file.type)
      await addImage({
        token,
        storageId,
        title: title.trim() || undefined,
        contentType: file.type || undefined,
        posterStorageId,
        ...(folderId ? { folderId } : {}),
      })
      onUploaded()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  const isVid = file?.type.startsWith("video/") ?? false

  return (
    <Modal title="Upload" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="File">
          <label
            className={[
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-paper/60 px-4 py-10 text-center transition",
              file
                ? "border-border-strong"
                : "border-border-strong hover:border-sage hover:bg-sage-soft",
            ].join(" ")}
          >
            {previewUrl && !isVid ? (
              <img
                src={previewUrl}
                alt=""
                className="max-h-40 rounded-md object-contain"
              />
            ) : previewUrl && isVid ? (
              <video
                src={previewUrl}
                muted
                className="max-h-40 rounded-md object-contain"
              />
            ) : (
              <>
                <CloudArrowUp
                  size={28}
                  weight="light"
                  className="text-fg-subtle"
                />
                <span className="text-sm text-fg-muted">
                  Choose a photo or video
                </span>
                <span className="text-xs text-fg-subtle">
                  JPG · PNG · MP4 · MOV
                </span>
              </>
            )}
            {file && (
              <span className="truncate text-xs text-fg-muted">
                {file.name}
              </span>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </Field>

        <Field label="Title (optional)">
          <input
            type="text"
            placeholder="A name for this photo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <ErrorMsg>{err}</ErrorMsg>

        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || uploading}
            className={btnPrimary}
          >
            <UploadSimple size={16} />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
