import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAdmin, requireUser } from "./auth"

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    return await ctx.db.query("families").take(1000)
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const name = args.name.trim()
    if (!name) throw new Error("Name required")
    const existing = await ctx.db
      .query("families")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique()
    if (existing) throw new Error("Family already exists")
    return await ctx.db.insert("families", { name, color: args.color })
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("families"),
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const name = args.name.trim()
    if (!name) throw new Error("Name required")
    const existing = await ctx.db
      .query("families")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique()
    if (existing && existing._id !== args.id) {
      throw new Error("Family already exists")
    }
    await ctx.db.patch(args.id, { name, color: args.color })
    return null
  },
})
