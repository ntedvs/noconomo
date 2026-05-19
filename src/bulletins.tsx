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
import { BulletinContent } from "./bulletin-content"
import { useTitle } from "./use-title"

type BulletinFormat = "plain" | "markdown"

export default function Bulletins() {
  useTitle("Bulletin Board · Edit")
  const { token, user } = useAuth()
  const bulletins = useQuery(api.bulletins.list, token ? { token } : "skip")
  const add = useMutation(api.bulletins.add)
  const update = useMutation(api.bulletins.update)
  const remove = useMutation(api.bulletins.remove)

  const [draft, setDraft] = useState("")
  const [draftFormat, setDraftFormat] = useState<BulletinFormat>("plain")
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState<Id<"bulletins"> | null>(null)

  if (!user) return null

  async function onPost(e: React.FormEvent) {
    e.preventDefault()
    const content = draft.trim()
    if (!content) return
    setPosting(true)
    try {
      await add({ token, content, format: draftFormat })
      setDraft("")
      setDraftFormat("plain")
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
                format={b.format ?? "plain"}
                editing={editingId === b._id}
                onStartEdit={() => setEditingId(b._id)}
                onCancel={() => setEditingId(null)}
                onSave={async (content, format) => {
                  await update({ token, id: b._id, content, format })
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
          <FormatToggle value={draftFormat} onChange={setDraftFormat} />
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
  format,
  editing,
  onStartEdit,
  onCancel,
  onSave,
  onRemove,
}: {
  content: string
  format: BulletinFormat
  editing: boolean
  onStartEdit: () => void
  onCancel: () => void
  onSave: (content: string, format: BulletinFormat) => Promise<unknown>
  onRemove: () => Promise<unknown>
}) {
  const [value, setValue] = useState(content)
  const [valueFormat, setValueFormat] = useState<BulletinFormat>(format)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      setValue(content)
      setValueFormat(format)
      ref.current?.focus()
    }
  }, [editing, content, format])

  async function save() {
    const next = value.trim()
    if (!next || (next === content && valueFormat === format)) {
      onCancel()
      return
    }
    setBusy(true)
    try {
      await onSave(next, valueFormat)
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
        <div className="mt-3">
          <FormatToggle value={valueFormat} onChange={setValueFormat} />
        </div>
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
      <div className="flex-1">
        <BulletinContent content={content} format={format} />
      </div>
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

function FormatToggle({
  value,
  onChange,
}: {
  value: BulletinFormat
  onChange: (next: BulletinFormat) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-start gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={value === "markdown"}
          onChange={(e) => onChange(e.target.checked ? "markdown" : "plain")}
          className="mt-0.5 h-4 w-4 accent-sage"
        />
        <span>
          Format as Markdown
          <span className="block text-xs text-fg-subtle">
            Optional. Lets you add{" "}
            <strong className="font-semibold">**bold**</strong>, lists,
            headings, links. Leave unchecked to post plain text.
          </span>
        </span>
      </label>
      {value === "markdown" && <MarkdownCheatSheet />}
    </div>
  )
}

function MarkdownCheatSheet() {
  return (
    <details className="ml-6 rounded-md border border-border bg-bg-subtle/60 text-sm">
      <summary className="cursor-pointer px-3 py-2 text-fg-muted hover:text-brown">
        Markdown cheat sheet
      </summary>
      <div className="space-y-3 border-t border-border px-3 py-3">
        <CheatBlock
          code={`# H1
## H2
### H3`}
        />
        <CheatBlock
          code={`**bold**   *italic*   ~~strike~~   \`code\`
[link text](https://example.com)`}
        />
        <CheatBlock
          code={`- bulleted item
- another item
  - nested item

1. ordered item
2. another item`}
        />
        <CheatBlock
          code={`> quoted line

---`}
        />
        <CheatBlock
          code={`| Item   | Qty | Price |
| ------ | --- | ----- |
| Apples | 3   | $1.20 |
| Pears  | 2   | $0.90 |`}
        />
        <CheatBlock
          code={`| Left    | Center  | Right  |
| :------ | :-----: | -----: |
| a       | b       | c      |
| longer  | longer  | longer |`}
        />
      </div>
    </details>
  )
}

function CheatBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded bg-paper px-3 py-2 font-mono text-sm text-fg">
      {code}
    </pre>
  )
}
