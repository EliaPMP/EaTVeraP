// Storage helper.
//
// The original template uploaded images to Manus's hosted storage proxy. That
// service isn't available outside Manus, so this implementation keeps images
// inline as base64 data URLs — no external bucket or credentials required.
//
// This is intentionally simple for launch: data URLs render directly in the
// browser and are accepted by the AI analysis layer. For high-volume image
// hosting, swap this for S3 / Cloudflare R2 / Vercel Blob (the AWS S3 SDK is
// already a dependency) — the signature below is all the callers depend on.

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toBase64(data: Buffer | Uint8Array | string): string {
  if (typeof data === "string") return Buffer.from(data).toString("base64");
  return Buffer.from(data).toString("base64");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = `data:${contentType};base64,${toBase64(data)}`;
  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  // No persistent backing store; return the key as an opaque reference.
  return { key, url: key };
}
