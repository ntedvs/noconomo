import { v } from "convex/values"
import { internalAction } from "./_generated/server"

export const sendCodeEmail = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and RESEND_FROM must be set")
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: args.email,
        subject: `Your sign-in code: ${args.code}`,
        text: `Your sign-in code is ${args.code}. It expires in 10 minutes.`,
        html: `<p>Your sign-in code is <strong>${args.code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Resend failed: ${res.status} ${body}`)
    }
    return null
  },
})
