import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const requestCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) return null;
    const code = generateCode();
    const codeHash = await sha256(code);
    await ctx.db.insert("authCodes", {
      email,
      codeHash,
      expiresAt: Date.now() + CODE_TTL_MS,
    });
    await ctx.scheduler.runAfter(0, internal.email.sendCodeEmail, {
      email,
      code,
    });
    return null;
  },
});

export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) throw new Error("Invalid or expired code");

    const codeHash = await sha256(args.code.trim());
    const now = Date.now();
    const match = await ctx.db
      .query("authCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .take(10);
    const valid = match.find((c) => c.expiresAt > now && c.codeHash === codeHash);
    if (!valid) throw new Error("Invalid or expired code");
    await ctx.db.delete(valid._id);

    const token = generateToken();
    const tokenHash = await sha256(token);
    await ctx.db.insert("sessions", {
      userId: user._id,
      tokenHash,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { token };
  },
});

async function userFromToken(ctx: QueryCtx, token: string | null): Promise<Doc<"users"> | null> {
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

export const me = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    return await userFromToken(ctx, args.token);
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const tokenHash = await sha256(args.token);
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});

export async function requireUser(ctx: QueryCtx, token: string | null): Promise<Doc<"users">> {
  const user = await userFromToken(ctx, token);
  if (!user) throw new Error("Not authenticated");
  return user;
}
