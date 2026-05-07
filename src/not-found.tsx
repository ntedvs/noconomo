import { Link } from "react-router"
import { useTitle } from "./use-title"

export default function NotFound() {
  useTitle("404")
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-4">
        <span className="text-5xl font-semibold tracking-tight">404</span>
        <span className="h-8 w-px bg-[var(--color-border)]" />
        <span className="text-sm text-neutral-500">
          This page does not exist.
        </span>
      </div>
      <Link
        to="/"
        className="rounded-md bg-black px-4 py-2 text-[13px] font-medium text-white hover:bg-neutral-800"
      >
        Return home
      </Link>
    </div>
  )
}
