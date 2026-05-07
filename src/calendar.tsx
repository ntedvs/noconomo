import { CaretLeft, CaretRight, Plus, X } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  nextSaturday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#78716c",
]

const fmt = (d: Date) => format(d, "yyyy-MM-dd")

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
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-neutral-600 hover:border-neutral-400 hover:text-black"

type FormKind = "reservation" | "event"
type Reservation = {
  _id: Id<"reservations">
  familyId: Id<"families">
  familyName: string
  color: string
  startDate: string
  endDate: string
  notes?: string
}
type EventItem = {
  _id: Id<"events">
  date: string
  title: string
  notes?: string
  createdByName: string
}
type Family = { _id: Id<"families">; name: string; color: string }

export default function Calendar() {
  useTitle("Calendar")
  const { token } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)

  const reservations = useQuery(api.reservations.list, { token }) ?? []
  const families = useQuery(api.families.list, { token }) ?? []
  const events = useQuery(api.events.list, { token }) ?? []

  const rangeStart = month
  const rangeEnd = endOfMonth(month)
  const visibleResCount = reservations.filter(
    (r) => r.endDate >= fmt(rangeStart) && r.startDate <= fmt(rangeEnd),
  ).length
  const visibleEventCount = events.filter(
    (e) => e.date >= fmt(rangeStart) && e.date <= fmt(rangeEnd),
  ).length

  const title = format(month, "MMMM yyyy")

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            Calendar
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMonth((m) => subMonths(m, 1))}
                aria-label="Previous month"
                className={iconBtn}
              >
                <CaretLeft weight="bold" />
              </button>
              <button
                onClick={() => setMonth(startOfMonth(new Date()))}
                className={btnSecondary}
              >
                Today
              </button>
              <button
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
                className={iconBtn}
              >
                <CaretRight weight="bold" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-[13px] text-neutral-500">
            <span className="text-neutral-700">{visibleResCount}</span>{" "}
            reservation{visibleResCount === 1 ? "" : "s"}
            <span className="mx-1.5 text-neutral-300">·</span>
            <span className="text-neutral-700">{visibleEventCount}</span> event
            {visibleEventCount === 1 ? "" : "s"}
          </p>
        </div>

        <button onClick={() => setShowForm(true)} className={btnPrimary}>
          <Plus weight="bold" /> New
        </button>
      </header>

      {/* Body */}
      <MonthGrid
        month={month}
        reservations={reservations}
        events={events}
        onEditReservation={setEditing}
        onEditEvent={setEditingEvent}
      />

      {/* Modals */}
      {showForm && (
        <NewItemModal families={families} onClose={() => setShowForm(false)} />
      )}
      {editing && (
        <EditReservationModal
          reservation={editing}
          families={families}
          onClose={() => setEditing(null)}
        />
      )}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </main>
  )
}

