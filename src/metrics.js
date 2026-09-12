const NAMESPACE = "rpggamerph";

export const METRIC_KEYS = {
  visits: "advga-visits",
  searches: "advga-searches",
  deckAdds: "advga-deck-adds",
  exports: "advga-exports",
  lightboxOpens: "advga-lightbox-opens",
  deckFullscreen: "advga-deck-fullscreen",
  analyticsViews: "advga-analytics-views",
};

const VISITOR_RECORDED_KEY = "advga.visitorRecorded";
const ANALYTICS_VIEW_RECORDED_KEY = "advga.analyticsViewRecorded";
const LOCATION_RECORDED_KEY = "advga.locationRecorded";
const SESSION_GEO_KEY = "advga.sessionGeo";
const LOCATION_COUNTED_KEY = "advga.locationCounted";
const COUNTRY_PREFIX = "advga-country-";
const COUNTRY_UNKNOWN_KEY = "advga-country-UNK";
const DEMOGRAPHICS_CACHE_KEY = "advga.locationDemographicsCache";
const DEMOGRAPHICS_CACHE_MS = 300_000;
const COUNTAPI_BASE = "https://countapi.mileshilliard.com/api/v1";

function namespacedKey(key) {
  return `${NAMESPACE}-${key}`;
}

function parseCount(payload) {
  const value = Number.parseInt(String(payload?.value ?? ""), 10);
  return Number.isFinite(value) ? value : null;
}

export function formatCount(value) {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }
  return Math.max(0, Math.floor(value)).toLocaleString();
}

async function hitMetric(key) {
  try {
    return (await fetch(`${COUNTAPI_BASE}/hit/${namespacedKey(key)}`)).ok;
  } catch (error) {
    console.warn(`Metric hit failed for ${key}`, error);
    return false;
  }
}

async function getMetric(key) {
  try {
    const response = await fetch(`${COUNTAPI_BASE}/get/${namespacedKey(key)}`);
    if (response.status === 404) {
      return 0;
    }
    return response.ok ? parseCount(await response.json()) : null;
  } catch (error) {
    console.warn(`Metric get failed for ${key}`, error);
    return null;
  }
}

async function hitAndReadMetric(key) {
  try {
    const response = await fetch(`${COUNTAPI_BASE}/hit/${namespacedKey(key)}`);
    return response.ok ? parseCount(await response.json()) : null;
  } catch (error) {
    console.warn(`Metric hit+read failed for ${key}`, error);
    return null;
  }
}

export async function getAllMetrics() {
  const entries = await Promise.all(
    Object.entries(METRIC_KEYS).map(async ([name, key]) => [name, await getMetric(key)]),
  );
  return Object.fromEntries(entries);
}

function countryKey(code) {
  return `${COUNTRY_PREFIX}${String(code || "UNK").toUpperCase()}`;
}

function listRegionCodes() {
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const codes = [];
  for (let a = 65; a <= 90; a += 1) {
    for (let b = 65; b <= 90; b += 1) {
      const code = `${String.fromCharCode(a)}${String.fromCharCode(b)}`;
      const name = displayNames.of(code);
      if (name && name !== code) {
        codes.push(code);
      }
    }
  }
  return codes;
}

function fetchWithTimeout(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timer));
}

function normalizeGeo(payload) {
  if (!payload?.countryCode) {
    return null;
  }
  return {
    city: payload.city || "",
    country: payload.country || "",
    countryCode: String(payload.countryCode).toUpperCase(),
    region: payload.region || "",
  };
}

async function geoFromIpWho() {
  const response = await fetchWithTimeout("https://ipwho.is/");
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.success
    ? normalizeGeo({
        city: data.city,
        country: data.country,
        countryCode: data.country_code,
        region: data.region,
      })
    : null;
}

async function geoFromIpApi() {
  const response = await fetchWithTimeout("https://ipapi.co/json/");
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.error
    ? null
    : normalizeGeo({
        city: data.city,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
      });
}

async function geoFromCloudflare() {
  const response = await fetchWithTimeout("https://cloudflare-dns.com/cdn-cgi/trace");
  if (!response.ok) {
    return null;
  }
  const match = (await response.text()).match(/^loc=([A-Za-z]{2})$/m)?.[1];
  if (!match) {
    return null;
  }
  const code = match.toUpperCase();
  return normalizeGeo({
    city: "",
    country: new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code,
    countryCode: code,
    region: "",
  });
}

