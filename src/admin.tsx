import { Link } from "react-router"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

const pages: { to: string; title: string; description: string }[] = [
  {
    to: "/admin/guide",
    title: "Guide",
    description: "Edit address, wifi, officers, FAQ, and service providers.",
  },
  {
    to: "/admin/email",
    title: "Send email",
    description: "Send a message to all members.",
  },
]

export default function Admin() {
  useTitle("Admin")
  const { user } = useAuth()

  if (user === undefined)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-sm text-fg-subtle">
        Loading…
      </div>
    )
  if (user === null)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-base text-fg-muted">
        You must be signed in to access admin.
      </div>
    )
  if (!user.admin)
    return (
      <div className="mx-auto max-w-3xl px-5 py-14 text-base text-fg-muted">
        You don't have admin access. Ask an admin to grant it.
      </div>
    )

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl">Admin</h1>
      </header>

      <ul className="mt-10 space-y-3">
        {pages.map((p) => (
          <li key={p.to}>
            <Link
              to={p.to}
              className="block rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)]"
            >
              <p className="font-display text-xl text-brown">{p.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
