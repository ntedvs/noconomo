import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./auth"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const events = await ctx.db.query("events").withIndex("by_date").take(2000)
    const userIds = Array.from(new Set(events.map((e) => e.createdBy)))
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const nameById = new Map(
      users.filter((u) => u !== null).map((u) => [u._id, u.name]),
    )
    return events.map((e) => ({
      _id: e._id,
      date: e.date,
      title: e.title,
      createdBy: e.createdBy,
      createdByName: nameById.get(e.createdBy) ?? "Unknown",
    }))
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    date: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    if (!DATE_RE.test(args.date)) throw new Error("Invalid date format")
    const title = args.title.trim()
    if (!title) throw new Error("Title required")
    return await ctx.db.insert("events", {
      date: args.date,
      title,
      createdBy: user._id,
    })
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const ev = await ctx.db.get(args.id)
    if (!ev) return null
    if (ev.createdBy !== user._id) throw new Error("Not allowed")
    await ctx.db.delete(args.id)
    return null
  },
})
