const API_BASE = "https://api.gatcg.com";
const PAGE_SIZE = 50;
const EXAMPLE_QUERY = "fire spells that target units";
const DECK_STORAGE_KEY = "advga.deck";
const DECK_NAME_STORAGE_KEY = "advga.deckName";
const RECENT_SEARCHES_KEY = "advga.recentSearches";
const MAX_RECENT_SEARCHES = 8;
const APP_VERSION = "0.28";

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
  status: "Loading Grand Archive card terms...",
};

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero" id="card-search" aria-labelledby="app-title">
      <div>
        <p class="eyebrow">Grand Archive TCG Deck Builder</p>
        <h1 id="app-title">Grand Archive Advanced Book by RPGgamerPH</h1>
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
          <button type="submit">Search</button>
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
    </section>

    <section class="control-grid">
      <article class="panel explanation-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Parsed search</p>
            <h2>What the app searched</h2>
          </div>
          <button class="secondary compact" type="button" id="copy-share">Copy link</button>
        </div>
        <p class="status" id="status"></p>
        <div class="chips" id="chips"></div>
        <p class="hint" id="search-explanation"></p>
      </article>
    </section>

    <section class="panel deck-panel deck-panel-home" id="deck-builder" aria-labelledby="deck-builder-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Deck Builder</p>
          <h2 id="deck-builder-title">Deck Builder <span id="deck-count">0</span></h2>
        </div>
        <div class="button-pair">
          <button class="secondary compact" type="button" id="export-deck">Copy export</button>
          <button class="secondary compact" type="button" id="import-deck">Import list</button>
          <button class="secondary compact" type="button" id="download-deck">Download .txt</button>
          <button class="ghost compact" type="button" id="clear-deck">Clear</button>
        </div>
      </div>
      <label class="deck-name-field" for="deck-name">
        Deck name
        <input id="deck-name" name="deckName" maxlength="80" autocomplete="off" value="${escapeHtml(state.deckName)}" />
      </label>
      <div class="deck-stats" id="deck-stats" aria-live="polite"></div>
      <details class="deck-validation-details deck-validation-home">
        <summary id="deck-validation-summary-home">Deck legality</summary>
        <div class="deck-validation" id="deck-validation" aria-live="polite"></div>
      </details>
      <div class="deck-list deck-list-home" id="deck-list"></div>
      <div class="deck-toast deck-toast-home" id="deck-toast-home" role="status" aria-live="polite" hidden>Added</div>
    </section>

    <details class="panel advanced-panel" id="advanced-panel">
      <summary>Advanced filters and sorting</summary>
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
    </details>

    <section class="recent-panel panel">
      <div class="panel-heading compact-heading">
        <p class="eyebrow">Recent searches</p>
        <button class="ghost compact" type="button" id="clear-recents">Clear recents</button>
      </div>
      <div class="quick-searches" id="recent-searches"></div>
    </section>

    <section class="results-grid" id="results" aria-label="Search results"></section>

    <div class="actions">
      <button class="secondary hidden" type="button" id="load-more">Load more</button>
    </div>

    <footer class="app-version" aria-label="App version">v${APP_VERSION}</footer>
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

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const clearSearchButton = document.querySelector("#clear-search");
const statusEl = document.querySelector("#status");
const chipsEl = document.querySelector("#chips");
const explanationEl = document.querySelector("#search-explanation");
const resultsEl = document.querySelector("#results");
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
const openDeckFullscreenButton = document.querySelector("#open-deck-fullscreen");
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
const clearFiltersButton = document.querySelector("#clear-filters");
const scrollTopButton = document.querySelector("#scroll-top");
const lightboxQuantitySelect = document.querySelector("#lightbox-quantity-select");
const lightboxAddedMessage = document.querySelector("#lightbox-added-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(input.value.trim(), { reset: true, remember: true });
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
    runSearch(input.value, { reset: true, remember: true });
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
deckNameInput.addEventListener("input", () => {
  state.deckName = deckNameInput.value.trim() || "Untitled Deck";
  saveStoredJson(DECK_NAME_STORAGE_KEY, state.deckName);
});
openDeckFullscreenButton.addEventListener("click", openFullscreenDeckBuilder);
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
  addCardToDeck(state.activeLightboxCard, amount);
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
  runSearch(state.query, { reset: true, remember: false });
});

function openFullscreenDeckBuilder() {
  if (!deckFullscreen.open) {
    deckFullscreen.showModal();
  }
  renderDeck();
}

