import { List, X } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { useAuth } from "./auth"

export function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
      isActive
        ? "bg-sage-soft text-sage-hover"
        : "text-fg-muted hover:text-brown",
    ].join(" ")

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block rounded-md px-3 py-2.5 text-base font-medium transition-colors",
      isActive
        ? "bg-sage-soft text-sage-hover"
        : "text-brown hover:bg-paper hover:text-sage-hover",
    ].join(" ")

  const links = [
    { to: "/calendar", label: "Calendar" },
    { to: "/members", label: "Members" },
    { to: "/gallery", label: "Gallery" },
    { to: "/guide", label: "Guide" },
    { to: "/documents", label: "Documents" },
    { to: "/napkin", label: "Napkin" },
  ]

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
          <div className="hidden min-w-0 flex-1 items-center gap-0.5 sm:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={desktopLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3">
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
                className="hidden rounded-full border border-border-strong bg-paper px-3 py-1.5 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover sm:inline-flex sm:px-3.5"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brown hover:bg-paper sm:hidden"
              >
                {menuOpen ? <X size={22} /> : <List size={22} />}
              </button>
            </>
          )}
        </div>
      </div>

      {user && menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-14 z-30 bg-black/20 sm:hidden"
          />
          <div
            id="mobile-nav-menu"
            className="absolute inset-x-0 top-full z-40 border-b border-border bg-bg shadow-lg sm:hidden"
          >
            <div className="flex flex-col gap-1 px-3 py-3">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={mobileLinkClass}>
                  {l.label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-border" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate("/members", { state: { editSelf: true } })
                }}
                className="rounded-md px-3 py-2.5 text-left text-base text-fg-muted hover:bg-paper hover:text-brown"
              >
                {user.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="rounded-md px-3 py-2.5 text-left text-base font-semibold text-brown hover:bg-paper hover:text-sage-hover"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
