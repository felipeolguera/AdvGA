import {
  buildJoinUrl,
  connectPlaytestRoom,
  createRoomCode,
  getSelfPeerId,
  normalizeRoomCode,
  readRoomParams,
} from "./multiplayer.js";
import { AGGRO_DECK_SUGGESTIONS } from "./aggroDeckSuggestions.js";
import { PLAY_GUIDES, PRD_DECK_SUGGESTIONS } from "./prdDeckSuggestions.js";
import { getStudioShellHtml, bootStudioPage } from "./studioPage.js";
import {
  buildDeckShareUrl,
  decodeDeckSharePayload,
  encodeDeckSharePayload,
  getTryItPageAbsoluteUrl,
  readDeckSharePayload,
} from "./tryitShare.js";
import "./styles.css";

const API_BASE = "https://api.gatcg.com";
const PAGE_SIZE = 50;
const MAX_SEARCH_PAGES = 80;
const EXAMPLE_QUERY = "fire spells that target units";
const DECK_STORAGE_KEY = "advga.deck";
const DECK_NAME_STORAGE_KEY = "advga.deckName";
const RECENT_SEARCHES_KEY = "advga.recentSearches";
const FREEHAND_STORAGE_KEY = "advga.mainDeckFreehand";
const LOAD_ALL_RESULTS_KEY = "advga.loadAllResults";
const MAX_RECENT_SEARCHES = 8;
const APP_VERSION = "1.39";
const DECK_SUGGESTIONS = [...AGGRO_DECK_SUGGESTIONS, ...PRD_DECK_SUGGESTIONS];
const FEATURED_SET_PREFIX = "PRD";
const PRD_QUICK_SEARCH = "cards in PRD";
const TABLE_HOLD_PREVIEW_MS = 1000;
const OPENING_HAND_DRAW_GLOW_MS = 3000;
const OPENING_HAND_TAP_WINDOW_MS = 380;
const FREEHAND_DOUBLE_CLICK_MS = 500;
const OPENING_HAND_FACE_FLIP_MS = 280;
/** Resolve public assets to absolute URLs so CSS `url()` vars are not relative to the stylesheet. */
function resolvePublicAssetUrl(relativePath) {
  const baseUrl = new URL(import.meta.env.BASE_URL || "./", window.location.href);
  return new URL(relativePath, baseUrl).href;
}
const CARD_BACK_URL = resolvePublicAssetUrl("card-back.jpg");
const IS_TRYIT_PAGE = document.body?.dataset?.page === "tryit";
const IS_STUDIO_PAGE = document.body?.dataset?.page === "studio";
const BUILDER_PAGE_URL = import.meta.env.BASE_URL;
const TRYIT_PAGE_URL = `${import.meta.env.BASE_URL}tryit.html`;
const STUDIO_PAGE_URL = `${import.meta.env.BASE_URL}studio.html`;

document.documentElement.style.setProperty("--card-back-image", `url("${CARD_BACK_URL}")`);
const FREEHAND_CARD_WIDTH = 96;
const FREEHAND_CARD_HEIGHT = 134;
const FREEHAND_GAP_X = 16;
const FREEHAND_GAP_Y = 16;
const FREEHAND_PADDING = 16;
const FREEHAND_HINT_SPACE = 36;
const FREEHAND_SNAP = 16;
const OPENING_HAND_SIZE = 7;
const OPENING_HAND_STEP_X = FREEHAND_CARD_WIDTH + FREEHAND_GAP_X;
const OPENING_HAND_STEP_Y = FREEHAND_CARD_HEIGHT + FREEHAND_GAP_Y;
const OPENING_HAND_ZONE_GAP = 12;
const OPENING_HAND_INSET = 8;
const OPENING_HAND_RAIL_WIDTH = FREEHAND_CARD_WIDTH + FREEHAND_PADDING * 2;
const OPENING_HAND_ROW_PAD = 10;
const OPENING_HAND_ROW_HEIGHT =
  OPENING_HAND_ROW_PAD + FREEHAND_CARD_HEIGHT + OPENING_HAND_ROW_PAD;
const OPENING_HAND_BOARD_HEIGHT =
  OPENING_HAND_INSET * 2 + OPENING_HAND_ROW_HEIGHT * 3 + OPENING_HAND_ZONE_GAP * 2;

const DECK_SECTIONS = [
  { key: "material", title: "Material Deck", target: 12, mode: "max" },
  { key: "main", title: "Main Deck", target: 60, mode: "min" },
  { key: "sideboard", title: "Sideboard", target: 15, mode: "max" },
];

const SIDEBOARD_POINT_LIMIT = 15;

const KEYWORD_SEARCHES = [
  "foster",
  "floating memory",
  "stealth",
  "taunt",
  "on enter",
  "banish",
  "draw a card",
  "deal damage",
  "target unit",
];

const LIBRARY_SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "cost-asc", label: "Cost low → high" },
  { value: "cost-desc", label: "Cost high → low" },
  { value: "element-asc", label: "Element A → Z" },
  { value: "element-desc", label: "Element Z → A" },
  { value: "rarity-desc", label: "Rarity high → low" },
  { value: "rarity-asc", label: "Rarity low → high" },
  { value: "type-asc", label: "Type A → Z" },
  { value: "type-desc", label: "Type Z → A" },
];

/** Higher number = rarer. Codes and full names from Grand Archive printings. */
const RARITY_RANK = {
  c: 10,
  common: 10,
  u: 20,
  uncommon: 20,
  r: 30,
  rare: 30,
  pr: 40,
  promo: 40,
  "promo rare": 40,
  "promotional rare": 40,
  sr: 50,
  "super rare": 50,
  ur: 60,
  "ultra rare": 60,
  cpr: 70,
  "collector promo rare": 70,
  csr: 80,
  "collector super rare": 80,
  cur: 90,
  "collector ultra rare": 90,
};

const SORT_OPTIONS = [
  { label: "Name A-Z", sort: "name", order: "ASC" },
  { label: "Name Z-A", sort: "name", order: "DESC" },
  { label: "Cost low-high", sort: "cost_reserve", order: "ASC" },
  { label: "Cost high-low", sort: "cost_reserve", order: "DESC" },
  { label: "Power high-low", sort: "power", order: "DESC" },
  { label: "Level high-low", sort: "level", order: "DESC" },
  { label: "Rarity high-low", sort: "rarity", order: "DESC" },
  { label: "Collector number", sort: "collector_number", order: "ASC" },
];

const FALLBACK_OPTIONS = {
  class: [
    "ASSASSIN",
    "CLERIC",
    "GUARDIAN",
    "MAGE",
    "RANGER",
    "SPIRIT",
    "TAMER",
    "WARRIOR",
  ].map((value) => ({ text: titleCase(value), value })),
  element: [
    "ARCANE",
    "ASTRA",
    "CRUX",
    "EXALTED",
    "EXIA",
    "FIRE",
    "LUXEM",
    "NEOS",
    "NORM",
    "TERA",
    "UMBRA",
    "WATER",
    "WIND",
  ].map((value) => ({ text: titleCase(value), value })),
  set: [
    { text: ".asphodel/paradise", value: "PRD", display: ".asphodel/paradise" },
    { text: "Radiant Origins", value: "RDO", display: "Radiant Origins" },
  ],
  rarity: [],
  subtype: [{ text: "Spell", value: "SPELL" }],
  type: [
    "ACTION",
    "ALLY",
    "ATTACK",
    "CHAMPION",
    "DOMAIN",
    "ITEM",
    "REGALIA",
    "TOKEN",
    "UNIQUE",
    "WEAPON",
  ].map((value) => ({ text: titleCase(value), value })),
};

const OPTION_ALIASES = {
  element: {
    NORM: ["normal", "normal element"],
  },
  set: {
    PRD: ["asphodel paradise", "asphodel/paradise", ".asphodel/paradise", "asphodel"],
  },
  type: {
    ALLY: ["allies"],
  },
};

const OPTION_FIELDS = [
  { field: "element", optionKey: "element", label: "Element" },
  { field: "type", optionKey: "type", label: "Type" },
  { field: "subtype", optionKey: "subtype", label: "Subtype" },
  { field: "class", optionKey: "class", label: "Class" },
  { field: "prefix", optionKey: "set", label: "Set" },
  { field: "rarity", optionKey: "rarity", label: "Rarity" },
];

const SPEED_OPTIONS = [
  { text: "Fast", value: "fast" },
  { text: "Slow", value: "slow" },
  { text: "No Speed", value: "none" },
];

const STAT_DEFINITIONS = [
  { key: "cost_reserve", label: "Reserve Cost", aliases: ["reserve cost", "reserve"] },
  { key: "cost_memory", label: "Memory Cost", aliases: ["memory cost", "memory"] },
  { key: "durability", label: "Durability", aliases: ["durability"] },
  { key: "level", label: "Level", aliases: ["level"] },
  { key: "power", label: "Power", aliases: ["power"] },
  { key: "life", label: "Life", aliases: ["life"] },
  { key: "cost", label: "Cost", aliases: ["cost"] },
];

const OPERATOR_PATTERNS = [
  { operator: "<=", phrases: ["less than or equal to", "lower than or equal to", "at most", "no more than", "maximum", "max"] },
  { operator: ">=", phrases: ["greater than or equal to", "more than or equal to", "at least", "minimum", "min"] },
  { operator: "<", phrases: ["less than", "lower than", "under", "below"] },
  { operator: ">", phrases: ["greater than", "more than", "higher than", "over", "above"] },
  { operator: "=", phrases: ["equal to", "equals", "exactly", "is", "="] },
];

const savedMainDeckFreehand = loadMainDeckFreehandState();

const state = {
  cards: [],
  deck: normalizeStoredDeck(loadStoredJson(DECK_STORAGE_KEY, [])),
  deckName: loadStoredJson(DECK_NAME_STORAGE_KEY, "Untitled Deck") || "Untitled Deck",
  loading: false,
  options: FALLBACK_OPTIONS,
  page: 1,
  parsed: null,
  query: getInitialQuery(),
  reachedEnd: false,
  loadAllResults: Boolean(loadStoredJson(LOAD_ALL_RESULTS_KEY, false)),
  searchTotalCards: null,
  recentSearches: loadStoredJson(RECENT_SEARCHES_KEY, []),
  sort: SORT_OPTIONS[0],
  librarySort: "default",
  activeLightboxCard: null,
  lightboxCards: [],
  lightboxIndex: -1,
  lightboxSource: "search",
  resultAddedMessages: {},
  resultFeedbackTimers: {},
  resultSelectedQuantities: {},
  deckAutocomplete: {
    query: "",
    results: [],
    loading: false,
    activeIndex: -1,
    requestId: 0,
    timer: null,
    section: null,
  },
  deckToastTimer: null,
  deckShowIndividually: false,
  mainDeckFreehand: savedMainDeckFreehand.enabled,
  mainDeckFreehandPositions: savedMainDeckFreehand.positions,
  mainDeckFreehandZ: savedMainDeckFreehand.nextZ,
  mainDeckOpeningHand: false,
  openingHandLibrary: [],
  openingHandMaterial: [],
  openingHandExtras: {
    token: [],
    mastery: [],
    loaded: false,
    loading: false,
    error: "",
    filter: "all",
    query: "",
  },
  openingHandHand: [],
  openingHandDealToken: 0,
  openingHandDealComplete: true,
  openingHandAwaitingSpirit: false,
  openingHandPreviewEscBound: false,
  openingHandTurn: 1,
  openingHandDamage: 0,
  openingHandSelectedInstanceId: "",
  tryitInspectedCard: null,
  openingHandGlimpseIds: [],
  openingHandVoice: {
    supported: null,
    listening: false,
    recognition: null,
    lastTranscript: "",
    statusTimer: null,
  },
  tryitMenuOpen: false,
  tryitToastTimer: null,
  searchFiltersOpen: false,
  status: "Loading Grand Archive card terms...",
  mp: {
    mode: "lobby", // lobby | solo | multi
    role: null, // table | a | b
    roomCode: "",
    status: "",
    peerCount: 0,
    seats: { a: null, b: null },
    claims: { a: null, b: null },
    seatRevision: 0,
    applyingRemote: false,
    publishTimer: null,
    connection: null,
  },
};

const app = document.querySelector("#app");

function getBuilderShellHtml() {
  return `
  <p class="app-version" aria-label="App version">v${APP_VERSION}</p>
  <main class="page-shell">
    <details class="panel collapsible-section hero-section" id="card-search" open>
      <summary class="section-summary">
        <div>
          <p class="eyebrow">Grand Archive TCG Deck Builder</p>
          <h1 id="app-title">Card search</h1>
          <p class="hero-copy summary-copy">
            Browse .asphodel/paradise (PRD), search in plain English, then refine with filters.
          </p>
        </div>
      </summary>
      <div class="section-body hero-body">
        <div class="hero-brand">
          <p class="eyebrow">Grand Archive TCG Deck Builder</p>
          <h2 class="hero-product-title">Grand Archive Advanced Book by RPGgamerPH</h2>
          <nav class="page-switch" aria-label="App pages">
            <a class="ghost compact" href="${STUDIO_PAGE_URL}">Studio</a>
            <a class="ghost compact" href="${TRYIT_PAGE_URL}">Try it!</a>
          </nav>
          <p class="hero-copy">
            Jump into .asphodel/paradise (PRD), search by plain English, build Material and Main decks with live legality checks, then export a ready-to-paste list.
          </p>
        </div>
        <form class="search-card" id="search-form">
          <label for="search-input">Search cards</label>
          <div class="search-row">
            <div class="search-input-wrap">
              <input
                id="search-input"
                name="query"
                autocomplete="off"
                list="search-suggestions"
                spellcheck="true"
                value="${escapeHtml(state.query)}"
                placeholder="normal ally that cost 2 in PRD"
              />
              <button
                class="clear-search hidden"
                type="button"
                id="clear-search"
                aria-label="Clear search text"
              >×</button>
            </div>
            <button type="button" class="secondary" id="toggle-search-filters" aria-expanded="false" aria-controls="search-filters">
              Filters
            </button>
            <button type="submit">Search</button>
          </div>
          <div class="search-filters" id="search-filters" hidden>
            <div class="search-filters-grid">
              <label class="search-filter-effect">
                Effect
                <input
                  id="quick-filter-effect"
                  name="effect"
                  autocomplete="off"
                  spellcheck="true"
                  placeholder="hand AND memory"
                />
              </label>
              <div class="search-filter-field">
                Set
                <div class="multi-select" id="quick-filter-set" data-placeholder="Any">
                  <button type="button" class="multi-select-toggle" aria-haspopup="listbox" aria-expanded="false">Any</button>
                  <div class="multi-select-panel" hidden role="listbox" aria-multiselectable="true" aria-label="Sets"></div>
                </div>
              </div>
              <div class="search-filter-field">
                Element
                <div class="multi-select" id="quick-filter-element" data-placeholder="Any">
                  <button type="button" class="multi-select-toggle" aria-haspopup="listbox" aria-expanded="false">Any</button>
                  <div class="multi-select-panel" hidden role="listbox" aria-multiselectable="true" aria-label="Elements"></div>
                </div>
              </div>
              <div class="search-filter-field">
                Type
                <div class="multi-select" id="quick-filter-type" data-placeholder="Any">
                  <button type="button" class="multi-select-toggle" aria-haspopup="listbox" aria-expanded="false">Any</button>
                  <div class="multi-select-panel" hidden role="listbox" aria-multiselectable="true" aria-label="Types"></div>
                </div>
              </div>
              <div class="search-filter-field">
                Subtype
                <div class="multi-select" id="quick-filter-subtype" data-placeholder="Any">
                  <button type="button" class="multi-select-toggle" aria-haspopup="listbox" aria-expanded="false">Any</button>
                  <div class="multi-select-panel" hidden role="listbox" aria-multiselectable="true" aria-label="Subtypes"></div>
                </div>
              </div>
            </div>
            <p class="hint search-filter-hint">
              Use <strong>AND</strong> in Effect to require multiple words (example: <code>hand AND memory</code>). Check more than one Set, Element, Type, or Subtype to include any of them (Fire + Normal, or multiple Asphodel sets).
            </p>
            <div class="search-filter-actions">
              <button type="button" id="apply-search-filters">Apply filters</button>
              <button class="ghost" type="button" id="clear-search-filters">Clear filters</button>
            </div>
          </div>
          <datalist id="search-suggestions"></datalist>
          <div class="quick-searches" aria-label="Example searches">
            <button type="button" class="quick-search-featured" data-example="${PRD_QUICK_SEARCH}">
              Cards in PRD
            </button>
            <button type="button" data-example="normal ally that cost 2 in PRD">
              normal ally that cost 2 in PRD
            </button>
            <button type="button" data-example="normal spells that target units in RDO set">
              normal spells that target units in RDO set
            </button>
            <button type="button" data-example="standard legal fire or water attacks cost 2 or less">
              standard legal fire or water attacks cost 2 or less
            </button>
          </div>
          <div class="keyword-row" id="keyword-row" aria-label="Keyword helpers"></div>
        </form>
      </div>
    </details>

    <details class="panel collapsible-section explanation-panel">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">Parsed search</p>
          <h2>What the app searched</h2>
        </div>
        <button class="secondary compact summary-action" type="button" id="copy-share">Copy link</button>
      </summary>
      <div class="section-body">
        <p class="status" id="status"></p>
        <div class="chips" id="chips"></div>
        <p class="hint" id="search-explanation"></p>
      </div>
    </details>

    <details class="panel collapsible-section deck-panel deck-panel-home" id="deck-builder">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">Deck Builder</p>
          <h2 id="deck-builder-title">Deck Builder <span id="deck-count">0</span></h2>
        </div>
        <div class="button-pair summary-actions">
          <button class="secondary compact summary-action" type="button" id="export-deck">Copy export</button>
          <button class="secondary compact summary-action" type="button" id="import-deck">Import list</button>
          <button class="secondary compact summary-action" type="button" id="download-deck">Download .txt</button>
          <button class="ghost compact summary-action" type="button" id="clear-deck">Clear</button>
        </div>
      </summary>
      <div class="section-body">
        <label class="deck-name-field" for="deck-name">
          Deck name
          <input id="deck-name" name="deckName" maxlength="80" autocomplete="off" value="${escapeHtml(state.deckName)}" />
        </label>
        <div class="deck-suggestions" aria-label="Deck suggestions">
          <p class="deck-suggestions-label">Deck suggestions</p>
          <div class="deck-suggestions-actions">
            ${DECK_SUGGESTIONS.map(
              (suggestion) => `
              <button
                class="secondary compact"
                type="button"
                data-deck-suggestion="${escapeHtml(suggestion.id)}"
                title="${escapeHtml(suggestion.description)}"
              >${escapeHtml(suggestion.label)}</button>
            `,
            ).join("")}
          </div>
          <p class="hint deck-suggestions-hint">
            One-click shells: Fire / Water / Wind aggro (all sets) plus PRD Dante &amp; Lorraine. Replaces your current list. Play guides live in the Guides section below.
          </p>
        </div>
        <div class="deck-stats" id="deck-stats" aria-live="polite"></div>
        <details class="deck-validation-details deck-validation-home">
          <summary id="deck-validation-summary-home">Deck legality</summary>
          <div class="deck-validation" id="deck-validation" aria-live="polite"></div>
        </details>
        <div class="deck-view-toolbar">
          <button class="secondary compact" type="button" id="toggle-deck-individual">Show individually</button>
        </div>
        <div class="deck-list deck-list-home" id="deck-list"></div>
        <div class="deck-toast deck-toast-home" id="deck-toast-home" role="status" aria-live="polite" hidden>Added</div>
      </div>
    </details>

    <details class="panel collapsible-section guides-panel" id="play-guides">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">How to play</p>
          <h2>Guides</h2>
        </div>
      </summary>
      <div class="section-body">
        <p class="hint guides-intro">
          Illustrated play guides with card art. Open any guide in a new tab; load the matching list from Deck suggestions above.
        </p>
        <div class="guides-groups">
          ${["Aggro", "PRD"]
            .map((group) => {
              const guides = PLAY_GUIDES.filter((guide) => guide.group === group);
              if (!guides.length) {
                return "";
              }
              return `
            <section class="guides-group" aria-label="${escapeHtml(group)} guides">
              <p class="guides-group-label">${escapeHtml(group)}</p>
              <ul class="guides-list">
                ${guides
                  .map(
                    (guide) => `
                  <li class="guides-item">
                    <a class="guides-link" href="${escapeHtml(resolvePublicAssetUrl(guide.href))}" target="_blank" rel="noopener noreferrer">
                      <span class="guides-title">${escapeHtml(guide.title)}</span>
                      <span class="guides-blurb">${escapeHtml(guide.blurb)}</span>
                    </a>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            </section>
          `;
            })
            .join("")}
        </div>
      </div>
    </details>

    <details class="panel collapsible-section advanced-panel" id="advanced-panel">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">Filters</p>
          <h2>Advanced filters and sorting</h2>
        </div>
      </summary>
      <div class="section-body">
        <form class="advanced-grid" id="advanced-form">
          <label>Element<select name="element" id="filter-element"><option value="">Any</option></select></label>
          <label>Type<select name="type" id="filter-type"><option value="">Any</option></select></label>
          <label>Subtype<select name="subtype" id="filter-subtype"><option value="">Any</option></select></label>
          <label>Class<select name="class" id="filter-class"><option value="">Any</option></select></label>
          <label>Set<select name="set" id="filter-set"><option value="">Any</option></select></label>
          <label>Speed<select name="speed" id="filter-speed"><option value="">Any</option></select></label>
          <label>Stat<select name="stat" id="filter-stat"><option value="">None</option></select></label>
          <label>Compare<select name="operator" id="filter-operator"><option value="=">=</option><option value="<">&lt;</option><option value="<=">&lt;=</option><option value=">">&gt;</option><option value=">=">&gt;=</option></select></label>
          <label>Value<input name="statValue" id="filter-stat-value" inputmode="numeric" placeholder="2" /></label>
          <label>Format<select name="format" id="filter-format"><option value="">Any</option><option value="standard legal">Standard legal</option><option value="standard restricted">Standard restricted</option><option value="material legal">Material legal</option></select></label>
          <label>Sort<select name="sort" id="sort-select"></select></label>
          <div class="advanced-actions">
            <button type="submit">Apply filters</button>
            <button class="ghost" type="button" id="clear-filters">Clear</button>
          </div>
        </form>
      </div>
    </details>

    <details class="panel collapsible-section recent-panel">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">History</p>
          <h2>Recent searches</h2>
        </div>
        <button class="ghost compact summary-action" type="button" id="clear-recents">Clear recents</button>
      </summary>
      <div class="section-body">
        <div class="quick-searches" id="recent-searches"></div>
      </div>
    </details>

    <details class="panel collapsible-section results-panel" id="library">
      <summary class="section-summary">
        <div>
          <p class="eyebrow">Library</p>
          <h2>Search results</h2>
        </div>
        <div class="library-toolbar summary-action">
          <label class="library-load-all" for="library-load-all">
            <input type="checkbox" id="library-load-all" ${state.loadAllResults ? "checked" : ""} />
            Show all
          </label>
          <label class="library-sort" for="library-sort">
            Sort
            <select id="library-sort" class="summary-action" aria-label="Sort library results"></select>
          </label>
        </div>
      </summary>
      <div class="section-body">
        <section class="results-grid" id="results" aria-label="Search results"></section>
        <div class="actions">
          <button class="secondary hidden" type="button" id="load-more">Load more</button>
          <button class="ghost hidden" type="button" id="show-all-results">Show all</button>
        </div>
      </div>
    </details>
  </main>

  <dialog class="lightbox" id="lightbox" aria-label="Card image">
    <button class="icon-button lightbox-close" type="button" id="close-lightbox" aria-label="Close">×</button>
    <button class="lightbox-nav lightbox-nav-prev" type="button" id="lightbox-prev" aria-label="Previous card">‹</button>
    <button class="lightbox-nav lightbox-nav-next" type="button" id="lightbox-next" aria-label="Next card">›</button>
    <figure class="lightbox-card">
      <img id="lightbox-image" alt="" />
    </figure>
  </dialog>

  <dialog class="deck-fullscreen" id="deck-fullscreen" aria-labelledby="deck-fullscreen-title">
    <div class="deck-fullscreen-shell">
      <header class="deck-fullscreen-header">
        <div>
          <p class="eyebrow">Deck Builder</p>
          <h2 id="deck-fullscreen-title">Fullscreen Deck List</h2>
          <p class="hint">Use Add card in Material, Main Deck, or Sideboard, then browse the image grid.</p>
        </div>
        <div class="deck-fullscreen-header-actions">
          <button class="secondary compact" type="button" id="go-card-search">Card search</button>
          <button class="icon-button deck-close" id="close-deck-fullscreen" aria-label="Close fullscreen deck builder">×</button>
        </div>
      </header>
      <div class="deck-stats deck-stats-fullscreen" id="deck-stats-fullscreen" aria-live="polite"></div>
      <details class="deck-validation-details">
        <summary id="deck-validation-summary">Deck legality</summary>
        <div class="deck-validation" id="deck-validation-fullscreen" aria-live="polite"></div>
      </details>
      <div class="deck-fullscreen-actions">
        <button class="secondary compact" type="button" id="toggle-deck-individual-fullscreen">Show individually</button>
        <button class="secondary compact" type="button" id="export-deck-fullscreen">Copy export</button>
        <button class="secondary compact" type="button" id="import-deck-fullscreen">Import list</button>
        <button class="secondary compact" type="button" id="download-deck-fullscreen">Download .txt</button>
        <button class="ghost compact" type="button" id="clear-deck-fullscreen">Clear</button>
      </div>
      <div class="deck-list deck-list-fullscreen" id="deck-list-fullscreen"></div>
      <div class="deck-toast" id="deck-toast" role="status" aria-live="polite" hidden>Added</div>
    </div>
  </dialog>

  <dialog class="import-dialog" id="import-dialog" aria-labelledby="import-dialog-title">
    <form class="import-dialog-shell" id="import-form" method="dialog">
      <header class="import-dialog-header">
        <div>
          <p class="eyebrow">Import</p>
          <h2 id="import-dialog-title">Paste a deck list</h2>
          <p class="hint">Use lines like <code>4 Backstep</code> under <code># Material Deck</code>, <code># Main Deck</code>, or <code># Sideboard</code>.</p>
        </div>
        <button class="icon-button" type="button" id="close-import-dialog" aria-label="Close import dialog">×</button>
      </header>
      <label class="import-label" for="import-text">
        Deck list
        <textarea id="import-text" name="importText" rows="14" spellcheck="false" placeholder="# Material Deck&#10;1 Spirit of Fire&#10;&#10;# Main Deck&#10;4 Backstep"></textarea>
      </label>
      <p class="hint" id="import-status"></p>
      <div class="import-actions">
        <button class="ghost compact" type="button" id="cancel-import">Cancel</button>
        <button type="submit" id="confirm-import">Import into deck</button>
      </div>
    </form>
  </dialog>

  <div class="deck-load-overlay" id="deck-load-overlay" hidden aria-hidden="true">
    <div class="deck-load-card" role="status" aria-live="polite" aria-busy="true">
      <div class="deck-load-spinner" aria-hidden="true"></div>
      <p class="deck-load-title" id="deck-load-title">Loading deck</p>
      <p class="deck-load-detail" id="deck-load-detail">Looking up cards…</p>
      <div class="deck-load-progress" aria-hidden="true">
        <div class="deck-load-progress-bar" id="deck-load-progress-bar"></div>
      </div>
      <p class="deck-load-count" id="deck-load-count"></p>
    </div>
  </div>

  <button class="scroll-top-button" type="button" id="scroll-top" aria-label="Move to top">↑</button>
`;
}

function getTryItShellHtml() {
  const deckLabel = escapeHtml(state.deckName || "Untitled Deck");
  return `
  <p class="app-version" aria-label="App version">v${APP_VERSION}</p>
  <main class="page-shell tryit-page">
    <header class="panel tryit-page-header">
      <div class="tryit-page-heading">
        <div class="tryit-chrome-slim">
          <p class="hint mp-room-status" id="mp-room-status" hidden></p>
          <div class="tryit-menu" id="tryit-menu">
            <button
              class="ghost compact tryit-menu-toggle"
              type="button"
              data-tryit-menu-toggle="true"
              aria-expanded="false"
              aria-haspopup="true"
              aria-controls="tryit-menu-panel"
              aria-label="Open menu"
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div class="tryit-menu-panel" id="tryit-menu-panel" role="menu" hidden>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-share="true">Share playtest link</button>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-lobby="true">Multiplayer lobby</button>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-leave-room="true">Leave room</button>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-settings="true">Settings</button>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-close="true">Close</button>
            </div>
          </div>
        </div>
        <div class="tryit-chrome-full">
          <div class="tryit-page-title-row">
            <div class="tryit-page-title-group">
              <h1>Playtest</h1>
              <p class="hint tryit-deck-name">Deck: <strong>${deckLabel}</strong></p>
            </div>
            <div class="tryit-page-title-actions">
              <span class="tryit-inline-version" aria-label="App version">v${APP_VERSION}</span>
              <button class="ghost compact tryit-share-button" type="button" data-tryit-share="true">Share</button>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="tryit-workspace">
      <aside class="panel studio-inspector tryit-inspector" id="tryit-inspector" aria-label="Card info"></aside>
      <section class="panel tryit-playmat-panel" aria-label="Try it playmat">
        <div id="tryit-root"></div>
      </section>
    </div>
  </main>

  <dialog class="material-dialog" id="material-dialog" aria-labelledby="material-dialog-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="material-dialog-title">Material Deck</h2>
          <p class="hint" id="material-dialog-hint">Choose a card from Material. Champions and Spirits go to the Champion area; other material goes to Field.</p>
        </div>
        <button class="icon-button" type="button" id="close-material-dialog" aria-label="Close material deck">×</button>
      </header>
      <div class="material-dialog-grid" id="material-dialog-grid"></div>
      <p class="hint material-dialog-empty" id="material-dialog-empty" hidden>No material cards left.</p>
    </div>
  </dialog>

  <dialog class="material-dialog tryit-help-dialog" id="tryit-help-dialog" aria-labelledby="tryit-help-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="tryit-help-title">Controls &amp; shortcuts</h2>
          <p class="hint">Gestures and board actions for Playtest.</p>
        </div>
        <button class="icon-button" type="button" id="close-tryit-help-dialog" aria-label="Close help">×</button>
      </header>
      <ul class="tryit-help-list">
        <li><strong>Graveyard</strong> — Hold ~1s on the Graveyard (or a GY card) to browse all cards and banish</li>
        <li><strong>Deck glimpse</strong> — Double-tap the deck → Glimpse; enter how many cards to reveal privately, then Top/Bottom each</li>
        <li><strong>Opponent cards</strong> — Double-tap (or hold 1s) to open lightbox and read the card</li>
        <li><strong>End phase</strong> (below Damage) — Wake rested cards and organize Field cards</li>
        <li><strong>Banish</strong> — Banish 1 random card from Memory</li>
        <li><strong>Reco</strong> — Move all Memory cards back to Hand</li>
        <li><strong>Draw</strong> — Draw the top card of your deck to Hand</li>
        <li><strong>Menu</strong> — Organize hand, Tokens/Mastery, Redeal, Help, and more</li>
        <li><strong>Double-tap a card</strong> — Open actions: Info, Rest, Flip, Buff +1, Deck, Banish, Graveyard, and more</li>
        <li><strong>Triple-tap a card</strong> — Open lightbox to zoom in and read the card</li>
        <li><strong>Drag cards</strong> — Move between Hand, Field, Memory, Graveyard, Banishment, Champion</li>
        <li><strong>Deck pile</strong> — Tap to draw to Hand; double-tap for Glimpse; drag to Field, Memory, Graveyard, or Hand</li>
        <li><strong>Material pile</strong> — Open Material Deck; start by choosing your Spirit (Level 0 champion)</li>
        <li><strong>Tokens / Mastery</strong> — Spawn ephemeral extras onto the Field</li>
        <li><strong>Organize hand</strong> — Snap Hand cards into an even row</li>
        <li><strong>Redeal</strong> — Shuffle and deal a new opening hand, then pick Spirit again</li>
      </ul>
    </div>
  </dialog>

  <dialog class="material-dialog extras-dialog" id="extras-dialog" aria-labelledby="extras-dialog-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="extras-dialog-title">Tokens / Mastery</h2>
          <p class="hint">Spawn ephemeral Token or Mastery cards onto the Field. They are not taken from your deck.</p>
        </div>
        <button class="icon-button" type="button" id="close-extras-dialog" aria-label="Close tokens and mastery">×</button>
      </header>
      <div class="extras-dialog-toolbar">
        <div class="extras-filter-row" role="tablist" aria-label="Card type">
          <button class="ghost compact extras-filter is-active" type="button" data-extras-filter="all" role="tab" aria-selected="true">All</button>
          <button class="ghost compact extras-filter" type="button" data-extras-filter="token" role="tab" aria-selected="false">Tokens</button>
          <button class="ghost compact extras-filter" type="button" data-extras-filter="mastery" role="tab" aria-selected="false">Mastery</button>
        </div>
        <label class="extras-search-label" for="extras-search">
          Search
          <input id="extras-search" name="extrasSearch" type="search" autocomplete="off" placeholder="Filter by name…" />
        </label>
      </div>
      <p class="hint" id="extras-dialog-status" aria-live="polite"></p>
      <div class="material-dialog-grid" id="extras-dialog-grid"></div>
      <p class="hint material-dialog-empty" id="extras-dialog-empty" hidden>No matching cards.</p>
    </div>
  </dialog>

  <dialog class="material-dialog gy-dialog" id="graveyard-dialog" aria-labelledby="graveyard-dialog-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="graveyard-dialog-title">Graveyard</h2>
          <p class="hint">Browse cards in your Graveyard. Banish moves a card to Banishment.</p>
        </div>
        <button class="icon-button" type="button" id="close-graveyard-dialog" aria-label="Close graveyard">×</button>
      </header>
      <div class="material-dialog-grid" id="graveyard-dialog-grid"></div>
      <p class="hint material-dialog-empty" id="graveyard-dialog-empty" hidden>Graveyard is empty.</p>
    </div>
  </dialog>

  <dialog class="material-dialog glimpse-dialog" id="glimpse-dialog" aria-labelledby="glimpse-dialog-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="glimpse-dialog-title">Deck glimpse</h2>
          <p class="hint">Enter how many cards to look at privately. Use Top / Bottom on each card to put it back on the deck.</p>
        </div>
        <button class="icon-button" type="button" id="close-glimpse-dialog" aria-label="Close deck glimpse">×</button>
      </header>
      <form class="glimpse-count-row" id="glimpse-count-form">
        <label class="glimpse-count-label" for="glimpse-count-input">Glimpse</label>
        <input
          id="glimpse-count-input"
          class="glimpse-count-input"
          type="number"
          inputmode="numeric"
          min="1"
          step="1"
          placeholder="0"
          aria-label="Number of cards to glimpse"
        />
        <button class="secondary compact" type="submit" id="glimpse-reveal-button">Reveal</button>
      </form>
      <div class="glimpse-layout">
        <section class="glimpse-cards-panel" aria-label="Glimpsed cards">
          <h3 class="glimpse-section-title">Glimpsed cards</h3>
          <div class="glimpse-cards-grid" id="glimpse-cards-grid"></div>
          <p class="hint material-dialog-empty" id="glimpse-cards-empty">
            Type a number above and press Reveal to look at that many cards from the top of your deck.
          </p>
        </section>
        <section class="glimpse-deck-panel" aria-label="Deck">
          <h3 class="glimpse-section-title">Deck</h3>
          <div class="glimpse-deck-pile" id="glimpse-deck-pile" aria-live="polite">
            <div class="glimpse-deck-stack" id="glimpse-deck-stack"></div>
            <span class="glimpse-deck-count" id="glimpse-deck-count">0</span>
          </div>
          <p class="hint glimpse-deck-hint" id="glimpse-deck-hint">Same deck as the board</p>
        </section>
      </div>
    </div>
  </dialog>

  <div class="tryit-toast" id="tryit-toast" role="status" aria-live="polite" hidden>Added</div>

  <div class="deck-load-overlay" id="deck-load-overlay" hidden aria-hidden="true">
    <div class="deck-load-card" role="status" aria-live="polite" aria-busy="true">
      <div class="deck-load-spinner" aria-hidden="true"></div>
      <p class="deck-load-title" id="deck-load-title">Loading deck</p>
      <p class="deck-load-detail" id="deck-load-detail">Looking up cards…</p>
      <div class="deck-load-progress" aria-hidden="true">
        <div class="deck-load-progress-bar" id="deck-load-progress-bar"></div>
      </div>
      <p class="deck-load-count" id="deck-load-count"></p>
    </div>
  </div>
`;
}

if (IS_TRYIT_PAGE) {
  app.innerHTML = getTryItShellHtml();
} else if (IS_STUDIO_PAGE) {
  app.innerHTML = getStudioShellHtml({
    appVersion: APP_VERSION,
    builderUrl: BUILDER_PAGE_URL,
  });
} else {
  app.innerHTML = getBuilderShellHtml();
}

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const clearSearchButton = document.querySelector("#clear-search");
const toggleSearchFiltersButton = document.querySelector("#toggle-search-filters");
const searchFiltersEl = document.querySelector("#search-filters");
const quickFilterEffect = document.querySelector("#quick-filter-effect");
const quickFilterSet = document.querySelector("#quick-filter-set");
const quickFilterElement = document.querySelector("#quick-filter-element");
const quickFilterType = document.querySelector("#quick-filter-type");
const quickFilterSubtype = document.querySelector("#quick-filter-subtype");
const applySearchFiltersButton = document.querySelector("#apply-search-filters");
const clearSearchFiltersButton = document.querySelector("#clear-search-filters");
const statusEl = document.querySelector("#status");
const chipsEl = document.querySelector("#chips");
const explanationEl = document.querySelector("#search-explanation");
const resultsEl = document.querySelector("#results");
const librarySortSelect = document.querySelector("#library-sort");
const loadMoreButton = document.querySelector("#load-more");
const showAllResultsButton = document.querySelector("#show-all-results");
const libraryLoadAllCheckbox = document.querySelector("#library-load-all");
const lightbox = document.querySelector("#lightbox");
const closeLightboxButton = document.querySelector("#close-lightbox");
const lightboxPrevButton = document.querySelector("#lightbox-prev");
const lightboxNextButton = document.querySelector("#lightbox-next");
const lightboxImage = document.querySelector("#lightbox-image");
const keywordRow = document.querySelector("#keyword-row");
const suggestionsEl = document.querySelector("#search-suggestions");
const advancedForm = document.querySelector("#advanced-form");
const sortSelect = document.querySelector("#sort-select");
const recentSearchesEl = document.querySelector("#recent-searches");
const clearRecentsButton = document.querySelector("#clear-recents");
const copyShareButton = document.querySelector("#copy-share");
const deckListEl = document.querySelector("#deck-list");
const deckListFullscreenEl = document.querySelector("#deck-list-fullscreen");
const deckCountEl = document.querySelector("#deck-count");
const deckNameInput = document.querySelector("#deck-name");
const deckStatsEl = document.querySelector("#deck-stats");
const deckStatsFullscreenEl = document.querySelector("#deck-stats-fullscreen");
const deckValidationEl = document.querySelector("#deck-validation");
const deckValidationFullscreenEl = document.querySelector("#deck-validation-fullscreen");
const exportDeckButton = document.querySelector("#export-deck");
const exportDeckFullscreenButton = document.querySelector("#export-deck-fullscreen");
const downloadDeckButton = document.querySelector("#download-deck");
const downloadDeckFullscreenButton = document.querySelector("#download-deck-fullscreen");
const importDeckButton = document.querySelector("#import-deck");
const importDeckFullscreenButton = document.querySelector("#import-deck-fullscreen");
const clearDeckButton = document.querySelector("#clear-deck");
const clearDeckFullscreenButton = document.querySelector("#clear-deck-fullscreen");
const toggleDeckIndividualButton = document.querySelector("#toggle-deck-individual");
const toggleDeckIndividualFullscreenButton = document.querySelector("#toggle-deck-individual-fullscreen");
const closeDeckFullscreenButton = document.querySelector("#close-deck-fullscreen");
const goCardSearchButton = document.querySelector("#go-card-search");
const deckFullscreen = document.querySelector("#deck-fullscreen");
const deckToastEl = document.querySelector("#deck-toast");
const deckToastHomeEl = document.querySelector("#deck-toast-home");
const cardSearchSection = document.querySelector("#card-search");
const deckBuilderSection = document.querySelector("#deck-builder");
const importDialog = document.querySelector("#import-dialog");
const importForm = document.querySelector("#import-form");
const importText = document.querySelector("#import-text");
const importStatusEl = document.querySelector("#import-status");
const closeImportDialogButton = document.querySelector("#close-import-dialog");
const cancelImportButton = document.querySelector("#cancel-import");
const confirmImportButton = document.querySelector("#confirm-import");
const deckLoadOverlay = document.querySelector("#deck-load-overlay");
const deckLoadTitle = document.querySelector("#deck-load-title");
const deckLoadDetail = document.querySelector("#deck-load-detail");
const deckLoadProgressBar = document.querySelector("#deck-load-progress-bar");
const deckLoadCount = document.querySelector("#deck-load-count");
const materialDialog = document.querySelector("#material-dialog");
const materialDialogGrid = document.querySelector("#material-dialog-grid");
const materialDialogEmpty = document.querySelector("#material-dialog-empty");
const closeMaterialDialogButton = document.querySelector("#close-material-dialog");
const extrasDialog = document.querySelector("#extras-dialog");
const extrasDialogGrid = document.querySelector("#extras-dialog-grid");
const extrasDialogEmpty = document.querySelector("#extras-dialog-empty");
const extrasDialogStatus = document.querySelector("#extras-dialog-status");
const extrasSearchInput = document.querySelector("#extras-search");
const closeExtrasDialogButton = document.querySelector("#close-extras-dialog");
const graveyardDialog = document.querySelector("#graveyard-dialog");
const graveyardDialogGrid = document.querySelector("#graveyard-dialog-grid");
const graveyardDialogEmpty = document.querySelector("#graveyard-dialog-empty");
const closeGraveyardDialogButton = document.querySelector("#close-graveyard-dialog");
const glimpseDialog = document.querySelector("#glimpse-dialog");
const glimpseCountForm = document.querySelector("#glimpse-count-form");
const glimpseCountInput = document.querySelector("#glimpse-count-input");
const glimpseRevealButton = document.querySelector("#glimpse-reveal-button");
const glimpseCardsGrid = document.querySelector("#glimpse-cards-grid");
const glimpseCardsEmpty = document.querySelector("#glimpse-cards-empty");
const glimpseDeckStack = document.querySelector("#glimpse-deck-stack");
const glimpseDeckCount = document.querySelector("#glimpse-deck-count");
const closeGlimpseDialogButton = document.querySelector("#close-glimpse-dialog");
const tryitHelpDialog = document.querySelector("#tryit-help-dialog");
const closeTryitHelpDialogButton = document.querySelector("#close-tryit-help-dialog");
const materialDialogTitle = document.querySelector("#material-dialog-title");
const materialDialogHint = document.querySelector("#material-dialog-hint");
const tryitToastEl = document.querySelector("#tryit-toast");
const clearFiltersButton = document.querySelector("#clear-filters");
const scrollTopButton = document.querySelector("#scroll-top");

closeMaterialDialogButton?.addEventListener("click", () => closeMaterialDialog());
materialDialog?.addEventListener("click", (event) => {
  if (event.target === materialDialog) {
    closeMaterialDialog();
  }
});
materialDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMaterialDialog();
});

closeExtrasDialogButton?.addEventListener("click", () => closeExtrasDialog());
extrasDialog?.addEventListener("click", (event) => {
  if (event.target === extrasDialog) {
    closeExtrasDialog();
  }
});
extrasDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeExtrasDialog();
});
extrasDialog?.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-extras-filter]");
  if (!filterButton || !extrasDialog.contains(filterButton)) {
    return;
  }
  event.preventDefault();
  setExtrasDialogFilter(filterButton.dataset.extrasFilter || "all");
});
extrasSearchInput?.addEventListener("input", () => {
  state.openingHandExtras.query = extrasSearchInput.value || "";
  renderExtrasDialogGrid(getActiveOpeningHandBoard());
});

closeGraveyardDialogButton?.addEventListener("click", () => closeGraveyardDialog());
graveyardDialog?.addEventListener("click", (event) => {
  if (event.target === graveyardDialog) {
    closeGraveyardDialog();
  }
  const banishButton = event.target.closest("[data-gy-banish]");
  if (banishButton && graveyardDialog.contains(banishButton)) {
    event.preventDefault();
    void banishOpeningHandGraveyardCard(banishButton.dataset.gyBanish);
  }
});
graveyardDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeGraveyardDialog();
});

closeGlimpseDialogButton?.addEventListener("click", () => closeGlimpseDialog());
glimpseDialog?.addEventListener("click", (event) => {
  if (event.target === glimpseDialog) {
    closeGlimpseDialog();
  }
  const topButton = event.target.closest("[data-glimpse-top]");
  if (topButton && glimpseDialog.contains(topButton)) {
    event.preventDefault();
    finishGlimpseCard(topButton.dataset.glimpseTop, "top");
    return;
  }
  const bottomButton = event.target.closest("[data-glimpse-bottom]");
  if (bottomButton && glimpseDialog.contains(bottomButton)) {
    event.preventDefault();
    finishGlimpseCard(bottomButton.dataset.glimpseBottom, "bottom");
  }
});
glimpseDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeGlimpseDialog();
});
glimpseCountForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  applyGlimpseCountFromInput();
});
glimpseRevealButton?.addEventListener("click", (event) => {
  event.preventDefault();
  applyGlimpseCountFromInput();
});

closeTryitHelpDialogButton?.addEventListener("click", () => closeTryItHelpDialog());
tryitHelpDialog?.addEventListener("click", (event) => {
  if (event.target === tryitHelpDialog) {
    closeTryItHelpDialog();
  }
});
tryitHelpDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeTryItHelpDialog();
});
document.addEventListener("pointerdown", (event) => {
  const menu = document.querySelector("[data-oh-card-menu], [data-oh-deck-menu]");
  if (!menu) {
    return;
  }
  if (
    event.target.closest("[data-oh-card-menu]") ||
    event.target.closest("[data-oh-deck-menu]") ||
    event.target.closest(".opening-hand-card.is-menu-open") ||
    event.target.closest("[data-oh-deck-pile].is-menu-open")
  ) {
    return;
  }
  closeOpeningHandCardMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOpeningHandCardMenu();
  }
});

if (IS_TRYIT_PAGE) {
  bootTryItPage();
} else if (IS_STUDIO_PAGE) {
  bootStudioPage({
    state,
    parseNaturalQuery,
    applyQuickFilters,
    fetchCards,
    cardMatchesParsedQuery,
    getImageUrl,
    resolveCardImage,
    getPrimaryEdition,
    getCardKey,
    formatCardLine,
    formatCost,
    titleCase,
    createPlaceholder,
    uniqueBy,
    loadOptions,
    renderAdvancedOptions,
    bindQuickFilterMultiSelects,
    closeAllMultiSelects,
    clearMultiSelect,
    getMultiSelectValues,
    saveStoredJson,
    updateSearchFiltersVisibility,
    defaultDeckSection,
    writeDeckForTryIt,
    tryItUrl: TRYIT_PAGE_URL,
    appVersion: APP_VERSION,
  });
} else {
  bootBuilderPage();
}

function bootTryItPage() {
  const page = document.querySelector(".tryit-page");
  page?.addEventListener("click", (event) => {
    handleTryItActionClick(event);
  });
  document.addEventListener("click", (event) => {
    if (state.tryitMenuOpen && !event.target.closest("#tryit-menu")) {
      setTryItMenuOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    if (state.tryitMenuOpen) {
      setTryItMenuOpen(false);
    }
    closeOpeningHandBoardMenu();
  });
  window.addEventListener("resize", () => {
    document.querySelectorAll("[data-opening-hand-board]").forEach((board) => {
      if (board.getClientRects().length === 0) {
        return;
      }
      if (board.dataset.mpReadonly === "true" && board.dataset.mpSeat) {
        const seatData = state.mp.seats[board.dataset.mpSeat];
        if (seatData) {
          withSeatBoardState(seatData, () => layoutMultiplayerTableSeat(board));
          return;
        }
      }
      resizeOpeningHandField(board);
    });
  });
  window.addEventListener("beforeunload", () => {
    void leaveMultiplayerRoom({ silent: true });
  });

  void bootTryItPageContents();
}

async function bootTryItPageContents() {
  const { room, role } = readRoomParams();
  const params = new URLSearchParams(window.location.search);
  if (params.get("mpLayoutTest") === "1") {
    bootMultiplayerLayoutTest();
    return;
  }

  const sharePayload = readDeckSharePayload();
  let loadedShare = false;
  if (sharePayload) {
    loadedShare = await loadTryItDeckFromSharePayload(sharePayload);
    if (!loadedShare) {
      window.alert("Could not load the shared deck from this link.");
    }
  }

  if (room && role) {
    void joinMultiplayerRoom({ roomCode: room, role });
    return;
  }

  state.mp.mode = "lobby";
  renderTryItPage();
  renderTryItInspector();
  if (loadedShare) {
    showTryItToast("Shared deck loaded");
  }
}

async function loadTryItDeckFromSharePayload(raw) {
  try {
    const text = await decodeDeckSharePayload(raw);
    if (!String(text || "").trim()) {
      return false;
    }
    return await importDeckFromText(text, {
      label: "shared deck",
      showOverlay: true,
      closeImportDialog: false,
    });
  } catch (error) {
    console.error("Failed to load shared playtest deck", error);
    return false;
  }
}

async function shareTryItDeck() {
  setTryItMenuOpen(false);
  closeOpeningHandBoardMenu();
  if (!state.deck.length) {
    window.alert("Add cards to your deck before sharing a playtest link.");
    return;
  }

  const text = formatDeckExport();
  if (!text.trim()) {
    window.alert("Add cards to your deck before sharing a playtest link.");
    return;
  }

  let url = "";
  try {
    const payload = await encodeDeckSharePayload(text);
    url = buildDeckShareUrl(getTryItPageAbsoluteUrl(), payload);
  } catch (error) {
    console.error("Failed to build playtest share link", error);
    window.alert("Could not build a share link.");
    return;
  }

  const headerShare = document.querySelector(".tryit-share-button");
  const headerShareLabel = headerShare?.textContent;
  try {
    await navigator.clipboard.writeText(url);
    if (headerShare) {
      headerShare.textContent = "Copied";
    }
    showTryItToast("Link copied", 3200);
  } catch {
    window.prompt("Copy this playtest link", url);
    showTryItToast("Link ready to copy", 3200);
  } finally {
    if (headerShare && headerShareLabel) {
      window.setTimeout(() => {
        headerShare.textContent = headerShareLabel;
      }, 1800);
    }
  }
}

function bootMultiplayerLayoutTest() {
  const sampleImage = "https://api.gatcg.com/cards/images/card.png";
  const mkCard = (key, name) => ({ key, name, image: sampleImage });
  const mkEntry = (key, name, zone, x, y, facedown = zone === "memory") => ({
    instanceId: `${key}::oh::0`,
    zone,
    facedown,
    rotated: false,
    position: { x, y, z: 1 },
    card: mkCard(key, name),
  });
  const mkSeat = (seat, deckName, damage, cards, libraryCount, materialCount) => ({
    seat,
    revision: 1,
    deckName,
    boardWidth: 390,
    library: Array.from({ length: libraryCount }, (_, index) => ({
      instanceId: `${seat}-lib-${index}`,
      card: mkCard(`${seat}-lib-${index}`, `Lib ${index}`),
    })),
    material: Array.from({ length: materialCount }, (_, index) => ({
      instanceId: `${seat}-mat-${index}`,
      card: mkCard(`${seat}-mat-${index}`, `Mat ${index}`),
    })),
    cards,
    turn: 1,
    damage,
    dealComplete: true,
  });

  // Dual-phone layout test: local Player A + remote Player B opposite.
  state.mp.mode = "multi";
  state.mp.role = "a";
  state.mp.roomCode = "TEST";
  state.mp.status = "Layout test";
  state.mp.peerCount = 1;
  state.mp.seats = {
    a: null,
    b: mkSeat(
      "b",
      "Layout Test B",
      4,
      [
        mkEntry("bf1", "B Field", "field", 200, 20),
        mkEntry("bch1", "B Champ", "champion", 20, 20),
        mkEntry("bm1", "B Mem", "memory", 180, 180),
        mkEntry("bm2", "B Mem 2", "memory", 240, 190),
        mkEntry("bg1", "B Grave", "graveyard", 320, 340),
        mkEntry("bb1", "B Ban", "banishment", 320, 10),
        mkEntry("bh1", "B Hand", "hand", 80, 340, true),
        mkEntry("bh2", "B Hand 2", "hand", 140, 340, true),
        mkEntry("bh3", "B Hand 3", "hand", 200, 340, true),
      ],
      47,
      2,
    ),
  };

  state.mainDeckOpeningHand = true;
  state.openingHandLibrary = Array.from({ length: 52 }, (_, index) => ({
    instanceId: `a-lib-${index}`,
    card: mkCard(`a-lib-${index}`, `Lib ${index}`),
  }));
  state.openingHandMaterial = Array.from({ length: 3 }, (_, index) => ({
    instanceId: `a-mat-${index}`,
    card: mkCard(`a-mat-${index}`, `Mat ${index}`),
  }));
  state.openingHandHand = [
    mkEntry("af1", "A Field", "field", 200, 20),
    mkEntry("am1", "A Mem", "memory", 180, 180),
    mkEntry("ah1", "A Hand", "hand", 80, 340, false),
    mkEntry("ah2", "A Hand 2", "hand", 140, 340, false),
    mkEntry("ah3", "A Hand 3", "hand", 200, 340, false),
    mkEntry("ah4", "A Hand 4", "hand", 260, 340, false),
    mkEntry("ah5", "A Hand 5", "hand", 320, 340, false),
  ];
  state.openingHandDealComplete = true;
  state.openingHandTurn = 1;
  state.openingHandDamage = 2;
  state.deck = [
    {
      uuid: "layout-test-main",
      name: "Layout Test",
      section: "main",
      quantity: 60,
      image: sampleImage,
      types: ["ALLY"],
    },
  ];
  state.deckName = "Layout Test A";
  updateTryItTurnLabel();
  renderTryItPage();
}

function bootBuilderPage() {
  document.querySelectorAll(".summary-action").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (element.matches("button")) {
        event.preventDefault();
      }
    });
  });

  librarySortSelect?.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });
  librarySortSelect?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  librarySortSelect?.addEventListener("change", (event) => {
    event.stopPropagation();
    const nextSort = librarySortSelect.value;
    state.librarySort = LIBRARY_SORT_OPTIONS.some((option) => option.value === nextSort)
      ? nextSort
      : "default";
    renderCards();
  });
  if (librarySortSelect) {
    librarySortSelect.replaceChildren(
      ...LIBRARY_SORT_OPTIONS.map((option) => {
        const el = document.createElement("option");
        el.value = option.value;
        el.textContent = option.label;
        return el;
      }),
    );
    librarySortSelect.value = state.librarySort;
  }
  libraryLoadAllCheckbox?.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    closeAllMultiSelects();
    runSearch(input.value.trim(), { reset: true, remember: true, scrollToLibrary: true });
  });

  toggleSearchFiltersButton.addEventListener("click", () => {
    state.searchFiltersOpen = !state.searchFiltersOpen;
    if (!state.searchFiltersOpen) {
      closeAllMultiSelects();
    }
    updateSearchFiltersVisibility();
    if (state.searchFiltersOpen) {
      quickFilterEffect.focus();
    }
  });

  applySearchFiltersButton.addEventListener("click", () => {
    closeAllMultiSelects();
    runSearch(input.value.trim(), {
      reset: true,
      remember: Boolean(input.value.trim()),
      scrollToLibrary: true,
    });
  });

  clearSearchFiltersButton.addEventListener("click", () => {
    quickFilterEffect.value = "";
    clearMultiSelect(quickFilterSet);
    clearMultiSelect(quickFilterElement);
    clearMultiSelect(quickFilterType);
    clearMultiSelect(quickFilterSubtype);
    updateSearchFiltersButtonState();
    runSearch(input.value.trim(), { reset: true, remember: false, scrollToLibrary: true });
  });

  bindQuickFilterMultiSelects();

  [quickFilterEffect, quickFilterSet, quickFilterElement, quickFilterType, quickFilterSubtype].forEach((field) => {
    field?.addEventListener("change", updateSearchFiltersButtonState);
    field?.addEventListener("input", updateSearchFiltersButtonState);
  });

  quickFilterEffect.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch(input.value.trim(), {
        reset: true,
        remember: Boolean(input.value.trim()),
        scrollToLibrary: true,
      });
    }
  });

  input.addEventListener("input", updateClearSearchVisibility);

  clearSearchButton.addEventListener("click", () => {
    input.value = "";
    state.query = "";
    state.cards = [];
    state.parsed = null;
    state.reachedEnd = true;
    state.status = "Enter a search such as “fire spells that target units”.";
    updateShareUrl("");
    updateClearSearchVisibility();
    render();
    input.focus();
  });

  document.querySelectorAll("[data-example]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.example;
      runSearch(input.value, { reset: true, remember: true, scrollToLibrary: true });
    });
  });

  keywordRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-keyword]");
    if (!button) {
      return;
    }

    input.value = appendQueryToken(input.value, button.dataset.keyword);
    input.focus();
  });

  recentSearchesEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-recent]");
    if (!button) {
      return;
    }

    input.value = button.dataset.recent;
    runSearch(input.value, { reset: true, remember: true });
  });

  clearRecentsButton.addEventListener("click", () => {
    state.recentSearches = [];
    saveStoredJson(RECENT_SEARCHES_KEY, state.recentSearches);
    renderRecentSearches();
  });

  copyShareButton.addEventListener("click", async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      copyShareButton.textContent = "Copied";
    } catch {
      window.prompt("Copy this search link", url);
    } finally {
      window.setTimeout(() => {
        copyShareButton.textContent = "Copy link";
      }, 1200);
    }
  });

  advancedForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = buildQueryFromAdvancedForm(new FormData(advancedForm));
    input.value = query || input.value;
    runSearch(input.value.trim(), { reset: true, remember: true });
  });

  clearFiltersButton.addEventListener("click", () => {
    advancedForm.reset();
    state.sort = SORT_OPTIONS[0];
    sortSelect.value = "0";
  });

  sortSelect.addEventListener("change", () => {
    state.sort = SORT_OPTIONS[Number(sortSelect.value)] || SORT_OPTIONS[0];
    if (state.query) {
      runSearch(state.query, { reset: true, remember: false });
    }
  });

  loadMoreButton?.addEventListener("click", () => {
    if (!state.loading && !state.reachedEnd) {
      runSearch(state.query, { reset: false, remember: false });
    }
  });

  showAllResultsButton?.addEventListener("click", () => {
    if (!state.loading && !state.reachedEnd && state.parsed) {
      runSearch(state.query, { reset: false, remember: false, loadAll: true });
    }
  });

  libraryLoadAllCheckbox?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  libraryLoadAllCheckbox?.addEventListener("change", (event) => {
    event.stopPropagation();
    state.loadAllResults = Boolean(libraryLoadAllCheckbox.checked);
    saveStoredJson(LOAD_ALL_RESULTS_KEY, state.loadAllResults);
    updateLibraryResultActions();
    if (state.loadAllResults && state.parsed && !state.reachedEnd && !state.loading) {
      runSearch(state.query, { reset: false, remember: false, loadAll: true });
    }
  });

  exportDeckButton.addEventListener("click", () => exportDeck(exportDeckButton));
  exportDeckFullscreenButton.addEventListener("click", () => exportDeck(exportDeckFullscreenButton));
  downloadDeckButton.addEventListener("click", downloadDeck);
  downloadDeckFullscreenButton.addEventListener("click", downloadDeck);
  importDeckButton.addEventListener("click", openImportDialog);
  importDeckFullscreenButton.addEventListener("click", openImportDialog);
  clearDeckButton.addEventListener("click", clearDeck);
  clearDeckFullscreenButton.addEventListener("click", clearDeck);
  [toggleDeckIndividualButton, toggleDeckIndividualFullscreenButton].forEach((button) => {
    button?.addEventListener("click", () => {
      state.deckShowIndividually = !state.deckShowIndividually;
      renderDeck();
    });
  });
  deckNameInput.addEventListener("input", () => {
    state.deckName = deckNameInput.value.trim() || "Untitled Deck";
    saveStoredJson(DECK_NAME_STORAGE_KEY, state.deckName);
  });
  closeDeckFullscreenButton.addEventListener("click", () => deckFullscreen.close());
  goCardSearchButton.addEventListener("click", goToCardSearch);
  deckFullscreen.addEventListener("click", (event) => {
    if (event.target === deckFullscreen) {
      deckFullscreen.close();
    }
  });
  deckFullscreen.addEventListener("close", () => {
    resetDeckAutocomplete();
    hideDeckToast();
    renderDeck();
  });
  [deckListEl, deckListFullscreenEl].forEach((deckList) => {
    deckList.addEventListener("click", handleSectionDeckClick);
    deckList.addEventListener("input", handleSectionDeckInput);
    deckList.addEventListener("keydown", handleSectionDeckKeydown);
    deckList.addEventListener("submit", handleSectionDeckSubmit);
    deckList.addEventListener("mousedown", (event) => {
      if (event.target.closest("[data-autocomplete-index]")) {
        event.preventDefault();
      }
    });
  });
  closeImportDialogButton.addEventListener("click", () => importDialog.close());
  cancelImportButton.addEventListener("click", () => importDialog.close());
  importDialog.addEventListener("click", (event) => {
    if (event.target === importDialog) {
      importDialog.close();
    }
  });
  importForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await importDeckFromText(importText.value);
  });

  document.querySelectorAll("[data-deck-suggestion]").forEach((button) => {
    button.addEventListener("click", async () => {
      const suggestion = DECK_SUGGESTIONS.find((entry) => entry.id === button.dataset.deckSuggestion);
      if (!suggestion) {
        return;
      }
      if (
        state.deck.length > 0 &&
        !window.confirm(`Replace your current deck with “${suggestion.shortLabel}”?`)
      ) {
        return;
      }
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Loading…";
      try {
        await importDeckFromText(suggestion.listText, {
          label: suggestion.shortLabel,
          showOverlay: true,
          closeImportDialog: false,
        });
        showDeckToast(`Loaded ${suggestion.shortLabel}`);
        document.querySelector("#deck-builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });
  });
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });

  [deckListEl, deckListFullscreenEl].forEach((deckList) => {
    deckList.addEventListener("click", handleDeckListClick);
    deckList.addEventListener("change", handleDeckListInput);
  });

  chipsEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-phrase]");
    if (!button) {
      return;
    }

    input.value = removePhrasesFromQuery(input.value, button.dataset.removePhrase.split("||"));
    runSearch(input.value.trim(), { reset: true, remember: true });
  });

  closeLightboxButton?.addEventListener("click", closeLightbox);
  lightboxPrevButton?.addEventListener("click", () => stepLightbox(-1));
  lightboxNextButton?.addEventListener("click", () => stepLightbox(1));

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox?.open) {
      return;
    }
    if (event.key === "Escape") {
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepLightbox(-1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepLightbox(1);
    }
  });

  renderKeywordButtons();
  renderSortOptions();
  renderRecentSearches();
  renderDeck();
  updateScrollTopVisibility();

  loadOptions().then(() => {
    input.value = state.query;
    updateClearSearchVisibility();
    updateSearchFiltersVisibility();
    if (state.query.trim()) {
      runSearch(state.query, { reset: true, remember: false });
    } else {
      state.status = `Enter a search such as “${EXAMPLE_QUERY}”.`;
      render();
    }
  });
}

function openFullscreenDeckBuilder() {
  if (!deckFullscreen.open) {
    deckFullscreen.showModal();
  }
  renderDeck();
}

function goToCardSearch() {
  const focusSearch = () => {
    const section = cardSearchSection;
    if (section && section.tagName === "DETAILS") {
      section.open = true;
    }
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      input.focus({ preventScroll: true });
    }, 50);
  };

  if (deckFullscreen.open) {
    deckFullscreen.addEventListener("close", focusSearch, { once: true });
    deckFullscreen.close();
    return;
  }

  focusSearch();
}

function scrollLibraryIntoView() {
  const library = document.querySelector("#library");
  if (!library) {
    return;
  }
  if (library.tagName === "DETAILS") {
    library.open = true;
  }
  library.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getActiveDeckList() {
  return deckFullscreen.open ? deckListFullscreenEl : deckListEl;
}

function getActiveDeckToast() {
  return deckFullscreen.open ? deckToastEl : deckToastHomeEl;
}

async function loadOptions() {
  try {
    const response = await fetch(`${API_BASE}/option/search`);
    if (!response.ok) {
      throw new Error(`Grand Archive options returned ${response.status}`);
    }

    const options = await response.json();
    state.options = {
      class: normalizeOptions(options.class, FALLBACK_OPTIONS.class),
      element: normalizeOptions(options.element, FALLBACK_OPTIONS.element),
      rarity: normalizeOptions(options.rarity, FALLBACK_OPTIONS.rarity),
      set: normalizeOptions(options.set, FALLBACK_OPTIONS.set),
      subtype: normalizeOptions(options.subtype, FALLBACK_OPTIONS.subtype),
      type: normalizeOptions(options.type, FALLBACK_OPTIONS.type),
    };
    renderAdvancedOptions();
    renderSearchSuggestions();
    state.status = "Ready.";
  } catch (error) {
    console.warn(error);
    state.status = "Using built-in terms because the API options could not be loaded.";
  }

  render();
}

async function runSearch(
  query,
  { reset, remember = false, scrollToLibrary = false, loadAll = state.loadAllResults } = {},
) {
  const hasQuickFilters = hasActiveQuickFilters();
  if (!query && !hasQuickFilters) {
    state.cards = [];
    state.parsed = null;
    state.query = "";
    state.status = "Enter a search such as “fire spells that target units”.";
    state.reachedEnd = true;
    state.searchTotalCards = null;
    updateShareUrl("");
    render();
    return;
  }

  if (remember && query) {
    rememberSearch(query);
  }
  if (reset) {
    updateShareUrl(query);
  }

  if (reset) {
    state.cards = [];
    state.page = 1;
    state.reachedEnd = false;
    state.searchTotalCards = null;
  }

  state.loading = true;
  state.query = query;
  state.parsed = applyQuickFilters(parseNaturalQuery(query, state.options));
  state.status = reset
    ? loadAll
      ? "Loading all cards..."
      : "Searching cards..."
    : loadAll
      ? "Loading remaining cards..."
      : "Loading more cards...";
  render();
  if (scrollToLibrary) {
    scrollLibraryIntoView();
  }

  try {
    let usedFallback = false;
    let pagesFetched = 0;

    do {
      const pageResult = await fetchAndAppendSearchPage();
      usedFallback = usedFallback || pageResult.usedFallback;
      pagesFetched += 1;

      if (loadAll && !state.reachedEnd) {
        const totalLabel = state.searchTotalCards ? `/${state.searchTotalCards}` : "";
        state.status = `Loading all cards… ${state.cards.length}${totalLabel}`;
        render();
      }
    } while (loadAll && !state.reachedEnd && pagesFetched < MAX_SEARCH_PAGES);

    if (loadAll && !state.reachedEnd && pagesFetched >= MAX_SEARCH_PAGES) {
      state.status = `${buildStatus(state.cards.length, state.parsed, usedFallback)} Stopped after ${MAX_SEARCH_PAGES} pages — use Load more for the rest.`;
    } else {
      state.status = buildStatus(state.cards.length, state.parsed, usedFallback);
    }
  } catch (error) {
    console.error(error);
    state.status = "Could not reach the Grand Archive API. Please try again.";
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchAndAppendSearchPage() {
  const { cards, usedFallback, hasMore, totalCards } = await fetchCards(state.parsed, state.page);
  if (Number.isFinite(totalCards)) {
    state.searchTotalCards = totalCards;
  }

  const visibleCards = cards.filter((card) => cardMatchesParsedQuery(card, state.parsed));
  state.cards = uniqueBy(
    [...state.cards, ...visibleCards],
    (card) => card.uuid || card.slug || card.name,
  );
  state.page += 1;
  state.reachedEnd = typeof hasMore === "boolean" ? !hasMore : cards.length < PAGE_SIZE;
  return { usedFallback, hasMore };
}

async function fetchCards(parsed, page) {
  const params = buildSearchParams(parsed, page);
  let response = await fetch(`${API_BASE}/cards/search?${params}`);
  if (!response.ok) {
    throw new Error(`Grand Archive search returned ${response.status}`);
  }

  let payload = await response.json();
  let cards = Array.isArray(payload.data) ? payload.data : [];
  let usedFallback = false;

  if (cards.length === 0 && parsed.nameQuery && !parsed.effectQuery) {
    const fallbackParams = buildSearchParams(
      { ...parsed, effectQuery: parsed.nameQuery, nameQuery: "" },
      page,
    );
    response = await fetch(`${API_BASE}/cards/search?${fallbackParams}`);
    if (!response.ok) {
      throw new Error(`Grand Archive fallback search returned ${response.status}`);
    }
    payload = await response.json();
    cards = Array.isArray(payload.data) ? payload.data : [];
    usedFallback = true;
  }

  return {
    cards,
    usedFallback,
    hasMore: typeof payload.has_more === "boolean" ? payload.has_more : cards.length >= PAGE_SIZE,
    totalCards: Number.isFinite(payload.total_cards) ? payload.total_cards : null,
  };
}

function buildSearchParams(parsed, page) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
    sort: parsed.sort.sort,
    order: parsed.sort.order,
  });

  appendAll(params, "element", parsed.filters.element);
  appendAll(params, "type", typesForApiQuery(parsed.filters.type));
  appendAll(params, "subtype", parsed.filters.subtype);
  appendAll(params, "class", parsed.filters.class);
  appendAll(params, "prefix", parsed.filters.prefix);
  appendAll(params, "speed", parsed.filters.speed);
  appendAll(params, "rarity", parsed.filters.rarity);

  if (parsed.legality.format) {
    params.set("legality_format", parsed.legality.format);
    params.set("legality_state", parsed.legality.state);
  }

  if (parsed.effectQuery) {
    const apiEffect = (parsed.effectTerms && parsed.effectTerms[0]) || parsed.effectQuery;
    params.set("effect", apiEffect);
  } else if (parsed.nameQuery) {
    params.set("name", parsed.nameQuery);
  }

  return params;
}

function parseNaturalQuery(query, options) {
  const normalized = normalizeText(query);
  const parsed = {
    effectQuery: "",
    effectTerms: [],
    filters: {
      class: [],
      element: [],
      prefix: [],
      rarity: [],
      speed: [],
      subtype: [],
      type: [],
    },
    excludeFilters: {
      class: [],
      element: [],
      prefix: [],
      rarity: [],
      speed: [],
      subtype: [],
      type: [],
    },
    legality: extractLegalityFilter(normalized),
    matchedLabels: [],
    statFilters: [],
    nameQuery: "",
    raw: query,
    sort: state.sort,
  };

  if (parsed.legality.format) {
    parsed.matchedLabels.push({
      field: "Legality",
      phrases: [parsed.legality.phrase],
      text: `${titleCase(parsed.legality.format)} ${titleCase(parsed.legality.state)}`,
      value: parsed.legality.format,
    });
  }

  const consumedPhrases = parsed.legality.phrase ? [parsed.legality.phrase] : [];
  for (const config of OPTION_FIELDS) {
    const optionMatches = matchOptions(normalized, options[config.optionKey] || [], config.optionKey);
    const excluded = optionMatches.filter((match) => isExcludedPhrase(normalized, match.phrases));
    const included = optionMatches.filter(
      (match) => !excluded.some((excludedMatch) => excludedMatch.value === match.value),
    );

    parsed.filters[config.field] = included.map((match) => match.value);
    parsed.excludeFilters[config.field] = excluded.map((match) => match.value);
    parsed.matchedLabels.push(
      ...included.map((match) => ({
        field: config.label,
        phrases: match.phrases,
        text: match.text,
        value: match.value,
      })),
      ...excluded.map((match) => ({
        field: `Exclude ${config.label}`,
        phrases: match.phrases,
        text: match.text,
        value: match.value,
      })),
    );
    consumedPhrases.push(...optionMatches.flatMap((match) => match.phrases));
  }

  const speedMatches = matchOptions(normalized, SPEED_OPTIONS, "speed");
  const excludedSpeeds = speedMatches.filter((match) => isExcludedPhrase(normalized, match.phrases));
  const includedSpeeds = speedMatches.filter(
    (match) => !excludedSpeeds.some((excludedMatch) => excludedMatch.value === match.value),
  );
  parsed.filters.speed = includedSpeeds.map((match) => match.value);
  parsed.excludeFilters.speed = excludedSpeeds.map((match) => match.value);
  parsed.matchedLabels.push(
    ...includedSpeeds.map((match) => ({
      field: "Speed",
      phrases: match.phrases,
      text: match.text,
      value: match.value,
    })),
    ...excludedSpeeds.map((match) => ({
      field: "Exclude Speed",
      phrases: match.phrases,
      text: match.text,
      value: match.value,
    })),
  );
  consumedPhrases.push(...speedMatches.flatMap((match) => match.phrases));

  parsed.statFilters = extractStatFilters(normalized);
  parsed.matchedLabels.push(
    ...parsed.statFilters.map((filter) => ({
      field: "Stat",
      phrases: [filter.phrase, normalizeEffectQuery(filter.phrase)],
      text: `${filter.label} ${formatOperator(filter.operator)} ${filter.value}`,
      value: `${filter.key}${filter.operator}${filter.value}`,
    })),
  );
  consumedPhrases.push(
    ...parsed.statFilters.flatMap((filter) => [filter.phrase, normalizeEffectQuery(filter.phrase)]),
  );

  const quotedPhrases = extractQuotedPhrases(query);
  const targetPhrase = extractTargetPhrase(normalized);
  const effectFromCue = extractEffectFromCue(normalized);

  if (targetPhrase) {
    parsed.effectQuery = targetPhrase;
  } else if (quotedPhrases.length > 0) {
    parsed.effectQuery = quotedPhrases[0];
  } else if (effectFromCue) {
    parsed.effectQuery = effectFromCue;
  } else {
    const remainder = cleanRemainder(normalized, consumedPhrases);
    if (hasAnyFilter(parsed)) {
      parsed.effectQuery = remainder;
    } else {
      parsed.nameQuery = query.trim();
    }
  }

  parsed.effectQuery = normalizeEffectQuery(cleanRemainder(parsed.effectQuery, consumedPhrases));
  parsed.effectTerms = parseEffectAndTerms(parsed.effectQuery);
  return parsed;
}

function isExcludedPhrase(normalizedQuery, phrases) {
  return phrases.some((phrase) =>
    new RegExp(String.raw`\b(?:not|without|except|exclude|excluding|minus)\s+(?:the\s+)?${escapeRegex(phrase)}\b`).test(
      normalizedQuery,
    ),
  );
}

function matchOptions(normalizedQuery, options, field) {
  const matches = [];
  const seenValues = new Set();

  for (const option of options) {
    const phrases = buildOptionPhrases(option, field);
    const matchedPhrases = phrases.filter((phrase) => containsPhrase(normalizedQuery, phrase));
    if (matchedPhrases.length === 0 || seenValues.has(option.value)) {
      continue;
    }

    seenValues.add(option.value);
    matches.push({
      phrases: matchedPhrases,
      text: option.text,
      value: option.value,
    });
  }

  return matches;
}

function buildOptionPhrases(option, field) {
  const text = normalizeText(option.text);
  const value = normalizeText(option.value);
  const display = normalizeText(option.display);
  const phrases = field === "rarity" ? new Set([text, display]) : new Set([text, value, display]);
  const aliases = OPTION_ALIASES[field]?.[option.value] || [];

  aliases.forEach((alias) => phrases.add(normalizeText(alias)));

  for (const phrase of [...phrases]) {
    if (phrase && !phrase.endsWith("s")) {
      phrases.add(`${phrase}s`);
    }
  }

  return [...phrases].filter(Boolean).sort((a, b) => b.length - a.length);
}

function extractLegalityFilter(normalizedQuery) {
  const formats = [
    { format: "STANDARD", phrases: ["standard"] },
    { format: "DRAFT", phrases: ["draft", "limited"] },
    { format: "PANTHEON", phrases: ["pantheon"] },
  ];

  for (const entry of formats) {
    for (const phrase of entry.phrases) {
      const legalMatch = normalizedQuery.match(
        new RegExp(String.raw`\b${escapeRegex(phrase)}\s+(legal|restricted)\b`),
      );
      if (legalMatch) {
        return { format: entry.format, phrase: legalMatch[0], state: legalMatch[1].toUpperCase() };
      }

      const reverseMatch = normalizedQuery.match(
        new RegExp(String.raw`\b(legal|restricted)\s+(?:in\s+)?${escapeRegex(phrase)}\b`),
      );
      if (reverseMatch) {
        return { format: entry.format, phrase: reverseMatch[0], state: reverseMatch[1].toUpperCase() };
      }
    }
  }

  return { format: "", phrase: "", state: "ANY" };
}

function extractStatFilters(normalizedQuery) {
  const filters = [];
  const usedPhrases = new Set();

  for (const stat of STAT_DEFINITIONS) {
    const aliasPattern = buildStatAliasPattern(stat);
    const operatorPattern = OPERATOR_PATTERNS.flatMap((entry) => entry.phrases)
      .map(escapeRegex)
      .sort((a, b) => b.length - a.length)
      .join("|");

    const patterns = [
      {
        regex: new RegExp(String.raw`\b(${operatorPattern})\s+(\d+)\s+(${aliasPattern})\b`, "g"),
        parse: (match) => ({ operator: operatorFromPhrase(match[1]), value: match[2] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s+(${operatorPattern})\s+(\d+)\b`, "g"),
        parse: (match) => ({ operator: operatorFromPhrase(match[2]), value: match[3] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s+(\d+)\s+or\s+(less|lower)\b`, "g"),
        parse: (match) => ({ operator: "<=", value: match[2] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s+(\d+)\s+or\s+(more|greater|higher)\b`, "g"),
        parse: (match) => ({ operator: ">=", value: match[2] }),
      },
      {
        regex: new RegExp(String.raw`\b(\d+)\s+or\s+(less|lower)\s+(${aliasPattern})\b`, "g"),
        parse: (match) => ({ operator: "<=", value: match[1] }),
      },
      {
        regex: new RegExp(String.raw`\b(\d+)\s+or\s+(more|greater|higher)\s+(${aliasPattern})\b`, "g"),
        parse: (match) => ({ operator: ">=", value: match[1] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s+(\d+)\+(?=\s|$)`, "g"),
        parse: (match) => ({ operator: ">=", value: match[2] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s*(?:is|are|=|:)\s*(\d+)\b`, "g"),
        parse: (match) => ({ operator: "=", value: match[2] }),
      },
      {
        regex: new RegExp(String.raw`\b(\d+)\s+(${aliasPattern})\b`, "g"),
        parse: (match) => ({ operator: "=", value: match[1] }),
      },
      {
        regex: new RegExp(String.raw`\b(${aliasPattern})\s+(\d+)\b`, "g"),
        parse: (match) => ({ operator: "=", value: match[2] }),
      },
    ];

    for (const pattern of patterns) {
      for (const match of normalizedQuery.matchAll(pattern.regex)) {
        const phrase = match[0].trim();
        if ([...usedPhrases].some((usedPhrase) => usedPhrase.includes(phrase) || phrase.includes(usedPhrase))) {
          continue;
        }

        const { operator, value } = pattern.parse(match);
        usedPhrases.add(phrase);
        filters.push({
          key: stat.key,
          label: stat.label,
          operator,
          phrase,
          value: Number(value),
        });
      }
    }
  }

  return dedupeStatFilters(filters);
}

function buildStatAliasPattern(stat) {
  const aliases = new Set();

  for (const alias of stat.aliases.map(normalizeText)) {
    aliases.add(alias);
    if (!alias.endsWith("s")) {
      aliases.add(`${alias}s`);
    }
    if (alias.endsWith(" cost")) {
      aliases.add(alias.replace(/ cost$/, " costs"));
    }
    if (alias === "cost") {
      aliases.add("costing");
    }
  }

  return [...aliases]
    .filter(Boolean)
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length)
    .join("|");
}

function dedupeStatFilters(filters) {
  const seen = new Set();
  return filters.filter((filter) => {
    const key = `${filter.key}:${filter.operator}:${filter.value}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function operatorFromPhrase(phrase) {
  const normalized = normalizeText(phrase);
  return (
    OPERATOR_PATTERNS.find((entry) => entry.phrases.includes(normalized))?.operator || "="
  );
}

function formatOperator(operator) {
  return {
    "<": "<",
    "<=": "<=",
    ">": ">",
    ">=": ">=",
    "=": "=",
  }[operator] || "=";
}

function extractQuotedPhrases(query) {
  return [...query.matchAll(/["'“”‘’]([^"'“”‘’]+)["'“”‘’]/g)]
    .map((match) => normalizeEffectQuery(match[1]))
    .filter(Boolean);
}

function extractTargetPhrase(normalizedQuery) {
  const match = normalizedQuery.match(
    /\btargets?\s+(?:a |an |the |any |another |up to \w+ |up to \d+ )?([a-z][a-z -]*?)(?=\s+(?:and|or|with|that|which|where|whose|when|while|if|from|in|for|to|by)\b|$)/,
  );

  if (!match) {
    return "";
  }

  return normalizeEffectQuery(`target ${singularizeWords(match[1])}`);
}

function extractEffectFromCue(normalizedQuery) {
  const cueMatch = normalizedQuery.match(
    /\b(?:effect(?:s)?|text|with|has|have|having|contains?|includes?|that|which|whose)\b\s+(.+)$/,
  );

  if (!cueMatch) {
    return "";
  }

  return normalizeEffectQuery(cueMatch[1]);
}

function cleanRemainder(normalizedQuery, consumedPhrases) {
  let remainder = ` ${normalizedQuery} `;
  for (const phrase of consumedPhrases.filter(Boolean)) {
    remainder = remainder.split(phrase).join(" ");
    remainder = remainder.replace(new RegExp(String.raw`\b${escapeRegex(phrase)}\b`, "g"), " ");
  }

  remainder = remainder
    .replace(
      /\b(show|shows|find|search|get|not|without|except|exclude|excluding|minus|cards?|element|elements|types?|subtypes?|classes?|sets?|prefix|editions?|stats?|cost|costs|costing|effect|effects|text|that|which|where|whose|with|has|have|having|include|includes|including|contain|contains|containing|of|the|a|an|and|or|is|are|for|in|to|using|use)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  return normalizeEffectQuery(remainder);
}

function normalizeEffectQuery(value) {
  return singularizeWords(normalizeText(value)).trim();
}

function hasAnyFilter(parsed) {
  return (
    Object.values(parsed.filters).some((values) => values.length > 0) ||
    Object.values(parsed.excludeFilters).some((values) => values.length > 0) ||
    parsed.statFilters.length > 0 ||
    Boolean(parsed.legality.format)
  );
}

function cardMatchesParsedQuery(card, parsed) {
  return (
    fieldMatches(card.elements, parsed.filters.element) &&
    stackedTypeMatches(card, parsed.filters.type) &&
    fieldMatches(card.subtypes, parsed.filters.subtype) &&
    fieldMatches(card.classes, parsed.filters.class) &&
    setMatches(card, parsed.filters.prefix) &&
    rarityMatches(card, parsed.filters.rarity) &&
    speedMatches(card, parsed.filters.speed) &&
    excludedFiltersMatch(card, parsed.excludeFilters) &&
    statFiltersMatch(card, parsed.statFilters) &&
    effectMatches(card, parsed.effectQuery, parsed.effectTerms)
  );
}

function fieldMatches(cardValues = [], requiredValues = []) {
  if (requiredValues.length === 0) {
    return true;
  }

  const normalizedValues = new Set(cardValues.map((value) => String(value).toUpperCase()));
  return requiredValues.some((value) => normalizedValues.has(String(value).toUpperCase()));
}

function stackedTypeMatches(card, requiredTypes = []) {
  if (requiredTypes.length === 0) {
    return true;
  }

  const cardValues = new Set(
    [...(card.types || []), ...(card.subtypes || [])].map((value) => String(value).toUpperCase()),
  );
  const required = requiredTypes.map((value) => String(value).toUpperCase());
  const wantsUnique = required.includes("UNIQUE");
  const others = required.filter((value) => value !== "UNIQUE");

  if (wantsUnique && !cardValues.has("UNIQUE")) {
    return false;
  }
  if (others.length === 0) {
    return true;
  }
  return others.some((value) => cardValues.has(value));
}

function typesForApiQuery(types = []) {
  const required = types.map((value) => String(value).toUpperCase());
  if (required.includes("UNIQUE") && required.length > 1) {
    return ["UNIQUE"];
  }
  return types;
}

function excludedFiltersMatch(card, excludeFilters) {
  return (
    !hasExcludedMatch(card.elements, excludeFilters.element) &&
    !hasExcludedMatch(card.types, excludeFilters.type) &&
    !hasExcludedMatch(card.subtypes, excludeFilters.subtype) &&
    !hasExcludedMatch(card.classes, excludeFilters.class) &&
    !(excludeFilters.prefix.length > 0 && setMatches(card, excludeFilters.prefix)) &&
    !(excludeFilters.rarity.length > 0 && rarityMatches(card, excludeFilters.rarity)) &&
    !(excludeFilters.speed.length > 0 && speedMatches(card, excludeFilters.speed))
  );
}

function hasExcludedMatch(cardValues, excludedValues) {
  return excludedValues.length > 0 && fieldMatches(cardValues, excludedValues);
}

function effectMatches(card, effectQuery, effectTerms = []) {
  const terms = (effectTerms && effectTerms.length > 0
    ? effectTerms
    : effectQuery
      ? [effectQuery]
      : []
  )
    .map((term) => normalizeEffectQuery(term))
    .filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const effectText = normalizeEffectQuery(
    [
      card.effect_raw,
      card.edition?.effect_raw,
      ...(card.result_editions || []).map((edition) => edition.effect_raw),
      ...(card.editions || []).map((edition) => edition.effect_raw),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return terms.every((term) => effectText.includes(term));
}

function parseEffectAndTerms(effectValue) {
  const raw = String(effectValue || "").trim();
  if (!raw) {
    return [];
  }

  const parts = raw
    .split(/\s+(?:AND|&&)\s+/i)
    .map((part) => normalizeEffectQuery(part))
    .filter(Boolean);

  return parts.length > 0 ? parts : [];
}

function hasActiveQuickFilters() {
  return Boolean(
    quickFilterEffect?.value.trim() ||
      getMultiSelectValues(quickFilterSet).length ||
      getMultiSelectValues(quickFilterElement).length ||
      getMultiSelectValues(quickFilterType).length ||
      getMultiSelectValues(quickFilterSubtype).length,
  );
}

function applyQuickFilters(parsed) {
  const effectValue = quickFilterEffect?.value.trim() || "";
  const setPrefixes = getMultiSelectValues(quickFilterSet);
  const elements = getMultiSelectValues(quickFilterElement);
  const types = getMultiSelectValues(quickFilterType);
  const subtypes = getMultiSelectValues(quickFilterSubtype);

  if (effectValue) {
    const terms = parseEffectAndTerms(effectValue);
    parsed.effectTerms = terms;
    parsed.effectQuery = terms.length > 1 ? terms.join(" AND ") : terms[0] || normalizeEffectQuery(effectValue);
    parsed.nameQuery = "";
  } else if (parsed.effectQuery) {
    parsed.effectTerms = parseEffectAndTerms(parsed.effectQuery);
  } else {
    parsed.effectTerms = [];
  }

  if (setPrefixes.length > 0) {
    parsed.filters.prefix = setPrefixes;
    upsertQuickFilterLabels(
      parsed,
      "Set",
      setPrefixes.map((value) => ({
        value,
        text: formatSetOptionLabel(
          state.options.set.find((option) => option.value === value) || {
            value,
            text: value,
          },
        ),
      })),
    );
  }
  if (elements.length > 0) {
    parsed.filters.element = elements;
    upsertQuickFilterLabels(
      parsed,
      "Element",
      elements.map((value) => ({ value, text: titleCase(value) })),
    );
  }
  if (types.length > 0) {
    parsed.filters.type = types;
    upsertQuickFilterLabels(
      parsed,
      "Type",
      types.map((value) => ({ value, text: titleCase(value) })),
    );
  }
  if (subtypes.length > 0) {
    parsed.filters.subtype = subtypes;
    upsertQuickFilterLabels(
      parsed,
      "Subtype",
      subtypes.map((value) => ({ value, text: titleCase(value) })),
    );
  }

  return parsed;
}

function upsertQuickFilterLabel(parsed, field, value, text) {
  upsertQuickFilterLabels(parsed, field, [{ value, text }]);
}

function upsertQuickFilterLabels(parsed, field, entries) {
  parsed.matchedLabels = parsed.matchedLabels.filter((match) => match.field !== field);
  if (!entries?.length) {
    return;
  }
  parsed.matchedLabels.push({
    field,
    phrases: entries.flatMap((entry) => [entry.value, entry.text]),
    text: entries.map((entry) => entry.text).join(", "),
    value: entries.map((entry) => entry.value).join(","),
  });
}

function updateSearchFiltersVisibility() {
  if (!searchFiltersEl || !toggleSearchFiltersButton) {
    return;
  }

  searchFiltersEl.hidden = !state.searchFiltersOpen;
  toggleSearchFiltersButton.setAttribute("aria-expanded", state.searchFiltersOpen ? "true" : "false");
  toggleSearchFiltersButton.classList.toggle("active-filter-toggle", state.searchFiltersOpen || hasActiveQuickFilters());
  updateSearchFiltersButtonState();
}

function updateSearchFiltersButtonState() {
  if (!toggleSearchFiltersButton) {
    return;
  }

  const active = hasActiveQuickFilters();
  toggleSearchFiltersButton.classList.toggle("has-active-filters", active);
  toggleSearchFiltersButton.textContent = active ? "Filters •" : "Filters";
}

function setMatches(card, requiredPrefixes = []) {
  if (requiredPrefixes.length === 0) {
    return true;
  }

  const prefixes = getEditions(card).map((edition) => edition.set?.prefix).filter(Boolean);
  return fieldMatches(prefixes, requiredPrefixes);
}

function rarityMatches(card, requiredRarities = []) {
  if (requiredRarities.length === 0) {
    return true;
  }

  const rarities = getEditions(card).map((edition) => String(edition.rarity)).filter(Boolean);
  return fieldMatches(rarities, requiredRarities.map(String));
}

function speedMatches(card, requiredSpeeds = []) {
  if (requiredSpeeds.length === 0) {
    return true;
  }

  return fieldMatches([String(statValue(card.speed)).toLowerCase()], requiredSpeeds);
}

function statFiltersMatch(card, statFilters = []) {
  return statFilters.every((filter) => {
    const value = getComparableStat(card, filter.key);
    if (value == null) {
      return false;
    }

    return compareNumber(value, filter.operator, filter.value);
  });
}

function getComparableStat(card, key) {
  if (key === "cost") {
    return parseStatNumber(card.cost?.value);
  }

  if (key === "cost_memory" || key === "cost_reserve") {
    return parseStatNumber(card[key]);
  }

  return parseStatNumber(statValue(card[key]));
}

function compareNumber(actual, operator, expected) {
  const target = parseStatNumber(expected);
  if (target == null) {
    return false;
  }

  switch (operator) {
    case "<":
      return actual < target;
    case "<=":
      return actual <= target;
    case ">":
      return actual > target;
    case ">=":
      return actual >= target;
    default:
      return actual === target;
  }
}

function parseStatNumber(value) {
  if (value == null || String(value).toUpperCase() === "X") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function updateScrollTopVisibility() {
  const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
  const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
  const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight || viewport;
  const nearBottom = scrolled + viewport >= pageHeight * 0.72;
  scrollTopButton.classList.toggle("show", nearBottom && scrolled > viewport * 0.6);
}

function updateClearSearchVisibility() {
  clearSearchButton.classList.toggle("hidden", input.value.length === 0);
}

function renderKeywordButtons() {
  keywordRow.replaceChildren(
    ...KEYWORD_SEARCHES.map((keyword) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.keyword = keyword;
      button.textContent = keyword;
      return button;
    }),
  );
}

function renderSortOptions() {
  sortSelect.replaceChildren(
    ...SORT_OPTIONS.map((option, index) => {
      const item = document.createElement("option");
      item.value = String(index);
      item.textContent = option.label;
      return item;
    }),
  );
  sortSelect.value = String(SORT_OPTIONS.indexOf(state.sort));
}

function renderAdvancedOptions() {
  fillSelect("#filter-element", state.options.element, "Any element");
  fillSelect("#filter-type", state.options.type, "Any type");
  fillSelect("#filter-subtype", state.options.subtype, "Any subtype");
  fillSelect("#filter-class", state.options.class, "Any class");
  fillSelect("#filter-set", sortSetsForDisplay(state.options.set), "Any set", formatSetOptionLabel);
  fillSelect("#filter-speed", SPEED_OPTIONS, "Any speed");
  fillSelect(
    "#filter-stat",
    STAT_DEFINITIONS.map((stat) => ({ text: stat.label, value: stat.key })),
    "No stat filter",
  );
  fillMultiSelect(quickFilterSet, sortSetsForDisplay(state.options.set), formatSetOptionLabel);
  fillMultiSelect(quickFilterElement, state.options.element);
  fillMultiSelect(quickFilterType, state.options.type);
  fillMultiSelect(quickFilterSubtype, state.options.subtype);
}

function renderSearchSuggestions() {
  if (!suggestionsEl) {
    return;
  }
  const suggestions = [
    ...KEYWORD_SEARCHES,
    ...flattenOptionTexts(state.options.element),
    ...flattenOptionTexts(state.options.type),
    ...flattenOptionTexts(state.options.subtype),
    ...flattenOptionTexts(state.options.class),
    ...flattenOptionTexts(state.options.set),
    ...STAT_DEFINITIONS.flatMap((stat) => stat.aliases),
    ...state.recentSearches,
  ];

  suggestionsEl.replaceChildren(
    ...uniqueBy(suggestions.filter(Boolean), (value) => normalizeText(value)).map((value) => {
      const option = document.createElement("option");
      option.value = value;
      return option;
    }),
  );
}

function fillSelect(selector, options, placeholder, formatLabel = null) {
  const select = document.querySelector(selector);
  if (!select) {
    return;
  }
  select.replaceChildren(createOption("", placeholder));
  for (const option of options || []) {
    const label = formatLabel
      ? formatLabel(option)
      : option.display || option.text || option.value;
    select.append(createOption(option.value, label));
  }
}

function getMultiSelectValues(root) {
  if (!root) {
    return [];
  }
  return [...root.querySelectorAll('input[type="checkbox"]:checked')]
    .map((inputEl) => inputEl.value)
    .filter(Boolean);
}

function clearMultiSelect(root) {
  if (!root) {
    return;
  }
  root.querySelectorAll('input[type="checkbox"]').forEach((inputEl) => {
    inputEl.checked = false;
  });
  updateMultiSelectToggle(root);
  closeMultiSelect(root);
}

function fillMultiSelect(root, options, formatLabel = null) {
  if (!root) {
    return;
  }
  const panel = root.querySelector(".multi-select-panel");
  if (!panel) {
    return;
  }
  const selected = new Set(getMultiSelectValues(root));
  panel.replaceChildren();
  for (const option of options || []) {
    const label = formatLabel
      ? formatLabel(option)
      : option.display || option.text || option.value;
    const row = document.createElement("label");
    row.className = "multi-select-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option.value;
    checkbox.checked = selected.has(option.value);
    const text = document.createElement("span");
    text.textContent = label;
    row.append(checkbox, text);
    panel.append(row);
  }
  updateMultiSelectToggle(root);
}

function updateMultiSelectToggle(root) {
  const toggle = root?.querySelector(".multi-select-toggle");
  if (!toggle) {
    return;
  }
  const placeholder = root.dataset.placeholder || "Any";
  const selectedLabels = [...root.querySelectorAll(".multi-select-option")]
    .filter((row) => row.querySelector("input")?.checked)
    .map((row) => row.querySelector("span")?.textContent?.trim())
    .filter(Boolean);
  toggle.textContent =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels[0]}, ${selectedLabels[1]} +${selectedLabels.length - 2}`;
  toggle.classList.toggle("has-selection", selectedLabels.length > 0);
}

function setMultiSelectOpen(root, open) {
  if (!root) {
    return;
  }
  const toggle = root.querySelector(".multi-select-toggle");
  const panel = root.querySelector(".multi-select-panel");
  if (!toggle || !panel) {
    return;
  }
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  root.classList.toggle("is-open", open);
}

function closeMultiSelect(root) {
  setMultiSelectOpen(root, false);
}

function closeAllMultiSelects(except = null) {
  document.querySelectorAll(".multi-select.is-open").forEach((root) => {
    if (root !== except) {
      closeMultiSelect(root);
    }
  });
}

function bindQuickFilterMultiSelects() {
  const roots = [quickFilterSet, quickFilterElement, quickFilterType, quickFilterSubtype].filter(Boolean);
  roots.forEach((root) => {
    const toggle = root.querySelector(".multi-select-toggle");
    toggle?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const nextOpen = !root.classList.contains("is-open");
      closeAllMultiSelects(root);
      setMultiSelectOpen(root, nextOpen);
    });
    root.addEventListener("change", () => {
      updateMultiSelectToggle(root);
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".multi-select")) {
      return;
    }
    closeAllMultiSelects();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllMultiSelects();
    }
  });
}

function formatSetOptionLabel(option) {
  const name = option.display || option.text || option.value || "";
  const prefix = option.value || "";
  if (prefix && name && !name.toUpperCase().includes(String(prefix).toUpperCase())) {
    return `${prefix} · ${name}`;
  }
  return name || prefix;
}

function sortSetsForDisplay(sets = []) {
  return [...sets].sort((left, right) => {
    const leftRank = setLaunchRank(left?.value);
    const rightRank = setLaunchRank(right?.value);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return String(left?.display || left?.text || "").localeCompare(
      String(right?.display || right?.text || ""),
      undefined,
      { sensitivity: "base" },
    );
  });
}

function setLaunchRank(prefix) {
  const value = String(prefix || "");
  if (value === FEATURED_SET_PREFIX) {
    return 0;
  }
  if (value.startsWith(FEATURED_SET_PREFIX)) {
    return 1;
  }
  return 2;
}

function createOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function flattenOptionTexts(options = []) {
  return options.flatMap((option) => [option.text, option.display, option.value]).filter(Boolean);
}

function buildQueryFromAdvancedForm(formData) {
  const parts = [];
  const labelFor = (key, value) => {
    if (!value) return "";
    const list = key === "speed" ? SPEED_OPTIONS : state.options[key] || [];
    const option = list.find((item) => String(item.value) === String(value));
    return option?.display || option?.text || value;
  };

  for (const [key, label] of [
    ["element", "element"],
    ["type", "type"],
    ["subtype", "subtype"],
    ["class", "class"],
    ["set", "set"],
    ["speed", "speed"],
  ]) {
    const value = formData.get(key);
    if (value) parts.push(labelFor(label, value));
  }

  const statKey = formData.get("stat");
  const statValueInput = formData.get("statValue")?.trim();
  if (statKey && statValueInput) {
    const stat = STAT_DEFINITIONS.find((item) => item.key === statKey);
    parts.push(`${stat?.aliases[0] || statKey} ${formData.get("operator")} ${statValueInput}`);
  }

  if (formData.get("format")) {
    parts.push(formData.get("format"));
  }

  state.sort = SORT_OPTIONS[Number(formData.get("sort"))] || state.sort;
  return parts.join(" ").trim();
}

function renderRecentSearches() {
  recentSearchesEl.replaceChildren();
  if (state.recentSearches.length === 0) {
    const empty = document.createElement("span");
    empty.className = "hint";
    empty.textContent = "Your recent searches will appear here.";
    recentSearchesEl.append(empty);
    return;
  }

  state.recentSearches.forEach((search) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.recent = search;
    button.textContent = search;
    recentSearchesEl.append(button);
  });
}

function rememberSearch(query) {
  const normalized = query.trim();
  if (!normalized) return;
  state.recentSearches = [
    normalized,
    ...state.recentSearches.filter((search) => search !== normalized),
  ].slice(0, MAX_RECENT_SEARCHES);
  saveStoredJson(RECENT_SEARCHES_KEY, state.recentSearches);
  renderRecentSearches();
  renderSearchSuggestions();
}

function renderDeck() {
  if (!deckCountEl) {
    return;
  }
  const totalCards = getDeckTotal();
  deckCountEl.textContent = String(totalCards);
  updateDeckIndividualToggleButtons();
  renderDeckStats(deckStatsEl);
  renderDeckStats(deckStatsFullscreenEl);
  renderDeckValidation(deckValidationEl);
  renderDeckValidation(deckValidationFullscreenEl);
  renderDeckValidationSummary();
  renderDeckInto(deckListEl, {
    grid: true,
    showSearch: !deckFullscreen.open,
  });
  renderDeckInto(deckListFullscreenEl, {
    grid: true,
    showSearch: deckFullscreen.open,
  });
}

function updateDeckIndividualToggleButtons() {
  const label = state.deckShowIndividually ? "Stack copies" : "Show individually";
  [toggleDeckIndividualButton, toggleDeckIndividualFullscreenButton].forEach((button) => {
    if (!button) return;
    button.textContent = label;
    button.setAttribute("aria-pressed", state.deckShowIndividually ? "true" : "false");
  });
}

function renderDeckValidationSummary() {
  const checks = getDeckValidation();
  const failed = state.deck.length === 0 ? 0 : checks.filter((check) => !check.ok).length;
  const label = state.deck.length === 0
    ? "Deck legality"
    : failed
      ? `Deck legality · ${failed} issue${failed === 1 ? "" : "s"}`
      : "Deck legality · all checks passed";

  ["#deck-validation-summary", "#deck-validation-summary-home"].forEach((selector) => {
    const summary = document.querySelector(selector);
    if (!summary) return;
    summary.textContent = label;
    summary.classList.toggle("has-issues", state.deck.length > 0 && failed > 0);
    summary.classList.toggle("all-ok", state.deck.length > 0 && failed === 0);
  });
}

function renderDeckStats(container) {
  if (!container) return;
  container.replaceChildren();

  DECK_SECTIONS.forEach((section) => {
    const count = getSectionTotal(section.key);
    const chip = document.createElement("div");
    chip.className = "deck-stat-chip";
    const met =
      section.mode === "min" ? count >= section.target : count <= section.target;
    chip.classList.toggle("ok", met && count > 0);
    chip.classList.toggle("warn", !met && count > 0);
    chip.innerHTML = `<strong>${count}</strong><span>${section.title}${section.mode === "min" ? ` / ${section.target}+` : ` / ${section.target}`}</span>`;
    container.append(chip);
  });

  const sidePoints = getSideboardPoints();
  const sideChip = document.createElement("div");
  sideChip.className = "deck-stat-chip";
  sideChip.classList.toggle("ok", sidePoints <= SIDEBOARD_POINT_LIMIT && sidePoints > 0);
  sideChip.classList.toggle("warn", sidePoints > SIDEBOARD_POINT_LIMIT);
  sideChip.innerHTML = `<strong>${sidePoints}</strong><span>Sideboard pts / ${SIDEBOARD_POINT_LIMIT}</span>`;
  container.append(sideChip);
}

function renderDeckValidation(container) {
  if (!container) return;
  container.replaceChildren();
  const checks = getDeckValidation();

  if (state.deck.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Standard constructed: Material ≤12 (unique, Level 0 champion), Main ≥60 (max 4), Sideboard ≤15 cards / 15 points.";
    container.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "deck-validation-list";
  checks.forEach((check) => {
    const item = document.createElement("li");
    item.className = check.ok ? "ok" : "fail";
    item.textContent = check.message;
    list.append(item);
  });
  container.append(list);
}

function renderDeckInto(container, { grid = true, showSearch = false } = {}) {
  container.replaceChildren();

  DECK_SECTIONS.forEach((section) => {
    const sectionCards = state.deck.filter((card) => normalizeDeckSection(card.section) === section.key);
    const group = document.createElement("section");
    group.className = grid ? "deck-section-group deck-section-grid-group" : "deck-section-group";
    group.dataset.deckSectionGroup = section.key;

    if (grid) {
      group.append(createFullscreenSectionHeader(section, sectionCards));
      if (showSearch && state.deckAutocomplete.section === section.key) {
        group.append(createSectionAutocomplete(section));
      }
      if (sectionCards.length === 0) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "No cards in this section yet.";
        group.append(empty);
      } else if (section.key === "main" && state.mainDeckFreehand) {
        group.append(createMainDeckFreehandBoard(sectionCards));
      } else {
        const gridEl = document.createElement("div");
        gridEl.className = "deck-card-grid";
        if (state.deckShowIndividually) {
          gridEl.classList.add("deck-card-grid-individual");
        }
        sectionCards.forEach((card) => {
          if (state.deckShowIndividually) {
            const copies = normalizeQuantity(card.quantity);
            for (let index = 0; index < copies; index += 1) {
              gridEl.append(createDeckGridCard(card, { individual: true }));
            }
          } else {
            gridEl.append(createDeckGridCard(card));
          }
        });
        group.append(gridEl);
      }
    } else {
      const heading = document.createElement("h3");
      heading.textContent = `${section.title} (${sectionCards.reduce((total, card) => total + normalizeQuantity(card.quantity), 0)})`;
      group.append(heading);

      if (sectionCards.length === 0) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "No cards in this section yet.";
        group.append(empty);
      } else {
        sectionCards.forEach((card) => group.append(createDeckRow(card)));
      }
    }

    container.append(group);
  });

  if (showSearch && state.deckAutocomplete.section) {
    renderDeckAutocompleteList();
    window.setTimeout(() => {
      const searchInput = getSectionSearchInput();
      if (searchInput) {
        searchInput.focus();
        const value = searchInput.value;
        searchInput.setSelectionRange(value.length, value.length);
      }
    }, 0);
  }
}

function createFullscreenSectionHeader(section, sectionCards) {
  const header = document.createElement("div");
  header.className = "deck-section-header";

  const heading = document.createElement("h3");
  heading.textContent = `${section.title} (${sectionCards.reduce((total, card) => total + normalizeQuantity(card.quantity), 0)})`;

  const actions = document.createElement("div");
  actions.className = "deck-section-header-actions";

  if (section.key === "main") {
    const freehandButton = document.createElement("button");
    freehandButton.className = "secondary compact";
    freehandButton.type = "button";
    freehandButton.dataset.toggleMainFreehand = "true";
    freehandButton.textContent = state.mainDeckFreehand ? "Normal mode" : "Freehand mode";
    freehandButton.setAttribute("aria-pressed", state.mainDeckFreehand ? "true" : "false");
    actions.append(freehandButton);

    if (state.mainDeckFreehand) {
      const resetButton = document.createElement("button");
      resetButton.className = "ghost compact";
      resetButton.type = "button";
      resetButton.dataset.resetMainFreehand = "true";
      resetButton.textContent = "Reset positions";
      actions.append(resetButton);
    }

    const openingHandButton = document.createElement("a");
    openingHandButton.className = "try-it-button compact";
    openingHandButton.href = TRYIT_PAGE_URL;
    openingHandButton.dataset.openTryIt = "true";
    openingHandButton.textContent = "Try it!";
    openingHandButton.title = "Open the standalone Try it! playtest page";
    actions.append(openingHandButton);

    const studioButton = document.createElement("a");
    studioButton.className = "ghost compact";
    studioButton.href = STUDIO_PAGE_URL;
    studioButton.textContent = "Studio";
    studioButton.title = "Open the Studio playground";
    actions.append(studioButton);
  }

  const addButton = document.createElement("button");
  addButton.className = "secondary compact";
  addButton.type = "button";
  addButton.dataset.openSectionSearch = section.key;
  addButton.textContent = state.deckAutocomplete.section === section.key ? "Close search" : "Add card";
  actions.append(addButton);

  header.append(heading, actions);
  return header;
}

function createSectionAutocomplete(section) {
  const form = document.createElement("form");
  form.className = "deck-autocomplete deck-section-autocomplete";
  form.dataset.sectionSearch = section.key;
  form.autocomplete = "off";

  const label = document.createElement("label");
  label.className = "deck-autocomplete-label";
  label.setAttribute("for", "deck-card-search");
  label.append(`Add to ${section.title}`);

  const row = document.createElement("div");
  row.className = "deck-autocomplete-row";

  const searchInput = document.createElement("input");
  searchInput.id = "deck-card-search";
  searchInput.dataset.deckCardSearch = "true";
  searchInput.name = "deckCardSearch";
  searchInput.type = "search";
  searchInput.enterKeyHint = "search";
  searchInput.spellcheck = false;
  searchInput.autocomplete = "off";
  searchInput.autocapitalize = "off";
  searchInput.placeholder = `Search cards for ${section.title}…`;
  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-controls", "deck-autocomplete-list");
  searchInput.setAttribute("aria-expanded", state.deckAutocomplete.results.length ? "true" : "false");
  searchInput.value = state.deckAutocomplete.query;

  const submit = document.createElement("button");
  submit.className = "secondary compact";
  submit.type = "submit";
  submit.textContent = "Add";

  row.append(searchInput, submit);
  label.append(row);

  const list = document.createElement("ul");
  list.className = "deck-autocomplete-list deck-autocomplete-grid";
  list.id = "deck-autocomplete-list";
  list.dataset.deckAutocompleteList = "true";
  list.setAttribute("role", "listbox");
  list.hidden = state.deckAutocomplete.results.length === 0;

  const status = document.createElement("p");
  status.className = "hint deck-autocomplete-status";
  status.id = "deck-autocomplete-status";
  status.dataset.deckAutocompleteStatus = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = state.deckAutocomplete.loading
    ? "Searching cards…"
    : state.deckAutocomplete.results.length
      ? `${state.deckAutocomplete.results.length} match${state.deckAutocomplete.results.length === 1 ? "" : "es"}. Tap a card image to add.`
      : "Type a card name to autocomplete.";

  form.append(label, list, status);
  return form;
}

function createDeckGridCard(card, { individual = false } = {}) {
  const item = document.createElement("article");
  item.className = individual ? "deck-grid-card deck-grid-card-individual" : "deck-grid-card";
  item.title = `${card.name} — tap art for details`;

  const imageButton = document.createElement("button");
  imageButton.type = "button";
  imageButton.className = "deck-grid-card-image";
  imageButton.dataset.deckLightbox = card.key;
  imageButton.setAttribute("aria-label", `View ${card.name} details`);
  const imageUrl = getImageUrl(resolveCardImage(card));
  if (imageUrl) {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = card.name;
    image.onerror = () => {
      image.remove();
      imageButton.textContent = card.name.slice(0, 2).toUpperCase();
    };
    imageButton.append(image);
  } else {
    imageButton.textContent = card.name.slice(0, 2).toUpperCase();
  }

  const remove = document.createElement("button");
  remove.className = "deck-grid-remove";
  remove.type = "button";

  if (individual) {
    remove.dataset.removeOneDeck = card.key;
    remove.setAttribute("aria-label", `Remove one ${card.name}`);
    remove.textContent = "×";
    item.append(imageButton, remove);
    return item;
  }

  const maxQuantity = getMaxQuantityForCard(card);
  const quantity = document.createElement("select");
  quantity.className = "deck-grid-qty";
  quantity.dataset.deckQuantity = card.key;
  quantity.setAttribute("aria-label", `Quantity for ${card.name}`);
  for (let amount = 1; amount <= maxQuantity; amount += 1) {
    quantity.append(createOption(String(amount), String(amount)));
  }
  quantity.value = String(Math.min(maxQuantity, normalizeQuantity(card.quantity)));

  remove.dataset.removeDeck = card.key;
  remove.setAttribute("aria-label", `Remove ${card.name}`);
  remove.textContent = "×";

  item.append(imageButton, quantity, remove);
  return item;
}

function createMainDeckFreehandBoard(sectionCards) {
  const board = document.createElement("div");
  board.className = "deck-freehand-board";
  board.dataset.mainFreehandBoard = "true";

  const hint = document.createElement("p");
  hint.className = "hint deck-freehand-hint";
  hint.textContent =
    "Drag cards onto the grid to stack or arrange. Double-click a card to open the lightbox. Positions are kept when you leave Freehand mode.";
  board.append(hint);

  const instances = [];
  sectionCards.forEach((card) => {
    const copies = normalizeQuantity(card.quantity);
    for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
      instances.push({
        card,
        instanceId: getFreehandInstanceId(card.key, copyIndex),
        copyIndex,
      });
    }
  });

  pruneFreehandPositions(sectionCards);

  instances.forEach((instance, layoutIndex) => {
    board.append(createFreehandDeckCard(instance.card, instance.instanceId, layoutIndex));
  });

  // Lay out after the board is in the DOM so width/height are measurable.
  window.requestAnimationFrame(() => {
    // Toggle clears positions; otherwise keep user stacks and only place new copies.
    layoutFreehandBoard(board, { force: false });
  });

  return board;
}

function createFreehandDeckCard(card, instanceId, layoutIndex) {
  const item = document.createElement("article");
  item.className = "deck-grid-card deck-freehand-card";
  item.dataset.freehandCard = instanceId;
  item.dataset.freehandIndex = String(layoutIndex);
  item.title = `${card.name} — double-click for details, drag to move`;

  // Provisional grid slot so cards are never stacked at 0,0 before measured layout.
  const provisional = estimateFreehandSlot(layoutIndex);
  item.style.left = `${provisional.x}px`;
  item.style.top = `${provisional.y}px`;
  item.style.zIndex = String(provisional.z);
  item.style.width = `${FREEHAND_CARD_WIDTH}px`;
  item.style.height = `${FREEHAND_CARD_HEIGHT}px`;

  const imageWrap = document.createElement("div");
  imageWrap.className = "deck-grid-card-image";
  const imageUrl = getImageUrl(resolveCardImage(card));
  if (imageUrl) {
    const image = document.createElement("img");
    image.draggable = false;
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = card.name;
    image.onerror = () => {
      image.remove();
      imageWrap.textContent = card.name.slice(0, 2).toUpperCase();
    };
    imageWrap.append(image);
  } else {
    imageWrap.textContent = card.name.slice(0, 2).toUpperCase();
  }

  const remove = document.createElement("button");
  remove.className = "deck-grid-remove";
  remove.type = "button";
  remove.dataset.removeOneDeck = card.key;
  remove.setAttribute("aria-label", `Remove one ${card.name}`);
  remove.textContent = "×";

  item.append(imageWrap, remove);
  enableFreehandDrag(item, instanceId, card);
  return item;
}

function estimateFreehandSlot(index, cols = 5) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return snapFreehandPosition({
    x: FREEHAND_PADDING + col * (FREEHAND_CARD_WIDTH + FREEHAND_GAP_X),
    y: FREEHAND_HINT_SPACE + FREEHAND_PADDING + row * (FREEHAND_CARD_HEIGHT + FREEHAND_GAP_Y),
    z: index + 1,
  });
}

function snapFreehandCoord(value) {
  return Math.round(value / FREEHAND_SNAP) * FREEHAND_SNAP;
}

function snapFreehandPosition({ x, y, z }) {
  return {
    x: snapFreehandCoord(x),
    y: snapFreehandCoord(y),
    z,
  };
}

function layoutFreehandBoard(board, { force = false } = {}) {
  if (!board) {
    return;
  }

  const cards = [...board.querySelectorAll("[data-freehand-card]")];
  if (cards.length === 0) {
    board.style.minHeight = "280px";
    return;
  }

  const boardWidth = Math.max(board.clientWidth || board.parentElement?.clientWidth || 640, 240);
  const cols = Math.max(
    1,
    Math.floor((boardWidth - FREEHAND_PADDING * 2 + FREEHAND_GAP_X) / (FREEHAND_CARD_WIDTH + FREEHAND_GAP_X)),
  );
  const rows = Math.ceil(cards.length / cols);
  const contentHeight =
    FREEHAND_HINT_SPACE +
    FREEHAND_PADDING +
    rows * FREEHAND_CARD_HEIGHT +
    Math.max(0, rows - 1) * FREEHAND_GAP_Y +
    FREEHAND_PADDING;
  board.style.minHeight = `${Math.max(320, contentHeight)}px`;

  const occupied = new Set();
  if (!force) {
    cards.forEach((cardEl) => {
      const saved = state.mainDeckFreehandPositions[cardEl.dataset.freehandCard];
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        occupied.add(`${Math.round(saved.x)}:${Math.round(saved.y)}`);
      }
    });
  }

  let nextSlot = 0;
  cards.forEach((cardEl, index) => {
    const instanceId = cardEl.dataset.freehandCard;
    const saved = state.mainDeckFreehandPositions[instanceId];
    let x;
    let y;
    let z;

    if (!force && saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      x = saved.x;
      y = saved.y;
      z = Number.isFinite(saved.z) ? saved.z : index + 1;
    } else {
      let col;
      let row;
      let slotKey;
      do {
        col = nextSlot % cols;
        row = Math.floor(nextSlot / cols);
        x = FREEHAND_PADDING + col * (FREEHAND_CARD_WIDTH + FREEHAND_GAP_X);
        y = FREEHAND_HINT_SPACE + FREEHAND_PADDING + row * (FREEHAND_CARD_HEIGHT + FREEHAND_GAP_Y);
        const snappedSlot = snapFreehandPosition({ x, y, z: 0 });
        x = snappedSlot.x;
        y = snappedSlot.y;
        slotKey = `${Math.round(x)}:${Math.round(y)}`;
        nextSlot += 1;
      } while (occupied.has(slotKey));
      occupied.add(slotKey);
      z = index + 1;
    }

    const maxX = Math.max(0, boardWidth - FREEHAND_CARD_WIDTH - 4);
    const snapped = snapFreehandPosition({ x, y, z });
    x = Math.min(maxX, Math.max(0, snapped.x));
    y = Math.max(0, snapped.y);
    z = snapped.z;

    cardEl.style.left = `${x}px`;
    cardEl.style.top = `${y}px`;
    cardEl.style.zIndex = String(z);
    state.mainDeckFreehandPositions[instanceId] = { x, y, z };
    state.mainDeckFreehandZ = Math.max(state.mainDeckFreehandZ, z + 1);
  });

  // Grow board to fit the lowest card after custom placements.
  let lowest = contentHeight;
  cards.forEach((cardEl) => {
    const top = Number.parseFloat(cardEl.style.top) || 0;
    lowest = Math.max(lowest, top + FREEHAND_CARD_HEIGHT + FREEHAND_PADDING);
  });
  board.style.minHeight = `${Math.max(320, lowest)}px`;

  saveMainDeckFreehandState();
}

function enableFreehandDrag(cardEl, instanceId, card = null) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originPointerX = 0;
  let originPointerY = 0;
  let dragMoved = false;
  let lastTapAt = 0;
  let tapCount = 0;

  const openFreehandLightbox = () => {
    if (!card || lightbox?.open) {
      return;
    }
    tapCount = 0;
    lastTapAt = 0;
    void openDeckCardLightbox(card);
  };

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    const board = cardEl.closest("[data-main-freehand-board]");
    if (!board) {
      return;
    }

    const dx = event.clientX - originPointerX;
    const dy = event.clientY - originPointerY;
    if (Math.hypot(dx, dy) > 8) {
      dragMoved = true;
    }
    let nextX = startX + dx;
    let nextY = startY + dy;

    const boardWidth = board.clientWidth;
    let boardHeight = board.clientHeight;
    const maxX = Math.max(0, boardWidth - FREEHAND_CARD_WIDTH);
    nextX = Math.min(maxX, Math.max(0, nextX));
    nextY = Math.max(0, nextY);

    // Grow the board when dragging downward so cards are never clipped away.
    const neededHeight = nextY + FREEHAND_CARD_HEIGHT + FREEHAND_PADDING;
    if (neededHeight > boardHeight) {
      board.style.minHeight = `${neededHeight}px`;
      boardHeight = neededHeight;
    }
    const maxY = Math.max(0, boardHeight - FREEHAND_CARD_HEIGHT);
    nextY = Math.min(maxY, nextY);

    const snapped = snapFreehandPosition({ x: nextX, y: nextY, z: 0 });
    nextX = Math.min(maxX, Math.max(0, snapped.x));
    nextY = Math.min(maxY, Math.max(0, snapped.y));

    cardEl.style.left = `${nextX}px`;
    cardEl.style.top = `${nextY}px`;
  };

  const onPointerUp = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = null;
    cardEl.classList.remove("dragging");
    try {
      cardEl.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if capture was already released.
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    const board = cardEl.closest("[data-main-freehand-board]");
    const boardWidth = board?.clientWidth || 0;
    const boardHeight = board?.clientHeight || 0;
    const maxX = Math.max(0, boardWidth - FREEHAND_CARD_WIDTH);
    const maxY = Math.max(0, boardHeight - FREEHAND_CARD_HEIGHT);
    const snapped = snapFreehandPosition({
      x: Number.parseFloat(cardEl.style.left) || 0,
      y: Number.parseFloat(cardEl.style.top) || 0,
      z: Number.parseInt(cardEl.style.zIndex, 10) || state.mainDeckFreehandZ,
    });
    const x = Math.min(maxX, Math.max(0, snapped.x));
    const y = Math.min(maxY, Math.max(0, snapped.y));
    const z = snapped.z;
    cardEl.style.left = `${x}px`;
    cardEl.style.top = `${y}px`;
    state.mainDeckFreehandPositions[instanceId] = { x, y, z };
    saveMainDeckFreehandState();

    // Double-click / double-tap (no drag) opens the deck-builder lightbox.
    if (!dragMoved && card) {
      const now = Date.now();
      if (now - lastTapAt > FREEHAND_DOUBLE_CLICK_MS) {
        tapCount = 0;
      }
      tapCount += 1;
      lastTapAt = now;
      if (tapCount >= 2) {
        openFreehandLightbox();
      }
    } else {
      tapCount = 0;
      lastTapAt = 0;
    }
  };

  cardEl.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) {
      return;
    }
    if (event.target.closest(".deck-grid-remove")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    pointerId = event.pointerId;
    dragMoved = false;
    startX = Number.parseFloat(cardEl.style.left) || 0;
    startY = Number.parseFloat(cardEl.style.top) || 0;
    originPointerX = event.clientX;
    originPointerY = event.clientY;

    state.mainDeckFreehandZ += 1;
    cardEl.style.zIndex = String(state.mainDeckFreehandZ);
    cardEl.classList.add("dragging");

    try {
      cardEl.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers may reject capture; window listeners still handle move/up.
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  });

  cardEl.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openFreehandLightbox();
  });
}

function getFreehandInstanceId(cardKey, copyIndex) {
  return `${cardKey}::${copyIndex}`;
}

function pruneFreehandPositions(sectionCards) {
  const validIds = new Set();
  sectionCards.forEach((card) => {
    const copies = normalizeQuantity(card.quantity);
    for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
      validIds.add(getFreehandInstanceId(card.key, copyIndex));
    }
  });

  let changed = false;
  Object.keys(state.mainDeckFreehandPositions).forEach((instanceId) => {
    if (!validIds.has(instanceId)) {
      delete state.mainDeckFreehandPositions[instanceId];
      changed = true;
    }
  });
  if (changed) {
    saveMainDeckFreehandState();
  }
}

function loadMainDeckFreehandState() {
  const stored = loadStoredJson(FREEHAND_STORAGE_KEY, null);
  if (!stored || typeof stored !== "object") {
    return { enabled: false, positions: {}, nextZ: 1 };
  }
  return {
    enabled: Boolean(stored.enabled),
    positions: stored.positions && typeof stored.positions === "object" ? stored.positions : {},
    nextZ: Number.isFinite(stored.nextZ) ? stored.nextZ : 1,
  };
}

function saveMainDeckFreehandState() {
  saveStoredJson(FREEHAND_STORAGE_KEY, {
    enabled: state.mainDeckFreehand,
    positions: state.mainDeckFreehandPositions,
    nextZ: state.mainDeckFreehandZ,
  });
}

function toggleMainDeckFreehand() {
  state.mainDeckFreehand = !state.mainDeckFreehand;
  if (state.mainDeckFreehand) {
    state.mainDeckOpeningHand = false;
  }
  saveMainDeckFreehandState();
  renderDeck();
}

function resetMainDeckFreehandPositions() {
  state.mainDeckFreehandPositions = {};
  state.mainDeckFreehandZ = 1;
  saveMainDeckFreehandState();
  const boards = document.querySelectorAll("[data-main-freehand-board]");
  if (boards.length === 0) {
    renderDeck();
    return;
  }
  boards.forEach((board) => layoutFreehandBoard(board, { force: true }));
}

function expandDeckSectionCopies(sectionCards, idPrefix = "oh") {
  const copies = [];
  sectionCards.forEach((card) => {
    const quantity = normalizeQuantity(card.quantity);
    for (let copyIndex = 0; copyIndex < quantity; copyIndex += 1) {
      copies.push({
        card,
        instanceId: `${card.key}::${idPrefix}::${copyIndex}`,
      });
    }
  });
  return copies;
}

function expandMainDeckCopies(sectionCards) {
  return expandDeckSectionCopies(sectionCards, "oh");
}

function expandMaterialDeckCopies(sectionCards) {
  return expandDeckSectionCopies(sectionCards, "oh-mat");
}

function getMaterialDeckCopies() {
  const cards = state.deck.filter(
    (card) => normalizeDeckSection(card.section) === "material",
  );
  return expandMaterialDeckCopies(cards);
}

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function openTryItPage() {
  window.location.assign(TRYIT_PAGE_URL);
}

function writeDeckForTryIt(cards, deckName = "Studio brew") {
  state.deck = normalizeStoredDeck(Array.isArray(cards) ? cards : []);
  state.deckName = String(deckName || "Studio brew").trim() || "Studio brew";
  saveDeck();
  saveStoredJson(DECK_NAME_STORAGE_KEY, state.deckName);
  openTryItPage();
}

function isMultiplayerPlayer() {
  return state.mp.mode === "multi" && (state.mp.role === "a" || state.mp.role === "b");
}

function getLocalMultiplayerSeat() {
  return state.mp.role === "b" ? "b" : "a";
}

function getOpponentMultiplayerSeat() {
  return getLocalMultiplayerSeat() === "a" ? "b" : "a";
}

function syncTryItChromeMode() {
  const page = document.querySelector(".tryit-page");
  page?.classList.toggle("is-mp-dual", isMultiplayerPlayer());
}

function cloneMpJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function serializeMpCard(card) {
  if (!card || typeof card !== "object") {
    return { key: "", name: "Card", image: "", types: [], subtypes: [] };
  }
  return {
    key: card.key || card.uuid || card.slug || "",
    name: card.name || "Card",
    image: resolveCardImage(card) || "",
    types: Array.isArray(card.types) ? card.types.map((type) => String(type).toUpperCase()) : [],
    subtypes: Array.isArray(card.subtypes)
      ? card.subtypes.map((type) => String(type).toUpperCase())
      : [],
  };
}

function serializeMpPileEntry(entry) {
  return {
    instanceId: entry.instanceId,
    card: serializeMpCard(entry.card),
  };
}

function serializeMpBoardEntry(entry) {
  return {
    instanceId: entry.instanceId,
    zone: entry.zone || "hand",
    facedown: Boolean(entry.facedown),
    rotated: Boolean(entry.rotated),
    buff: normalizeOpeningHandBuff(entry.buff),
    ephemeral: Boolean(entry.ephemeral),
    extraKind: entry.extraKind || "",
    position: entry.position
      ? {
          x: Number(entry.position.x) || 0,
          y: Number(entry.position.y) || 0,
          z: Number(entry.position.z) || 1,
        }
      : { x: 0, y: 0, z: 1 },
    card: serializeMpCard(entry.card),
  };
}

function captureLocalSeatSnapshot() {
  const board = getActiveOpeningHandBoard();
  const field = board?.querySelector("[data-oh-field]");
  return {
    seat: getLocalMultiplayerSeat(),
    revision: state.mp.seatRevision,
    deckName: state.deckName || "Untitled Deck",
    boardWidth: field?.clientWidth || 0,
    library: state.openingHandLibrary.map(serializeMpPileEntry),
    material: state.openingHandMaterial.map(serializeMpPileEntry),
    cards: state.openingHandHand.map(serializeMpBoardEntry),
    turn: state.openingHandTurn,
    damage: Math.max(0, Number(state.openingHandDamage) || 0),
    dealComplete: state.openingHandDealComplete,
  };
}

function applySeatSnapshotToLocal(seatData) {
  if (!seatData) {
    return;
  }
  state.openingHandLibrary = cloneMpJson(seatData.library || []);
  state.openingHandMaterial = cloneMpJson(seatData.material || []);
  state.openingHandHand = cloneMpJson(seatData.cards || []);
  state.openingHandTurn = Math.max(1, Number(seatData.turn) || 1);
  state.openingHandDamage = Math.max(0, Number(seatData.damage) || 0);
  state.openingHandDealComplete = Boolean(seatData.dealComplete);
  state.mainDeckOpeningHand = true;
}

function withSeatBoardState(seatData, fn) {
  const snapshot = {
    library: state.openingHandLibrary,
    material: state.openingHandMaterial,
    hand: state.openingHandHand,
    turn: state.openingHandTurn,
    damage: state.openingHandDamage,
    dealComplete: state.openingHandDealComplete,
    mainDeckOpeningHand: state.mainDeckOpeningHand,
  };
  applySeatSnapshotToLocal(seatData);
  try {
    return fn();
  } finally {
    state.openingHandLibrary = snapshot.library;
    state.openingHandMaterial = snapshot.material;
    state.openingHandHand = snapshot.hand;
    state.openingHandTurn = snapshot.turn;
    state.openingHandDamage = snapshot.damage;
    state.openingHandDealComplete = snapshot.dealComplete;
    state.mainDeckOpeningHand = snapshot.mainDeckOpeningHand;
  }
}

function queueMultiplayerSeatPublish({ immediate = false } = {}) {
  if (!isMultiplayerPlayer() || state.mp.applyingRemote || !state.mp.connection) {
    return;
  }
  if (state.mp.publishTimer != null) {
    window.clearTimeout(state.mp.publishTimer);
    state.mp.publishTimer = null;
  }
  const publish = () => {
    state.mp.publishTimer = null;
    state.mp.seatRevision += 1;
    const payload = captureLocalSeatSnapshot();
    state.mp.seats[payload.seat] = payload;
    void state.mp.connection.sendSeat(payload);
    void state.mp.connection.sendMeta({
      turn: state.openingHandTurn,
      fromSeat: payload.seat,
    });
  };
  if (immediate) {
    publish();
    return;
  }
  state.mp.publishTimer = window.setTimeout(publish, 80);
}

function updateMultiplayerChrome() {
  syncTryItChromeMode();
  const statusEl = document.querySelector("#mp-room-status");
  const nameEl = document.querySelector(".tryit-deck-name");

  if (nameEl) {
    if (isMultiplayerPlayer()) {
      nameEl.innerHTML = `Player ${escapeHtml(String(state.mp.role).toUpperCase())} · Deck: <strong>${escapeHtml(state.deckName || "Untitled Deck")}</strong>`;
    } else {
      nameEl.innerHTML = `Deck: <strong>${escapeHtml(state.deckName || "Untitled Deck")}</strong>`;
    }
  }

  if (statusEl) {
    if (state.mp.mode === "multi" && isMultiplayerPlayer()) {
      statusEl.hidden = false;
      const opp = getOpponentMultiplayerSeat().toUpperCase();
      const peerBit = state.mp.peerCount > 0 ? "connected" : "waiting";
      statusEl.textContent = `Room ${state.mp.roomCode} · vs ${opp} · ${peerBit}${state.mp.status ? ` · ${state.mp.status}` : ""}`;
    } else {
      statusEl.hidden = true;
      statusEl.textContent = "";
    }
  }

  document.querySelectorAll("[data-oh-board-menu]").forEach((menu) => {
    const dual = isMultiplayerPlayer();
    const backLink = menu.querySelector(".tryit-back-link");
    if (backLink) {
      backLink.hidden = dual;
    }
  });
}

function renderMultiplayerLobby() {
  const root = document.querySelector("#tryit-root");
  if (!root) {
    return;
  }
  root.replaceChildren();

  const lobby = document.createElement("div");
  lobby.className = "mp-lobby";
  lobby.innerHTML = `
    <div class="mp-lobby-block">
      <h2>Solo</h2>
      <p class="hint">Play on this device only.</p>
      <button class="try-it-button compact" type="button" data-mp-solo="true">Start solo playtest</button>
    </div>
    <div class="mp-lobby-block">
      <h2>Two-phone multiplayer</h2>
      <p class="hint">Connect two phones directly. Each phone shows your board at the bottom and the opponent (rotated) at the top.</p>
      <div class="mp-lobby-actions">
        <button class="try-it-button compact" type="button" data-mp-create-room="true">Create room (Player A)</button>
      </div>
      <form class="mp-join-form" data-mp-join-form="true">
        <label>
          Room code
          <input class="mp-room-input" name="room" maxlength="6" autocomplete="off" spellcheck="false" placeholder="e.g. 7K3M" />
        </label>
        <div class="mp-lobby-actions">
          <button class="secondary compact" type="submit" data-mp-join-role="a">Join as Player A</button>
          <button class="secondary compact" type="submit" data-mp-join-role="b">Join as Player B</button>
        </div>
      </form>
      <p class="hint">Share the room code with the other phone, then both join. Portrait works best.</p>
    </div>
  `;
  lobby.querySelector("[data-mp-join-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  root.append(lobby);
}

function renderMultiplayerDualPlay() {
  const root = document.querySelector("#tryit-root");
  if (!root || !isMultiplayerPlayer()) {
    return;
  }

  const selfSeat = getLocalMultiplayerSeat();
  const oppSeat = getOpponentMultiplayerSeat();
  root.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "mp-dual-play";
  wrap.dataset.mpDual = "true";

  const oppSection = document.createElement("section");
  oppSection.className = `mp-dual-seat mp-dual-opponent mp-seat-${oppSeat}`;

  const oppLabel = document.createElement("p");
  oppLabel.className = "mp-dual-seat-label";
  oppLabel.dataset.mpOpponentLabel = "true";
  oppLabel.textContent = `Player ${oppSeat.toUpperCase()}`;

  const oppMount = document.createElement("div");
  oppMount.className = "mp-dual-seat-scale";
  oppMount.dataset.mpOpponentMount = "true";
  oppSection.append(oppLabel, oppMount);

  const divider = document.createElement("div");
  divider.className = "mp-dual-divider";
  divider.innerHTML = "<span>vs</span>";

  const selfSection = document.createElement("section");
  selfSection.className = `mp-dual-seat mp-dual-self mp-seat-${selfSeat}`;

  const selfLabel = document.createElement("p");
  selfLabel.className = "mp-dual-seat-label";
  selfLabel.textContent = `You · Player ${selfSeat.toUpperCase()}`;

  const selfMount = document.createElement("div");
  selfMount.className = "mp-dual-seat-scale";
  selfMount.dataset.mpSelfMount = "true";
  selfSection.append(selfLabel, selfMount);

  wrap.append(oppSection, divider, selfSection);
  root.append(wrap);

  const sectionCards = state.deck.filter(
    (card) => normalizeDeckSection(card.section) === "main",
  );
  selfMount.append(
    createOpeningHandBoard(sectionCards, {
      seat: selfSeat,
      skipLibraryInit: true,
    }),
  );

  updateMultiplayerOpponentBoard(wrap);
  scheduleMultiplayerDualLayout(wrap);
}

function updateMultiplayerOpponentBoard(wrap = document.querySelector("[data-mp-dual]")) {
  if (!wrap) {
    return;
  }
  const oppSeat = getOpponentMultiplayerSeat();
  const mount = wrap.querySelector("[data-mp-opponent-mount]");
  const label = wrap.querySelector("[data-mp-opponent-label]");
  const seatData = state.mp.seats[oppSeat];
  if (!mount) {
    return;
  }
  if (label) {
    const deckName = seatData?.deckName ? ` · ${seatData.deckName}` : "";
    label.textContent = `Player ${oppSeat.toUpperCase()}${deckName}`;
  }

  const existing = mount.querySelector("[data-opening-hand-board]");
  const existingRevision = existing?.dataset.mpSeatRevision || "";
  const nextRevision = seatData ? String(seatData.revision ?? "") : "";
  if (existing && existingRevision === nextRevision && Boolean(seatData) === true) {
    return;
  }

  mount.replaceChildren();
  if (!seatData) {
    const waiting = document.createElement("div");
    waiting.className = "mp-seat-waiting mp-dual-waiting";
    waiting.textContent = `Waiting for Player ${oppSeat.toUpperCase()}…`;
    mount.append(waiting);
    return;
  }

  const board = withSeatBoardState(seatData, () =>
    createOpeningHandBoard([], {
      readonly: true,
      handFacedown: true,
      seat: oppSeat,
      skipDeal: true,
      skipLibraryInit: true,
    }),
  );
  board.dataset.mpSeatRevision = nextRevision;
  mount.append(board);
}

function getDualSeatAvailableSize(seat) {
  const label = seat.querySelector(".mp-dual-seat-label");
  return {
    availW: Math.max(1, seat.clientWidth - 2),
    availH: Math.max(1, seat.clientHeight - (label?.offsetHeight || 0) - 4),
  };
}

function sizeDualBoardsForSeatWidth(wrap) {
  if (!wrap) {
    return;
  }
  let minAvailW = Number.POSITIVE_INFINITY;
  let minAvailH = Number.POSITIVE_INFINITY;
  wrap.querySelectorAll(".mp-dual-seat").forEach((seat) => {
    const { availW, availH } = getDualSeatAvailableSize(seat);
    minAvailW = Math.min(minAvailW, availW);
    minAvailH = Math.min(minAvailH, availH);
  });
  if (!Number.isFinite(minAvailW) || !Number.isFinite(minAvailH)) {
    return;
  }

  // Choose a layout width so height-fit zoom also spans the full seat width.
  const scale = Math.max(0.32, Math.min(minAvailH / OPENING_HAND_BOARD_HEIGHT, 1.25));
  const targetW = Math.max(480, Math.round(minAvailW / scale));

  wrap.querySelectorAll(".mp-dual-seat").forEach((seat) => {
    const scaleHost = seat.querySelector(".mp-dual-seat-scale");
    if (!scaleHost) {
      return;
    }
    scaleHost.style.zoom = "1";
    scaleHost.style.transform = "";
    const board = scaleHost.querySelector("[data-opening-hand-board]");
    if (board) {
      board.style.width = `${targetW}px`;
    }
  });
}

function fitMultiplayerDualSeatScales(wrap) {
  if (!wrap) {
    return;
  }
  const seats = [...wrap.querySelectorAll(".mp-dual-seat")];
  if (seats.length === 0) {
    return;
  }

  let minAvailW = Number.POSITIVE_INFINITY;
  let minAvailH = Number.POSITIVE_INFINITY;
  seats.forEach((seat) => {
    const { availW, availH } = getDualSeatAvailableSize(seat);
    minAvailW = Math.min(minAvailW, availW);
    minAvailH = Math.min(minAvailH, availH);
  });

  // Height drives zoom; board width was already chosen so width fills at this scale.
  const scale = Math.max(0.32, Math.min(minAvailH / OPENING_HAND_BOARD_HEIGHT, 1.25));

  seats.forEach((seat) => {
    const scaleHost = seat.querySelector(".mp-dual-seat-scale");
    if (!scaleHost) {
      return;
    }
    if (typeof CSS !== "undefined" && CSS.supports?.("zoom", "1")) {
      scaleHost.style.zoom = String(scale);
      scaleHost.style.transform = "";
    } else {
      scaleHost.style.zoom = "";
      scaleHost.style.transform = `scale(${scale})`;
      scaleHost.style.transformOrigin = "center center";
    }
    scaleHost.dataset.mpFitScale = String(scale);
  });
}

function scheduleMultiplayerDualLayout(wrap) {
  if (!wrap) {
    return;
  }
  const run = () => {
    sizeDualBoardsForSeatWidth(wrap);

    const selfBoard = wrap.querySelector(
      "[data-mp-self-mount] [data-opening-hand-board]",
    );
    if (selfBoard?.isConnected) {
      const selfScale = selfBoard.closest(".mp-dual-seat-scale");
      if (selfScale) {
        selfScale.style.zoom = "1";
        selfScale.style.transform = "";
      }
      relayoutOpeningHandBoard(selfBoard, { handFacedown: false, minWidth: 160 });
    }

    const oppBoard = wrap.querySelector(
      "[data-mp-opponent-mount] [data-opening-hand-board][data-mp-seat]",
    );
    if (oppBoard?.isConnected) {
      const oppScale = oppBoard.closest(".mp-dual-seat-scale");
      if (oppScale) {
        oppScale.style.zoom = "1";
        oppScale.style.transform = "";
      }
      const seat = oppBoard.dataset.mpSeat;
      const seatData = state.mp.seats[seat];
      const field = oppBoard.querySelector("[data-oh-field]");
      if (seatData && field && field.clientWidth >= 160) {
        withSeatBoardState(seatData, () => {
          layoutMultiplayerTableSeat(oppBoard);
        });
      }
    }

    fitMultiplayerDualSeatScales(wrap);
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(run);
  });
  window.setTimeout(run, 50);
  window.setTimeout(run, 200);

  if (typeof ResizeObserver === "function") {
    wrap._mpDualResizeObserver?.disconnect?.();
    const observer = new ResizeObserver(() => {
      window.clearTimeout(wrap._mpLayoutTimer);
      wrap._mpLayoutTimer = window.setTimeout(run, 40);
    });
    observer.observe(wrap);
    wrap.querySelectorAll(".mp-dual-seat").forEach((seat) => observer.observe(seat));
    wrap._mpDualResizeObserver = observer;
  }
}

function getMeasuredZoneBox(field, zoneName) {
  layoutOpeningHandZones(field);
  const measured = readOpeningHandZoneBox(field, zoneName);
  if (measured && measured.width > 8 && measured.height > 8) {
    return measured;
  }
  const zones = getOpeningHandZones(field);
  if (zoneName === "field") {
    return {
      left: zones.memoryLeft,
      right: zones.mainRight,
      top: zones.fieldTop,
      bottom: zones.fieldBottom,
      width: Math.max(0, zones.mainRight - zones.memoryLeft),
      height: Math.max(0, zones.fieldBottom - zones.fieldTop),
    };
  }
  if (zoneName === "champion") {
    return {
      left: zones.leftRailLeft,
      right: zones.leftRailLeft + zones.leftRailWidth,
      top: zones.championTop ?? zones.fieldTop,
      bottom: zones.championBottom ?? zones.fieldBottom,
      width: zones.leftRailWidth,
      height: Math.max(
        0,
        (zones.championBottom ?? zones.fieldBottom) - (zones.championTop ?? zones.fieldTop),
      ),
    };
  }
  if (zoneName === "memory") {
    return {
      left: zones.memoryLeft,
      right: zones.mainRight,
      top: zones.memoryTop,
      bottom: zones.memoryBottom,
      width: Math.max(0, zones.mainRight - zones.memoryLeft),
      height: Math.max(0, zones.memoryBottom - zones.memoryTop),
    };
  }
  if (zoneName === "hand") {
    return {
      left: zones.mainLeft,
      right: zones.mainRight,
      top: zones.handTop,
      bottom: zones.handBottom,
      width: Math.max(0, zones.mainRight - zones.mainLeft),
      height: Math.max(0, zones.handBottom - zones.handTop),
    };
  }
  if (zoneName === "banishment") {
    return {
      left: zones.railLeft,
      right: zones.railLeft + zones.railWidth,
      top: zones.banishmentTop,
      bottom: zones.banishmentBottom,
      width: zones.railWidth,
      height: Math.max(0, zones.banishmentBottom - zones.banishmentTop),
    };
  }
  if (zoneName === "graveyard") {
    return {
      left: zones.railLeft,
      right: zones.railLeft + zones.railWidth,
      top: zones.graveyardTop,
      bottom: zones.graveyardBottom,
      width: zones.railWidth,
      height: Math.max(0, zones.graveyardBottom - zones.graveyardTop),
    };
  }
  if (zoneName === "deck") {
    return {
      left: zones.railLeft,
      right: zones.railLeft + zones.railWidth,
      top: zones.deckTop,
      bottom: zones.deckBottom,
      width: zones.railWidth,
      height: Math.max(0, zones.deckBottom - zones.deckTop),
    };
  }
  if (zoneName === "material") {
    return {
      left: zones.leftRailLeft,
      right: zones.leftRailLeft + zones.leftRailWidth,
      top: zones.materialTop,
      bottom: zones.materialBottom,
      width: zones.leftRailWidth,
      height: Math.max(0, zones.materialBottom - zones.materialTop),
    };
  }
  return null;
}

function layoutCardsInMeasuredZone(field, zoneName, entries, { handFacedown = false } = {}) {
  const box = getMeasuredZoneBox(field, zoneName);
  if (!box || entries.length === 0) {
    return;
  }

  const pad = 6;
  const maxX = Math.max(box.left + pad, box.right - pad - FREEHAND_CARD_WIDTH);
  const minX = Math.min(box.left + pad, maxX);
  const y = box.top + Math.max(0, (box.height - FREEHAND_CARD_HEIGHT) / 2);
  const usable = Math.max(0, maxX - minX);
  const count = entries.length;
  const stackZones =
    zoneName === "graveyard" || zoneName === "banishment" || zoneName === "champion";

  let startX = minX;
  let step = 0;
  if (count === 1) {
    startX = minX + usable / 2;
    step = 0;
  } else if (stackZones) {
    // Keep stacks inside the narrow rail.
    const stackSpan = Math.min(usable, (count - 1) * 10);
    startX = minX + Math.max(0, (usable - stackSpan) / 2);
    step = stackSpan / (count - 1);
  } else {
    const packed = count * FREEHAND_CARD_WIDTH;
    if (packed <= usable + FREEHAND_CARD_WIDTH) {
      const rowWidth = packed - FREEHAND_CARD_WIDTH;
      startX = minX + Math.max(0, (usable - rowWidth) / 2);
      step = FREEHAND_CARD_WIDTH;
    } else {
      startX = minX;
      step = usable / (count - 1);
    }
  }

  const maxY = Math.max(y, box.bottom - FREEHAND_CARD_HEIGHT - 4);
  entries.forEach((entry, index) => {
    const rawX = startX + index * step;
    if (zoneName === "hand" && handFacedown) {
      entry.facedown = true;
      entry.rotated = false;
    }
    const yOffset = zoneName === "champion" ? Math.min(index * 14, Math.max(0, maxY - y)) : 0;
    entry.position = {
      x: Math.min(maxX, Math.max(minX, rawX)),
      y: Math.min(maxY, y + yOffset),
      z: 10 + index,
    };
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (!cardEl) {
      return;
    }
    applyOpeningHandCardPosition(cardEl, entry);
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
    const image = cardEl.querySelector("img");
    if (image) {
      image.loading = "eager";
      const url = getImageUrl(resolveCardImage(entry.card));
      if (url && image.getAttribute("src") !== url) {
        image.src = url;
      }
    }
  });
}

function relayoutOpeningHandBoard(board, { handFacedown = false, minWidth = 200 } = {}) {
  const field = board?.querySelector("[data-oh-field]");
  if (!field || field.clientWidth < minWidth) {
    return;
  }

  layoutOpeningHandZones(field);
  void field.offsetWidth;
  dedupeOpeningHandEntries();

  ["champion", "field", "memory", "hand", "graveyard", "banishment"].forEach((zoneName) => {
    const entries = state.openingHandHand
      .filter((entry) => (entry.zone || "hand") === zoneName)
      .sort((left, right) => (left.position?.x || 0) - (right.position?.x || 0));
    layoutCardsInMeasuredZone(field, zoneName, entries, { handFacedown });
  });

  // Anchor piles from measured zone boxes so counts don't float mid-board.
  const deckPile = board.querySelector("[data-oh-deck-pile]");
  const deckBox = getMeasuredZoneBox(field, "deck");
  if (deckPile && deckBox) {
    deckPile.style.left = `${deckBox.left + Math.max(0, (deckBox.width - FREEHAND_CARD_WIDTH) / 2)}px`;
    deckPile.style.top = `${deckBox.top + Math.max(0, (deckBox.height - FREEHAND_CARD_HEIGHT) / 2)}px`;
  }

  const materialPile = board.querySelector("[data-oh-material-pile]");
  const materialBox = getMeasuredZoneBox(field, "material");
  if (materialPile && materialBox) {
    materialPile.style.left = `${materialBox.left + Math.max(0, (materialBox.width - FREEHAND_CARD_WIDTH) / 2)}px`;
    materialPile.style.top = `${materialBox.top + Math.max(0, (materialBox.height - FREEHAND_CARD_HEIGHT) / 2)}px`;
  }

  const handCount = board.querySelector("[data-oh-hand-count]");
  const handBox = getMeasuredZoneBox(field, "hand");
  if (handCount && handBox) {
    handCount.style.left = `${handBox.left + 10}px`;
    handCount.style.top = `${handBox.bottom - 34}px`;
  }

  updateOpeningHandCounts(board);
  resizeOpeningHandField(board);
}

function layoutMultiplayerTableSeat(board) {
  relayoutOpeningHandBoard(board, {
    handFacedown: board?.dataset?.mpHandFacedown === "true",
    minWidth: 200,
  });
}

async function joinMultiplayerRoom({ roomCode, role }) {
  const code = normalizeRoomCode(roomCode) || createRoomCode();
  const nextRole = role === "b" ? "b" : role === "a" ? "a" : null;
  if (!nextRole) {
    window.alert("Choose Player A or Player B.");
    return;
  }

  const mainCount = state.deck.filter(
    (card) => normalizeDeckSection(card.section) === "main",
  ).length;
  if (mainCount === 0) {
    window.alert("Add cards to your Main Deck before joining multiplayer.");
    return;
  }

  await leaveMultiplayerRoom({ silent: true });

  state.mp.mode = "multi";
  state.mp.role = nextRole;
  state.mp.roomCode = code;
  state.mp.status = "Connecting…";
  state.mp.peerCount = 0;
  state.mp.seats = { a: null, b: null };
  state.mp.claims = { a: null, b: null };
  state.mp.seatRevision = 0;

  try {
    state.mp.connection = connectPlaytestRoom({
      roomCode: code,
      role: nextRole,
      onPresence: ({ peerCount }) => {
        state.mp.peerCount = peerCount;
        updateMultiplayerChrome();
      },
      onPeerJoin: () => {
        if (isMultiplayerPlayer()) {
          queueMultiplayerSeatPublish({ immediate: true });
        }
        if (state.mp.connection) {
          void state.mp.connection.sendHello({
            role: state.mp.role,
            deckName: state.deckName || "Untitled Deck",
            peerId: getSelfPeerId(),
          });
        }
      },
      onPeerLeave: (peerId) => {
        ["a", "b"].forEach((seat) => {
          if (state.mp.claims[seat] === peerId) {
            state.mp.claims[seat] = null;
          }
        });
        const oppSeat = getOpponentMultiplayerSeat();
        if (state.mp.seats[oppSeat]) {
          state.mp.seats[oppSeat] = null;
        }
        state.mp.status = "Opponent left";
        updateMultiplayerChrome();
        updateMultiplayerOpponentBoard();
        scheduleMultiplayerDualLayout(document.querySelector("[data-mp-dual]"));
      },
      onHello: (data, peerId) => {
        const seat = data.role === "b" ? "b" : data.role === "a" ? "a" : null;
        if (!seat) {
          return;
        }
        const existing = state.mp.claims[seat];
        if (existing && existing !== peerId) {
          state.mp.status = `Player ${seat.toUpperCase()} seat contested`;
          updateMultiplayerChrome();
          return;
        }
        state.mp.claims[seat] = peerId;
        if (seat === getOpponentMultiplayerSeat()) {
          state.mp.status = `Player ${seat.toUpperCase()} joined`;
          updateMultiplayerChrome();
        }
      },
      onSeat: (data) => {
        const seat = data.seat === "b" ? "b" : data.seat === "a" ? "a" : null;
        if (!seat) {
          return;
        }
        const current = state.mp.seats[seat];
        if (current && Number(data.revision || 0) < Number(current.revision || 0)) {
          return;
        }
        state.mp.seats[seat] = data;
        if (Number.isFinite(Number(data.turn))) {
          state.openingHandTurn = Math.max(1, Number(data.turn));
          updateTryItTurnLabel();
        }
        // Keep controlling your own seat locally; refresh opponent half only.
        if (state.mp.role === seat) {
          return;
        }
        updateMultiplayerOpponentBoard();
        scheduleMultiplayerDualLayout(document.querySelector("[data-mp-dual]"));
      },
      onMeta: (data) => {
        if (Number.isFinite(Number(data.turn))) {
          state.openingHandTurn = Math.max(1, Number(data.turn));
          updateTryItTurnLabel();
        }
      },
    });
  } catch (error) {
    console.warn("Multiplayer connect failed", error);
    state.mp.mode = "lobby";
    state.mp.role = null;
    state.mp.connection = null;
    window.alert(error?.message || "Could not join multiplayer room.");
    renderTryItPage();
    return;
  }

  void state.mp.connection.sendHello({
    role: nextRole,
    deckName: state.deckName || "Untitled Deck",
    peerId: getSelfPeerId(),
  });

  const url = new URL(window.location.href);
  url.searchParams.set("room", code);
  url.searchParams.set("role", nextRole);
  window.history.replaceState({}, "", url);

  state.mp.mode = "multi";
  startOpeningHandSession();
  state.mp.status = "Connected";
  queueMultiplayerSeatPublish({ immediate: true });
}

async function leaveMultiplayerRoom({ silent = false } = {}) {
  if (state.mp.publishTimer != null) {
    window.clearTimeout(state.mp.publishTimer);
    state.mp.publishTimer = null;
  }
  const connection = state.mp.connection;
  state.mp.connection = null;
  if (connection) {
    try {
      await connection.leave();
    } catch {
      // ignore
    }
  }
  state.mp.mode = silent ? state.mp.mode : "lobby";
  state.mp.role = null;
  state.mp.roomCode = "";
  state.mp.status = "";
  state.mp.peerCount = 0;
  state.mp.seats = { a: null, b: null };
  state.mp.claims = { a: null, b: null };
  if (!silent) {
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    url.searchParams.delete("role");
    window.history.replaceState({}, "", url);
    state.mp.mode = "lobby";
    renderTryItPage();
  }
}

function startOpeningHandSession(sectionCards = null) {
  const cards =
    sectionCards ||
    state.deck.filter((card) => normalizeDeckSection(card.section) === "main");
  const copies = shuffleArray(expandMainDeckCopies(cards));
  state.mainDeckOpeningHand = true;
  state.mainDeckFreehand = false;
  state.openingHandLibrary = copies;
  state.openingHandMaterial = getMaterialDeckCopies();
  state.openingHandHand = [];
  state.openingHandDealToken += 1;
  state.openingHandDealComplete = false;
  state.openingHandAwaitingSpirit = false;
  state.openingHandTurn = 1;
  state.openingHandDamage = 0;
  setOpeningHandVoiceSelection("");
  stopPlaytestVoiceListening({ silent: true });
  if (state.mp.mode === "lobby") {
    state.mp.mode = "solo";
  }
  setTryItMenuOpen(false);
  closeMaterialDialog({ force: true });
  closeOpeningHandCardMenu();
  hideOpeningHandCardPreview();
  saveMainDeckFreehandState();
  if (IS_TRYIT_PAGE) {
    updateTryItTurnLabel();
    renderTryItPage();
    queueMultiplayerSeatPublish({ immediate: true });
  }
}

function exitOpeningHandSession() {
  state.mainDeckOpeningHand = false;
  state.openingHandLibrary = [];
  state.openingHandMaterial = [];
  state.openingHandHand = [];
  state.openingHandDealToken += 1;
  state.openingHandDealComplete = true;
  state.openingHandAwaitingSpirit = false;
  closeMaterialDialog({ force: true });
  closeOpeningHandCardMenu();
  hideOpeningHandCardPreview();
  if (IS_TRYIT_PAGE) {
    window.location.assign(BUILDER_PAGE_URL);
    return;
  }
  renderDeck();
}

function getPlaytestEffectText(card) {
  return (
    [
      card?.effect_raw,
      card?.effect,
      card?.edition?.effect_raw,
      ...(card?.result_editions || []).map((edition) => edition.effect_raw),
      ...(card?.editions || []).map((edition) => edition.effect_raw),
    ]
      .filter(Boolean)
      .find((text) => String(text).trim()) || ""
  );
}

function inspectTryItCard(card) {
  state.tryitInspectedCard = card || null;
  renderTryItInspector();
  if (card?.name && card.name !== "Face-down card" && !getPlaytestEffectText(card)) {
    void enrichTryItInspectedCard(card);
  }
}

async function enrichTryItInspectedCard(card) {
  const name = String(card?.name || "").trim();
  if (!name) {
    return;
  }
  try {
    const lookedUp = await lookupCardByName(name);
    if (!lookedUp || state.tryitInspectedCard?.name !== name) {
      return;
    }
    state.tryitInspectedCard = { ...card, ...lookedUp };
    renderTryItInspector();
  } catch {
    // Keep the name and art even if the API lookup fails.
  }
}

function formatPlaytestStat(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (Number(value) === -1 || String(value).toUpperCase() === "X") {
    return "X";
  }
  return String(value);
}

function getPlaytestCostStat(card) {
  if (card?.cost_memory != null) {
    return { value: formatPlaytestStat(card.cost_memory), label: "Memory" };
  }
  if (card?.cost_reserve != null) {
    return { value: formatPlaytestStat(card.cost_reserve), label: "Cost" };
  }
  const cost = card?.cost;
  if (cost && cost.type && cost.type !== "none" && cost.value != null) {
    const isMemory = String(cost.type).toLowerCase() === "memory";
    return { value: formatPlaytestStat(cost.value), label: isMemory ? "Memory" : "Cost" };
  }
  return { value: "—", label: "Cost" };
}

function createPlaytestStat(label, value) {
  const item = document.createElement("div");
  item.className = "studio-stat";
  const kicker = document.createElement("span");
  kicker.className = "studio-stat-label";
  kicker.textContent = label;
  const number = document.createElement("span");
  number.className = "studio-stat-value";
  number.textContent = value;
  item.append(kicker, number);
  return item;
}

function renderTryItInspector() {
  const inspectorEl = document.querySelector("#tryit-inspector");
  if (!inspectorEl) {
    return;
  }
  inspectorEl.replaceChildren();
  inspectorEl.classList.toggle("is-empty", !state.tryitInspectedCard);

  const card = state.tryitInspectedCard;
  if (!card) {
    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = "Card info";
    inspectorEl.append(heading);
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Click a card to show cost, power, life, and effect.";
    inspectorEl.append(empty);
    return;
  }

  const figure = document.createElement("figure");
  figure.className = "studio-inspector-art";
  const imageUrl = getImageUrl(resolveCardImage(card) || getPrimaryEdition(card)?.image);
  if (imageUrl && card.name !== "Face-down card") {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = card.name;
    figure.append(image);
  } else {
    figure.append(createPlaceholder(card.name || "Card"));
  }

  const name = document.createElement("h2");
  name.className = "studio-inspector-name";
  name.textContent = card.name || "Card";

  const stats = document.createElement("div");
  stats.className = "studio-stats";
  const cost = getPlaytestCostStat(card);
  stats.append(
    createPlaytestStat(cost.label, cost.value),
    createPlaytestStat("Power", formatPlaytestStat(card.power)),
    createPlaytestStat("Life", formatPlaytestStat(card.life)),
  );

  const effect = document.createElement("p");
  effect.className = "studio-inspector-effect";
  const effectText = getPlaytestEffectText(card).replace(/\s+\n/g, "\n").trim();
  effect.textContent = effectText || (card.name === "Face-down card"
    ? "This card is face-down."
    : "No effect text on this printing.");

  const copy = document.createElement("div");
  copy.className = "tryit-inspector-copy";
  copy.append(name, stats, effect);

  const body = document.createElement("div");
  body.className = "tryit-inspector-body";
  body.append(figure, copy);

  inspectorEl.append(body);
}

function renderTryItPage() {
  const root = document.querySelector("#tryit-root");
  if (!root) {
    return;
  }

  updateMultiplayerChrome();
  updateTryItTurnLabel();

  if (state.mp.mode === "lobby") {
    renderMultiplayerLobby();
    return;
  }

  if (isMultiplayerPlayer()) {
    renderMultiplayerDualPlay();
    return;
  }

  const sectionCards = state.deck.filter(
    (card) => normalizeDeckSection(card.section) === "main",
  );
  root.replaceChildren();

  if (sectionCards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "tryit-empty";
    empty.innerHTML = `
      <p class="hint">Your Main Deck is empty. Add cards in the deck builder, then come back to Try it!</p>
      <a class="try-it-button compact" href="${BUILDER_PAGE_URL}">Back to deck builder</a>
    `;
    root.append(empty);
    return;
  }

  root.append(createOpeningHandBoard(sectionCards));
}

function handleTryItActionClick(event) {
  const shareButton = event.target.closest("[data-tryit-share], [data-tryit-menu-share]");
  if (shareButton) {
    event.preventDefault();
    event.stopPropagation();
    void shareTryItDeck();
    return;
  }

  const soloButton = event.target.closest("[data-mp-solo]");
  if (soloButton) {
    startOpeningHandSession();
    return;
  }

  const createRoom = event.target.closest("[data-mp-create-room]");
  if (createRoom) {
    void joinMultiplayerRoom({ roomCode: createRoomCode(), role: "a" });
    return;
  }

  const joinForm = event.target.closest("[data-mp-join-form]");
  const joinRoleButton = event.target.closest("[data-mp-join-role]");
  if (joinForm && joinRoleButton) {
    event.preventDefault();
    const role = joinRoleButton.dataset.mpJoinRole;
    const room = normalizeRoomCode(joinForm.querySelector("[name=room]")?.value);
    if (!room) {
      window.alert("Enter the room code from the other phone.");
      return;
    }
    void joinMultiplayerRoom({ roomCode: room, role });
    return;
  }

  const endTurnButton = event.target.closest("[data-end-turn]");
  if (endTurnButton) {
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    endTryItTurn();
    return;
  }

  const drawButton = event.target.closest("[data-draw-opening-hand]");
  if (drawButton) {
    event.preventDefault();
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    void drawOpeningHandFromRail();
    return;
  }

  const boardMenuToggle = event.target.closest("[data-oh-board-menu-toggle]");
  if (boardMenuToggle) {
    event.preventDefault();
    event.stopPropagation();
    setTryItMenuOpen(false);
    const menu = boardMenuToggle.closest("[data-oh-board-menu]");
    const panel = menu?.querySelector("[data-oh-board-menu-panel]");
    const isOpen =
      panel instanceof HTMLDialogElement ? panel.open : !panel?.hidden;
    setOpeningHandBoardMenuOpen(!isOpen, menu);
    return;
  }

  const voiceToggle = event.target.closest("[data-oh-voice-toggle]");
  if (voiceToggle) {
    event.preventDefault();
    event.stopPropagation();
    setTryItMenuOpen(false);
    togglePlaytestVoiceListening();
    return;
  }

  const helpButton = event.target.closest("[data-tryit-help]");
  if (helpButton) {
    event.preventDefault();
    event.stopPropagation();
    setTryItMenuOpen(false);
    closeOpeningHandBoardMenu();
    openTryItHelpDialog();
    return;
  }

  const menuToggle = event.target.closest("[data-tryit-menu-toggle]");
  if (menuToggle) {
    event.stopPropagation();
    closeOpeningHandBoardMenu();
    setTryItMenuOpen(!state.tryitMenuOpen);
    return;
  }

  const lobbyItem = event.target.closest("[data-tryit-menu-lobby]");
  if (lobbyItem) {
    event.stopPropagation();
    setTryItMenuOpen(false);
    closeOpeningHandBoardMenu();
    void leaveMultiplayerRoom({ silent: true });
    state.mp.mode = "lobby";
    renderTryItPage();
    return;
  }

  const leaveItem = event.target.closest("[data-tryit-menu-leave-room]");
  if (leaveItem) {
    event.stopPropagation();
    setTryItMenuOpen(false);
    closeOpeningHandBoardMenu();
    void leaveMultiplayerRoom();
    return;
  }

  const settingsItem = event.target.closest("[data-tryit-menu-settings]");
  if (settingsItem) {
    event.stopPropagation();
    setTryItMenuOpen(false);
    closeOpeningHandBoardMenu();
    // Placeholder until settings are implemented.
    window.alert("Settings coming soon.");
    return;
  }

  const closeItem = event.target.closest("[data-tryit-menu-close]");
  if (closeItem) {
    event.stopPropagation();
    setTryItMenuOpen(false);
    return;
  }

  const redealButton = event.target.closest("[data-redeal-opening-hand]");
  if (redealButton) {
    closeOpeningHandBoardMenu();
    startOpeningHandSession();
    return;
  }

  const organizeButton = event.target.closest("[data-organize-opening-hand]");
  if (organizeButton) {
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    organizeOpeningHandCards(getActiveOpeningHandBoard());
    queueMultiplayerSeatPublish();
    return;
  }

  const recollectButton = event.target.closest("[data-recollect-opening-hand]");
  if (recollectButton) {
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    recollectOpeningHandMemory(getActiveOpeningHandBoard());
    queueMultiplayerSeatPublish();
    return;
  }

  const extrasButton = event.target.closest("[data-open-extras]");
  if (extrasButton) {
    event.preventDefault();
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    void openExtrasDialog(getActiveOpeningHandBoard());
    return;
  }

  const banishButton = event.target.closest("[data-banish-opening-hand]");
  if (banishButton) {
    if (!requireOpeningHandSpiritChosen()) {
      return;
    }
    closeOpeningHandBoardMenu();
    banishRandomMemoryCard(getActiveOpeningHandBoard());
    queueMultiplayerSeatPublish();
  }
}

function updateTryItTurnLabel() {
  const turn = Math.max(1, Number(state.openingHandTurn) || 1);
  state.openingHandTurn = turn;
  const text = `Turn ${turn}`;
  document.querySelectorAll("[data-oh-turn-label], #tryit-turn-label").forEach((label) => {
    label.textContent = text;
  });
}

function endTryItTurn() {
  if (!requireOpeningHandSpiritChosen()) {
    return;
  }
  state.openingHandTurn = Math.max(1, Number(state.openingHandTurn) || 1) + 1;
  updateTryItTurnLabel();
  setTryItMenuOpen(false);
  closeOpeningHandBoardMenu();
  closeOpeningHandCardMenu();
  wakeRestedOpeningHandCards();
  organizeOpeningHandFieldCards();
  if (state.mp.connection) {
    void state.mp.connection.sendMeta({
      turn: state.openingHandTurn,
      fromSeat: state.mp.role,
    });
  }
  queueMultiplayerSeatPublish();
}

async function drawOpeningHandFromRail() {
  const board = getActiveOpeningHandBoard();
  if (!board) {
    return;
  }
  if (state.openingHandLibrary.length === 0) {
    showTryItToast("Deck is empty");
    return;
  }
  await drawOpeningHandCard(board, {
    animate: true,
    organize: true,
    zone: "hand",
  });
}

/** At end of turn, rested (rotated) Field/Champion cards wake upright again. */
function wakeRestedOpeningHandCards(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  let woke = 0;
  state.openingHandHand.forEach((entry) => {
    if (!entry?.rotated) {
      return;
    }
    if (!canRestOpeningHandCard(entry.zone || "hand")) {
      entry.rotated = false;
      return;
    }
    entry.rotated = false;
    woke += 1;
    if (!field) {
      return;
    }
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (cardEl) {
      applyOpeningHandCardRotation(cardEl, entry);
    }
  });
  return woke;
}

/** Snap Field cards into an even row; restack Champion. */
function organizeOpeningHandFieldCards(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field) {
    return;
  }

  dedupeOpeningHandEntries();
  layoutOpeningHandZones(field);
  void field.offsetWidth;

  const fieldEntries = state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === "field")
    .sort((left, right) => {
      const dx = (left.position?.x || 0) - (right.position?.x || 0);
      if (dx !== 0) {
        return dx;
      }
      return (left.position?.z || 0) - (right.position?.z || 0);
    });

  fieldEntries.forEach((entry) => {
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (cardEl) {
      cardEl.style.transition = "left 220ms ease, top 220ms ease";
    }
  });
  layoutCardsInMeasuredZone(field, "field", fieldEntries);
  restackOpeningHandChampionCards(playBoard);
  updateOpeningHandCounts(playBoard);
  resizeOpeningHandField(playBoard);
}

function openTryItHelpDialog() {
  if (!tryitHelpDialog) {
    return;
  }
  setTryItMenuOpen(false);
  closeOpeningHandCardMenu();
  if (!tryitHelpDialog.open) {
    tryitHelpDialog.showModal();
  }
}

function closeTryItHelpDialog() {
  if (!tryitHelpDialog?.open) {
    return;
  }
  tryitHelpDialog.close();
}

function setTryItMenuOpen(open) {
  state.tryitMenuOpen = Boolean(open);
  const toggle = document.querySelector("[data-tryit-menu-toggle]");
  const panel = document.querySelector("#tryit-menu-panel");
  if (toggle) {
    toggle.setAttribute("aria-expanded", state.tryitMenuOpen ? "true" : "false");
    toggle.setAttribute("aria-label", state.tryitMenuOpen ? "Close menu" : "Open menu");
  }
  if (panel) {
    panel.hidden = !state.tryitMenuOpen;
  }
}

function normalizeOpeningHandDamage(value) {
  const next = Math.trunc(Number(value));
  if (!Number.isFinite(next)) {
    return 0;
  }
  return Math.max(0, Math.min(99, next));
}

function createOpeningHandDamageCounter({ readonly = false } = {}) {
  const rail = document.createElement("div");
  rail.className = "opening-hand-damage";
  rail.dataset.ohDamage = "true";
  rail.setAttribute("role", "group");
  rail.setAttribute("aria-label", "Damage counter");

  const label = document.createElement("p");
  label.className = "opening-hand-damage-label";
  label.textContent = "Damage";

  const value = document.createElement("p");
  value.className = "opening-hand-damage-value";
  value.dataset.ohDamageValue = "true";
  value.setAttribute("aria-live", "polite");
  value.textContent = "0";

  const controls = document.createElement("div");
  controls.className = "opening-hand-damage-controls";

  const dec = document.createElement("button");
  dec.className = "ghost compact opening-hand-damage-btn";
  dec.type = "button";
  dec.dataset.ohDamageDelta = "-1";
  dec.setAttribute("aria-label", "Decrease damage");
  dec.textContent = "−";

  const inc = document.createElement("button");
  inc.className = "ghost compact opening-hand-damage-btn";
  inc.type = "button";
  inc.dataset.ohDamageDelta = "1";
  inc.setAttribute("aria-label", "Increase damage");
  inc.textContent = "+";

  if (readonly) {
    dec.disabled = true;
    inc.disabled = true;
  } else {
    const onDelta = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta = Number(event.currentTarget.dataset.ohDamageDelta) || 0;
      adjustOpeningHandDamage(delta, event.currentTarget.closest("[data-opening-hand-board]"));
    };
    dec.addEventListener("click", onDelta);
    inc.addEventListener("click", onDelta);
  }

  controls.append(dec, inc);
  rail.append(label, value, controls);
  return rail;
}

function createOpeningHandBoardMenu() {
  const wrap = document.createElement("div");
  wrap.className = "opening-hand-board-menu";
  wrap.dataset.ohBoardMenu = "true";

  const turn = document.createElement("p");
  turn.className = "opening-hand-board-menu-turn";
  turn.dataset.ohTurnLabel = "true";
  turn.setAttribute("aria-live", "polite");
  turn.textContent = `Turn ${Math.max(1, Number(state.openingHandTurn) || 1)}`;

  const endTurn = document.createElement("button");
  endTurn.type = "button";
  endTurn.className = "secondary compact opening-hand-end-turn";
  endTurn.dataset.endTurn = "true";
  endTurn.setAttribute("aria-label", "End phase");
  endTurn.textContent = "End phase";

  const banish = document.createElement("button");
  banish.type = "button";
  banish.className = "secondary compact opening-hand-end-turn opening-hand-banish-random";
  banish.dataset.banishOpeningHand = "true";
  banish.title = "Banish 1 random card from Memory";
  banish.setAttribute("aria-label", "Banish a random card from Memory");
  banish.textContent = "Banish";

  const recollect = document.createElement("button");
  recollect.type = "button";
  recollect.className = "secondary compact opening-hand-end-turn opening-hand-recollect";
  recollect.dataset.recollectOpeningHand = "true";
  recollect.title = "Recollect — move all Memory cards back to Hand";
  recollect.setAttribute("aria-label", "Reco — move Memory cards to Hand");
  recollect.textContent = "Reco";

  const draw = document.createElement("button");
  draw.type = "button";
  draw.className = "secondary compact opening-hand-end-turn opening-hand-draw";
  draw.dataset.drawOpeningHand = "true";
  draw.title = "Draw the top card of your deck to Hand";
  draw.setAttribute("aria-label", "Draw a card");
  draw.textContent = "Draw";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "secondary compact opening-hand-end-turn opening-hand-board-menu-toggle";
  toggle.dataset.ohBoardMenuToggle = "true";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-haspopup", "dialog");
  toggle.setAttribute("aria-label", "Open playtest menu");
  toggle.textContent = "Menu";

  const dialog = document.createElement("dialog");
  dialog.className = "opening-hand-board-menu-dialog";
  dialog.dataset.ohBoardMenuPanel = "true";
  dialog.setAttribute("aria-label", "Playtest menu");

  const shell = document.createElement("div");
  shell.className = "opening-hand-board-menu-shell";

  const heading = document.createElement("header");
  heading.className = "opening-hand-board-menu-header";
  const title = document.createElement("h2");
  title.className = "opening-hand-board-menu-title";
  title.textContent = "Playtest menu";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "icon-button";
  closeBtn.setAttribute("aria-label", "Close playtest menu");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeOpeningHandBoardMenu();
  });
  heading.append(title, closeBtn);

  const list = document.createElement("div");
  list.className = "opening-hand-board-menu-list";
  list.setAttribute("role", "menu");

  const addItem = (label, attrs = {}, { href = "" } = {}) => {
    if (href) {
      const link = document.createElement("a");
      link.className = "opening-hand-board-menu-item tryit-back-link";
      link.href = href;
      link.setAttribute("role", "menuitem");
      link.textContent = label;
      Object.entries(attrs).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
      list.append(link);
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "opening-hand-board-menu-item";
    button.setAttribute("role", "menuitem");
    button.textContent = label;
    Object.entries(attrs).forEach(([key, value]) => {
      button.setAttribute(key, value);
    });
    list.append(button);
  };

  addItem("Organize hand", { "data-organize-opening-hand": "true" });
  addItem("Tokens / Mastery", {
    "data-open-extras": "true",
    title: "Add Token or Mastery cards to the Field",
  });
  addItem("Redeal", { "data-redeal-opening-hand": "true" });
  addItem("Share playtest link", {
    "data-tryit-share": "true",
    title: "Copy a link that opens this deck in Playtest",
  });
  addItem("Help", {
    "data-tryit-help": "true",
    title: "Game controls and shortcuts",
  });
  addItem("Back to deck builder", {}, { href: BUILDER_PAGE_URL });

  shell.append(heading, list);
  dialog.append(shell);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeOpeningHandBoardMenu();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeOpeningHandBoardMenu();
  });

  wrap.append(turn, endTurn, banish, recollect, draw, toggle, dialog);
  return wrap;
}

function isPlaytestVoiceSupported() {
  if (state.openingHandVoice.supported != null) {
    return state.openingHandVoice.supported;
  }
  const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  state.openingHandVoice.supported = supported;
  return supported;
}

function createOpeningHandVoiceButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary compact opening-hand-end-turn opening-hand-voice-toggle";
  button.dataset.ohVoiceToggle = "true";
  button.setAttribute("aria-pressed", "false");
  button.title = isPlaytestVoiceSupported()
    ? "Push-to-talk voice commands"
    : "Voice not supported in this browser";
  button.setAttribute(
    "aria-label",
    isPlaytestVoiceSupported()
      ? "Push-to-talk voice commands"
      : "Voice not supported in this browser",
  );
  button.textContent = "Voice";
  if (!isPlaytestVoiceSupported()) {
    button.disabled = true;
  }

  const status = document.createElement("p");
  status.className = "opening-hand-voice-status";
  status.dataset.ohVoiceStatus = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = isPlaytestVoiceSupported() ? "Tap to talk" : "Unavailable";

  const wrap = document.createElement("div");
  wrap.className = "opening-hand-voice";
  wrap.dataset.ohVoice = "true";
  wrap.append(button, status);
  return wrap;
}

function setOpeningHandVoiceStatus(message, { listening = false } = {}) {
  document.querySelectorAll("[data-oh-voice-status]").forEach((el) => {
    el.textContent = message;
  });
  document.querySelectorAll("[data-oh-voice-toggle]").forEach((button) => {
    button.classList.toggle("is-listening", listening);
    button.setAttribute("aria-pressed", listening ? "true" : "false");
    button.textContent = listening ? "Listening" : "Voice";
  });
  window.clearTimeout(state.openingHandVoice.statusTimer);
  if (!listening && message && message !== "Tap to talk") {
    state.openingHandVoice.statusTimer = window.setTimeout(() => {
      if (!state.openingHandVoice.listening) {
        setOpeningHandVoiceStatus("Tap to talk");
      }
    }, 2800);
  }
}

function speakPlaytestVoice(message) {
  const text = String(message || "").trim();
  if (!text || !window.speechSynthesis) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore TTS failures
  }
}

function setOpeningHandVoiceSelection(instanceId, board = null) {
  state.openingHandSelectedInstanceId = instanceId || "";
  document.querySelectorAll(".opening-hand-card.is-voice-selected").forEach((el) => {
    el.classList.remove("is-voice-selected");
  });
  if (!instanceId) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  const cardEl = findOpeningHandCardElement(field, instanceId);
  cardEl?.classList.add("is-voice-selected");
  const entry = state.openingHandHand.find((item) => item.instanceId === instanceId);
  const hideDetails = Boolean(entry?.facedown && playBoard?.dataset.mpReadonly === "true");
  inspectTryItCard(hideDetails ? { name: "Face-down card" } : entry?.card);
}

function getOpeningHandVoiceSelectedEntry(board = null) {
  const instanceId = state.openingHandSelectedInstanceId;
  if (!instanceId) {
    return null;
  }
  const entry = state.openingHandHand.find((item) => item.instanceId === instanceId);
  if (!entry) {
    state.openingHandSelectedInstanceId = "";
    return null;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  const cardEl = field ? findOpeningHandCardElement(field, instanceId) : null;
  return { entry, cardEl, board: playBoard };
}

function normalizePlaytestVoiceTranscript(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[+]/g, " plus ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePlaytestVoiceCommand(transcript) {
  const t = normalizePlaytestVoiceTranscript(transcript);
  if (!t) {
    return null;
  }

  if (/\b(end turn|end the turn|next turn|finish turn)\b/.test(t)) {
    return { type: "end-turn" };
  }
  if (/\b(reco|recollect|re collect|recall)\b/.test(t)) {
    return { type: "recollect" };
  }
  if (/\b(open menu|show menu|menu)\b/.test(t)) {
    return { type: "menu" };
  }
  if (/\b(help|controls|shortcuts)\b/.test(t)) {
    return { type: "help" };
  }
  if (/\b(organize hand|organise hand|organize cards|organise cards|organize)\b/.test(t)) {
    return { type: "organize" };
  }
  if (/\b(redeal|re deal|new hand|mulligan)\b/.test(t)) {
    return { type: "redeal" };
  }
  if (/\b(tokens?|mastery|token mastery)\b/.test(t)) {
    return { type: "extras" };
  }
  if (/\b(banish random|random banish)\b/.test(t)) {
    return { type: "banish-random" };
  }
  if (/\b(status|board status|what.?s my status)\b/.test(t)) {
    return { type: "status" };
  }
  if (/\b(clear buff|remove buff|reset buff)\b/.test(t)) {
    return { type: "clear-buff" };
  }
  if (/\b(buff|plus one|add buff|add a buff|plus 1)\b/.test(t)) {
    return { type: "buff" };
  }
  if (/\b(minus one|remove one|buff down|minus 1)\b/.test(t)) {
    return { type: "debuff" };
  }
  if (/\b(ready|wake|unrest)\b/.test(t)) {
    return { type: "ready" };
  }
  if (/\b(rest|rotate)\b/.test(t)) {
    return { type: "rest" };
  }
  if (/\b(flip|flip card|face down|face up)\b/.test(t)) {
    return { type: "flip" };
  }
  return { type: "unknown", transcript: t };
}

async function executePlaytestVoiceCommand(command) {
  const board = getActiveOpeningHandBoard();
  if (!command) {
    speakPlaytestVoice("I didn't catch that.");
    setOpeningHandVoiceStatus("Not understood");
    return;
  }

  const reply = (spoken, toast = spoken) => {
    showTryItToast(toast);
    setOpeningHandVoiceStatus(toast);
    speakPlaytestVoice(spoken);
  };

  switch (command.type) {
    case "end-turn": {
      if (!requireOpeningHandSpiritChosen()) {
        reply("Choose your Spirit first.");
        return;
      }
      endTryItTurn();
      reply(`Turn ${state.openingHandTurn}.`);
      return;
    }
    case "recollect": {
      if (!requireOpeningHandSpiritChosen()) {
        reply("Choose your Spirit first.");
        return;
      }
      recollectOpeningHandMemory(board);
      queueMultiplayerSeatPublish();
      reply("Recollected.");
      return;
    }
    case "menu": {
      const menu = board?.querySelector("[data-oh-board-menu]");
      setOpeningHandBoardMenuOpen(true, menu);
      reply("Menu open.");
      return;
    }
    case "help": {
      openTryItHelpDialog();
      reply("Opening help.");
      return;
    }
    case "organize": {
      if (!requireOpeningHandSpiritChosen()) {
        reply("Choose your Spirit first.");
        return;
      }
      organizeOpeningHandCards(board);
      queueMultiplayerSeatPublish();
      reply("Hand organized.");
      return;
    }
    case "redeal": {
      if (!window.confirm("Redeal opening hand?")) {
        reply("Cancelled.");
        return;
      }
      startOpeningHandSession();
      reply("Redealing.");
      return;
    }
    case "extras": {
      if (!requireOpeningHandSpiritChosen()) {
        reply("Choose your Spirit first.");
        return;
      }
      await openExtrasDialog(board);
      reply("Tokens and Mastery.");
      return;
    }
    case "banish-random": {
      if (!requireOpeningHandSpiritChosen()) {
        reply("Choose your Spirit first.");
        return;
      }
      banishRandomMemoryCard(board);
      queueMultiplayerSeatPublish();
      reply("Banished one from memory.");
      return;
    }
    case "status": {
      const handCount = state.openingHandHand.filter((e) => (e.zone || "hand") === "hand").length;
      const msg = `Turn ${state.openingHandTurn}. Damage ${state.openingHandDamage}. ${handCount} in hand.`;
      reply(msg);
      return;
    }
    case "buff":
    case "debuff":
    case "clear-buff":
    case "rest":
    case "ready":
    case "flip": {
      const selected = getOpeningHandVoiceSelectedEntry(board);
      if (!selected?.entry || !selected.cardEl) {
        reply("Select a card first.");
        return;
      }
      const { entry, cardEl } = selected;
      if (command.type === "buff") {
        adjustOpeningHandCardBuff(cardEl, entry, 1);
        reply(`Buff plus ${normalizeOpeningHandBuff(entry.buff)}.`);
        return;
      }
      if (command.type === "debuff") {
        adjustOpeningHandCardBuff(cardEl, entry, -1);
        reply(
          entry.buff > 0
            ? `Buff plus ${normalizeOpeningHandBuff(entry.buff)}.`
            : "Buff cleared.",
        );
        return;
      }
      if (command.type === "clear-buff") {
        entry.buff = 0;
        applyOpeningHandCardBuff(cardEl, entry);
        queueMultiplayerSeatPublish();
        reply("Buff cleared.");
        return;
      }
      if (command.type === "rest") {
        if (!canRestOpeningHandCard(entry.zone || "hand")) {
          reply("That card can't rest.");
          return;
        }
        if (!entry.rotated) {
          toggleOpeningHandCardRotation(cardEl, entry);
        }
        reply("Rested.");
        return;
      }
      if (command.type === "ready") {
        if (!canRestOpeningHandCard(entry.zone || "hand")) {
          reply("That card can't ready.");
          return;
        }
        if (entry.rotated) {
          toggleOpeningHandCardRotation(cardEl, entry);
        }
        reply("Ready.");
        return;
      }
      if (command.type === "flip") {
        if (!canFlipOpeningHandCard(entry.zone || "hand")) {
          reply("That card can't flip.");
          return;
        }
        const nextFacedown = !entry.facedown;
        toggleOpeningHandCardFace(cardEl, entry);
        reply(nextFacedown ? "Face down." : "Face up.");
        return;
      }
      return;
    }
    default: {
      reply("Try end turn, reco, buff, rest, or help.", "Not recognized");
    }
  }
}

function stopPlaytestVoiceListening({ silent = false } = {}) {
  const voice = state.openingHandVoice;
  voice.listening = false;
  try {
    voice.recognition?.stop();
  } catch {
    // ignore
  }
  if (!silent) {
    setOpeningHandVoiceStatus(voice.lastTranscript ? `Heard: ${voice.lastTranscript}` : "Tap to talk");
  }
}

function startPlaytestVoiceListening() {
  if (!isPlaytestVoiceSupported()) {
    showTryItToast("Voice not supported here");
    speakPlaytestVoice("Voice is not supported in this browser.");
    return;
  }
  if (!state.mainDeckOpeningHand) {
    showTryItToast("Start playtest first");
    return;
  }

  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Ctor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  state.openingHandVoice.recognition = recognition;
  state.openingHandVoice.listening = true;
  state.openingHandVoice.lastTranscript = "";
  setOpeningHandVoiceStatus("Listening…", { listening: true });
  closeOpeningHandBoardMenu();
  closeOpeningHandCardMenu();

  recognition.onresult = (event) => {
    const result = event.results?.[event.results.length - 1];
    const transcript = String(result?.[0]?.transcript || "").trim();
    state.openingHandVoice.lastTranscript = transcript;
    state.openingHandVoice.listening = false;
    setOpeningHandVoiceStatus(transcript ? `Heard: ${transcript}` : "No speech");
    const command = parsePlaytestVoiceCommand(transcript);
    void executePlaytestVoiceCommand(command);
  };

  recognition.onerror = (event) => {
    state.openingHandVoice.listening = false;
    const err = event?.error || "error";
    if (err === "not-allowed") {
      setOpeningHandVoiceStatus("Mic blocked");
      speakPlaytestVoice("Microphone permission is blocked.");
      showTryItToast("Allow microphone for voice");
      return;
    }
    if (err === "no-speech") {
      setOpeningHandVoiceStatus("No speech");
      return;
    }
    setOpeningHandVoiceStatus("Voice error");
  };

  recognition.onend = () => {
    if (state.openingHandVoice.listening) {
      state.openingHandVoice.listening = false;
      setOpeningHandVoiceStatus(
        state.openingHandVoice.lastTranscript
          ? `Heard: ${state.openingHandVoice.lastTranscript}`
          : "Tap to talk",
      );
    }
  };

  try {
    recognition.start();
  } catch {
    state.openingHandVoice.listening = false;
    setOpeningHandVoiceStatus("Voice busy");
    showTryItToast("Voice is busy — try again");
  }
}

function togglePlaytestVoiceListening() {
  if (state.openingHandVoice.listening) {
    stopPlaytestVoiceListening();
    return;
  }
  startPlaytestVoiceListening();
}

function setOpeningHandBoardMenuOpen(open, menuRoot = null) {
  const menus = menuRoot
    ? [menuRoot]
    : [...document.querySelectorAll("[data-oh-board-menu]")];
  menus.forEach((menu) => {
    const toggle = menu.querySelector("[data-oh-board-menu-toggle]");
    const panel = menu.querySelector("[data-oh-board-menu-panel]");
    if (!toggle || !panel) {
      return;
    }
    const next = Boolean(open);
    if (panel instanceof HTMLDialogElement) {
      if (next) {
        if (!panel.open) {
          panel.showModal();
        }
      } else if (panel.open) {
        panel.close();
      }
    } else {
      panel.hidden = !next;
    }
    toggle.setAttribute("aria-expanded", next ? "true" : "false");
    toggle.setAttribute("aria-label", next ? "Close playtest menu" : "Open playtest menu");
    menu.classList.toggle("is-open", next);
  });
}

function closeOpeningHandBoardMenu() {
  setOpeningHandBoardMenuOpen(false);
}

function createOpeningHandSideRail({ readonly = false } = {}) {
  const rail = document.createElement("div");
  rail.className = "opening-hand-side-rail";
  rail.dataset.ohSideRail = "true";
  rail.append(createOpeningHandDamageCounter({ readonly }));
  if (!readonly) {
    rail.append(createOpeningHandBoardMenu());
  }
  return rail;
}

function updateOpeningHandDamageCounter(board = null) {
  const target = board || getActiveOpeningHandBoard();
  const valueEl = target?.querySelector("[data-oh-damage-value]");
  if (!valueEl) {
    return;
  }
  const damage = normalizeOpeningHandDamage(state.openingHandDamage);
  state.openingHandDamage = damage;
  valueEl.textContent = String(damage);
  if (target.dataset.mpReadonly === "true") {
    return;
  }
  const dec = target.querySelector('[data-oh-damage-delta="-1"]');
  const inc = target.querySelector('[data-oh-damage-delta="1"]');
  if (dec) {
    dec.disabled = damage <= 0;
  }
  if (inc) {
    inc.disabled = damage >= 99;
  }
}

function adjustOpeningHandDamage(delta, board = null) {
  state.openingHandDamage = normalizeOpeningHandDamage(
    normalizeOpeningHandDamage(state.openingHandDamage) + Number(delta || 0),
  );
  updateOpeningHandDamageCounter(board);
  queueMultiplayerSeatPublish();
}

function createOpeningHandBoard(
  sectionCards,
  {
    readonly = false,
    hideHandCards = false,
    handFacedown = false,
    seat = "",
    skipDeal = false,
    skipLibraryInit = false,
  } = {},
) {
  if (
    !skipLibraryInit &&
    state.openingHandLibrary.length === 0 &&
    state.openingHandHand.length === 0
  ) {
    const copies = shuffleArray(expandMainDeckCopies(sectionCards));
    state.openingHandLibrary = copies;
    state.openingHandHand = [];
  }

  const board = document.createElement("div");
  board.className = "opening-hand-board";
  board.dataset.openingHandBoard = "true";
  if (readonly) {
    board.dataset.mpReadonly = "true";
  }
  if (hideHandCards) {
    board.dataset.mpHideHand = "true";
  }
  if (handFacedown) {
    board.dataset.mpHandFacedown = "true";
  }
  if (seat) {
    board.dataset.mpSeat = seat;
  }

  const field = document.createElement("div");
  field.className = "opening-hand-field";
  field.dataset.ohField = "true";

  const zonesWrap = document.createElement("div");
  zonesWrap.className = "opening-hand-zones";
  zonesWrap.setAttribute("aria-hidden", "true");

  const zoneSpecs = [
    ["champion", "Champion"],
    ["field", "Field"],
    ["banishment", "Banishment"],
    ["material", "Material"],
    ["memory", "Memory"],
    ["deck", "Deck"],
    ["hand", "Hand"],
    ["graveyard", "Graveyard"],
  ];
  zoneSpecs.forEach(([key, label]) => {
    const zone = document.createElement("div");
    zone.className = `opening-hand-zone opening-hand-zone-${key}`;
    zone.dataset.ohZone = key;

    const tag = document.createElement("span");
    tag.className = `opening-hand-tag opening-hand-tag-${key}`;
    tag.textContent = label;
    zone.append(tag);

    if (key === "deck") {
      const topHalf = document.createElement("span");
      topHalf.className = "opening-hand-deck-half opening-hand-deck-top";
      topHalf.dataset.ohDeckHalf = "top";
      topHalf.textContent = "Top";

      const bottomHalf = document.createElement("span");
      bottomHalf.className = "opening-hand-deck-half opening-hand-deck-bottom";
      bottomHalf.dataset.ohDeckHalf = "bottom";
      bottomHalf.textContent = "Bottom";

      zone.append(topHalf, bottomHalf);
    }

    zonesWrap.append(zone);
  });

  field.append(zonesWrap);
  const sideRail = createOpeningHandSideRail({ readonly });
  board.append(sideRail, field);
  layoutOpeningHandZones(field);
  renderOpeningHandContents(board);
  updateOpeningHandDamageCounter(board);
  updateTryItTurnLabel();
  updateMultiplayerChrome();
  if (!readonly) {
    enableOpeningHandGraveyardHold(board);
  }

  if (!skipDeal && !readonly) {
    // Cancel any deal tied to a previous board instance (home↔fullscreen remount).
    state.openingHandDealToken += 1;
    const token = state.openingHandDealToken;
    const needsOpeningDeal =
      !state.openingHandDealComplete &&
      state.openingHandHand.length < OPENING_HAND_SIZE &&
      state.openingHandLibrary.length > 0;
    if (needsOpeningDeal) {
      window.requestAnimationFrame(() => {
        dealOpeningHandCards(board, token);
      });
    }
  }

  return board;
}

function getOpeningHandFieldWidth(field) {
  const width = field?.clientWidth || field?.parentElement?.clientWidth || 0;
  // Ignore unusable 0-width measures from pre-layout frames.
  const minWidth =
    OPENING_HAND_RAIL_WIDTH * 2 + FREEHAND_CARD_WIDTH + OPENING_HAND_ZONE_GAP + 48;
  return width >= minWidth ? width : 720;
}

function getOpeningHandMainColumnBounds(field) {
  const width = getOpeningHandFieldWidth(field);
  const leftRailLeft = OPENING_HAND_INSET;
  const leftRailWidth = OPENING_HAND_RAIL_WIDTH;
  const memoryLeft = leftRailLeft + leftRailWidth + OPENING_HAND_ZONE_GAP;
  const railLeft = width - OPENING_HAND_INSET - OPENING_HAND_RAIL_WIDTH;
  const mainRight = railLeft - OPENING_HAND_ZONE_GAP;
  return {
    width,
    leftRailLeft,
    leftRailWidth,
    // Field / Hand span the Material column + Memory column.
    mainLeft: leftRailLeft,
    memoryLeft,
    mainRight: Math.max(memoryLeft + FREEHAND_CARD_WIDTH, mainRight),
    railLeft,
    railWidth: OPENING_HAND_RAIL_WIDTH,
  };
}

function getOpeningHandFallbackZones(field) {
  const {
    width,
    mainLeft,
    memoryLeft,
    mainRight,
    leftRailLeft,
    leftRailWidth,
    railLeft,
    railWidth,
  } = getOpeningHandMainColumnBounds(field);
  const inset = OPENING_HAND_INSET;
  const gap = OPENING_HAND_ZONE_GAP;
  const rowHeight = OPENING_HAND_ROW_HEIGHT;
  const height = OPENING_HAND_BOARD_HEIGHT;

  const row = (index) => {
    const top = inset + index * (rowHeight + gap);
    return { top, bottom: top + rowHeight, contentTop: top + OPENING_HAND_ROW_PAD };
  };
  const fieldRow = row(0);
  const memoryRow = row(1);
  const handRow = row(2);

  return {
    width,
    height,
    inset,
    gap,
    leftRailLeft,
    leftRailWidth,
    railLeft,
    railWidth,
    mainLeft,
    memoryLeft,
    mainRight,
    fieldTop: fieldRow.top,
    fieldBottom: fieldRow.bottom,
    fieldContentTop: fieldRow.contentTop,
    championTop: fieldRow.top,
    championBottom: fieldRow.bottom,
    championContentTop: fieldRow.top + (rowHeight - FREEHAND_CARD_HEIGHT) / 2,
    memoryTop: memoryRow.top,
    memoryBottom: memoryRow.bottom,
    memoryContentTop: memoryRow.contentTop,
    materialTop: memoryRow.top,
    materialBottom: memoryRow.bottom,
    materialContentTop: memoryRow.top + (rowHeight - FREEHAND_CARD_HEIGHT) / 2,
    handTop: handRow.top,
    handBottom: handRow.bottom,
    handContentTop: handRow.contentTop,
    banishmentTop: fieldRow.top,
    banishmentBottom: fieldRow.bottom,
    deckTop: memoryRow.top,
    deckBottom: memoryRow.bottom,
    deckContentTop: memoryRow.top + (rowHeight - FREEHAND_CARD_HEIGHT) / 2,
    graveyardTop: handRow.top,
    graveyardBottom: handRow.bottom,
    graveyardContentTop: handRow.top + (rowHeight - FREEHAND_CARD_HEIGHT) / 2,
  };
}

function getOffsetRelativeToAncestor(element, ancestor) {
  let top = 0;
  let left = 0;
  let node = element;
  while (node && node !== ancestor) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent;
  }
  if (node !== ancestor) {
    return null;
  }
  return { left, top };
}

function getOpeningHandFieldScale(field) {
  if (!field) {
    return { x: 1, y: 1 };
  }
  const rect = field.getBoundingClientRect();
  const layoutW = Math.max(1, field.clientWidth);
  const layoutH = Math.max(1, field.clientHeight || OPENING_HAND_BOARD_HEIGHT);
  return {
    x: rect.width / layoutW || 1,
    y: rect.height / layoutH || 1,
  };
}

function readOpeningHandZoneBox(field, key) {
  const zone = field.querySelector(`[data-oh-zone="${key}"]`);
  if (!zone || zone.offsetHeight <= 0) {
    return null;
  }
  // Prefer layout offsets so CSS zoom / ancestor rotate do not skew card math.
  // getBoundingClientRect() under zoom returns visual pixels while style.left/top
  // are layout pixels — that mismatch was shoving dual-board cards upward.
  const offset = getOffsetRelativeToAncestor(zone, field);
  if (offset) {
    const width = zone.offsetWidth;
    const height = zone.offsetHeight;
    return {
      top: offset.top,
      left: offset.left,
      bottom: offset.top + height,
      right: offset.left + width,
      width,
      height,
      contentTop: offset.top + OPENING_HAND_ROW_PAD,
    };
  }

  const fieldRect = field.getBoundingClientRect();
  const rect = zone.getBoundingClientRect();
  const scale = getOpeningHandFieldScale(field);
  const top = (rect.top - fieldRect.top) / scale.y;
  const left = (rect.left - fieldRect.left) / scale.x;
  const width = rect.width / scale.x;
  const height = rect.height / scale.y;
  return {
    top,
    left,
    bottom: top + height,
    right: left + width,
    width,
    height,
    contentTop: top + OPENING_HAND_ROW_PAD,
  };
}

function getOpeningHandZones(field) {
  const fallback = getOpeningHandFallbackZones(field);
  if (!field) {
    return fallback;
  }

  const championBox = readOpeningHandZoneBox(field, "champion");
  const fieldBox = readOpeningHandZoneBox(field, "field");
  const materialBox = readOpeningHandZoneBox(field, "material");
  const memoryBox = readOpeningHandZoneBox(field, "memory");
  const handBox = readOpeningHandZoneBox(field, "hand");
  const banishmentBox = readOpeningHandZoneBox(field, "banishment");
  const deckBox = readOpeningHandZoneBox(field, "deck");
  const graveyardBox = readOpeningHandZoneBox(field, "graveyard");
  if (
    !championBox ||
    !fieldBox ||
    !materialBox ||
    !memoryBox ||
    !handBox ||
    !banishmentBox ||
    !deckBox ||
    !graveyardBox
  ) {
    return fallback;
  }

  // Horizontal Hand bounds come from the field width + rail, not getBoundingClientRect.
  // Rect measures can be wrong before/during layout and were placing cards 5-7 under Deck.
  const column = getOpeningHandMainColumnBounds(field);
  return {
    width: column.width,
    height: field.clientHeight || fallback.height,
    inset: OPENING_HAND_INSET,
    gap: OPENING_HAND_ZONE_GAP,
    leftRailLeft: column.leftRailLeft,
    leftRailWidth: column.leftRailWidth,
    railLeft: column.railLeft,
    railWidth: column.railWidth,
    mainLeft: column.mainLeft,
    memoryLeft: column.memoryLeft,
    mainRight: column.mainRight,
    fieldTop: fieldBox.top,
    fieldBottom: fieldBox.bottom,
    fieldContentTop: fieldBox.contentTop,
    championTop: championBox.top,
    championBottom: championBox.bottom,
    championContentTop:
      championBox.top + Math.max(0, (championBox.height - FREEHAND_CARD_HEIGHT) / 2),
    materialTop: materialBox.top,
    materialBottom: materialBox.bottom,
    materialContentTop:
      materialBox.top + Math.max(0, (materialBox.height - FREEHAND_CARD_HEIGHT) / 2),
    memoryTop: memoryBox.top,
    memoryBottom: memoryBox.bottom,
    memoryContentTop: memoryBox.contentTop,
    handTop: handBox.top,
    handBottom: handBox.bottom,
    handContentTop: handBox.contentTop,
    banishmentTop: banishmentBox.top,
    banishmentBottom: banishmentBox.bottom,
    deckTop: deckBox.top,
    deckBottom: deckBox.bottom,
    deckContentTop: deckBox.top + Math.max(0, (deckBox.height - FREEHAND_CARD_HEIGHT) / 2),
    graveyardTop: graveyardBox.top,
    graveyardBottom: graveyardBox.bottom,
    graveyardContentTop:
      graveyardBox.top + Math.max(0, (graveyardBox.height - FREEHAND_CARD_HEIGHT) / 2),
  };
}

function getOpeningHandMainWidth(field) {
  const { mainLeft, mainRight } = getOpeningHandMainColumnBounds(field);
  return Math.max(FREEHAND_CARD_WIDTH, mainRight - mainLeft);
}

function layoutOpeningHandZones(field) {
  if (!field) {
    return getOpeningHandZones(field);
  }
  // Keep every zone exactly one card-row tall; do not grow with card count.
  field.style.height = `${OPENING_HAND_BOARD_HEIGHT}px`;
  field.style.minHeight = `${OPENING_HAND_BOARD_HEIGHT}px`;
  field.style.maxHeight = `${OPENING_HAND_BOARD_HEIGHT}px`;
  field.style.setProperty("--oh-rail-width", `${OPENING_HAND_RAIL_WIDTH}px`);
  field.style.setProperty("--oh-zone-gap", `${OPENING_HAND_ZONE_GAP}px`);
  field.style.setProperty("--oh-inset", `${OPENING_HAND_INSET}px`);
  field.style.setProperty("--oh-row-height", `${OPENING_HAND_ROW_HEIGHT}px`);
  field.style.setProperty("--oh-board-height", `${OPENING_HAND_BOARD_HEIGHT}px`);
  return getOpeningHandZones(field);
}

function getOpeningHandHandColumns(field) {
  const usable = getOpeningHandMainWidth(field);
  return Math.max(1, Math.floor((usable + FREEHAND_GAP_X) / OPENING_HAND_STEP_X));
}

function getOpeningHandDeckAnchor(field) {
  const zones = getOpeningHandZones(field);
  return {
    x: zones.railLeft + Math.max(0, (zones.railWidth - FREEHAND_CARD_WIDTH) / 2),
    y: zones.deckContentTop,
  };
}

function getOpeningHandMaterialAnchor(field) {
  const zones = getOpeningHandZones(field);
  return {
    x: zones.leftRailLeft + Math.max(0, (zones.leftRailWidth - FREEHAND_CARD_WIDTH) / 2),
    y: zones.materialContentTop,
  };
}

function getOpeningHandZoneAt(x, y, field) {
  const zones = getOpeningHandZones(field);
  const centerX = x + FREEHAND_CARD_WIDTH / 2;
  const centerY = y + FREEHAND_CARD_HEIGHT / 2;

  if (centerX >= zones.railLeft) {
    if (centerY < zones.deckTop) {
      return "banishment";
    }
    if (centerY < zones.graveyardTop) {
      const deckMid = (zones.deckTop + zones.deckBottom) / 2;
      return centerY < deckMid ? "deck-top" : "deck-bottom";
    }
    return "graveyard";
  }
  // Champion occupies the left rail of the Field row.
  if (
    centerX < zones.memoryLeft &&
    centerY >= zones.fieldTop &&
    centerY < zones.fieldBottom
  ) {
    return "champion";
  }
  // Material pile occupies the left rail of the Memory row only.
  if (
    centerX < zones.memoryLeft &&
    centerY >= zones.memoryTop &&
    centerY < zones.memoryBottom
  ) {
    return "material";
  }
  if (centerY < zones.fieldBottom) {
    return "field";
  }
  if (centerY < zones.memoryBottom) {
    return "memory";
  }
  return "hand";
}

function isOpeningHandDeckZone(zone) {
  return zone === "deck" || zone === "deck-top" || zone === "deck-bottom";
}

function isOpeningHandMemoryPosition(x, y, field) {
  return getOpeningHandZoneAt(x, y, field) === "memory";
}

function getOpeningHandFieldPointFromClient(clientX, clientY, field) {
  const rect = field.getBoundingClientRect();
  const scale = getOpeningHandFieldScale(field);
  return {
    x: (clientX - rect.left) / scale.x - FREEHAND_CARD_WIDTH / 2,
    y: (clientY - rect.top) / scale.y - FREEHAND_CARD_HEIGHT / 2,
  };
}

function clampOpeningHandFieldPosition(field, x, y, z = 1) {
  const maxX = Math.max(0, (field?.clientWidth || 0) - FREEHAND_CARD_WIDTH);
  const maxY = Math.max(0, OPENING_HAND_BOARD_HEIGHT - FREEHAND_CARD_HEIGHT);
  const snapped = snapFreehandPosition({ x, y, z });
  return {
    x: Math.min(maxX, Math.max(0, snapped.x)),
    y: Math.min(maxY, Math.max(0, snapped.y)),
    z,
  };
}

function getOpeningHandCardVisualOffset(rotated = false) {
  if (!rotated) {
    return {
      offsetX: 0,
      offsetY: 0,
      visualW: FREEHAND_CARD_WIDTH,
      visualH: FREEHAND_CARD_HEIGHT,
    };
  }
  // rotate(90deg) around center: visual AABB swaps width/height around the layout box.
  return {
    offsetX: (FREEHAND_CARD_WIDTH - FREEHAND_CARD_HEIGHT) / 2,
    offsetY: (FREEHAND_CARD_HEIGHT - FREEHAND_CARD_WIDTH) / 2,
    visualW: FREEHAND_CARD_HEIGHT,
    visualH: FREEHAND_CARD_WIDTH,
  };
}

function clampOpeningHandPositionToZone(
  field,
  zoneName,
  x,
  y,
  z = 1,
  { rotated = false } = {},
) {
  const zone = normalizeOpeningHandDropZone(zoneName);
  if (!field || !zone || isOpeningHandDeckZone(zone) || zone === "material") {
    return clampOpeningHandFieldPosition(field, x, y, z);
  }
  const box = getMeasuredZoneBox(field, zone);
  if (!box) {
    return clampOpeningHandFieldPosition(field, x, y, z);
  }

  const pad = 4;
  const { offsetX, offsetY, visualW, visualH } = getOpeningHandCardVisualOffset(rotated);
  const minVisualX = box.left + pad;
  const maxVisualX = box.right - pad - visualW;
  const minVisualY = box.top + pad;
  const maxVisualY = box.bottom - pad - visualH;

  let visualX = x + offsetX;
  let visualY = y + offsetY;
  if (maxVisualX < minVisualX) {
    visualX = box.left + (box.width - visualW) / 2;
  } else {
    visualX = Math.min(maxVisualX, Math.max(minVisualX, visualX));
  }
  if (maxVisualY < minVisualY) {
    visualY = box.top + (box.height - visualH) / 2;
  } else {
    visualY = Math.min(maxVisualY, Math.max(minVisualY, visualY));
  }

  const layoutX = visualX - offsetX;
  const layoutY = visualY - offsetY;
  // Avoid freehand snap here — it can push cards back outside the zone by up to SNAP/2.
  const maxX = Math.max(0, (field?.clientWidth || 0) - FREEHAND_CARD_WIDTH);
  const maxY = Math.max(0, OPENING_HAND_BOARD_HEIGHT - FREEHAND_CARD_HEIGHT);
  return {
    x: Math.min(maxX, Math.max(0, layoutX)),
    y: Math.min(maxY, Math.max(0, layoutY)),
    z,
  };
}

function constrainOpeningHandEntryToZone(field, entry) {
  if (!field || !entry) {
    return entry?.position || { x: 0, y: 0, z: 1 };
  }
  const zone = normalizeOpeningHandDropZone(entry.zone || "hand");
  const position = entry.position || { x: 0, y: 0, z: 1 };
  const next = clampOpeningHandPositionToZone(
    field,
    zone,
    position.x || 0,
    position.y || 0,
    position.z || 1,
    { rotated: Boolean(entry.rotated) && canRestOpeningHandCard(zone) },
  );
  entry.position = next;
  return next;
}

function constrainOpeningHandCardsToZones(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field) {
    return;
  }
  layoutOpeningHandZones(field);
  state.openingHandHand.forEach((entry) => {
    const zone = entry.zone || "hand";
    if (isOpeningHandDeckZone(zone)) {
      return;
    }
    constrainOpeningHandEntryToZone(field, entry);
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (cardEl) {
      applyOpeningHandCardPosition(cardEl, entry);
      applyOpeningHandCardRotation(cardEl, entry);
    }
  });
}

function normalizeOpeningHandDropZone(zone) {
  if (zone === "material") {
    return "memory";
  }
  return zone;
}

function createOpeningHandPileButton({
  count,
  datasetKey,
  className,
  ariaLabel,
  emptyLabel,
}) {
  const pile = document.createElement("button");
  pile.type = "button";
  pile.className = className;
  pile.dataset[datasetKey] = "true";
  pile.disabled = count === 0;
  pile.setAttribute("aria-label", count ? ariaLabel : emptyLabel);

  const stack = document.createElement("span");
  stack.className = "opening-hand-deck-stack";
  stack.setAttribute("aria-hidden", "true");
  for (let layer = 0; layer < Math.min(4, count); layer += 1) {
    const back = document.createElement("span");
    back.className = "opening-hand-card-back";
    back.style.setProperty("--stack-offset", `${layer * 2}px`);
    stack.append(back);
  }

  const countEl = document.createElement("span");
  countEl.className = "opening-hand-deck-count";
  countEl.textContent = String(count);

  pile.append(stack, countEl);
  return pile;
}

function renderOpeningHandContents(board) {
  const field = board.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }

  layoutOpeningHandZones(field);
  field
    .querySelectorAll(
      "[data-oh-card], [data-oh-deck-pile], [data-oh-material-pile], [data-oh-extras-button], [data-oh-hand-count]",
    )
    .forEach((node) => node.remove());

  dedupeOpeningHandEntries();
  const hideHandCards = board.dataset.mpHideHand === "true";
  const handFacedown = board.dataset.mpHandFacedown === "true";
  const readonly = board.dataset.mpReadonly === "true";
  state.openingHandHand.forEach((entry, index) => {
    const zone = entry.zone || "hand";
    if (hideHandCards && zone === "hand") {
      return;
    }
    const renderEntry =
      handFacedown && zone === "hand" ? { ...entry, facedown: true, rotated: false } : entry;
    field.append(createOpeningHandCard(renderEntry, index, field, { readonly }));
  });

  const pile = createOpeningHandPileButton({
    count: state.openingHandLibrary.length,
    datasetKey: "ohDeckPile",
    className: "opening-hand-deck-pile",
    ariaLabel: `Draw from deck (${state.openingHandLibrary.length} left). Tap for Hand; drag to Field, Graveyard, Memory, or Hand.`,
    emptyLabel: "Deck is empty",
  });
  if (readonly) {
    pile.disabled = true;
  }

  const materialPile = createOpeningHandPileButton({
    count: state.openingHandMaterial.length,
    datasetKey: "ohMaterialPile",
    className: "opening-hand-deck-pile opening-hand-material-pile",
    ariaLabel: `Open Material Deck (${state.openingHandMaterial.length} left)`,
    emptyLabel: "Material Deck is empty",
  });
  if (!readonly) {
    materialPile.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMaterialDialog(board);
    });
  } else {
    materialPile.disabled = true;
  }

  const handCount = document.createElement("span");
  handCount.className = "opening-hand-hand-count";
  handCount.dataset.ohHandCount = "true";
  handCount.setAttribute("aria-label", "Cards in hand");

  const extrasButton = document.createElement("button");
  extrasButton.type = "button";
  extrasButton.className = "opening-hand-extras-button";
  extrasButton.dataset.ohExtrasButton = "true";
  extrasButton.dataset.openExtras = "true";
  extrasButton.setAttribute("aria-label", "Add Token or Mastery cards to the Field");
  extrasButton.innerHTML = `<span class="opening-hand-extras-button-label">Tokens</span><span class="opening-hand-extras-button-sub">Mastery</span>`;
  if (readonly) {
    extrasButton.disabled = true;
  } else {
    extrasButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openExtrasDialog(board);
    });
  }

  field.append(pile, materialPile, extrasButton, handCount);
  positionOpeningHandDeckPile(board);
  positionOpeningHandMaterialPile(board);
  positionOpeningHandExtrasButton(board);
  positionOpeningHandHandCount(board);
  updateOpeningHandCounts(board);
  if (!readonly) {
    enableOpeningHandDeckDrag(pile, board);
  }
}

function positionOpeningHandDeckPile(board) {
  const field = board.querySelector("[data-oh-field]");
  const pile = board.querySelector("[data-oh-deck-pile]");
  if (!field || !pile) {
    return;
  }
  layoutOpeningHandZones(field);
  const anchor = getOpeningHandDeckAnchor(field);
  pile.style.left = `${anchor.x}px`;
  pile.style.top = `${anchor.y}px`;
}

function positionOpeningHandMaterialPile(board) {
  const field = board.querySelector("[data-oh-field]");
  const pile = board.querySelector("[data-oh-material-pile]");
  if (!field || !pile) {
    return;
  }
  layoutOpeningHandZones(field);
  const anchor = getOpeningHandMaterialAnchor(field);
  pile.style.left = `${anchor.x}px`;
  pile.style.top = `${anchor.y}px`;
}

function dedupeOpeningHandEntries() {
  const seen = new Set();
  state.openingHandHand = state.openingHandHand.filter((entry) => {
    if (!entry?.instanceId || seen.has(entry.instanceId)) {
      return false;
    }
    seen.add(entry.instanceId);
    return true;
  });
}

function countOpeningHandZoneCards(zoneName = "hand") {
  dedupeOpeningHandEntries();
  return state.openingHandHand.filter((entry) => {
    const zone = entry.zone || "hand";
    return zone === zoneName;
  }).length;
}

function getActiveOpeningHandBoard() {
  const boards = [...document.querySelectorAll("[data-opening-hand-board]")];
  return (
    boards.find(
      (board) =>
        board.dataset.mpReadonly !== "true" && board.getClientRects().length > 0,
    ) ||
    boards.find((board) => board.getClientRects().length > 0) ||
    boards[0] ||
    null
  );
}

function positionOpeningHandHandCount(board) {
  const field = board?.querySelector("[data-oh-field]");
  const countEl = board?.querySelector("[data-oh-hand-count]");
  if (!field || !countEl) {
    return;
  }
  const zones = getOpeningHandZones(field);
  countEl.style.left = `${zones.mainLeft + 10}px`;
  countEl.style.top = `${zones.handBottom - 34}px`;
}

function updateOpeningHandCounts(board) {
  if (!board) {
    return;
  }
  const deckPile = board.querySelector("[data-oh-deck-pile]");
  const deckCount = deckPile?.querySelector(".opening-hand-deck-count");
  if (deckCount) {
    deckCount.textContent = String(state.openingHandLibrary.length);
  }
  if (deckPile) {
    deckPile.disabled = state.openingHandLibrary.length === 0;
  }

  const materialPile = board.querySelector("[data-oh-material-pile]");
  const materialCount = materialPile?.querySelector(".opening-hand-deck-count");
  if (materialCount) {
    materialCount.textContent = String(state.openingHandMaterial.length);
  }
  if (materialPile) {
    materialPile.disabled = state.openingHandMaterial.length === 0;
    materialPile.setAttribute(
      "aria-label",
      state.openingHandMaterial.length
        ? `Open Material Deck (${state.openingHandMaterial.length} left)`
        : "Material Deck is empty",
    );
    const stack = materialPile.querySelector(".opening-hand-deck-stack");
    if (stack) {
      stack.replaceChildren();
      for (
        let layer = 0;
        layer < Math.min(4, state.openingHandMaterial.length);
        layer += 1
      ) {
        const back = document.createElement("span");
        back.className = "opening-hand-card-back";
        back.style.setProperty("--stack-offset", `${layer * 2}px`);
        stack.append(back);
      }
    }
  }

  const handCount = board.querySelector("[data-oh-hand-count]");
  if (handCount) {
    const total = countOpeningHandZoneCards("hand");
    handCount.textContent = String(total);
    handCount.setAttribute("aria-label", `${total} card${total === 1 ? "" : "s"} in hand`);
  }
  positionOpeningHandHandCount(board);
  positionOpeningHandMaterialPile(board);
}

function createOpeningHandCard(entry, index, field = null, { readonly = false } = {}) {
  const item = document.createElement("article");
  item.className = "deck-grid-card deck-freehand-card opening-hand-card";
  item.dataset.ohCard = entry.instanceId;
  item.title = entry.card.name;

  const position = entry.position || getOpeningHandSlot(index, field);
  entry.position = position;
  item.style.left = `${position.x}px`;
  item.style.top = `${position.y}px`;
  item.style.zIndex = String(position.z || index + 1);
  item.style.width = `${FREEHAND_CARD_WIDTH}px`;
  item.style.height = `${FREEHAND_CARD_HEIGHT}px`;

  const imageWrap = document.createElement("div");
  imageWrap.className = "deck-grid-card-image";
  const imageUrl = getImageUrl(resolveCardImage(entry.card));
  if (imageUrl) {
    const image = document.createElement("img");
    image.draggable = false;
    image.loading = readonly ? "eager" : "lazy";
    image.src = imageUrl;
    image.alt = entry.card?.name || "Card";
    image.onerror = () => {
      image.remove();
      imageWrap.textContent = String(entry.card?.name || "??").slice(0, 2).toUpperCase();
    };
    imageWrap.append(image);
  } else {
    imageWrap.textContent = String(entry.card?.name || "??").slice(0, 2).toUpperCase();
  }

  item.append(imageWrap);
  applyOpeningHandCardFace(item, entry);
  applyOpeningHandCardRotation(item, entry);
  applyOpeningHandCardBuff(item, entry);
  if (!readonly) {
    enableOpeningHandCardDrag(item, entry);
  } else {
    enableTableCardHoldPreview(item, entry);
  }
  return item;
}

function normalizeOpeningHandBuff(value) {
  const next = Math.trunc(Number(value));
  if (!Number.isFinite(next)) {
    return 0;
  }
  return Math.max(0, Math.min(99, next));
}

function applyOpeningHandCardBuff(cardEl, entry) {
  if (!cardEl || !entry) {
    return;
  }
  const buff = normalizeOpeningHandBuff(entry.buff);
  entry.buff = buff;
  let badge = cardEl.querySelector("[data-oh-card-buff]");
  if (buff <= 0) {
    badge?.remove();
    cardEl.classList.remove("has-buff");
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "opening-hand-card-buff";
    badge.dataset.ohCardBuff = "true";
    badge.setAttribute("aria-hidden", "true");
    cardEl.append(badge);
  }
  badge.textContent = `+${buff}`;
  cardEl.classList.add("has-buff");
  cardEl.setAttribute("aria-label", `${entry.card?.name || "Card"}, buff +${buff}`);
}

function adjustOpeningHandCardBuff(cardEl, entry, delta = 1) {
  if (!entry) {
    return;
  }
  entry.buff = normalizeOpeningHandBuff(normalizeOpeningHandBuff(entry.buff) + Number(delta || 0));
  if (cardEl) {
    applyOpeningHandCardBuff(cardEl, entry);
  }
  queueMultiplayerSeatPublish();
}

function applyOpeningHandCardFace(cardEl, entry) {
  const facedown = Boolean(entry.facedown);
  cardEl.classList.toggle("is-facedown", facedown);
  cardEl.dataset.ohFacedown = facedown ? "true" : "false";
  const image = cardEl.querySelector("img");
  if (image) {
    image.alt = facedown ? "Face-down card" : entry.card.name;
  }
  const tableBoard = cardEl.closest("[data-opening-hand-board][data-mp-readonly='true']");
  if (tableBoard) {
    cardEl.title = facedown
      ? "Double-click or hold 1s to reveal card"
      : `${entry.card?.name || "Card"} — double-click or hold 1s to enlarge`;
    return;
  }
  const zone = entry.zone || "hand";
  const zoneLabel =
    zone === "field"
      ? "Field"
      : zone === "champion"
        ? "Champion"
        : zone === "memory"
          ? "Memory"
          : zone === "hand"
            ? "Hand"
            : zone === "graveyard"
              ? "Graveyard"
              : zone === "banishment"
                ? "Banishment"
                : "Board";
  cardEl.title = facedown
    ? `Face-down (${zoneLabel}) — double-tap for actions`
    : zone === "graveyard"
      ? `${entry.card?.name || "Card"} — hold to browse Graveyard`
      : `${entry.card?.name || "Card"} — double-tap for actions`;
}

function setOpeningHandCardFacedown(cardEl, entry, facedown) {
  const next = Boolean(facedown);
  if (Boolean(entry.facedown) === next) {
    applyOpeningHandCardFace(cardEl, entry);
    return;
  }
  entry.facedown = next;
  applyOpeningHandCardFace(cardEl, entry);
}

function toggleOpeningHandCardFace(cardEl, entry) {
  if (!cardEl || !entry) {
    return;
  }
  const zone = entry.zone || "hand";
  if (zone !== "field" && zone !== "memory" && zone !== "champion") {
    return;
  }
  if (cardEl.classList.contains("is-face-flipping")) {
    return;
  }

  const nextFacedown = !entry.facedown;
  const imageWrap = cardEl.querySelector(".deck-grid-card-image");
  const halfMs = Math.round(OPENING_HAND_FACE_FLIP_MS / 2);

  cardEl.classList.add("is-face-flipping");
  imageWrap?.classList.add("is-face-flipping");

  window.setTimeout(() => {
    entry.facedown = nextFacedown;
    applyOpeningHandCardFace(cardEl, entry);
    queueMultiplayerSeatPublish();
  }, halfMs);

  window.setTimeout(() => {
    cardEl.classList.remove("is-face-flipping");
    imageWrap?.classList.remove("is-face-flipping");
  }, OPENING_HAND_FACE_FLIP_MS);
}

function applyOpeningHandCardRotation(cardEl, entry) {
  if (!cardEl || !entry) {
    return;
  }
  const zone = entry.zone || "hand";
  const canRest = zone === "field" || zone === "champion";
  const rotated = Boolean(entry.rotated) && canRest;
  entry.rotated = rotated;
  cardEl.classList.toggle("is-rotated", rotated);
  cardEl.dataset.ohRotated = rotated ? "true" : "false";
  if (!cardEl.classList.contains("opening-hand-card-dealing") && !cardEl.classList.contains("dragging")) {
    cardEl.style.transform = rotated ? "rotate(90deg)" : "";
  }
}

function canRestOpeningHandCard(zone) {
  return zone === "field" || zone === "champion";
}

function canFlipOpeningHandCard(zone) {
  return zone === "field" || zone === "memory" || zone === "champion";
}

function toggleOpeningHandCardRotation(cardEl, entry) {
  if (!cardEl || !entry || !canRestOpeningHandCard(entry.zone || "hand")) {
    return;
  }
  entry.rotated = !entry.rotated;
  applyOpeningHandCardRotation(cardEl, entry);
  const board = cardEl.closest("[data-opening-hand-board]");
  const field = cardEl.closest("[data-oh-field]");
  if (field) {
    constrainOpeningHandEntryToZone(field, entry);
    applyOpeningHandCardPosition(cardEl, entry);
  }
  void board;
  queueMultiplayerSeatPublish();
}

function getOpeningHandRowCardTop(zoneTop, zoneBottom) {
  return zoneTop + Math.max(0, (zoneBottom - zoneTop - FREEHAND_CARD_HEIGHT) / 2);
}

function getOpeningHandRowLayout(field, count, { mode = "spread" } = {}) {
  const zones = getOpeningHandZones(field);
  const pad = OPENING_HAND_ROW_PAD / 2;
  const column = getOpeningHandMainColumnBounds(field);
  const innerLeft = column.mainLeft + pad;
  const innerRight = column.mainRight - pad;
  const usable = Math.max(FREEHAND_CARD_WIDTH, innerRight - innerLeft);
  const y = getOpeningHandRowCardTop(zones.handTop, zones.handBottom);
  const safeCount = Math.max(1, count);
  if (safeCount <= 1) {
    return {
      startX: innerLeft + Math.max(0, (usable - FREEHAND_CARD_WIDTH) / 2),
      step: 0,
      y,
    };
  }

  if (mode === "snap") {
    // Cards touch left/right edges. Center the row; overlap only if they can't fit.
    const packedWidth = safeCount * FREEHAND_CARD_WIDTH;
    if (packedWidth <= usable) {
      return {
        startX: innerLeft + (usable - packedWidth) / 2,
        step: FREEHAND_CARD_WIDTH,
        y,
      };
    }
    const overlapStep = (usable - FREEHAND_CARD_WIDTH) / (safeCount - 1);
    return {
      startX: innerLeft,
      step: Number.isFinite(overlapStep) ? Math.max(0, overlapStep) : 0,
      y,
    };
  }

  // Spread evenly across the full Hand width.
  const step = (usable - FREEHAND_CARD_WIDTH) / (safeCount - 1);
  return {
    startX: innerLeft,
    step: Number.isFinite(step) ? Math.max(0, step) : 0,
    y,
  };
}

function getOpeningHandDealSlot(index, field = null) {
  const layout = getOpeningHandRowLayout(field, OPENING_HAND_SIZE);
  return {
    x: layout.startX + index * layout.step,
    y: layout.y,
    z: index + 1,
  };
}

function getOpeningHandFieldSlot(field, index = 0) {
  const zones = getOpeningHandZones(field);
  const pad = OPENING_HAND_ROW_PAD / 2;
  // Field is the center column; Champion owns the left rail above Material.
  const innerLeft = zones.memoryLeft + pad;
  const usable = Math.max(FREEHAND_CARD_WIDTH, zones.mainRight - pad - innerLeft);
  const centerX = innerLeft + Math.max(0, (usable - FREEHAND_CARD_WIDTH) / 2);
  const offset = index * 18;
  return {
    x: centerX + offset,
    y: getOpeningHandRowCardTop(zones.fieldTop, zones.fieldBottom),
    z: 20 + index,
  };
}

function getOpeningHandChampionSlot(field, index = 0) {
  const zones = getOpeningHandZones(field);
  const top = zones.championTop ?? zones.fieldTop;
  const bottom = zones.championBottom ?? zones.fieldBottom;
  const baseY = getOpeningHandRowCardTop(top, bottom);
  const maxY = Math.max(baseY, bottom - FREEHAND_CARD_HEIGHT - 4);
  return {
    x:
      zones.leftRailLeft +
      Math.max(0, (zones.leftRailWidth - FREEHAND_CARD_WIDTH) / 2) +
      Math.min(index * 3, 10),
    y: Math.min(maxY, baseY + index * 14),
    z: 30 + index,
  };
}

function restackOpeningHandChampionCards(board) {
  const field = board?.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }
  layoutOpeningHandZones(field);
  const entries = state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === "champion")
    .sort((left, right) => (left.position?.z || 0) - (right.position?.z || 0));
  entries.forEach((entry, index) => {
    entry.zone = "champion";
    // Keep face and rest state while restacking champion cards.
    entry.position = getOpeningHandChampionSlot(field, index);
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (!cardEl) {
      return;
    }
    applyOpeningHandCardPosition(cardEl, entry);
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
  });
}

function closeMaterialDialog({ force = false } = {}) {
  if (!force && state.openingHandAwaitingSpirit) {
    return;
  }
  if (!materialDialog?.open) {
    return;
  }
  materialDialog.close();
}

function updateMaterialDialogChrome() {
  const awaiting = Boolean(state.openingHandAwaitingSpirit);
  materialDialog?.classList.toggle("is-spirit-select", awaiting);
  if (closeMaterialDialogButton) {
    closeMaterialDialogButton.hidden = awaiting;
  }
  if (materialDialogTitle) {
    materialDialogTitle.textContent = awaiting ? "Choose your Spirit" : "Material Deck";
  }
  if (materialDialogHint) {
    materialDialogHint.textContent = awaiting
      ? "Play a Spirit champion (Level 0) from Material to start the game. Champions go to the Champion area."
      : "Choose a card from Material. Champions and Spirits go to the Champion area; other material goes to Field.";
  }
}

function openMaterialDialog(board = null) {
  if (!materialDialog || !materialDialogGrid) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  materialDialog.dataset.ohBoardBound = playBoard ? "true" : "false";
  updateMaterialDialogChrome();
  renderMaterialDialogGrid(playBoard);
  if (!materialDialog.open) {
    materialDialog.showModal();
  }
}

function getMaterialDialogEntries() {
  const entries = state.openingHandMaterial || [];
  if (!state.openingHandAwaitingSpirit) {
    return entries;
  }
  return entries.filter((entry) => isSpiritChampionCard(entry.card));
}

function renderMaterialDialogGrid(board = null) {
  if (!materialDialogGrid || !materialDialogEmpty) {
    return;
  }
  materialDialogGrid.replaceChildren();
  updateMaterialDialogChrome();
  const entries = getMaterialDialogEntries();
  materialDialogEmpty.hidden = entries.length > 0;
  if (materialDialogEmpty) {
    materialDialogEmpty.textContent = state.openingHandAwaitingSpirit
      ? "No Spirit champions left in Material."
      : "No material cards left.";
  }
  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "material-dialog-card";
    item.dataset.materialInstanceId = entry.instanceId;

    const imageWrap = document.createElement("div");
    imageWrap.className = "material-dialog-card-image";
    const imageUrl = getImageUrl(resolveCardImage(entry.card));
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = entry.card.name || "Material card";
      image.loading = "lazy";
      image.draggable = false;
      imageWrap.append(image);
    }

    const name = document.createElement("p");
    name.className = "material-dialog-card-name";
    name.textContent = entry.card.name || "Unknown card";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "material-dialog-play";
    playButton.dataset.playMaterial = entry.instanceId;
    playButton.textContent = state.openingHandAwaitingSpirit ? "Play Spirit" : "Play";

    item.append(imageWrap, name, playButton);
    materialDialogGrid.append(item);
  });

  materialDialogGrid.onclick = async (event) => {
    const playButton = event.target.closest("[data-play-material]");
    if (!playButton) {
      return;
    }
    event.preventDefault();
    const instanceId = playButton.dataset.playMaterial;
    const playBoard = board || getActiveOpeningHandBoard();
    await playOpeningHandMaterialCard(playBoard, instanceId);
  };
}

async function playOpeningHandMaterialCard(board, instanceId) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field || !instanceId) {
    return;
  }

  const index = state.openingHandMaterial.findIndex(
    (entry) => entry.instanceId === instanceId,
  );
  if (index < 0) {
    return;
  }

  const source = state.openingHandMaterial[index];
  if (state.openingHandAwaitingSpirit && !isSpiritChampionCard(source.card)) {
    showTryItToast("Choose a Spirit champion (Level 0)");
    return;
  }

  state.openingHandMaterial.splice(index, 1);
  const toChampion = isChampionAreaCard(source.card);
  const targetZone = toChampion ? "champion" : "field";
  const stackIndex = countOpeningHandZoneCards(targetZone);
  const position = toChampion
    ? getOpeningHandChampionSlot(field, stackIndex)
    : getOpeningHandFieldSlot(field, stackIndex);
  const entry = {
    ...source,
    position,
    facedown: false,
    rotated: false,
    zone: targetZone,
  };
  state.openingHandHand.push(entry);

  if (state.openingHandAwaitingSpirit && isSpiritChampionCard(source.card)) {
    state.openingHandAwaitingSpirit = false;
  }
  closeMaterialDialog({ force: true });

  const cardEl = createOpeningHandCard(entry, state.openingHandHand.length - 1, field);
  field.append(cardEl);
  updateOpeningHandMaterialPile(playBoard);
  updateOpeningHandCounts(playBoard);

  const materialAnchor = getOpeningHandMaterialAnchor(field);
  cardEl.classList.add("opening-hand-card-dealing");
  cardEl.style.left = `${materialAnchor.x}px`;
  cardEl.style.top = `${materialAnchor.y}px`;
  cardEl.style.opacity = "0.4";
  cardEl.style.transform = "scale(0.86) rotate(-6deg)";
  await delay(20);
  applyOpeningHandCardPosition(cardEl, entry);
  cardEl.style.opacity = "1";
  cardEl.style.transform = "scale(1) rotate(0deg)";
  await delay(220);
  cardEl.classList.remove("opening-hand-card-dealing");
  if (toChampion) {
    restackOpeningHandChampionCards(playBoard);
  }
  resizeOpeningHandField(playBoard);
  queueMultiplayerSeatPublish();
}

/** Level 0 champions (Spirits) used to start a Grand Archive game. */
function isSpiritChampionCard(card) {
  if (!card) {
    return false;
  }
  if (isChampionCard(card) && Number(card.level) === 0) {
    return true;
  }
  const types = (card.types || []).map((type) => String(type).toUpperCase());
  const subtypes = (card.subtypes || []).map((type) => String(type).toUpperCase());
  return types.includes("SPIRIT") || subtypes.includes("SPIRIT");
}

function requireOpeningHandSpiritChosen() {
  if (!state.openingHandAwaitingSpirit) {
    return true;
  }
  openMaterialDialog(getActiveOpeningHandBoard());
  showTryItToast("Choose your Spirit champion first");
  return false;
}

function promptOpeningHandSpiritSelect(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const spirits = (state.openingHandMaterial || []).filter((entry) =>
    isSpiritChampionCard(entry.card),
  );
  if (spirits.length === 0) {
    state.openingHandAwaitingSpirit = false;
    showTryItToast("No Spirit in Material — continuing without one");
    return;
  }
  state.openingHandAwaitingSpirit = true;
  openMaterialDialog(playBoard);
}

function positionOpeningHandExtrasButton(board) {
  const field = board?.querySelector("[data-oh-field]");
  const button = board?.querySelector("[data-oh-extras-button]");
  if (!field || !button) {
    return;
  }
  layoutOpeningHandZones(field);
  const zones = getOpeningHandZones(field);
  const width = Math.min(88, Math.max(64, zones.leftRailWidth - 4));
  const x = zones.leftRailLeft + Math.max(0, (zones.leftRailWidth - width) / 2);
  // Sit just above the Material pile in the left rail.
  const y = Math.max(zones.materialTop - 44, zones.memoryTop + 4);
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.width = `${width}px`;
}

function closeExtrasDialog() {
  if (!extrasDialog?.open) {
    return;
  }
  extrasDialog.close();
}

function closeGraveyardDialog() {
  if (!graveyardDialog?.open) {
    return;
  }
  graveyardDialog.close();
}

function openGraveyardDialog(board = null) {
  if (!graveyardDialog || !graveyardDialogGrid) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  if (!playBoard || playBoard.dataset.mpReadonly === "true") {
    return;
  }
  closeOpeningHandCardMenu();
  renderGraveyardDialogGrid(playBoard);
  if (!graveyardDialog.open) {
    graveyardDialog.showModal();
  }
}

/** Hold ~1s on the Graveyard zone to browse / banish (replaces double-tap-on-card). */
function enableOpeningHandGraveyardHold(board) {
  if (!board || board.dataset.mpReadonly === "true") {
    return;
  }
  const zone = board.querySelector('[data-oh-zone="graveyard"]');
  if (!zone || zone.dataset.ohGyHoldBound === "1") {
    return;
  }
  zone.dataset.ohGyHoldBound = "1";
  zone.classList.add("is-hold-target");
  zone.setAttribute("role", "button");
  zone.setAttribute("aria-label", "Hold to browse graveyard");
  zone.removeAttribute("aria-hidden");

  let pointerId = null;
  let holdTimer = null;
  let originX = 0;
  let originY = 0;

  const clearHoldTimer = () => {
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const cleanup = (event) => {
    if (pointerId != null && event?.pointerId != null && pointerId !== event.pointerId) {
      return;
    }
    clearHoldTimer();
    zone.classList.remove("is-holding");
    try {
      if (event?.pointerId != null) {
        zone.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    pointerId = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", cleanup);
    window.removeEventListener("pointercancel", cleanup);
  };

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    if (Math.hypot(event.clientX - originX, event.clientY - originY) > 10) {
      cleanup(event);
    }
  };

  zone.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) {
      return;
    }
    // Cards stacked in GY capture their own holds; zone covers empty gaps.
    if (event.target.closest?.("[data-oh-card]")) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    pointerId = event.pointerId;
    originX = event.clientX;
    originY = event.clientY;
    zone.classList.add("is-holding");
    try {
      zone.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    clearHoldTimer();
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      zone.classList.remove("is-holding");
      pointerId = null;
      openGraveyardDialog(board);
    }, TABLE_HOLD_PREVIEW_MS);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", cleanup);
    window.addEventListener("pointercancel", cleanup);
  });
}

function getOpeningHandGraveyardEntries() {
  return state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === "graveyard")
    .sort((left, right) => (left.position?.z || 0) - (right.position?.z || 0));
}

function renderGraveyardDialogGrid(board = null) {
  if (!graveyardDialogGrid || !graveyardDialogEmpty) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  const entries = getOpeningHandGraveyardEntries();
  const title = document.querySelector("#graveyard-dialog-title");
  if (title) {
    title.textContent = `Graveyard (${entries.length})`;
  }
  graveyardDialogGrid.replaceChildren();
  graveyardDialogEmpty.hidden = entries.length > 0;

  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "material-dialog-card";
    item.dataset.gyInstanceId = entry.instanceId;

    const imageWrap = document.createElement("div");
    imageWrap.className = "material-dialog-card-image";
    const imageUrl = getImageUrl(resolveCardImage(entry.card));
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = entry.card?.name || "Graveyard card";
      image.loading = "lazy";
      image.draggable = false;
      imageWrap.append(image);
    }

    const name = document.createElement("p");
    name.className = "material-dialog-card-name";
    name.textContent = entry.card?.name || "Unknown card";

    const actions = document.createElement("div");
    actions.className = "gy-dialog-card-actions";

    const peekButton = document.createElement("button");
    peekButton.type = "button";
    peekButton.className = "ghost compact";
    peekButton.textContent = "Info";
    peekButton.addEventListener("click", (event) => {
      event.preventDefault();
      showOpeningHandCardPreview(entry, { revealFacedown: true });
    });

    const banishButton = document.createElement("button");
    banishButton.type = "button";
    banishButton.className = "material-dialog-play";
    banishButton.dataset.gyBanish = entry.instanceId;
    banishButton.textContent = "Banish";

    actions.append(peekButton, banishButton);
    item.append(imageWrap, name, actions);
    graveyardDialogGrid.append(item);
  });

  void playBoard;
}

async function banishOpeningHandGraveyardCard(instanceId) {
  const playBoard = getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field || !instanceId) {
    return;
  }
  const entry = state.openingHandHand.find(
    (item) => item.instanceId === instanceId && (item.zone || "hand") === "graveyard",
  );
  if (!entry) {
    return;
  }
  const cardEl = findOpeningHandCardElement(field, entry.instanceId);
  await moveOpeningHandCardToZone(playBoard, entry, cardEl, "banishment");
  showTryItToast(`Banished ${entry.card?.name || "card"}`);
  renderGraveyardDialogGrid(playBoard);
  if (getOpeningHandGraveyardEntries().length === 0) {
    closeGraveyardDialog();
  }
}

function closeGlimpseDialog() {
  if (!glimpseDialog?.open) {
    return;
  }
  clearGlimpseReveal();
  glimpseDialog.close();
}

function openGlimpseDialog(board = null) {
  if (!glimpseDialog) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  if (!playBoard || playBoard.dataset.mpReadonly === "true") {
    return;
  }
  if (state.openingHandAwaitingSpirit) {
    requireOpeningHandSpiritChosen();
    return;
  }
  if (state.openingHandLibrary.length === 0) {
    showTryItToast("Deck is empty");
    return;
  }
  closeOpeningHandCardMenu();
  clearGlimpseReveal();
  if (glimpseCountInput) {
    glimpseCountInput.value = "";
    glimpseCountInput.max = String(state.openingHandLibrary.length);
  }
  renderGlimpseDialog();
  if (!glimpseDialog.open) {
    glimpseDialog.showModal();
  }
  window.setTimeout(() => {
    glimpseCountInput?.focus();
    glimpseCountInput?.select?.();
  }, 0);
}

function clearGlimpseReveal() {
  state.openingHandGlimpseIds = [];
}

function applyGlimpseCountFromInput() {
  const librarySize = state.openingHandLibrary.length;
  if (librarySize === 0) {
    showTryItToast("Deck is empty");
    closeGlimpseDialog();
    return;
  }
  const raw = Number.parseInt(String(glimpseCountInput?.value || "").trim(), 10);
  if (!Number.isFinite(raw) || raw < 1) {
    showTryItToast("Enter how many cards to glimpse");
    glimpseCountInput?.focus();
    return;
  }
  const count = Math.min(librarySize, Math.max(1, raw));
  if (glimpseCountInput) {
    glimpseCountInput.value = String(count);
  }
  state.openingHandGlimpseIds = state.openingHandLibrary
    .slice(0, count)
    .map((entry) => entry.instanceId);
  renderGlimpseDialog();
  showTryItToast(
    count === 1 ? "Glimpsed 1 card" : `Glimpsed ${count} cards`,
  );
}

function renderGlimpseDialog() {
  if (!glimpseCardsGrid) {
    return;
  }
  const library = state.openingHandLibrary || [];
  const glimpseIds = Array.isArray(state.openingHandGlimpseIds)
    ? state.openingHandGlimpseIds.filter((id) =>
        library.some((entry) => entry.instanceId === id),
      )
    : [];
  state.openingHandGlimpseIds = glimpseIds;

  if (glimpseCountInput) {
    glimpseCountInput.max = String(Math.max(1, library.length));
  }

  glimpseCardsGrid.replaceChildren();
  if (glimpseCardsEmpty) {
    glimpseCardsEmpty.hidden = glimpseIds.length > 0;
  }

  glimpseIds.forEach((instanceId, index) => {
    const entry = library.find((item) => item.instanceId === instanceId);
    if (!entry) {
      return;
    }
    const item = document.createElement("article");
    item.className = "glimpse-card";
    item.dataset.glimpseInstanceId = instanceId;

    const imageWrap = document.createElement("div");
    imageWrap.className = "glimpse-card-image";
    const imageUrl = getImageUrl(resolveCardImage(entry.card));
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = entry.card?.name || "Glimpsed card";
      image.loading = "lazy";
      image.draggable = false;
      imageWrap.append(image);
    }

    const name = document.createElement("p");
    name.className = "glimpse-card-name";
    name.textContent = entry.card?.name || "Unknown card";

    const meta = document.createElement("p");
    meta.className = "glimpse-card-meta";
    meta.textContent = index === 0 ? "From top" : `#${index + 1}`;

    const actions = document.createElement("div");
    actions.className = "glimpse-card-actions";

    const topButton = document.createElement("button");
    topButton.type = "button";
    topButton.className = "secondary compact";
    topButton.dataset.glimpseTop = instanceId;
    topButton.textContent = "TOP";

    const bottomButton = document.createElement("button");
    bottomButton.type = "button";
    bottomButton.className = "secondary compact";
    bottomButton.dataset.glimpseBottom = instanceId;
    bottomButton.textContent = "BOTTOM";

    actions.append(topButton, bottomButton);
    item.append(imageWrap, name, meta, actions);
    glimpseCardsGrid.append(item);
  });

  renderGlimpseDeckPile();
}

function renderGlimpseDeckPile() {
  const librarySize = state.openingHandLibrary.length;
  if (glimpseDeckCount) {
    glimpseDeckCount.textContent = String(librarySize);
  }
  if (!glimpseDeckStack) {
    return;
  }
  glimpseDeckStack.replaceChildren();
  const layers = Math.min(4, librarySize);
  for (let layer = 0; layer < layers; layer += 1) {
    const back = document.createElement("span");
    back.className = "opening-hand-card-back glimpse-deck-card-back";
    back.style.setProperty("--stack-offset", `${layer * 2}px`);
    glimpseDeckStack.append(back);
  }
}

function finishGlimpseCard(instanceId, placement = "top") {
  if (!instanceId) {
    return;
  }
  const index = state.openingHandLibrary.findIndex((entry) => entry.instanceId === instanceId);
  if (index < 0) {
    state.openingHandGlimpseIds = state.openingHandGlimpseIds.filter((id) => id !== instanceId);
    renderGlimpseDialog();
    return;
  }
  const [entry] = state.openingHandLibrary.splice(index, 1);
  if (placement === "top") {
    state.openingHandLibrary.unshift(entry);
  } else {
    state.openingHandLibrary.push(entry);
  }
  state.openingHandGlimpseIds = state.openingHandGlimpseIds.filter((id) => id !== instanceId);
  const playBoard = getActiveOpeningHandBoard();
  updateOpeningHandDeckPile(playBoard);
  queueMultiplayerSeatPublish();
  showTryItToast(
    placement === "top"
      ? `${entry.card?.name || "Card"} → TOP`
      : `${entry.card?.name || "Card"} → BOTTOM`,
  );
  renderGlimpseDialog();
  if (state.openingHandLibrary.length === 0) {
    closeGlimpseDialog();
  }
}

function openOpeningHandDeckMenu(pileEl, board) {
  closeOpeningHandCardMenu();
  if (!pileEl || !board || board.dataset.mpReadonly === "true") {
    return;
  }
  if (state.openingHandAwaitingSpirit) {
    requireOpeningHandSpiritChosen();
    return;
  }
  if (state.openingHandLibrary.length === 0) {
    showTryItToast("Deck is empty");
    return;
  }

  const menu = document.createElement("div");
  menu.className = "opening-hand-card-menu";
  menu.dataset.ohDeckMenu = "true";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Deck actions");

  const addAction = (label, action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "opening-hand-card-menu-item";
    button.setAttribute("role", "menuitem");
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeOpeningHandCardMenu();
      void action();
    });
    menu.append(button);
  };

  addAction("Glimpse", () => openGlimpseDialog(board));
  addAction("Close", () => {});

  pileEl.classList.add("is-menu-open");
  document.body.append(menu);

  const rect = pileEl.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let left = rect.right + 8;
  let top = rect.top;
  if (left + menuRect.width > window.innerWidth - 8) {
    left = Math.max(8, rect.left - menuRect.width - 8);
  }
  if (top + menuRect.height > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - menuRect.height - 8);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function setExtrasDialogFilter(filter) {
  const next = ["all", "token", "mastery"].includes(filter) ? filter : "all";
  state.openingHandExtras.filter = next;
  extrasDialog?.querySelectorAll("[data-extras-filter]").forEach((button) => {
    const active = button.dataset.extrasFilter === next;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  renderExtrasDialogGrid(getActiveOpeningHandBoard());
}

async function ensureOpeningHandExtrasCatalog() {
  if (state.openingHandExtras.loaded || state.openingHandExtras.loading) {
    return state.openingHandExtras;
  }
  state.openingHandExtras.loading = true;
  state.openingHandExtras.error = "";
  if (extrasDialogStatus) {
    extrasDialogStatus.textContent = "Loading Tokens and Mastery cards…";
  }
  try {
    const [token, mastery] = await Promise.all([
      fetchAllCardsByType("TOKEN"),
      fetchAllCardsByType("MASTERY"),
    ]);
    state.openingHandExtras.token = token;
    state.openingHandExtras.mastery = mastery;
    state.openingHandExtras.loaded = true;
  } catch (error) {
    console.error(error);
    state.openingHandExtras.error = "Could not load Tokens / Mastery. Check your connection and try again.";
  } finally {
    state.openingHandExtras.loading = false;
  }
  return state.openingHandExtras;
}

async function fetchAllCardsByType(typeName) {
  const cards = [];
  let page = 1;
  while (page <= 12) {
    const params = new URLSearchParams({
      type: typeName,
      page: String(page),
      page_size: "50",
      sort: "name",
      order: "ASC",
    });
    const response = await fetch(`${API_BASE}/cards/search?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${typeName} cards`);
    }
    const payload = await response.json();
    const batch = payload.data || [];
    cards.push(...batch);
    const total = Number(payload.total ?? payload.total_cards ?? 0);
    if (!batch.length || (total > 0 && cards.length >= total) || batch.length < 50) {
      break;
    }
    page += 1;
  }
  // Stable unique by uuid/slug/name
  const seen = new Set();
  return cards.filter((card) => {
    const key = getCardKey(card);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function openExtrasDialog(board = null) {
  if (!extrasDialog || !extrasDialogGrid) {
    return;
  }
  if (!requireOpeningHandSpiritChosen()) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  extrasDialog.dataset.ohBoardBound = playBoard ? "true" : "false";
  if (extrasSearchInput && extrasSearchInput.value !== (state.openingHandExtras.query || "")) {
    extrasSearchInput.value = state.openingHandExtras.query || "";
  }
  setExtrasDialogFilter(state.openingHandExtras.filter || "all");
  if (!extrasDialog.open) {
    extrasDialog.showModal();
  }
  await ensureOpeningHandExtrasCatalog();
  renderExtrasDialogGrid(playBoard);
}

function getExtrasDialogCards() {
  const extras = state.openingHandExtras;
  let cards = [];
  if (extras.filter === "token") {
    cards = extras.token;
  } else if (extras.filter === "mastery") {
    cards = extras.mastery;
  } else {
    cards = [...extras.token, ...extras.mastery];
  }
  const query = String(extras.query || "").trim().toLowerCase();
  if (!query) {
    return cards;
  }
  return cards.filter((card) => String(card.name || "").toLowerCase().includes(query));
}

function extrasCardKind(card) {
  const types = (card?.types || []).map((value) => String(value).toUpperCase());
  if (types.includes("MASTERY")) {
    return "mastery";
  }
  if (types.includes("TOKEN")) {
    return "token";
  }
  return "extra";
}

function renderExtrasDialogGrid(board = null) {
  if (!extrasDialogGrid || !extrasDialogEmpty) {
    return;
  }
  extrasDialogGrid.replaceChildren();
  const extras = state.openingHandExtras;
  if (extras.loading && !extras.loaded) {
    if (extrasDialogStatus) {
      extrasDialogStatus.textContent = "Loading Tokens and Mastery cards…";
    }
    extrasDialogEmpty.hidden = true;
    return;
  }
  if (extras.error && !extras.loaded) {
    if (extrasDialogStatus) {
      extrasDialogStatus.textContent = extras.error;
    }
    extrasDialogEmpty.hidden = true;
    return;
  }

  const cards = getExtrasDialogCards();
  if (extrasDialogStatus) {
    const tokenCount = extras.token.length;
    const masteryCount = extras.mastery.length;
    extrasDialogStatus.textContent = `${cards.length} shown · ${tokenCount} Tokens · ${masteryCount} Mastery`;
  }
  extrasDialogEmpty.hidden = cards.length > 0;

  cards.forEach((card) => {
    const kind = extrasCardKind(card);
    const item = document.createElement("article");
    item.className = "material-dialog-card extras-dialog-card";
    item.dataset.extrasCardKey = getCardKey(card);
    item.dataset.extrasKind = kind;

    const imageWrap = document.createElement("div");
    imageWrap.className = "material-dialog-card-image";
    const imageUrl = getImageUrl(resolveCardImage(card));
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = card.name || "Card";
      image.loading = "lazy";
      image.draggable = false;
      imageWrap.append(image);
    }

    const badge = document.createElement("span");
    badge.className = `extras-card-badge extras-card-badge-${kind}`;
    badge.textContent = kind === "mastery" ? "Mastery" : "Token";

    const name = document.createElement("p");
    name.className = "material-dialog-card-name";
    name.textContent = card.name || "Unknown card";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "material-dialog-play";
    playButton.dataset.playExtra = getCardKey(card);
    playButton.dataset.playExtraKind = kind;
    playButton.textContent = "Add to Field";

    item.append(imageWrap, badge, name, playButton);
    extrasDialogGrid.append(item);
  });

  extrasDialogGrid.onclick = async (event) => {
    const playButton = event.target.closest("[data-play-extra]");
    if (!playButton) {
      return;
    }
    event.preventDefault();
    const key = playButton.dataset.playExtra;
    const kind = playButton.dataset.playExtraKind || "token";
    const card = [...state.openingHandExtras.token, ...state.openingHandExtras.mastery].find(
      (entry) => getCardKey(entry) === key,
    );
    if (!card) {
      return;
    }
    const playBoard = board || getActiveOpeningHandBoard();
    await playOpeningHandExtraCard(playBoard, card, kind);
  };
}

async function playOpeningHandExtraCard(board, card, kind = "token") {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field || !card) {
    return;
  }

  const toChampion = isChampionAreaCard(card);
  const targetZone = toChampion ? "champion" : "field";
  const stackIndex = countOpeningHandZoneCards(targetZone);
  const position = toChampion
    ? getOpeningHandChampionSlot(field, stackIndex)
    : getOpeningHandFieldSlot(field, stackIndex);
  const key = getCardKey(card);
  const entry = {
    card: {
      ...card,
      key,
    },
    instanceId: `extra-${kind}-${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    position,
    facedown: false,
    rotated: false,
    zone: targetZone,
    ephemeral: true,
    extraKind: kind,
  };
  state.openingHandHand.push(entry);

  // Keep the picker open so multiple tokens can be spawned quickly.
  const cardEl = createOpeningHandCard(entry, state.openingHandHand.length - 1, field);
  field.append(cardEl);
  updateOpeningHandCounts(playBoard);

  const extrasButton = playBoard.querySelector("[data-oh-extras-button]");
  const spawnX = extrasButton
    ? Number.parseFloat(extrasButton.style.left) || getOpeningHandMaterialAnchor(field).x
    : getOpeningHandMaterialAnchor(field).x;
  const spawnY = extrasButton
    ? Number.parseFloat(extrasButton.style.top) || getOpeningHandMaterialAnchor(field).y
    : getOpeningHandMaterialAnchor(field).y;
  cardEl.classList.add("opening-hand-card-dealing");
  cardEl.style.left = `${spawnX}px`;
  cardEl.style.top = `${spawnY}px`;
  cardEl.style.opacity = "0.4";
  cardEl.style.transform = "scale(0.86) rotate(-6deg)";
  await delay(20);
  applyOpeningHandCardPosition(cardEl, entry);
  cardEl.style.opacity = "1";
  cardEl.style.transform = "scale(1) rotate(0deg)";
  await delay(220);
  cardEl.classList.remove("opening-hand-card-dealing");
  if (toChampion) {
    restackOpeningHandChampionCards(playBoard);
  }
  resizeOpeningHandField(playBoard);
  queueMultiplayerSeatPublish();
  const kindLabel = kind === "mastery" ? "Mastery" : "Token";
  const cardName = card.name || "card";
  showTryItToast(`Added ${kindLabel}: ${cardName}`);
}

function showTryItToast(message = "Added", durationMs = 1600) {
  const toast = tryitToastEl;
  if (!toast) {
    return;
  }
  // <dialog showModal()> uses the browser top layer — page z-index cannot cover it.
  // Mount the toast inside the open dialog so it paints above the popup content.
  const boardMenuDialog = document.querySelector("dialog[data-oh-board-menu-panel][open]");
  const openDialog =
    [
      extrasDialog,
      materialDialog,
      tryitHelpDialog,
      graveyardDialog,
      glimpseDialog,
      boardMenuDialog,
    ].find((dialog) => dialog?.open) || null;
  const host = openDialog || document.querySelector(".tryit-page") || document.body;
  if (toast.parentElement !== host) {
    host.append(toast);
  }
  window.clearTimeout(state.tryitToastTimer);
  toast.classList.remove("show");
  toast.hidden = true;
  toast.textContent = message;
  toast.hidden = false;
  void toast.offsetWidth;
  toast.classList.add("show");
  state.tryitToastTimer = window.setTimeout(() => {
    hideTryItToast();
  }, Math.max(800, Number(durationMs) || 1600));
}

function hideTryItToast() {
  window.clearTimeout(state.tryitToastTimer);
  if (!tryitToastEl) {
    return;
  }
  tryitToastEl.classList.remove("show");
  tryitToastEl.hidden = true;
}

function updateOpeningHandMaterialPile(board) {
  const pile = board?.querySelector("[data-oh-material-pile]");
  if (!pile) {
    return;
  }
  const count = state.openingHandMaterial.length;
  pile.disabled = count === 0;
  pile.setAttribute(
    "aria-label",
    count ? `Open Material Deck (${count} left)` : "Material Deck is empty",
  );
  const countEl = pile.querySelector(".opening-hand-deck-count");
  if (countEl) {
    countEl.textContent = String(count);
  }
  const stack = pile.querySelector(".opening-hand-deck-stack");
  if (stack) {
    stack.replaceChildren();
    for (let layer = 0; layer < Math.min(4, count); layer += 1) {
      const back = document.createElement("span");
      back.className = "opening-hand-card-back";
      back.style.setProperty("--stack-offset", `${layer * 2}px`);
      stack.append(back);
    }
  }
  positionOpeningHandMaterialPile(board);
}

function getOpeningHandDrawSlot(drawIndex, field = null) {
  const zones = getOpeningHandZones(field);
  const pad = OPENING_HAND_ROW_PAD / 2;
  const column = getOpeningHandMainColumnBounds(field);
  const innerLeft = column.mainLeft + pad;
  // Spawn at the left edge of Hand so the drawn card leads the order.
  const handXs = state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === "hand")
    .map((entry) => entry.position?.x)
    .filter((x) => Number.isFinite(x));
  const leftmost = handXs.length ? Math.min(...handXs) : innerLeft;
  return {
    x: Math.min(innerLeft, leftmost) - 1,
    y: getOpeningHandRowCardTop(zones.handTop, zones.handBottom),
    z: OPENING_HAND_SIZE + drawIndex + 1,
  };
}

function getOpeningHandSlot(index, field = null) {
  if (index < OPENING_HAND_SIZE) {
    return getOpeningHandDealSlot(index, field);
  }
  return getOpeningHandDrawSlot(index - OPENING_HAND_SIZE, field);
}

function resizeOpeningHandField(board) {
  const field = board?.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }

  layoutOpeningHandZones(field);
  positionOpeningHandDeckPile(board);
  positionOpeningHandMaterialPile(board);
  positionOpeningHandExtrasButton(board);
  updateOpeningHandCounts(board);
  constrainOpeningHandCardsToZones(board);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function applyOpeningHandCardPosition(cardEl, entry) {
  if (!cardEl || !entry?.position) {
    return;
  }
  cardEl.style.left = `${entry.position.x}px`;
  cardEl.style.top = `${entry.position.y}px`;
  cardEl.style.zIndex = String(entry.position.z || 1);
}

function reflowOpeningHandZoneCards(board, zoneName = "hand", { mode = "spread" } = {}) {
  const field = board?.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }
  layoutOpeningHandZones(field);
  const entries = state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === zoneName)
    .sort((left, right) => (left.position?.x || 0) - (right.position?.x || 0));
  if (entries.length === 0) {
    return;
  }
  const layout = getOpeningHandRowLayout(field, entries.length, { mode });
  entries.forEach((entry, index) => {
    entry.zone = zoneName;
    entry.facedown = zoneName === "memory" ? Boolean(entry.facedown) : false;
    if (zoneName === "hand") {
      entry.facedown = false;
    }
    entry.position = {
      x: layout.startX + index * layout.step,
      y: layout.y,
      z: index + 1,
    };
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    applyOpeningHandCardPosition(cardEl, entry);
    if (cardEl) {
      applyOpeningHandCardFace(cardEl, entry);
    }
  });
  updateOpeningHandCounts(board);
}

async function dealOpeningHandCards(board, token) {
  const field = board.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }
  // Wait until the board has a real measured width before placing cards.
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
  if (token !== state.openingHandDealToken || !state.mainDeckOpeningHand || !board.isConnected) {
    return;
  }
  positionOpeningHandDeckPile(board);
  resizeOpeningHandField(board);

  // Continue from current hand size so remounts resume instead of double-dealing.
  while (
    state.openingHandHand.length < OPENING_HAND_SIZE &&
    state.openingHandLibrary.length > 0
  ) {
    if (token !== state.openingHandDealToken || !state.mainDeckOpeningHand || !board.isConnected) {
      return;
    }
    const index = state.openingHandHand.length;
    await drawOpeningHandCard(board, {
      animate: true,
      slotIndex: index,
    });
    await delay(140);
  }
  if (token !== state.openingHandDealToken || !state.mainDeckOpeningHand || !board.isConnected) {
    return;
  }
  state.openingHandDealComplete = true;
  // Final equal reflow so every dealt card uses the same measured Hand width.
  reflowOpeningHandZoneCards(board, "hand");
  resizeOpeningHandField(board);
  queueMultiplayerSeatPublish({ immediate: true });
  promptOpeningHandSpiritSelect(board);
}

async function drawOpeningHandCard(
  board,
  {
    animate = true,
    slotIndex = null,
    organize = false,
    zone = "hand",
    facedown = null,
    position = null,
  } = {},
) {
  if (state.openingHandLibrary.length === 0) {
    return null;
  }

  const field = board.querySelector("[data-oh-field]");
  if (!field) {
    return null;
  }

  let targetZone = normalizeOpeningHandDropZone(zone);
  if (
    targetZone !== "hand" &&
    targetZone !== "memory" &&
    targetZone !== "field" &&
    targetZone !== "graveyard" &&
    targetZone !== "champion"
  ) {
    targetZone = "hand";
  }

  const next = state.openingHandLibrary.shift();
  const handIndexBefore = state.openingHandHand.length;
  const isOpeningDeal = targetZone === "hand" && handIndexBefore < OPENING_HAND_SIZE;
  const topZ =
    Math.max(
      0,
      handIndexBefore,
      ...state.openingHandHand.map((item) => item.position?.z || 0),
    ) + 1;

  let cardPosition;
  if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
    cardPosition = clampOpeningHandFieldPosition(field, position.x, position.y, topZ);
  } else if (targetZone === "hand") {
    cardPosition = isOpeningDeal
      ? getOpeningHandDealSlot(slotIndex ?? handIndexBefore, field)
      : getOpeningHandDrawSlot(handIndexBefore - OPENING_HAND_SIZE, field);
  } else if (targetZone === "graveyard") {
    const zones = getOpeningHandZones(field);
    cardPosition = clampOpeningHandFieldPosition(
      field,
      zones.railLeft + Math.max(0, (zones.railWidth - FREEHAND_CARD_WIDTH) / 2),
      getOpeningHandRowCardTop(zones.graveyardTop, zones.graveyardBottom),
      topZ,
    );
  } else if (targetZone === "champion") {
    const champCount = state.openingHandHand.filter((item) => (item.zone || "hand") === "champion").length;
    cardPosition = getOpeningHandChampionSlot(field, champCount);
  } else {
    const zones = getOpeningHandZones(field);
    const zoneTop = targetZone === "memory" ? zones.memoryTop : zones.fieldTop;
    const zoneBottom = targetZone === "memory" ? zones.memoryBottom : zones.fieldBottom;
    cardPosition = clampOpeningHandFieldPosition(
      field,
      zones.memoryLeft + Math.max(0, (zones.mainRight - zones.memoryLeft - FREEHAND_CARD_WIDTH) / 2),
      getOpeningHandRowCardTop(zoneTop, zoneBottom),
      topZ,
    );
  }

  const entryFacedown = facedown != null ? Boolean(facedown) : targetZone === "memory";
  const entry = {
    ...next,
    position: cardPosition,
    facedown: entryFacedown,
    zone: targetZone,
    rotated: false,
  };
  state.openingHandHand.push(entry);

  const cardEl = createOpeningHandCard(entry, handIndexBefore, field);
  field.append(cardEl);
  resizeOpeningHandField(board);

  if (animate) {
    const deckAnchor = getOpeningHandDeckAnchor(field);
    cardEl.classList.add("opening-hand-card-dealing");
    cardEl.style.left = `${deckAnchor.x}px`;
    cardEl.style.top = `${deckAnchor.y}px`;
    cardEl.style.opacity = "0.35";
    cardEl.style.transform = "scale(0.86) rotate(-8deg)";
    await delay(20);
    if (targetZone === "hand") {
      // Recompute slot after layout/width settle so late cards don't share one x.
      const settled = isOpeningDeal
        ? getOpeningHandDealSlot(slotIndex ?? handIndexBefore, field)
        : getOpeningHandDrawSlot(0, field);
      entry.position = settled;
      entry.zone = "hand";
    }
    applyOpeningHandCardPosition(cardEl, entry);
    cardEl.style.opacity = "1";
    cardEl.style.transform = "scale(1) rotate(0deg)";
    await delay(220);
    cardEl.classList.remove("opening-hand-card-dealing");
    applyOpeningHandCardRotation(cardEl, entry);
  }

  updateOpeningHandDeckPile(board);
  if (targetZone === "champion") {
    restackOpeningHandChampionCards(board);
  }
  resizeOpeningHandField(board);
  // After a mid-game Hand draw (not the opening deal), neat-line Hand automatically.
  const shouldOrganize =
    targetZone === "hand" &&
    (organize || (state.openingHandDealComplete && !isOpeningDeal));
  if (shouldOrganize) {
    organizeOpeningHandCards(board, { leadInstanceId: entry.instanceId });
  }
  // Highlight freshly drawn Hand cards (Deck draws), not Memory/Field drops or opening deal.
  if (shouldOrganize) {
    flashOpeningHandCardGlow(board, entry.instanceId);
  }
  queueMultiplayerSeatPublish();
  return entry;
}

function flashOpeningHandCardGlow(board, instanceId, durationMs = OPENING_HAND_DRAW_GLOW_MS) {
  const field = board?.querySelector("[data-oh-field]");
  const cardEl = field ? findOpeningHandCardElement(field, instanceId) : null;
  if (!cardEl) {
    return;
  }
  cardEl.classList.add("is-draw-glow");
  window.setTimeout(() => {
    cardEl.classList.remove("is-draw-glow");
  }, durationMs);
}

function updateOpeningHandDeckPile(board) {
  const pile = board.querySelector("[data-oh-deck-pile]");
  const count = board.querySelector(".opening-hand-deck-count");
  const stack = board.querySelector(".opening-hand-deck-stack");
  if (count) {
    count.textContent = String(state.openingHandLibrary.length);
  }
  if (pile) {
    pile.disabled = state.openingHandLibrary.length === 0;
    pile.setAttribute(
      "aria-label",
      state.openingHandLibrary.length
        ? `Draw from deck (${state.openingHandLibrary.length} left). Tap for Hand; double-tap for Glimpse; drag to Field, Graveyard, Memory, or Hand.`
        : "Deck is empty",
    );
  }
  if (stack) {
    stack.replaceChildren();
    for (let layer = 0; layer < Math.min(4, state.openingHandLibrary.length); layer += 1) {
      const back = document.createElement("span");
      back.className = "opening-hand-card-back";
      back.style.setProperty("--stack-offset", `${layer * 2}px`);
      stack.append(back);
    }
  }
  positionOpeningHandDeckPile(board);
}

async function returnOpeningHandCardToDeck(board, entry, cardEl, placement = "bottom") {
  const field = board.querySelector("[data-oh-field]");
  if (!field) {
    return;
  }

  state.openingHandHand = state.openingHandHand.filter(
    (item) => item.instanceId !== entry.instanceId,
  );
  const libraryEntry = {
    card: entry.card,
    instanceId: entry.instanceId,
  };
  // Draw uses shift() from the front = top of the stack.
  if (placement === "top") {
    state.openingHandLibrary.unshift(libraryEntry);
  } else {
    state.openingHandLibrary.push(libraryEntry);
  }

  const zones = getOpeningHandZones(field);
  const anchor = getOpeningHandDeckAnchor(field);
  const deckMid = (zones.deckTop + zones.deckBottom) / 2;
  const targetY =
    placement === "top"
      ? zones.deckTop + OPENING_HAND_ROW_PAD / 2
      : Math.min(anchor.y + FREEHAND_CARD_HEIGHT * 0.2, deckMid);

  cardEl.classList.add("opening-hand-card-dealing", "is-facedown");
  applyOpeningHandCardFace(cardEl, { ...entry, facedown: true });
  cardEl.style.left = `${anchor.x}px`;
  cardEl.style.top = `${targetY}px`;
  cardEl.style.opacity = "0.55";
  cardEl.style.transform = "scale(0.9)";
  await delay(180);
  cardEl.remove();
  updateOpeningHandDeckPile(board);
  resizeOpeningHandField(board);
  queueMultiplayerSeatPublish();
}

function findOpeningHandCardElement(field, instanceId) {
  return [...field.querySelectorAll("[data-oh-card]")].find(
    (element) => element.dataset.ohCard === instanceId,
  );
}

function resolveOpeningHandEntryZone(entry, field) {
  // Trust the zone assigned on drop. Geometry misclassifies cards near row gaps
  // and was pulling Field/Memory/Graveyard into Organize.
  if (entry.zone && !isOpeningHandDeckZone(entry.zone)) {
    return entry.zone;
  }
  const position = entry.position || { x: 0, y: 0 };
  const cardEl = field
    ? findOpeningHandCardElement(field, entry.instanceId)
    : null;
  if (cardEl) {
    const x = Number.parseFloat(cardEl.style.left);
    const y = Number.parseFloat(cardEl.style.top);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      return getOpeningHandZoneAt(x, y, field);
    }
  }
  if (Number.isFinite(position.x) && Number.isFinite(position.y)) {
    return getOpeningHandZoneAt(position.x, position.y, field);
  }
  return "hand";
}

function organizeOpeningHandCards(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field) {
    return;
  }

  dedupeOpeningHandEntries();
  layoutOpeningHandZones(field);
  void field.offsetWidth;

  // Only Hand cards. Keep Field / Memory / Graveyard / Banishment where they are.
  const handEntries = state.openingHandHand
    .filter((entry) => (entry.zone || "hand") === "hand")
    .sort((left, right) => (left.position?.x || 0) - (right.position?.x || 0));

  handEntries.forEach((entry) => {
    entry.zone = "hand";
    entry.facedown = false;
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (!cardEl) {
      return;
    }
    entry.position = {
      x: Number.parseFloat(cardEl.style.left) || entry.position?.x || 0,
      y: Number.parseFloat(cardEl.style.top) || entry.position?.y || 0,
      z: Number.parseInt(cardEl.style.zIndex, 10) || entry.position?.z || 1,
    };
  });

  const layout = getOpeningHandRowLayout(field, handEntries.length, { mode: "snap" });
  handEntries.forEach((entry, index) => {
    entry.zone = "hand";
    entry.facedown = false;
    entry.position = {
      x: layout.startX + index * layout.step,
      y: layout.y,
      z: index + 1,
    };
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    if (!cardEl) {
      return;
    }
    cardEl.style.transition = "left 220ms ease, top 220ms ease";
    applyOpeningHandCardPosition(cardEl, entry);
    applyOpeningHandCardFace(cardEl, entry);
  });

  updateOpeningHandCounts(playBoard);
  resizeOpeningHandField(playBoard);
}

function getOpeningHandBanishmentSlot(field, index = 0) {
  const zones = getOpeningHandZones(field);
  return {
    x: zones.railLeft + Math.max(0, (zones.railWidth - FREEHAND_CARD_WIDTH) / 2) + index * 2,
    y:
      zones.banishmentTop +
      Math.max(0, (zones.banishmentBottom - zones.banishmentTop - FREEHAND_CARD_HEIGHT) / 2),
    z: 40 + index,
  };
}

async function banishRandomMemoryCard(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field) {
    return;
  }

  layoutOpeningHandZones(field);
  state.openingHandHand.forEach((entry) => {
    entry.zone = resolveOpeningHandEntryZone(entry, field);
  });

  const memoryEntries = state.openingHandHand.filter((entry) => entry.zone === "memory");
  if (memoryEntries.length === 0) {
    return;
  }

  const pick = memoryEntries[Math.floor(Math.random() * memoryEntries.length)];
  const banishedCount = state.openingHandHand.filter((entry) => entry.zone === "banishment")
    .length;
  const cardEl = findOpeningHandCardElement(field, pick.instanceId);
  pick.zone = "banishment";
  pick.facedown = false;
  pick.position = getOpeningHandBanishmentSlot(field, banishedCount);

  if (cardEl) {
    cardEl.classList.add("opening-hand-card-dealing");
    applyOpeningHandCardFace(cardEl, pick);
    applyOpeningHandCardPosition(cardEl, pick);
    await delay(220);
    cardEl.classList.remove("opening-hand-card-dealing");
  }

  updateOpeningHandCounts(playBoard);
  resizeOpeningHandField(playBoard);
}

async function recollectOpeningHandMemory(board = null) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field) {
    return;
  }

  layoutOpeningHandZones(field);
  state.openingHandHand.forEach((entry) => {
    entry.zone = resolveOpeningHandEntryZone(entry, field);
  });

  const memoryEntries = state.openingHandHand
    .filter((entry) => entry.zone === "memory")
    .sort((left, right) => (left.position?.x || 0) - (right.position?.x || 0));
  if (memoryEntries.length === 0) {
    return;
  }

  const handEntries = state.openingHandHand.filter((entry) => entry.zone === "hand");
  const totalHand = handEntries.length + memoryEntries.length;
  const layout = getOpeningHandRowLayout(field, totalHand, { mode: "snap" });
  const startIndex = handEntries.length;

  for (let index = 0; index < memoryEntries.length; index += 1) {
    const entry = memoryEntries[index];
    const cardEl = findOpeningHandCardElement(field, entry.instanceId);
    entry.zone = "hand";
    entry.facedown = false;
    entry.position = {
      x: layout.startX + (startIndex + index) * layout.step,
      y: layout.y,
      z: startIndex + index + 1,
    };
    if (cardEl) {
      cardEl.classList.add("opening-hand-card-dealing");
      applyOpeningHandCardFace(cardEl, entry);
      applyOpeningHandCardPosition(cardEl, entry);
      cardEl.style.opacity = "1";
      cardEl.style.transform = "scale(1) rotate(0deg)";
      await delay(120);
      cardEl.classList.remove("opening-hand-card-dealing");
    }
  }

  reflowOpeningHandZoneCards(playBoard, "hand", { mode: "snap" });
  resizeOpeningHandField(playBoard);
}

function hideOpeningHandCardPreview() {
  document.querySelectorAll("[data-oh-card-preview]").forEach((node) => node.remove());
  if (state.openingHandPreviewEscBound) {
    document.removeEventListener("keydown", onOpeningHandCardPreviewKeydown);
    state.openingHandPreviewEscBound = false;
  }
}

function onOpeningHandCardPreviewKeydown(event) {
  if (event.key === "Escape") {
    hideOpeningHandCardPreview();
  }
}

function showOpeningHandCardPreview(entry, { revealFacedown = false } = {}) {
  hideOpeningHandCardPreview();
  if (!entry?.card || (entry.facedown && !revealFacedown)) {
    return;
  }
  inspectTryItCard(entry.card);
  const imageUrl = getImageUrl(resolveCardImage(entry.card));
  if (!imageUrl) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.className = "opening-hand-card-preview";
  overlay.dataset.ohCardPreview = "true";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `${entry.card.name || "Card"} preview`);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      hideOpeningHandCardPreview();
    }
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "icon-button opening-hand-card-preview-close";
  closeButton.setAttribute("aria-label", "Close card preview");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideOpeningHandCardPreview();
  });

  const frame = document.createElement("div");
  frame.className = "opening-hand-card-preview-frame";

  const media = document.createElement("div");
  media.className = "opening-hand-card-preview-media";

  const image = document.createElement("img");
  image.className = "opening-hand-card-preview-image";
  image.src = imageUrl;
  image.alt = entry.card.name || "Card";
  image.draggable = false;

  const caption = document.createElement("p");
  caption.className = "opening-hand-card-preview-caption";
  caption.textContent = entry.card.name || "Card";

  const actions = document.createElement("div");
  actions.className = "opening-hand-card-preview-actions";

  const flipButton = document.createElement("button");
  flipButton.type = "button";
  flipButton.className = "secondary compact opening-hand-card-preview-flip";
  flipButton.setAttribute("aria-pressed", "false");
  flipButton.setAttribute(
    "aria-label",
    "Flip card for the opposite player to read",
  );
  flipButton.textContent = "Flip for opponent";
  flipButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const flipped = media.classList.toggle("is-flipped-for-opponent");
    flipButton.setAttribute("aria-pressed", flipped ? "true" : "false");
    flipButton.textContent = flipped ? "Flip upright" : "Flip for opponent";
  });

  actions.append(flipButton);
  media.append(image, caption);
  frame.append(media, actions);
  overlay.append(closeButton, frame);
  document.body.append(overlay);
  // Force paint so the enter transition runs.
  void overlay.offsetWidth;
  overlay.classList.add("is-visible");
  document.addEventListener("keydown", onOpeningHandCardPreviewKeydown);
  state.openingHandPreviewEscBound = true;
  closeButton.focus();
}

/** Opponent/readonly boards: double-tap or hold ~1s to open lightbox (reveals face-down too). */
function enableTableCardHoldPreview(cardEl, entry) {
  let pointerId = null;
  let holdTimer = null;
  let originX = 0;
  let originY = 0;
  let dragMoved = false;
  let holdOpened = false;
  let lastTapAt = 0;
  let tapCount = 0;

  const clearHoldTimer = () => {
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const openPreview = () => {
    showOpeningHandCardPreview(entry, { revealFacedown: true });
  };

  const endHold = (event) => {
    if (pointerId != null && event?.pointerId != null && pointerId !== event.pointerId) {
      return;
    }
    const wasHold = holdOpened;
    const moved = dragMoved;
    pointerId = null;
    clearHoldTimer();
    try {
      if (event?.pointerId != null) {
        cardEl.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endHold);
    window.removeEventListener("pointercancel", endHold);

    // Double-tap opens lightbox (same as local cards' peek affordance).
    if (!wasHold && !moved) {
      const now = Date.now();
      if (now - lastTapAt > OPENING_HAND_TAP_WINDOW_MS) {
        tapCount = 0;
      }
      tapCount += 1;
      lastTapAt = now;
      if (tapCount >= 2) {
        tapCount = 0;
        lastTapAt = 0;
        openPreview();
      }
    } else {
      tapCount = 0;
      lastTapAt = 0;
    }
    holdOpened = false;
    dragMoved = false;
  };

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    if (Math.hypot(event.clientX - originX, event.clientY - originY) > 10) {
      dragMoved = true;
      clearHoldTimer();
    }
  };

  cardEl.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    pointerId = event.pointerId;
    originX = event.clientX;
    originY = event.clientY;
    dragMoved = false;
    holdOpened = false;
    clearHoldTimer();
    try {
      cardEl.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endHold);
    window.addEventListener("pointercancel", endHold);

    const holdPointerId = event.pointerId;
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      if (pointerId !== holdPointerId || dragMoved) {
        return;
      }
      holdOpened = true;
      tapCount = 0;
      lastTapAt = 0;
      openPreview();
    }, TABLE_HOLD_PREVIEW_MS);
  });

  cardEl.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    tapCount = 0;
    lastTapAt = 0;
    openPreview();
  });

  cardEl.title = entry.facedown
    ? "Double-click or hold 1s to reveal card"
    : `${entry.card?.name || "Card"} — double-click or hold 1s to enlarge`;
}

function closeOpeningHandCardMenu() {
  document.querySelectorAll("[data-oh-card-menu], [data-oh-deck-menu]").forEach((el) => el.remove());
  document.querySelectorAll(".opening-hand-card.is-menu-open").forEach((el) => {
    el.classList.remove("is-menu-open");
  });
  document.querySelectorAll("[data-oh-deck-pile].is-menu-open").forEach((el) => {
    el.classList.remove("is-menu-open");
  });
}

function getOpeningHandGraveyardSlot(field, index = 0) {
  const zones = getOpeningHandZones(field);
  return {
    x: zones.railLeft + Math.max(0, (zones.railWidth - FREEHAND_CARD_WIDTH) / 2) + index * 2,
    y:
      zones.graveyardTop +
      Math.max(0, (zones.graveyardBottom - zones.graveyardTop - FREEHAND_CARD_HEIGHT) / 2),
    z: 40 + index,
  };
}

async function removeOpeningHandCard(board, entry, cardEl) {
  const playBoard = board || getActiveOpeningHandBoard();
  if (!playBoard || !entry) {
    return;
  }
  const previousZone = entry.zone || "hand";
  state.openingHandHand = state.openingHandHand.filter(
    (item) => item.instanceId !== entry.instanceId,
  );
  cardEl?.remove();
  if (previousZone === "champion") {
    restackOpeningHandChampionCards(playBoard);
  }
  updateOpeningHandCounts(playBoard);
  resizeOpeningHandField(playBoard);
  queueMultiplayerSeatPublish();
}

async function moveOpeningHandCardToZone(board, entry, cardEl, zone) {
  const playBoard = board || getActiveOpeningHandBoard();
  const field = playBoard?.querySelector("[data-oh-field]");
  if (!playBoard || !field || !entry || !cardEl) {
    return;
  }

  const previousZone = entry.zone || "hand";
  const targetZone = normalizeOpeningHandDropZone(zone);
  const siblings = state.openingHandHand.filter(
    (item) =>
      item.instanceId !== entry.instanceId && (item.zone || "hand") === targetZone,
  ).length;

  entry.zone = targetZone;
  if (!canRestOpeningHandCard(targetZone)) {
    entry.rotated = false;
  }
  if (targetZone === "memory") {
    entry.facedown = true;
  } else if (!canFlipOpeningHandCard(targetZone)) {
    entry.facedown = false;
  } else if (previousZone === "memory" || previousZone === "hand") {
    entry.facedown = false;
  }

  if (targetZone === "hand" || targetZone === "memory") {
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
    reflowOpeningHandZoneCards(playBoard, targetZone, {
      mode: targetZone === "hand" ? "snap" : "spread",
    });
  } else {
    if (targetZone === "banishment") {
      entry.position = getOpeningHandBanishmentSlot(field, siblings);
    } else if (targetZone === "graveyard") {
      entry.position = getOpeningHandGraveyardSlot(field, siblings);
    } else if (targetZone === "champion") {
      entry.position = getOpeningHandChampionSlot(field, siblings);
    } else if (targetZone === "field") {
      entry.position = getOpeningHandFieldSlot(field, siblings);
    }
    constrainOpeningHandEntryToZone(field, entry);
    cardEl.classList.add("opening-hand-card-dealing");
    applyOpeningHandCardPosition(cardEl, entry);
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
    await delay(220);
    cardEl.classList.remove("opening-hand-card-dealing");
  }

  if (targetZone === "champion" || previousZone === "champion") {
    restackOpeningHandChampionCards(playBoard);
  }
  updateOpeningHandCounts(playBoard);
  resizeOpeningHandField(playBoard);
  queueMultiplayerSeatPublish();
}

function openOpeningHandCardMenu(cardEl, entry, board) {
  closeOpeningHandCardMenu();
  if (!cardEl || !entry || !board) {
    return;
  }
  if (state.openingHandAwaitingSpirit) {
    requireOpeningHandSpiritChosen();
    return;
  }
  setOpeningHandVoiceSelection(entry.instanceId, board);

  const zone = entry.zone || "hand";
  const ephemeral = Boolean(entry.ephemeral);
  const menu = document.createElement("div");
  menu.className = "opening-hand-card-menu";
  menu.dataset.ohCardMenu = "true";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", `${entry.card?.name || "Card"} actions`);

  const addAction = (label, action, { danger = false } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = danger
      ? "opening-hand-card-menu-item is-danger"
      : "opening-hand-card-menu-item";
    button.setAttribute("role", "menuitem");
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeOpeningHandCardMenu();
      void action();
    });
    menu.append(button);
  };

  addAction("Info", () => {
    showOpeningHandCardPreview(entry, { revealFacedown: true });
  });

  if (canRestOpeningHandCard(zone)) {
    addAction(entry.rotated ? "Ready" : "Rest", () => {
      toggleOpeningHandCardRotation(cardEl, entry);
    });
  }

  if (canFlipOpeningHandCard(zone)) {
    addAction(entry.facedown ? "Flip up" : "Flip down", () => {
      toggleOpeningHandCardFace(cardEl, entry);
    });
  }

  const buff = normalizeOpeningHandBuff(entry.buff);
  addAction(buff > 0 ? `Buff +1 (${buff})` : "Buff +1", () => {
    adjustOpeningHandCardBuff(cardEl, entry, 1);
  });
  if (buff > 0) {
    addAction("Buff −1", () => {
      adjustOpeningHandCardBuff(cardEl, entry, -1);
    });
    addAction("Clear buff", () => {
      entry.buff = 0;
      applyOpeningHandCardBuff(cardEl, entry);
      queueMultiplayerSeatPublish();
    });
  }

  if (zone !== "hand") {
    addAction("To Hand", () => moveOpeningHandCardToZone(board, entry, cardEl, "hand"));
  }
  if (zone !== "memory") {
    addAction("To Memory", () => moveOpeningHandCardToZone(board, entry, cardEl, "memory"));
  }
  if (zone !== "field") {
    addAction("To Field", () => moveOpeningHandCardToZone(board, entry, cardEl, "field"));
  }

  if (ephemeral) {
    addAction("Remove", () => removeOpeningHandCard(board, entry, cardEl), { danger: true });
  } else {
    addAction("Top of deck", () => returnOpeningHandCardToDeck(board, entry, cardEl, "top"));
    addAction("Bottom of deck", () =>
      returnOpeningHandCardToDeck(board, entry, cardEl, "bottom"),
    );
  }

  if (zone !== "banishment") {
    addAction("Banish", () => moveOpeningHandCardToZone(board, entry, cardEl, "banishment"));
  }
  if (zone !== "graveyard") {
    addAction("Graveyard", () => moveOpeningHandCardToZone(board, entry, cardEl, "graveyard"));
  }

  addAction("Close", () => {});

  cardEl.classList.add("is-menu-open");
  document.body.append(menu);

  const rect = cardEl.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let left = rect.right + 8;
  let top = rect.top;
  if (left + menuRect.width > window.innerWidth - 8) {
    left = Math.max(8, rect.left - menuRect.width - 8);
  }
  if (top + menuRect.height > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - menuRect.height - 8);
  }
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function enableOpeningHandCardDrag(cardEl, entry) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originPointerX = 0;
  let originPointerY = 0;
  let dragMoved = false;
  let holdTimer = null;
  let holdOpened = false;
  let lastTapAt = 0;
  let tapCount = 0;
  let tapActionTimer = null;
  const originZone = () => entry.zone || "hand";

  const clearTapActionTimer = () => {
    if (tapActionTimer != null) {
      window.clearTimeout(tapActionTimer);
      tapActionTimer = null;
    }
  };

  const clearHoldTimer = () => {
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  };

  const syncFaceForPosition = (field, x, y) => {
    const zone = getOpeningHandZoneAt(x, y, field);
    field.dataset.activeZone = zone;
    // Preview face-down only when entering Memory from another zone.
    // Field/Memory keep a manually toggled face while you stay there.
    if (zone === "memory") {
      if (originZone() !== "memory") {
        setOpeningHandCardFacedown(cardEl, entry, true);
      }
    } else if (zone !== "field") {
      setOpeningHandCardFacedown(cardEl, entry, false);
    }
  };

  const abortPointerForHold = (event) => {
    pointerId = null;
    cardEl.classList.remove("dragging");
    try {
      cardEl.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    const field = cardEl.closest("[data-oh-field]");
    delete field?.dataset.activeZone;
  };

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    const field = cardEl.closest("[data-oh-field]");
    if (!field) {
      return;
    }
    const scale = getOpeningHandFieldScale(field);
    let nextX = startX + (event.clientX - originPointerX) / scale.x;
    let nextY = startY + (event.clientY - originPointerY) / scale.y;
    if (Math.hypot(event.clientX - originPointerX, event.clientY - originPointerY) > 8) {
      dragMoved = true;
      clearHoldTimer();
      clearTapActionTimer();
      closeOpeningHandCardMenu();
    }
    // While dragging, stay on the board; zone clamping happens on drop / resize.
    const clamped = clampOpeningHandFieldPosition(field, nextX, nextY, 0);
    nextX = clamped.x;
    nextY = clamped.y;
    cardEl.style.left = `${nextX}px`;
    cardEl.style.top = `${nextY}px`;
    syncFaceForPosition(field, nextX, nextY);
  };

  const onPointerUp = async (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = null;
    cardEl.classList.remove("dragging");
    clearHoldTimer();
    try {
      cardEl.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    if (holdOpened) {
      holdOpened = false;
      clearTapActionTimer();
      tapCount = 0;
      lastTapAt = 0;
      return;
    }

    const field = cardEl.closest("[data-oh-field]");
    const board = cardEl.closest("[data-opening-hand-board]");
    const x = Number.parseFloat(cardEl.style.left) || 0;
    const y = Number.parseFloat(cardEl.style.top) || 0;
    const z = Number.parseInt(cardEl.style.zIndex, 10) || 1;
    entry.position = { x, y, z };
    if (!field || !board) {
      return;
    }

    let zone = getOpeningHandZoneAt(x, y, field);
    delete field.dataset.activeZone;
    if (isOpeningHandDeckZone(zone)) {
      entry.rotated = false;
      entry.facedown = false;
      applyOpeningHandCardRotation(cardEl, entry);
      applyOpeningHandCardFace(cardEl, entry);
      const placement = zone === "deck-top" ? "top" : "bottom";
      await returnOpeningHandCardToDeck(board, entry, cardEl, placement);
      return;
    }
    // Material is a deck pile, not a drop zone — treat as Memory (same row).
    if (zone === "material") {
      zone = "memory";
    }

    const previousZone = entry.zone || "hand";
    entry.zone = zone;
    if (zone === "memory" && previousZone !== "memory") {
      entry.facedown = true;
    } else if (!canFlipOpeningHandCard(zone)) {
      entry.facedown = false;
    } else if (!canFlipOpeningHandCard(previousZone)) {
      // Entering Field/Memory/Champion from Hand/etc. starts face-up.
      entry.facedown = false;
    }
    // Staying in Field/Memory/Champion keeps the current face.
    if (!canRestOpeningHandCard(zone)) {
      entry.rotated = false;
    }
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
    entry.position = clampOpeningHandPositionToZone(
      field,
      zone,
      x,
      y,
      z,
      { rotated: Boolean(entry.rotated) },
    );
    applyOpeningHandCardPosition(cardEl, entry);
    delete field.dataset.activeZone;

    if (zone === "champion" || previousZone === "champion") {
      restackOpeningHandChampionCards(board);
    }

    // Double-tap → actions. Triple-tap → lightbox zoom.
    // Graveyard browse is hold (~1s), not double-tap.
    if (!dragMoved) {
      setOpeningHandVoiceSelection(entry.instanceId, board);
      const now = Date.now();
      if (now - lastTapAt > OPENING_HAND_TAP_WINDOW_MS) {
        tapCount = 0;
      }
      tapCount += 1;
      lastTapAt = now;
      clearTapActionTimer();

      if (tapCount >= 3) {
        tapCount = 0;
        lastTapAt = 0;
        showOpeningHandCardPreview(entry, { revealFacedown: true });
      } else if (tapCount === 2) {
        tapActionTimer = window.setTimeout(() => {
          tapActionTimer = null;
          tapCount = 0;
          lastTapAt = 0;
          openOpeningHandCardMenu(cardEl, entry, board);
        }, OPENING_HAND_TAP_WINDOW_MS + 40);
      }
    } else {
      clearTapActionTimer();
      tapCount = 0;
      lastTapAt = 0;
    }

    updateOpeningHandCounts(board);
    resizeOpeningHandField(board);
    queueMultiplayerSeatPublish();
  };

  cardEl.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    pointerId = event.pointerId;
    dragMoved = false;
    holdOpened = false;
    clearHoldTimer();
    startX = Number.parseFloat(cardEl.style.left) || 0;
    startY = Number.parseFloat(cardEl.style.top) || 0;
    originPointerX = event.clientX;
    originPointerY = event.clientY;
    const topZ =
      Math.max(0, ...state.openingHandHand.map((item) => item.position?.z || 0)) + 1;
    entry.position = { ...(entry.position || {}), z: topZ };
    cardEl.style.zIndex = String(topZ);
    cardEl.classList.add("dragging");
    try {
      cardEl.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Hold on a graveyard card opens the browse/banish dialog.
    if ((entry.zone || "hand") === "graveyard") {
      const board = cardEl.closest("[data-opening-hand-board]");
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        if (pointerId == null || dragMoved) {
          return;
        }
        holdOpened = true;
        abortPointerForHold(event);
        openGraveyardDialog(board);
      }, TABLE_HOLD_PREVIEW_MS);
    }
  });
}

function enableOpeningHandDeckDrag(pileEl, board) {
  let pointerId = null;
  let ghost = null;
  let originX = 0;
  let originY = 0;
  let moved = false;
  let lastTapAt = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let pendingDrawTimer = null;

  const clearPendingDraw = () => {
    if (pendingDrawTimer != null) {
      window.clearTimeout(pendingDrawTimer);
      pendingDrawTimer = null;
    }
  };

  const cleanup = () => {
    ghost?.remove();
    ghost = null;
    pileEl.classList.remove("dragging");
    board.classList.remove("opening-hand-drawing");
    const field = board.querySelector("[data-oh-field]");
    delete field?.dataset.activeZone;
  };

  const syncDropZonePreview = (clientX, clientY) => {
    const field = board.querySelector("[data-oh-field]");
    if (!field || !isPointInElement(clientX, clientY, field)) {
      delete field?.dataset.activeZone;
      board.classList.remove("opening-hand-drawing");
      return null;
    }
    board.classList.add("opening-hand-drawing");
    const point = getOpeningHandFieldPointFromClient(clientX, clientY, field);
    const zone = normalizeOpeningHandDropZone(getOpeningHandZoneAt(point.x, point.y, field));
    field.dataset.activeZone = zone;
    return { field, point, zone };
  };

  const drawFromDeck = async (dropZone = "hand", dropPosition = null) => {
    if (state.openingHandLibrary.length === 0) {
      return;
    }
    await drawOpeningHandCard(board, {
      animate: true,
      organize: dropZone === "hand" && !dropPosition,
      zone: dropZone,
      facedown: dropZone === "memory",
      position: dropPosition,
    });
  };

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId || !ghost) {
      return;
    }
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    if (Math.hypot(dx, dy) > 6) {
      moved = true;
      clearPendingDraw();
    }
    ghost.style.left = `${event.clientX - FREEHAND_CARD_WIDTH / 2}px`;
    ghost.style.top = `${event.clientY - FREEHAND_CARD_HEIGHT / 2}px`;
    syncDropZonePreview(event.clientX, event.clientY);
  };

  const onPointerUp = async (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);

    const preview = syncDropZonePreview(event.clientX, event.clientY);
    let dropZone = "hand";
    let dropPosition = null;
    if (moved && preview) {
      if (preview.zone === "memory") {
        dropZone = "memory";
        dropPosition = preview.point;
      } else if (preview.zone === "graveyard") {
        dropZone = "graveyard";
        dropPosition = preview.point;
      } else if (preview.zone === "field") {
        dropZone = "field";
        dropPosition = preview.point;
      } else if (preview.zone === "champion") {
        dropZone = "champion";
        dropPosition = preview.point;
      } else if (preview.zone === "hand") {
        dropZone = "hand";
        dropPosition = preview.point;
      }
    }
    const wasMoved = moved;
    const clientX = event.clientX;
    const clientY = event.clientY;
    cleanup();
    try {
      pileEl.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    if (wasMoved) {
      clearPendingDraw();
      lastTapAt = 0;
      if (preview) {
        await drawFromDeck(dropZone, dropPosition);
      }
      return;
    }

    const now = Date.now();
    if (
      now - lastTapAt <= OPENING_HAND_TAP_WINDOW_MS &&
      Math.hypot(clientX - lastTapX, clientY - lastTapY) <= 18
    ) {
      clearPendingDraw();
      lastTapAt = 0;
      openOpeningHandDeckMenu(pileEl, board);
      return;
    }

    lastTapAt = now;
    lastTapX = clientX;
    lastTapY = clientY;
    clearPendingDraw();
    pendingDrawTimer = window.setTimeout(() => {
      pendingDrawTimer = null;
      lastTapAt = 0;
      void drawFromDeck("hand", null);
    }, OPENING_HAND_TAP_WINDOW_MS + 40);
  };

  const onPointerCancel = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    clearPendingDraw();
    cleanup();
    try {
      pileEl.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  pileEl.addEventListener("pointerdown", (event) => {
    if (pileEl.disabled || state.openingHandLibrary.length === 0) {
      return;
    }
    if (state.openingHandAwaitingSpirit) {
      requireOpeningHandSpiritChosen();
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (Date.now() - lastTapAt <= OPENING_HAND_TAP_WINDOW_MS) {
      clearPendingDraw();
    }
    pointerId = event.pointerId;
    moved = false;
    originX = event.clientX;
    originY = event.clientY;
    pileEl.classList.add("dragging");

    ghost = document.createElement("div");
    ghost.className = "opening-hand-card-back opening-hand-draw-ghost";
    ghost.style.width = `${FREEHAND_CARD_WIDTH}px`;
    ghost.style.height = `${FREEHAND_CARD_HEIGHT}px`;
    ghost.style.left = `${event.clientX - FREEHAND_CARD_WIDTH / 2}px`;
    ghost.style.top = `${event.clientY - FREEHAND_CARD_HEIGHT / 2}px`;
    document.body.append(ghost);

    try {
      pileEl.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  });
}

function isPointInElement(x, y, element) {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function createDeckRow(card) {
  const row = document.createElement("div");
  row.className = "deck-row deck-row-with-thumb";

  const name = document.createElement("span");
  name.className = "deck-card-name";
  name.textContent = card.name;

  row.append(createDeckThumbnail(card));

  const maxQuantity = getMaxQuantityForCard(card);
  const quantityLabel = document.createElement("label");
  quantityLabel.className = "deck-field deck-quantity-field";
  quantityLabel.textContent = "Qty";
  const quantity = document.createElement("select");
  quantity.dataset.deckQuantity = card.key;
  for (let amount = 1; amount <= maxQuantity; amount += 1) {
    quantity.append(createOption(String(amount), String(amount)));
  }
  quantity.value = String(Math.min(maxQuantity, normalizeQuantity(card.quantity)));
  quantityLabel.append(quantity);

  const sectionPicker = createSectionPicker(card);

  const remove = document.createElement("button");
  remove.className = "ghost compact";
  remove.type = "button";
  remove.dataset.removeDeck = card.key;
  remove.textContent = "Remove";

  row.append(name, quantityLabel, sectionPicker, remove);
  return row;
}

function createDeckThumbnail(card) {
  const thumbnail = document.createElement("button");
  thumbnail.type = "button";
  thumbnail.className = "deck-card-thumbnail";
  thumbnail.dataset.deckLightbox = card.key;
  thumbnail.setAttribute("aria-label", `View ${card.name} details`);
  thumbnail.title = `${card.name} — tap for details`;
  const imageUrl = getImageUrl(resolveCardImage(card));
  if (imageUrl) {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = card.name;
    image.onerror = () => {
      image.remove();
      thumbnail.textContent = card.name.slice(0, 2).toUpperCase();
    };
    thumbnail.append(image);
  } else {
    thumbnail.textContent = card.name.slice(0, 2).toUpperCase();
  }
  return thumbnail;
}

function createSectionPicker(card) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "deck-section-picker";
  const legend = document.createElement("legend");
  legend.textContent = "Section";
  wrapper.append(legend);

  DECK_SECTIONS.forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.deckSection = card.key;
    button.dataset.section = section.key;
    button.textContent = shortSectionLabel(section.key);
    button.setAttribute("aria-label", `Move ${card.name} to ${section.title}`);
    button.classList.toggle("active", normalizeDeckSection(card.section) === section.key);
    wrapper.append(button);
  });

  return wrapper;
}

function shortSectionLabel(section) {
  return {
    material: "Material",
    main: "Main",
    sideboard: "Side",
  }[section] || section;
}

function handleDeckListClick(event) {
  const freehandButton = event.target.closest("[data-toggle-main-freehand]");
  if (freehandButton) {
    toggleMainDeckFreehand();
    return;
  }

  const openingHandButton = event.target.closest("[data-open-try-it], [data-toggle-opening-hand]");
  if (openingHandButton) {
    event.preventDefault();
    openTryItPage();
    return;
  }

  const resetFreehandButton = event.target.closest("[data-reset-main-freehand]");
  if (resetFreehandButton) {
    resetMainDeckFreehandPositions();
    return;
  }

  const lightboxButton = event.target.closest("[data-deck-lightbox]");
  if (lightboxButton) {
    // Freehand cards open the lightbox on double-click, not a single tap.
    if (lightboxButton.closest("[data-freehand-card]")) {
      return;
    }
    event.preventDefault();
    const deckCard = state.deck.find((card) => card.key === lightboxButton.dataset.deckLightbox);
    if (deckCard) {
      void openDeckCardLightbox(deckCard);
    }
    return;
  }

  const removeOneButton = event.target.closest("[data-remove-one-deck]");
  if (removeOneButton) {
    removeOneDeckCopy(removeOneButton.dataset.removeOneDeck);
    return;
  }

  const removeButton = event.target.closest("[data-remove-deck]");
  if (removeButton) {
    state.deck = state.deck.filter((card) => card.key !== removeButton.dataset.removeDeck);
    saveDeck();
    renderDeck();
    renderCards();
    return;
  }

  const sectionButton = event.target.closest("[data-deck-section]");
  if (sectionButton) {
    updateDeckCard(sectionButton.dataset.deckSection, { section: sectionButton.dataset.section });
    renderDeck();
    renderCards();
  }
}

async function openDeckCardLightbox(deckCard) {
  if (!deckCard?.name) {
    return;
  }

  const key = getCardKey(deckCard);
  const fromResults =
    state.cards.find((card) => getCardKey(card) === key) ||
    state.cards.find(
      (card) => String(card.name || "").toLowerCase() === String(deckCard.name || "").toLowerCase(),
    ) ||
    null;

  if (fromResults) {
    openLightbox(fromResults, { source: "deck" });
    return;
  }

  try {
    const lookedUp = await lookupCardByName(deckCard.name);
    if (lookedUp) {
      openLightbox(lookedUp, { source: "deck" });
      return;
    }
  } catch (error) {
    console.warn("Deck lightbox lookup failed", error);
  }

  openLightbox(deckEntryToLightboxCard(deckCard), { source: "deck" });
}

function deckEntryToLightboxCard(deckCard) {
  return {
    uuid: deckCard.key,
    slug: deckCard.key,
    name: deckCard.name,
    types: Array.isArray(deckCard.types) ? deckCard.types : [],
    elements: Array.isArray(deckCard.elements) ? deckCard.elements : [],
    subtypes: Array.isArray(deckCard.subtypes) ? deckCard.subtypes : [],
    classes: Array.isArray(deckCard.classes) ? deckCard.classes : [],
    level: deckCard.level ?? null,
    cost: deckCard.costType ? { type: deckCard.costType } : deckCard.cost || null,
    effect_raw: deckCard.effect || deckCard.effect_raw || "",
    edition: deckCard.image ? { image: deckCard.image } : null,
  };
}

function removeOneDeckCopy(key) {
  const card = state.deck.find((item) => item.key === key);
  if (!card) {
    return;
  }

  const quantity = normalizeQuantity(card.quantity);
  if (quantity <= 1) {
    state.deck = state.deck.filter((item) => item.key !== key);
  } else {
    card.quantity = quantity - 1;
  }
  saveDeck();
  renderDeck();
  renderCards();
}

function handleDeckListInput(event) {
  const quantityInput = event.target.closest("[data-deck-quantity]");
  if (!quantityInput) {
    return;
  }

  updateDeckCard(quantityInput.dataset.deckQuantity, {
    quantity: Math.max(1, Number(quantityInput.value) || 1),
  });
  renderDeck();
  renderCards();
}

function clearDeck() {
  state.deck = [];
  state.resultSelectedQuantities = {};
  state.resultAddedMessages = {};
  saveDeck();
  renderDeck();
  renderCards();
}

function addCardToDeck(card, quantityToAdd = 1, sectionOverride = null) {
  const key = getCardKey(card);
  const amount = normalizeQuantity(quantityToAdd);
  const existing = state.deck.find((item) => item.key === key);
  const section = existing
    ? normalizeDeckSection(existing.section)
    : sectionOverride
      ? normalizeDeckSection(sectionOverride)
      : defaultDeckSection(card);
  const maxQuantity = getMaxQuantityForSection(section, card);
  const image = resolveCardImage(card);
  if (existing) {
    existing.quantity = Math.min(maxQuantity, normalizeQuantity(existing.quantity) + amount);
    Object.assign(existing, deckCardMetadata(card));
    existing.image = image || existing.image || "";
    existing.line = formatCardLine(card) || existing.line || "";
    existing.name = card.name || existing.name;
  } else {
    state.deck.push({
      key,
      name: card.name,
      image,
      line: formatCardLine(card),
      quantity: Math.min(maxQuantity, amount),
      section,
      ...deckCardMetadata(card),
    });
  }
  saveDeck();
  renderDeck();
  renderCards();
}

function updateDeckCard(key, updates) {
  const card = state.deck.find((item) => item.key === key);
  if (!card) {
    return;
  }

  Object.assign(card, updates);
  card.section = normalizeDeckSection(card.section);
  card.quantity = Math.min(
    getMaxQuantityForCard(card),
    normalizeQuantity(card.quantity),
  );
  saveDeck();
}

function saveDeck() {
  saveStoredJson(
    DECK_STORAGE_KEY,
    state.deck.map((card) => ({
      ...card,
      quantity: normalizeQuantity(card.quantity),
      section: normalizeDeckSection(card.section),
      types: Array.isArray(card.types) ? card.types : [],
      level: card.level ?? null,
      costType: card.costType || "",
    })),
  );
}

async function exportDeck(button = exportDeckButton) {
  const text = formatDeckExport();
  if (!text.trim()) {
    window.alert("Add cards to your deck before exporting.");
    return;
  }

  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied. Ready to paste.";
  } catch {
    window.prompt("Copy this decklist", text);
    button.textContent = "Copied. Ready to paste.";
  } finally {
    window.setTimeout(() => {
      button.textContent = original;
    }, 1800);
  }
}

function downloadDeck() {
  const text = formatDeckExport();
  if (!text.trim()) {
    window.alert("Add cards to your deck before downloading.");
    return;
  }

  const slug = state.deckName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "grand-archive-deck";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDeckExport() {
  const header = [`// ${state.deckName}`, `// Built with AdvGA v${APP_VERSION}`, ""].join("\n");
  const body = DECK_SECTIONS.map((section) => {
    const cards = state.deck.filter((card) => normalizeDeckSection(card.section) === section.key);
    const lines = cards.map((card) => `${normalizeQuantity(card.quantity)} ${card.name}`);
    return [`# ${section.title}`, "", ...lines].join("\n").trimEnd();
  }).join("\n\n");
  return `${header}${body}`;
}

function openImportDialog() {
  importStatusEl.textContent = "";
  importText.value = state.deck.length ? formatDeckExport() : "";
  confirmImportButton.disabled = false;
  importDialog.showModal();
  importText.focus();
}

function showDeckLoadOverlay({ title = "Loading deck", detail = "Looking up cards…", progress = 0, current = 0, total = 0 } = {}) {
  if (!deckLoadOverlay) {
    return;
  }
  deckLoadOverlay.hidden = false;
  deckLoadOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("deck-load-active");
  if (deckLoadTitle) {
    deckLoadTitle.textContent = title;
  }
  updateDeckLoadOverlay({ detail, progress, current, total });
}

function updateDeckLoadOverlay({ detail, progress, current, total } = {}) {
  if (deckLoadDetail && detail != null) {
    deckLoadDetail.textContent = detail;
  }
  if (deckLoadProgressBar && progress != null) {
    const pct = Math.max(0, Math.min(100, Number(progress) || 0));
    deckLoadProgressBar.style.width = `${pct}%`;
  }
  if (deckLoadCount && current != null && total != null && total > 0) {
    deckLoadCount.textContent = `${current} / ${total}`;
  } else if (deckLoadCount) {
    deckLoadCount.textContent = "";
  }
}

function hideDeckLoadOverlay() {
  if (!deckLoadOverlay) {
    return;
  }
  deckLoadOverlay.hidden = true;
  deckLoadOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("deck-load-active");
  if (deckLoadProgressBar) {
    deckLoadProgressBar.style.width = "0%";
  }
  if (deckLoadCount) {
    deckLoadCount.textContent = "";
  }
}

async function importDeckFromText(rawText, options = {}) {
  const {
    label = "deck",
    showOverlay = true,
    closeImportDialog: shouldCloseImportDialog = true,
  } = options;

  const parsed = parseDeckImport(rawText);
  if (parsed.entries.length === 0) {
    if (importStatusEl) {
      importStatusEl.textContent = "No card lines found. Use formats like “4 Backstep” under a section heading.";
    }
    return false;
  }

  const total = parsed.entries.length;
  if (confirmImportButton) {
    confirmImportButton.disabled = true;
  }
  if (importStatusEl) {
    importStatusEl.textContent = `Looking up ${total} card line${total === 1 ? "" : "s"}...`;
  }

  if (showOverlay) {
    showDeckLoadOverlay({
      title: `Loading ${label}`,
      detail: "Resolving cards from the Grand Archive API…",
      progress: 0,
      current: 0,
      total,
    });
  }

  const nextDeck = [];
  const missing = [];

  try {
    for (let index = 0; index < parsed.entries.length; index += 1) {
      const entry = parsed.entries[index];
      const current = index + 1;
      const progress = Math.round((current / total) * 100);
      const detail = `Looking up ${entry.name}…`;

      if (importStatusEl) {
        importStatusEl.textContent = `Looking up ${current} / ${total}…`;
      }
      if (showOverlay) {
        updateDeckLoadOverlay({ detail, progress, current, total });
      }

      try {
        const card = await lookupCardByName(entry.name);
        if (!card) {
          missing.push(entry.name);
          continue;
        }
        const key = getCardKey(card);
        const existing = nextDeck.find((item) => item.key === key && item.section === entry.section);
        const maxQuantity = getMaxQuantityForSection(entry.section, card);
        if (existing) {
          existing.quantity = Math.min(maxQuantity, existing.quantity + entry.quantity);
        } else {
          nextDeck.push({
            key,
            name: card.name,
            image: resolveCardImage(card),
            line: formatCardLine(card),
            quantity: Math.min(maxQuantity, entry.quantity),
            section: entry.section,
            ...deckCardMetadata(card),
          });
        }
      } catch {
        missing.push(entry.name);
      }
    }

    if (showOverlay) {
      updateDeckLoadOverlay({
        detail: missing.length ? "Finishing import…" : "Building your deck…",
        progress: 100,
        current: total,
        total,
      });
    }

    state.deck = nextDeck;
    if (parsed.deckName) {
      state.deckName = parsed.deckName;
      if (deckNameInput) {
        deckNameInput.value = state.deckName;
      }
      saveStoredJson(DECK_NAME_STORAGE_KEY, state.deckName);
    }
    saveDeck();
    renderDeck();
    renderCards();

    if (missing.length) {
      if (importStatusEl) {
        importStatusEl.textContent = `Imported ${nextDeck.length} unique card${nextDeck.length === 1 ? "" : "s"}. Missing: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}`;
      }
      return nextDeck.length > 0;
    }

    if (importStatusEl) {
      importStatusEl.textContent = `Imported ${nextDeck.length} unique card${nextDeck.length === 1 ? "" : "s"}.`;
    }
    if (shouldCloseImportDialog && importDialog?.open) {
      window.setTimeout(() => importDialog.close(), 700);
    }
    return nextDeck.length > 0;
  } finally {
    if (showOverlay) {
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      hideDeckLoadOverlay();
    }
    if (confirmImportButton) {
      confirmImportButton.disabled = false;
    }
  }
}

function parseDeckImport(rawText) {
  let section = "main";
  let deckName = "";
  const entries = [];

  String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith("//")) {
        if (!deckName) {
          deckName = line.replace(/^\/\/\s*/, "").replace(/\s*Built with AdvGA.*$/i, "").trim();
        }
        return;
      }

      const heading = line.replace(/^#+\s*/, "").toLowerCase();
      if (heading.startsWith("material")) {
        section = "material";
        return;
      }
      if (heading.startsWith("main")) {
        section = "main";
        return;
      }
      if (heading.startsWith("side")) {
        section = "sideboard";
        return;
      }
      if (line.startsWith("#")) {
        return;
      }

      const match = line.match(/^(\d+)\s*[xX]?\s+(.+)$/) || line.match(/^(.+)$/);
      if (!match) {
        return;
      }

      let quantity = 1;
      let name = "";
      if (match.length === 3 && /^\d+$/.test(match[1])) {
        quantity = normalizeQuantity(match[1]);
        name = match[2].trim();
      } else {
        name = (match[1] || match[0]).trim();
      }

      name = name.replace(/\s+\(.*\)$/, "").trim();
      if (!name) {
        return;
      }

      entries.push({
        quantity,
        name,
        section: normalizeDeckSection(section),
      });
    });

  return { entries, deckName };
}

async function lookupCardByName(name) {
  const needle = String(name || "").trim();
  const cards = await searchCardsByName(needle, 8);
  const exact = cards.find((card) => card.name.trim().toLowerCase() === needle.toLowerCase());
  return exact || cards[0] || null;
}

async function searchCardsByName(name, pageSize = 8) {
  const params = new URLSearchParams({
    name,
    page: "1",
    page_size: String(pageSize),
    sort: "name",
    order: "ASC",
  });
  const response = await fetch(`${API_BASE}/cards/search?${params}`);
  if (!response.ok) {
    throw new Error(`Lookup failed for ${name}`);
  }
  const payload = await response.json();
  return payload.data || [];
}

function getSectionSearchInput() {
  return getActiveDeckList().querySelector("[data-deck-card-search]");
}

function getSectionSearchList() {
  return getActiveDeckList().querySelector("[data-deck-autocomplete-list]");
}

function getSectionSearchStatus() {
  return getActiveDeckList().querySelector("[data-deck-autocomplete-status]");
}

function resetDeckAutocomplete() {
  window.clearTimeout(state.deckAutocomplete.timer);
  state.deckAutocomplete = {
    query: "",
    results: [],
    loading: false,
    activeIndex: -1,
    requestId: state.deckAutocomplete.requestId + 1,
    timer: null,
    section: null,
  };
}

function openSectionSearch(sectionKey) {
  const section = normalizeDeckSection(sectionKey);
  if (state.deckAutocomplete.section === section) {
    resetDeckAutocomplete();
  } else {
    window.clearTimeout(state.deckAutocomplete.timer);
    state.deckAutocomplete = {
      query: "",
      results: [],
      loading: false,
      activeIndex: -1,
      requestId: state.deckAutocomplete.requestId + 1,
      timer: null,
      section,
    };
  }
  renderDeck();
}

function scheduleDeckAutocomplete(rawQuery) {
  const query = rawQuery.trim();
  state.deckAutocomplete.query = query;
  window.clearTimeout(state.deckAutocomplete.timer);

  const statusEl = getSectionSearchStatus();
  if (query.length < 2) {
    state.deckAutocomplete.results = [];
    state.deckAutocomplete.activeIndex = -1;
    state.deckAutocomplete.loading = false;
    renderDeckAutocompleteList();
    if (statusEl) {
      statusEl.textContent =
        query.length === 0
          ? "Type a card name to autocomplete."
          : "Keep typing — enter at least 2 characters.";
    }
    return;
  }

  state.deckAutocomplete.loading = true;
  if (statusEl) {
    statusEl.textContent = "Searching cards…";
  }
  state.deckAutocomplete.timer = window.setTimeout(() => {
    runDeckAutocomplete(query);
  }, 220);
}

async function runDeckAutocomplete(query) {
  const requestId = state.deckAutocomplete.requestId + 1;
  state.deckAutocomplete.requestId = requestId;
  const statusEl = getSectionSearchStatus();

  try {
    const results = await searchCardsByName(query, 10);
    if (requestId !== state.deckAutocomplete.requestId || state.deckAutocomplete.query !== query) {
      return;
    }
    state.deckAutocomplete.results = results;
    state.deckAutocomplete.activeIndex = results.length ? 0 : -1;
    state.deckAutocomplete.loading = false;
    renderDeckAutocompleteList();
    if (statusEl) {
      statusEl.textContent = results.length
        ? `${results.length} match${results.length === 1 ? "" : "es"}. Tap a card image to add.`
        : `No cards matched “${query}”.`;
    }
  } catch {
    if (requestId !== state.deckAutocomplete.requestId) {
      return;
    }
    state.deckAutocomplete.results = [];
    state.deckAutocomplete.activeIndex = -1;
    state.deckAutocomplete.loading = false;
    renderDeckAutocompleteList();
    if (statusEl) {
      statusEl.textContent = "Could not load card suggestions. Try again.";
    }
  }
}

function renderDeckAutocompleteList() {
  const listEl = getSectionSearchList();
  const searchInput = getSectionSearchInput();
  if (!listEl || !searchInput) {
    return;
  }

  const { results, activeIndex } = state.deckAutocomplete;
  listEl.classList.add("deck-autocomplete-grid");
  listEl.replaceChildren();

  if (!results.length) {
    listEl.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    return;
  }

  results.forEach((card, index) => {
    const item = document.createElement("li");
    item.setAttribute("role", "option");
    item.id = `deck-autocomplete-option-${index}`;
    item.className = "deck-autocomplete-option deck-autocomplete-card";
    if (index === activeIndex) {
      item.classList.add("active");
      item.setAttribute("aria-selected", "true");
    } else {
      item.setAttribute("aria-selected", "false");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "deck-autocomplete-card-button";
    button.dataset.autocompleteIndex = String(index);
    button.title = card.name;
    button.setAttribute("aria-label", `Add ${card.name}`);

    const imageUrl = getImageUrl(resolveCardImage(card));
    if (imageUrl) {
      const image = document.createElement("img");
      image.loading = "lazy";
      image.src = imageUrl;
      image.alt = card.name;
      image.onerror = () => {
        image.remove();
        button.textContent = card.name;
      };
      button.append(image);
    } else {
      button.textContent = card.name;
    }

    item.append(button);
    listEl.append(item);
  });

  listEl.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  if (activeIndex >= 0) {
    searchInput.setAttribute("aria-activedescendant", `deck-autocomplete-option-${activeIndex}`);
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function handleSectionDeckClick(event) {
  const openButton = event.target.closest("[data-open-section-search]");
  if (openButton) {
    openSectionSearch(openButton.dataset.openSectionSearch);
    return;
  }

  const suggestion = event.target.closest("[data-autocomplete-index]");
  if (suggestion) {
    event.preventDefault();
    state.deckAutocomplete.activeIndex = Number(suggestion.dataset.autocompleteIndex);
    addDeckAutocompleteSelection({ sourceButton: suggestion });
  }
}

function handleSectionDeckInput(event) {
  if (event.target.matches("[data-deck-card-search]")) {
    scheduleDeckAutocomplete(event.target.value);
  }
}

function handleSectionDeckKeydown(event) {
  if (!event.target.matches("[data-deck-card-search]")) {
    return;
  }

  const { results, activeIndex } = state.deckAutocomplete;
  if (event.key === "Escape") {
    event.preventDefault();
    resetDeckAutocomplete();
    renderDeck();
    return;
  }

  if (!results.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.deckAutocomplete.activeIndex = (activeIndex + 1) % results.length;
    renderDeckAutocompleteList();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.deckAutocomplete.activeIndex = activeIndex <= 0 ? results.length - 1 : activeIndex - 1;
    renderDeckAutocompleteList();
  }
}

async function handleSectionDeckSubmit(event) {
  const form = event.target.closest("[data-section-search]");
  if (!form) {
    return;
  }
  event.preventDefault();
  await addDeckAutocompleteSelection();
}

async function addDeckAutocompleteSelection({ sourceButton = null } = {}) {
  const searchInput = getSectionSearchInput();
  const statusEl = getSectionSearchStatus();
  const query = (searchInput?.value || state.deckAutocomplete.query || "").trim();
  const { results, activeIndex, section } = state.deckAutocomplete;
  let card = activeIndex >= 0 ? results[activeIndex] : null;

  if (!card && query) {
    if (statusEl) {
      statusEl.textContent = "Looking up card…";
    }
    card = await lookupCardByName(query);
  }

  if (!card) {
    if (statusEl) {
      statusEl.textContent = query ? `No card found for “${query}”.` : "Type a card name first.";
    }
    return;
  }

  const targetSection = normalizeDeckSection(section);
  state.deckAutocomplete.section = targetSection;
  state.deckAutocomplete.query = query || state.deckAutocomplete.query;
  if (!results.length) {
    state.deckAutocomplete.results = [card];
    state.deckAutocomplete.activeIndex = 0;
  }

  const animatedButton =
    sourceButton ||
    getActiveDeckList().querySelector(`[data-autocomplete-index="${activeIndex}"]`);
  if (animatedButton) {
    await playCardAddedAnimation(animatedButton);
  }

  addCardToDeck(card, 1, targetSection);
  showDeckToast("Added");

  const freshStatus = getSectionSearchStatus();
  if (freshStatus) {
    freshStatus.textContent = `Added ${card.name}. Tap another suggestion to keep adding.`;
  }
  getSectionSearchInput()?.focus();
}

function playCardAddedAnimation(button) {
  return new Promise((resolve) => {
    const card = button.closest(".deck-autocomplete-card") || button;
    const host = button.classList?.contains("deck-autocomplete-card-button")
      ? button
      : card.querySelector(".deck-autocomplete-card-button") || button;

    card.classList.remove("card-added-pop");
    host.querySelector(".card-added-overlay")?.remove();

    const overlay = document.createElement("span");
    overlay.className = "card-added-overlay";
    overlay.innerHTML = `<span class="card-added-check" aria-hidden="true">✓</span><span>Added</span>`;
    host.append(overlay);

    // Force reflow so the animation retriggers on rapid multi-adds.
    void card.offsetWidth;
    card.classList.add("card-added-pop");

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      card.removeEventListener("animationend", onEnd);
      resolve();
    };
    const onEnd = (event) => {
      if (event.target === card || event.target === overlay) {
        done();
      }
    };
    card.addEventListener("animationend", onEnd);
    window.setTimeout(done, 520);
  });
}

function showDeckToast(message = "Added") {
  const toast = getActiveDeckToast();
  if (!toast) {
    return;
  }
  window.clearTimeout(state.deckToastTimer);
  [deckToastEl, deckToastHomeEl].forEach((el) => {
    if (!el) return;
    el.classList.remove("show");
    el.hidden = true;
  });
  toast.textContent = message;
  toast.hidden = false;
  // Retrigger toast entrance animation.
  void toast.offsetWidth;
  toast.classList.add("show");
  state.deckToastTimer = window.setTimeout(() => {
    hideDeckToast();
  }, 1400);
}

function hideDeckToast() {
  window.clearTimeout(state.deckToastTimer);
  [deckToastEl, deckToastHomeEl].forEach((el) => {
    if (!el) return;
    el.classList.remove("show");
    el.hidden = true;
  });
}

function normalizeQuantity(value) {
  return Math.max(1, Number.parseInt(value, 10) || 1);
}

function normalizeDeckSection(section) {
  return DECK_SECTIONS.some((item) => item.key === section) ? section : "main";
}

function normalizeStoredDeck(deck) {
  if (!Array.isArray(deck)) {
    return [];
  }
  return deck.map((card) => ({
    ...card,
    quantity: normalizeQuantity(card.quantity),
    section: normalizeDeckSection(card.section),
    types: Array.isArray(card.types) ? card.types : [],
    level: card.level ?? null,
    costType: card.costType || "",
  }));
}

function deckCardMetadata(card) {
  return {
    types: Array.isArray(card.types) ? card.types.map((type) => String(type).toUpperCase()) : [],
    subtypes: Array.isArray(card.subtypes)
      ? card.subtypes.map((type) => String(type).toUpperCase())
      : [],
    level: card.level ?? null,
    costType: String(card.cost?.type || card.costType || "").toLowerCase(),
  };
}

function defaultDeckSection(card) {
  const types = new Set((card.types || []).map((type) => String(type).toUpperCase()));
  const costType = String(card.cost?.type || card.costType || "").toLowerCase();
  if (types.has("CHAMPION") || types.has("REGALIA") || costType === "memory") {
    return "material";
  }
  return "main";
}

function getMaxQuantityForCard(card) {
  return getMaxQuantityForSection(normalizeDeckSection(card.section), card);
}

function getMaxQuantityForSection(section, card) {
  if (section === "material") {
    return 1;
  }
  if (section === "sideboard" && isMaterialCard(card)) {
    return 1;
  }
  return 4;
}

function isMaterialCard(card) {
  const types = new Set((card.types || []).map((type) => String(type).toUpperCase()));
  const costType = String(card.costType || card.cost?.type || "").toLowerCase();
  return types.has("CHAMPION") || types.has("REGALIA") || costType === "memory";
}

function isChampionCard(card) {
  return (card.types || []).some((type) => String(type).toUpperCase() === "CHAMPION");
}

/** Champions and Spirits from Material go to the Champion area. */
function isChampionAreaCard(card) {
  if (!card) {
    return false;
  }
  const types = (card.types || []).map((type) => String(type).toUpperCase());
  const subtypes = (card.subtypes || []).map((type) => String(type).toUpperCase());
  return (
    types.includes("CHAMPION") ||
    types.includes("SPIRIT") ||
    subtypes.includes("SPIRIT") ||
    subtypes.includes("CHAMPION")
  );
}

function getDeckTotal() {
  return state.deck.reduce((total, card) => total + normalizeQuantity(card.quantity), 0);
}

function getSectionTotal(sectionKey) {
  return state.deck
    .filter((card) => normalizeDeckSection(card.section) === sectionKey)
    .reduce((total, card) => total + normalizeQuantity(card.quantity), 0);
}

function getSideboardPoints() {
  return state.deck
    .filter((card) => normalizeDeckSection(card.section) === "sideboard")
    .reduce((total, card) => {
      const pointsEach = isMaterialCard(card) ? 3 : 1;
      return total + pointsEach * normalizeQuantity(card.quantity);
    }, 0);
}

function getDeckValidation() {
  const materialTotal = getSectionTotal("material");
  const mainTotal = getSectionTotal("main");
  const sideTotal = getSectionTotal("sideboard");
  const sidePoints = getSideboardPoints();
  const materialCards = state.deck.filter((card) => normalizeDeckSection(card.section) === "material");
  const hasLevelZeroChampion = materialCards.some(
    (card) => isChampionCard(card) && Number(card.level) === 0,
  );
  const materialOvercopies = materialCards.filter((card) => normalizeQuantity(card.quantity) > 1);
  const mainOvercopies = state.deck.filter(
    (card) => normalizeDeckSection(card.section) === "main" && normalizeQuantity(card.quantity) > 4,
  );

  return [
    {
      ok: materialTotal > 0 && materialTotal <= 12,
      message:
        materialTotal === 0
          ? "Material deck needs cards (max 12)."
          : materialTotal <= 12
            ? `Material deck size OK (${materialTotal}/12).`
            : `Material deck is over limit (${materialTotal}/12).`,
    },
    {
      ok: hasLevelZeroChampion,
      message: hasLevelZeroChampion
        ? "Material deck includes a Level 0 champion."
        : "Material deck needs at least one Level 0 champion.",
    },
    {
      ok: materialOvercopies.length === 0,
      message:
        materialOvercopies.length === 0
          ? "Material copies OK (max 1 each)."
          : `Material copy limit exceeded: ${materialOvercopies.map((card) => card.name).join(", ")}.`,
    },
    {
      ok: mainTotal >= 60,
      message:
        mainTotal >= 60
          ? `Main deck size OK (${mainTotal}/60+).`
          : `Main deck needs ${60 - mainTotal} more card${60 - mainTotal === 1 ? "" : "s"} (currently ${mainTotal}).`,
    },
    {
      ok: mainOvercopies.length === 0,
      message:
        mainOvercopies.length === 0
          ? "Main copies OK (max 4 each)."
          : `Main copy limit exceeded: ${mainOvercopies.map((card) => card.name).join(", ")}.`,
    },
    {
      ok: sideTotal <= 15 && sidePoints <= SIDEBOARD_POINT_LIMIT,
      message:
        sideTotal === 0 && sidePoints === 0
          ? "Sideboard empty (optional, max 15 cards / 15 points)."
          : sideTotal <= 15 && sidePoints <= SIDEBOARD_POINT_LIMIT
            ? `Sideboard OK (${sideTotal} cards, ${sidePoints} points).`
            : `Sideboard over limit (${sideTotal} cards, ${sidePoints} points; max 15 / ${SIDEBOARD_POINT_LIMIT}).`,
    },
  ];
}

function buildShareUrl() {
  const url = new URL(window.location.href);
  if (state.query) {
    url.searchParams.set("q", state.query);
  } else {
    url.searchParams.delete("q");
  }
  return url.toString();
}

function updateShareUrl(query) {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.delete("q");
  }
  window.history.replaceState({}, "", url);
}

function getInitialQuery() {
  return new URLSearchParams(window.location.search).get("q") || "";
}

function appendQueryToken(query, token) {
  const trimmed = query.trim();
  return trimmed ? `${trimmed} ${token}` : token;
}

function removePhrasesFromQuery(query, phrases) {
  let next = ` ${query} `;
  for (const phrase of phrases.filter(Boolean)) {
    next = next.replace(new RegExp(String.raw`\b${escapeRegex(phrase)}\b`, "ig"), " ");
  }
  return next.replace(/\s+/g, " ").trim();
}

function loadStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function getCardKey(card) {
  return card.uuid || card.slug || card.name;
}

function buildExplanation(parsed) {
  if (!parsed) return "Search terms will be explained here.";
  const parts = [];
  for (const match of parsed.matchedLabels) {
    parts.push(`${match.field}: ${match.text}`);
  }
  if (parsed.effectQuery) {
    const effectLabel =
      parsed.effectTerms?.length > 1
        ? parsed.effectTerms.join(" AND ")
        : parsed.effectQuery;
    parts.push(`Effect contains: ${effectLabel}`);
  }
  if (parsed.nameQuery) parts.push(`Name like: ${parsed.nameQuery}`);
  if (parts.length === 0) return "No structured filters detected; searching by card name or effect text.";
  return `Interpreted as ${parts.join("; ")}.`;
}

function render() {
  if (!statusEl || !resultsEl) {
    return;
  }
  statusEl.textContent = state.status;
  explanationEl.textContent = buildExplanation(state.parsed);
  renderChips();
  renderCards();
  renderDeck();
  if (loadMoreButton) {
    loadMoreButton.disabled = state.loading;
    loadMoreButton.textContent = state.loading ? "Loading..." : "Load more";
  }
  updateLibraryResultActions();
}

function updateLibraryResultActions() {
  if (libraryLoadAllCheckbox) {
    libraryLoadAllCheckbox.checked = state.loadAllResults;
  }
  const canShowAll = Boolean(state.parsed) && !state.reachedEnd && !state.loadAllResults;
  showAllResultsButton?.classList.toggle("hidden", !canShowAll);
  showAllResultsButton && (showAllResultsButton.disabled = state.loading);
  if (showAllResultsButton) {
    showAllResultsButton.textContent = state.loading ? "Loading..." : "Show all";
  }
  loadMoreButton?.classList.toggle("hidden", !state.parsed || state.reachedEnd || state.loadAllResults);
}

function renderChips() {
  chipsEl.replaceChildren();

  if (!state.parsed) {
    return;
  }

  for (const match of state.parsed.matchedLabels) {
    chipsEl.append(createChip(`${titleCase(match.field)}: ${match.text}`, match.phrases));
  }

  if (state.parsed.effectQuery) {
    const effectLabel =
      state.parsed.effectTerms?.length > 1
        ? state.parsed.effectTerms.join(" AND ")
        : state.parsed.effectQuery;
    chipsEl.append(createChip(`Effect: ${effectLabel}`, [state.parsed.effectQuery, ...(state.parsed.effectTerms || [])]));
  } else if (state.parsed.nameQuery) {
    chipsEl.append(createChip(`Name: ${state.parsed.nameQuery}`));
  }
}

function renderCards() {
  if (!resultsEl) {
    return;
  }
  resultsEl.replaceChildren();

  if (state.loading && state.cards.length === 0) {
    for (let index = 0; index < 8; index += 1) {
      const skeleton = document.createElement("div");
      skeleton.className = "skeleton-card";
      resultsEl.append(skeleton);
    }
    return;
  }

  if (!state.loading && state.cards.length === 0) {
    resultsEl.append(
      createEmptyState("No cards matched. Try removing a set/stat filter, using a shorter effect phrase, or clicking a keyword helper."),
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const card of getSortedLibraryCards(state.cards)) {
    fragment.append(createCardButton(card));
  }
  resultsEl.append(fragment);
}

function getSortedLibraryCards(cards) {
  const sorted = [...cards];
  const mode = state.librarySort;

  sorted.sort((left, right) => {
    let comparison = 0;
    if (mode === "cost-asc" || mode === "cost-desc") {
      comparison = getCardSortCost(left) - getCardSortCost(right);
      if (mode === "cost-desc") {
        comparison *= -1;
      }
    } else if (mode === "element-asc" || mode === "element-desc") {
      comparison = getCardSortElement(left).localeCompare(getCardSortElement(right));
      if (mode === "element-desc") {
        comparison *= -1;
      }
    } else if (mode === "rarity-asc" || mode === "rarity-desc") {
      comparison = getCardSortRarityRank(left) - getCardSortRarityRank(right);
      if (mode === "rarity-desc") {
        comparison *= -1;
      }
      if (comparison === 0) {
        comparison = getCardSortRarityLabel(left).localeCompare(getCardSortRarityLabel(right));
        if (mode === "rarity-desc") {
          comparison *= -1;
        }
      }
    } else if (mode === "type-asc" || mode === "type-desc") {
      comparison = getCardSortType(left).localeCompare(getCardSortType(right));
      if (mode === "type-desc") {
        comparison *= -1;
      }
    }

    if (comparison !== 0) {
      return comparison;
    }
    return String(left.name || "").localeCompare(String(right.name || ""));
  });

  return sorted;
}

function getCardSortCost(card) {
  const value = parseStatNumber(card.cost?.value);
  return value == null || Number.isNaN(value) ? Number.POSITIVE_INFINITY : value;
}

function getCardSortElement(card) {
  const elements = (card.elements || []).map((element) => normalizeText(element)).filter(Boolean);
  return elements.sort().join(" ") || "zzz";
}

function getCardSortRarityLabel(card) {
  const rarities = getEditions(card)
    .map((edition) => String(edition?.rarity || "").trim())
    .filter(Boolean);
  if (rarities.length === 0) {
    return "";
  }
  // Prefer the highest-ranked printing when a card has multiple editions.
  return [...rarities].sort(
    (left, right) => getRarityRankValue(right) - getRarityRankValue(left),
  )[0];
}

function getCardSortRarityRank(card) {
  return getRarityRankValue(getCardSortRarityLabel(card));
}

function getRarityRankValue(rarity) {
  const key = normalizeText(rarity);
  if (!key) {
    return 0;
  }
  if (Object.prototype.hasOwnProperty.call(RARITY_RANK, key)) {
    return RARITY_RANK[key];
  }
  // Unknown codes: keep them sorted after known tiers but stable by label.
  return 5;
}

function getCardSortType(card) {
  const types = (card.types || [])
    .map((type) => normalizeText(type))
    .filter(Boolean)
    .sort();
  return types.join(" ") || "zzz";
}

function createCardButton(card) {
  const edition = getPrimaryEdition(card);
  const imageUrl = getImageUrl(edition?.image);
  const cardKey = getCardKey(card);
  const deckEntry = state.deck.find((item) => item.key === cardKey);
  const targetSection = defaultDeckSection(card);
  const toMaterial = targetSection === "material";
  const maxQuantity = getMaxQuantityForSection(targetSection, card);
  const sectionLabel = targetSection === "material" ? "Material Deck" : "Main Deck";

  const item = document.createElement("article");
  item.className = "card-tile result-grid-card";
  item.title = card.name;
  item.classList.toggle("in-deck", Boolean(deckEntry));

  const imageButton = document.createElement("button");
  imageButton.className = "result-grid-card-image";
  imageButton.type = "button";
  imageButton.setAttribute("aria-label", `Open details for ${card.name}`);
  imageButton.addEventListener("click", () => openLightbox(card, { source: "search" }));

  if (imageUrl) {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = card.name;
    image.onerror = () => {
      image.remove();
      imageButton.append(createPlaceholder(card.name));
    };
    imageButton.append(image);
  } else {
    imageButton.append(createPlaceholder(card.name));
  }

  const addedMessage = document.createElement("span");
  addedMessage.className = "result-added-message";
  addedMessage.setAttribute("aria-live", "polite");
  if (state.resultAddedMessages[cardKey]) {
    addedMessage.textContent = state.resultAddedMessages[cardKey];
    addedMessage.classList.add("show");
  }

  const markResultAdded = (amount) => {
    state.resultSelectedQuantities[cardKey] = String(amount);
    state.resultAddedMessages[cardKey] = `${amount} Added`;
    window.clearTimeout(state.resultFeedbackTimers[cardKey]);
    state.resultFeedbackTimers[cardKey] = window.setTimeout(() => {
      delete state.resultAddedMessages[cardKey];
      delete state.resultSelectedQuantities[cardKey];
      renderCards();
    }, 1300);
  };

  // Champion / Regalia: one-click + adds 1 copy to Material Deck.
  if (toMaterial) {
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "deck-grid-qty result-grid-qty result-grid-add";
    addButton.dataset.addCardQuantity = cardKey;
    addButton.setAttribute("aria-label", `Add 1 ${card.name} to ${sectionLabel}`);
    addButton.textContent = "+";
    addButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addCardToDeck(card, 1, "material");
      markResultAdded(1);
    });
    item.append(imageButton, addButton, addedMessage);
    return item;
  }

  const quantitySelect = document.createElement("select");
  quantitySelect.className = "deck-grid-qty result-grid-qty";
  quantitySelect.setAttribute("aria-label", `Add ${card.name} to ${sectionLabel}`);
  quantitySelect.dataset.addCardQuantity = cardKey;
  quantitySelect.append(createOption("", "+"));
  for (let quantity = 1; quantity <= maxQuantity; quantity += 1) {
    quantitySelect.append(createOption(String(quantity), String(quantity)));
  }
  quantitySelect.value = state.resultSelectedQuantities[cardKey] || "";

  quantitySelect.addEventListener("click", (event) => event.stopPropagation());
  quantitySelect.addEventListener("change", (event) => {
    event.stopPropagation();
    const amount = Number(quantitySelect.value);
    if (!amount) {
      return;
    }

    addCardToDeck(card, amount, targetSection);
    markResultAdded(amount);
  });

  item.append(imageButton, quantitySelect, addedMessage);
  return item;
}

function createEmptyState(message) {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function createChip(text, removablePhrases = []) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = text;
  if (removablePhrases.length > 0) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removePhrase = removablePhrases.join("||");
    remove.setAttribute("aria-label", `Remove ${text}`);
    remove.textContent = "×";
    chip.append(remove);
  }
  return chip;
}

function createPlaceholder(name) {
  const placeholder = document.createElement("span");
  placeholder.className = "placeholder-card";
  placeholder.textContent = name;
  return placeholder;
}

function getLightboxCardList(source = "search") {
  if (source === "deck") {
    return state.deck.slice();
  }
  return getSortedLibraryCards(state.cards);
}

function openLightbox(card, { source = "search" } = {}) {
  if (!card || !lightbox || !lightboxImage) {
    return;
  }

  const cards = getLightboxCardList(source);
  const key = getCardKey(card);
  let index = cards.findIndex((item) => getCardKey(item) === key);
  if (index < 0) {
    index = cards.findIndex(
      (item) => String(item.name || "").toLowerCase() === String(card.name || "").toLowerCase(),
    );
  }

  if (index < 0) {
    state.lightboxCards = [card];
    state.lightboxIndex = 0;
  } else {
    // Prefer the opened card object (may have fuller API data than a deck entry).
    const nextCards = cards.slice();
    nextCards[index] = card;
    state.lightboxCards = nextCards;
    state.lightboxIndex = index;
  }

  state.lightboxSource = source;
  renderLightboxCard();
  lightbox.showModal();
  lightboxCloseFocus();
}

function renderLightboxCard() {
  const card = state.lightboxCards[state.lightboxIndex];
  state.activeLightboxCard = card || null;
  if (!card || !lightboxImage) {
    return;
  }

  const imageUrl = getImageUrl(resolveCardImage(card));
  lightboxImage.src = imageUrl || "";
  lightboxImage.alt = card.name || "Card";
  lightboxImage.classList.toggle("hidden", !imageUrl);
  lightbox.setAttribute("aria-label", card.name ? `${card.name} image` : "Card image");
  updateLightboxNav();
}

function updateLightboxNav() {
  const total = state.lightboxCards.length;
  const index = state.lightboxIndex;
  const atStart = index <= 0;
  const atEnd = index < 0 || index >= total - 1;
  if (lightboxPrevButton) {
    lightboxPrevButton.disabled = atStart || total <= 1;
    lightboxPrevButton.hidden = total <= 1;
  }
  if (lightboxNextButton) {
    lightboxNextButton.disabled = atEnd || total <= 1;
    lightboxNextButton.hidden = total <= 1;
  }
}

function stepLightbox(delta) {
  if (!lightbox?.open || state.lightboxCards.length <= 1) {
    return;
  }
  const next = state.lightboxIndex + delta;
  if (next < 0 || next >= state.lightboxCards.length) {
    return;
  }
  state.lightboxIndex = next;
  renderLightboxCard();
}

function lightboxCloseFocus() {
  closeLightboxButton?.focus();
}

function closeLightbox() {
  lightbox?.close();
  state.activeLightboxCard = null;
}

function buildStatus(count, parsed, usedFallback) {
  const criteria = [];
  for (const field of ["element", "type", "subtype", "class", "prefix", "speed", "rarity"]) {
    if (parsed.filters[field].length > 0) {
      criteria.push(`${field} ${parsed.filters[field].join(", ")}`);
    }
  }
  for (const field of ["element", "type", "subtype", "class", "prefix", "speed", "rarity"]) {
    if (parsed.excludeFilters[field].length > 0) {
      criteria.push(`not ${field} ${parsed.excludeFilters[field].join(", ")}`);
    }
  }
  for (const filter of parsed.statFilters) {
    criteria.push(`${filter.label} ${formatOperator(filter.operator)} ${filter.value}`);
  }
  if (parsed.legality.format) {
    criteria.push(`${parsed.legality.format} ${parsed.legality.state}`);
  }
  if (parsed.effectQuery) {
    const effectLabel =
      parsed.effectTerms?.length > 1
        ? parsed.effectTerms.join(" AND ")
        : parsed.effectQuery;
    criteria.push(`effect "${effectLabel}"`);
  } else if (parsed.nameQuery) {
    criteria.push(`name "${parsed.nameQuery}"`);
  }

  const fallback = usedFallback ? " Name search had no results, so effect text was searched." : "";
  return `${count} card${count === 1 ? "" : "s"} found${
    criteria.length ? ` for ${criteria.join(" + ")}` : ""
  }.${fallback}`;
}

function appendAll(params, key, values) {
  for (const value of values) {
    params.append(key, value);
  }
}

function containsPhrase(haystack, phrase) {
  return new RegExp(String.raw`(^|\s)${escapeRegex(phrase)}($|\s)`).test(haystack);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatCardLine(card) {
  return [
    (card.elements || []).map(titleCase).join(" / "),
    (card.types || []).map(titleCase).join(" / "),
    (card.subtypes || []).map(titleCase).join(" / "),
  ]
    .filter(Boolean)
    .join(" · ");
}

function formatCost(cost) {
  if (!cost || cost.type === "none" || cost.value == null) {
    return "";
  }

  return `${cost.value} ${titleCase(cost.type)}`;
}

function getImageUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${API_BASE}${path}`;
}

function resolveCardImage(card) {
  if (!card) {
    return "";
  }
  if (card.image) {
    return card.image;
  }

  const editionWithImage = getEditions(card).find((edition) => edition?.image);
  return editionWithImage?.image || getPrimaryEdition(card)?.image || "";
}

function getPrimaryEdition(card) {
  return card.result_editions?.[0] || card.editions?.[0] || card.edition || null;
}

function getEditions(card) {
  return [
    ...(card.result_editions || []),
    ...(card.editions || []),
    card.edition,
  ].filter(Boolean);
}

function normalizeOptions(options, fallback) {
  return Array.isArray(options) && options.length > 0 ? options : fallback;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9+'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeWords(value) {
  return value
    .split(/\s+/)
    .map((word) => {
      if (word.length > 3 && word.endsWith("ies")) {
        return `${word.slice(0, -3)}y`;
      }
      if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
        return word.slice(0, -1);
      }
      return word;
    })
    .join(" ");
}

function statValue(stat) {
  if (stat == null) {
    return "";
  }

  if (typeof stat === "object") {
    return stat.value ?? stat.amount ?? stat.display ?? "";
  }

  return String(stat);
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .split(" ")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const unique = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  return unique;
}
