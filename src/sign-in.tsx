import { CheckCircle, WarningCircle } from "@phosphor-icons/react"
import { useState } from "react"
import { useAuth } from "./auth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function friendlyError(e: unknown, step: "email" | "code"): string {
  const raw = e instanceof Error ? e.message : String(e)
  // Strip Convex wrapper: "[CONVEX M(...)] ... Error: <message>\n    at ..."
  const stripped = raw
    .replace(/^\[CONVEX[^\]]*\]\s*/i, "")
    .replace(/^.*?Error:\s*/, "")
    .split("\n")[0]
    .trim()

  const lower = stripped.toLowerCase()
  if (lower.includes("invalid email")) {
    return "That doesn't look like a valid email."
  }
  if (lower.includes("invalid or expired code")) {
    return "That code didn't work. Check the latest email or request a new one."
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Couldn't reach the server. Check your connection and try again."
  }
  return step === "email"
    ? "Couldn't send a code. Try again in a moment."
    : "Couldn't verify the code. Try again in a moment."
}

export function SignIn() {
  const { requestCode, verifyCode } = useAuth()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const validEmail = EMAIL_RE.test(email.trim())
  const validCode = /^\d{6}$/.test(code)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setInfo(null)
    if (step === "email" && !validEmail) {
      setErr("Enter a valid email address.")
      return
    }
    if (step === "code" && !validCode) {
      setErr("Enter the 6-digit code from your email.")
      return
    }
    setBusy(true)
    try {
      if (step === "email") {
        await requestCode(email.trim())
        setStep("code")
        setInfo(`Code sent to ${email.trim()}.`)
      } else {
        await verifyCode(email.trim(), code)
      }
    } catch (e) {
      setErr(friendlyError(e, step))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setErr(null)
    setInfo(null)
    setResending(true)
    try {
      await requestCode(email.trim())
      setCode("")
      setInfo("New code sent. Check your inbox.")
    } catch (e) {
      setErr(friendlyError(e, "email"))
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 py-14 sm:py-20">
      <header className="text-center">
        <img
          src="/logo.svg"
          alt=""
          aria-hidden
          className="mx-auto mb-6 h-12 w-12"
        />
        <h1 className="font-display text-4xl sm:text-5xl">
          Sign in to Noconomo
        </h1>
        <p className="mt-3 text-sm text-fg-muted">
          {step === "email"
            ? "Enter your email to receive a verification code."
            : `We sent a 6-digit code to ${email.trim()}.`}
        </p>
      </header>

      <form
        onSubmit={submit}
        noValidate
        className="mt-10 rounded-md border border-border bg-paper p-6 shadow-[0_1px_0_rgba(89,74,66,0.04)]"
      >
        {step === "email" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brown">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (err) setErr(null)
              }}
              aria-invalid={err ? true : undefined}
              required
              autoFocus
              autoComplete="email"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-base"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-brown">
              Verification code
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                if (err) setErr(null)
              }}
              aria-invalid={err ? true : undefined}
              required
              autoFocus
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-center font-mono text-lg tracking-[0.5em]"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={
            busy || (step === "email" ? !validEmail : !validCode) || resending
          }
          className="mt-5 w-full rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"
        >
          {busy ? "Working…" : step === "email" ? "Email me a code" : "Verify"}
        </button>

        {step === "code" && (
          <div className="mt-3 flex items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setCode("")
                setErr(null)
                setInfo(null)
              }}
              className="text-fg-muted hover:text-brown"
            >
              Use a different email
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={resending || busy}
              className="text-fg-muted hover:text-brown disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        )}

        {err && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-border bg-bg-subtle px-3 py-2 text-sm text-danger"
          >
            <WarningCircle size={14} weight="fill" className="mt-1 shrink-0" />
            <span>{err}</span>
          </p>
        )}
        {!err && info && (
          <p className="mt-4 flex items-start gap-2 rounded-md border border-border bg-sage-soft px-3 py-2 text-sm text-sage-hover">
            <CheckCircle size={14} weight="fill" className="mt-1 shrink-0" />
            <span>{info}</span>
          </p>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Members only. Contact Nathaniel Davis if you need access.
      </p>
    </main>
  )
}