async function resolveVisitorGeo() {
  for (const provider of [geoFromIpWho, geoFromIpApi, geoFromCloudflare]) {
    try {
      const geo = await provider();
      if (geo) {
        return geo;
      }
    } catch (error) {
      console.warn("Visitor geo provider failed", error);
    }
  }
  return null;
}

function readSessionGeo() {
  try {
    const raw = sessionStorage.getItem(SESSION_GEO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionGeo(geo) {
  if (geo) {
    sessionStorage.setItem(SESSION_GEO_KEY, JSON.stringify(geo));
  }
}

async function countSessionLocation(geo) {
  if (sessionStorage.getItem(LOCATION_COUNTED_KEY)) {
    return;
  }
  sessionStorage.setItem(LOCATION_COUNTED_KEY, "1");
  if (!geo?.countryCode) {
    await hitMetric(COUNTRY_UNKNOWN_KEY);
    return;
  }
  await hitMetric(countryKey(geo.countryCode));
}

export async function ensureVisitorGeo() {
  let geo = readSessionGeo();
  if (geo?.countryCode) {
    return geo;
  }
  geo = await resolveVisitorGeo();
  writeSessionGeo(geo);
  sessionStorage.setItem(LOCATION_RECORDED_KEY, "1");
  await countSessionLocation(geo);
  return geo;
}

async function recordLocationIfNeeded() {
  if (sessionStorage.getItem(LOCATION_RECORDED_KEY)) {
    const cached = readSessionGeo();
    return cached?.countryCode ? cached : ensureVisitorGeo();
  }
  sessionStorage.setItem(LOCATION_RECORDED_KEY, "1");
  const geo = await resolveVisitorGeo();
  writeSessionGeo(geo);
  await countSessionLocation(geo);
  return geo;
}

function readDemographicsCache() {
  try {
    const raw = sessionStorage.getItem(DEMOGRAPHICS_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return Date.now() - parsed.savedAt > DEMOGRAPHICS_CACHE_MS ? null : parsed.countries;
  } catch {
    return null;
  }
}

function writeDemographicsCache(countries) {
  sessionStorage.setItem(
    DEMOGRAPHICS_CACHE_KEY,
    JSON.stringify({ savedAt: Date.now(), countries }),
  );
}

export async function getCountryDemographics() {
  const cached = readDemographicsCache();
  if (cached) {
    return cached;
  }

  const codes = listRegionCodes();
  const countries = [];
  for (let index = 0; index < codes.length; index += 48) {
    const batch = codes.slice(index, index + 48);
    const counts = await Promise.all(
      batch.map(async (code) => ({ code, count: (await getMetric(countryKey(code))) ?? 0 })),
    );
    countries.push(...counts.filter((entry) => entry.count > 0));
  }

  const unknown = (await getMetric(COUNTRY_UNKNOWN_KEY)) ?? 0;
  if (unknown > 0) {
    countries.push({ code: "UNK", count: unknown });
  }
  countries.sort((a, b) => b.count - a.count);

  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  const named = countries.map((entry) => ({
    code: entry.code,
    count: entry.count,
    name: entry.code === "UNK" ? "Unknown / private" : displayNames.of(entry.code) || entry.code,
  }));
  writeDemographicsCache(named);
  return named;
}

export async function recordVisit() {
  if (sessionStorage.getItem(VISITOR_RECORDED_KEY)) {
    return getMetric(METRIC_KEYS.visits);
  }
  sessionStorage.setItem(VISITOR_RECORDED_KEY, "1");
  const value = await hitAndReadMetric(METRIC_KEYS.visits);
  await recordLocationIfNeeded();
  return value;
}

export async function populateVisitorCount(element) {
  if (!element) {
    return;
  }
  element.textContent = formatCount(await recordVisit());
}

export async function recordAnalyticsView() {
  if (sessionStorage.getItem(ANALYTICS_VIEW_RECORDED_KEY)) {
    return;
  }
  sessionStorage.setItem(ANALYTICS_VIEW_RECORDED_KEY, "1");
  await hitMetric(METRIC_KEYS.analyticsViews);
}

export function recordSearch() {
  void hitMetric(METRIC_KEYS.searches);
}

export function recordDeckAdd() {
  void hitMetric(METRIC_KEYS.deckAdds);
}

export function recordExport() {
  void hitMetric(METRIC_KEYS.exports);
}

export function recordLightboxOpen() {
  void hitMetric(METRIC_KEYS.lightboxOpens);
}

export function recordDeckFullscreen() {
  void hitMetric(METRIC_KEYS.deckFullscreen);
}
