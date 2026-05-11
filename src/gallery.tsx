import {
  CaretLeft,
  CaretRight,
  CloudArrowUp,
  FilmStrip,
  Image as ImageIcon,
  PencilSimple,
  Play,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { useEffect, useState, type ReactNode } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

type Media = {
  _id: Id<"images">
  url: string | null
  posterUrl: string | null
  contentType?: string
  uploadedBy: Id<"users">
  uploaderName: string
  title?: string
  _creationTime: number
}

const isVideo = (m: Media) => (m.contentType ?? "").startsWith("video/")

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-paper px-4 py-2 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"

export default function Gallery() {
  useTitle("Gallery")
  const { token, user } = useAuth()
  const items = useQuery(api.images.list, { token })
  const removeImage = useMutation(api.images.remove)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Media | null>(null)
  const [renaming, setRenaming] = useState<Media | null>(null)
  const [viewer, setViewer] = useState<{ index: number } | null>(null)

  const filtered = (items ?? []) as Media[]

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Gallery</h1>
        <div className="mt-6 flex justify-center">
          <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
            <UploadSimple size={16} /> Upload
          </button>
        </div>
      </header>

      {/* Body */}
      <section className="mt-10">
        {items === undefined ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-16 text-center transition hover:border-sage hover:bg-sage-soft"
          >
            <CloudArrowUp size={32} weight="light" className="text-fg-subtle" />
            <div>
              <p className="font-display text-lg text-brown">
                No photos or videos yet
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Click to upload your first photo.
              </p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filtered.map((m, i) => (
              <Tile
                key={m._id}
                media={m}
                canEdit={user?._id === m.uploadedBy || user?.admin === true}
                onOpen={() => setViewer({ index: i })}
                onRename={() => setRenaming(m)}
                onDelete={() => setConfirmDelete(m)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={() => setUploadOpen(false)}
        />
      )}
      {renaming && (
        <RenameModal media={renaming} onClose={() => setRenaming(null)} />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete this item?"
          message={`"${
            confirmDelete.title ?? "Untitled"
          }" will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await removeImage({ token, imageId: confirmDelete._id })
            setConfirmDelete(null)
          }}
        />
      )}
      {viewer !== null && filtered.length > 0 && (
        <Viewer
          items={filtered}
          index={Math.min(viewer.index, filtered.length - 1)}
          onIndex={(i) => setViewer({ index: i })}
          onClose={() => setViewer(null)}
        />
      )}
    </main>
  )
}

/* ---------- Tile ---------- */

function Tile({
  media,
  canEdit,
  onOpen,
  onRename,
  onDelete,
}: {
  media: Media
  canEdit: boolean
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const video = isVideo(media)
  const thumb = video ? media.posterUrl : media.url

  return (
    <figure>
      <div className="group/tile relative">
        <button
          onClick={onOpen}
          className="relative block w-full overflow-hidden rounded-md border border-border bg-bg-muted shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        >
          {thumb ? (
            <img
              src={thumb}
              alt={media.title ?? ""}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover/tile:scale-[1.025]"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center text-fg-subtle">
              <ImageIcon size={28} weight="light" />
            </div>
          )}

          {/* Video badge / play icon */}
          {video && (
            <>
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-fg/70 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                <FilmStrip size={12} /> Video
              </span>
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-fg/60 text-white shadow-lg backdrop-blur-sm">
                  <Play size={18} weight="fill" />
                </span>
              </span>
            </>
          )}
        </button>

        {/* Owner controls — pushed below video badge when present */}
        {canEdit && (
          <div
            className={[
              "absolute right-2 flex gap-1 opacity-0 transition-opacity group-hover/tile:opacity-100",
              video ? "top-10" : "top-2",
            ].join(" ")}
          >
            {!video && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                }}
                aria-label="Rename"
                className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-brown"
              >
                <PencilSimple size={14} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete"
              className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-danger"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Caption below */}
      <figcaption className="mt-2 px-0.5">
        <div className="truncate text-sm font-semibold text-brown">
          {media.title ?? <span className="text-fg-subtle">Untitled</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
          <span className="truncate">{media.uploaderName}</span>
          <span className="text-border-strong">·</span>
          <span className="tabular-nums">
            {format(new Date(media._creationTime), "MMM d, yyyy")}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}

/* ---------- Skeleton ---------- */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square w-full animate-pulse rounded-md border border-border bg-bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-bg-muted" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-bg-muted" />
        </div>
      ))}
    </div>
  )
}

/* ---------- Viewer (lightbox) ---------- */

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: Media[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const m = items[index]
  const prev = () => onIndex((index - 1 + items.length) % items.length)
  const next = () => onIndex((index + 1) % items.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length])

  const video = isVideo(m)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-fg/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="truncate font-display text-lg text-white">
            {m.title ?? "Untitled"}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
            <span>{m.uploaderName}</span>
            <span className="text-white/30">·</span>
            <span>{format(new Date(m._creationTime), "MMM d, yyyy")}</span>
            <span className="text-white/30">·</span>
            <span className="tabular-nums">
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </header>

      {/* Media stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-6"
        onClick={onClose}
      >
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous"
            className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:left-6"
          >
            <CaretLeft size={20} />
          </button>
        )}

        <div onClick={(e) => e.stopPropagation()} className="max-h-full">
          {video ? (
            m.url && (
              <video
                key={m._id}
                src={m.url}
                poster={m.posterUrl ?? undefined}
                controls
                autoPlay
                className="max-h-[78vh] max-w-full rounded-lg bg-black object-contain"
              />
            )
          ) : m.url ? (
            <img
              key={m._id}
              src={m.url}
              alt={m.title ?? ""}
              className="max-h-[78vh] max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="text-white/60">Unavailable</div>
          )}
        </div>

        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next"
            className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:right-6"
          >
            <CaretRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------- Shared modal ---------- */

function Modal({
  title,
  onClose,
  children,
  maxWidth = "md",
}: {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: "sm" | "md"
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm" ? "max-w-sm" : "max-w-md"
        } overflow-hidden rounded-lg border border-border bg-paper shadow-[0_20px_60px_-15px_rgba(89,74,66,0.3)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-xl text-brown">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-brown"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-brown">{label}</span>
      {children}
    </label>
  )
}

function ErrorMsg({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  )
}

/* ---------- Confirm ---------- */

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal title={title} onClose={() => !busy && onCancel()} maxWidth="sm">
      <p className="text-base text-fg">{message}</p>
      <footer className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className={btnSecondary}>
          Cancel
        </button>
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-hover disabled:opacity-40"
        >
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </footer>
    </Modal>
  )
}

/* ---------- Rename ---------- */

function RenameModal({
  media,
  onClose,
}: {
  media: Media
  onClose: () => void
}) {
  const { token } = useAuth()
  const setTitle = useMutation(api.images.setTitle)
  const [title, setTitleVal] = useState(media.title ?? "")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await setTitle({ token, imageId: media._id, title })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Rename" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitleVal(e.target.value)}
            placeholder="Untitled"
            className={inputCls}
          />
        </Field>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

/* ---------- Upload ---------- */

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

function UploadModal({
  onClose,
  onUploaded,
}: {
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
