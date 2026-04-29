import { NavLink } from "react-router"
import { useAuth } from "./auth"

export function Nav() {
  const { user, signOut } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1 rounded ${isActive ? "bg-gray-200" : "hover:bg-gray-100"}`

  return (
    <nav className="flex items-center gap-2 border-b px-4 py-2">
      <NavLink to="/" className={linkClass} end>
        Home
      </NavLink>
      {user && (
        <>
          <NavLink to="/calendar" className={linkClass}>
            Calendar
          </NavLink>
          <NavLink to="/members" className={linkClass}>
            Members
          </NavLink>
          <NavLink to="/gallery" className={linkClass}>
            Gallery
          </NavLink>
          <NavLink to="/handbook" className={linkClass}>
            Handbook
          </NavLink>
          <NavLink to="/store" className={linkClass}>
            Store
          </NavLink>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={signOut}
              className="rounded px-2 py-1 hover:bg-gray-100"
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </nav>
  )
}
