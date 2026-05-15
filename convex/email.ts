"use node"

import { render } from "@react-email/render"
import { v } from "convex/values"
import nodemailer from "nodemailer"
import React from "react"
import { internal } from "./_generated/api"
import { action, internalAction } from "./_generated/server"
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

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

export const broadcast = action({
  args: {
    token: v.union(v.string(), v.null()),
    subject: v.string(),
    body: v.string(),
    audience: v.optional(
      v.union(
        v.literal("all"),
        v.literal("shareholders"),
        v.literal("directors"),
        v.literal("boardMembers"),
      ),
    ),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          filename: v.string(),
          contentType: v.optional(v.string()),
        }),
      ),
    ),
  },
  returns: v.object({
    recipients: v.number(),
    sent: v.number(),
    failed: v.array(
      v.object({
        recipients: v.array(v.string()),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const subject = args.subject.trim()
    const body = args.body.trim()
    if (!subject) throw new Error("Subject required")
    if (!body) throw new Error("Body required")
    const ccs: string[] = await ctx.runQuery(internal.users.adminMemberEmails, {
      token: args.token,
      audience: args.audience ?? "all",
    })

    const attachmentSpecs = args.attachments ?? []
    const attachments: {
      filename: string
      content: Buffer
      contentType?: string
    }[] = []
    let totalBytes = 0
    for (const spec of attachmentSpecs) {
      const referenced: boolean = await ctx.runQuery(
        internal.storageOwnership.isStorageReferenced,
        { storageId: spec.storageId },
      )
      if (referenced) {
        throw new Error(
          `Attachment ${spec.filename} is referenced by another resource`,
        )
      }
      const blob = await ctx.storage.get(spec.storageId)
      if (!blob) throw new Error(`Attachment missing: ${spec.filename}`)
      const buffer = Buffer.from(await blob.arrayBuffer())
      totalBytes += buffer.length
      if (totalBytes > MAX_ATTACHMENT_BYTES) {
        throw new Error("Attachments exceed 25 MB total")
      }
      attachments.push({
        filename: spec.filename,
        content: buffer,
        ...(spec.contentType ? { contentType: spec.contentType } : {}),
      })
    }

    const { from, transport } = transporter()
    const html = `<div style="white-space:pre-wrap;font-family:sans-serif">${escapeHtml(
      body,
    )}</div>`

    const BATCH_SIZE = 45
    const BATCH_GAP_MS = 100
    const batches: string[][] = []
    for (let i = 0; i < ccs.length; i += BATCH_SIZE) {
      batches.push(ccs.slice(i, i + BATCH_SIZE))
    }

    let sent = 0
    const failed: { recipients: string[]; error: string }[] = []
    for (let i = 0; i < batches.length; i++) {
      const bcc = batches[i]
      try {
        await transport.sendMail({
          from,
          to: from,
          bcc,
          subject,
          text: body,
          html,
          ...(attachments.length > 0 ? { attachments } : {}),
        })
        sent += bcc.length
      } catch (err) {
        failed.push({
          recipients: bcc,
          error: err instanceof Error ? err.message : String(err),
        })
      }
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_GAP_MS))
      }
    }

    await Promise.allSettled(
      attachmentSpecs.map((s) => ctx.storage.delete(s.storageId)),
    )
    return { recipients: ccs.length, sent, failed }
  },
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

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

    const BATCH_SIZE = 45
    const BATCH_GAP_MS = 100
    const batches: string[][] = []
    for (let i = 0; i < args.recipients.length; i += BATCH_SIZE) {
      batches.push(args.recipients.slice(i, i + BATCH_SIZE))
    }
    for (let i = 0; i < batches.length; i++) {
      const bcc = batches[i]
      try {
        await transport.sendMail({ from, to: from, bcc, subject, html, text })
      } catch (err) {
        console.error(
          `sendEventEmail batch failed (${bcc.length} recipients):`,
          err,
        )
      }
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_GAP_MS))
      }
    }
    return null
  },
})
