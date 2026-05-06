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
  "w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-sm"
const labelCls =
  "text-[11px] font-medium tracking-tight text-neutral-600 uppercase"
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-[13px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-black"
const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-[13px] font-medium text-red-700 hover:bg-red-50"

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

  const total = (items as Expense[] | undefined)?.reduce(
    (sum, e) => sum + e.cost,
    0,
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            Ledger
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Expenses
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            {items === undefined ? (
              "Loading…"
            ) : (
              <>
                <span className="text-neutral-700">{items.length}</span> entr
                {items.length === 1 ? "y" : "ies"}
              </>
            )}
          </p>
        </div>

        <button onClick={() => setAdding(true)} className={btnPrimary}>
          <Plus size={14} /> Add expense
        </button>
      </header>

      {/* Total card */}
      {items && items.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3">
          <Stat label="Total" value={fmtUSD.format(total ?? 0)} prominent />
          <Stat label="Entries" value={String(items.length)} />
          <Stat
            label="Average"
            value={
              items.length ? fmtUSD.format((total ?? 0) / items.length) : "—"
            }
          />
        </div>
      )}

      {/* List */}
      {items === undefined ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-16 text-center transition-colors hover:border-neutral-400 hover:bg-white"
        >
          <Plus size={24} weight="light" className="text-neutral-400" />
          <div>
            <div className="text-[14px] font-medium text-neutral-800">
              No expenses yet
            </div>
            <div className="mt-1 text-[12px] text-neutral-500">
              Click to record your first expense.
            </div>
          </div>
        </button>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          {(items as Expense[]).map((e, i) => (
            <li
              key={e._id}
              onClick={() => setEditing(e)}
              className={[
                "grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-4 py-3 transition-colors hover:bg-[var(--color-bg-subtle)]",
                i > 0 ? "border-t border-[var(--color-border)]" : "",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[14px] font-medium text-black">
                    {e.item}
                  </span>
                  {e.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-1.5 py-px font-mono text-[10px] tracking-wider text-neutral-500 uppercase">
                      <Paperclip size={10} />
                      {e.attachments.length}
                    </span>
                  )}
                </div>
                {e.notes && (
                  <div className="mt-1 truncate text-[12px] text-neutral-600">
                    {e.notes}
                  </div>
                )}
                {e.attachments.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {e.attachments.map((a) => (
                      <a
                        key={a.storageId}
                        href={a.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(ev) => ev.stopPropagation()}
                        className="inline-flex max-w-[14rem] items-center gap-1 truncate rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-200"
                      >
                        <Paperclip size={10} className="shrink-0" />
                        <span className="truncate">{a.fileName}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                <span className="font-mono text-[14px] font-semibold text-black tabular-nums">
                  {fmtUSD.format(e.cost)}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {format(new Date(e._creationTime), "MMM d, yyyy")}
                  <span className="mx-1 text-neutral-300">·</span>
                  {e.createdByName}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

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

function Stat({
  label,
  value,
  prominent,
}: {
  label: string
  value: string
  prominent?: boolean
}) {
  return (
    <div className="bg-white px-4 py-3.5">
      <div className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
        {label}
      </div>
      <div
        className={[
          "mt-1 font-mono tabular-nums text-black",
          prominent ? "text-2xl font-semibold tracking-tight" : "text-lg",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <ul className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className={`grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 ${
            i > 0 ? "border-t border-[var(--color-border)]" : ""
          }`}
        >
          <div className="space-y-2">
            <span className="block h-3.5 w-1/3 animate-pulse rounded bg-neutral-100" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
          </div>
          <span className="block h-4 w-20 animate-pulse rounded bg-neutral-100" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm" ? "max-w-sm" : "max-w-md"
        } overflow-hidden rounded-lg border border-[var(--color-border)] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3.5">
          <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-black"
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
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}

function ErrorMsg({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
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
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-sm text-neutral-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
                className={`${inputCls} pl-6 font-mono tabular-nums`}
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
            <span className={labelCls}>Files</span>
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
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border)] px-3 py-1.5 text-[12px] font-medium text-neutral-600 hover:border-neutral-400 hover:text-black">
              <FilePlus size={13} />
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
          <p className="text-[13px] text-neutral-600">
            This action cannot be undone.
          </p>
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
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
    <li className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-white pl-2.5">
      <Paperclip size={12} className="shrink-0 text-neutral-400" />
      <input
        value={base}
        onChange={(e) => onChangeBase(e.target.value)}
        className="flex-1 border-0 bg-transparent py-1.5 text-sm focus:outline-none"
      />
      {ext && (
        <span className="font-mono text-[11px] text-neutral-500">{ext}</span>
      )}
      {isNew && (
        <span className="rounded-full bg-neutral-100 px-1.5 py-px text-[10px] font-medium tracking-wide text-neutral-600 uppercase">
          New
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash size={13} />
      </button>
    </li>
  )
}
