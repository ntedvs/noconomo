import { ArrowDown, ArrowUp, TrashIcon } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import {
  handbookDefaults,
  type Faq,
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

export default function AdminHandbook() {
  useTitle("Edit handbook")
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
      if (stored === null) {
        setContent(handbookDefaults)
      } else {
        const {
          _id: _i,
          _creationTime: _c,
          ...rest
        } = stored as Partial<HandbookContent> & {
          _id?: unknown
          _creationTime?: unknown
        }
        setContent({
          ...handbookDefaults,
          ...rest,
          wifiName: rest.wifiName ?? "",
          wifiPassword: rest.wifiPassword ?? "",
          faqs: rest.faqs ?? [],
        } as HandbookContent)
      }
    }
  }, [stored, content])

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
  if (!content)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-sm text-fg-subtle">
        Loading…
      </div>
    )

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
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl sm:text-5xl">Edit handbook</h1>
        <div className="flex flex-wrap items-center gap-3">
          {msg && <span className="text-sm text-sage-hover">{msg}</span>}
          {err && <span className="text-sm text-danger">{err}</span>}
          <button
            onClick={onSave}
            disabled={busy}
            className="rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <div className="mt-10 space-y-6">
        <Section title="Address">
          <input
            value={content.address}
            onChange={(e) => update({ address: e.target.value })}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
          />
        </Section>

        <Section title="Phone Number">
          <input
            value={content.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
          />
        </Section>

        <Section title="Wifi">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-fg-muted">Network Name</span>
              <input
                value={content.wifiName}
                onChange={(e) => update({ wifiName: e.target.value })}
                className="rounded-md border border-border bg-bg px-3 py-2 text-base"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-fg-muted">Password</span>
              <input
                value={content.wifiPassword}
                onChange={(e) => update({ wifiPassword: e.target.value })}
                className="rounded-md border border-border bg-bg px-3 py-2 text-base"
              />
            </label>
          </div>
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
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-base"
                />
                <input
                  value={o.name}
                  onChange={(e) => set({ ...o, name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-base"
                />
              </div>
            )}
          />
        </Section>

        <Section title="FAQ">
          <ListEditor
            items={content.faqs}
            onChange={(faqs) => update({ faqs })}
            newItem={(): Faq => ({ question: "", answer: "" })}
            render={(f, set) => (
              <div className="flex flex-col gap-2">
                <input
                  value={f.question}
                  onChange={(e) => set({ ...f, question: e.target.value })}
                  placeholder="Question"
                  className="rounded-md border border-border bg-bg px-3 py-2 text-base"
                />
                <textarea
                  value={f.answer}
                  onChange={(e) => set({ ...f, answer: e.target.value })}
                  placeholder="Answer"
                  rows={3}
                  className="resize-y rounded-md border border-border bg-bg px-3 py-2 text-base"
                />
              </div>
            )}
          />
        </Section>

        <Section title="Service Providers">
          <ListEditor
            items={content.serviceProviders}
            onChange={(serviceProviders) => update({ serviceProviders })}
            newItem={emptyProvider}
            render={(p, set) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <label key={key} className="flex flex-col gap-1.5 text-sm">
                    <span className="text-fg-muted">{label}</span>
                    <input
                      value={p[key]}
                      onChange={(e) => set({ ...p, [key]: e.target.value })}
                      className="rounded-md border border-border bg-bg px-3 py-2 text-base"
                    />
                  </label>
                ))}
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="text-fg-muted">Notes</span>
                  <textarea
                    value={p.notes}
                    onChange={(e) => set({ ...p, notes: e.target.value })}
                    rows={2}
                    className="resize-y rounded-md border border-border bg-bg px-3 py-2 text-base"
                  />
                </label>
              </div>
            )}
          />
        </Section>
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={onSave}
          disabled={busy}
          className="rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </main>
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
    <section className="rounded-md border border-border bg-paper p-5 shadow-[0_1px_0_rgba(89,74,66,0.04)]">
      <h2 className="font-display text-xl text-brown">{title}</h2>
      <div className="mt-4">{children}</div>
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
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-md border border-border bg-bg-subtle/50 p-3"
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="grid h-7 w-7 place-items-center rounded-full border border-border-strong bg-paper text-brown hover:border-sage hover:text-sage-hover disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp size={12} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              className="grid h-7 w-7 place-items-center rounded-full border border-border-strong bg-paper text-brown hover:border-sage hover:text-sage-hover disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown size={12} weight="bold" />
            </button>
          </div>
          <div className="flex-1">{render(item, (next) => setAt(i, next))}</div>
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove"
            className="grid h-7 w-7 place-items-center rounded-full p-1 text-fg-subtle hover:bg-bg-muted hover:text-danger"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
      >
        + Add
      </button>
    </div>
  )
}
