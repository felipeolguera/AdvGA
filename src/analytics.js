import "./styles.css";
import "./analytics.css";
import {
  ensureVisitorGeo,
  formatCount,
  getAllMetrics,
  getCountryDemographics,
  populateVisitorCount,
  recordAnalyticsView,
} from "./metrics.js";
import { APP_VERSION, mountSiteFooter, mountSiteNav } from "./site-chrome.js";

const BASE_URL = import.meta.env.BASE_URL || "/AdvGA/";
const LAUNCH_DATE = new Date("2026-03-15T00:00:00Z");

const root = document.querySelector("#analytics-app");
root.innerHTML = `
  <main class="analytics-page" id="analytics-page">
    <header class="analytics-hero">
      <div class="analytics-hero-top">
        <p class="analytics-updated" id="analytics-updated">Loading metrics…</p>
      </div>
      <p class="eyebrow">Website analytics</p>
      <h1>AdvGA audience &amp; engagement</h1>
      <p class="analytics-hero-copy">
        Live visitor counts, geographic demographics, search and deck-builder activity, and session performance.
      </p>
    </header>

    <section class="analytics-grid analytics-grid--kpis" id="analytics-kpis" aria-label="Key performance indicators"></section>

    <div class="analytics-grid analytics-grid--duo">
      <section class="analytics-panel" id="analytics-reach-panel" aria-labelledby="reach-title"></section>
      <section class="analytics-panel" id="analytics-engagement-panel" aria-labelledby="engagement-title"></section>
    </div>

    <section class="analytics-panel" id="analytics-demographics-panel" aria-labelledby="demographics-title"></section>

    <section class="analytics-panel" id="analytics-usage-panel" aria-labelledby="usage-title"></section>

    <section class="analytics-panel" id="analytics-performance-panel" aria-labelledby="performance-title"></section>

    <section class="analytics-panel" id="analytics-privacy-panel" aria-labelledby="privacy-title"></section>

    <div id="site-footer-mount"></div>
  </main>
`;

const page = document.querySelector("#analytics-page");
mountSiteNav({
  baseUrl: BASE_URL,
  activePage: "analytics",
  target: page,
  before: page?.querySelector(".analytics-hero"),
});
mountSiteFooter({
  baseUrl: BASE_URL,
  label: "Analytics",
  showVisitorCount: true,
  populateVisitors: false,
  target: document.querySelector("#site-footer-mount"),
});

const visitorCountEl = document.querySelector("#visitor-count-value");
const updatedEl = document.querySelector("#analytics-updated");
void loadAnalytics();

async function loadAnalytics() {
  void populateVisitorCount(visitorCountEl);
  await recordAnalyticsView();

  const [metrics, countries, sessionGeo] = await Promise.all([
    getAllMetrics(),
    getCountryDemographics(),
    ensureVisitorGeo(),
  ]);
  const derived = deriveMetrics(metrics, countries);
  const performance = readSessionPerformance();

  updatedEl.textContent = `Last refreshed ${new Date().toLocaleString()} · v${APP_VERSION}`;
  renderKpis(metrics, derived);
  renderReach(metrics, derived);
  renderEngagement(metrics, derived);
  renderDemographics(countries, derived, sessionGeo);
  renderUsage(metrics, derived);
  renderPerformance(performance);
  renderPrivacy();
}

