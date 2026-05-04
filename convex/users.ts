import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAdmin, requireUser } from "./auth"

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const users = await ctx.db.query("users").take(1000)
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      admin: u.admin ?? false,
      dateOfBirth: u.dateOfBirth,
      generation: u.generation,
      shares: u.shares,
      phoneNumber: u.phoneNumber,
      family: u.family,
    }))
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    generation: v.optional(v.string()),
    shares: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    family: v.optional(v.string()),
    admin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx, args.token)
    const isAdmin = me.admin === true
    if (args.userId !== me._id && !isAdmin) {
      throw new Error("Not allowed")
    }
    const target = await ctx.db.get(args.userId)
    if (!target) throw new Error("Not found")

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) {
      const name = args.name.trim()
      if (!name) throw new Error("Name required")
      patch.name = name
    }
    if (args.dateOfBirth !== undefined) {
      patch.dateOfBirth = args.dateOfBirth.trim() || undefined
    }
    if (args.generation !== undefined) {
      patch.generation = args.generation.trim() || undefined
    }
    if (args.shares !== undefined) {
      patch.shares = args.shares
    }
    if (args.phoneNumber !== undefined) {
      patch.phoneNumber = args.phoneNumber.trim() || undefined
    }
    if (args.family !== undefined) {
      patch.family = args.family.trim() || undefined
    }
    if (args.email !== undefined) {
      if (!isAdmin) throw new Error("Only admins can change email")
      const email = args.email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email")
      }
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique()
      if (existing && existing._id !== args.userId) {
        throw new Error("Email already in use")
      }
      patch.email = email
    }
    if (args.admin !== undefined) {
      if (!isAdmin) throw new Error("Only admins can change admin status")
      patch.admin = args.admin
    }

    await ctx.db.patch(args.userId, patch)
    return null
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    name: v.string(),
    email: v.string(),
    dateOfBirth: v.optional(v.string()),
    generation: v.optional(v.string()),
    shares: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    family: v.optional(v.string()),
    admin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const name = args.name.trim()
    if (!name) throw new Error("Name required")
    const email = args.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email")
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (existing) throw new Error("Email already in use")
    return await ctx.db.insert("users", {
      name,
      email,
      ...(args.dateOfBirth?.trim()
        ? { dateOfBirth: args.dateOfBirth.trim() }
        : {}),
      ...(args.generation?.trim()
        ? { generation: args.generation.trim() }
        : {}),
      ...(args.shares !== undefined ? { shares: args.shares } : {}),
      ...(args.phoneNumber?.trim()
        ? { phoneNumber: args.phoneNumber.trim() }
        : {}),
      ...(args.family?.trim() ? { family: args.family.trim() } : {}),
      ...(args.admin ? { admin: true } : {}),
    })
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const me = await requireAdmin(ctx, args.token)
    if (args.userId === me._id) {
      throw new Error("You cannot delete yourself")
    }
    const sessions = await ctx.db.query("sessions").take(2000)
    for (const s of sessions) {
      if (s.userId === args.userId) await ctx.db.delete(s._id)
    }
    await ctx.db.delete(args.userId)
    return null
  },
})
