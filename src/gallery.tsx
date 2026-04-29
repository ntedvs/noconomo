import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { FilePlusIcon, PlayIcon, TrashIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { useAuth } from "./auth";

type Media = {
  _id: Id<"images">;
  url: string | null;
  posterUrl: string | null;
  contentType?: string;
  uploadedBy: Id<"users">;
  uploaderName: string;
  title?: string;
  _creationTime: number;
};

const isVideo = (m: Media) => (m.contentType ?? "").startsWith("video/");

export default function Gallery() {
  const { token, user } = useAuth();
  const items = useQuery(api.images.list, { token });
  const removeImage = useMutation(api.images.remove);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playing, setPlaying] = useState<Media | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Media | null>(null);

  return (
    <div className="p-4">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Gallery</h2>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50"
        >
          <UploadSimpleIcon weight="bold" />
          Upload
        </button>
      </header>

      {items === undefined ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">No images yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((m) => {
            const media = m as Media;
            const video = isVideo(media);
            const thumb = video ? media.posterUrl : media.url;
            const Wrapper: React.ElementType = video ? "button" : "div";
            return (
              <figure key={media._id} className="relative group">
                <Wrapper
                  className="block w-full relative"
                  {...(video ? { onClick: () => setPlaying(media) } : {})}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={media.title ?? ""}
                      className="w-full aspect-square object-cover rounded bg-gray-100"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 rounded" />
                  )}
                  {video && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/60 text-white p-3">
                        <PlayIcon weight="fill" size={24} />
                      </span>
                    </span>
                  )}
                </Wrapper>
                {user?._id === media.uploadedBy && (
                  <button
                    onClick={() => setConfirmDelete(media)}
                    className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100"
                    aria-label="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
                <figcaption className="mt-1 text-sm">
                  <TitleField media={media} canEdit={user?._id === media.uploadedBy} />
                  <div className="text-gray-600">
                    {media.uploaderName} - {format(new Date(media._creationTime), "MMMM d, yyyy")}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={() => setUploadOpen(false)} />
      )}

      {playing && <VideoModal media={playing} onClose={() => setPlaying(null)} />}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this item?"
          message={`"${confirmDelete.title ?? "Untitled"}" will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await removeImage({ token, imageId: confirmDelete._id });
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function useEscape(onEscape: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEscape]);
}

function TitleField({ media, canEdit }: { media: Media; canEdit: boolean }) {
  const { token } = useAuth();
  const setTitle = useMutation(api.images.setTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(media.title ?? "");

  if (!canEdit) {
    return <div className="font-medium truncate">{media.title ?? "Untitled"}</div>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(media.title ?? "");
          setEditing(true);
        }}
        className="font-medium truncate text-left w-full hover:bg-gray-100 rounded px-1 -mx-1"
        title="Click to rename"
      >
        {media.title ?? "Untitled"}
      </button>
    );
  }

  const save = async () => {
    if ((draft.trim() || undefined) !== media.title) {
      await setTitle({ token, imageId: media._id, title: draft });
    }
    setEditing(false);
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          setDraft(media.title ?? "");
          setEditing(false);
        }
      }}
      placeholder="Untitled"
      className="font-medium w-full border rounded px-1 -mx-1"
    />
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  useEscape(() => {
    if (!busy) onCancel();
  });
  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={() => !busy && onCancel()}
    >
      <div className="bg-white rounded w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={run}
            disabled={busy}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ media, onClose }: { media: Media; onClose: () => void }) {
  useEscape(onClose);
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="bg-black rounded max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-3 py-2 text-white">
          <span className="font-medium truncate">{media.title ?? "Untitled"}</span>
          <button onClick={onClose} aria-label="Close" className="p-1">
            <XIcon weight="bold" />
          </button>
        </div>
        {media.url && (
          <video
            src={media.url}
            poster={media.posterUrl ?? undefined}
            controls
            autoPlay
            className="w-full max-h-[80vh] bg-black"
          />
        )}
      </div>
    </div>
  );
}

async function generateVideoPoster(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load video"));
    });
    const target = Math.min(0.1, (video.duration || 0) / 2);
    if (Math.abs(video.currentTime - target) > 0.01) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Failed to seek video"));
        video.currentTime = target;
      });
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.8,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const { token } = useAuth();
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const addImage = useMutation(api.images.add);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEscape(onClose);

  const uploadBlob = async (blob: Blob, contentType: string) => {
    const url = await generateUploadUrl({ token });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const { storageId } = (await res.json()) as { storageId: string };
    return storageId as Id<"_storage">;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const isVid = file.type.startsWith("video/");
      let posterStorageId: Id<"_storage"> | undefined;
      if (isVid) {
        try {
          const poster = await generateVideoPoster(file);
          posterStorageId = await uploadBlob(poster, "image/jpeg");
        } catch (e) {
          console.warn("Poster generation failed", e);
        }
      }
      const storageId = await uploadBlob(file, file.type);
      await addImage({
        token,
        storageId,
        title: title.trim() || undefined,
        contentType: file.type || undefined,
        posterStorageId,
      });
      onUploaded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="bg-white rounded w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Upload</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1">
            <XIcon weight="bold" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50 cursor-pointer">
              <FilePlusIcon weight="bold" />
              {file ? "Change file" : "Choose file"}
            </span>
            <span className={`text-sm truncate ${file ? "text-gray-800" : "text-gray-500"}`}>
              {file ? file.name : "No file chosen"}
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="hidden"
            />
          </label>
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-2 py-1"
          />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 rounded hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <UploadSimpleIcon weight="bold" />
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
