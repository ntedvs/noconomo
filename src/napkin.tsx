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
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Sacred Napkin</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-fg-muted">
          Each year the families rotate. Three names, one cycle, repeating
          forever.
        </p>
      </header>

      <div className="mt-10 flex items-center justify-center gap-2">
        <button
          onClick={() => setFocus((y) => y - 1)}
          aria-label="Previous year"
          className="grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-paper text-brown hover:border-sage hover:text-sage-hover"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <button
          onClick={() => setFocus(realYear)}
          disabled={focus === realYear}
          className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover disabled:opacity-40"
        >
          Today
        </button>
        <button
          onClick={() => setFocus((y) => y + 1)}
          aria-label="Next year"
          className="grid h-9 w-9 place-items-center rounded-full border border-border-strong bg-paper text-brown hover:border-sage hover:text-sage-hover"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Three columns */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {[focus - 1, focus, focus + 1].map((y, i) => (
          <YearCard
            key={y}
            year={y}
            variant={i === 1 ? "focus" : "side"}
            isCurrent={y === realYear}
          />
        ))}
      </div>

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
      <header className="text-center">
        <h2 className="font-display text-3xl sm:text-4xl">Choosing weeks</h2>
      </header>

      <ol className="mt-8 overflow-hidden rounded-md border border-border bg-paper shadow-[0_1px_0_rgba(89,74,66,0.04)]">
        {RULES.map((r, i) => (
          <li
            key={r.title}
            className={[
              "grid grid-cols-[40px_minmax(0,1fr)] gap-4 px-5 py-5 sm:px-6",
              i > 0 ? "border-t border-border" : "",
            ].join(" ")}
          >
            <span className="font-display text-2xl text-fg-subtle tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg text-brown">{r.title}</h3>
              <p className="mt-1 text-base text-fg-muted">{r.body}</p>
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
        "relative flex flex-col rounded-md p-6 sm:p-7",
        isFocus
          ? "border border-sage bg-paper shadow-[0_8px_30px_-12px_rgba(120,145,109,0.35)]"
          : "border border-border bg-bg-subtle",
      ].join(" ")}
    >
      {/* Eyebrow row: always reserved so years align; content only when current */}
      <div className="flex h-5 items-center justify-between">
        {isCurrent ? (
          <>
            <span className="text-xs font-semibold text-sage-hover">
              This year
            </span>
            <span className="grid h-1.5 w-1.5 place-items-center rounded-full bg-sage" />
          </>
        ) : null}
      </div>

      {/* Year */}
      <div
        className={[
          "mt-2 font-display text-5xl tabular-nums sm:text-6xl",
          isFocus ? "text-brown" : "text-fg-subtle",
        ].join(" ")}
      >
        {year}
      </div>

      <hr
        className={[
          "my-5",
          isFocus ? "border-t border-border-strong" : "border-t border-border",
        ].join(" ")}
      />

      {/* Family list */}
      <ol className="flex flex-col gap-3">
        {order.map((name, i) => (
          <li key={name} className="flex items-baseline gap-4">
            <span
              className={[
                "text-sm tabular-nums",
                isFocus ? "text-fg-subtle" : "text-fg-subtle/60",
              ].join(" ")}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={[
                "font-display text-2xl sm:text-3xl",
                isFocus ? "text-brown" : "text-fg-subtle",
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