function deriveMetrics(metrics, countries) {
  const visits = metrics.visits ?? 0;
  const searches = metrics.searches ?? 0;
  const deckAdds = metrics.deckAdds ?? 0;
  const exports = metrics.exports ?? 0;
  const lightboxOpens = metrics.lightboxOpens ?? 0;
  const deckFullscreen = metrics.deckFullscreen ?? 0;
  const analyticsViews = metrics.analyticsViews ?? 0;
  const daysLive = Math.max(1, Math.ceil((Date.now() - LAUNCH_DATE.getTime()) / 86_400_000));
  const avgDailyVisits = visits / daysLive;
  const searchRate = visits > 0 ? (searches / visits) * 100 : 0;
  const deckAddRate = visits > 0 ? (deckAdds / visits) * 100 : 0;
  const exportRate = visits > 0 ? (exports / visits) * 100 : 0;
  const lightboxRate = visits > 0 ? (lightboxOpens / visits) * 100 : 0;
  const builderDepth = visits > 0 ? ((deckFullscreen + exports) / visits) * 100 : 0;
  const analyticsReach = visits > 0 ? (analyticsViews / visits) * 100 : 0;
  const locatedVisitors = countries.reduce((sum, entry) => sum + entry.count, 0);
  const topCountry = countries[0] ?? null;
  const topCountryShare = locatedVisitors > 0 && topCountry ? (topCountry.count / locatedVisitors) * 100 : 0;

  return {
    daysLive,
    avgDailyVisits,
    searchRate,
    deckAddRate,
    exportRate,
    lightboxRate,
    builderDepth,
    analyticsReach,
    estimatedReach: Math.round(visits * 1.35 + searches * 0.2),
    engagementScore: Math.min(
      100,
      Math.round(searchRate * 0.35 + deckAddRate * 0.3 + exportRate * 0.2 + lightboxRate * 0.15),
    ),
    cardsPerSearch: searches > 0 ? deckAdds / searches : 0,
    exportsPerDeckBuilder: deckFullscreen > 0 ? exports / deckFullscreen : 0,
    locatedVisitors,
    topCountry,
    topCountryShare,
    countryCount: countries.length,
  };
}

function renderKpis(metrics, derived) {
  const host = document.querySelector("#analytics-kpis");
  const cards = [
    {
      className: "analytics-kpi--visitors",
      value: formatCount(metrics.visits),
      label: "Total visitors",
      note: `${formatCount(derived.avgDailyVisits)} avg visits / day since launch`,
    },
    {
      className: "analytics-kpi--reach",
      value: formatCount(derived.locatedVisitors),
      label: "Located visitors",
      note: `${derived.countryCount} countries / regions with at least one visit`,
    },
    {
      className: "analytics-kpi--engagement",
      value: `${derived.engagementScore}%`,
      label: "Engagement index",
      note: "Weighted search, deck, export, and inspect activity",
    },
    {
      className: "analytics-kpi--performance",
      value: derived.topCountry ? derived.topCountry.code : "—",
      label: "Top location",
      note: derived.topCountry
        ? `${derived.topCountry.name} · ${formatPercent(derived.topCountryShare)} of located traffic`
        : "Location data will appear after more visits",
    },
  ];

  host.replaceChildren(
    ...cards.map((card) => {
      const article = document.createElement("article");
      article.className = `analytics-kpi ${card.className}`;
      article.innerHTML = `
        <strong class="analytics-kpi-value">${card.value}</strong>
        <span class="analytics-kpi-label">${card.label}</span>
        <span class="analytics-kpi-note">${card.note}</span>
      `;
      return article;
    }),
  );
}

function renderReach(metrics, derived) {
  const panel = document.querySelector("#analytics-reach-panel");
  panel.innerHTML = `
    <h2 id="reach-title">Reach &amp; viewership</h2>
    <p class="analytics-panel-intro">
      How many people discover and return to AdvGA. Visitor counts are global; rates compare actions to total visits.
    </p>
    <div class="analytics-stat-table" id="reach-stats"></div>
  `;
  const rows = [
    ["Total site visitors", formatCount(metrics.visits), "Unique browser sessions counted once per visit"],
    [
      "Analytics page views",
      formatCount(metrics.analyticsViews),
      `${formatPercent(derived.analyticsReach)} of visitors open this dashboard`,
    ],
    [
      "Average daily visitors",
      formatCount(derived.avgDailyVisits),
      `Across ${derived.daysLive} days since ${formatLaunchDate(LAUNCH_DATE)}`,
    ],
    [
      "Estimated total reach",
      formatCount(derived.estimatedReach),
      "Visitors plus modeled secondary impressions from search activity",
    ],
    [
      "Viewership depth",
      formatPercent(derived.builderDepth),
      "Share of visitors who open fullscreen deck or export",
    ],
  ];
  panel.querySelector("#reach-stats").replaceChildren(...rows.map(createStatRow));
}

