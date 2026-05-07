import { useQuery } from "convex/react"
import { Link } from "react-router"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import { SignIn } from "./sign-in"
import { useTitle } from "./use-title"

export default function App() {
  useTitle("Noconomo")
  const { token, user } = useAuth()
  const bulletins = useQuery(api.bulletins.list, token ? { token } : "skip")

  if (user === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    )
  }
  if (user === null) return <SignIn />

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header>
        <p className="mb-3 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
          Bulletin Board
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          What's new.
        </h1>
      </header>

      <section className="mt-10 border-l border-[var(--color-border-strong)] pl-6">
        {bulletins === undefined ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : bulletins.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing posted yet.</p>
        ) : (
          <ul className="space-y-4">
            {bulletins.map((b) => (
              <li key={b._id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-neutral-400"
                />
                <p className="flex-1 text-[15px] leading-relaxed whitespace-pre-wrap">
                  {b.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <Link
          to="/bulletins"
          className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-2 text-[13px] font-medium text-neutral-900 hover:bg-[var(--color-bg-muted)]"
        >
          Add or edit notes
        </Link>
      </div>

      <footer className="mt-16 text-[13px] text-neutral-500">
        Contact Nathaniel Davis (nate@qstreet.org) with any bugs or thoughts
        about the site.
      </footer>
    </main>
  )
}
