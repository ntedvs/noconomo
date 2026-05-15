import {
  FilmStrip,
  Folder,
  Image as ImageIcon,
  PencilSimple,
  Play,
  Trash,
} from "@phosphor-icons/react"
import { format } from "date-fns"
import { Link } from "react-router"
import { isVideo, type FolderRow, type Media } from "./gallery-shared"

export function FolderTile({
  folder,
  canEdit,
  onRename,
  onDelete,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  folder: FolderRow
  canEdit: boolean
  onRename: () => void
  onDelete: () => void
  isDropTarget?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}) {
  return (
    <figure>
      <div
        className="group/tile relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Link
          to={`/gallery/${folder._id}`}
          draggable={false}
          className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-md border bg-sage-soft/60 text-sage shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:bg-sage-soft hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
            isDropTarget ? "border-sage ring-2 ring-sage/40" : "border-border"
          }`}
        >
          <Folder size={64} weight="duotone" />
        </Link>

        {canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover/tile:opacity-100">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRename()
              }}
              aria-label="Rename folder"
              className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-brown"
            >
              <PencilSimple size={14} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete folder"
              className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-danger"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

      <figcaption className="mt-2 px-0.5">
        <div className="truncate text-sm font-semibold text-brown">
          {folder.name}
        </div>
        <div className="mt-0.5 text-xs text-fg-muted">Folder</div>
      </figcaption>
    </figure>
  )
}

export function Tile({
  media,
  canEdit,
  onOpen,
  onRename,
  onDelete,
  draggable,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  media: Media
  canEdit: boolean
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}) {
  const video = isVideo(media)
  const thumb = video ? media.posterUrl : media.url

  return (
    <figure>
      <div className={`group/tile relative ${isDragging ? "opacity-50" : ""}`}>
        <button
          onClick={onOpen}
          draggable={draggable}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={`relative block w-full overflow-hidden rounded-md border border-border bg-bg-muted shadow-[0_1px_0_rgba(89,74,66,0.04)] transition hover:border-border-strong hover:shadow-[0_4px_16px_-8px_rgba(89,74,66,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
            draggable ? "cursor-grab active:cursor-grabbing" : ""
          }`}
        >
          {thumb ? (
            <img
              src={thumb}
              alt={media.title ?? ""}
              loading="lazy"
              draggable={false}
              className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover/tile:scale-[1.025]"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center text-fg-subtle">
              <ImageIcon size={28} weight="light" />
            </div>
          )}

          {video && (
            <>
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-fg/70 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                <FilmStrip size={12} /> Video
              </span>
              <span className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-fg/60 text-white shadow-lg backdrop-blur-sm">
                  <Play size={18} weight="fill" />
                </span>
              </span>
            </>
          )}
        </button>

        {canEdit && (
          <div
            className={[
              "absolute right-2 flex gap-1 opacity-0 transition-opacity group-hover/tile:opacity-100",
              video ? "top-10" : "top-2",
            ].join(" ")}
          >
            {!video && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                }}
                aria-label="Rename"
                className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-brown"
              >
                <PencilSimple size={14} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label="Delete"
              className="grid h-8 w-8 place-items-center rounded-full bg-paper/95 text-fg-muted shadow-sm backdrop-blur-sm hover:bg-paper hover:text-danger"
            >
              <Trash size={14} />
            </button>
          </div>
        )}
      </div>

      <figcaption className="mt-2 px-0.5">
        <div className="truncate text-sm font-semibold text-brown">
          {media.title ?? <span className="text-fg-subtle">Untitled</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
          <span className="truncate">{media.uploaderName}</span>
          <span className="text-border-strong">·</span>
          <span className="tabular-nums">
            {format(new Date(media._creationTime), "MMM d, yyyy")}
          </span>
        </div>
      </figcaption>
    </figure>
  )
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square w-full animate-pulse rounded-md border border-border bg-bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-bg-muted" />
          <div className="h-2.5 w-1/2 animate-pulse rounded bg-bg-muted" />
        </div>
      ))}
    </div>
  )
}
