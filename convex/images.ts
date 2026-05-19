import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAdmin, requireUser } from "./auth"
import { fileProxyUrl } from "./fileUrl"
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
    title: v.optional(v.string()),
    contentType: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id("_storage")),
    posterStorageId: v.optional(v.id("_storage")),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const title = args.title?.trim()
    await assertStorageUnreferenced(ctx, args.storageId)
    if (args.posterStorageId) {
      await assertStorageUnreferenced(ctx, args.posterStorageId)
    }
    if (args.thumbnailStorageId) {
      await assertStorageUnreferenced(ctx, args.thumbnailStorageId)
    }
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId)
      if (!folder) throw new Error("Folder not found")
      if ((folder.kind ?? "gallery") !== "gallery")
        throw new Error("Folder kind mismatch")
    }
    await ctx.db.insert("images", {
      storageId: args.storageId,
      uploadedBy: user._id,
      ...(title ? { title } : {}),
      ...(args.contentType ? { contentType: args.contentType } : {}),
      ...(args.thumbnailStorageId
        ? { thumbnailStorageId: args.thumbnailStorageId }
        : {}),
      ...(args.posterStorageId
        ? { posterStorageId: args.posterStorageId }
        : {}),
      ...(args.folderId ? { folderId: args.folderId } : {}),
    })
    return null
  },
})

export const list = query({
  args: {
    token: v.union(v.string(), v.null()),
    folderId: v.union(v.id("folders"), v.null()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token)
    const folderId = args.folderId
    const rows =
      folderId === null
        ? await ctx.db
            .query("images")
            .withIndex("by_folder", (q) => q.eq("folderId", undefined))
            .order("desc")
            .take(500)
        : await ctx.db
            .query("images")
            .withIndex("by_folder", (q) => q.eq("folderId", folderId))
            .order("desc")
            .take(500)
    return await Promise.all(
      rows.map(async (r) => {
        const uploader = await ctx.db.get(r.uploadedBy)
        return {
          _id: r._id,
          url: await fileProxyUrl(r.storageId),
          thumbnailUrl: r.thumbnailStorageId
            ? await fileProxyUrl(r.thumbnailStorageId)
            : null,
          posterUrl: r.posterStorageId
            ? await fileProxyUrl(r.posterStorageId)
            : null,
          contentType: r.contentType,
          uploadedBy: r.uploadedBy,
          uploaderName: uploader?.name ?? "Unknown",
          title: r.title,
          folderId: r.folderId,
          _creationTime: r._creationTime,
        }
      }),
    )
  },
})

export const listMissingThumbnails = query({
  args: { token: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const rows = await ctx.db.query("images").order("desc").take(2000)
    const missing = []
    for (const r of rows) {
      if (r.thumbnailStorageId) continue
      const meta = await ctx.db.system.get(r.storageId)
      const contentType = r.contentType ?? meta?.contentType ?? ""
      if (contentType.startsWith("image/")) {
        missing.push({ row: r, contentType })
      }
    }
    return await Promise.all(
      missing.map(async ({ row: r, contentType }) => ({
        _id: r._id,
        url: await fileProxyUrl(r.storageId),
        title: r.title,
        contentType,
      })),
    )
  },
})

export const setThumbnail = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    imageId: v.id("images"),
    thumbnailStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token)
    const img = await ctx.db.get(args.imageId)
    if (!img) throw new Error("Not found")
    const meta = await ctx.db.system.get(img.storageId)
    const contentType = img.contentType ?? meta?.contentType ?? ""
    if (!contentType.startsWith("image/")) {
      throw new Error("Only images can have thumbnails")
    }
    await assertStorageUnreferenced(ctx, args.thumbnailStorageId)
    const priorThumbnailStorageId = img.thumbnailStorageId
    await ctx.db.patch(img._id, {
      thumbnailStorageId: args.thumbnailStorageId,
    })
    if (priorThumbnailStorageId) {
      await ctx.storage.delete(priorThumbnailStorageId)
    }
    return null
  },
})

export const setTitle = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    imageId: v.id("images"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const img = await ctx.db.get(args.imageId)
    if (!img) throw new Error("Not found")
    if (img.uploadedBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    const title = args.title.trim()
    await ctx.db.patch(img._id, title ? { title } : { title: undefined })
    return null
  },
})

export const moveToFolder = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    imageId: v.id("images"),
    folderId: v.union(v.id("folders"), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const img = await ctx.db.get(args.imageId)
    if (!img) throw new Error("Not found")
    if (img.uploadedBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId)
      if (!folder) throw new Error("Folder not found")
      if ((folder.kind ?? "gallery") !== "gallery")
        throw new Error("Folder kind mismatch")
    }
    await ctx.db.patch(img._id, {
      folderId: args.folderId ?? undefined,
    })
    return null
  },
})

export const remove = mutation({
  args: {
    token: v.union(v.string(), v.null()),
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token)
    const img = await ctx.db.get(args.imageId)
    if (!img) return null
    if (img.uploadedBy !== user._id && !user.admin)
      throw new Error("Not allowed")
    await ctx.storage.delete(img.storageId)
    if (img.thumbnailStorageId) await ctx.storage.delete(img.thumbnailStorageId)
    if (img.posterStorageId) await ctx.storage.delete(img.posterStorageId)
    await ctx.db.delete(img._id)
    return null
  },
})
