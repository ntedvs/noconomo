import { useAction } from "convex/react"
import { useState } from "react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

export default function AdminEmail() {
  useTitle("Send email")
  const { token, user } = useAuth()
  const broadcast = useAction(api.email.broadcast)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

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

  async function onSend() {
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const result = await broadcast({ token, subject, body })
      setMsg(`Sent to ${result.recipients} recipient(s).`)
      setSubject("")
      setBody("")
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const canSend = subject.trim() !== "" && body.trim() !== "" && !busy

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Send email</h1>
        <p className="mt-3 text-sm text-fg-muted">
          Sends to the group address with all members on CC.
        </p>
      </header>

      <div className="mt-10 space-y-4">
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
