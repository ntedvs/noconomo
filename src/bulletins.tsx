import {
  ArrowLeftIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

export default function Bulletins() {
  useTitle("Bulletin Board · Edit")
  const { token, user } = useAuth()
  const bulletins = useQuery(api.bulletins.list, token ? { token } : "skip")
  const add = useMutation(api.bulletins.add)
  const update = useMutation(api.bulletins.update)
  const remove = useMutation(api.bulletins.remove)

  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState<Id<"bulletins"> | null>(null)

  if (!user) return null

  async function onPost(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setPosting(true)
    try {
      await add({ token, content })
      setDraft("")
    } finally {
      setPosting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Add or edit notes</h1>
      </header>

      <section className="mt-12">
        {bulletins === undefined ? (
          <p className="text-center text-sm text-fg-subtle">Loading…</p>
        ) : bulletins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center">
            <p className="font-display text-lg text-brown">
              Nothing posted yet
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {bulletins.map((b) => (
              <BulletinItem
                key={b._id}
                content={b.content}
                editing={editingId === b._id}
                onStartEdit={() => setEditingId(b._id)}
                onCancel={() => setEditingId(null)}
                onSave={async (content) => {
                  await update({ token, id: b._id, content })
                  setEditingId(null)
                }}
                onRemove={() => remove({ token, id: b._id })}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-md border border-border bg-paper p-5 shadow-[0_1px_0_rgba(89,74,66,0.04)]">
        <h2 className="font-display text-xl text-brown">Post a note</h2>
        <form onSubmit={onPost} className="mt-4 flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Stuff we should know…"
            className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-base"
          />
          <div className="flex items-center justify-between text-sm text-fg-muted">
            <span>Posted as {user.name || user.email}.</span>
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </section>

      <div className="mt-10 flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brown"
        >
          <ArrowLeftIcon size={14} weight="bold" />
          Back to board
        </Link>
      </div>
    </main>
  )
}

function BulletinItem({
  content,
  editing,
  onStartEdit,
  onCancel,
  onSave,
  onRemove,
}: {
  content: string
  editing: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSave: (content: string) => Promise<unknown>
  onRemove: () => Promise<unknown>
}) {
  const [value, setValue] = useState(content)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      setValue(content)
      ref.current?.focus()
    }
  }, [editing, content])

  async function save() {
    const next = value.trim()
    if (!next || next === content) {
      onCancel()
      return
    }
    setBusy(true)
    try {
      await onSave(next)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <li className="rounded-md border border-sage bg-paper p-4 shadow-[0_4px_16px_-8px_rgba(120,145,109,0.35)]">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-base"
        />
        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-full bg-sage px-4 py-1.5 font-semibold text-white hover:bg-sage-hover disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-fg-muted hover:text-brown"
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group flex items-start gap-3 rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]">
      <p className="flex-1 text-base whitespace-pre-wrap text-fg">{content}</p>
      <span className="flex shrink-0 items-center gap-1 text-fg-subtle opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onStartEdit}
          aria-label="Edit"
          className="rounded-full p-1.5 hover:bg-bg-muted hover:text-brown"
        >
          <PencilSimpleIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this note?")) onRemove()
          }}
          aria-label="Delete"
          className="rounded-full p-1.5 hover:bg-bg-muted hover:text-danger"
        >
          <TrashIcon size={16} />
        </button>
      </span>
    </li>
  )
}
