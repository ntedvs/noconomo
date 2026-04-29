import { useState } from "react"
import { useAuth } from "./auth"

export function SignIn() {
  const { requestCode, verifyCode } = useAuth()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (step === "email") {
        await requestCode(email)
        setStep("code")
      } else {
        await verifyCode(email, code)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      {step === "email" ? (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      ) : (
        <input
          type="text"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      )}
      <button type="submit" disabled={busy}>
        {step === "email" ? "Send code" : "Verify"}
      </button>
      {err && <p>{err}</p>}
    </form>
  )
}
