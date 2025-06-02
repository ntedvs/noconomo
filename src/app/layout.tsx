import "@/styles/base.css"
import { Metadata } from "next"
import { Ubuntu } from "next/font/google"
import { ReactNode } from "react"

const ubuntu = Ubuntu({ weight: "400", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "Noconomo", template: "%s | Noconomo" },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`flex min-h-screen flex-col bg-background text-foreground ${ubuntu.className}`}
      >
        <header className="mx-auto w-full max-w-6xl"></header>
        <main className="mx-auto w-full max-w-6xl grow">{children}</main>
        <footer className="mx-auto w-full max-w-6xl"></footer>
      </body>
    </html>
  )
}
