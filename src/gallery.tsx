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
          <Link to="/gallery" className="hover:text-brown">
            Gallery
          </Link>
          {breadcrumbs.map((f, i) => (
            <span key={f._id} className="flex items-center gap-1.5">
              <CaretRight size={12} className="text-border-strong" />
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-brown">{f.name}</span>
              ) : (
                <Link to={`/gallery/${f._id}`} className="hover:text-brown">
                  {f.name}
                </Link>
              )}
            </span>
          ))}
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
              />
            ))}
            {childImages.map((m, i) => (
              <Tile
                key={m._id}
                media={m}
                canEdit={user?._id === m.uploadedBy || user?.admin === true}
                onOpen={() => setViewer({ index: i })}
                onRename={() => setRenaming(m)}
                onDelete={() => setConfirmDelete(m)}
              />
            ))}
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