function goToCardSearch() {
  const focusSearch = () => {
    cardSearchSection?.scrollIntoView({ behavior: "smooth", block: "start" });
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

async function runSearch(query, { reset, remember = false }) {
  if (!query) {
    state.cards = [];
    state.parsed = null;
    state.query = "";
    state.status = "Enter a search such as “fire spells that target units”.";
    state.reachedEnd = true;
    updateShareUrl("");
    render();
    return;
  }

  if (remember) {
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
  state.parsed = parseNaturalQuery(query, state.options);
  state.status = reset ? "Searching cards..." : "Loading more cards...";
  render();

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
    params.set("effect", parsed.effectQuery);
  } else if (parsed.nameQuery) {
    params.set("name", parsed.nameQuery);
  }

  return params;
}

function parseNaturalQuery(query, options) {
  const normalized = normalizeText(query);
  const parsed = {
    effectQuery: "",
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
    effectMatches(card, parsed.effectQuery)
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

function effectMatches(card, effectQuery) {
  if (!effectQuery) {
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

  return effectText.includes(effectQuery);
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
  renderDeckStats(deckStatsEl);
  renderDeckStats(deckStatsFullscreenEl);
  renderDeckValidation(deckValidationEl);
  renderDeckValidation(deckValidationFullscreenEl);
  renderDeckValidationSummary();
  renderDeckInto(deckListEl, { grid: true, showSearch: !deckFullscreen.open });
  renderDeckInto(deckListFullscreenEl, { grid: true, showSearch: deckFullscreen.open });
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
      } else {
        const gridEl = document.createElement("div");
        gridEl.className = "deck-card-grid";
        sectionCards.forEach((card) => gridEl.append(createDeckGridCard(card)));
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

  const addButton = document.createElement("button");
  addButton.className = "secondary compact";
  addButton.type = "button";
  addButton.dataset.openSectionSearch = section.key;
  addButton.textContent = state.deckAutocomplete.section === section.key ? "Close search" : "Add card";

  header.append(heading, addButton);
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

function createDeckGridCard(card) {
  const item = document.createElement("article");
  item.className = "deck-grid-card";
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

  const maxQuantity = getMaxQuantityForCard(card);
  const quantity = document.createElement("select");
  quantity.className = "deck-grid-qty";
  quantity.dataset.deckQuantity = card.key;
  quantity.setAttribute("aria-label", `Quantity for ${card.name}`);
  for (let amount = 1; amount <= maxQuantity; amount += 1) {
    quantity.append(createOption(String(amount), String(amount)));
  }
  quantity.value = String(Math.min(maxQuantity, normalizeQuantity(card.quantity)));

  const remove = document.createElement("button");
  remove.className = "deck-grid-remove";
  remove.type = "button";
  remove.dataset.removeDeck = card.key;
  remove.setAttribute("aria-label", `Remove ${card.name}`);
  remove.textContent = "×";

  item.append(imageWrap, quantity, remove);
  return item;
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
  return new URLSearchParams(window.location.search).get("q") || EXAMPLE_QUERY;
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
  if (parsed.effectQuery) parts.push(`Effect contains: ${parsed.effectQuery}`);
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
    chipsEl.append(createChip(`Effect: ${state.parsed.effectQuery}`, [state.parsed.effectQuery]));
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
  for (const card of state.cards) {
    fragment.append(createCardButton(card));
  }
  resultsEl.append(fragment);
}

function createCardButton(card) {
  const edition = getPrimaryEdition(card);
  const imageUrl = getImageUrl(edition?.image);
  const button = document.createElement("button");
  button.className = "card-tile";
  button.type = "button";
  button.addEventListener("click", () => openLightbox(card));

  const imageWrap = document.createElement("span");
  imageWrap.className = "card-image-wrap";

  if (imageUrl) {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.src = imageUrl;
    image.alt = card.name;
    image.onerror = () => {
      image.remove();
      imageWrap.append(createPlaceholder(card.name));
    };
    imageWrap.append(image);
  } else {
    imageWrap.append(createPlaceholder(card.name));
  }

  const meta = document.createElement("span");
  meta.className = "card-meta";

  const name = document.createElement("strong");
  name.textContent = card.name;

  const line = document.createElement("span");
  line.textContent = formatCardLine(card);

  const cardKey = getCardKey(card);
  const deckEntry = state.deck.find((item) => item.key === cardKey);
  button.classList.toggle("in-deck", Boolean(deckEntry));

  const quantityControl = document.createElement("label");
  quantityControl.className = "result-quantity-control";
  quantityControl.textContent = "Add qty";

  const quantitySelect = document.createElement("select");
  quantitySelect.setAttribute("aria-label", `Add quantity for ${card.name}`);
  quantitySelect.dataset.addCardQuantity = cardKey;
  quantitySelect.append(createOption("", "Add"));
  [1, 2, 3, 4].forEach((quantity) => {
    quantitySelect.append(createOption(String(quantity), String(quantity)));
  });
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
    addCardToDeck(card, amount);
    state.resultFeedbackTimers[cardKey] = window.setTimeout(() => {
      delete state.resultAddedMessages[cardKey];
      renderCards();
    }, 1300);
  });

  quantityControl.append(quantitySelect, addedMessage);

  const deckIndicator = document.createElement("span");
  deckIndicator.className = "result-deck-indicator";
  deckIndicator.textContent = deckEntry ? `In deck: ${normalizeQuantity(deckEntry.quantity)}` : "Not in deck";

  meta.append(name, line, quantityControl, deckIndicator);
  button.append(imageWrap, meta);
  return button;
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
    criteria.push(`effect "${parsed.effectQuery}"`);
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
