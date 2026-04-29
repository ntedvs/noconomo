import { useMutation, useQuery } from "convex/react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const user = useQuery(api.auth.me, { token })
  const request = useMutation(api.auth.requestCode)
  const verify = useMutation(api.auth.verifyCode)
  const signOutMut = useMutation(api.auth.signOut)

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }, [token])

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
    if (token) await signOutMut({ token })
    setToken(null)
  }, [token, signOutMut])

  return (
    <Ctx.Provider value={{ user, token, requestCode, verifyCode, signOut }}>
      {children}
    </Ctx.Provider>
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
