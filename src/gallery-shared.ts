import type { Id } from "../convex/_generated/dataModel"

export type Media = {
  _id: Id<"images">
  url: string | null
  posterUrl: string | null
  contentType?: string
  uploadedBy: Id<"users">
  uploaderName: string
  title?: string
  folderId?: Id<"folders">
  _creationTime: number
}

export type FolderRow = {
  _id: Id<"folders">
  name: string
  parentFolderId?: Id<"folders">
  createdBy: Id<"users">
  _creationTime: number
}

export const isVideo = (m: Media) => (m.contentType ?? "").startsWith("video/")

export const inputCls =
  "w-full rounded-md border border-border bg-bg px-3 py-2 text-base"

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-white shadow-[0_1px_0_rgba(89,74,66,0.06),0_6px_16px_-8px_rgba(120,145,109,0.6)] hover:bg-sage-hover disabled:opacity-40"

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong bg-paper px-4 py-2 text-sm font-semibold text-brown hover:border-sage hover:text-sage-hover"
