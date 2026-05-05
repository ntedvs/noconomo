import { Link } from "react-router"
import { useAuth } from "./auth"
import { SignIn } from "./sign-in"
import { useTitle } from "./use-title"

export default function App() {
  useTitle("Noconomo")
  const { user } = useAuth()

  if (user === undefined) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-neutral-500">
        Loading…
      </div>
    )
  }
  if (user === null) return <SignIn />

  const tiles: Array<{ to: string; title: string; desc: string }> = [
    { to: "/calendar", title: "Calendar", desc: "Reservations and events." },
    { to: "/members", title: "Members", desc: "Family directory." },
    { to: "/gallery", title: "Gallery", desc: "Photos from the lake." },
    { to: "/store", title: "Store", desc: "Shared supplies and goods." },
    { to: "/handbook", title: "Handbook", desc: "House rules and contacts." },
    { to: "/documents", title: "Documents", desc: "Important files." },
    { to: "/expenses", title: "Expenses", desc: "Shared costs and ledger." },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="py-16">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
          Welcome back
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Hello, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-neutral-500">
          Everything for the cottage, in one place.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group flex flex-col justify-between gap-6 bg-white p-6 transition-colors hover:bg-[var(--color-bg-subtle)]"
          >
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                {t.title}
              </h2>
              <p className="mt-1 text-[13px] text-neutral-500">{t.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
