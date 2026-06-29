import { useMutation, useQuery } from "convex/react"
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react"
import { Navigate } from "react-router"
import { api } from "../convex/_generated/api"
import type { Doc } from "../convex/_generated/dataModel"

const TOKEN_KEY = "auth_token"

type AuthCtx = {
  user: Doc<"users"> | null | undefined
  token: string | null
  requestCode: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
  clearSession: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const queriedUser = useQuery(api.auth.me, { token })
  const user = token ? queriedUser : null
  const request = useMutation(api.auth.requestCode)
  const verify = useMutation(api.auth.verifyCode)
  const signOutMut = useMutation(api.auth.signOut)

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }, [token])

  useEffect(() => {
    if (token && queriedUser === null) setToken(null)
  }, [token, queriedUser])

  const clearSession = useCallback(() => {
    setToken(null)
  }, [])

  const requestCode = useCallback(
    async (email: string) => {
      await request({ email })
    },
    [request],
  )

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      const { token: t } = await verify({ email, code })
      setToken(t)
    },
    [verify],
  )

  const signOut = useCallback(async () => {
    const currentToken = token
    setToken(null)
    if (!currentToken) return
    try {
      await signOutMut({ token: currentToken })
    } catch {
      // The local session is already cleared.
    }
  }, [token, signOutMut])

  return (
    <Ctx.Provider
      value={{ user, token, requestCode, verifyCode, signOut, clearSession }}
    >
      {children}
    </Ctx.Provider>
  )
}

function isAuthExpiredError(error: unknown) {
  return error instanceof Error && error.message.includes("Not authenticated")
}

type AuthErrorBoundaryProps = {
  children: ReactNode
  onAuthExpired: () => void
}

type AuthErrorBoundaryState = {
  error: Error | null
}

class AuthErrorBoundaryInner extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  state: AuthErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isAuthExpiredError(error)) {
      this.props.onAuthExpired()
      return
    }
    console.error(error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const authExpired = isAuthExpiredError(error)
    return (
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-brown">
          {authExpired ? "Session expired" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {authExpired
            ? "Please sign in again to continue."
            : "Refresh the page and try again."}
        </p>
        <button
          type="button"
          onClick={() => {
            if (authExpired) this.props.onAuthExpired()
            this.setState({ error: null })
          }}
          className="mt-6 rounded-full bg-sage px-5 py-2 text-sm font-semibold text-white hover:bg-sage-hover"
        >
          {authExpired ? "Return to sign in" : "Try again"}
        </button>
      </main>
    )
  }
}

export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  const { token, clearSession } = useAuth()
  return (
    <AuthErrorBoundaryInner
      key={token ?? "signed-out"}
      onAuthExpired={clearSession}
    >
      {children}
    </AuthErrorBoundaryInner>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="p-4">Loading…</div>
  if (user === null) return <Navigate to="/" replace />
  return <>{children}</>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAuth must be used within AuthProvider")
  return v
}
