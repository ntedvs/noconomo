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
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-fg-subtle">
        Loading…
      </div>
    )
  }
  if (user === null) return <SignIn />

  return (
    <main className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">What&rsquo;s new</h1>
      </header>

      <section className="mt-12">
        {bulletins === undefined ? (
          <p className="text-center text-sm text-fg-subtle">Loading…</p>
        ) : bulletins.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-12 text-center">
            <p className="font-display text-lg text-brown">
              Nothing posted yet
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              Be the first to share something.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {bulletins.map((b) => (
              <li
                key={b._id}
                className="rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]"
              >
                <p className="text-base whitespace-pre-wrap text-fg">
                  {b.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex justify-center">
        <Link
          to="/bulletins"
          className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover"
        >
          Add or edit notes
          <span aria-hidden>→</span>
        </Link>
      </div>

      <footer className="mt-20 border-t border-border pt-6 text-center text-sm text-fg-muted">
        Questions or ideas? Contact Nathaniel Davis (nate@qstreet.org).
      </footer>
    </main>
  )
}
