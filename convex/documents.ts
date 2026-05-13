import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireUser } from "./auth"
import { assertStorageUnreferenced } from "./storageOwnership"

export const generateUploadUrl = mutation({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    return await ctx.storage.generateUploadUrl()
  },
})

export const add = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    storageId: v.id("_storage"),
    title: v.string(),
    contentType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    size: v.optional(v.number()),
    notes: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const title = args.title.trim()
    if (!title) throw new Error("Title required")
    await assertStorageUnreferenced(ctx, args.storageId)
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId)
      if (!folder) throw new Error("Folder not found")
      if ((folder.kind ?? "gallery") !== "documents")
        throw new Error("Folder kind mismatch")
    }
    const notes = args.notes?.trim()
    await ctx.db.insert("documents", {
      storageId: args.storageId,
      uploadedBy: user._id,
      title,
      ...(args.contentType ? { contentType: args.contentType } : {}),
      ...(args.fileName ? { fileName: args.fileName } : {}),
      ...(args.size !== undefined ? { size: args.size } : {}),
      ...(notes ? { notes } : {}),
      ...(args.folderId ? { folderId: args.folderId } : {}),
    })
    return null
  },
})

export const list = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const rows = await ctx.db.query("documents").order("desc").take(500)
    return await Promise.all(
      rows.map(async (r) => {
        const uploader = await ctx.db.get(r.uploadedBy)
        return {
          _id: r._id,
          url: await ctx.storage.getUrl(r.storageId),
          title: r.title,
          fileName: r.fileName,
          contentType: r.contentType,
          size: r.size,
          notes: r.notes,
          uploadedBy: r.uploadedBy,
          uploaderName: uploader?.name ?? "Unknown",
          folderId: r.folderId,
          _creationTime: r._creationTime,
        }
      }),
    )
  },
})

export const update = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    documentId: v.id("documents"),
    title: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Not found")
    if (doc.uploadedBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    const title = args.title.trim()
    if (!title) throw new Error("Title required")
    const notes = args.notes?.trim()
    await ctx.db.patch(doc._id, {
      title,
      notes: notes ? notes : undefined,
    })
    return null
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const doc = await ctx.db.get(args.documentId)
    if (!doc) return null
    if (doc.uploadedBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    await ctx.storage.delete(doc.storageId)
    await ctx.db.delete(doc._id)
    return null
  },
})
