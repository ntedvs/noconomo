import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Nodemailer from "next-auth/providers/nodemailer"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: "auth@noconomo.com",
    }),
  ],
  pages: { verifyRequest: "/verify" },
  callbacks: {
    signIn: async ({ user }) => {
      const existing = await prisma.user.findUnique({
        where: { email: user.email! },
      })

      return !!existing
    },
  },
})
