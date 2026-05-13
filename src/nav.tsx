import { NavLink, useNavigate } from "react-router"
import { useAuth } from "./auth"

export function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
      isActive
        ? "bg-sage-soft text-sage-hover"
        : "text-fg-muted hover:text-brown",
    ].join(" ")

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-3 sm:px-6">
        <NavLink
          to="/"
          end
          className="mr-1 flex shrink-0 items-center gap-2 font-display text-lg text-brown sm:mr-4"
        >
          <img src="/logo.svg" alt="" aria-hidden className="h-7 w-7" />
          <span className="hidden sm:inline">Noconomo</span>
        </NavLink>

        {user && (
          <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1">
            <NavLink to="/calendar" className={linkClass}>
              Calendar
            </NavLink>
            <NavLink to="/members" className={linkClass}>
              Members
            </NavLink>
            <NavLink to="/gallery" className={linkClass}>
              Gallery
            </NavLink>
            {/* <NavLink to="/store" className={linkClass}>
              Store
            </NavLink> */}
            <NavLink to="/guide" className={linkClass}>
              Guide
            </NavLink>
            <NavLink to="/documents" className={linkClass}>
              Documents
            </NavLink>
            {/* <NavLink to="/expenses" className={linkClass}>
              Expenses
            </NavLink> */}
            <NavLink to="/napkin" className={linkClass}>
              Napkin
            </NavLink>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3">
          {user && (
            <>
              <button
                type="button"
                onClick={() =>
                  navigate("/members", { state: { editSelf: true } })
                }
                className="hidden rounded-full px-2 py-1 text-sm text-fg-muted hover:text-brown lg:inline-block"
              >
                {user.name}
              </button>
              <button
                onClick={signOut}
                className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover sm:px-3.5"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
