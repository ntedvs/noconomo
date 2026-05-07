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
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header>
        <p className="mb-3 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
          Bulletin Board · Edit
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Add or edit notes.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-neutral-500">
          Post a new note, or edit and remove existing ones.
        </p>
      </header>

      <section className="mt-10 border-l border-[var(--color-border-strong)] pl-6">
        {bulletins === undefined ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : bulletins.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing posted yet.</p>
        ) : (
          <ul className="space-y-4">
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

      <section className="mt-12">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
          Post a note
        </p>
        <form onSubmit={onPost} className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Stuff we should know…"
            className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[15px] leading-relaxed"
          />
          <div className="flex items-center justify-between text-[13px] text-neutral-500">
            <span>Posted as {user.name || user.email}.</span>
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="rounded-[var(--radius-md)] bg-black px-4 py-2 text-[13px] font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </section>

      <div className="mt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-neutral-500 uppercase hover:text-neutral-900"
        >
          <ArrowLeftIcon size={12} weight="bold" />
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
      <li>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[15px] leading-relaxed"
        />
        <div className="mt-2 flex items-center gap-3 text-[13px]">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-[var(--radius-md)] bg-black px-3 py-1.5 font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group relative flex items-start gap-3">
      <span
        aria-hidden
        className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-neutral-400"
      />
      <p className="flex-1 text-[15px] leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
      <span className="flex shrink-0 items-center gap-1 text-neutral-400">
        <button
          type="button"
          onClick={onStartEdit}
          aria-label="Edit"
          className="rounded-[var(--radius-xs)] p-1.5 hover:bg-[var(--color-bg-muted)] hover:text-neutral-900"
        >
          <PencilSimpleIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Delete this note?")) onRemove()
          }}
          aria-label="Delete"
          className="rounded-[var(--radius-xs)] p-1.5 hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-danger)]"
        >
          <TrashIcon size={16} />
        </button>
      </span>
    </li>
  )
}
