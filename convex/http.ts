import { httpRouter } from "convex/server"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { httpAction } from "./_generated/server"
import { verifyFileUrl } from "./fileUrl"

const http = httpRouter()

http.route({
  path: "/file",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    const e = url.searchParams.get("e")
    const s = url.searchParams.get("s")
    if (!id || !e || !s) return new Response("Bad Request", { status: 400 })

    const expiresAt = Number(e)
    const ok = await verifyFileUrl(id, expiresAt, s)
    if (!ok) return new Response("Link expired or invalid", { status: 403 })

    const storageId = id as Id<"_storage">
    const referenced = await ctx.runQuery(
      internal.storageOwnership.isStorageReferenced,
      { storageId },
    )
    if (!referenced) return new Response("Not Found", { status: 404 })

    const blob = await ctx.storage.get(storageId)
    if (!blob) return new Response("Not Found", { status: 404 })

    const contentType =
      (await ctx.runQuery(internal.storageOwnership.getStorageContentType, {
        storageId,
      })) ?? "application/octet-stream"

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "Referrer-Policy": "no-referrer",
      "Accept-Ranges": "bytes",
    }

    const rangeHeader = req.headers.get("range")
    if (rangeHeader) {
      const m = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader)
      if (m) {
        const start = parseInt(m[1], 10)
        const end = m[2] ? parseInt(m[2], 10) : blob.size - 1
        if (
          Number.isFinite(start) &&
          Number.isFinite(end) &&
          start <= end &&
          end < blob.size
        ) {
          const sliced = blob.slice(start, end + 1, blob.type)
          return new Response(sliced, {
            status: 206,
            headers: {
              ...baseHeaders,
              "Content-Range": `bytes ${start}-${end}/${blob.size}`,
              "Content-Length": String(end - start + 1),
            },
          })
        }
      }
    }

    return new Response(blob, {
      headers: { ...baseHeaders, "Content-Length": String(blob.size) },
    })
  }),
})

export default http
