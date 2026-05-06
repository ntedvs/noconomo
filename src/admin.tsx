import { ArrowDown, ArrowUp, TrashIcon } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import {
  handbookDefaults,
  type HandbookContent,
  type Officer,
  type ServiceProvider,
} from "./handbook-defaults"
import { useTitle } from "./use-title"

const emptyProvider = (): ServiceProvider => ({
  service: "",
  provider: "",
  contact: "",
  phone: "",
  email: "",
  website: "",
  account: "",
  notes: "",
})

export default function Admin() {
  useTitle("Admin")
  const { token, user } = useAuth()
  const stored = useQuery(api.handbook.get, { token })
  const save = useMutation(api.handbook.save)
  const [content, setContent] = useState<HandbookContent | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (stored === undefined) return
    if (content === null) {
      setContent(
        stored === null ? handbookDefaults : (stored as HandbookContent),
      )
    }
  }, [stored, content])

  if (user === undefined) return <div className="p-4">Loading…</div>
  if (user === null)
    return <div className="p-4">You must be signed in to access admin.</div>
  if (!user.admin)
    return (
      <div className="p-4">
        You don't have admin access. Ask an admin to grant it via the Convex
        dashboard (set <code>users.admin</code> to <code>true</code>).
      </div>
    )
  if (!content) return <div className="p-4">Loading…</div>

  async function onSave() {
    if (!content) return
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      await save({ token, ...content })
      setMsg("Saved")
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const update = (patch: Partial<HandbookContent>) =>
    setContent({ ...content, ...patch })

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold sm:text-2xl">Admin · Handbook</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
          <button
            onClick={() => setContent(handbookDefaults)}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          >
            Reset to defaults
          </button>
          <button
            onClick={onSave}
            disabled={busy}
            className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <Section title="Address">
        <input
          value={content.address}
          onChange={(e) => update({ address: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
      </Section>

      <Section title="Phone Number">
        <input
          value={content.phoneNumber}
          onChange={(e) => update({ phoneNumber: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
      </Section>

      <Section title="Officers">
        <ListEditor
          items={content.officers}
          onChange={(officers) => update({ officers })}
          newItem={(): Officer => ({ role: "", name: "" })}
          render={(o, set) => (
            <div className="flex gap-2">
              <input
                value={o.role}
                onChange={(e) => set({ ...o, role: e.target.value })}
                placeholder="Role"
                className="flex-1 rounded border px-2 py-1"
              />
              <input
                value={o.name}
                onChange={(e) => set({ ...o, name: e.target.value })}
                placeholder="Name"
                className="flex-1 rounded border px-2 py-1"
              />
            </div>
          )}
        />
      </Section>

      <Section title="Trash and Recycling">
        <ListEditor
          items={content.trashAndRecycling}
          onChange={(trashAndRecycling) => update({ trashAndRecycling })}
          newItem={() => ""}
          render={(b, set) => (
            <textarea
              value={b}
              onChange={(e) => set(e.target.value)}
              rows={2}
              className="w-full rounded border px-2 py-1"
            />
          )}
        />
      </Section>

      <Section title="Service Providers">
        <ListEditor
          items={content.serviceProviders}
          onChange={(serviceProviders) => update({ serviceProviders })}
          newItem={emptyProvider}
          render={(p, set) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["service", "Service"],
                  ["provider", "Provider"],
                  ["contact", "Contact"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["website", "Website"],
                  ["account", "Account"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col text-xs">
                  <span className="mb-1 text-gray-600">{label}</span>
                  <input
                    value={p[key]}
                    onChange={(e) => set({ ...p, [key]: e.target.value })}
                    className="rounded border px-2 py-1 text-sm"
                  />
                </label>
              ))}
              <label className="flex flex-col text-xs sm:col-span-2">
                <span className="mb-1 text-gray-600">Notes</span>
                <textarea
                  value={p.notes}
                  onChange={(e) => set({ ...p, notes: e.target.value })}
                  rows={2}
                  className="rounded border px-2 py-1 text-sm"
                />
              </label>
            </div>
          )}
        />
      </Section>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onSave}
          disabled={busy}
          className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6 rounded border border-gray-200 p-3">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function ListEditor<T>({
  items,
  onChange,
  newItem,
  render,
}: {
  items: T[]
  onChange: (items: T[]) => void
  newItem: () => T
  render: (item: T, set: (next: T) => void) => React.ReactNode
}) {
  const setAt = (i: number, next: T) => {
    const copy = [...items]
    copy[i] = next
    onChange(copy)
  }
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, newItem()])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const copy = [...items]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    onChange(copy)
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded border border-gray-200 p-2"
        >
          <div className="flex flex-col gap-1 text-xs">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="inline-flex items-center justify-center rounded border px-1 disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp size={12} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="inline-flex items-center justify-center rounded border px-1 disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown size={12} />
            </button>
          </div>
          <div className="flex-1">{render(item, (next) => setAt(i, next))}</div>
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="rounded p-1 text-red-600 hover:bg-red-50"
          >
            <TrashIcon />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        + Add
      </button>
    </div>
  )
}
