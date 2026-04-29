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
  isWeekend,
  nextSaturday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { useMemo, useState } from "react"
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

type View = "month" | "three" | "list"
type FormKind = "reservation" | "event"
type Reservation = {
  _id: Id<"reservations">
  familyId: Id<"families">
  familyName: string
  color: string
  startDate: string
  endDate: string
}
type EventItem = {
  _id: Id<"events">
  date: string
  title: string
  createdByName: string
}

export default function Calendar() {
  useTitle("Calendar")
  const { token } = useAuth()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [view, setView] = useState<View>("month")
  const [showForm, setShowForm] = useState(false)

  const reservations = useQuery(api.reservations.list, { token }) ?? []
  const families = useQuery(api.families.list, { token }) ?? []
  const events = useQuery(api.events.list, { token }) ?? []

  const months =
    view === "three"
      ? [subMonths(month, 1), month, addMonths(month, 1)]
      : [month]

  const title =
    view === "three"
      ? `${format(months[0], "MMM")} – ${format(months[2], "MMM yyyy")}`
      : format(month, "MMMM yyyy")

  return (
    <div
      className={`mx-auto p-4 ${view === "three" ? "max-w-7xl" : "max-w-3xl"}`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <CaretLeft weight="bold" />
        </button>
        <h2 className="m-0 text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <div
            role="tablist"
            aria-label="View"
            className="flex overflow-hidden rounded border border-gray-300 text-xs"
          >
            {(
              [
                ["month", "Month"],
                ["three", "3 Months"],
                ["list", "List"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`px-2 py-1 ${view === v ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 rounded bg-gray-900 px-2 py-1 text-xs text-white"
          >
            <Plus weight="bold" /> New
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <CaretRight weight="bold" />
          </button>
        </div>
      </header>

      {showForm && (
        <NewItemForm families={families} onClose={() => setShowForm(false)} />
      )}

      {view === "list" ? (
        <ListView month={month} reservations={reservations} events={events} />
      ) : (
        <div
          className={
            view === "three" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : ""
          }
        >
          {months.map((m) => (
            <MonthGrid
              key={m.toISOString()}
              month={m}
              compact={view === "three"}
              reservations={reservations}
              events={events}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function reservationsOnDay(reservations: Reservation[], iso: string) {
  return reservations.filter((r) => r.startDate <= iso && iso <= r.endDate)
}

function MonthGrid({
  month,
  compact,
  reservations,
  events,
}: {
  month: Date
  compact: boolean
  reservations: Reservation[]
  events: EventItem[]
}) {
  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div>
      {compact && (
        <h3 className="mb-2 text-sm font-semibold">
          {format(month, "MMMM yyyy")}
        </h3>
      )}
      <div className="grid grid-cols-7 gap-px border border-gray-300 bg-gray-300">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className={`bg-gray-100 text-center font-semibold ${compact ? "p-1 text-[10px]" : "p-2 text-xs"}`}
          >
            {compact ? d[0] : d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const iso = fmt(day)
          const todays = reservationsOnDay(reservations, iso)
          const dayEvents = events.filter((e) => e.date === iso)
          return (
            <div
              key={iso}
              className={`relative bg-white ${compact ? "min-h-12 p-1 text-xs" : "min-h-24 p-1.5"} ${inMonth ? "text-gray-900" : "text-gray-400"}`}
            >
              <div
                className={
                  isToday(day) ? "font-bold text-blue-600" : "font-normal"
                }
              >
                {format(day, "d")}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {todays.map((r) => (
                  <div
                    key={r._id}
                    title={`${r.familyName} (${r.startDate} – ${r.endDate})`}
                    className={`truncate rounded px-1 text-white ${compact ? "text-[9px] leading-tight" : "text-[10px]"}`}
                    style={{ backgroundColor: r.color }}
                  >
                    {compact ? "•" : r.familyName}
                  </div>
                ))}
                {dayEvents.map((e) => (
                  <div
                    key={e._id}
                    title={`${e.title} — added by ${e.createdByName}`}
                    className={`truncate rounded border border-gray-700 bg-gray-800 px-1 text-white ${compact ? "text-[9px] leading-tight" : "text-[10px]"}`}
                  >
                    {compact ? "▪" : e.title}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ListView({
  month,
  reservations,
  events,
}: {
  month: Date
  reservations: Reservation[]
  events: EventItem[]
}) {
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  })

  return (
    <ul className="divide-y divide-gray-200 rounded border border-gray-300 bg-white">
      {days.map((day) => {
        const iso = fmt(day)
        const todays = reservationsOnDay(reservations, iso)
        const dayEvents = events.filter((e) => e.date === iso)
        const empty = todays.length === 0 && dayEvents.length === 0
        return (
          <li
            key={iso}
            className={`flex items-center gap-4 px-3 py-2 text-sm ${isWeekend(day) ? "bg-gray-50" : ""}`}
          >
            <div
              className={`w-10 text-right font-mono tabular-nums ${
                isToday(day) ? "font-bold text-blue-600" : "text-gray-900"
              }`}
            >
              {format(day, "d")}
            </div>
            <div className="w-10 text-xs tracking-wide text-gray-500 uppercase">
              {format(day, "EEE")}
            </div>
            <div className="flex flex-1 flex-wrap gap-1">
              {empty && <span className="text-gray-400">—</span>}
              {todays.map((r) => (
                <span
                  key={r._id}
                  className="rounded px-2 py-0.5 text-xs text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.familyName}
                </span>
              ))}
              {dayEvents.map((e) => (
                <span
                  key={e._id}
                  title={`Added by ${e.createdByName}`}
                  className="rounded bg-gray-800 px-2 py-0.5 text-xs text-white"
                >
                  {e.title}
                </span>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

type Family = { _id: Id<"families">; name: string; color: string }

function NewItemForm({
  families,
  onClose,
}: {
  families: Family[]
  onClose: () => void
}) {
  const [kind, setKind] = useState<FormKind>("reservation")
  return (
    <div className="mb-3 rounded border border-gray-300 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex overflow-hidden rounded border border-gray-300 text-xs">
          {(
            [
              ["reservation", "Reservation"],
              ["event", "Event"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-2 py-1 ${kind === k ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          <X />
        </button>
      </div>
      {kind === "reservation" ? (
        <ReservationFields families={families} onClose={onClose} />
      ) : (
        <EventFields onClose={onClose} />
      )}
    </div>
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
  const [satToSat, setSatToSat] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function onStartChange(v: string) {
    setStartDate(v)
    if (satToSat && v) {
      try {
        setEndDate(fmt(addDays(new Date(v + "T00:00:00"), 7)))
      } catch {}
    }
  }

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
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col text-xs">
          <span className="mb-1 font-medium">Family</span>
          <select
            value={familyId}
            onChange={(e) =>
              setFamilyId(e.target.value as Id<"families"> | "new")
            }
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            {families.map((f) => (
              <option key={f._id} value={f._id}>
                {f.name}
              </option>
            ))}
            <option value="new">+ New family…</option>
          </select>
        </label>

        {familyId === "new" && (
          <>
            <label className="flex flex-col text-xs">
              <span className="mb-1 font-medium">Family name</span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Smiths"
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
              />
            </label>
            <div className="flex flex-col text-xs sm:col-span-2">
              <span className="mb-1 font-medium">Color</span>
              <div className="flex flex-wrap items-center gap-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    aria-label={`Color ${c}`}
                    className={`h-6 w-6 rounded-full border-2 ${newColor === c ? "border-gray-900" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="ml-2 h-6 w-8 cursor-pointer rounded border border-gray-300"
                />
              </div>
            </div>
          </>
        )}

        <label className="flex flex-col text-xs">
          <span className="mb-1 font-medium">Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 font-medium">End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setSatToSat(false)
            }}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-xs sm:col-span-2">
          <input
            type="checkbox"
            checked={satToSat}
            onChange={(e) => {
              setSatToSat(e.target.checked)
              if (e.target.checked && startDate) {
                try {
                  setEndDate(fmt(addDays(new Date(startDate + "T00:00:00"), 7)))
                } catch {}
              }
            }}
          />
          <span>Saturday-to-Saturday (auto-set end = start + 7 days)</span>
        </label>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-3 py-1 text-sm"
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
    </form>
  )
}

function EventFields({ onClose }: { onClose: () => void }) {
  const { token } = useAuth()
  const createEvent = useMutation(api.events.create)
  const [date, setDate] = useState(fmt(new Date()))
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (!title.trim()) throw new Error("Title required")
      await createEvent({ token, date, title: title.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col text-xs sm:col-span-2">
          <span className="mb-1 font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Annual lake clean-up"
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs">
          <span className="mb-1 font-medium">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-3 py-1 text-sm"
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
    </form>
  )
}
