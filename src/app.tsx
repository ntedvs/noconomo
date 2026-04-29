import { useEffect } from "react"
import { useAuth } from "./auth"
import { SignIn } from "./sign-in"

export default function App() {
  useEffect(() => {
    document.title = "Noconomo"
  }, [])
  const { user, signOut } = useAuth()
  if (user === undefined) return <div>Loading…</div>
  if (user === null) return <SignIn />
  return (
    <div>
      <p>Hello, {user.name}</p>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}
