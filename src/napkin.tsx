import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { useState } from "react"
import { useTitle } from "./use-title"

const FAMILIES = ["Abbott", "Rice", "Pirie"] as const
const ANCHOR_YEAR = 2026 // 2026 → [Abbott, Rice, Pirie]

function orderFor(year: number): readonly string[] {
  const offset =
    (((year - ANCHOR_YEAR) % FAMILIES.length) + FAMILIES.length) %
    FAMILIES.length
  return FAMILIES.map(
    (_, i) =>
      FAMILIES[
        (((i - offset) % FAMILIES.length) + FAMILIES.length) % FAMILIES.length
      ],
  )
}

export default function Napkin() {
  useTitle("Sacred Napkin")
  const realYear = new Date().getFullYear()
  const [focus, setFocus] = useState(realYear)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
            The Order
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sacred Napkin
          </h1>
          <p className="mt-2 max-w-xl text-[13px] text-neutral-500">
            Each year the families rotate. Three names, one cycle, repeating
            forever.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFocus((y) => y - 1)}
            aria-label="Previous year"
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-border)] bg-white text-neutral-600 hover:border-neutral-400 hover:text-black"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => setFocus(realYear)}
            disabled={focus === realYear}
            className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-black disabled:opacity-50"
          >
            Today
          </button>
          <button
            onClick={() => setFocus((y) => y + 1)}
            aria-label="Next year"
            className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-border)] bg-white text-neutral-600 hover:border-neutral-400 hover:text-black"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </header>

      {/* Three columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {[focus - 1, focus, focus + 1].map((y, i) => (
          <YearCard
            key={y}
            year={y}
            variant={i === 1 ? "focus" : "side"}
            isCurrent={y === realYear}
          />
        ))}
      </div>

      {/* How weeks are chosen */}
      <ChoosingWeeks />
    </main>
  )
}

const RULES: Array<{ title: string; body: string }> = [
  {
    title: "Septs & families",
    body: "Three septs: Pirie (2 families), Rice (3), Abbott (4). Nine families in all.",
  },
  {
    title: "Round 1",
    body: "Each family is entitled to one week, anywhere in the year. Septs choose in napkin order (Pirie picks 2, Rice 3, Abbott 4), and each sept finishes all its weeks before passing.",
  },
  {
    title: "Assignments",
    body: "A family may give its week to another Noconomo family. The handoff must happen before the sept reports to the Scheduling Secretary.",
  },
  {
    title: "Round 2",
    body: "Each sept picks one additional week in the same order. The sept decides which family receives it. Twelve weeks scheduled at most.",
  },
  {
    title: "Open weeks",
    body: "Whatever's left is first come, first served. Noconomo families first, then friends.",
  },
]

function ChoosingWeeks() {
  return (
    <section className="mt-20">
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
          The Rules
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Choosing weeks
        </h2>
      </header>

      <ol className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
        {RULES.map((r, i) => (
          <li
            key={r.title}
            className={[
              "grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-6",
              i > 0 ? "border-t border-[var(--color-border)]" : "",
            ].join(" ")}
          >
            <span className="font-mono text-[11px] tracking-widest text-neutral-400 uppercase tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold tracking-tight text-black">
                {r.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                {r.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function YearCard({
  year,
  variant,
  isCurrent = false,
}: {
  year: number
  variant: "focus" | "side"
  isCurrent?: boolean
}) {
  const order = orderFor(year)
  const isFocus = variant === "focus"

  return (
    <article
      className={[
        "relative flex flex-col rounded-lg p-6 sm:p-8",
        isFocus
          ? "border-2 border-black bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]"
          : "border border-[var(--color-border)] bg-[var(--color-bg-subtle)]",
      ].join(" ")}
    >
      {/* Eyebrow row: always reserved so years align; content only when current */}
      <div className="flex h-4 items-center justify-between">
        {isCurrent ? (
          <>
            <span className="font-mono text-[10px] tracking-widest text-black uppercase">
              This Year
            </span>
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-black" />
          </>
        ) : null}
      </div>

      {/* Year */}
      <div
        className={[
          "mt-2 font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl",
          isFocus ? "text-black" : "text-neutral-300",
        ].join(" ")}
      >
        {year}
      </div>

      {/* Divider */}
      <hr
        className={[
          "my-6",
          isFocus
            ? "border-t border-black/15"
            : "border-t border-[var(--color-border)]",
        ].join(" ")}
      />

      {/* Family list */}
      <ol className="flex flex-col gap-3">
        {order.map((name, i) => (
          <li key={name} className="flex items-baseline gap-4">
            <span
              className={[
                "font-mono text-[11px] tracking-widest tabular-nums uppercase",
                isFocus ? "text-neutral-400" : "text-neutral-300",
              ].join(" ")}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={[
                "text-2xl font-semibold tracking-tight sm:text-3xl",
                isFocus ? "text-black" : "text-neutral-300",
              ].join(" ")}
            >
              {name}
            </span>
          </li>
        ))}
      </ol>
    </article>
  )
}
