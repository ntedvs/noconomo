import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
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
  address?: string
  director?: boolean
  boardMember?: boolean
}

const FAMILIES = ["Abbott", "Pirie", "Rice", "Guest"] as const

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border-strong bg-paper px-4 py-2 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-hover"

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
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = location.state as { editSelf?: boolean } | null
    if (!state?.editSelf || !users || !user) return
    const self = (users as Member[]).find((u) => u._id === user._id)
    if (self) setEditing(self)
    navigate(location.pathname, { replace: true, state: null })
  }, [location, users, user, navigate])

  const filtered = useMemo(() => {
    if (!users) return []
    const q = query.trim().toLowerCase()
    const matches = (users as Member[]).filter((u) => {
      if (familyFilter && u.family !== familyFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.family ?? "").toLowerCase().includes(q)
      )
    })
    if (!user) return matches
    return matches.sort((a, b) => {
      if (a._id === user._id) return -1
      if (b._id === user._id) return 1
      return 0
    })
  }, [users, query, familyFilter, user])

  if (users === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 text-center text-sm text-fg-subtle sm:py-20">
        Loading…
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Members</h1>
      </header>

      {isAdmin && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setAdding(true)} className={btnPrimary}>
            <Plus weight="bold" /> Add member
          </button>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-64">
          <MagnifyingGlass
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle"
            size={16}
            weight="bold"
          />
          <input
            type="search"
            placeholder="Search name, email, family…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-paper py-2 pr-4 pl-9 text-sm"
          />
        </div>
        <div className="flex items-stretch rounded-full border border-border bg-paper p-1 text-sm">
          {[["", "All"] as const, ...FAMILIES.map((f) => [f, f] as const)].map(
            ([v, label]) => {
              const active = familyFilter === v
              return (
                <button
                  key={v || "all"}
                  onClick={() => setFamilyFilter(v)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    active
                      ? "bg-sage-soft font-semibold text-brown"
                      : "text-fg-muted hover:text-brown"
                  }`}
                >
                  {label}
                </button>
              )
            },
          )}
        </div>
      </div>

      <section className="mt-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center">
            <p className="font-display text-lg text-brown">No matches</p>
            <p className="mt-1 text-sm text-fg-muted">
              No members match your filters.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((u) => {
              const canEdit = isAdmin || u._id === user?._id
              const isMe = u._id === user?._id
              return (
                <li
                  key={u._id}
                  onClick={canEdit ? () => setEditing(u) : undefined}
                  className={[
                    "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition",
                    canEdit
                      ? "cursor-pointer hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]"
                      : "",
                  ].join(" ")}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-soft text-sm font-semibold text-brown">
                    {initials(u.name) || "-"}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold text-brown">
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-muted">
                          You
                        </span>
                      )}
                      {u.admin && (
                        <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-white">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-fg-muted">
                      {u.email}
                    </div>
                  </div>

                  <div className="hidden items-center gap-x-4 gap-y-1 text-sm text-fg-muted md:flex md:flex-wrap md:justify-end">
                    {u.family && (
                      <span className="inline-flex items-center rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-semibold text-brown">
                        {u.family}
                      </span>
                    )}
                    {u.generation && <Meta label="Gen">{u.generation}</Meta>}
                    {u.shares !== undefined && (
                      <Meta label="Shares">{u.shares}</Meta>
                    )}
                    {u.phoneNumber && (
                      <span className="text-sm text-fg-muted tabular-nums">
                        {formatPhone(u.phoneNumber)}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

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
    <span className="inline-flex items-baseline gap-1 text-sm">
      <span className="text-fg-subtle">{label}</span>
      <span className="text-brown">{children}</span>
    </span>
  )
}

/* ---------- Modal ---------- */

function Modal({
  title,
  onClose,
  children,
  maxWidth = "lg",
}: {
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: "sm" | "md" | "lg"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm"
            ? "max-w-sm"
            : maxWidth === "md"
              ? "max-w-md"
              : "max-w-xl"
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
  const [address, setAddress] = useState("")
  const [director, setDirector] = useState(false)
  const [boardMember, setBoardMember] = useState(false)
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
        address: address || undefined,
        ...(sharesNum !== undefined ? { shares: sharesNum } : {}),
        director,
        boardMember,
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
        <div className="grid gap-4 sm:grid-cols-2">
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
              <option value="">-</option>
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
            <select
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              className={inputCls}
            >
              <option value=""></option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
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
          <Field label="Address" span={2}>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-brown">
              <input
                type="checkbox"
                checked={director}
                onChange={(e) => setDirector(e.target.checked)}
                className="h-4 w-4 accent-sage"
              />
              <span>Director</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-brown">
              <input
                type="checkbox"
                checked={boardMember}
                onChange={(e) => setBoardMember(e.target.checked)}
                className="h-4 w-4 accent-sage"
              />
              <span>Board member</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-brown">
              <input
                type="checkbox"
                checked={admin}
                onChange={(e) => setAdmin(e.target.checked)}
                className="h-4 w-4 accent-sage"
              />
              <span>Admin</span>
            </label>
          </div>
        </div>
        <ErrorMsg>{err}</ErrorMsg>
        <footer className="mt-6 flex justify-end gap-3">
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
  const [address, setAddress] = useState(member.address ?? "")
  const [director, setDirector] = useState(member.director ?? false)
  const [boardMember, setBoardMember] = useState(member.boardMember ?? false)
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
        address,
        ...(sharesNum !== undefined ? { shares: sharesNum } : {}),
        ...(isAdmin ? { email, admin, director, boardMember } : {}),
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>
            <Field label="Family">
              <select
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                className={inputCls}
              >
                <option value="">-</option>
                {FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isAdmin}
                className={`${inputCls} disabled:bg-bg-subtle disabled:text-fg-muted`}
              />
            </Field>
            <Field label="Phone Number">
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
              <select
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className={inputCls}
              >
                <option value=""></option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </Field>
            <Field label="Shares">
              <input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Address">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
            {isAdmin && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-brown">
                  <input
                    type="checkbox"
                    checked={director}
                    onChange={(e) => setDirector(e.target.checked)}
                    className="h-4 w-4 accent-sage"
                  />
                  <span>Director</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-brown">
                  <input
                    type="checkbox"
                    checked={boardMember}
                    onChange={(e) => setBoardMember(e.target.checked)}
                    className="h-4 w-4 accent-sage"
                  />
                  <span>Board member</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-brown">
                  <input
                    type="checkbox"
                    checked={admin}
                    onChange={(e) => setAdmin(e.target.checked)}
                    className="h-4 w-4 accent-sage"
                  />
                  <span>Admin</span>
                </label>
              </div>
            )}
          </div>
          <ErrorMsg>{err}</ErrorMsg>
          <footer className="mt-6 flex items-center justify-between gap-3">
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
            <div className="flex gap-3">
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
          <p className="text-sm text-fg-muted">
            This will remove the member and revoke their sessions. This action
            cannot be undone.
          </p>
          <footer className="mt-6 flex justify-end gap-3">
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
