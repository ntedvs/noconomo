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
              : `We sent a 6-digit code to ${email.trim()}.`}
          </p>
        </div>

        <form
          onSubmit={submit}
          noValidate
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
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (err) setErr(null)
                }}
                aria-invalid={err ? true : undefined}
                required
                autoFocus
                autoComplete="email"
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
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  if (err) setErr(null)
                }}
                aria-invalid={err ? true : undefined}
                required
                autoFocus
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.5em]"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={
              busy || (step === "email" ? !validEmail : !validCode) || resending
            }
            className="mt-4 w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : step === "email"
                ? "Email me a code"
                : "Verify"}
          </button>

          {step === "code" && (
            <div className="mt-2 flex items-center justify-between gap-2 text-[13px]">
              <button
                type="button"
                onClick={() => {
                  setStep("email")
                  setCode("")
                  setErr(null)
                  setInfo(null)
                }}
                className="rounded-md px-2 py-1 text-neutral-500 hover:text-black"
              >
                Use a different email
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={resending || busy}
                className="rounded-md px-2 py-1 text-neutral-500 hover:text-black disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </div>
          )}

          {err && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              <WarningCircle
                size={14}
                weight="fill"
                className="mt-0.5 shrink-0"
              />
              <span>{err}</span>
            </p>
          )}
          {!err && info && (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              <CheckCircle
                size={14}
                weight="fill"
                className="mt-0.5 shrink-0"
              />
              <span>{info}</span>
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