/* ---------- Reusable bits ---------- */

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<readonly [T, string]>
}) {
  return (
    <div
      role="tablist"
      aria-label="View"
      className="inline-flex rounded-md border border-[var(--color-border)] bg-white p-0.5 text-[12px]"
    >
      {options.map(([v, label]) => {
        const active = value === v
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`rounded-[5px] px-2.5 py-1 transition-colors ${
              active
                ? "bg-neutral-100 font-medium text-black"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

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

/* ---------- Month grid ---------- */

function reservationsOnDay(reservations: Reservation[], iso: string) {
  return reservations.filter((r) => r.startDate <= iso && iso <= r.endDate)
}

function MonthGrid({
  month,
  reservations,
  events,
  onEditReservation,
  onEditEvent,
}: {
  month: Date
  reservations: Reservation[]
  events: EventItem[]
  onEditReservation: (r: Reservation) => void
  onEditEvent: (e: EventItem) => void
}) {
  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <section>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-border)]">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-px bg-[var(--color-border)]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="bg-white py-2 text-center text-[11px] font-medium text-neutral-500"
            >
              {d.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-[var(--color-border)]">
          {days.map((day) => {
            const inMonth = isSameMonth(day, month)
            const iso = fmt(day)
            const todays = inMonth ? reservationsOnDay(reservations, iso) : []
            const dayEvents = inMonth
              ? events.filter((e) => e.date === iso)
              : []
            const today = isToday(day)

            return (
              <div
                key={iso}
                className={[
                  "relative flex min-h-16 flex-col gap-1 p-1 transition-colors sm:min-h-28 sm:p-2",
                  inMonth ? "bg-white" : "bg-[#fbfbfb]",
                ].join(" ")}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  {inMonth ? (
                    today ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
                        {format(day, "d")}
                      </span>
                    ) : (
                      <span className="text-[12px] font-medium text-neutral-700 tabular-nums">
                        {format(day, "d")}
                      </span>
                    )
                  ) : (
                    <span className="text-[12px] text-neutral-300 tabular-nums">
                      {format(day, "d")}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="flex flex-col gap-1">
                  {todays.map((r) => {
                    const isStart = r.startDate === iso
                    const isEnd = r.endDate === iso
                    return (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() => onEditReservation(r)}
                        title={`${r.familyName} (${r.startDate} – ${r.endDate})`}
                        className="group flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-neutral-800 hover:opacity-80"
                        style={{
                          backgroundColor: hexAlpha(r.color, 0.13),
                        }}
                      >
                        <span
                          className="h-2.5 w-0.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="truncate">
                          {r.familyName}
                          {(isStart || isEnd) && (
                            <span className="ml-1 text-[9px] tracking-wide text-neutral-500 uppercase">
                              {isStart && isEnd ? "" : isStart ? "in" : "out"}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                  {dayEvents.map((e) => (
                    <button
                      key={e._id}
                      type="button"
                      onClick={() => onEditEvent(e)}
                      title={`${e.title} — added by ${e.createdByName}`}
                      className="flex items-center gap-1.5 truncate rounded bg-neutral-900 px-1.5 py-0.5 text-left text-[11px] font-medium text-white hover:bg-neutral-700"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-white/70" />
                      <span className="truncate">{e.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function hexAlpha(hex: string, alpha: number) {
  const m = hex.replace("#", "")
  const v =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m
  const r = parseInt(v.slice(0, 2), 16)
  const g = parseInt(v.slice(2, 4), 16)
  const b = parseInt(v.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ---------- New item modal ---------- */

function NewItemModal({
  families,
  onClose,
}: {
  families: Family[]
  onClose: () => void
}) {
  const [kind, setKind] = useState<FormKind>("reservation")
  return (
    <Modal title="New" onClose={onClose}>
      <div className="mb-4">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            ["reservation", "Reservation"],
            ["event", "Event"],
          ]}
        />
      </div>
      {kind === "reservation" ? (
        <ReservationFields families={families} onClose={onClose} />
      ) : (
        <EventFields onClose={onClose} />
      )}
    </Modal>
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

function ReservationFields({
  families,
  onClose,
}: {
  families: Family[]
  onClose: () => void
}) {
  const { token } = useAuth()
  const createReservation = useMutation(api.reservations.create)
  const createFamily = useMutation(api.families.create)

  const defaultStart = useMemo(() => fmt(nextSaturday(new Date())), [])
  const defaultEnd = useMemo(
    () => fmt(addDays(nextSaturday(new Date()), 7)),
    [],
  )

  const [familyId, setFamilyId] = useState<Id<"families"> | "new" | "">(
    families[0]?._id ?? "new",
  )
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PALETTE[0])
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      let fid: Id<"families">
      if (familyId === "new" || !familyId) {
        if (!newName.trim()) throw new Error("Family name required")
        fid = await createFamily({
          token,
          name: newName.trim(),
          color: newColor,
        })
      } else {
        fid = familyId
      }
      await createReservation({
        token,
        familyId: fid,
        startDate,
        endDate,
        notes,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Family" span={2}>
          <select
            value={familyId}
            onChange={(e) =>
              setFamilyId(e.target.value as Id<"families"> | "new")
            }
            className={inputCls}
          >
            {families.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
            <option value="new">+ New family…</option>
          </select>
        </Field>

        {familyId === "new" && (
          <>
            <Field label="Family name" span={2}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Smiths"
                className={inputCls}
              />
            </Field>
            <Field label="Color" span={2}>
              <div className="flex flex-wrap items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    aria-label={`Color ${c}`}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      newColor === c
                        ? "border-black"
                        : "border-transparent hover:border-neutral-300"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="ml-1 h-7 w-10 cursor-pointer rounded border border-[var(--color-border)] bg-white"
                />
              </div>
            </Field>
          </>
        )}

        <Field label="Start">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Notes" span={2}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <footer className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : "Save"}
        </button>
      </footer>
    </form>
  )
}

function EventFields({ onClose }: { onClose: () => void }) {
  const { token } = useAuth()
  const createEvent = useMutation(api.events.create)
  const [date, setDate] = useState(fmt(new Date()))
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!title.trim()) throw new Error("Title required")
      await createEvent({ token, date, title: title.trim(), notes })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" span={2}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Annual lake clean-up"
            className={inputCls}
            autoFocus
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Notes" span={2}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </Field>
      </div>
      <ErrorMsg>{error}</ErrorMsg>
      <footer className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btnSecondary}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : "Save"}
        </button>
      </footer>
    </form>
  )
}

/* ---------- Edit modals ---------- */

function ConfirmDelete({
  label,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  label: string
  description?: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal title={label} onClose={() => !busy && onCancel()} maxWidth="sm">
      <p className="text-[13px] text-neutral-600">
        {description ?? "This action cannot be undone."}
      </p>
      <footer className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={btnSecondary}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Working…" : "Delete"}
        </button>
      </footer>
    </Modal>
  )
}

function EditReservationModal({
  reservation,
  families,
  onClose,
}: {
  reservation: Reservation
  families: Family[]
  onClose: () => void
}) {
  const { token } = useAuth()
  const updateReservation = useMutation(api.reservations.update)
  const removeReservation = useMutation(api.reservations.remove)
  const [familyId, setFamilyId] = useState<Id<"families">>(reservation.familyId)
  const [startDate, setStartDate] = useState(reservation.startDate)
  const [endDate, setEndDate] = useState(reservation.endDate)
  const [notes, setNotes] = useState(reservation.notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty =
    familyId !== reservation.familyId ||
    startDate !== reservation.startDate ||
    endDate !== reservation.endDate ||
    notes !== (reservation.notes ?? "")

  async function doSave() {
    setError(null)
    setBusy(true)
    try {
      await updateReservation({
        token,
        id: reservation._id,
        familyId,
        startDate,
        endDate,
        notes,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  async function doDelete() {
    setError(null)
    setBusy(true)
    try {
      await removeReservation({ token, id: reservation._id })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal title="Edit reservation" onClose={onClose}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Family" span={2}>
            <select
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value as Id<"families">)}
              className={inputCls}
            >
              {families.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="End">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Notes" span={2}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <footer className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={btnDanger}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!dirty || busy}
              onClick={doSave}
              className={btnPrimary}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      </Modal>
      {confirmDelete && (
        <ConfirmDelete
          label="Delete this reservation?"
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={doDelete}
        />
      )}
    </>
  )
}

function EditEventModal({
  event,
  onClose,
}: {
  event: EventItem
  onClose: () => void
}) {
  const { token } = useAuth()
  const updateEvent = useMutation(api.events.update)
  const removeEvent = useMutation(api.events.remove)
  const [date, setDate] = useState(event.date)
  const [title, setTitle] = useState(event.title)
  const [notes, setNotes] = useState(event.notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dirty =
    date !== event.date ||
    title !== event.title ||
    notes !== (event.notes ?? "")

  async function doSave() {
    setError(null)
    setBusy(true)
    try {
      await updateEvent({ token, id: event._id, date, title, notes })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  async function doDelete() {
    setError(null)
    setBusy(true)
    try {
      await removeEvent({ token, id: event._id })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal title="Edit event" onClose={onClose}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" span={2}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Notes" span={2}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <p className="mt-3 text-[12px] text-neutral-500">
          Added by {event.createdByName}
        </p>
        <footer className="mt-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className={btnDanger}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!dirty || busy || !title.trim()}
              onClick={doSave}
              className={btnPrimary}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </div>
        </footer>
      </Modal>
      {confirmDelete && (
        <ConfirmDelete
          label="Delete this event?"
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={doDelete}
        />
      )}
    </>
  )
}
