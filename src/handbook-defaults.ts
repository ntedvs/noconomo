export type Officer = { role: string; name: string }
export type ServiceProvider = {
  service: string
  provider: string
  contact: string
  phone: string
  email: string
  website: string
  account: string
  notes: string
}

export type HandbookContent = {
  address: string
  phoneNumber: string
  wifiName: string
  wifiPassword: string
  officers: Officer[]
  choosingWeeksIntro: string
  choosingWeeksBullets: string[]
  trashAndRecycling: string[]
  serviceProviders: ServiceProvider[]
}

export const handbookDefaults: HandbookContent = {
  address: "354 Sewall Road, Wolfeboro, NH 03894",
  phoneNumber: "603-569-3623",
  wifiName: "",
  wifiPassword: "",
  officers: [
    { role: "President", name: "John Davis" },
    { role: "Vice President", name: "Martha Holland" },
    { role: "Treasurer", name: "Ben Muchler" },
    { role: "Recording Secretary", name: "Sarah Holland" },
    { role: "Scheduling Secretary", name: "Alex Pirie" },
    { role: "Property Chair", name: "Ben Muchler" },
    { role: "Website/Membership Manager", name: "Stewart Davis" },
  ],
  choosingWeeksIntro:
    "Three septs (Pirie, Rice, Abbott) cover nine families: Alison, Alex, Roger, Larsons, Glen/Holly/Dustin, Sam, Francie, Hollands, Davises.",
  choosingWeeksBullets: [
    "Round 1: each family picks one week. Pirie gets 2, Rice gets 3, Abbott gets 4.",
    "Sept order is set by the sacred napkin. Each sept picks all its weeks before the next sept goes.",
    "A family that won't use its week may give it to another Noconomo family before the sept reports to the Scheduling Secretary.",
    "Round 2: each sept picks one more week, same order. The sept decides which of its families gets it.",
    "Remaining weeks are first come, first served. Noconomo families first, then friends.",
  ],
  trashAndRecycling: [
    "Bring the trash bins to the top of the driveway Tuesday mornings.",
    "A transfer station sticker is by the sink if you need to use the transfer station.",
    "Curbside pickup is handled by Casella. Reach them at 1-800-445-1318.",
  ],
  serviceProviders: [
    {
      service: "Plumbing",
      provider: "Gallagher's Plumbing & Heating",
      contact: "Bryan Gallagher (Owner)",
      phone: "(603) 569-3768",
      email: "",
      website: "",
      account: "354 Sewall Rd",
      notes:
        "BBB A+ rating; 45+ years in business; licensed master plumber #3126, licensed pump installer #1429",
    },
    {
      service: "Water",
      provider: "Town of Wolfeboro Water & Sewer Utilities",
      contact: "",
      phone: "(603) 569-8176",
      email: "",
      website: "https://www.wolfeboronh.us/229/Water-Sewer-Utilities",
      account: "14-0878.300",
      notes: "Municipal utility",
    },
    {
      service: "Trash",
      provider: "Casella Waste Systems",
      contact: "",
      phone: "1-800-227-3552",
      email: "",
      website: "https://www.casella.com",
      account: "79-47066-0",
      notes:
        "Verify account number directly with Casella; residential routes reorganized in recent years",
    },
    {
      service: "Electricity",
      provider: "Wolfeboro Municipal Electric Department",
      contact: "",
      phone: "(603) 569-8150",
      email: "",
      website: "https://www.wolfeboronh.us/240/Municipal-Electric-Department",
      account: "05-4275.000",
      notes: "Municipal utility; Mon-Fri 7am-3:30pm",
    },
    {
      service: "Telephone",
      provider: "Fidium (formerly Consolidated Communications)",
      contact: "",
      phone: "1-844-968-7224",
      email: "",
      website: "https://www.consolidated.com",
      account: "603-569-3623-995",
      notes:
        "Rebranded from Consolidated Communications to Fidium in September 2025; service, plan, pricing, logins unchanged",
    },
    {
      service: "Attorney",
      provider: "Walker & Varney, P.C.",
      contact: "George W. Walker (Partner)",
      phone: "(603) 569-2000",
      email: "",
      website: "https://walkervarney.com",
      account: "",
      notes:
        "Thomas R. (Randy) Walker is Managing Partner; other attorneys: James P. Cowles, Jennifer G. Haskell; real estate, family law, estate planning, business formation, litigation",
    },
    {
      service: "Accountant",
      provider: "Leone, McDonnell & Roberts, P.A.",
      contact: "Evan J. Stowell (Managing Partner)",
      phone: "(603) 569-1953",
      email: "estowell@lmrpa.com",
      website: "https://www.lmrpa.com",
      account: "",
      notes:
        "Promoted to Managing Partner effective July 1, 2019; oversees firm's five NH offices",
    },
    {
      service: "Roofer",
      provider: "Clifford Roofing",
      contact: "Eric Clifford (Owner)",
      phone: "(603) 556-1284",
      email: "",
      website: "http://cliffordroofing.com",
      account: "",
      notes:
        "Verify current best contact number; residential and commercial roofing services",
    },
    {
      service: "Structural",
      provider: "Roy Darling",
      contact: "Roy Darling",
      phone: "(603) 556-0360",
      email: "",
      website: "",
      account: "",
      notes:
        "No online business footprint found; recommend confirming by phone. Backup options: HEB Engineers, Emanuel Engineering (603-772-4400), Summit Engineering Portsmouth (603-319-1817)",
    },
    {
      service: "Insurance",
      provider: "Avery Insurance Agency (J. Clifton Avery Agency)",
      contact: "",
      phone: "603.569.2515",
      email: "quotes@averyagency.com",
      website: "https://www.averyinsurance.net",
      account: "",
      notes:
        "Established 1899; 4th-generation family-owned; additional offices in Portsmouth NH, Gardiner ME, and New Orleans LA",
    },
    {
      service: "Dock",
      provider: "Winnipesaukee Marine Construction (WMC)",
      contact: "",
      phone: "(603) 875-7768",
      email: "winnimarine@hotmail.com",
      website: "https://lakewinnicon.com",
      account: "",
      notes:
        "Family-owned since 1967; services include breakwaters, docks, boat lifts, dock pilings, ice clusters, rafts",
    },
  ],
}
