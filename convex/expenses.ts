import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./auth"
import { assertStorageUnreferenced } from "./storageOwnership"

const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
  contentType: v.optional(v.string()),
  size: v.optional(v.number()),
})

export const generateUploadUrl = mutation({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    return await ctx.storage.generateUploadUrl()
  },
})

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const rows = await ctx.db.query("expenses").order("desc").take(2000)
    const userIds = Array.from(new Set(rows.map((r) => r.createdBy)))
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const nameById = new Map(
      users.filter((u) => u !== null).map((u) => [u._id, u.name]),
    )
    return await Promise.all(
      rows.map(async (r) => ({
        _id: r._id,
        item: r.item,
        cost: r.cost,
        notes: r.notes,
        createdBy: r.createdBy,
        createdByName: nameById.get(r.createdBy) ?? "Unknown",
        _creationTime: r._creationTime,
        attachments: await Promise.all(
          (r.attachments ?? []).map(async (a) => ({
            storageId: a.storageId,
            fileName: a.fileName,
            contentType: a.contentType,
            size: a.size,
            url: await ctx.storage.getUrl(a.storageId),
          })),
        ),
      })),
    )
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    item: v.string(),
    cost: v.number(),
    notes: v.optional(v.string()),
    attachments: v.optional(v.array(attachmentValidator)),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const item = args.item.trim()
    if (!item) throw new Error("Item required")
    if (!Number.isFinite(args.cost)) throw new Error("Invalid cost")
    const notes = args.notes?.trim()
    for (const a of args.attachments ?? []) {
      await assertStorageUnreferenced(ctx, a.storageId)
    }
    return await ctx.db.insert("expenses", {
      item,
      cost: args.cost,
      createdBy: user._id,
      ...(notes ? { notes } : {}),
      ...(args.attachments && args.attachments.length > 0
        ? { attachments: args.attachments }
        : {}),
    })
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("expenses"),
    item: v.string(),
    cost: v.number(),
    notes: v.optional(v.string()),
    attachments: v.array(attachmentValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Not found")
    if (existing.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    const item = args.item.trim()
    if (!item) throw new Error("Item required")
    if (!Number.isFinite(args.cost)) throw new Error("Invalid cost")
    const notes = args.notes?.trim()

    const existingIds = new Set(
      (existing.attachments ?? []).map((a) => a.storageId),
    )
    for (const a of args.attachments) {
      if (!existingIds.has(a.storageId)) {
        await assertStorageUnreferenced(ctx, a.storageId)
      }
    }

    const keptIds = new Set(args.attachments.map((a) => a.storageId))
    for (const a of existing.attachments ?? []) {
      if (!keptIds.has(a.storageId)) {
        await ctx.storage.delete(a.storageId)
      }
    }

    await ctx.db.patch(args.id, {
      item,
      cost: args.cost,
      notes: notes ? notes : undefined,
      attachments: args.attachments.length > 0 ? args.attachments : undefined,
    })
    return null
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const existing = await ctx.db.get(args.id)
    if (!existing) return null
    if (existing.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    for (const a of existing.attachments ?? []) {
      await ctx.storage.delete(a.storageId)
    }
    await ctx.db.delete(args.id)
    return null
  },
})
