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
    <div className="p-4">
      <h1 className="text-2xl font-bold">Handbook</h1>
      <h2 className="mt-4 text-xl font-semibold">Address</h2>
      <p>{c.address}</p>
      <h2 className="mt-4 text-xl font-semibold">Phone Number</h2>
      <p>{c.phoneNumber}</p>
      <h2 className="mt-4 text-xl font-semibold">Officers</h2>
      <ul className="mt-2 list-disc pl-6">
        {c.officers.map((o, i) => (
          <li key={i}>
            <span className="font-medium">{o.role}:</span> {o.name}
          </li>
        ))}
      </ul>
      <h2 className="mt-4 text-xl font-semibold">Choosing Weeks</h2>
      <p className="mt-2">{c.choosingWeeksIntro}</p>
      <ul className="mt-2 list-disc pl-6">
        {c.choosingWeeksBullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-xl font-semibold">Trash and Recycling</h2>
      <ul className="mt-2 list-disc pl-6">
        {c.trashAndRecycling.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <h2 className="mt-4 text-xl font-semibold">Service Providers</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="border px-2 py-1">Service</th>
              <th className="border px-2 py-1">Provider</th>
              <th className="border px-2 py-1">Contact</th>
              <th className="border px-2 py-1">Phone Number</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Website</th>
              <th className="border px-2 py-1">Account Number</th>
              <th className="border px-2 py-1">Notes</th>
            </tr>
          </thead>
          <tbody>
            {c.serviceProviders.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="border px-2 py-1">{s.service}</td>
                <td className="border px-2 py-1">{s.provider}</td>
                <td className="border px-2 py-1">{s.contact}</td>
                <td className="border px-2 py-1 whitespace-nowrap">
                  {s.phone}
                </td>
                <td className="border px-2 py-1">
                  {s.email && (
                    <a
                      href={`mailto:${s.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.email}
                    </a>
                  )}
                </td>
                <td className="border px-2 py-1">
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {s.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </td>
                <td className="border px-2 py-1">{s.account}</td>
                <td className="border px-2 py-1">{s.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
