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
  "#b54a3b",
  "#d18a4a",
  "#c9a23a",
  "#78916d",
  "#4a6978",
  "#6b6fa0",
  "#9a6da0",
  "#b76a8a",
  "#5a8a85",
  "#8a7866",
]

const fmt = (d: Date) => format(d, "yyyy-MM-dd")

const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger-hover disabled:opacity-40"
const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-paper text-brown hover:border-sage hover:text-sage-hover"

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

  const title = format(month, "MMMM yyyy")

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="mb-4 flex flex-col gap-4">
        <h1 className="font-display text-4xl text-brown sm:text-5xl">
          {title}
        </h1>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
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
          <button onClick={() => setShowForm(true)} className={btnPrimary}>
            <Plus weight="bold" /> New
          </button>
        </div>
      </header>

      <MonthGrid
        month={month}
        reservations={reservations}
        events={events}
        onEditReservation={setEditing}
        onEditEvent={setEditingEvent}
      />

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
      className="inline-flex rounded-full border border-border bg-bg p-1 text-sm"
    >
      {options.map(([v, label]) => {
        const active = value === v
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={`rounded-full px-4 py-1 transition-colors ${
              active
                ? "bg-sage font-semibold text-white"
                : "text-fg-muted hover:text-brown"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          maxWidth === "sm" ? "max-w-sm" : "max-w-md"
        } overflow-hidden rounded-lg border border-border bg-paper shadow-[0_20px_60px_-15px_rgba(89,74,66,0.25)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-xl text-brown">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-fg-muted hover:bg-bg-muted hover:text-brown"
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
      <div className="overflow-hidden rounded-lg border border-border bg-border shadow-[0_1px_0_rgba(89,74,66,0.04)]">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-px border-b border-border bg-border">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="bg-bg-subtle py-2 text-center font-display text-sm text-brown"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border">
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
                  inMonth ? "bg-paper" : "bg-bg-subtle",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  {inMonth ? (
                    today ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sage text-xs font-semibold text-white tabular-nums">
                        {format(day, "d")}
                      </span>
                    ) : (
                      <span className="font-display text-sm text-brown tabular-nums">
                        {format(day, "d")}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-fg-subtle tabular-nums">
                      {format(day, "d")}
                    </span>
                  )}
                </div>

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
                        style={{ backgroundColor: r.color }}
                        className="flex items-center truncate rounded-full px-2 py-0.5 text-left text-xs font-semibold text-white hover:opacity-80"
                      >
                        <span className="truncate">
                          {r.familyName}
                          {(isStart || isEnd) && (
                            <span className="ml-1 text-xs font-normal text-white/80">
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
                      className="flex items-center gap-1.5 truncate rounded-full bg-sage px-2 py-0.5 text-left text-xs font-semibold text-white hover:bg-sage-hover"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-white/80" />
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
              <div className="flex flex-wrap items-center gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    aria-label={`Color ${c}`}
                    className={`h-7 w-7 rounded-full border-2 transition ${
                      newColor === c
                        ? "border-brown"
                        : "border-transparent hover:border-border-strong"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="ml-1 h-8 w-12 cursor-pointer rounded-md border border-border bg-paper"
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
      <footer className="mt-6 flex justify-end gap-2">
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
  const [notify, setNotify] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmNotify, setConfirmNotify] = useState(false)

  async function save(withNotify: boolean) {
    setError(null)
    setBusy(true)
    try {
      if (!title.trim()) throw new Error("Title required")
      await createEvent({
        token,
        date,
        title: title.trim(),
        notes,
        notify: withNotify,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      setConfirmNotify(false)
    } finally {
      setBusy(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError("Title required")
      return
    }
    if (notify) {
      setConfirmNotify(true)
      return
    }
    void save(false)
  }

  return (
    <>
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
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-fg-muted">
              Send an email to all members
            </span>
          </label>
        </div>
        <ErrorMsg>{error}</ErrorMsg>
        <footer className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save"}
          </button>
        </footer>
      </form>
      {confirmNotify && (
        <Modal
          title="Send email to all members?"
          onClose={() => !busy && setConfirmNotify(false)}
          maxWidth="sm"
        >
          <p className="text-sm text-fg-muted">
            This will email every member of Noconomo about{" "}
            <span className="font-semibold text-brown">{title.trim()}</span> on{" "}
            <span className="font-semibold text-brown">{date}</span>. Are you
            sure?
          </p>
          <footer className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmNotify(false)}
              disabled={busy}
              className={btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={busy}
              className={btnPrimary}
            >
              {busy ? "Sending…" : "Send email"}
            </button>
          </footer>
        </Modal>
      )}
    </>
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
      <p className="text-sm text-fg-muted">
        {description ?? "This action cannot be undone."}
      </p>
      <footer className="mt-6 flex justify-end gap-2">
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
          className={btnDanger}
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
        <footer className="mt-6 flex items-center justify-between gap-2">
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
        <p className="mt-3 text-sm text-fg-subtle">
          Added by {event.createdByName}
        </p>
        <footer className="mt-6 flex items-center justify-between gap-2">
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
