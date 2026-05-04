import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./auth"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const reservations = await ctx.db
      .query("reservations")
      .withIndex("by_startDate")
      .take(2000)
    const families = await ctx.db.query("families").take(1000)
    const byId = new Map(families.map((f) => [f._id, f]))
    return reservations.map((r) => ({
      _id: r._id,
      familyId: r.familyId,
      familyName: byId.get(r.familyId)?.name ?? "Unknown",
      color: byId.get(r.familyId)?.color ?? "#999999",
      startDate: r.startDate,
      endDate: r.endDate,
    }))
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    familyId: v.id("families"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    if (!DATE_RE.test(args.startDate) || !DATE_RE.test(args.endDate)) {
      throw new Error("Invalid date format")
    }
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date")
    }
    return await ctx.db.insert("reservations", {
      familyId: args.familyId,
      startDate: args.startDate,
      endDate: args.endDate,
      createdBy: user._id,
    })
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("reservations"),
    familyId: v.id("families"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    if (!DATE_RE.test(args.startDate) || !DATE_RE.test(args.endDate)) {
      throw new Error("Invalid date format")
    }
    if (args.endDate < args.startDate) {
      throw new Error("End date must be on or after start date")
    }
    await ctx.db.patch(args.id, {
      familyId: args.familyId,
      startDate: args.startDate,
      endDate: args.endDate,
    })
    return null
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    id: v.id("reservations"),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    await ctx.db.delete(args.id)
    return null
  },
})
