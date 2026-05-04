import { Link } from "react-router"
import { useTitle } from "./use-title"

export default function NotFound() {
  useTitle("404")
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-gray-600">This page doesn't exist.</p>
      <Link to="/" className="rounded border px-3 py-1 hover:bg-gray-50">
        Go home
      </Link>
    </div>
  )
}
