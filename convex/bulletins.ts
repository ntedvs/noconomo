import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./auth"

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    return await ctx.db.query("bulletins").order("desc").take(200)
  },
})

export const add = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const content = args.content.trim()
    if (!content) throw new Error("Empty bulletin")
    return await ctx.db.insert("bulletins", {
      content,
      createdBy: user._id,
    })
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("bulletins"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const existing = await ctx.db.get(args.id)
    if (!existing) throw new Error("Not found")
    if (existing.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    const content = args.content.trim()
    if (!content) throw new Error("Empty bulletin")
    await ctx.db.patch(args.id, { content })
    return null
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("bulletins"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const existing = await ctx.db.get(args.id)
    if (!existing) return null
    if (existing.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    await ctx.db.delete(args.id)
    return null
  },
})
