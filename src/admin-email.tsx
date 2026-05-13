import { useAction, useMutation } from "convex/react"
import { useRef, useState } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

type StagedAttachment = {
  storageId: Id<"_storage">
  filename: string
  contentType?: string
  size: number
}

const MAX_TOTAL_BYTES = 25 * 1024 * 1024

export default function AdminEmail() {
  useTitle("Send email")
  const { token, user } = useAuth()
  const broadcast = useAction(api.email.broadcast)
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl)
  const [audience, setAudience] = useState<
    "all" | "shareholders" | "directors" | "boardMembers"
  >("all")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [attachments, setAttachments] = useState<StagedAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (user === undefined)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-sm text-fg-subtle">
        Loading…
      </div>
    )
  if (user === null)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-base text-fg-muted">
        You must be signed in to access admin.
      </div>
    )
  if (!user.admin)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-base text-fg-muted">
        You don't have admin access. Ask an admin to grant it.
      </div>
    )

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setErr(null)
    setUploading(true)
    try {
      const current = attachments.reduce((n, a) => n + a.size, 0)
      const incoming = Array.from(files)
      const incomingBytes = incoming.reduce((n, f) => n + f.size, 0)
      if (current + incomingBytes > MAX_TOTAL_BYTES) {
        throw new Error(
          `Attachments would exceed ${MAX_TOTAL_BYTES / 1024 / 1024} MB total.`,
        )
      }
      const uploaded: StagedAttachment[] = []
      for (const file of incoming) {
        const url = await generateUploadUrl({ token })
        const res = await fetch(url, {
          method: "POST",
          headers: file.type ? { "Content-Type": file.type } : undefined,
          body: file,
        })
        if (!res.ok) throw new Error(`Upload failed: ${file.name}`)
        const { storageId } = (await res.json()) as {
          storageId: Id<"_storage">
        }
        uploaded.push({
          storageId,
          filename: file.name,
          contentType: file.type || undefined,
          size: file.size,
        })
      }
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeAttachment(storageId: Id<"_storage">) {
    setAttachments((prev) => prev.filter((a) => a.storageId !== storageId))
  }

  async function onSend() {
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const result = await broadcast({
        token,
        subject,
        body,
        audience,
        attachments: attachments.map((a) => ({
          storageId: a.storageId,
          filename: a.filename,
          ...(a.contentType ? { contentType: a.contentType } : {}),
        })),
      })
      setMsg(`Sent to ${result.recipients} recipient(s).`)
      setSubject("")
      setBody("")
      setAttachments([])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const canSend =
    subject.trim() !== "" && body.trim() !== "" && !busy && !uploading

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Send email</h1>
        <p className="mt-3 text-sm text-fg-muted">
          Sends to the group address with the selected recipients on CC.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Recipients</span>
          <select
            value={audience}
            onChange={(e) =>
              setAudience(
                e.target.value as
                  | "all"
                  | "shareholders"
                  | "directors"
                  | "boardMembers",
              )
            }
            className="rounded-md border border-border bg-bg px-3 py-2 text-base"
          >
            <option value="all">Everyone</option>
            <option value="shareholders">Shareholders</option>
            <option value="directors">Directors</option>
            <option value="boardMembers">Board members</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-md border border-border bg-bg px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-fg-muted">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="resize-y rounded-md border border-border bg-bg px-3 py-2 text-base"
          />
        </label>

        <div className="flex flex-col gap-2 text-sm">
          <span className="text-fg-muted">Attachments</span>
          {attachments.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {attachments.map((a) => (
                <li
                  key={a.storageId}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <span className="truncate">{a.filename}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.storageId)}
                    disabled={busy}
                    className="text-fg-muted hover:text-danger disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
              disabled={uploading || busy}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || busy}
              className="rounded-md border border-border px-4 py-1.5 text-sm text-fg-muted hover:bg-bg-muted disabled:opacity-40"
            >
              Add files
            </button>
            {uploading && <span className="text-fg-subtle">Uploading…</span>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {msg && <span className="text-sm text-sage-hover">{msg}</span>}
          {err && <span className="text-sm text-danger">{err}</span>}
          <button
            onClick={onSend}
            disabled={!canSend}
            className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </main>
  )
}
