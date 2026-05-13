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
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-paper px-4 py-2 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-hover disabled:opacity-40"

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
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Documents</h1>
      </header>

      <div className="mt-8 flex justify-center">
        <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
          <UploadSimple size={16} weight="bold" /> Upload
        </button>
      </div>

      <section className="mt-10">
        {items === undefined ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center transition hover:border-sage hover:bg-paper"
          >
            <CloudArrowUp size={28} weight="light" className="text-fg-subtle" />
            <div>
              <p className="font-display text-lg text-brown">
                No documents yet
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Click to upload your first file.
              </p>
            </div>
          </button>
        ) : (
          <ul className="space-y-3">
            {(items as DocItem[]).map((d) => {
              const canEdit = user?._id === d.uploadedBy
              const Icon = iconFor(d)
              const ext = fileExt(d.fileName)
              return (
                <li
                  key={d._id}
                  className="group relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]"
                >
                  {d.url && (
                    <a
                      href={d.url}
                      download={d.fileName ?? d.title}
                      aria-label={`Download ${d.title}`}
                      className="absolute inset-0 z-0"
                    />
                  )}

                  <span className="pointer-events-none relative grid h-10 w-10 place-items-center rounded-md border border-border bg-bg-subtle text-brown">
                    <Icon size={18} weight="light" />
                  </span>

                  <div className="pointer-events-none relative min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold text-brown">
                        {d.title}
                      </span>
                      {ext && (
                        <span className="text-xs font-semibold text-fg-subtle">
                          {ext}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-fg-muted">
                      {d.uploaderName}
                      <span className="mx-1.5 text-fg-subtle">·</span>
                      <span>
                        {format(new Date(d._creationTime), "MMM d, yyyy")}
                      </span>
                    </div>
                    {d.notes && (
                      <div className="mt-1 truncate text-sm text-fg">
                        {d.notes}
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="relative z-10 flex items-center gap-1 opacity-100 transition focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => setRenaming(d)}
                        aria-label="Edit"
                        className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-brown"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(d)}
                        aria-label="Delete"
                        className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-danger"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="grid grid-cols-[40px_1fr] items-center gap-4 rounded-md border border-border bg-paper px-5 py-4"
        >
          <span className="h-10 w-10 animate-pulse rounded-md bg-bg-muted" />
          <div className="space-y-2">
            <span className="block h-3.5 w-1/3 animate-pulse rounded bg-bg-muted" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-bg-muted" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-brown/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm" ? "max-w-sm" : "max-w-md"
        } overflow-hidden rounded-lg border border-border bg-paper shadow-[0_20px_60px_-15px_rgba(89,74,66,0.35)]`}
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
      <footer className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} disabled={busy} className={btnSecondary}>
          Cancel
        </button>
        <button onClick={run} disabled={busy} className={btnDanger}>
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
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition",
            dragging
              ? "border-sage bg-sage-soft/40"
              : "border-border-strong bg-bg-subtle hover:border-sage hover:bg-paper",
          ].join(" ")}
        >
          <CloudArrowUp size={24} weight="light" className="text-fg-subtle" />
          {file ? (
            <>
              <div className="text-sm font-semibold text-brown">
                {file.name}
              </div>
              <div className="text-xs text-fg-muted tabular-nums">
                {formatBytes(file.size)}
              </div>
              <div className="mt-1 text-xs text-fg-subtle">
                Click to choose a different file
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-brown">
                Drop file here or click to browse
              </div>
              <div className="text-xs text-fg-muted">Any file type</div>
            </>
          )}
          <input
            type="file"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
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
            <UploadSimple size={16} weight="bold" />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}
