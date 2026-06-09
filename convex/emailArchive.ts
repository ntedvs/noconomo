import { v } from "convex/values"
import { internalMutation, query } from "./_generated/server"
import { requireAdmin } from "./auth"

const audienceValidator = v.union(
  v.literal("all"),
  v.literal("shareholders"),
  v.literal("directors"),
)

const failedBatchValidator = v.object({
  recipients: v.array(v.string()),
  error: v.string(),
})

const attachmentValidator = v.object({
  filename: v.string(),
  contentType: v.optional(v.string()),
})

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const emails = await ctx.db.query("sentEmails").order("desc").take(100)

    const senderIds = Array.from(new Set(emails.map((email) => email.sentBy)))
    const senders = await Promise.all(senderIds.map((id) => ctx.db.get(id)))
    const senderNameById = new Map(
      senders
        .filter((sender) => sender !== null)
        .map((sender) => [sender._id, sender.name]),
    )

    return emails.map((email) => ({
      ...email,
      sentByName: senderNameById.get(email.sentBy) ?? "Unknown",
    }))
  },
})

export const record = internalMutation({
  args: {
    token: v.union(v.string(), v.null()),
    subject: v.string(),
    body: v.string(),
    audience: audienceValidator,
    recipientCount: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    failed: v.array(failedBatchValidator),
    attachments: v.array(attachmentValidator),
  },
  handler: async (ctx, args) => {
    const sender = await requireAdmin(ctx, args.token)
    await ctx.db.insert("sentEmails", {
      subject: args.subject,
      body: args.body,
      audience: args.audience,
      sentBy: sender._id,
      recipientCount: args.recipientCount,
      sentCount: args.sentCount,
      failedCount: args.failedCount,
      failed: args.failed,
      attachments: args.attachments,
    })
    return null
  },
})
