import { useMutation } from "convex/react"
import { useState } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { ConfirmModal, ErrorMsg, Field, Modal } from "./gallery-modal"
import {
  btnPrimary,
  btnSecondary,
  inputCls,
  type FolderRow,
  type Media,
} from "./gallery-shared"

export function RenameModal({
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

export function NewFolderModal({
  parentFolderId,
  onClose,
}: {
  parentFolderId?: Id<"folders">
  onClose: () => void
}) {
  const { token } = useAuth()
  const create = useMutation(api.folders.create)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await create({
        token,
        name,
        ...(parentFolderId ? { parentFolderId } : {}),
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="New folder" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className={inputCls}
            required
          />
        </Field>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className={btnPrimary}
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

export function RenameFolderModal({
  folder,
  onClose,
}: {
  folder: FolderRow
  onClose: () => void
}) {
  const { token } = useAuth()
  const rename = useMutation(api.folders.rename)
  const [name, setName] = useState(folder.name)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await rename({ token, folderId: folder._id, name })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Rename folder" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            required
          />
        </Field>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className={btnPrimary}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

export function DeleteFolderModal({
  folder,
  onClose,
}: {
  folder: FolderRow
  onClose: () => void
}) {
  const { token } = useAuth()
  const remove = useMutation(api.folders.remove)
  return (
    <ConfirmModal
      title="Delete this folder?"
      message={`"${folder.name}" will be deleted. Its contents will be moved up one level.`}
      confirmLabel="Delete folder"
      onCancel={onClose}
      onConfirm={async () => {
        await remove({ token, folderId: folder._id })
        onClose()
      }}
    />
  )
}
