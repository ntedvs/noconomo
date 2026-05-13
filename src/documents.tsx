import {
  CaretRight,
  CloudArrowUp,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FileXls,
  File as FileIcon,
  Folder,
  FolderPlus,
  PencilSimple,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import {
  DeleteFolderModal,
  NewFolderModal,
  RenameFolderModal,
} from "./gallery-modals"
import type { FolderRow } from "./gallery-shared"
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
  folderId?: Id<"folders">
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
  const params = useParams<{ folderId?: string }>()
  const navigate = useNavigate()
  const folderId = params.folderId as Id<"folders"> | undefined

  const items = useQuery(api.documents.list, { token })
  const folders = useQuery(api.folders.list, { token, kind: "documents" })
  const removeDoc = useMutation(api.documents.remove)
  const moveDoc = useMutation(api.documents.moveToFolder)
  const [dropTarget, setDropTarget] = useState<Id<"folders"> | "root" | null>(
    null,
  )
  const [draggingId, setDraggingId] = useState<Id<"documents"> | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocItem | null>(null)
  const [renaming, setRenaming] = useState<DocItem | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<FolderRow | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<FolderRow | null>(null)

  const allFolders = (folders ?? []) as FolderRow[]
  const allItems = (items ?? []) as DocItem[]

  const currentFolder = folderId
    ? allFolders.find((f) => f._id === folderId)
    : undefined

  useEffect(() => {
    if (folderId && folders !== undefined && !currentFolder) {
      navigate("/documents", { replace: true })
    }
  }, [folderId, folders, currentFolder, navigate])

  const childFolders = useMemo(
    () =>
      allFolders
        .filter((f) => (f.parentFolderId ?? null) === (folderId ?? null))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allFolders, folderId],
  )

  const childItems = useMemo(
    () => allItems.filter((d) => (d.folderId ?? null) === (folderId ?? null)),
    [allItems, folderId],
  )

  const breadcrumbs = useMemo(() => {
    const chain: FolderRow[] = []
    let cursor: Id<"folders"> | undefined = folderId
    const byId = new Map(allFolders.map((f) => [f._id, f]))
    while (cursor) {
      const f = byId.get(cursor)
      if (!f) break
      chain.unshift(f)
      cursor = f.parentFolderId
    }
    return chain
  }, [allFolders, folderId])

  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetFolderId: Id<"folders"> | null,
  ) => {
    e.preventDefault()
    setDropTarget(null)
    const docId = e.dataTransfer.getData("application/x-doc-id") as
      | Id<"documents">
      | ""
    if (!docId) return
    const doc = allItems.find((d) => d._id === docId)
    if (!doc) return
    if ((doc.folderId ?? null) === targetFolderId) return
    try {
      await moveDoc({ token, documentId: docId, folderId: targetFolderId })
    } catch {
      // surface via existing error UX would be nice; silent for now
    }
  }

  const loading = items === undefined || folders === undefined
  const empty = !loading && childFolders.length === 0 && childItems.length === 0

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Documents</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setNewFolderOpen(true)}
            className={btnSecondary}
          >
            <FolderPlus size={16} weight="bold" /> New folder
          </button>
          <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
            <UploadSimple size={16} weight="bold" /> Upload
          </button>
        </div>
      </header>

      {(breadcrumbs.length > 0 || folderId) && (
        <nav className="mt-8 flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
          <Link
            to="/documents"
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes("application/x-doc-id"))
                return
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              if (dropTarget !== "root") setDropTarget("root")
            }}
            onDragLeave={() => {
              if (dropTarget === "root") setDropTarget(null)
            }}
            onDrop={(e) => handleDropOnFolder(e, null)}
            className={`rounded px-1 hover:text-brown ${
              dropTarget === "root" ? "bg-sage-soft text-brown" : ""
            }`}
          >
            Documents
          </Link>
          {breadcrumbs.map((f, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={f._id} className="flex items-center gap-1.5">
                <CaretRight size={12} className="text-border-strong" />
                {isLast ? (
                  <span className="font-semibold text-brown">{f.name}</span>
                ) : (
                  <Link
                    to={`/documents/${f._id}`}
                    onDragOver={(e) => {
                      if (
                        !e.dataTransfer.types.includes("application/x-doc-id")
                      )
                        return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      if (dropTarget !== f._id) setDropTarget(f._id)
                    }}
                    onDragLeave={() => {
                      if (dropTarget === f._id) setDropTarget(null)
                    }}
                    onDrop={(e) => handleDropOnFolder(e, f._id)}
                    className={`rounded px-1 hover:text-brown ${
                      dropTarget === f._id ? "bg-sage-soft text-brown" : ""
                    }`}
                  >
                    {f.name}
                  </Link>
                )}
              </span>
            )
          })}
        </nav>
      )}

      <section className="mt-8">
        {loading ? (
          <ListSkeleton />
        ) : empty ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center transition hover:border-sage hover:bg-paper"
          >
            <CloudArrowUp size={28} weight="light" className="text-fg-subtle" />
            <div>
              <p className="font-display text-lg text-brown">
                {folderId ? "This folder is empty" : "No documents yet"}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Click to upload your first file.
              </p>
            </div>
          </button>
        ) : (
          <ul className="space-y-3">
            {childFolders.map((f) => {
              const canEditFolder =
                user?._id === f.createdBy || user?.admin === true
              return (
                <li
                  key={f._id}
                  onDragOver={(e) => {
                    if (
                      !e.dataTransfer.types.includes("application/x-doc-id")
                    )
                      return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                    if (dropTarget !== f._id) setDropTarget(f._id)
                  }}
                  onDragLeave={() => {
                    if (dropTarget === f._id) setDropTarget(null)
                  }}
                  onDrop={(e) => handleDropOnFolder(e, f._id)}
                  className={`group relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-md border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)] ${
                    dropTarget === f._id
                      ? "border-sage ring-2 ring-sage/40"
                      : "border-border"
                  }`}
                >
                  <Link
                    to={`/documents/${f._id}`}
                    aria-label={`Open ${f.name}`}
                    className="absolute inset-0 z-0"
                  />
                  <span className="pointer-events-none relative grid h-10 w-10 place-items-center rounded-md border border-border bg-sage-soft/60 text-sage">
                    <Folder size={20} weight="duotone" />
                  </span>
                  <div className="pointer-events-none relative min-w-0">
                    <div className="truncate text-base font-semibold text-brown">
                      {f.name}
                    </div>
                    <div className="text-sm text-fg-muted">Folder</div>
                  </div>
                  {canEditFolder && (
                    <div className="relative z-10 flex items-center gap-1 opacity-100 transition focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => setRenamingFolder(f)}
                        aria-label="Rename folder"
                        className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-brown"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingFolder(f)}
                        aria-label="Delete folder"
                        className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-danger"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
            {childItems.map((d) => {
              const canEdit = user?._id === d.uploadedBy || user?.admin === true
              const Icon = iconFor(d)
              const ext = fileExt(d.fileName)
              return (
                <li
                  key={d._id}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    if (!canEdit) {
                      e.preventDefault()
                      return
                    }
                    e.dataTransfer.effectAllowed = "move"
                    e.dataTransfer.setData("application/x-doc-id", d._id)
                    setDraggingId(d._id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={`group relative grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)] ${
                    canEdit ? "cursor-grab active:cursor-grabbing" : ""
                  } ${draggingId === d._id ? "opacity-50" : ""}`}
                >
                  {d.url && (
                    <a
                      href={d.url}
                      download={d.fileName ?? d.title}
                      aria-label={`Download ${d.title}`}
                      draggable={false}
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
          folderId={folderId}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => setUploadOpen(false)}
        />
      )}

      {newFolderOpen && (
        <NewFolderModal
          parentFolderId={folderId}
          kind="documents"
          onClose={() => setNewFolderOpen(false)}
        />
      )}

      {renamingFolder && (
        <RenameFolderModal
          folder={renamingFolder}
          onClose={() => setRenamingFolder(null)}
        />
      )}

      {deletingFolder && (
        <DeleteFolderModal
          folder={deletingFolder}
          onClose={() => setDeletingFolder(null)}
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
  folderId,
  onClose,
  onUploaded,
}: {
  folderId?: Id<"folders">
  onClose: () => void
  onUploaded: () => void
}) {
  const { token } = useAuth()
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
  const addDoc = useMutation(api.documents.add)
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{
    done: number
    total: number
  } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const singleFile = files.length === 1 ? files[0] : null

  const pickFiles = (fs: File[]) => {
    setFiles(fs)
    if (fs.length === 1 && !title.trim()) {
      setTitle(fs[0].name.replace(/\.[^.]+$/, ""))
    }
    if (fs.length !== 1) {
      setTitle("")
      setNotes("")
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    if (files.length === 1 && !title.trim()) {
      setErr("Title required")
      return
    }
    setErr(null)
    setUploading(true)
    setProgress({ done: 0, total: files.length })
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const url = await generateUploadUrl({ token })
        const res = await fetch(url, {
          method: "POST",
          headers: f.type ? { "Content-Type": f.type } : undefined,
          body: f,
        })
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
        const { storageId } = (await res.json()) as { storageId: string }
        const itemTitle =
          files.length === 1
            ? title.trim()
            : f.name.replace(/\.[^.]+$/, "") || f.name
        const itemNotes =
          files.length === 1 ? notes.trim() || undefined : undefined
        await addDoc({
          token,
          storageId: storageId as Id<"_storage">,
          title: itemTitle,
          contentType: f.type || undefined,
          fileName: f.name,
          size: f.size,
          notes: itemNotes,
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
            const fs = Array.from(e.dataTransfer.files ?? [])
            if (fs.length > 0) pickFiles(fs)
          }}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition",
            dragging
              ? "border-sage bg-sage-soft/40"
              : "border-border-strong bg-bg-subtle hover:border-sage hover:bg-paper",
          ].join(" ")}
        >
          <CloudArrowUp size={24} weight="light" className="text-fg-subtle" />
          {singleFile ? (
            <>
              <div className="text-sm font-semibold text-brown">
                {singleFile.name}
              </div>
              <div className="text-xs text-fg-muted tabular-nums">
                {formatBytes(singleFile.size)}
              </div>
              <div className="mt-1 text-xs text-fg-subtle">
                Click to choose a different file
              </div>
            </>
          ) : files.length > 1 ? (
            <>
              <div className="text-sm font-semibold text-brown">
                {files.length} files selected
              </div>
              <div className="mt-1 text-xs text-fg-subtle">
                Click to choose different files
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-brown">
                Drop files here or click to browse
              </div>
              <div className="text-xs text-fg-muted">Any file type</div>
            </>
          )}
          <input
            type="file"
            multiple
            onChange={(e) => pickFiles(Array.from(e.target.files ?? []))}
            className="hidden"
          />
        </label>

        {files.length <= 1 && (
          <>
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
          </>
        )}

        <ErrorMsg>{err}</ErrorMsg>

        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              files.length === 0 ||
              (files.length === 1 && !title.trim()) ||
              uploading
            }
            className={btnPrimary}
          >
            <UploadSimple size={16} weight="bold" />
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
