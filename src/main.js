const API_BASE = "https://api.gatcg.com";
const PAGE_SIZE = 50;
const EXAMPLE_QUERY = "fire spells that target units";
const DECK_STORAGE_KEY = "advga.deck";
const DECK_NAME_STORAGE_KEY = "advga.deckName";
const RECENT_SEARCHES_KEY = "advga.recentSearches";
const FREEHAND_STORAGE_KEY = "advga.mainDeckFreehand";
const MAX_RECENT_SEARCHES = 8;
const APP_VERSION = "0.76";
const OPENING_HAND_HOLD_PREVIEW_MS = 2000;
const OPENING_HAND_DRAW_GLOW_MS = 3000;
const OPENING_HAND_TAP_WINDOW_MS = 380;
const OPENING_HAND_FACE_FLIP_MS = 280;
const CARD_BACK_URL = `${import.meta.env.BASE_URL}card-back.jpg`;
const IS_TRYIT_PAGE = document.body?.dataset?.page === "tryit";
const BUILDER_PAGE_URL = import.meta.env.BASE_URL;
const TRYIT_PAGE_URL = `${import.meta.env.BASE_URL}tryit.html`;

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
];

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
  set: [{ text: "Radiant Origins", value: "RDO", display: "Radiant Origins" }],
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
    "WEAPON",
  ].map((value) => ({ text: titleCase(value), value })),
};

