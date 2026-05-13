import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { requireUser } from "./auth"

const kindValidator = v.union(v.literal("gallery"), v.literal("documents"))

export const list = query({
  args: {
    token: v.union(v.string(), v.null()),
    kind: v.optional(kindValidator),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const kind = args.kind ?? "gallery"
    const rows = await ctx.db.query("folders").take(2000)
    return rows
      .filter((r) => (r.kind ?? "gallery") === kind)
      .map((r) => ({
        _id: r._id,
        name: r.name,
        parentFolderId: r.parentFolderId,
        createdBy: r.createdBy,
        _creationTime: r._creationTime,
      }))
  },
})

export const create = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    name: v.string(),
    parentFolderId: v.optional(v.id("folders")),
    kind: v.optional(kindValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const name = args.name.trim()
    if (!name) throw new Error("Name required")
    let kind: "gallery" | "documents" = args.kind ?? "gallery"
    if (args.parentFolderId) {
      const parent = await ctx.db.get(args.parentFolderId)
      if (!parent) throw new Error("Parent folder not found")
      const parentKind = parent.kind ?? "gallery"
      if (args.kind && args.kind !== parentKind)
        throw new Error("Folder kind mismatch")
      kind = parentKind
    }
    return await ctx.db.insert("folders", {
      name,
      createdBy: user._id,
      kind,
      ...(args.parentFolderId ? { parentFolderId: args.parentFolderId } : {}),
    })
  },
})

export const rename = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    folderId: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const folder = await ctx.db.get(args.folderId)
    if (!folder) throw new Error("Not found")
    if (folder.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    const name = args.name.trim()
    if (!name) throw new Error("Name required")
    await ctx.db.patch(folder._id, { name })
    return null
  },
})

async function reparentChildren(
  ctx: MutationCtx,
  folderId: Id<"folders">,
  newParent: Id<"folders"> | undefined,
) {
  const childFolders = await ctx.db
    .query("folders")
    .withIndex("by_parent", (q) => q.eq("parentFolderId", folderId))
    .take(2000)
  for (const f of childFolders) {
    await ctx.db.patch(f._id, { parentFolderId: newParent })
  }
  const childImages = await ctx.db
    .query("images")
    .withIndex("by_folder", (q) => q.eq("folderId", folderId))
    .take(2000)
  for (const img of childImages) {
    await ctx.db.patch(img._id, { folderId: newParent })
  }
  const childDocs = await ctx.db
    .query("documents")
    .withIndex("by_folder", (q) => q.eq("folderId", folderId))
    .take(2000)
  for (const d of childDocs) {
    await ctx.db.patch(d._id, { folderId: newParent })
  }
}

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const folder = await ctx.db.get(args.folderId)
    if (!folder) return null
    if (folder.createdBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    await reparentChildren(ctx, folder._id, folder.parentFolderId)
    await ctx.db.delete(folder._id)
    return null
  },
})
