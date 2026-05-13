import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import type { GuideContent } from "./guide-types"

export default function Guide() {
  const { token } = useAuth()
  const stored = useQuery(api.guide.get, { token })

  if (stored === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 text-sm text-fg-subtle sm:py-20">
        Loading…
      </main>
    )
  }
  if (stored === null) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 text-base text-fg-muted sm:py-20">
        No guide content yet.
      </main>
    )
  }
  const c = stored as GuideContent

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Guide</h1>
      </header>

      <article className="mt-12 space-y-10 text-fg">
        <section>
          <h2 className="font-display text-xl text-brown">Address</h2>
          <p className="mt-2">{c.address}</p>
        </section>

        <section>
          <h2 className="font-display text-xl text-brown">Wifi</h2>
          <p className="mt-2">
            <span className="font-semibold text-brown">Network:</span>{" "}
            {c.wifiName || "-"}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-brown">Password:</span>{" "}
            {c.wifiPassword || "-"}
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-brown">Officers</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            {c.officers.map((o, i) => (
              <li key={i}>
                <span className="font-semibold text-brown">{o.role}:</span>{" "}
                {o.name}
              </li>
            ))}
          </ul>
        </section>

        {(c.faqs ?? []).length > 0 && (
          <section>
            <h2 className="font-display text-xl text-brown">FAQ</h2>
            <ul className="mt-4 space-y-3">
              {(c.faqs ?? []).map((f, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)]"
                >
                  <div className="font-display text-lg text-brown">
                    {f.question}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-fg-muted">
                    {f.answer}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl text-brown">Service Providers</h2>
          <ul className="mt-4 space-y-3">
            {c.serviceProviders.map((s, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-paper px-5 py-4 shadow-[0_1px_0_rgba(89,74,66,0.04)]"
              >
                <div className="font-display text-lg text-brown">
                  {s.service}
                </div>
                <dl className="mt-2 space-y-1 text-sm text-fg-muted">
                  {s.provider && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Provider:
                      </dt>{" "}
                      <dd className="inline">{s.provider}</dd>
                    </div>
                  )}
                  {s.contact && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Contact:
                      </dt>{" "}
                      <dd className="inline">{s.contact}</dd>
                    </div>
                  )}
                  {s.phone && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Phone:
                      </dt>{" "}
                      <dd className="inline">{s.phone}</dd>
                    </div>
                  )}
                  {s.email && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Email:
                      </dt>{" "}
                      <dd className="inline">{s.email}</dd>
                    </div>
                  )}
                  {s.website && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Website:
                      </dt>{" "}
                      <dd className="inline">
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sage-hover hover:underline"
                        >
                          {s.website.replace(/^https?:\/\//, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                  {s.account && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Account:
                      </dt>{" "}
                      <dd className="inline">{s.account}</dd>
                    </div>
                  )}
                  {s.notes && (
                    <div>
                      <dt className="inline font-semibold text-brown">
                        Notes:
                      </dt>{" "}
                      <dd className="inline">{s.notes}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  )
}
