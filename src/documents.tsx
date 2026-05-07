import {
  CloudArrowUp,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FileXls,
  File as FileIcon,
  PencilSimple,
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

type DocItem = {
  _id: Id<"documents">
  url: string | null
  title: string
  fileName?: string
  contentType?: string
  size?: number
  notes?: string
  uploadedBy: Id<"users">
  uploaderName: string
  _creationTime: number
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm"
const labelCls =
  "text-[11px] font-medium tracking-tight text-neutral-600 uppercase"
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-[13px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-black"

function formatBytes(n?: number): string {
  if (n === undefined || n === null) return ""
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function fileExt(name?: string) {
  if (!name) return ""
  const m = /\.([^.]+)$/.exec(name)
  return m ? m[1].toLowerCase() : ""
}

function iconFor(d: DocItem) {
  const ct = d.contentType ?? ""
  const ext = fileExt(d.fileName)
  if (ct.startsWith("image/")) return FileImage
  if (ct.startsWith("video/")) return FileVideo
  if (ct.startsWith("audio/")) return FileAudio
  if (ct === "application/pdf" || ext === "pdf") return FileText
  if (["doc", "docx", "rtf", "txt", "md"].includes(ext)) return FileText
  if (["xls", "xlsx", "csv", "tsv"].includes(ext)) return FileXls
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return FileArchive
  return FileIcon
}

export default function Documents() {
  useTitle("Documents")
  const { token, user } = useAuth()
  const items = useQuery(api.documents.list, { token })
  const removeDoc = useMutation(api.documents.remove)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocItem | null>(null)
  const [renaming, setRenaming] = useState<DocItem | null>(null)

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            Files
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Documents
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            {items === undefined ? (
              "Loading…"
            ) : (
              <>
                <span className="text-neutral-700">{items.length}</span>{" "}
                document{items.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>

        <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
          <UploadSimple size={14} /> Upload
        </button>
      </header>

      {/* List */}
      {items === undefined ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <button
          onClick={() => setUploadOpen(true)}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-16 text-center transition-colors hover:border-neutral-400 hover:bg-white"
        >
          <CloudArrowUp size={28} weight="light" className="text-neutral-400" />
          <div>
            <div className="text-[14px] font-medium text-neutral-800">
              No documents yet
            </div>
            <div className="mt-1 text-[12px] text-neutral-500">
              Click to upload your first file.
            </div>
          </div>
        </button>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          {(items as DocItem[]).map((d, i) => {
            const canEdit = user?._id === d.uploadedBy
            const Icon = iconFor(d)
            const ext = fileExt(d.fileName)
            return (
              <li
                key={d._id}
                className={[
                  "group relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-bg-subtle)]",
                  i > 0 ? "border-t border-[var(--color-border)]" : "",
                ].join(" ")}
              >
                {d.url && (
                  <a
                    href={d.url}
                    download={d.fileName ?? d.title}
                    aria-label={`Download ${d.title}`}
                    className="absolute inset-0 z-0"
                  />
                )}

                <span className="pointer-events-none relative grid h-10 w-10 place-items-center rounded-md border border-[var(--color-border)] bg-white text-neutral-600">
                  <Icon size={18} weight="light" />
                </span>

                <div className="pointer-events-none relative min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-black">
                      {d.title}
                    </span>
                    {ext && (
                      <span className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
                        {ext}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px] text-neutral-500">
                    {d.uploaderName}
                    <span className="mx-1.5 text-neutral-300">·</span>
                    <span>
                      {format(new Date(d._creationTime), "MMM d, yyyy")}
                    </span>
                  </div>
                  {d.notes && (
                    <div className="mt-1 truncate text-[12px] text-neutral-600">
                      {d.notes}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="relative z-10 flex items-center gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      onClick={() => setRenaming(d)}
                      aria-label="Edit"
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(d)}
                      aria-label="Delete"
                      className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={() => setUploadOpen(false)}
        />
      )}

      {renaming && (
        <RenameModal doc={renaming} onClose={() => setRenaming(null)} />
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete document?"
          message={`"${confirmDelete.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await removeDoc({ token, documentId: confirmDelete._id })
            setConfirmDelete(null)
          }}
        />
      )}
    </main>
  )
}

function ListSkeleton() {
  return (
    <ul className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className={`grid grid-cols-[40px_1fr] items-center gap-4 px-4 py-3 ${
            i > 0 ? "border-t border-[var(--color-border)]" : ""
          }`}
        >
          <span className="h-10 w-10 animate-pulse rounded-md bg-neutral-100" />
          <div className="space-y-2">
            <span className="block h-3.5 w-1/3 animate-pulse rounded bg-neutral-100" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
          </div>
        </li>
      ))}
    </ul>
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

function RenameModal({ doc, onClose }: { doc: DocItem; onClose: () => void }) {
  const { token } = useAuth()
  const update = useMutation(api.documents.update)
  const [title, setTitle] = useState(doc.title)
  const [notes, setNotes] = useState(doc.notes ?? "")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await update({ token, documentId: doc._id, title, notes })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Edit document" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Title">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={inputCls}
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className={btnPrimary}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

/* ---------- Upload ---------- */

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: () => void
}) {
  const { token } = useAuth()
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
  const addDoc = useMutation(api.documents.add)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const pickFile = (f: File | null) => {
    setFile(f)
    if (f && !title.trim()) {
      setTitle(f.name.replace(/\.[^.]+$/, ""))
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    if (!title.trim()) {
      setErr("Title required")
      return
    }
    setErr(null)
    setUploading(true)
    try {
      const url = await generateUploadUrl({ token })
      const res = await fetch(url, {
        method: "POST",
        headers: file.type ? { "Content-Type": file.type } : undefined,
        body: file,
      })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      const { storageId } = (await res.json()) as { storageId: string }
      await addDoc({
        token,
        storageId: storageId as Id<"_storage">,
        title: title.trim(),
        contentType: file.type || undefined,
        fileName: file.name,
        size: file.size,
        notes: notes.trim() || undefined,
      })
      onUploaded()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Modal title="Upload document" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) pickFile(f)
          }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-black bg-[var(--color-bg-subtle)]"
              : "border-[var(--color-border)] bg-[var(--color-bg-subtle)] hover:border-neutral-400 hover:bg-white",
          ].join(" ")}
        >
          <CloudArrowUp size={24} weight="light" className="text-neutral-400" />
          {file ? (
            <>
              <div className="text-[13px] font-medium text-black">
                {file.name}
              </div>
              <div className="font-mono text-[11px] text-neutral-500 tabular-nums">
                {formatBytes(file.size)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Click to choose a different file
              </div>
            </>
          ) : (
            <>
              <div className="text-[13px] font-medium text-neutral-800">
                Drop file here or click to browse
              </div>
              <div className="text-[11px] text-neutral-500">Any file type</div>
            </>
          )}
          <input
            type="file"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            required
            className="hidden"
          />
        </label>

        <Field label="Title">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Notes">
          <textarea
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <ErrorMsg>{err}</ErrorMsg>

        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || !title.trim() || uploading}
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
