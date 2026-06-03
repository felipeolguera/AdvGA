const API_BASE = "https://api.gatcg.com";
const PAGE_SIZE = 50;
const EXAMPLE_QUERY = "fire spells that target units";
const DECK_STORAGE_KEY = "advga.deck";
const RECENT_SEARCHES_KEY = "advga.recentSearches";
const MAX_RECENT_SEARCHES = 8;

const DECK_SECTIONS = [
  { key: "material", title: "Material Deck" },
  { key: "main", title: "Main Deck" },
  { key: "sideboard", title: "Sideboard" },
];

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
  deck: loadStoredJson(DECK_STORAGE_KEY, []),
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
  status: "Loading Grand Archive card terms...",
};

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero" aria-labelledby="app-title">
      <div>
        <p class="eyebrow">Grand Archive TCG</p>
        <h1 id="app-title">Grand Archive Advanced Book by RPGgamerPH</h1>
        <p class="hero-copy">
          Search by plain English, refine with filters, save cards to a list, and share exact searches.
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

      <article class="panel deck-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Deck Builder</p>
            <h2>Deck Builder <span id="deck-count">0</span></h2>
          </div>
          <div class="button-pair">
            <button class="secondary compact" type="button" id="open-deck-fullscreen">Fullscreen</button>
            <button class="secondary compact" type="button" id="export-deck">Copy export</button>
            <button class="ghost compact" type="button" id="clear-deck">Clear</button>
          </div>
        </div>
        <div class="deck-list" id="deck-list"></div>
      </article>
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

    <footer class="app-version" aria-label="App version">v0.16</footer>
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
          <p class="hint">Edit quantities and sections with larger mobile-friendly controls.</p>
        </div>
        <button class="icon-button deck-close" id="close-deck-fullscreen" aria-label="Close fullscreen deck builder">×</button>
      </header>
      <div class="deck-fullscreen-actions">
        <button class="secondary compact" type="button" id="export-deck-fullscreen">Copy export</button>
        <button class="ghost compact" type="button" id="clear-deck-fullscreen">Clear</button>
      </div>
      <div class="deck-list deck-list-fullscreen" id="deck-list-fullscreen"></div>
    </div>
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
const exportDeckButton = document.querySelector("#export-deck");
const exportDeckFullscreenButton = document.querySelector("#export-deck-fullscreen");
const clearDeckButton = document.querySelector("#clear-deck");
const clearDeckFullscreenButton = document.querySelector("#clear-deck-fullscreen");
const openDeckFullscreenButton = document.querySelector("#open-deck-fullscreen");
const closeDeckFullscreenButton = document.querySelector("#close-deck-fullscreen");
const deckFullscreen = document.querySelector("#deck-fullscreen");
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
clearDeckButton.addEventListener("click", clearDeck);
clearDeckFullscreenButton.addEventListener("click", clearDeck);
openDeckFullscreenButton.addEventListener("click", () => {
  renderDeck();
  deckFullscreen.showModal();
});
closeDeckFullscreenButton.addEventListener("click", () => deckFullscreen.close());
deckFullscreen.addEventListener("click", (event) => {
  if (event.target === deckFullscreen) {
    deckFullscreen.close();
  }
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
  deckCountEl.textContent = String(state.deck.reduce((total, card) => total + normalizeQuantity(card.quantity), 0));
  renderDeckInto(deckListEl, { fullscreen: false });
  renderDeckInto(deckListFullscreenEl, { fullscreen: true });
}

function renderDeckInto(container, { fullscreen }) {
  container.replaceChildren();
  if (state.deck.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Add cards from results or the lightbox, set quantities, choose a deck section, then copy the export.";
    container.append(empty);
    return;
  }

  if (fullscreen) {
    DECK_SECTIONS.forEach((section) => {
      const sectionCards = state.deck.filter((card) => normalizeDeckSection(card.section) === section.key);
      const group = document.createElement("section");
      group.className = "deck-section-group";

      const heading = document.createElement("h3");
      heading.textContent = `${section.title} (${sectionCards.reduce((total, card) => total + normalizeQuantity(card.quantity), 0)})`;
      group.append(heading);

      if (sectionCards.length === 0) {
        const empty = document.createElement("p");
        empty.className = "hint";
        empty.textContent = "No cards in this section yet.";
        group.append(empty);
      } else {
        sectionCards.forEach((card) => group.append(createDeckRow(card, { fullscreen: true })));
      }
      container.append(group);
    });
    return;
  }

  state.deck.forEach((card) => container.append(createDeckRow(card, { fullscreen: false })));
}

function createDeckRow(card, { fullscreen }) {
  const row = document.createElement("div");
  row.className = fullscreen ? "deck-row deck-row-fullscreen" : "deck-row";

  const name = document.createElement("span");
  name.className = "deck-card-name";
  name.textContent = card.name;

  if (fullscreen) {
    row.append(createDeckThumbnail(card));
  }

  const quantityLabel = document.createElement("label");
  quantityLabel.className = "deck-field deck-quantity-field";
  quantityLabel.textContent = "Qty";
  const quantity = document.createElement("select");
  quantity.dataset.deckQuantity = card.key;
  [1, 2, 3, 4].forEach((amount) => {
    quantity.append(createOption(String(amount), String(amount)));
  });
  quantity.value = String(Math.min(4, normalizeQuantity(card.quantity)));
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
  const imageUrl = getImageUrl(card.image);
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

function addCardToDeck(card, quantityToAdd = 1) {
  const key = getCardKey(card);
  const amount = normalizeQuantity(quantityToAdd);
  const existing = state.deck.find((item) => item.key === key);
  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity) + amount;
  } else {
    state.deck.push({
      key,
      name: card.name,
      image: getPrimaryEdition(card)?.image || "",
      line: formatCardLine(card),
      quantity: amount,
      section: defaultDeckSection(card),
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
  card.quantity = normalizeQuantity(card.quantity);
  card.section = normalizeDeckSection(card.section);
  saveDeck();
}

function saveDeck() {
  saveStoredJson(
    DECK_STORAGE_KEY,
    state.deck.map((card) => ({
      ...card,
      quantity: normalizeQuantity(card.quantity),
      section: normalizeDeckSection(card.section),
    })),
  );
}

async function exportDeck(button = exportDeckButton) {
  const text = formatDeckExport();
  if (!text.trim()) {
    window.alert("Add cards to your deck before exporting.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Coppied. Ready to paste.";
  } catch {
    window.prompt("Copy this decklist", text);
    button.textContent = "Coppied. Ready to paste.";
  } finally {
    window.setTimeout(() => {
      button.textContent = "Copy export";
    }, 1800);
  }
}

function formatDeckExport() {
  return DECK_SECTIONS.map((section) => {
    const cards = state.deck.filter((card) => normalizeDeckSection(card.section) === section.key);
    const lines = cards.map((card) => `${normalizeQuantity(card.quantity)} ${card.name}`);
    return [`# ${section.title}`, "", ...lines].join("\n").trimEnd();
  }).join("\n\n");
}

function normalizeQuantity(value) {
  return Math.max(1, Number.parseInt(value, 10) || 1);
}

function normalizeDeckSection(section) {
  return DECK_SECTIONS.some((item) => item.key === section) ? section : "main";
}

function defaultDeckSection(card) {
  const types = new Set((card.types || []).map((type) => String(type).toUpperCase()));
  return types.has("CHAMPION") || types.has("REGALIA") || types.has("WEAPON") ? "material" : "main";
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
