import { FilePlusIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { useState } from "react"
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
    <div className="p-4">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded border px-3 py-1 hover:bg-gray-50"
        >
          <PlusIcon weight="bold" />
          Add Expense
        </button>
      </header>

      {items === undefined ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No expenses yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="border px-2 py-1">Item</th>
                <th className="border px-2 py-1">Cost</th>
                <th className="border px-2 py-1">Notes</th>
                <th className="border px-2 py-1">Files</th>
                <th className="border px-2 py-1">Added by</th>
                <th className="border px-2 py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {(items as Expense[]).map((e) => (
                <tr
                  key={e._id}
                  onClick={() => setEditing(e)}
                  className="cursor-pointer align-top hover:bg-gray-50"
                >
                  <td className="border px-2 py-1 font-medium">{e.item}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {fmtUSD.format(e.cost)}
                  </td>
                  <td className="border px-2 py-1">{e.notes ?? ""}</td>
                  <td className="border px-2 py-1">
                    {e.attachments.length > 0 && (
                      <div className="flex flex-col items-start gap-0.5">
                        {e.attachments.map((a) => (
                          <a
                            key={a.storageId}
                            href={a.url ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                            className="w-fit text-blue-600 hover:underline"
                          >
                            {a.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="border px-2 py-1">{e.createdByName}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {format(new Date(e._creationTime), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="border px-2 py-1">Total</td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {fmtUSD.format(total ?? 0)}
                </td>
                <td className="border px-2 py-1" colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {adding && <ExpenseModal mode="add" onClose={() => setAdding(false)} />}
      {editing && (
        <ExpenseModal
          mode="edit"
          expense={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={props.onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            {props.mode === "add" ? "Add expense" : "Edit expense"}
          </h3>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close"
            className="p-1"
          >
            <XIcon weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Item</span>
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Cost (USD)</span>
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <div className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Files</span>
            {existingAttachments.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {existingAttachments.map((a) => {
                  const { base, ext } = splitFileName(a.fileName)
                  return (
                    <li key={a.storageId} className="flex items-center gap-1">
                      <input
                        value={base}
                        onChange={(e) =>
                          setExistingAttachments((prev) =>
                            prev.map((x) =>
                              x.storageId === a.storageId
                                ? { ...x, fileName: e.target.value + ext }
                                : x,
                            ),
                          )
                        }
                        className="flex-1 rounded border px-2 py-1 text-sm"
                      />
                      {ext && (
                        <span className="text-sm text-gray-500">{ext}</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExistingAttachments((prev) =>
                            prev.filter((x) => x.storageId !== a.storageId),
                          )
                        }
                        aria-label="Remove file"
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {newFiles.length > 0 && (
              <ul className="mb-2 flex flex-col gap-1">
                {newFiles.map((nf, i) => {
                  const { base, ext } = splitFileName(nf.name)
                  return (
                    <li key={i} className="flex items-center gap-1">
                      <input
                        value={base}
                        onChange={(e) =>
                          setNewFiles((prev) =>
                            prev.map((x, j) =>
                              j === i
                                ? { ...x, name: e.target.value + ext }
                                : x,
                            ),
                          )
                        }
                        className="flex-1 rounded border px-2 py-1 text-sm"
                      />
                      {ext && (
                        <span className="text-sm text-gray-500">{ext}</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) => prev.filter((_, j) => j !== i))
                        }
                        aria-label="Remove file"
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <label className="inline-flex w-fit cursor-pointer items-center gap-1 rounded border px-3 py-1 text-sm hover:bg-gray-50">
              <FilePlusIcon weight="bold" />
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
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {props.mode === "edit" && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onClose}
              className="rounded border px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {confirmDelete && props.mode === "edit" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={(e) => {
              e.stopPropagation()
              if (!busy) setConfirmDelete(false)
            }}
          >
            <div
              className="w-full max-w-sm rounded bg-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-2 font-semibold">Delete this expense?</h4>
              <p className="mb-4 text-sm text-gray-700">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                  className="rounded border px-3 py-1 text-sm"
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
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {busy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
