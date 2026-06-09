import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import { useTitle } from "./use-title"

export default function AdminArchive() {
  useTitle("Email archive")
  const { token, user } = useAuth()
  const archive = useQuery(
    api.emailArchive.list,
    user?.admin ? { token } : "skip",
  )

  if (user === undefined)
    return (
      <div className="mx-auto max-w-4xl px-5 py-14 text-sm text-fg-subtle">
        Loading…
      </div>
    )
  if (user === null)
    return (
      <div className="mx-auto max-w-4xl px-5 py-14 text-base text-fg-muted">
        You must be signed in to access admin.
      </div>
    )
  if (!user.admin)
    return (
      <div className="mx-auto max-w-4xl px-5 py-14 text-base text-fg-muted">
        You don't have admin access. Ask an admin to grant it.
      </div>
    )

  return (
    <main className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Email archive</h1>
          <p className="mt-3 text-sm text-fg-muted">
            Recent broadcasts sent from the admin email page.
          </p>
        </div>
        <span className="text-sm text-fg-subtle">
          {archive ? `${archive.length} shown` : "Loading…"}
        </span>
      </header>

      <div className="mt-10 space-y-3">
        {archive === undefined ? (
          <div className="rounded-md border border-border bg-paper px-4 py-3 text-sm text-fg-subtle">
            Loading archive…
          </div>
        ) : archive.length === 0 ? (
          <div className="rounded-md border border-border bg-paper px-4 py-3 text-sm text-fg-muted">
            No emails have been sent yet.
          </div>
        ) : (
          archive.map((email) => (
            <article
              key={email._id}
              className="rounded-md border border-border bg-paper px-4 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl text-brown">
                    {email.subject}
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    {formatSentAt(email._creationTime)} by {email.sentByName}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-bg-subtle px-3 py-1 text-xs font-semibold text-fg-muted">
                  {audienceLabel(email.audience)}
                </div>
              </div>

              <p className="mt-3 text-sm whitespace-pre-wrap text-fg">
                {email.body}
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-fg-muted">
                <span>
                  Sent {email.sentCount} of {email.recipientCount}
                </span>
                {email.failedCount > 0 && (
                  <span className="text-danger">
                    Failed {email.failedCount}
                  </span>
                )}
                {email.attachments.length > 0 && (
                  <span>
                    {email.attachments.length} attachment
                    {email.attachments.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {email.attachments.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-fg-muted">
                  {email.attachments.map((attachment, index) => (
                    <li
                      key={`${attachment.filename}-${index}`}
                      className="max-w-full truncate rounded-md border border-border bg-bg px-2 py-1"
                    >
                      {attachment.filename}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  )
}

function audienceLabel(audience: "all" | "shareholders" | "directors") {
  if (audience === "shareholders") return "Shareholders"
  if (audience === "directors") return "Directors"
  return "Everyone"
}

function formatSentAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}
