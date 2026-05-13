export type Officer = { role: string; name: string }
export type Faq = { question: string; answer: string }
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

export type GuideContent = {
  address: string
  wifiName: string
  wifiPassword: string
  officers: Officer[]
  choosingWeeksIntro: string
  choosingWeeksBullets: string[]
  faqs: Faq[]
  serviceProviders: ServiceProvider[]
}

export const emptyGuide: GuideContent = {
  address: "",
  wifiName: "",
  wifiPassword: "",
  officers: [],
  choosingWeeksIntro: "",
  choosingWeeksBullets: [],
  faqs: [],
  serviceProviders: [],
}
