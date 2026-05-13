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
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{
    done: number
    total: number
  } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const singleFile = files.length === 1 ? files[0] : null

  useEffect(() => {
    if (!singleFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(singleFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [singleFile])

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
    if (files.length === 0) return
    setErr(null)
    setUploading(true)
    setProgress({ done: 0, total: files.length })
    try {
      const useTitle =
        files.length === 1 ? title.trim() || undefined : undefined
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const isVid = f.type.startsWith("video/")
        let posterStorageId: Id<"_storage"> | undefined
        if (isVid) {
          try {
            const poster = await generateVideoPoster(f)
            posterStorageId = await uploadBlob(poster, "image/jpeg")
          } catch (e) {
            console.warn("Poster generation failed", e)
          }
        }
        const storageId = await uploadBlob(f, f.type)
        await addImage({
          token,
          storageId,
          title: useTitle,
          contentType: f.type || undefined,
          posterStorageId,
          ...(folderId ? { folderId } : {}),
        })
        setProgress({ done: i + 1, total: files.length })
      }
      onUploaded()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  const isVid = singleFile?.type.startsWith("video/") ?? false

  return (
    <Modal title="Upload" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="File">
          <label
            className={[
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-paper/60 px-4 py-10 text-center transition",
              files.length > 0
                ? "border-border-strong"
                : "border-border-strong hover:border-sage hover:bg-sage-soft",
            ].join(" ")}
          >
            {singleFile && previewUrl && !isVid ? (
              <img
                src={previewUrl}
                alt=""
                className="max-h-40 rounded-md object-contain"
              />
            ) : singleFile && previewUrl && isVid ? (
              <video
                src={previewUrl}
                muted
                className="max-h-40 rounded-md object-contain"
              />
            ) : files.length > 1 ? (
              <>
                <CloudArrowUp
                  size={28}
                  weight="light"
                  className="text-fg-subtle"
                />
                <span className="text-sm text-fg-muted">
                  {files.length} files selected
                </span>
              </>
            ) : (
              <>
                <CloudArrowUp
                  size={28}
                  weight="light"
                  className="text-fg-subtle"
                />
                <span className="text-sm text-fg-muted">
                  Choose photos or videos
                </span>
                <span className="text-xs text-fg-subtle">
                  JPG · PNG · MP4 · MOV
                </span>
              </>
            )}
            {singleFile && (
              <span className="truncate text-xs text-fg-muted">
                {singleFile.name}
              </span>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              required
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </Field>

        {files.length <= 1 && (
          <Field label="Title (optional)">
            <input
              type="text"
              placeholder="A name for this photo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>
        )}

        <ErrorMsg>{err}</ErrorMsg>

        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={files.length === 0 || uploading}
            className={btnPrimary}
          >
            <UploadSimple size={16} />
            {uploading
              ? progress
                ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
                : "Uploading…"
              : "Upload"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