function renderEngagement(metrics, derived) {
  const panel = document.querySelector("#analytics-engagement-panel");
  panel.innerHTML = `
    <h2 id="engagement-title">Engagement</h2>
    <p class="analytics-panel-intro">
      Interaction quality: how often visitors search, inspect cards, build decks, and export lists.
    </p>
    <div class="analytics-bar-list" id="engagement-bars"></div>
  `;
  const bars = [
    ["Searches", metrics.searches ?? 0, derived.searchRate],
    ["Deck adds", metrics.deckAdds ?? 0, derived.deckAddRate],
    ["Lightbox opens", metrics.lightboxOpens ?? 0, derived.lightboxRate],
    ["Fullscreen deck", metrics.deckFullscreen ?? 0, derived.builderDepth],
    ["Deck exports", metrics.exports ?? 0, derived.exportRate],
  ];
  const max = Math.max(1, ...bars.map(([, count]) => count));
  panel
    .querySelector("#engagement-bars")
    .replaceChildren(
      ...bars.map(([label, count, rate]) =>
        createBar(label, count, (count / max) * 100, formatPercent(rate)),
      ),
    );
}

function renderDemographics(countries, derived, sessionGeo) {
  const panel = document.querySelector("#analytics-demographics-panel");
  const sessionLabel = formatSessionLocation(sessionGeo);
  const located = Math.max(1, derived.locatedVisitors);

  panel.innerHTML = `
    <h2 id="demographics-title">Audience location</h2>
    <p class="analytics-panel-intro">
      Country-level demographics from visitor IP geolocation (one sample per session). VPNs and privacy tools may show as unknown.
    </p>
    <div class="analytics-location-session" id="analytics-session-location"></div>
    <div class="analytics-bar-list" id="demographics-bars"></div>
    <div class="analytics-stat-table" id="demographics-table"></div>
  `;

  panel.querySelector("#analytics-session-location").textContent = sessionLabel
    ? `Your session: ${sessionLabel}`
    : "Your session: location could not be detected. Try refreshing, or visit the search page first, then return here.";

  if (countries.length === 0) {
    panel.querySelector("#demographics-bars").replaceChildren(
      Object.assign(document.createElement("p"), {
        className: "analytics-panel-intro",
        textContent:
          "No country data yet. Visit the main search page from a few regions to populate this chart.",
      }),
    );
    panel.querySelector("#demographics-table").replaceChildren();
    return;
  }

  const top = Math.max(1, countries[0].count);
  panel
    .querySelector("#demographics-bars")
    .replaceChildren(
      ...countries
        .slice(0, 12)
        .map((entry) =>
          createBar(
            entry.name,
            entry.count,
            (entry.count / top) * 100,
            formatPercent((entry.count / located) * 100),
          ),
        ),
    );

  const rows = countries.map((entry) => [
    entry.name,
    formatCount(entry.count),
    `${formatPercent((entry.count / located) * 100)} of located visitors`,
  ]);
  panel.querySelector("#demographics-table").replaceChildren(...rows.map(createStatRow));
}

function renderUsage(metrics, derived) {
  const panel = document.querySelector("#analytics-usage-panel");
  panel.innerHTML = `
    <h2 id="usage-title">Product usage breakdown</h2>
    <p class="analytics-panel-intro">
      Feature-level counters for the card search experience, deck builder, and sharing tools.
    </p>
    <div class="analytics-detail-grid" id="usage-details"></div>
  `;
  const details = [
    {
      title: "Search activity",
      body: `${formatCount(metrics.searches)} natural-language searches executed. ${formatPercent(derived.searchRate)} of visits include at least one search path.`,
    },
    {
      title: "Deck building",
      body: `${formatCount(metrics.deckAdds)} cards added via Qty picker. Average ${derived.cardsPerSearch.toFixed(2)} adds per search when searches &gt; 0.`,
    },
    {
      title: "Card inspection",
      body: `${formatCount(metrics.lightboxOpens)} lightbox detail views. Players review art, stats, and effects before committing copies.`,
    },
    {
      title: "Deck export loop",
      body: `${formatCount(metrics.exports)} deck exports copied. ${derived.exportsPerDeckBuilder.toFixed(2)} exports per fullscreen deck session on average.`,
    },
    {
      title: "Fullscreen builder",
      body: `${formatCount(metrics.deckFullscreen)} fullscreen deck sessions. Includes analytics, section totals, and Material/Main/Side columns.`,
    },
    {
      title: "Filter tags",
      body: "Result tag filters (Type, Element, Subtype) narrow loaded cards client-side without extra API calls.",
    },
  ];
  panel.querySelector("#usage-details").replaceChildren(
    ...details.map((detail) => {
      const article = document.createElement("article");
      article.className = "analytics-detail-card";
      article.innerHTML = `<h3>${detail.title}</h3><p>${detail.body}</p>`;
      return article;
    }),
  );
}

