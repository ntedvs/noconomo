import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export default function Members() {
  useTitle("Members")
  const { token, user } = useAuth()
  const users = useQuery(api.users.list, { token })
  const [editing, setEditing] = useState<Member | null>(null)
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState("")
  const [familyFilter, setFamilyFilter] = useState<string>("")

  const isAdmin = user?.admin === true

  const filtered = useMemo(() => {
    if (!users) return []
    const q = query.trim().toLowerCase()
    return (users as Member[]).filter((u) => {
      if (familyFilter && u.family !== familyFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.family ?? "").toLowerCase().includes(q)
      )
    })
  }, [users, query, familyFilter])

  if (users === undefined) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 text-sm text-neutral-500 sm:px-6">
        Loading…
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            Directory
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Members
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            <span className="text-neutral-700">{users.length}</span> total
            {filtered.length !== users.length && (
              <>
                <span className="mx-1.5 text-neutral-300">·</span>
                <span className="text-neutral-700">{filtered.length}</span>{" "}
                showing
              </>
            )}
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setAdding(true)} className={btnPrimary}>
            <Plus weight="bold" /> Add member
          </button>
        )}
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-neutral-400"
            size={14}
            weight="bold"
          />
          <input
            type="search"
            placeholder="Search name, email, family…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-white py-1.5 pr-2.5 pl-8 text-sm"
          />
        </div>
        <div className="flex rounded-md border border-[var(--color-border)] bg-white p-0.5 text-[12px]">
          {[["", "All"] as const, ...FAMILIES.map((f) => [f, f] as const)].map(
            ([v, label]) => {
              const active = familyFilter === v
              return (
                <button
                  key={v || "all"}
                  onClick={() => setFamilyFilter(v)}
                  className={`rounded-[5px] px-2.5 py-1 transition-colors ${
                    active
                      ? "bg-neutral-100 font-medium text-black"
                      : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {label}
                </button>
              )
            },
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] py-12 text-center text-[13px] text-neutral-500">
          No members match your filters.
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          {filtered.map((u, i) => {
            const canEdit = isAdmin || u._id === user?._id
            const isMe = u._id === user?._id
            return (
              <li
                key={u._id}
                onClick={canEdit ? () => setEditing(u) : undefined}
                className={[
                  "grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 transition-colors",
                  i > 0 ? "border-t border-[var(--color-border)]" : "",
                  canEdit
                    ? "cursor-pointer hover:bg-[var(--color-bg-subtle)]"
                    : "",
                ].join(" ")}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-[12px] font-semibold tracking-tight text-neutral-700">
                  {initials(u.name) || "—"}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-black">
                      {u.name}
                    </span>
                    {isMe && (
                      <span className="rounded-full border border-[var(--color-border)] px-1.5 py-px text-[10px] tracking-wide text-neutral-500 uppercase">
                        You
                      </span>
                    )}
                    {u.admin && (
                      <span className="rounded-full bg-black px-1.5 py-px text-[10px] font-medium tracking-wide text-white uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px] text-neutral-500">
                    {u.email}
                  </div>
                </div>

                <div className="hidden items-center gap-x-5 gap-y-1 text-[12px] text-neutral-600 md:flex md:flex-wrap md:justify-end">
                  {u.family && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                      {u.family}
                    </span>
                  )}
                  {u.generation && <Meta label="Gen">{u.generation}</Meta>}
                  {u.shares !== undefined && (
                    <Meta label="Shares">{u.shares}</Meta>
                  )}
                  {u.phoneNumber && (
                    <span className="font-mono text-[12px] text-neutral-600 tabular-nums">
                      {formatPhone(u.phoneNumber)}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          isAdmin={isAdmin}
          onClose={() => setEditing(null)}
        />
      )}
      {adding && <AddMemberModal onClose={() => setAdding(false)} />}
    </main>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-mono text-[10px] tracking-wider text-neutral-400 uppercase">
        {label}
      </span>
      <span className="text-neutral-700">{children}</span>
    </span>
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
            <X />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  span = 1,
}: {
  label: string
  children: ReactNode
  span?: 1 | 2
}) {
  return (
    <label
      className={`flex flex-col gap-1.5 ${span === 2 ? "sm:col-span-2" : ""}`}
    >
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

/* ---------- Add ---------- */

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
    <Modal title="Add member" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" span={2}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Family" span={2}>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className={inputCls}
            >
              <option value="">—</option>
              {FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email" span={2}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
            />
          </Field>
          <Field label="Phone Number" span={2}>
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
              className={inputCls}
            />
          </Field>
          <Field label="Date of Birth">
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Generation">
            <input
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Shares" span={2}>
            <input
              type="number"
              step="any"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-neutral-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={admin}
              onChange={(e) => setAdmin(e.target.checked)}
              className="h-3.5 w-3.5 accent-black"
            />
            <span>Admin</span>
          </label>
        </div>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Adding…" : "Add member"}
          </button>
        </footer>
      </form>
    </Modal>
  )
}

/* ---------- Edit ---------- */

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
    <>
      <Modal title="Edit member" onClose={onClose}>
        <form onSubmit={submit}>
          <div className="mb-4 flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[12px] font-semibold text-neutral-700 ring-1 ring-[var(--color-border)] ring-inset">
              {initials(member.name) || "—"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium">
                {member.name}
              </div>
              <div className="truncate text-[11px] text-neutral-500">
                {member.email}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" span={2}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Family" span={2}>
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Email" span={2}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isAdmin}
                className={`${inputCls} disabled:bg-[var(--color-bg-subtle)] disabled:text-neutral-500`}
              />
            </Field>
            <Field label="Phone Number" span={2}>
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
                className={inputCls}
              />
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Generation">
              <input
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Shares" span={2}>
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className={inputCls}
              />
            </Field>
            {isAdmin && (
              <label className="flex items-center gap-2 text-[13px] text-neutral-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={admin}
                  onChange={(e) => setAdmin(e.target.checked)}
                  className="h-3.5 w-3.5 accent-black"
                />
                <span>Admin</span>
              </label>
            )}
          </div>
          <ErrorMsg>{err}</ErrorMsg>
          <footer className="mt-5 flex items-center justify-between gap-2">
            <div>
              {isAdmin && member._id !== me?._id && (
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
              <button type="button" onClick={onClose} className={btnSecondary}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={btnPrimary}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </Modal>

      {confirmDelete && (
        <Modal
          title={`Delete ${member.name}?`}
          onClose={() => !busy && setConfirmDelete(false)}
          maxWidth="sm"
        >
          <p className="text-[13px] text-neutral-600">
            This will remove the member and revoke their sessions. This action
            cannot be undone.
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
