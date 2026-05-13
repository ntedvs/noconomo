import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"

const CODE_TTL_MS = 10 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const REQUEST_CODE_WINDOW_MS = 60 * 60 * 1000
const REQUEST_CODE_LIMIT = 5
const VERIFY_CODE_WINDOW_MS = CODE_TTL_MS
const VERIFY_CODE_LIMIT = 5

async function consumeRateLimit(
  ctx: MutationCtx,
  key: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique()
  const now = Date.now()
  if (!existing) {
    await ctx.db.insert("rateLimits", { key, count: 1, windowStart: now })
    return
  }
  if (now - existing.windowStart > windowMs) {
    await ctx.db.patch(existing._id, { count: 1, windowStart: now })
    return
  }
  if (existing.count >= limit) {
    throw new Error("Too many attempts. Please try again later.")
  }
  await ctx.db.patch(existing._id, { count: existing.count + 1 })
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return n.toString().padStart(6, "0")
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export const requestCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email")
    }
    await consumeRateLimit(
      ctx,
      `requestCode:${email}`,
      REQUEST_CODE_LIMIT,
      REQUEST_CODE_WINDOW_MS,
    )
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (!user) return null
    const priorCodes = await ctx.db
      .query("authCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect()
    for (const prior of priorCodes) {
      await ctx.db.delete(prior._id)
    }
    const code = generateCode()
    const codeHash = await sha256(code)
    await ctx.db.insert("authCodes", {
      email,
      codeHash,
      expiresAt: Date.now() + CODE_TTL_MS,
    })
    await ctx.scheduler.runAfter(0, internal.email.sendCodeEmail, {
      email,
      code,
    })
    return null
  },
})

export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email)
    await consumeRateLimit(
      ctx,
      `verifyCode:${email}`,
      VERIFY_CODE_LIMIT,
      VERIFY_CODE_WINDOW_MS,
    )
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique()
    if (!user) throw new Error("Invalid or expired code")

    const codeHash = await sha256(args.code.trim())
    const now = Date.now()
    const match = await ctx.db
      .query("authCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .take(10)
    const valid = match.find(
      (c) => c.expiresAt > now && c.codeHash === codeHash,
    )
    if (!valid) throw new Error("Invalid or expired code")
    await ctx.db.delete(valid._id)

    const token = generateToken()
    const tokenHash = await sha256(token)
    await ctx.db.insert("sessions", {
      userId: user._id,
      tokenHash,
      expiresAt: now + SESSION_TTL_MS,
    })
    return { token }
  },
})

async function userFromToken(
  ctx: QueryCtx,
  token: string | null,
): Promise<Doc<"users"> | null> {
  if (!token) return null
  const tokenHash = await sha256(token)
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique()
  if (!session || session.expiresAt < Date.now()) return null
  return await ctx.db.get(session.userId)
}

export const me = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    return await userFromToken(ctx, args.token)
  },
})

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256(args.token)
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique()
    if (session) await ctx.db.delete(session._id)
    return null
  },
})

export async function requireUser(
  ctx: QueryCtx,
  token: string | null,
): Promise<Doc<"users">> {
  const user = await userFromToken(ctx, token)
  if (!user) throw new Error("Not authenticated")
  return user
}

export async function requireAdmin(
  ctx: QueryCtx,
  token: string | null,
): Promise<Doc<"users">> {
  const user = await requireUser(ctx, token)
  if (!user.admin) throw new Error("Admin required")
  return user
}
