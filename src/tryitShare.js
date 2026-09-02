function toBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.length % 4 === 0 ? normalized : `${normalized}${"=".repeat(4 - (normalized.length % 4))}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function gzipUtf8(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipUtf8(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

export async function encodeDeckSharePayload(text) {
  const source = String(text || "");
  try {
    if (typeof CompressionStream === "function") {
      return `g.${toBase64Url(await gzipUtf8(source))}`;
    }
  } catch {
    // Fall through to uncompressed encoding.
  }
  return `u.${toBase64Url(new TextEncoder().encode(source))}`;
}

export async function decodeDeckSharePayload(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    return "";
  }

  const prefixed = value.match(/^([gu])\.(.+)$/i);
  if (prefixed) {
    const kind = prefixed[1].toLowerCase();
    const bytes = fromBase64Url(prefixed[2]);
    if (kind === "g") {
      return gunzipUtf8(bytes);
    }
    return new TextDecoder().decode(bytes);
  }

  return new TextDecoder().decode(fromBase64Url(value));
}

export function readDeckSharePayload(locationLike = window.location) {
  const search = new URLSearchParams(locationLike.search || "");
  const fromQuery = search.get("d") || search.get("deck");
  if (fromQuery) {
    return fromQuery;
  }

  const hash = String(locationLike.hash || "").replace(/^#/, "");
  if (!hash) {
    return "";
  }
  if (hash.includes("=")) {
    return new URLSearchParams(hash).get("d") || new URLSearchParams(hash).get("deck") || "";
  }
  return "";
}

export function getTryItPageAbsoluteUrl(locationLike = window.location, baseUrl = import.meta.env.BASE_URL) {
  return new URL("tryit.html", new URL(baseUrl || "./", locationLike.href)).href;
}

export function buildDeckShareUrl(pageUrl, payload) {
  const url = new URL(pageUrl);
  url.search = "";
  url.hash = `d=${payload}`;
  return url.href;
}
