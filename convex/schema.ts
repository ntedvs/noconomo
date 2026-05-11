import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    admin: v.optional(v.boolean()),
    dateOfBirth: v.optional(v.string()),
    generation: v.optional(v.string()),
    shares: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    family: v.optional(v.string()),
  }).index("by_email", ["email"]),

  bulletins: defineTable({
    content: v.string(),
    createdBy: v.id("users"),
  }),

  handbook: defineTable({
    address: v.string(),
    phoneNumber: v.string(),
    wifiName: v.optional(v.string()),
    wifiPassword: v.optional(v.string()),
    officers: v.array(v.object({ role: v.string(), name: v.string() })),
    choosingWeeksIntro: v.string(),
    choosingWeeksBullets: v.array(v.string()),
    trashAndRecycling: v.optional(v.array(v.string())),
    faqs: v.optional(
      v.array(v.object({ question: v.string(), answer: v.string() })),
    ),
    serviceProviders: v.array(
      v.object({
        service: v.string(),
        provider: v.string(),
        contact: v.string(),
        phone: v.string(),
        email: v.string(),
        website: v.string(),
        account: v.string(),
        notes: v.string(),
      }),
    ),
  }),

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

  families: defineTable({
    name: v.string(),
    color: v.string(),
  }).index("by_name", ["name"]),

  reservations: defineTable({
    familyId: v.id("families"),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.id("users"),
    notes: v.optional(v.string()),
  })
    .index("by_startDate", ["startDate"])
    .index("by_familyId", ["familyId"]),

  documents: defineTable({
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    title: v.string(),
    contentType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    size: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_uploadedBy", ["uploadedBy"]),

  events: defineTable({
    date: v.string(),
    title: v.string(),
    createdBy: v.id("users"),
    notes: v.optional(v.string()),
  }).index("by_date", ["date"]),

  expenses: defineTable({
    item: v.string(),
    cost: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          contentType: v.optional(v.string()),
          size: v.optional(v.number()),
        }),
      ),
    ),
  }),
})
