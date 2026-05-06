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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[var(--color-bg-subtle)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt=""
            aria-hidden
            className="mx-auto mb-5 h-10 w-10"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to Noconomo
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            {step === "email"
              ? "Enter your email to receive a verification code."
              : `We sent a 6-digit code to ${email}.`}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          {step === "email" ? (
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-neutral-700">
                Email
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-neutral-700">
                Verification code
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                maxLength={6}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.5em]"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : step === "email"
                ? "Email me a code"
                : "Verify"}
          </button>

          {step === "code" && (
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setCode("")
                setErr(null)
              }}
              className="mt-2 w-full rounded-md px-3 py-2 text-[13px] text-neutral-500 hover:text-black"
            >
              Use a different email
            </button>
          )}

          {err && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {err}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-[12px] text-neutral-500">
          Members only. Contact Nathaniel Davis if you need access.
        </p>
      </div>
    </div>
  )
}
