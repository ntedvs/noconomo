import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import {
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"

export const isStorageReferenced = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args): Promise<boolean> => {
    return await storageIsReferenced(ctx, args.storageId)
  },
})

async function storageIsReferenced(
  ctx: QueryCtx | MutationCtx,
  storageId: Id<"_storage">,
): Promise<boolean> {
  const docs = await ctx.db.query("documents").collect()
  if (docs.some((d) => d.storageId === storageId)) return true
  const images = await ctx.db.query("images").collect()
  if (
    images.some(
      (i) => i.storageId === storageId || i.posterStorageId === storageId,
    )
  ) {
    return true
  }
  const expenses = await ctx.db.query("expenses").collect()
  if (
    expenses.some((e) =>
      (e.attachments ?? []).some((a) => a.storageId === storageId),
    )
  ) {
    return true
  }
  return false
}

export async function assertStorageUnreferenced(
  ctx: QueryCtx | MutationCtx,
  storageId: Id<"_storage">,
): Promise<void> {
  if (await storageIsReferenced(ctx, storageId)) {
    throw new Error("Storage id already in use")
  }
}
