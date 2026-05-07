"use node"

import { render } from "@react-email/render"
import { v } from "convex/values"
import nodemailer from "nodemailer"
import React from "react"
import { internalAction } from "./_generated/server"
import EventEmail from "./emails/event_email"

function transporter() {
  const host = process.env.SES_SMTP_HOST
  const port = Number(process.env.SES_SMTP_PORT ?? "587")
  const user = process.env.SES_SMTP_USER
  const pass = process.env.SES_SMTP_PASS
  const from = process.env.SES_FROM
  if (!host || !user || !pass || !from) {
    throw new Error(
      "SES_SMTP_HOST, SES_SMTP_USER, SES_SMTP_PASS, and SES_FROM must be set",
    )
  }
  return {
    from,
    transport: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
  }
}

export const sendCodeEmail = internalAction({
  args: { email: v.string(), code: v.string() },
  handler: async (_ctx, args) => {
    const { from, transport } = transporter()
    await transport.sendMail({
      from,
      to: args.email,
      subject: `Your sign-in code: ${args.code}`,
      text: `Your sign-in code is ${args.code}. It expires in 10 minutes.`,
      html: `<p>Your sign-in code is <strong>${args.code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    })
    return null
  },
})

export const sendEventEmail = internalAction({
  args: {
    recipients: v.array(v.string()),
    title: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
    senderName: v.string(),
  },
  handler: async (_ctx, args) => {
    if (args.recipients.length === 0) return null
    const { from, transport } = transporter()
    const element = React.createElement(EventEmail, {
      title: args.title,
      date: args.date,
      notes: args.notes,
      senderName: args.senderName,
    })
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject = `New event: ${args.title} (${args.date})`

    const queue = [...args.recipients]
    const worker = async () => {
      while (queue.length > 0) {
        const to = queue.shift()
        if (!to) break
        await transport.sendMail({ from, to, subject, html, text })
      }
    }
    const concurrency = Math.min(5, args.recipients.length)
    await Promise.all(Array.from({ length: concurrency }, worker))
    return null
  },
})
