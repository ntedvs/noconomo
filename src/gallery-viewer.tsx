import { CaretLeft, CaretRight, X } from "@phosphor-icons/react"
import { format } from "date-fns"
import { useEffect } from "react"
import { isVideo, type Media } from "./gallery-shared"

export function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: Media[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const m = items[index]
  const prev = () => onIndex((index - 1 + items.length) % items.length)
  const next = () => onIndex((index + 1) % items.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length])

  const video = isVideo(m)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-fg/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <header
        className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="truncate font-display text-lg text-white">
            {m.title ?? "Untitled"}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
            <span>{m.uploaderName}</span>
            <span className="text-white/30">·</span>
            <span>{format(new Date(m._creationTime), "MMM d, yyyy")}</span>
            <span className="text-white/30">·</span>
            <span className="tabular-nums">
              {index + 1} / {items.length}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
      </header>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-6"
        onClick={onClose}
      >
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              prev()
            }}
            aria-label="Previous"
            className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:left-6"
          >
            <CaretLeft size={20} />
          </button>
        )}

        <div onClick={(e) => e.stopPropagation()} className="max-h-full">
          {video ? (
            m.url && (
              <video
                key={m._id}
                src={m.url}
                poster={m.posterUrl ?? undefined}
                controls
                autoPlay
                className="max-h-[78vh] max-w-full rounded-lg bg-black object-contain"
              />
            )
          ) : m.url ? (
            <img
              key={m._id}
              src={m.url}
              alt={m.title ?? ""}
              className="max-h-[78vh] max-w-full rounded-lg object-contain"
            />
          ) : (
            <div className="text-white/60">Unavailable</div>
          )}
        </div>

        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              next()
            }}
            aria-label="Next"
            className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white sm:right-6"
          >
            <CaretRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
