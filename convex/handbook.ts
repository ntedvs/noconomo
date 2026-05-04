import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAdmin, requireUser } from "./auth"

const providerValidator = v.object({
  service: v.string(),
  provider: v.string(),
  contact: v.string(),
  phone: v.string(),
  email: v.string(),
  website: v.string(),
  account: v.string(),
  notes: v.string(),
})

export const get = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const row = await ctx.db.query("handbook").take(1)
    return row[0] ?? null
  },
})

export const save = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    address: v.string(),
    phoneNumber: v.string(),
    officers: v.array(v.object({ role: v.string(), name: v.string() })),
    choosingWeeksIntro: v.string(),
    choosingWeeksBullets: v.array(v.string()),
    trashAndRecycling: v.array(v.string()),
    serviceProviders: v.array(providerValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const { token: _token, ...data } = args
    const existing = await ctx.db.query("handbook").take(1)
    if (existing[0]) {
      await ctx.db.replace(existing[0]._id, data)
    } else {
      await ctx.db.insert("handbook", data)
    }
    return null
  },
})