function renderPerformance(performance) {
  const panel = document.querySelector("#analytics-performance-panel");
  panel.innerHTML = `
    <h2 id="performance-title">Session performance</h2>
    <p class="analytics-panel-intro">
      Page load timings for this browser session (Navigation Timing and Paint APIs).
    </p>
    <div class="analytics-stat-table" id="performance-stats"></div>
  `;
  const rows = [
    ["Page load (DOM ready)", performance.domReady, performance.domReadyRating],
    ["Full page load", performance.loadEvent, performance.loadEventRating],
    ["First paint", performance.firstPaint, performance.firstPaintRating],
    ["DNS + connection", performance.connection, "Network handshake time"],
  ];
  panel.querySelector("#performance-stats").replaceChildren(...rows.map(createStatRow));
}

function renderPrivacy() {
  const panel = document.querySelector("#analytics-privacy-panel");
  panel.innerHTML = `
    <h2 id="privacy-title">Privacy &amp; data notes</h2>
    <p class="analytics-methodology">
      Visitor and engagement counters are anonymous totals. Location uses a one-time IP geolocation lookup per session
      (country and region only; no names or accounts). Deck lists stay in your browser’s local storage.
      Derived metrics (daily averages, engagement index, reach estimates) are calculated on this page from raw counters
      and a documented launch date of ${formatLaunchDate(LAUNCH_DATE)}.
    </p>
  `;
}

function readSessionPerformance() {
  const navigation = performance.getEntriesByType("navigation")[0];
  const firstPaint = performance.getEntriesByType("paint").find((entry) => entry.name === "first-paint");
  if (!navigation) {
    return {
      domReady: "—",
      domReadyRating: "Unavailable in this browser",
      loadEvent: "—",
      loadEventRating: "—",
      firstPaint: "—",
      firstPaintRating: "—",
      connection: "—",
    };
  }

  const domReady = navigation.domContentLoadedEventEnd - navigation.startTime;
  const loadEvent = navigation.loadEventEnd - navigation.startTime;
  const connection = navigation.connectEnd - navigation.fetchStart;
  const paint = firstPaint ? firstPaint.startTime : null;

  return {
    domReady: formatMs(domReady),
    domReadyRating: rateLoad(domReady),
    loadEvent: formatMs(loadEvent),
    loadEventRating: rateLoad(loadEvent),
    firstPaint: paint === null ? "—" : formatMs(paint),
    firstPaintRating: paint === null ? "Not reported" : ratePaint(paint),
    connection: formatMs(connection),
  };
}

function formatSessionLocation(geo) {
  return geo ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ") : "";
}

function createStatRow([label, value, note]) {
  const row = document.createElement("div");
  row.className = "analytics-stat-row";
  row.innerHTML = `<strong>${label}</strong><span>${value}</span><span>${note}</span>`;
  return row;
}

function createBar(label, count, fillPercent, rateLabel) {
  const row = document.createElement("div");
  row.className = "analytics-bar";
  row.innerHTML = `
    <span class="analytics-bar-label">${label}</span>
    <div class="analytics-bar-track">
      <div class="analytics-bar-fill" style="width: ${Math.min(100, fillPercent).toFixed(1)}%"></div>
    </div>
    <span class="analytics-bar-value">${formatCount(count)} · ${rateLabel}</span>
  `;
  return row;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";
}

function formatMs(value) {
  return !Number.isFinite(value) || value < 0 ? "—" : `${Math.round(value)} ms`;
}

function formatLaunchDate(date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function rateLoad(ms) {
  if (ms < 1200) return "Excellent";
  if (ms < 2500) return "Good";
  if (ms < 4000) return "Fair";
  return "Slow — check network";
}

function ratePaint(ms) {
  if (ms < 1000) return "Fast first paint";
  if (ms < 2000) return "Acceptable";
  return "Heavy paint — large assets";
}
