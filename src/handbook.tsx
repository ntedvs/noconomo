import { useTitle } from "./use-title"

type Section = {
  id: string
  title: string
  body: React.ReactNode
}

type Provider = {
  service: string
  name: string
  phone: string
  account?: string
}

const PROVIDERS: Provider[] = [
  {
    service: "Plumbing",
    name: "Bryan Gallagher",
    phone: "(603) 569-3768",
    account: "354 Sewall Rd",
  },
  {
    service: "Water",
    name: "Municipal Water",
    phone: "(603) 569-8176",
    account: "14-0878.300",
  },
  {
    service: "Trash",
    name: "Casella",
    phone: "(800) 445-1318",
    account: "79-47066 0",
  },
  {
    service: "Electricity",
    name: "Municipal Electric",
    phone: "(603) 569-8150",
    account: "05-4275.000",
  },
  {
    service: "Telephone",
    name: "Consolidated Comm.",
    phone: "(844) 968-7224",
    account: "603-569-3623-995",
  },
  { service: "Attorney", name: "George Walker", phone: "(603) 569-2000" },
  { service: "Accountant", name: "Evan Stowell", phone: "(603) 749-2700" },
  { service: "Roofer", name: "Eric Clifford", phone: "(603) 556-1284" },
  { service: "Structural", name: "Roy Darling", phone: "(603) 556-0360" },
  { service: "Insurance", name: "Avery Insurance", phone: "(603) 569-2515" },
  { service: "Dock", name: "WMC", phone: "(603) 875-7768" },
]

const SECTIONS: Section[] = [
  {
    id: "address",
    title: "Address",
    body: (
      <>
        <p>354 Sewall Rd., Wolfeboro, NH 03894</p>
        <p className="text-gray-700">
          Property Manager: Ben Muchler — 617-824-0742
        </p>
      </>
    ),
  },
  {
    id: "providers",
    title: "Service Providers",
    body: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600">
              <th className="py-2 pr-4 font-medium">Service</th>
              <th className="py-2 pr-4 font-medium">Provider</th>
              <th className="py-2 pr-4 font-medium">Phone</th>
              <th className="py-2 font-medium">Account #</th>
            </tr>
          </thead>
          <tbody>
            {PROVIDERS.map((p) => (
              <tr key={p.service} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">{p.service}</td>
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4">
                  <a
                    href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                    className="hover:underline"
                  >
                    {p.phone}
                  </a>
                </td>
                <td className="py-2 text-gray-600">{p.account ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "camp-guides",
    title: "Camp Guides",
    body: (
      <p className="text-gray-700">
        Can someone email the great guides that were made a few years ago to{" "}
        <a href="mailto:muchler@gmail.com" className="underline">
          muchler@gmail.com
        </a>{" "}
        so we can post them here?
      </p>
    ),
  },
  {
    id: "opening",
    title: "Opening Procedures",
    body: <p className="text-gray-500 italic">Coming soon.</p>,
  },
  {
    id: "weekly",
    title: "Weekly Usage",
    body: <p className="text-gray-500 italic">Coming soon.</p>,
  },
  {
    id: "closing",
    title: "Closing Procedures",
    body: <p className="text-gray-500 italic">Coming soon.</p>,
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    body: (
      <div className="space-y-4">
        <div>
          <p className="font-medium">How do we handle trash/garbage?</p>
          <p className="text-gray-700">
            Take the trash bins to the top of the driveway each Tuesday morning.
            There is a sticker for use at the transfer station if you need it
            (by the sink). Trash removal is handled by Casella who can be
            reached at{" "}
            <a href="tel:18004451318" className="hover:underline">
              1-800-445-1318
            </a>{" "}
            if there are any problems.
          </p>
        </div>
        <div>
          <p className="font-medium">Where can I rent a boat?</p>
          <p className="text-gray-700">
            Goodhue Boat Company on Sewall Road rents and repairs boats.
          </p>
        </div>
        <div>
          <p className="font-medium">Who do I call if something is broken?</p>
          <p className="text-gray-700">
            Our current Property Manager is Ben Muchler who can be reached at{" "}
            <a href="tel:6178240742" className="hover:underline">
              617-824-0742
            </a>
            . If plumbing related, call Bryan Gallagher at{" "}
            <a href="tel:6035693768" className="hover:underline">
              603-569-3768
            </a>
            .
          </p>
        </div>
        <div>
          <p className="font-medium">What are the Owner's Assessment Fees?</p>
          <p className="text-gray-700">
            $6 per share with a suggested $200 minimum per shareholder.
          </p>
          <p className="mt-2 text-gray-700">
            Make checks to <em>Noconomo Corporation</em> and mail c/o:
          </p>
          <address className="mt-1 text-gray-700 not-italic">
            Ben Muchler
            <br />4 Great Pond Drive
            <br />
            Boxford, MA 01921
          </address>
          <p className="mt-2 text-gray-700">
            Or Venmo to{" "}
            <a
              href="https://venmo.com/u/benmuchler"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              @benmuchler
            </a>
            .
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "neighbors",
    title: "Neighbors",
    body: <p className="text-gray-500 italic">Coming soon.</p>,
  },
]

export default function Handbook() {
  useTitle("Handbook")
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h2 className="mb-4 text-2xl font-semibold">Handbook</h2>
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          >
            {s.title}
          </a>
        ))}
      </nav>
      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-16">
            <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
            <div className="space-y-2">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
