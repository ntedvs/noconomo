import { Link } from "react-router"
import { useTitle } from "./use-title"

export default function NotFound() {
  useTitle("404")
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center gap-6 px-5 py-14 text-center">
      <h1 className="font-display text-5xl sm:text-6xl">Not found</h1>
      <p className="text-base text-fg-muted">This page does not exist.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover"
      >
        Return home
        <span aria-hidden>→</span>
      </Link>
    </main>
  )
}
