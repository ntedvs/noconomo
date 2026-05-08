import { useQuery } from "convex/react"
import { api } from "../convex/_generated/api"
import { useAuth } from "./auth"
import { handbookDefaults, type HandbookContent } from "./handbook-defaults"

export default function Handbook() {
  const { token } = useAuth()
  const stored = useQuery(api.handbook.get, { token })
  const c: HandbookContent =
    stored === undefined || stored === null
      ? handbookDefaults
      : (stored as HandbookContent)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Handbook</h1>
      <h2 className="mt-4 text-xl font-semibold">Address</h2>
      <p>{c.address}</p>
      <h2 className="mt-4 text-xl font-semibold">Phone Number</h2>
      <p>{c.phoneNumber}</p>
      <h2 className="mt-4 text-xl font-semibold">Wifi</h2>
      <p>
        <span className="font-medium">Network:</span> {c.wifiName || "—"}
      </p>
      <p>
        <span className="font-medium">Password:</span> {c.wifiPassword || "—"}
      </p>
      <h2 className="mt-4 text-xl font-semibold">Officers</h2>
      <ul className="mt-2 list-disc pl-6">
        {c.officers.map((o, i) => (
          <li key={i}>
            <span className="font-medium">{o.role}:</span> {o.name}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-xl font-semibold">Trash and Recycling</h2>
      <ul className="mt-2 list-disc pl-6">
        {c.trashAndRecycling.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-xl font-semibold">Service Providers</h2>
      <ul className="mt-2 space-y-3">
        {c.serviceProviders.map((s, i) => (
          <li key={i}>
            <div className="font-semibold">{s.service}</div>
            <dl className="mt-1 pl-6 text-sm text-gray-700">
              {s.provider && (
                <div>
                  <dt className="inline font-medium">Provider:</dt>{" "}
                  <dd className="inline">{s.provider}</dd>
                </div>
              )}
              {s.contact && (
                <div>
                  <dt className="inline font-medium">Contact:</dt>{" "}
                  <dd className="inline">{s.contact}</dd>
                </div>
              )}
              {s.phone && (
                <div>
                  <dt className="inline font-medium">Phone:</dt>{" "}
                  <dd className="inline">{s.phone}</dd>
                </div>
              )}
              {s.email && (
                <div>
                  <dt className="inline font-medium">Email:</dt>{" "}
                  <dd className="inline">
                    <a
                      href={`mailto:${s.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.email}
                    </a>
                  </dd>
                </div>
              )}
              {s.website && (
                <div>
                  <dt className="inline font-medium">Website:</dt>{" "}
                  <dd className="inline">
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {s.website.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              )}
              {s.account && (
                <div>
                  <dt className="inline font-medium">Account:</dt>{" "}
                  <dd className="inline">{s.account}</dd>
                </div>
              )}
              {s.notes && (
                <div>
                  <dt className="inline font-medium">Notes:</dt>{" "}
                  <dd className="inline">{s.notes}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
