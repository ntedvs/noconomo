import { FilePlus, Paperclip, Plus, Trash, X } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { useEffect, useState, type ReactNode } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

type Attachment = {
  storageId: Id<"_storage">
  fileName: string
  contentType?: string
  size?: number
  url: string | null
}

type Expense = {
  _id: Id<"expenses">
  item: string
  cost: number
  notes?: string
  createdBy: Id<"users">
  createdByName: string
  _creationTime: number
  attachments: Attachment[]
}

const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-paper px-4 py-2 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-hover disabled:opacity-40"

function splitFileName(name: string): { base: string; ext: string } {
  const idx = name.lastIndexOf(".")
  if (idx <= 0 || idx === name.length - 1) return { base: name, ext: "" }
  return { base: name.slice(0, idx), ext: name.slice(idx) }
}

export default function Expenses() {
  useTitle("Expenses")
  const { token } = useAuth()
  const items = useQuery(api.expenses.list, { token })
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Expenses</h1>
      </header>

      <div className="mt-8 flex justify-center">
        <button onClick={() => setAdding(true)} className={btnPrimary}>
          <Plus size={16} weight="bold" /> Add expense
        </button>
      </div>

      <section className="mt-10">
        {items === undefined ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center transition hover:border-sage hover:bg-paper"
          >
            <Plus size={24} weight="light" className="text-fg-subtle" />
            <div>
              <p className="font-display text-lg text-brown">No expenses yet</p>
              <p className="mt-1 text-sm text-fg-muted">
                Click to record your first expense.
              </p>
            </div>
          </button>
        ) : (
          <ul className="space-y-3">
            {(items as Expense[]).map((e) => (
              <li
                key={e._id}
                onClick={() => setEditing(e)}
                className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-base font-semibold text-brown">
                      {e.item}
                    </span>
                    {e.attachments.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-xs text-fg-muted">
                        <Paperclip size={10} />
                        {e.attachments.length}
                      </span>
                    )}
                  </div>
                  {e.notes && (
                    <div className="mt-1 truncate text-sm text-fg">
                      {e.notes}
                    </div>
                  )}
                  {e.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.attachments.map((a) => (
                        <a
                          key={a.storageId}
                          href={a.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(ev) => ev.stopPropagation()}
                          className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 text-xs text-fg-muted hover:border-sage hover:text-sage-hover"
                        >
                          <Paperclip size={10} className="shrink-0" />
                          <span className="truncate">{a.fileName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                  <span className="font-display text-xl text-brown tabular-nums">
                    {fmtUSD.format(e.cost)}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {format(new Date(e._creationTime), "MMM d, yyyy")}
                    <span className="mx-1 text-fg-subtle">·</span>
                    {e.createdByName}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {adding && <ExpenseModal mode="add" onClose={() => setAdding(false)} />}
      {editing && (
        <ExpenseModal
          mode="edit"
          expense={editing}
          onClose={() => setEditing(null)}
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
          className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-border bg-paper px-5 py-4"
        >
          <div className="space-y-2">
            <span className="block h-3.5 w-1/3 animate-pulse rounded bg-bg-muted" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-bg-muted" />
          </div>
          <span className="block h-4 w-20 animate-pulse rounded bg-bg-muted" />
        </li>
      ))}
    </ul>
  )
}

/* ---------- Modal ---------- */

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

/* ---------- Add / Edit ---------- */

function ExpenseModal(
  props:
    | { mode: "add"; onClose: () => void }
    | { mode: "edit"; expense: Expense; onClose: () => void },
) {
  const { token } = useAuth()
  const create = useMutation(api.expenses.create)
  const update = useMutation(api.expenses.update)
  const remove = useMutation(api.expenses.remove)
  const generateUploadUrl = useMutation(api.expenses.generateUploadUrl)

  const initial = props.mode === "edit" ? props.expense : null
  const [item, setItem] = useState(initial?.item ?? "")
  const [cost, setCost] = useState(initial ? initial.cost.toFixed(2) : "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    initial?.attachments ?? [],
  )
  const [newFiles, setNewFiles] = useState<{ file: File; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const uploadOne = async ({ file, name }: { file: File; name: string }) => {
    const url = await generateUploadUrl({ token })
    const res = await fetch(url, {
      method: "POST",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const { storageId } = (await res.json()) as { storageId: string }
    return {
      storageId: storageId as Id<"_storage">,
      fileName: name.trim() || file.name,
      contentType: file.type || undefined,
      size: file.size,
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const costNum = Number(cost)
      if (!Number.isFinite(costNum)) throw new Error("Cost must be a number")
      const uploaded = await Promise.all(newFiles.map(uploadOne))
      if (props.mode === "add") {
        await create({
          token,
          item,
          cost: costNum,
          notes: notes.trim() || undefined,
          attachments: uploaded.length > 0 ? uploaded : undefined,
        })
      } else {
        const kept = existingAttachments.map((a) => ({
          storageId: a.storageId,
          fileName: a.fileName,
          contentType: a.contentType,
          size: a.size,
        }))
        await update({
          token,
          id: props.expense._id,
          item,
          cost: costNum,
          notes: notes.trim() || undefined,
          attachments: [...kept, ...uploaded],
        })
      }
      props.onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal
        title={props.mode === "add" ? "Add expense" : "Edit expense"}
        onClose={props.onClose}
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Item">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              autoFocus
              className={inputCls}
            />
          </Field>
          <Field label="Cost (USD)">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-fg-subtle">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                className={`${inputCls} pl-7 tabular-nums`}
                placeholder="0.00"
              />
            </div>
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-brown">Files</span>
            {(existingAttachments.length > 0 || newFiles.length > 0) && (
              <ul className="flex flex-col gap-1.5">
                {existingAttachments.map((a) => {
                  const { base, ext } = splitFileName(a.fileName)
                  return (
                    <FileRow
                      key={a.storageId}
                      base={base}
                      ext={ext}
                      onChangeBase={(v) =>
                        setExistingAttachments((prev) =>
                          prev.map((x) =>
                            x.storageId === a.storageId
                              ? { ...x, fileName: v + ext }
                              : x,
                          ),
                        )
                      }
                      onRemove={() =>
                        setExistingAttachments((prev) =>
                          prev.filter((x) => x.storageId !== a.storageId),
                        )
                      }
                    />
                  )
                })}
                {newFiles.map((nf, i) => {
                  const { base, ext } = splitFileName(nf.name)
                  return (
                    <FileRow
                      key={`new-${i}`}
                      base={base}
                      ext={ext}
                      isNew
                      onChangeBase={(v) =>
                        setNewFiles((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, name: v + ext } : x,
                          ),
                        )
                      }
                      onRemove={() =>
                        setNewFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                    />
                  )
                })}
              </ul>
            )}
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-dashed border-border-strong px-4 py-1.5 text-sm font-semibold text-fg-muted hover:border-sage hover:text-sage-hover">
              <FilePlus size={14} />
              Add files
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length > 0)
                    setNewFiles((prev) => [
                      ...prev,
                      ...files.map((f) => ({ file: f, name: f.name })),
                    ])
                  e.target.value = ""
                }}
                className="hidden"
              />
            </label>
          </div>

          <ErrorMsg>{err}</ErrorMsg>

          <footer className="mt-2 flex items-center justify-between gap-2">
            <div>
              {props.mode === "edit" && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className={btnDanger}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={props.onClose}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </Modal>

      {confirmDelete && props.mode === "edit" && (
        <Modal
          title="Delete this expense?"
          onClose={() => !busy && setConfirmDelete(false)}
          maxWidth="sm"
        >
          <p className="text-base text-fg">This action cannot be undone.</p>
          <footer className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setBusy(true)
                try {
                  await remove({ token, id: props.expense._id })
                  props.onClose()
                } catch (e) {
                  setErr(e instanceof Error ? e.message : String(e))
                  setConfirmDelete(false)
                } finally {
                  setBusy(false)
                }
              }}
              disabled={busy}
              className={btnDanger}
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </footer>
        </Modal>
      )}
    </>
  )
}

function FileRow({
  base,
  ext,
  isNew,
  onChangeBase,
  onRemove,
}: {
  base: string
  ext: string
  isNew?: boolean
  onChangeBase: (v: string) => void
  onRemove: () => void
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-paper pl-3">
      <Paperclip size={12} className="shrink-0 text-fg-subtle" />
      <input
        value={base}
        onChange={(e) => onChangeBase(e.target.value)}
        className="flex-1 border-0 bg-transparent py-1.5 text-base focus:outline-none"
      />
      {ext && <span className="text-xs text-fg-muted">{ext}</span>}
      {isNew && (
        <span className="rounded-full bg-sage-soft px-2 py-0.5 text-xs font-semibold text-sage-hover">
          New
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="rounded-full p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-danger"
      >
        <Trash size={14} />
      </button>
    </li>
  )
}
