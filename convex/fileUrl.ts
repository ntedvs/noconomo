const URL_TTL_MS = 60 * 60 * 1000

function getSecret(): string {
  const secret = process.env.FILE_URL_SECRET
  if (!secret) {
    throw new Error(
      "FILE_URL_SECRET is not set. Run: npx convex env set FILE_URL_SECRET <random-string>",
    )
  }
  return secret
}

function base64UrlEncode(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(input: string): ArrayBuffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad
  const bin = atob(b64)
  const buf = new ArrayBuffer(bin.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  return buf
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

async function sign(message: string): Promise<string> {
  const key = await importHmacKey(getSecret())
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  )
  return base64UrlEncode(new Uint8Array(sig))
}

export async function verifyFileUrl(
  storageId: string,
  expiresAt: number,
  signature: string,
): Promise<boolean> {
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  const key = await importHmacKey(getSecret())
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(`${storageId}.${expiresAt}`),
    )
  } catch {
    return false
  }
}

export async function fileProxyUrl(storageId: string): Promise<string> {
  const base = process.env.CONVEX_SITE_URL ?? ""
  const expiresAt = Date.now() + URL_TTL_MS
  const signature = await sign(`${storageId}.${expiresAt}`)
  return `${base}/file?id=${encodeURIComponent(storageId)}&e=${expiresAt}&s=${signature}`
}
