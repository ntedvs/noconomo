import "@/styles/base.css"
import { Metadata } from "next"
import Link from "next/link"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: { default: "Noconomo", template: "%s | Noconomo" },
}

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="flex gap-4 p-4 text-2xl">
          <Link href="/">Noconomo</Link>
          <Link href="/gallery">Gallery</Link>
        </nav>

        <main className="mx-auto w-4/5 lg:w-3/5">{children}</main>
      </body>
    </html>
  )
}
