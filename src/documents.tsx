import {
  FilePlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
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

export default function Documents() {
  useTitle("Documents")
  const { token, user } = useAuth()
  const items = useQuery(api.documents.list, { token })
  const removeDoc = useMutation(api.documents.remove)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocItem | null>(null)
  const [renaming, setRenaming] = useState<DocItem | null>(null)

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents</h2>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1 rounded border px-3 py-1 hover:bg-gray-50"
        >
          <UploadSimpleIcon weight="bold" />
          Upload
        </button>
      </header>

      {items === undefined ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No documents yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="border px-2 py-1">File</th>
                <th className="border px-2 py-1">Uploader</th>
                <th className="border px-2 py-1">Uploaded</th>
                <th className="border px-2 py-1">Notes</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(items as DocItem[]).map((d) => {
                const canEdit = user?._id === d.uploadedBy
                return (
                  <tr key={d._id} className="align-top">
                    <td className="border px-2 py-1 font-medium">
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {d.title}
                        </a>
                      ) : (
                        d.title
                      )}
                    </td>
                    <td className="border px-2 py-1">{d.uploaderName}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      {format(new Date(d._creationTime), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="border px-2 py-1">{d.notes ?? ""}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      {canEdit && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setRenaming(d)}
                            className="rounded p-1 hover:bg-gray-100"
                            aria-label="Rename"
                          >
                            <PencilSimpleIcon />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(d)}
                            className="rounded p-1 hover:bg-gray-100"
                            aria-label="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
          title="Delete this document?"
          message={`"${confirmDelete.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await removeDoc({ token, documentId: confirmDelete._id })
            setConfirmDelete(null)
          }}
        />
      )}
    </div>
  )
}

function useEscape(onEscape: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onEscape])
}

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
  useEscape(() => {
    if (!busy) onCancel()
  })
  const run = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded px-3 py-1 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={run}
            disabled={busy}
            className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function RenameModal({ doc, onClose }: { doc: DocItem; onClose: () => void }) {
  const { token } = useAuth()
  const update = useMutation(api.documents.update)
  const [title, setTitle] = useState(doc.title)
  const [notes, setNotes] = useState(doc.notes ?? "")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEscape(onClose)

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Edit document</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1"
          >
            <XIcon weight="bold" />
          </button>
        </div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border px-2 py-1"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="mt-2 w-full rounded border px-2 py-1"
        />
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}

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
  useEscape(onClose)

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Upload document</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1"
          >
            <XIcon weight="bold" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded border px-2 py-1"
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded border px-2 py-1"
          />
          <label className="flex items-center gap-2">
            <span className="inline-flex cursor-pointer items-center gap-1 rounded border px-3 py-1 hover:bg-gray-50">
              <FilePlusIcon weight="bold" />
              {file ? "Change file" : "Choose file"}
            </span>
            <span
              className={`truncate text-sm ${file ? "text-gray-800" : "text-gray-500"}`}
            >
              {file ? file.name : "No file chosen"}
            </span>
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setFile(f)
                if (f && !title.trim()) {
                  setTitle(f.name.replace(/\.[^.]+$/, ""))
                }
              }}
              required
              className="hidden"
            />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !title.trim() || uploading}
              className="inline-flex items-center gap-1 rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
            >
              <UploadSimpleIcon weight="bold" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
