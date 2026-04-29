import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
  }).index("by_email", ["email"]),

  authCodes: defineTable({
    email: v.string(),
    codeHash: v.string(),
    expiresAt: v.number(),
  }).index("by_email", ["email"]),

  images: defineTable({
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    title: v.optional(v.string()),
    contentType: v.optional(v.string()),
    posterStorageId: v.optional(v.id("_storage")),
  }).index("by_uploadedBy", ["uploadedBy"]),

  sessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
  }).index("by_tokenHash", ["tokenHash"]),
});
