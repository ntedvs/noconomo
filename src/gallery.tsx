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
import { useEffect, useMemo, useState, type ReactNode } from "react"
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

type Filter = "all" | "photos" | "videos" | "mine"

const isVideo = (m: Media) => (m.contentType ?? "").startsWith("video/")

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm"
const labelCls =
  "text-[11px] font-medium tracking-tight text-neutral-600 uppercase"
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-[13px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-black"

export default function Gallery() {
  useTitle("Gallery")
  const { token, user } = useAuth()
  const items = useQuery(api.images.list, { token })
  const removeImage = useMutation(api.images.remove)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Media | null>(null)
  const [renaming, setRenaming] = useState<Media | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [viewer, setViewer] = useState<{ index: number } | null>(null)

  const filtered = useMemo<Media[]>(() => {
    if (!items) return []
    const list = items as Media[]
    return list.filter((m) => {
      if (filter === "photos") return !isVideo(m)
      if (filter === "videos") return isVideo(m)
      if (filter === "mine") return user?._id === m.uploadedBy
      return true
    })
  }, [items, filter, user])

  // Group by month, preserving the order from the API (newest first).
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Media[] }>()
    for (const m of filtered) {
      const d = new Date(m._creationTime)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`
      const label = format(d, "MMMM yyyy")
      const existing = map.get(key)
      if (existing) existing.items.push(m)
      else map.set(key, { label, items: [m] })
    }
    return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }))
  }, [filtered])

  const counts = useMemo(() => {
    if (!items) return { all: 0, photos: 0, videos: 0, mine: 0 }
    const list = items as Media[]
    return {
      all: list.length,
      photos: list.filter((m) => !isVideo(m)).length,
      videos: list.filter((m) => isVideo(m)).length,
      mine: list.filter((m) => user?._id === m.uploadedBy).length,
    }
  }, [items, user])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            Memories
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Gallery
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            {items === undefined ? (
              "Loading…"
            ) : (
              <>
                <span className="text-neutral-700">{counts.all}</span> item
                {counts.all === 1 ? "" : "s"}
                <span className="mx-1.5 text-neutral-300">·</span>
                {counts.photos} photo{counts.photos === 1 ? "" : "s"}
                <span className="mx-1.5 text-neutral-300">·</span>
                {counts.videos} video{counts.videos === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>

        <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
          <UploadSimple size={14} /> Upload
        </button>
      </header>

      {/* Filters */}
      {items !== undefined && counts.all > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-1.5">
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            count={counts.all}
          >
            All
          </FilterPill>
          <FilterPill
            active={filter === "photos"}
            onClick={() => setFilter("photos")}
            count={counts.photos}
          >
            Photos
          </FilterPill>
          <FilterPill
            active={filter === "videos"}
            onClick={() => setFilter("videos")}
            count={counts.videos}
          >
            Videos
          </FilterPill>
          <FilterPill
            active={filter === "mine"}
            onClick={() => setFilter("mine")}
            count={counts.mine}
          >
            Mine
          </FilterPill>
        </div>
      )}

      {/* Body */}
      {items === undefined ? (
        <GridSkeleton />
      ) : counts.all === 0 ? (
        <button
          onClick={() => setUploadOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-20 text-center transition-colors hover:border-neutral-400 hover:bg-white"
        >
          <CloudArrowUp size={28} weight="light" className="text-neutral-400" />
          <div>
            <div className="text-[14px] font-medium text-neutral-800">
              No photos or videos yet
            </div>
            <div className="mt-1 text-[12px] text-neutral-500">
              Click to upload your first memory.
            </div>
          </div>
        </button>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-16 text-center">
          <div className="text-[13px] text-neutral-600">
            Nothing matches this filter.
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((g) => (
            <section key={g.key}>
              <SectionHeader label={g.label} count={g.items.length} />
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {g.items.map((m) => {
                  const flatIndex = filtered.indexOf(m)
                  return (
                    <Tile
                      key={m._id}
                      media={m}
                      canEdit={user?._id === m.uploadedBy}
                      onOpen={() => setViewer({ index: flatIndex })}
                      onRename={() => setRenaming(m)}
                      onDelete={() => setConfirmDelete(m)}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

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

/* ---------- Section header ---------- */

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-mono text-[11px] tracking-widest text-neutral-700 uppercase">
        {label}
      </h2>
      <span className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
        {count} {count === 1 ? "item" : "items"}
      </span>
      <span className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  )
}

/* ---------- Filter pill ---------- */

function FilterPill({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium tracking-tight transition-colors",
        active
          ? "border-black bg-black text-white"
          : "border-[var(--color-border)] bg-white text-neutral-600 hover:border-neutral-400 hover:text-black",
      ].join(" ")}
    >
      {children}
      <span
        className={[
          "font-mono text-[10px] tabular-nums",
          active ? "text-white/70" : "text-neutral-400",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
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
    <figure className="group relative">
      <button
        onClick={onOpen}
        className="relative block w-full overflow-hidden rounded-md bg-[var(--color-bg-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={media.title ?? ""}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center text-neutral-300">
            <ImageIcon size={28} weight="light" />
          </div>
        )}

        {/* Top-left mono date stamp */}
        <span className="absolute top-2 left-2 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white/90 uppercase opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          {format(new Date(media._creationTime), "MMM d")}
        </span>

        {/* Video badge / play icon */}
        {video && (
          <>
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white/90 uppercase backdrop-blur-sm">
              <FilmStrip size={10} /> Video
            </span>
            <span className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                <Play size={18} weight="fill" />
              </span>
            </span>
          </>
        )}

        {/* Bottom gradient with title on hover */}
        {media.title && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pt-8 pb-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="block truncate text-[12px] font-medium tracking-tight text-white">
              {media.title}
            </span>
          </span>
        )}
      </button>

      {/* Owner controls — pushed below video badge when present */}
      {canEdit && (
        <div
          className={[
            "absolute right-2 hidden gap-1 group-hover:flex",
            video ? "top-9" : "top-2",
          ].join(" ")}
        >
          {!video && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
              aria-label="Rename"
              className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white hover:text-black"
            >
              <PencilSimple size={13} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            aria-label="Delete"
            className="grid h-7 w-7 place-items-center rounded-md bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white hover:text-red-600"
          >
            <Trash size={13} />
          </button>
        </div>
      )}

      {/* Caption below */}
      <figcaption className="mt-2 px-0.5">
        <div className="truncate text-[13px] font-medium tracking-tight text-black">
          {media.title ?? <span className="text-neutral-400">Untitled</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="truncate">{media.uploaderName}</span>
          <span className="text-neutral-300">·</span>
          <span className="font-mono tracking-wide tabular-nums">
            {format(new Date(media._creationTime), "MMM d, yyyy")}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}

/* Tile relative wrapper: ensure absolute children position relative to figure too */

/* ---------- Skeleton ---------- */

function GridSkeleton() {
  return (
    <div className="space-y-12">
      {[0, 1].map((s) => (
        <section key={s}>
          <div className="flex items-center gap-3">
            <span className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square w-full animate-pulse rounded-md bg-neutral-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </section>
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
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium tracking-tight">
            {m.title ?? "Untitled"}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-white/50 uppercase">
            <span>{m.uploaderName}</span>
            <span className="text-white/30">·</span>
            <span>{format(new Date(m._creationTime), "MMM d, yyyy")}</span>
            <span className="text-white/30">·</span>
            <span>
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
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
            className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white sm:left-6"
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
                className="max-h-[78vh] max-w-full rounded-md bg-black object-contain"
              />
            )
          ) : m.url ? (
            <img
              key={m._id}
              src={m.url}
              alt={m.title ?? ""}
              className="max-h-[78vh] max-w-full rounded-md object-contain"
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
            className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white sm:right-6"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm" ? "max-w-sm" : "max-w-md"
        } overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-black"
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
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

function ErrorMsg({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
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
      <p className="text-[13px] text-neutral-600">{message}</p>
      <footer className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className={btnSecondary}>
          Cancel
        </button>
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
      <form onSubmit={submit} className="flex flex-col gap-3">
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
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="File">
          <label
            className={[
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-[var(--color-bg-subtle)] px-4 py-8 text-center transition-colors",
              file
                ? "border-[var(--color-border)]"
                : "border-[var(--color-border)] hover:border-neutral-400 hover:bg-white",
            ].join(" ")}
          >
            {previewUrl && !isVid ? (
              <img
                src={previewUrl}
                alt=""
                className="max-h-40 rounded object-contain"
              />
            ) : previewUrl && isVid ? (
              <video
                src={previewUrl}
                muted
                className="max-h-40 rounded object-contain"
              />
            ) : (
              <>
                <CloudArrowUp
                  size={24}
                  weight="light"
                  className="text-neutral-400"
                />
                <span className="text-[13px] text-neutral-600">
                  Choose a photo or video
                </span>
                <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                  JPG · PNG · MP4 · MOV
                </span>
              </>
            )}
            {file && (
              <span className="truncate text-[12px] text-neutral-500">
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
            placeholder="A name for this memory"
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
            <UploadSimple size={14} />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