const OPTION_ALIASES = {
  element: {
    NORM: ["normal", "normal element"],
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
  recentSearches: loadStoredJson(RECENT_SEARCHES_KEY, []),
  sort: SORT_OPTIONS[0],
  librarySort: "default",
  activeLightboxCard: null,
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
  openingHandHand: [],
  openingHandDealToken: 0,
  openingHandDealComplete: true,
  openingHandPreviewEscBound: false,
  openingHandTurn: 1,
  tryitMenuOpen: false,
  searchFiltersOpen: false,
  status: "Loading Grand Archive card terms...",
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
            Search by plain English, then refine with filters and keywords.
          </p>
        </div>
      </summary>
      <div class="section-body hero-body">
        <div class="hero-brand">
          <p class="eyebrow">Grand Archive TCG Deck Builder</p>
          <h2 class="hero-product-title">Grand Archive Advanced Book by RPGgamerPH</h2>
          <p class="hero-copy">
            Search by plain English, build Material and Main decks with live legality checks, then export a ready-to-paste list.
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
                placeholder="normal ally that cost 2 in RDO"
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
              <label>
                Element
                <select id="quick-filter-element" name="element">
                  <option value="">Any</option>
                </select>
              </label>
              <label>
                Type
                <select id="quick-filter-type" name="type">
                  <option value="">Any</option>
                </select>
              </label>
              <label>
                Subtype
                <select id="quick-filter-subtype" name="subtype">
                  <option value="">Any</option>
                </select>
              </label>
            </div>
            <p class="hint search-filter-hint">
              Use <strong>AND</strong> in Effect to require multiple words (example: <code>hand AND memory</code>).
            </p>
            <div class="search-filter-actions">
              <button type="button" id="apply-search-filters">Apply filters</button>
              <button class="ghost" type="button" id="clear-search-filters">Clear filters</button>
            </div>
          </div>
          <datalist id="search-suggestions"></datalist>
          <div class="quick-searches" aria-label="Example searches">
            <button type="button" data-example="normal ally that cost 2 in RDO">
              normal ally that cost 2 in RDO
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
        <label class="library-sort summary-action" for="library-sort">
          Sort
          <select id="library-sort" class="summary-action" aria-label="Sort library results">
            <option value="default">Default</option>
            <option value="cost-asc">Cost low → high</option>
            <option value="cost-desc">Cost high → low</option>
            <option value="element-asc">Element A → Z</option>
            <option value="element-desc">Element Z → A</option>
          </select>
        </label>
      </summary>
      <div class="section-body">
        <section class="results-grid" id="results" aria-label="Search results"></section>
        <div class="actions">
          <button class="secondary hidden" type="button" id="load-more">Load more</button>
        </div>
      </div>
    </details>
  </main>

  <dialog class="lightbox" id="lightbox" aria-labelledby="lightbox-title">
    <button class="icon-button" id="close-lightbox" aria-label="Close card details">×</button>
    <article class="lightbox-card">
      <div class="lightbox-image-wrap">
        <img id="lightbox-image" alt="" />
      </div>
      <div class="lightbox-details">
        <p class="eyebrow" id="lightbox-set"></p>
        <h2 id="lightbox-title"></h2>
        <div class="detail-tags" id="lightbox-tags"></div>
        <dl class="stat-list" id="lightbox-stats"></dl>
        <p class="effect-text" id="lightbox-effect"></p>
        <label class="lightbox-quantity-control" for="lightbox-quantity-select">
          Add quantity
          <select id="lightbox-quantity-select" aria-label="Add quantity from lightbox">
            <option value="">Add</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
          <span class="result-added-message lightbox-added-message" id="lightbox-added-message" aria-live="polite"></span>
        </label>
      </div>
    </article>
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
        <p class="eyebrow">Try it!</p>
        <div class="tryit-page-title-row">
          <h1>Playtest</h1>
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
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-settings="true">Settings</button>
              <button class="tryit-menu-item" type="button" role="menuitem" data-tryit-menu-close="true">Close</button>
            </div>
          </div>
        </div>
        <p class="hint tryit-deck-name">Deck: <strong>${deckLabel}</strong></p>
      </div>
    </header>
    <section class="panel tryit-playmat-panel" aria-label="Try it playmat">
      <div class="tryit-page-actions" id="tryit-actions">
        <button class="ghost compact" type="button" data-redeal-opening-hand="true">Redeal</button>
        <button class="ghost compact" type="button" data-organize-opening-hand="true">Organize hand</button>
        <button class="ghost compact" type="button" data-recollect-opening-hand="true" title="Move all Memory cards back to Hand">Recollect</button>
        <button class="ghost compact" type="button" data-banish-opening-hand="true" title="Banish 1 random card from Memory">Banish random</button>
        <a class="secondary compact tryit-back-link" href="${BUILDER_PAGE_URL}">Back to deck builder</a>
        <div class="tryit-turn-controls">
          <p class="tryit-turn-label" id="tryit-turn-label" aria-live="polite">Turn 1</p>
          <button class="secondary compact" type="button" data-end-turn="true">End turn</button>
        </div>
      </div>
      <div id="tryit-root"></div>
    </section>
  </main>

  <dialog class="material-dialog" id="material-dialog" aria-labelledby="material-dialog-title">
    <div class="material-dialog-shell">
      <header class="material-dialog-header">
        <div>
          <p class="eyebrow">Try it!</p>
          <h2 id="material-dialog-title">Material Deck</h2>
          <p class="hint">Choose a champion or material card to play onto the Field.</p>
        </div>
        <button class="icon-button" type="button" id="close-material-dialog" aria-label="Close material deck">×</button>
      </header>
      <div class="material-dialog-grid" id="material-dialog-grid"></div>
      <p class="hint material-dialog-empty" id="material-dialog-empty" hidden>No material cards left.</p>
    </div>
  </dialog>
`;
}

if (IS_TRYIT_PAGE) {
  app.innerHTML = getTryItShellHtml();
} else {
  app.innerHTML = getBuilderShellHtml();
}

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const clearSearchButton = document.querySelector("#clear-search");
const toggleSearchFiltersButton = document.querySelector("#toggle-search-filters");
const searchFiltersEl = document.querySelector("#search-filters");
const quickFilterEffect = document.querySelector("#quick-filter-effect");
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
const lightbox = document.querySelector("#lightbox");
const closeLightboxButton = document.querySelector("#close-lightbox");
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
const materialDialog = document.querySelector("#material-dialog");
const materialDialogGrid = document.querySelector("#material-dialog-grid");
const materialDialogEmpty = document.querySelector("#material-dialog-empty");
const closeMaterialDialogButton = document.querySelector("#close-material-dialog");
const clearFiltersButton = document.querySelector("#clear-filters");
const scrollTopButton = document.querySelector("#scroll-top");
const lightboxQuantitySelect = document.querySelector("#lightbox-quantity-select");
const lightboxAddedMessage = document.querySelector("#lightbox-added-message");

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

if (IS_TRYIT_PAGE) {
  bootTryItPage();
} else {
  bootBuilderPage();
}

function bootTryItPage() {
  const page = document.querySelector(".tryit-page");
  page?.addEventListener("click", (event) => {
    handleTryItActionClick(event);
  });
  document.addEventListener("click", (event) => {
    if (!state.tryitMenuOpen) {
      return;
    }
    if (event.target.closest("#tryit-menu")) {
      return;
    }
    setTryItMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.tryitMenuOpen) {
      setTryItMenuOpen(false);
    }
  });
  window.addEventListener("resize", () => {
    const board = getActiveOpeningHandBoard();
    if (board) {
      resizeOpeningHandField(board);
    }
  });
  startOpeningHandSession();
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
    librarySortSelect.value = state.librarySort;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch(input.value.trim(), { reset: true, remember: true, scrollToLibrary: true });
  });

  toggleSearchFiltersButton.addEventListener("click", () => {
    state.searchFiltersOpen = !state.searchFiltersOpen;
    updateSearchFiltersVisibility();
    if (state.searchFiltersOpen) {
      quickFilterEffect.focus();
    }
  });

  applySearchFiltersButton.addEventListener("click", () => {
    runSearch(input.value.trim(), {
      reset: true,
      remember: Boolean(input.value.trim()),
      scrollToLibrary: true,
    });
  });

  clearSearchFiltersButton.addEventListener("click", () => {
    quickFilterEffect.value = "";
    quickFilterElement.value = "";
    quickFilterType.value = "";
    quickFilterSubtype.value = "";
    updateSearchFiltersButtonState();
    runSearch(input.value.trim(), { reset: true, remember: false, scrollToLibrary: true });
  });

  [quickFilterEffect, quickFilterElement, quickFilterType, quickFilterSubtype].forEach((field) => {
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

  loadMoreButton.addEventListener("click", () => {
    if (!state.loading && !state.reachedEnd) {
      runSearch(state.query, { reset: false, remember: false });
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
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });

  lightboxQuantitySelect.addEventListener("change", () => {
    const amount = Number(lightboxQuantitySelect.value);
    if (!amount || !state.activeLightboxCard) {
      return;
    }

    const cardKey = getCardKey(state.activeLightboxCard);
    state.resultSelectedQuantities[cardKey] = String(amount);
    state.resultAddedMessages[cardKey] = `${amount} Added`;
    window.clearTimeout(state.resultFeedbackTimers[cardKey]);
    addCardToDeck(state.activeLightboxCard, amount, "main");
    showLightboxAddedMessage(`${amount} Added`);
    state.resultFeedbackTimers[cardKey] = window.setTimeout(() => {
      delete state.resultAddedMessages[cardKey];
      renderCards();
    }, 1300);
  });

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

  closeLightboxButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.open) {
      closeLightbox();
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

async function runSearch(query, { reset, remember = false, scrollToLibrary = false } = {}) {
  const hasQuickFilters = hasActiveQuickFilters();
  if (!query && !hasQuickFilters) {
    state.cards = [];
    state.parsed = null;
    state.query = "";
    state.status = "Enter a search such as “fire spells that target units”.";
    state.reachedEnd = true;
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
  }

  state.loading = true;
  state.query = query;
  state.parsed = applyQuickFilters(parseNaturalQuery(query, state.options));
  state.status = reset ? "Searching cards..." : "Loading more cards...";
  render();
  if (scrollToLibrary) {
    scrollLibraryIntoView();
  }

  try {
    const { cards, usedFallback } = await fetchCards(state.parsed, state.page);
    const visibleCards = cards.filter((card) => cardMatchesParsedQuery(card, state.parsed));
    const nextCards = visibleCards;
    const uniqueCards = uniqueBy(
      reset ? nextCards : [...state.cards, ...nextCards],
      (card) => card.uuid || card.slug || card.name,
    );

    state.cards = uniqueCards;
    state.page += 1;
    state.reachedEnd = cards.length < PAGE_SIZE;
    state.status = buildStatus(state.cards.length, state.parsed, usedFallback);
  } catch (error) {
    console.error(error);
    state.status = "Could not reach the Grand Archive API. Please try again.";
  } finally {
    state.loading = false;
    render();
  }
}

async function fetchCards(parsed, page) {
  const params = buildSearchParams(parsed, page);
  let response = await fetch(`${API_BASE}/cards/search?${params}`);
  if (!response.ok) {
    throw new Error(`Grand Archive search returned ${response.status}`);
  }

  let payload = await response.json();
  let cards = Array.isArray(payload.data) ? payload.data : [];

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
    return { cards, usedFallback: true };
  }

  return { cards, usedFallback: false };
}

function buildSearchParams(parsed, page) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
    sort: parsed.sort.sort,
    order: parsed.sort.order,
  });

  appendAll(params, "element", parsed.filters.element);
  appendAll(params, "type", parsed.filters.type);
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
    fieldMatches(card.types, parsed.filters.type) &&
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
      quickFilterElement?.value ||
      quickFilterType?.value ||
      quickFilterSubtype?.value,
  );
}

function applyQuickFilters(parsed) {
  const effectValue = quickFilterEffect?.value.trim() || "";
  const element = quickFilterElement?.value || "";
  const type = quickFilterType?.value || "";
  const subtype = quickFilterSubtype?.value || "";

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

  if (element) {
    parsed.filters.element = [element];
  }
  if (type) {
    parsed.filters.type = [type];
  }
  if (subtype) {
    parsed.filters.subtype = [subtype];
  }

  return parsed;
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
  fillSelect("#filter-set", state.options.set, "Any set");
  fillSelect("#filter-speed", SPEED_OPTIONS, "Any speed");
  fillSelect(
    "#filter-stat",
    STAT_DEFINITIONS.map((stat) => ({ text: stat.label, value: stat.key })),
    "No stat filter",
  );
  fillSelect("#quick-filter-element", state.options.element, "Any");
  fillSelect("#quick-filter-type", state.options.type, "Any");
  fillSelect("#quick-filter-subtype", state.options.subtype, "Any");
}

function renderSearchSuggestions() {
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

function fillSelect(selector, options, placeholder) {
  const select = document.querySelector(selector);
  select.replaceChildren(createOption("", placeholder));
  for (const option of options || []) {
    select.append(createOption(option.value, option.display || option.text || option.value));
  }
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
  item.title = card.name;

  const imageWrap = document.createElement("div");
  imageWrap.className = "deck-grid-card-image";
  const imageUrl = getImageUrl(resolveCardImage(card));
  if (imageUrl) {
    const image = document.createElement("img");
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

  if (individual) {
    remove.dataset.removeOneDeck = card.key;
    remove.setAttribute("aria-label", `Remove one ${card.name}`);
    remove.textContent = "×";
    item.append(imageWrap, remove);
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

  item.append(imageWrap, quantity, remove);
  return item;
}

function createMainDeckFreehandBoard(sectionCards) {
  const board = document.createElement("div");
  board.className = "deck-freehand-board";
  board.dataset.mainFreehandBoard = "true";

  const hint = document.createElement("p");
  hint.className = "hint deck-freehand-hint";
  hint.textContent = "Drag cards onto the grid to stack or arrange. Positions are kept when you leave Freehand mode.";
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
  item.title = card.name;

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
  enableFreehandDrag(item, instanceId);
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

function enableFreehandDrag(cardEl, instanceId) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originPointerX = 0;
  let originPointerY = 0;

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
  state.openingHandTurn = 1;
  setTryItMenuOpen(false);
  closeMaterialDialog();
  hideOpeningHandCardPreview();
  saveMainDeckFreehandState();
  if (IS_TRYIT_PAGE) {
    updateTryItTurnLabel();
    renderTryItPage();
  }
}

function exitOpeningHandSession() {
  state.mainDeckOpeningHand = false;
  state.openingHandLibrary = [];
  state.openingHandMaterial = [];
  state.openingHandHand = [];
  state.openingHandDealToken += 1;
  state.openingHandDealComplete = true;
  closeMaterialDialog();
  hideOpeningHandCardPreview();
  if (IS_TRYIT_PAGE) {
    window.location.assign(BUILDER_PAGE_URL);
    return;
  }
  renderDeck();
}

function renderTryItPage() {
  const root = document.querySelector("#tryit-root");
  if (!root) {
    return;
  }

  const nameEl = document.querySelector(".tryit-deck-name");
  if (nameEl) {
    nameEl.innerHTML = `Deck: <strong>${escapeHtml(state.deckName || "Untitled Deck")}</strong>`;
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
  const endTurnButton = event.target.closest("[data-end-turn]");
  if (endTurnButton) {
    endTryItTurn();
    return;
  }

  const menuToggle = event.target.closest("[data-tryit-menu-toggle]");
  if (menuToggle) {
    event.stopPropagation();
    setTryItMenuOpen(!state.tryitMenuOpen);
    return;
  }

  const settingsItem = event.target.closest("[data-tryit-menu-settings]");
  if (settingsItem) {
    event.stopPropagation();
    setTryItMenuOpen(false);
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
    startOpeningHandSession();
    return;
  }

  const organizeButton = event.target.closest("[data-organize-opening-hand]");
  if (organizeButton) {
    organizeOpeningHandCards(getActiveOpeningHandBoard());
    return;
  }

  const recollectButton = event.target.closest("[data-recollect-opening-hand]");
  if (recollectButton) {
    recollectOpeningHandMemory(getActiveOpeningHandBoard());
    return;
  }

  const banishButton = event.target.closest("[data-banish-opening-hand]");
  if (banishButton) {
    banishRandomMemoryCard(getActiveOpeningHandBoard());
  }
}

function updateTryItTurnLabel() {
  const label = document.querySelector("#tryit-turn-label");
  if (!label) {
    return;
  }
  const turn = Math.max(1, Number(state.openingHandTurn) || 1);
  state.openingHandTurn = turn;
  label.textContent = `Turn ${turn}`;
}

function endTryItTurn() {
  state.openingHandTurn = Math.max(1, Number(state.openingHandTurn) || 1) + 1;
  updateTryItTurnLabel();
  setTryItMenuOpen(false);
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

function createOpeningHandBoard(sectionCards) {
  if (state.openingHandLibrary.length === 0 && state.openingHandHand.length === 0) {
    const copies = shuffleArray(expandMainDeckCopies(sectionCards));
    state.openingHandLibrary = copies;
    state.openingHandHand = [];
  }

  const board = document.createElement("div");
  board.className = "opening-hand-board";
  board.dataset.openingHandBoard = "true";

  const field = document.createElement("div");
  field.className = "opening-hand-field";
  field.dataset.ohField = "true";

  const zonesWrap = document.createElement("div");
  zonesWrap.className = "opening-hand-zones";
  zonesWrap.setAttribute("aria-hidden", "true");

  const zoneSpecs = [
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
  board.append(field);
  layoutOpeningHandZones(field);
  renderOpeningHandContents(board);

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

function readOpeningHandZoneBox(field, key) {
  const zone = field.querySelector(`[data-oh-zone="${key}"]`);
  if (!zone || zone.offsetHeight <= 0) {
    return null;
  }
  const fieldRect = field.getBoundingClientRect();
  const rect = zone.getBoundingClientRect();
  const top = rect.top - fieldRect.top;
  const left = rect.left - fieldRect.left;
  return {
    top,
    left,
    bottom: top + rect.height,
    right: left + rect.width,
    width: rect.width,
    height: rect.height,
    contentTop: top + OPENING_HAND_ROW_PAD,
  };
}

function getOpeningHandZones(field) {
  const fallback = getOpeningHandFallbackZones(field);
  if (!field) {
    return fallback;
  }

  const fieldBox = readOpeningHandZoneBox(field, "field");
  const materialBox = readOpeningHandZoneBox(field, "material");
  const memoryBox = readOpeningHandZoneBox(field, "memory");
  const handBox = readOpeningHandZoneBox(field, "hand");
  const banishmentBox = readOpeningHandZoneBox(field, "banishment");
  const deckBox = readOpeningHandZoneBox(field, "deck");
  const graveyardBox = readOpeningHandZoneBox(field, "graveyard");
  if (
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
  return {
    x: clientX - rect.left - FREEHAND_CARD_WIDTH / 2,
    y: clientY - rect.top - FREEHAND_CARD_HEIGHT / 2,
  };
}

function clampOpeningHandFieldPosition(field, x, y, z = 1) {
  const maxX = Math.max(0, field.clientWidth - FREEHAND_CARD_WIDTH);
  const maxY = Math.max(0, OPENING_HAND_BOARD_HEIGHT - FREEHAND_CARD_HEIGHT);
  const snapped = snapFreehandPosition({ x, y, z });
  return {
    x: Math.min(maxX, Math.max(0, snapped.x)),
    y: Math.min(maxY, Math.max(0, snapped.y)),
    z,
  };
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
      "[data-oh-card], [data-oh-deck-pile], [data-oh-material-pile], [data-oh-hand-count]",
    )
    .forEach((node) => node.remove());

  dedupeOpeningHandEntries();
  state.openingHandHand.forEach((entry, index) => {
    field.append(createOpeningHandCard(entry, index, field));
  });

  const pile = createOpeningHandPileButton({
    count: state.openingHandLibrary.length,
    datasetKey: "ohDeckPile",
    className: "opening-hand-deck-pile",
    ariaLabel: `Draw from deck (${state.openingHandLibrary.length} left). Tap or drag to Hand; drag to Memory face-down.`,
    emptyLabel: "Deck is empty",
  });

  const materialPile = createOpeningHandPileButton({
    count: state.openingHandMaterial.length,
    datasetKey: "ohMaterialPile",
    className: "opening-hand-deck-pile opening-hand-material-pile",
    ariaLabel: `Open Material Deck (${state.openingHandMaterial.length} left)`,
    emptyLabel: "Material Deck is empty",
  });
  materialPile.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openMaterialDialog(board);
  });

  const handCount = document.createElement("span");
  handCount.className = "opening-hand-hand-count";
  handCount.dataset.ohHandCount = "true";
  handCount.setAttribute("aria-label", "Cards in hand");

  field.append(pile, materialPile, handCount);
  positionOpeningHandDeckPile(board);
  positionOpeningHandMaterialPile(board);
  positionOpeningHandHandCount(board);
  updateOpeningHandCounts(board);
  enableOpeningHandDeckDrag(pile, board);
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

function createOpeningHandCard(entry, index, field = null) {
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
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = entry.card.name;
    image.onerror = () => {
      image.remove();
      imageWrap.textContent = entry.card.name.slice(0, 2).toUpperCase();
    };
    imageWrap.append(image);
  } else {
    imageWrap.textContent = entry.card.name.slice(0, 2).toUpperCase();
  }

  item.append(imageWrap);
  applyOpeningHandCardFace(item, entry);
  applyOpeningHandCardRotation(item, entry);
  enableOpeningHandCardDrag(item, entry);
  return item;
}

function applyOpeningHandCardFace(cardEl, entry) {
  const facedown = Boolean(entry.facedown);
  cardEl.classList.toggle("is-facedown", facedown);
  cardEl.dataset.ohFacedown = facedown ? "true" : "false";
  const image = cardEl.querySelector("img");
  if (image) {
    image.alt = facedown ? "Face-down card" : entry.card.name;
  }
  const zone = entry.zone || "hand";
  if (zone === "field" || zone === "memory") {
    const zoneLabel = zone === "field" ? "Field" : "Memory";
    cardEl.title = facedown
      ? `Face-down (${zoneLabel}) — triple-click to flip up`
      : `${entry.card.name} — triple-click to flip down${zone === "field" ? "; double-click to rotate" : ""}`;
  } else {
    cardEl.title = facedown ? "Face-down card" : entry.card.name;
  }
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
  if (zone !== "field" && zone !== "memory") {
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
  const onField = (entry.zone || "hand") === "field";
  const rotated = Boolean(entry.rotated) && onField;
  entry.rotated = rotated;
  cardEl.classList.toggle("is-rotated", rotated);
  cardEl.dataset.ohRotated = rotated ? "true" : "false";
  if (!cardEl.classList.contains("opening-hand-card-dealing") && !cardEl.classList.contains("dragging")) {
    cardEl.style.transform = rotated ? "rotate(90deg)" : "";
  }
}

function toggleOpeningHandCardRotation(cardEl, entry) {
  if (!cardEl || !entry || (entry.zone || "hand") !== "field") {
    return;
  }
  entry.rotated = !entry.rotated;
  applyOpeningHandCardRotation(cardEl, entry);
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
  const innerLeft = zones.mainLeft + pad;
  const usable = Math.max(FREEHAND_CARD_WIDTH, zones.mainRight - pad - innerLeft);
  // Material plays spawn in the middle of Field.
  const centerX = innerLeft + Math.max(0, (usable - FREEHAND_CARD_WIDTH) / 2);
  // Small fan so later Field cards don't fully cover earlier ones.
  const offset = index * 18;
  return {
    x: centerX + offset,
    y: getOpeningHandRowCardTop(zones.fieldTop, zones.fieldBottom),
    z: 20 + index,
  };
}

function closeMaterialDialog() {
  if (!materialDialog?.open) {
    return;
  }
  materialDialog.close();
}

function openMaterialDialog(board = null) {
  if (!materialDialog || !materialDialogGrid) {
    return;
  }
  const playBoard = board || getActiveOpeningHandBoard();
  materialDialog.dataset.ohBoardBound = playBoard ? "true" : "false";
  renderMaterialDialogGrid(playBoard);
  if (!materialDialog.open) {
    materialDialog.showModal();
  }
}

function renderMaterialDialogGrid(board = null) {
  if (!materialDialogGrid || !materialDialogEmpty) {
    return;
  }
  materialDialogGrid.replaceChildren();
  const entries = state.openingHandMaterial;
  materialDialogEmpty.hidden = entries.length > 0;
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
    playButton.textContent = "Play";

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

  const [source] = state.openingHandMaterial.splice(index, 1);
  const fieldIndex = countOpeningHandZoneCards("field");
  const position = getOpeningHandFieldSlot(field, fieldIndex);
  const entry = {
    ...source,
    position,
    facedown: false,
    rotated: false,
    zone: "field",
  };
  state.openingHandHand.push(entry);

  closeMaterialDialog();

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
  resizeOpeningHandField(playBoard);
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
  updateOpeningHandCounts(board);
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
  if (targetZone !== "hand" && targetZone !== "memory" && targetZone !== "field") {
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
        ? `Draw from deck (${state.openingHandLibrary.length} left). Drag or tap to draw.`
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

function showOpeningHandCardPreview(entry) {
  hideOpeningHandCardPreview();
  if (!entry?.card || entry.facedown) {
    return;
  }
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

  const image = document.createElement("img");
  image.className = "opening-hand-card-preview-image";
  image.src = imageUrl;
  image.alt = entry.card.name || "Card";
  image.draggable = false;

  const caption = document.createElement("p");
  caption.className = "opening-hand-card-preview-caption";
  caption.textContent = entry.card.name || "Card";

  frame.append(image, caption);
  overlay.append(closeButton, frame);
  document.body.append(overlay);
  // Force paint so the enter transition runs.
  void overlay.offsetWidth;
  overlay.classList.add("is-visible");
  document.addEventListener("keydown", onOpeningHandCardPreviewKeydown);
  state.openingHandPreviewEscBound = true;
  closeButton.focus();
}

function enableOpeningHandCardDrag(cardEl, entry) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let originPointerX = 0;
  let originPointerY = 0;
  let dragMoved = false;
  let lastTapAt = 0;
  let tapCount = 0;
  let tapActionTimer = null;
  let holdPreviewTimer = null;
  const originZone = () => entry.zone || "hand";

  const clearHoldPreviewTimer = () => {
    if (holdPreviewTimer != null) {
      window.clearTimeout(holdPreviewTimer);
      holdPreviewTimer = null;
    }
  };

  const clearTapActionTimer = () => {
    if (tapActionTimer != null) {
      window.clearTimeout(tapActionTimer);
      tapActionTimer = null;
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

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    const field = cardEl.closest("[data-oh-field]");
    if (!field) {
      return;
    }
    let nextX = startX + (event.clientX - originPointerX);
    let nextY = startY + (event.clientY - originPointerY);
    if (Math.hypot(event.clientX - originPointerX, event.clientY - originPointerY) > 8) {
      dragMoved = true;
    }
    const maxX = Math.max(0, field.clientWidth - FREEHAND_CARD_WIDTH);
    const maxY = Math.max(0, OPENING_HAND_BOARD_HEIGHT - FREEHAND_CARD_HEIGHT);
    const snapped = snapFreehandPosition({ x: nextX, y: nextY, z: 0 });
    nextX = Math.min(maxX, Math.max(0, snapped.x));
    nextY = Math.min(maxY, Math.max(0, snapped.y));
    cardEl.style.left = `${nextX}px`;
    cardEl.style.top = `${nextY}px`;
    syncFaceForPosition(field, nextX, nextY);
  };

  const onPointerUp = async (event) => {
    if (pointerId !== event.pointerId) {
      return;
    }
    pointerId = null;
    clearHoldPreviewTimer();
    // Keep the hold-to-peek lightbox open until the user hits × / Escape.
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
    } else if (zone !== "memory" && zone !== "field") {
      entry.facedown = false;
    } else if (zone === "field" && previousZone !== "field" && previousZone !== "memory") {
      entry.facedown = false;
    }
    // Staying in Field/Memory (or moving between them) keeps the current face.
    if (zone !== "field") {
      entry.rotated = false;
    }
    applyOpeningHandCardFace(cardEl, entry);
    applyOpeningHandCardRotation(cardEl, entry);
    delete field.dataset.activeZone;

    // Tap gestures (no drag):
    // - Field double-tap → rotate 90°
    // - Field/Memory triple-tap → toggle face down / face up
    if (!dragMoved && (zone === "field" || zone === "memory")) {
      const now = Date.now();
      if (now - lastTapAt > OPENING_HAND_TAP_WINDOW_MS) {
        tapCount = 0;
      }
      tapCount += 1;
      lastTapAt = now;
      clearTapActionTimer();

      if (tapCount >= 3) {
        toggleOpeningHandCardFace(cardEl, entry);
        tapCount = 0;
      } else if (tapCount === 2 && zone === "field") {
        tapActionTimer = window.setTimeout(() => {
          tapActionTimer = null;
          if (tapCount === 2 && (entry.zone || "hand") === "field") {
            toggleOpeningHandCardRotation(cardEl, entry);
          }
          tapCount = 0;
        }, OPENING_HAND_TAP_WINDOW_MS);
      }
    } else {
      clearTapActionTimer();
      tapCount = 0;
      lastTapAt = 0;
    }

    updateOpeningHandCounts(board);
    resizeOpeningHandField(board);
  };

  cardEl.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    pointerId = event.pointerId;
    dragMoved = false;
    clearHoldPreviewTimer();
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

    // Hold/drag a Hand card for 2s to peek a full-size copy.
    const startedInHand = (entry.zone || "hand") === "hand" && !entry.facedown;
    if (startedInHand) {
      const holdPointerId = event.pointerId;
      holdPreviewTimer = window.setTimeout(() => {
        holdPreviewTimer = null;
        if (pointerId !== holdPointerId) {
          return;
        }
        showOpeningHandCardPreview(entry);
      }, OPENING_HAND_HOLD_PREVIEW_MS);
    }
  });
}

function enableOpeningHandDeckDrag(pileEl, board) {
  let pointerId = null;
  let ghost = null;
  let originX = 0;
  let originY = 0;
  let moved = false;

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

  const onPointerMove = (event) => {
    if (pointerId !== event.pointerId || !ghost) {
      return;
    }
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    if (Math.hypot(dx, dy) > 6) {
      moved = true;
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
    window.removeEventListener("pointercancel", onPointerUp);

    const preview = syncDropZonePreview(event.clientX, event.clientY);
    const overField = Boolean(preview);
    const shouldDraw =
      state.openingHandLibrary.length > 0 && (overField || !moved);
    const dropZone = moved && preview?.zone === "memory" ? "memory" : "hand";
    const dropPosition = dropZone === "memory" ? preview.point : null;
    cleanup();
    try {
      pileEl.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    if (shouldDraw) {
      await drawOpeningHandCard(board, {
        animate: true,
        organize: dropZone === "hand",
        zone: dropZone,
        facedown: dropZone === "memory",
        position: dropPosition,
      });
    }
  };

  pileEl.addEventListener("pointerdown", (event) => {
    if (pileEl.disabled || state.openingHandLibrary.length === 0) {
      return;
    }
    if (event.button != null && event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
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
    window.addEventListener("pointercancel", onPointerUp);
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
  const thumbnail = document.createElement("span");
  thumbnail.className = "deck-card-thumbnail";
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

async function importDeckFromText(rawText) {
  const parsed = parseDeckImport(rawText);
  if (parsed.entries.length === 0) {
    importStatusEl.textContent = "No card lines found. Use formats like “4 Backstep” under a section heading.";
    return;
  }

  confirmImportButton.disabled = true;
  importStatusEl.textContent = `Looking up ${parsed.entries.length} card line${parsed.entries.length === 1 ? "" : "s"}...`;

  const nextDeck = [];
  const missing = [];

  for (const entry of parsed.entries) {
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

  state.deck = nextDeck;
  if (parsed.deckName) {
    state.deckName = parsed.deckName;
    deckNameInput.value = state.deckName;
    saveStoredJson(DECK_NAME_STORAGE_KEY, state.deckName);
  }
  saveDeck();
  renderDeck();
  renderCards();

  if (missing.length) {
    importStatusEl.textContent = `Imported ${nextDeck.length} unique card${nextDeck.length === 1 ? "" : "s"}. Missing: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}`;
    confirmImportButton.disabled = false;
    return;
  }

  importStatusEl.textContent = `Imported ${nextDeck.length} unique card${nextDeck.length === 1 ? "" : "s"}.`;
  window.setTimeout(() => importDialog.close(), 700);
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
  const cards = await searchCardsByName(name, 8);
  const exact = cards.find((card) => card.name.toLowerCase() === name.toLowerCase());
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
  statusEl.textContent = state.status;
  explanationEl.textContent = buildExplanation(state.parsed);
  renderChips();
  renderCards();
  renderDeck();
  loadMoreButton.classList.toggle("hidden", !state.parsed || state.reachedEnd);
  loadMoreButton.disabled = state.loading;
  loadMoreButton.textContent = state.loading ? "Loading..." : "Load more";
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

function createCardButton(card) {
  const edition = getPrimaryEdition(card);
  const imageUrl = getImageUrl(edition?.image);
  const cardKey = getCardKey(card);
  const deckEntry = state.deck.find((item) => item.key === cardKey);
  const maxQuantity = getMaxQuantityForSection("main", card);

  const item = document.createElement("article");
  item.className = "card-tile result-grid-card";
  item.title = card.name;
  item.classList.toggle("in-deck", Boolean(deckEntry));

  const imageButton = document.createElement("button");
  imageButton.className = "result-grid-card-image";
  imageButton.type = "button";
  imageButton.setAttribute("aria-label", `Open details for ${card.name}`);
  imageButton.addEventListener("click", () => openLightbox(card));

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

  const quantitySelect = document.createElement("select");
  quantitySelect.className = "deck-grid-qty result-grid-qty";
  quantitySelect.setAttribute("aria-label", `Add ${card.name} to Main Deck`);
  quantitySelect.dataset.addCardQuantity = cardKey;
  quantitySelect.append(createOption("", "+"));
  for (let quantity = 1; quantity <= maxQuantity; quantity += 1) {
    quantitySelect.append(createOption(String(quantity), String(quantity)));
  }
  quantitySelect.value = state.resultSelectedQuantities[cardKey] || "";

  const addedMessage = document.createElement("span");
  addedMessage.className = "result-added-message";
  addedMessage.setAttribute("aria-live", "polite");
  if (state.resultAddedMessages[cardKey]) {
    addedMessage.textContent = state.resultAddedMessages[cardKey];
    addedMessage.classList.add("show");
  }

  quantitySelect.addEventListener("click", (event) => event.stopPropagation());
  quantitySelect.addEventListener("change", (event) => {
    event.stopPropagation();
    const amount = Number(quantitySelect.value);
    if (!amount) {
      return;
    }

    state.resultSelectedQuantities[cardKey] = String(amount);
    state.resultAddedMessages[cardKey] = `${amount} Added`;
    window.clearTimeout(state.resultFeedbackTimers[cardKey]);
    addCardToDeck(card, amount, "main");
    state.resultFeedbackTimers[cardKey] = window.setTimeout(() => {
      delete state.resultAddedMessages[cardKey];
      delete state.resultSelectedQuantities[cardKey];
      renderCards();
    }, 1300);
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

function showLightboxAddedMessage(message) {
  lightboxAddedMessage.textContent = message;
  lightboxAddedMessage.classList.add("show");
  window.setTimeout(() => {
    lightboxAddedMessage.classList.remove("show");
  }, 1300);
}

function openLightbox(card) {
  state.activeLightboxCard = card;
  const edition = getPrimaryEdition(card);
  const imageUrl = getImageUrl(edition?.image);
  const image = document.querySelector("#lightbox-image");
  const set = document.querySelector("#lightbox-set");
  const title = document.querySelector("#lightbox-title");
  const tags = document.querySelector("#lightbox-tags");
  const stats = document.querySelector("#lightbox-stats");
  const effect = document.querySelector("#lightbox-effect");

  image.src = imageUrl || "";
  image.alt = imageUrl ? card.name : "";
  image.classList.toggle("hidden", !imageUrl);
  set.textContent = edition?.set
    ? `${edition.set.name} (${edition.set.prefix}) #${edition.collector_number}`
    : "Card details";
  title.textContent = card.name;

  tags.replaceChildren();
  [
    ...(card.elements || []),
    ...(card.types || []),
    ...(card.subtypes || []),
    ...(card.classes || []),
  ].forEach((value) => tags.append(createChip(titleCase(value))));

  stats.replaceChildren();
  addStat(stats, "Cost", formatCost(card.cost));
  addStat(stats, "Level", statValue(card.level));
  addStat(stats, "Power", statValue(card.power));
  addStat(stats, "Life", statValue(card.life));
  addStat(stats, "Speed", statValue(card.speed));

  effect.textContent =
    edition?.effect_raw || card.effect_raw || "No effect text available for this print.";

  const cardKey = getCardKey(card);
  lightboxQuantitySelect.value = state.resultSelectedQuantities[cardKey] || "";
  lightboxAddedMessage.textContent = state.resultAddedMessages[cardKey] || "";
  lightboxAddedMessage.classList.toggle("show", Boolean(state.resultAddedMessages[cardKey]));

  lightbox.showModal();
}

function closeLightbox() {
  lightbox.close();
}

function addStat(list, label, value) {
  if (!value) {
    return;
  }

  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  list.append(term, description);
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
