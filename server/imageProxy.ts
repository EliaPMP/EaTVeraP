/**
 * Image proxy for product images.
 * Strategy (in order):
 *   1. UPC Item DB barcode lookup — real retailer images (Walmart, Target, Walgreens)
 *   2. Open Food Facts barcode lookup — good for international products
 *   3. UPC Item DB name search — fallback when barcode not in DB
 *   4. Open Food Facts name search — final fallback
 *
 * A serial request queue ensures UPC Item DB is never hit faster than
 * 300ms between requests, preventing "TOO_FAST" rate-limit errors.
 * Results are cached in-memory for the server lifetime.
 */
import type { Express } from "express";

const cache = new Map<string, string | null>();
// In-flight dedup: barcode/name → Promise<string|null>
const inFlight = new Map<string, Promise<string | null>>();

const TIMEOUT_MS = 8000;
const QUEUE_DELAY_MS = 320; // > 300ms between UPC Item DB requests

// --- Simple serial queue for UPC Item DB calls ---
let upcQueueTail: Promise<void> = Promise.resolve();

function enqueueUPCRequest<T>(fn: () => Promise<T>): Promise<T> {
  const result = upcQueueTail.then(() => fn());
  // Advance the tail by the delay AFTER fn resolves
  upcQueueTail = result.then(
    () => sleep(QUEUE_DELAY_MS),
    () => sleep(QUEUE_DELAY_MS)
  );
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJSON(url: string, headers: Record<string, string> = {}): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "EatVera/2.0 (eatvera.app)", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return res.json();
}

function pickBestImage(images: string[]): string | null {
  if (!images || images.length === 0) return null;
  const preferred = images.find(u =>
    u.includes("walmart") || u.includes("target") || u.includes("walgreens") ||
    u.includes("cvs") || u.includes("kroger") || u.includes("amazon")
  );
  return preferred || images[0] || null;
}

async function lookupUPCItemDB(barcode: string): Promise<string | null> {
  return enqueueUPCRequest(async () => {
    try {
      const data = await fetchJSON(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      if (!data || data.code === "TOO_FAST") return null;
      const items: any[] = data.items ?? [];
      for (const item of items) {
        const img = pickBestImage(item.images ?? []);
        if (img) return img;
      }
    } catch {
      // network error — fall through
    }
    return null;
  });
}

async function searchUPCItemDB(name: string, brand?: string): Promise<string | null> {
  return enqueueUPCRequest(async () => {
    try {
      const q = encodeURIComponent(brand ? `${brand} ${name}` : name);
      const data = await fetchJSON(
        `https://api.upcitemdb.com/prod/trial/search?s=${q}&match_mode=0&type=product`
      );
      if (!data || data.code === "TOO_FAST") return null;
      const items: any[] = data.items ?? [];
      for (const item of items) {
        const img = pickBestImage(item.images ?? []);
        if (img) return img;
      }
    } catch {
      // network error — fall through
    }
    return null;
  });
}

async function lookupOFFBarcode(barcode: string): Promise<string | null> {
  try {
    const data = await fetchJSON(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=image_front_small_url,image_front_url,image_url`
    );
    if (!data || data.status === 0) return null;
    const p = data.product ?? {};
    return p.image_front_small_url || p.image_front_url || p.image_url || null;
  } catch {
    return null;
  }
}

async function lookupOFFByName(name: string, brand?: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(brand ? `${name} ${brand}` : name);
    const data = await fetchJSON(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,image_front_small_url,image_front_url`
    );
    if (!data) return null;
    for (const p of data.products ?? []) {
      const img = p.image_front_small_url || p.image_front_url;
      if (img) return img;
    }
  } catch {
    return null;
  }
  return null;
}

async function resolveImage(
  barcode: string,
  name: string,
  brand: string
): Promise<string | null> {
  let imageUrl: string | null = null;

  // 1. UPC Item DB barcode lookup (queued to avoid TOO_FAST)
  if (barcode) {
    imageUrl = await lookupUPCItemDB(barcode);
  }

  // 2. Open Food Facts barcode lookup
  if (!imageUrl && barcode) {
    imageUrl = await lookupOFFBarcode(barcode);
  }

  // 3. UPC Item DB name search (queued)
  if (!imageUrl && name) {
    imageUrl = await searchUPCItemDB(name, brand || undefined);
  }

  // 4. Open Food Facts name search (final fallback)
  if (!imageUrl && name) {
    imageUrl = await lookupOFFByName(name, brand || undefined);
  }

  return imageUrl;
}

export function registerImageProxy(app: Express) {
  app.get("/api/image-proxy", async (req, res) => {
    const barcode = String(req.query.barcode ?? "").trim();
    const name = String(req.query.name ?? "").trim();
    const brand = String(req.query.brand ?? "").trim();

    if (!barcode && !name) {
      return res.status(400).json({ url: null, error: "barcode or name required" });
    }

    const cacheKey = barcode || `name:${name}:${brand}`;

    // Return cached result immediately
    if (cache.has(cacheKey)) {
      return res.json({ url: cache.get(cacheKey) ?? null });
    }

    // Deduplicate in-flight requests for the same product
    if (inFlight.has(cacheKey)) {
      const url = await inFlight.get(cacheKey)!;
      return res.json({ url });
    }

    const promise = resolveImage(barcode, name, brand).then(url => {
      cache.set(cacheKey, url);
      inFlight.delete(cacheKey);
      return url;
    });

    inFlight.set(cacheKey, promise);
    const imageUrl = await promise;
    return res.json({ url: imageUrl });
  });
}
