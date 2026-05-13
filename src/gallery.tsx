import {
  CaretRight,
  CloudArrowUp,
  FolderPlus,
  UploadSimple,
} from "@phosphor-icons/react"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { api } from "../convex/_generated/api"
import type { Id } from "../convex/_generated/dataModel"
import { useAuth } from "./auth"
import { ConfirmModal } from "./gallery-modal"
import {
  DeleteFolderModal,
  NewFolderModal,
  RenameFolderModal,
  RenameModal,
} from "./gallery-modals"
import {
  btnPrimary,
  btnSecondary,
  type FolderRow,
  type Media,
} from "./gallery-shared"
import { FolderTile, GridSkeleton, Tile } from "./gallery-tiles"
import { UploadModal } from "./gallery-upload"
import { Viewer } from "./gallery-viewer"
import { useTitle } from "./use-title"

export default function Gallery() {
  useTitle("Gallery")
  const { token, user } = useAuth()
  const params = useParams<{ folderId?: string }>()
  const navigate = useNavigate()
  const folderId = params.folderId as Id<"folders"> | undefined

  const items = useQuery(api.images.list, { token })
  const folders = useQuery(api.folders.list, { token, kind: "gallery" })
  const removeImage = useMutation(api.images.remove)
  const moveImage = useMutation(api.images.moveToFolder)
  const [dropTarget, setDropTarget] = useState<Id<"folders"> | "root" | null>(
    null,
  )
  const [draggingId, setDraggingId] = useState<Id<"images"> | null>(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Media | null>(null)
  const [renaming, setRenaming] = useState<Media | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<FolderRow | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<FolderRow | null>(null)
  const [viewer, setViewer] = useState<{ index: number } | null>(null)

  const allFolders = (folders ?? []) as FolderRow[]
  const allImages = (items ?? []) as Media[]

  const currentFolder = folderId
    ? allFolders.find((f) => f._id === folderId)
    : undefined

  // If routed to a folder id that doesn't exist (404 / deleted), redirect home.
  useEffect(() => {
    if (folderId && folders !== undefined && !currentFolder) {
      navigate("/gallery", { replace: true })
    }
  }, [folderId, folders, currentFolder, navigate])

  const childFolders = useMemo(
    () =>
      allFolders
        .filter((f) => (f.parentFolderId ?? null) === (folderId ?? null))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allFolders, folderId],
  )

  const childImages = useMemo(
    () => allImages.filter((m) => (m.folderId ?? null) === (folderId ?? null)),
    [allImages, folderId],
  )

  const breadcrumbs = useMemo(() => {
    const chain: FolderRow[] = []
    let cursor: Id<"folders"> | undefined = folderId
    const byId = new Map(allFolders.map((f) => [f._id, f]))
    while (cursor) {
      const f = byId.get(cursor)
      if (!f) break
      chain.unshift(f)
      cursor = f.parentFolderId
    }
    return chain
  }, [allFolders, folderId])

  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetFolderId: Id<"folders"> | null,
  ) => {
    e.preventDefault()
    setDropTarget(null)
    const imgId = e.dataTransfer.getData("application/x-image-id") as
      | Id<"images">
      | ""
    if (!imgId) return
    const img = allImages.find((m) => m._id === imgId)
    if (!img) return
    if ((img.folderId ?? null) === targetFolderId) return
    try {
      await moveImage({ token, imageId: imgId, folderId: targetFolderId })
    } catch {
      // ignore
    }
  }

  const dragOverFolder =
    (id: Id<"folders"> | "root") => (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes("application/x-image-id")) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (dropTarget !== id) setDropTarget(id)
    }

  const dragLeaveFolder = (id: Id<"folders"> | "root") => () => {
    if (dropTarget === id) setDropTarget(null)
  }

  const loading = items === undefined || folders === undefined
  const empty =
    !loading && childFolders.length === 0 && childImages.length === 0

  return (
    <main className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl">Gallery</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setNewFolderOpen(true)}
            className={btnSecondary}
          >
            <FolderPlus size={16} /> New folder
          </button>
          <button onClick={() => setUploadOpen(true)} className={btnPrimary}>
            <UploadSimple size={16} /> Upload
          </button>
        </div>
      </header>

      {(breadcrumbs.length > 0 || folderId) && (
        <nav className="mt-8 flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
          <Link
            to="/gallery"
            onDragOver={dragOverFolder("root")}
            onDragLeave={dragLeaveFolder("root")}
            onDrop={(e) => handleDropOnFolder(e, null)}
            className={`rounded px-1 hover:text-brown ${
              dropTarget === "root" ? "bg-sage-soft text-brown" : ""
            }`}
          >
            Gallery
          </Link>
          {breadcrumbs.map((f, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <span key={f._id} className="flex items-center gap-1.5">
                <CaretRight size={12} className="text-border-strong" />
                {isLast ? (
                  <span className="font-semibold text-brown">{f.name}</span>
                ) : (
                  <Link
                    to={`/gallery/${f._id}`}
                    onDragOver={dragOverFolder(f._id)}
                    onDragLeave={dragLeaveFolder(f._id)}
                    onDrop={(e) => handleDropOnFolder(e, f._id)}
                    className={`rounded px-1 hover:text-brown ${
                      dropTarget === f._id ? "bg-sage-soft text-brown" : ""
                    }`}
                  >
                    {f.name}
                  </Link>
                )}
              </span>
            )
          })}
        </nav>
      )}

      <section className="mt-8">
        {loading ? (
          <GridSkeleton />
        ) : empty ? (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-paper/60 px-6 py-16 text-center transition hover:border-sage hover:bg-sage-soft"
          >
            <CloudArrowUp size={32} weight="light" className="text-fg-subtle" />
            <div>
              <p className="font-display text-lg text-brown">
                {folderId ? "This folder is empty" : "No photos or videos yet"}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Click to upload your first photo.
              </p>
            </div>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {childFolders.map((f) => (
              <FolderTile
                key={f._id}
                folder={f}
                canEdit={user?._id === f.createdBy || user?.admin === true}
                onRename={() => setRenamingFolder(f)}
                onDelete={() => setDeletingFolder(f)}
                isDropTarget={dropTarget === f._id}
                onDragOver={dragOverFolder(f._id)}
                onDragLeave={dragLeaveFolder(f._id)}
                onDrop={(e) => handleDropOnFolder(e, f._id)}
              />
            ))}
            {childImages.map((m, i) => {
              const canEditMedia =
                user?._id === m.uploadedBy || user?.admin === true
              return (
                <Tile
                  key={m._id}
                  media={m}
                  canEdit={canEditMedia}
                  onOpen={() => setViewer({ index: i })}
                  onRename={() => setRenaming(m)}
                  onDelete={() => setConfirmDelete(m)}
                  draggable={canEditMedia}
                  isDragging={draggingId === m._id}
                  onDragStart={(e) => {
                    if (!canEditMedia) {
                      e.preventDefault()
                      return
                    }
                    e.dataTransfer.effectAllowed = "move"
                    e.dataTransfer.setData("application/x-image-id", m._id)
                    setDraggingId(m._id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                />
              )
            })}
          </div>
        )}
      </section>

      {uploadOpen && (
        <UploadModal
          folderId={folderId}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => setUploadOpen(false)}
        />
      )}
      {newFolderOpen && (
        <NewFolderModal
          parentFolderId={folderId}
          kind="gallery"
          onClose={() => setNewFolderOpen(false)}
        />
      )}
      {renaming && (
        <RenameModal media={renaming} onClose={() => setRenaming(null)} />
      )}
      {renamingFolder && (
        <RenameFolderModal
          folder={renamingFolder}
          onClose={() => setRenamingFolder(null)}
        />
      )}
      {deletingFolder && (
        <DeleteFolderModal
          folder={deletingFolder}
          onClose={() => setDeletingFolder(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete this item?"
          message={`"${
            confirmDelete.title ?? "Untitled"
          }" will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await removeImage({ token, imageId: confirmDelete._id })
            setConfirmDelete(null)
          }}
        />
      )}
      {viewer !== null && childImages.length > 0 && (
        <Viewer
          items={childImages}
          index={Math.min(viewer.index, childImages.length - 1)}
          onIndex={(i) => setViewer({ index: i })}
          onClose={() => setViewer(null)}
        />
      )}
    </main>
  )
}
