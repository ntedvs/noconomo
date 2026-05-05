import { NavLink } from "react-router"
import { useAuth } from "./auth"

export function Nav() {
  const { user, signOut } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative shrink-0 whitespace-nowrap px-2.5 py-1.5 text-[13px] tracking-tight transition-colors sm:px-3",
      isActive ? "text-black" : "text-neutral-500 hover:text-black",
    ].join(" ")

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-3 sm:px-6">
        <NavLink
          to="/"
          end
          className="mr-1 flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight sm:mr-4"
        >
          <img src="/logo.svg" alt="" aria-hidden className="h-6 w-6" />
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
            <NavLink to="/store" className={linkClass}>
              Store
            </NavLink>
            <NavLink to="/handbook" className={linkClass}>
              Handbook
            </NavLink>
            <NavLink to="/documents" className={linkClass}>
              Documents
            </NavLink>
            <NavLink to="/expenses" className={linkClass}>
              Expenses
            </NavLink>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3">
          {user && (
            <>
              <span className="hidden text-[13px] text-neutral-500 lg:inline">
                {user.name}
              </span>
              <button
                onClick={signOut}
                className="rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:text-black sm:px-3"
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
