import { ImagesSquare } from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { btnSecondary } from "./gallery-shared"
import { generateImageThumbnail } from "./gallery-thumbnails"

type MissingThumbnail = {
  _id: Id<"images">
  url: string
  title?: string
  contentType?: string
}

export function GalleryBackfill() {
  const { token, user } = useAuth()
  const missing = useQuery(
    api.images.listMissingThumbnails,
    user?.admin ? { token } : "skip",
  ) as MissingThumbnail[] | undefined
  const generateUploadUrl = useMutation(api.images.generateUploadUrl)
  const setThumbnail = useMutation(api.images.setThumbnail)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [failed, setFailed] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  if (!user?.admin) return null

  const count = missing?.length ?? 0

  if (!running && done === 0 && missing !== undefined && count === 0) {
    return null
  }

  const uploadBlob = async (blob: Blob) => {
    const url = await generateUploadUrl({ token })
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: blob,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
    const { storageId } = (await res.json()) as { storageId: string }
    return storageId as Id<"_storage">
  }

  const run = async () => {
    if (!missing || missing.length === 0 || running) return
    const batch = [...missing]
    setRunning(true)
    setDone(0)
    setTotal(batch.length)
    setFailed(0)
    setErr(null)
    try {
      for (const item of batch) {
        try {
          const original = await fetch(item.url)
          if (!original.ok) throw new Error(`Fetch failed: ${original.status}`)
          const thumbnail = await generateImageThumbnail(await original.blob())
          const thumbnailStorageId = await uploadBlob(thumbnail)
          await setThumbnail({
            token,
            imageId: item._id,
            thumbnailStorageId,
          })
        } catch (e) {
          console.warn("Thumbnail backfill failed", item._id, e)
          setFailed((n) => n + 1)
        } finally {
          setDone((n) => n + 1)
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-1 text-center">
      <button
        type="button"
        onClick={run}
        disabled={running || missing === undefined || count === 0}
        className={btnSecondary}
      >
        <ImagesSquare size={16} />
        {running
          ? `Backfilling ${done} of ${total}`
          : count === 0
            ? "Thumbnails current"
            : `Backfill ${count} thumbnails`}
      </button>
      {(running || done > 0 || err) && (
        <p className="text-xs text-fg-muted">
          {err
            ? err
            : failed > 0
              ? `${done} processed, ${failed} failed`
              : `${done} processed`}
        </p>
      )}
    </div>
  )
}
