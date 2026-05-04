import { PlusIcon, XIcon } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

type Member = {
  _id: Id<"users">
  name: string
  email: string
  admin: boolean
  dateOfBirth?: string
  generation?: string
  shares?: number
  phoneNumber?: string
  family?: string
}

const FAMILIES = ["Abbott", "Pirie", "Rice", "Guest"] as const

function digitsOnly(s: string) {
  return s.replace(/\D/g, "").slice(0, 10)
}

function formatPhone(s: string | undefined): string {
  const d = digitsOnly(s ?? "")
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export default function Members() {
  useTitle("Members")
  const { token, user } = useAuth()
  const users = useQuery(api.users.list, { token })
  const [editing, setEditing] = useState<Member | null>(null)
  const [adding, setAdding] = useState(false)

  if (users === undefined) return <div className="p-4">Loading…</div>

  const isAdmin = user?.admin === true

  return (
    <div className="p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Members</h2>
        {isAdmin && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded border px-3 py-1 hover:bg-gray-50"
          >
            <PlusIcon weight="bold" />
            Add Member
          </button>
        )}
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Family</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Phone Number</th>
              <th className="border px-2 py-1">Generation</th>
              <th className="border px-2 py-1">Shares</th>
              {isAdmin && <th className="border px-2 py-1">Admin</th>}
            </tr>
          </thead>
          <tbody>
            {(users as Member[]).map((u) => {
              const canEdit = isAdmin || u._id === user?._id
              return (
                <tr
                  key={u._id}
                  onClick={canEdit ? () => setEditing(u) : undefined}
                  title={
                    canEdit
                      ? u._id === user?._id
                        ? "Edit your profile"
                        : "Edit member"
                      : undefined
                  }
                  className={`align-top ${canEdit ? "cursor-pointer hover:bg-gray-50" : ""}`}
                >
                  <td className="border px-2 py-1 font-medium">{u.name}</td>
                  <td className="border px-2 py-1">{u.family ?? ""}</td>
                  <td className="border px-2 py-1">{u.email}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {formatPhone(u.phoneNumber)}
                  </td>
                  <td className="border px-2 py-1">{u.generation ?? ""}</td>
                  <td className="border px-2 py-1">{u.shares ?? ""}</td>
                  {isAdmin && (
                    <td className="border px-2 py-1">{u.admin ? "Yes" : ""}</td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditMemberModal
          member={editing}
          isAdmin={isAdmin}
          onClose={() => setEditing(null)}
        />
      )}

      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth()
  const createUser = useMutation(api.users.create)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [generation, setGeneration] = useState("")
  const [shares, setShares] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [family, setFamily] = useState("")
  const [admin, setAdmin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const sharesNum = shares.trim() === "" ? undefined : Number(shares)
      if (sharesNum !== undefined && Number.isNaN(sharesNum)) {
        throw new Error("Shares must be a number")
      }
      const phoneDigits = digitsOnly(phoneNumber)
      if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
        throw new Error("Phone number must be 10 digits")
      }
      await createUser({
        token,
        name,
        email,
        dateOfBirth: dateOfBirth || undefined,
        generation: generation || undefined,
        phoneNumber: phoneDigits || undefined,
        family: family || undefined,
        ...(sharesNum !== undefined ? { shares: sharesNum } : {}),
        admin,
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Add member</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1"
          >
            <XIcon weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Family</span>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className="rounded border bg-white px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Phone Number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              maxLength={14}
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="\(\d{3}\) \d{3}-\d{4}"
              title="10-digit phone number, e.g. (555) 555-5555"
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Date of Birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Generation</span>
            <input
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Shares</span>
            <input
              type="number"
              step="any"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={admin}
              onChange={(e) => setAdmin(e.target.checked)}
            />
            <span>Admin</span>
          </label>
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-gray-900 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  )
}

function EditMemberModal({
  member,
  isAdmin,
  onClose,
}: {
  member: Member
  isAdmin: boolean
  onClose: () => void
}) {
  const { token, user: me } = useAuth()
  const updateUser = useMutation(api.users.update)
  const removeUser = useMutation(api.users.remove)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [dateOfBirth, setDateOfBirth] = useState(member.dateOfBirth ?? "")
  const [generation, setGeneration] = useState(member.generation ?? "")
  const [shares, setShares] = useState(
    member.shares !== undefined ? String(member.shares) : "",
  )
  const [phoneNumber, setPhoneNumber] = useState(
    formatPhone(member.phoneNumber),
  )
  const [family, setFamily] = useState(member.family ?? "")
  const [admin, setAdmin] = useState(member.admin)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const sharesNum = shares.trim() === "" ? undefined : Number(shares)
      if (sharesNum !== undefined && Number.isNaN(sharesNum)) {
        throw new Error("Shares must be a number")
      }
      const phoneDigits = digitsOnly(phoneNumber)
      if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
        throw new Error("Phone number must be 10 digits")
      }
      await updateUser({
        token,
        userId: member._id,
        name,
        dateOfBirth,
        generation,
        phoneNumber: phoneDigits,
        family,
        ...(sharesNum !== undefined ? { shares: sharesNum } : {}),
        ...(isAdmin ? { email, admin } : {}),
      })
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Edit member</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1"
          >
            <XIcon weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Family</span>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className="rounded border bg-white px-2 py-1 text-sm"
            >
              <option value="">—</option>
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isAdmin}
              className="rounded border px-2 py-1 text-sm disabled:bg-gray-100"
            />
          </label>
          <label className="flex flex-col text-xs sm:col-span-2">
            <span className="mb-1 font-medium">Phone Number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              maxLength={14}
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="\(\d{3}\) \d{3}-\d{4}"
              title="10-digit phone number, e.g. (555) 555-5555"
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Date of Birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Generation</span>
            <input
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 font-medium">Shares</span>
            <input
              type="number"
              step="any"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={admin}
                onChange={(e) => setAdmin(e.target.checked)}
              />
              <span>Admin</span>
            </label>
          )}
        </div>
        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div>
            {isAdmin && member._id !== me?._id && (
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
              onClick={onClose}
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

        {confirmDelete && (
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
              <h4 className="mb-2 font-semibold">Delete {member.name}?</h4>
              <p className="mb-4 text-sm text-gray-700">
                This will remove the member and revoke their sessions. This
                action cannot be undone.
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
                    setErr(null)
                    try {
                      await removeUser({ token, userId: member._id })
                      onClose()
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
