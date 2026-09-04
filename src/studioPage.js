const STUDIO_STORAGE_KEY = "advga.studio";
const STUDIO_MIN_QTY = 1;
const STUDIO_MAX_QTY = 4;
const STUDIO_TOAST_MS = 2400;
const STUDIO_ADDED_MS = 2200;
const STUDIO_CARD_WIDTH = 108;
const STUDIO_CARD_HEIGHT = 151;
const STUDIO_GAP_X = 16;
const STUDIO_GAP_Y = 16;
const STUDIO_PADDING = 16;
const STUDIO_ZONE_HEAD = 48;
const STUDIO_ZONE_SPLIT_MIN = 0.22;
const STUDIO_ZONE_SPLIT_MAX = 0.78;
const STUDIO_SNAP = 16;
const STUDIO_LIFT_SCALE = 0.14;
const STUDIO_LIFT_Z = 52;
const STUDIO_LIFT_RISE = 0.02;
const STUDIO_LIFT_DROP = 0.028;
const STUDIO_FRICTION = 0.0042;
const STUDIO_MIN_SPEED = 0.02;
const STUDIO_MAX_TILT = 15;
const STUDIO_RESTITUTION = 0.08;
const STUDIO_QTY_HANG = 8;
const STUDIO_GRAVITY = 0.0045;
const STUDIO_BOUNCE_KEEP = 0;
const STUDIO_SQUASH_SPRING = 0.0007;
const STUDIO_SQUASH_DAMP = 0.028;
const STUDIO_DOUBLE_TAP_MS = 500;
const STUDIO_DOUBLE_TAP_PX = 36;
const STUDIO_TRIPLE_TAP_MS = 650;

function clampStudioQty(value) {
  const quantity = Math.round(Number(value));
  if (!Number.isFinite(quantity) || quantity < STUDIO_MIN_QTY) {
    return STUDIO_MIN_QTY;
  }
  return Math.min(STUDIO_MAX_QTY, quantity);
}

function clampStudioZoneSplit(value) {
  const split = Number(value);
  if (!Number.isFinite(split)) {
    return 0.5;
  }
  return Math.min(STUDIO_ZONE_SPLIT_MAX, Math.max(STUDIO_ZONE_SPLIT_MIN, split));
}

export function getStudioShellHtml({ appVersion, builderUrl }) {
  return `
  <main class="page-shell studio-page">
    <header class="studio-header">
      <div class="studio-header-brand">
        <p class="studio-live"><span class="studio-live-dot" aria-hidden="true"></span>On camera</p>
        <h1>Studio</h1>
        <p class="studio-header-version" aria-label="App version">v${appVersion}</p>
      </div>
      <p class="studio-board-count" id="studio-board-count">0 cards</p>
      <nav class="studio-header-nav">
        <button class="try-it-button compact" type="button" id="studio-try-it">Try it!</button>
        <button class="ghost compact studio-share-button" type="button" id="studio-share">Share</button>
        <button class="ghost compact" type="button" id="studio-copy-decklist">Copy list</button>
        <button class="ghost compact" type="button" id="studio-download-decklist">Download</button>
        <button class="ghost compact" type="button" id="studio-clear-board">Clear</button>
        <a class="ghost compact" href="${builderUrl}">Builder</a>
      </nav>
    </header>

    <div class="studio-stage">
      <aside class="studio-inspector is-empty" id="studio-inspector-panel" aria-label="Spotlight">
        <button
          class="studio-add-card"
          type="button"
          id="studio-open-search"
          aria-label="Add card"
          aria-haspopup="dialog"
          aria-controls="studio-search-dialog"
        >Add Card</button>
        <div class="studio-inspector-body" id="studio-inspector"></div>
      </aside>
      <section class="studio-playground" aria-label="Playground">
        <div class="studio-zones">
          <div class="studio-zone" data-zone="a">
            <div class="studio-zone-label">
              <span class="studio-zone-name">A</span>
              <span class="studio-zone-count" id="studio-zone-a-count" aria-live="polite">0</span>
            </div>
          </div>
          <div class="studio-zone" data-zone="b">
            <div class="studio-zone-label">
              <span class="studio-zone-name">B</span>
              <span class="studio-zone-count" id="studio-zone-b-count" aria-live="polite">0</span>
            </div>
          </div>
        </div>
        <button
          class="studio-zone-splitter"
          type="button"
          id="studio-zone-splitter"
          aria-label="Resize areas A and B"
          aria-orientation="vertical"
        ></button>
        <div class="studio-board" id="studio-board" data-studio-board title="Double-tap empty space to organize cards. Triple-click a card to enlarge."></div>
      </section>
    </div>
  </main>

  <dialog class="lightbox" id="lightbox" aria-label="Card image">
    <button class="icon-button lightbox-close" type="button" id="close-lightbox" aria-label="Close">×</button>
    <button class="lightbox-nav lightbox-nav-prev" type="button" id="lightbox-prev" aria-label="Previous card">‹</button>
    <button class="lightbox-nav lightbox-nav-next" type="button" id="lightbox-next" aria-label="Next card">›</button>
    <figure class="lightbox-card">
      <img id="lightbox-image" alt="" />
    </figure>
  </dialog>

  <dialog class="studio-search-dialog" id="studio-search-dialog" aria-labelledby="studio-search-title">
    <div class="studio-search-dialog-head">
      <div>
        <p class="eyebrow">Grand Archive TCG</p>
        <h2 id="studio-search-title">Card search</h2>
      </div>
      <button class="ghost compact" type="button" id="studio-close-search" aria-label="Close search">Close</button>
    </div>
    <form class="studio-search search-card" id="studio-search-form">
      <label class="studio-search-label" for="studio-search-input">Search cards</label>
      <div class="studio-search-bar">
        <div class="search-row studio-search-row">
          <div class="search-input-wrap">
            <input
              id="studio-search-input"
              name="query"
              autocomplete="off"
              spellcheck="true"
              placeholder="normal ally that cost 2 in PRD"
              aria-autocomplete="list"
              aria-controls="studio-autocomplete-list"
              aria-expanded="false"
            />
          </div>
          <button type="button" class="secondary" id="toggle-search-filters" aria-expanded="false" aria-controls="search-filters">
            Filters
          </button>
          <button type="submit" id="studio-search-submit">Search</button>
        </div>
        <div class="studio-examples quick-searches" aria-label="Example searches">
          <button type="button" data-studio-example="harmony in PRD">harmony in PRD</button>
          <button type="button" data-studio-example="melody in PRD">melody in PRD</button>
          <button type="button" data-studio-example="unique allies in PRD">unique allies</button>
        </div>
      </div>
      <ul
        class="deck-autocomplete-list deck-autocomplete-grid studio-autocomplete-list"
        id="studio-autocomplete-list"
        role="listbox"
        hidden
      ></ul>
      <div class="search-filters" id="search-filters" hidden>
        <div class="search-filters-grid">
          <label class="search-filter-effect">
            Effect
            <input id="quick-filter-effect" name="effect" autocomplete="off" spellcheck="true" placeholder="hand AND memory" />
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
          Same search as the deck builder. Check more than one Set, Element, Type, or Subtype to include any of them.
        </p>
        <div class="search-filter-actions">
          <button type="button" id="apply-search-filters">Apply filters</button>
          <button class="ghost" type="button" id="clear-search-filters">Clear filters</button>
        </div>
      </div>
    </form>
    <p class="hint studio-search-status" id="studio-search-status">Search, then pick 1–4 to add a card to the playground.</p>
    <div class="studio-carousel is-empty" id="studio-carousel">
      <button type="button" class="studio-carousel-nav" id="studio-carousel-prev" aria-label="Previous search results">‹</button>
      <div class="studio-tray" id="studio-tray" tabindex="0" aria-label="Search results"></div>
      <button type="button" class="studio-carousel-nav" id="studio-carousel-next" aria-label="Next search results">›</button>
    </div>
    <div class="studio-carousel-meta">
      <p class="studio-carousel-index" id="studio-carousel-index" hidden></p>
      <button class="ghost compact hidden" type="button" id="studio-load-more">Load more</button>
    </div>
  </dialog>
  <div class="studio-toast" id="studio-toast" role="status" aria-live="polite" hidden></div>
  `;
}

export function bootStudioPage(api) {
  const studio = loadStudioState();
  const addedFeedback = {};
  const addedFeedbackTimers = {};
  let toastTimer = 0;
  const tray = {
    cards: [],
    page: 1,
    reachedEnd: true,
    parsed: null,
    loading: false,
    query: "",
  };

  const searchForm = document.querySelector("#studio-search-form");
  const searchInput = document.querySelector("#studio-search-input");
  const statusEl = document.querySelector("#studio-search-status");
  const trayEl = document.querySelector("#studio-tray");
  const carouselEl = document.querySelector("#studio-carousel");
  const carouselPrev = document.querySelector("#studio-carousel-prev");
  const carouselNext = document.querySelector("#studio-carousel-next");
  const carouselIndexEl = document.querySelector("#studio-carousel-index");
  const loadMoreButton = document.querySelector("#studio-load-more");
  let carouselTarget = null;
  const boardEl = document.querySelector("#studio-board");
  const playgroundEl = document.querySelector(".studio-playground");
  const zoneSplitterEl = document.querySelector("#studio-zone-splitter");
  const zoneACountEl = document.querySelector("#studio-zone-a-count");
  const zoneBCountEl = document.querySelector("#studio-zone-b-count");
  const physics = new Map();
  let physicsRaf = 0;
  let physicsLastTs = 0;
  const inspectorEl = document.querySelector("#studio-inspector");
  const inspectorPanel = document.querySelector("#studio-inspector-panel");
  const boardCountEl = document.querySelector("#studio-board-count");
  const toggleFiltersButton = document.querySelector("#toggle-search-filters");
  const searchFiltersEl = document.querySelector("#search-filters");
  const applyFiltersButton = document.querySelector("#apply-search-filters");
  const clearFiltersButton = document.querySelector("#clear-search-filters");
  const searchDialog = document.querySelector("#studio-search-dialog");
  const openSearchButton = document.querySelector("#studio-open-search");
  const closeSearchButton = document.querySelector("#studio-close-search");
  const autocompleteListEl = document.querySelector("#studio-autocomplete-list");
  const autocomplete = {
    query: "",
    results: [],
    loading: false,
    activeIndex: -1,
    requestId: 0,
    timer: null,
  };

  function openSearchDialog() {
    if (!searchDialog) {
      return;
    }
    if (typeof searchDialog.showModal === "function" && !searchDialog.open) {
      searchDialog.showModal();
    }
    requestAnimationFrame(() => searchInput?.focus());
  }

  function closeSearchDialog() {
    if (searchDialog?.open) {
      searchDialog.close();
    }
    api.closeAllMultiSelects();
    resetStudioAutocomplete();
    openSearchButton?.focus();
  }

  openSearchButton?.addEventListener("click", () => openSearchDialog());
  closeSearchButton?.addEventListener("click", () => closeSearchDialog());
  searchDialog?.addEventListener("click", (event) => {
    if (event.target === searchDialog) {
      closeSearchDialog();
    }
  });
  searchDialog?.addEventListener("close", () => {
    api.closeAllMultiSelects();
    resetStudioAutocomplete();
  });

  api.bindQuickFilterMultiSelects();
  api.updateSearchFiltersVisibility?.();

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    api.closeAllMultiSelects();
    resetStudioAutocomplete({ keepStatus: true });
    void runSearch(searchInput.value.trim(), { reset: true });
  });

  searchInput?.addEventListener("input", () => {
    scheduleStudioAutocomplete(searchInput.value);
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      if (!autocomplete.results.length) {
        return;
      }
      event.preventDefault();
      autocomplete.activeIndex = (autocomplete.activeIndex + 1) % autocomplete.results.length;
      renderStudioAutocompleteList();
      return;
    }
    if (event.key === "ArrowUp") {
      if (!autocomplete.results.length) {
        return;
      }
      event.preventDefault();
      autocomplete.activeIndex = autocomplete.activeIndex <= 0
        ? autocomplete.results.length - 1
        : autocomplete.activeIndex - 1;
      renderStudioAutocompleteList();
      return;
    }
    if (event.key === "Enter" && autocomplete.results.length && autocomplete.activeIndex >= 0) {
      event.preventDefault();
      void addStudioAutocompleteSelection();
    }
  });

  autocompleteListEl?.addEventListener("click", (event) => {
    const suggestion = event.target.closest("[data-studio-autocomplete-index]");
    if (!suggestion) {
      return;
    }
    event.preventDefault();
    autocomplete.activeIndex = Number(suggestion.dataset.studioAutocompleteIndex);
    void addStudioAutocompleteSelection({ sourceButton: suggestion });
  });

  toggleFiltersButton?.addEventListener("click", () => {
    api.state.searchFiltersOpen = !api.state.searchFiltersOpen;
    if (!api.state.searchFiltersOpen) {
      api.closeAllMultiSelects();
    }
    searchFiltersEl.hidden = !api.state.searchFiltersOpen;
    toggleFiltersButton.setAttribute("aria-expanded", api.state.searchFiltersOpen ? "true" : "false");
  });

  applyFiltersButton?.addEventListener("click", () => {
    api.closeAllMultiSelects();
    resetStudioAutocomplete({ keepStatus: true });
    void runSearch(searchInput.value.trim(), { reset: true });
  });

  clearFiltersButton?.addEventListener("click", () => {
    const effect = document.querySelector("#quick-filter-effect");
    if (effect) {
      effect.value = "";
    }
    api.clearMultiSelect(document.querySelector("#quick-filter-set"));
    api.clearMultiSelect(document.querySelector("#quick-filter-element"));
    api.clearMultiSelect(document.querySelector("#quick-filter-type"));
    api.clearMultiSelect(document.querySelector("#quick-filter-subtype"));
    resetStudioAutocomplete({ keepStatus: true });
    void runSearch(searchInput.value.trim(), { reset: true });
  });

  document.querySelectorAll("[data-studio-example]").forEach((button) => {
    button.addEventListener("click", () => {
      searchInput.value = button.dataset.studioExample || "";
      resetStudioAutocomplete({ keepStatus: true });
      void runSearch(searchInput.value.trim(), { reset: true });
    });
  });

  loadMoreButton?.addEventListener("click", () => {
    void runSearch(tray.query, { reset: false });
  });

  carouselPrev?.addEventListener("click", () => scrollCarousel(-1));
  carouselNext?.addEventListener("click", () => {
    if (!canScrollCarousel(1) && tray.parsed && !tray.reachedEnd) {
      void runSearch(tray.query, { reset: false });
      return;
    }
    scrollCarousel(1);
  });
  trayEl?.addEventListener("scroll", () => {
    updateCarouselUi();
    maybeLoadMoreCarousel();
  }, { passive: true });
  trayEl?.addEventListener("scrollend", () => {
    carouselTarget = null;
    updateCarouselUi();
  });
  trayEl?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollCarousel(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollCarousel(-1);
    }
  });
  window.addEventListener("resize", () => {
    updateCarouselUi();
    applyZoneSplit();
    layoutStudioBoard();
  });

  document.querySelector("#studio-try-it")?.addEventListener("click", () => {
    openStudioTryIt();
  });
  document.querySelector("#studio-share")?.addEventListener("click", (event) => {
    void shareStudioBrew(event.currentTarget);
  });

  document.querySelector("#studio-copy-decklist")?.addEventListener("click", (event) => {
    void copyStudioDecklist(event.currentTarget);
  });
  document.querySelector("#studio-download-decklist")?.addEventListener("click", () => {
    downloadStudioDecklist();
  });

  document.querySelector("#studio-clear-board")?.addEventListener("click", () => {
    if (!window.confirm("Clear every card on the playground?")) {
      return;
    }
    studio.cardKeys = [];
    studio.positions = {};
    studio.nextZ = 1;
    studio.cards = {};
    studio.quantities = {};
    studio.selectedKey = "";
    physics.clear();
    persist();
    renderBoard();
    renderInspector();
  });

  boardEl?.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types?.includes("text/plain")) {
      return;
    }
    event.preventDefault();
    boardEl.classList.add("is-drop-target");
  });
  boardEl?.addEventListener("dragleave", (event) => {
    if (!boardEl.contains(event.relatedTarget)) {
      boardEl.classList.remove("is-drop-target");
    }
  });
  boardEl?.addEventListener("drop", (event) => {
    boardEl.classList.remove("is-drop-target");
    const key = event.dataTransfer?.getData("text/plain");
    if (!key) {
      return;
    }
    event.preventDefault();
    const rect = boardEl.getBoundingClientRect();
    addCardToPlayground(key, null, {
      position: {
        x: event.clientX - rect.left - STUDIO_CARD_WIDTH / 2,
        y: event.clientY - rect.top - STUDIO_CARD_HEIGHT / 2,
      },
    });
  });

  enablePlaygroundOrganize();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (searchDialog?.open) {
        return;
      }
      studio.selectedKey = "";
      renderBoard();
      renderInspector();
    }
  });

  void api.loadOptions().then(() => {
    api.renderAdvancedOptions();
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      searchInput.value = initial;
      void runSearch(initial, { reset: true });
    }
  });

  renderBoard();
  renderInspector();
  enableZoneSplitter();
  void loadSharedStudioBrew();

  function resetStudioAutocomplete({ keepStatus = false } = {}) {
    window.clearTimeout(autocomplete.timer);
    autocomplete.query = "";
    autocomplete.results = [];
    autocomplete.loading = false;
    autocomplete.activeIndex = -1;
    autocomplete.requestId += 1;
    autocomplete.timer = null;
    renderStudioAutocompleteList();
    if (!keepStatus && statusEl && !tray.loading && tray.cards.length === 0) {
      statusEl.textContent = "Search, then pick 1–4 to add a card to the playground.";
    }
  }

  function scheduleStudioAutocomplete(rawQuery) {
    const query = rawQuery.trim();
    autocomplete.query = query;
    window.clearTimeout(autocomplete.timer);

    if (query.length < 2) {
      autocomplete.results = [];
      autocomplete.activeIndex = -1;
      autocomplete.loading = false;
      renderStudioAutocompleteList();
      if (statusEl && !tray.loading) {
        statusEl.textContent = query.length === 0
          ? "Search, then pick 1–4 to add a card to the playground."
          : "Keep typing — enter at least 2 characters.";
      }
      return;
    }

    autocomplete.loading = true;
    if (statusEl) {
      statusEl.textContent = "Searching cards…";
    }
    autocomplete.timer = window.setTimeout(() => {
      void runStudioAutocomplete(query);
    }, 220);
  }

  async function runStudioAutocomplete(query) {
    if (typeof api.searchCardsByName !== "function") {
      return;
    }
    const requestId = autocomplete.requestId + 1;
    autocomplete.requestId = requestId;
    try {
      const results = await api.searchCardsByName(query, 10);
      if (requestId !== autocomplete.requestId || autocomplete.query !== query) {
        return;
      }
      autocomplete.results = results;
      autocomplete.activeIndex = results.length ? 0 : -1;
      autocomplete.loading = false;
      renderStudioAutocompleteList();
      if (statusEl) {
        statusEl.textContent = results.length
          ? `${results.length} match${results.length === 1 ? "" : "es"}. Tap a card image to add.`
          : `No name matched “${query}”. Press Search for a broader query.`;
      }
    } catch {
      if (requestId !== autocomplete.requestId) {
        return;
      }
      autocomplete.results = [];
      autocomplete.activeIndex = -1;
      autocomplete.loading = false;
      renderStudioAutocompleteList();
      if (statusEl) {
        statusEl.textContent = "Could not load card suggestions. Try Search, or try again.";
      }
    }
  }

  function renderStudioAutocompleteList() {
    if (!autocompleteListEl || !searchInput) {
      return;
    }

    const { results, activeIndex } = autocomplete;
    autocompleteListEl.replaceChildren();

    if (!results.length) {
      autocompleteListEl.hidden = true;
      searchInput.setAttribute("aria-expanded", "false");
      searchInput.removeAttribute("aria-activedescendant");
      carouselEl?.classList.remove("is-suggesting");
      return;
    }

    results.forEach((card, index) => {
      const item = document.createElement("li");
      item.setAttribute("role", "option");
      item.id = `studio-autocomplete-option-${index}`;
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
      button.dataset.studioAutocompleteIndex = String(index);
      button.title = card.name;
      button.setAttribute("aria-label", `Add ${card.name}`);

      const imageUrl = api.getImageUrl(api.resolveCardImage(card) || api.getPrimaryEdition(card)?.image);
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
      autocompleteListEl.append(item);
    });

    autocompleteListEl.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    if (activeIndex >= 0) {
      searchInput.setAttribute("aria-activedescendant", `studio-autocomplete-option-${activeIndex}`);
    } else {
      searchInput.removeAttribute("aria-activedescendant");
    }
    carouselEl?.classList.add("is-suggesting");
  }

  function playStudioAddedAnimation(button) {
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

      void card.offsetWidth;
      card.classList.add("card-added-pop");

      let finished = false;
      const done = () => {
        if (finished) {
          return;
        }
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

  async function addStudioAutocompleteSelection({ sourceButton = null } = {}) {
    const { results, activeIndex } = autocomplete;
    const card = activeIndex >= 0 ? results[activeIndex] : null;
    if (!card) {
      return;
    }

    const animatedButton =
      sourceButton ||
      autocompleteListEl?.querySelector(`[data-studio-autocomplete-index="${activeIndex}"]`);
    if (animatedButton) {
      await playStudioAddedAnimation(animatedButton);
    }

    rememberCard(card);
    const key = api.getCardKey(card);
    const alreadyHere = studio.cardKeys.includes(key);
    const nextQty = alreadyHere ? clampStudioQty(getQuantity(key) + 1) : STUDIO_MIN_QTY;
    addCardToPlayground(key, nextQty, { updated: alreadyHere });
    if (statusEl) {
      statusEl.textContent = `Added ${card.name}. Tap another suggestion to keep adding.`;
    }
    searchInput?.focus();
  }

  async function runSearch(query, { reset }) {
    const hasFilters = Boolean(
      document.querySelector("#quick-filter-effect")?.value.trim() ||
        api.getMultiSelectValues(document.querySelector("#quick-filter-set")).length ||
        api.getMultiSelectValues(document.querySelector("#quick-filter-element")).length ||
        api.getMultiSelectValues(document.querySelector("#quick-filter-type")).length ||
        api.getMultiSelectValues(document.querySelector("#quick-filter-subtype")).length,
    );
    if (!query && !hasFilters) {
      tray.cards = [];
      tray.parsed = null;
      tray.query = "";
      tray.reachedEnd = true;
      statusEl.textContent = "Search, then pick 1–4 to add a card to the playground.";
      renderTray();
      return;
    }

    if (reset) {
      tray.cards = [];
      tray.page = 1;
      tray.reachedEnd = false;
      tray.restoreScroll = 0;
    }

    tray.loading = true;
    tray.query = query;
    tray.parsed = api.applyQuickFilters(api.parseNaturalQuery(query, api.state.options));
    statusEl.textContent = reset ? "Searching cards..." : "Loading more cards...";
    renderTray();

    try {
      const { cards, hasMore, totalCards } = await api.fetchCards(tray.parsed, tray.page);
      const visible = cards.filter((card) => api.cardMatchesParsedQuery(card, tray.parsed));
      tray.cards = api.uniqueBy([...tray.cards, ...visible], (card) => api.getCardKey(card));
      tray.page += 1;
      tray.reachedEnd = typeof hasMore === "boolean" ? !hasMore : cards.length < 50;
      const totalLabel = Number.isFinite(totalCards) ? ` of ${totalCards}` : "";
      statusEl.textContent = tray.cards.length
        ? `${tray.cards.length}${totalLabel} results · click for spotlight, pick 1–4 to add`
        : "No cards matched that search.";
    } catch (error) {
      console.error(error);
      statusEl.textContent = "Could not reach the Grand Archive API. Please try again.";
    } finally {
      tray.loading = false;
      renderTray();
    }
  }

  function renderTray() {
    const restoreScroll = tray.restoreScroll ?? trayEl.scrollLeft;
    trayEl.replaceChildren();
    if (tray.loading && tray.cards.length === 0) {
      statusEl.textContent = "Searching cards...";
    }
    for (const card of tray.cards) {
      rememberCard(card);
      trayEl.append(createMiniCard(card, { inTray: true }));
    }
    if (tray.parsed && !tray.reachedEnd) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "studio-carousel-more";
      more.textContent = tray.loading ? "Loading..." : "Load more";
      more.disabled = tray.loading;
      more.addEventListener("click", () => {
        void runSearch(tray.query, { reset: false });
      });
      trayEl.append(more);
    }
    loadMoreButton.classList.add("hidden");
    carouselEl?.classList.toggle("is-empty", tray.cards.length === 0 && !tray.loading);
    requestAnimationFrame(() => {
      trayEl.scrollLeft = restoreScroll;
      carouselTarget = null;
      tray.restoreScroll = null;
      updateCarouselUi();
    });
  }

  function carouselCardStep() {
    const card = trayEl.querySelector(".studio-card");
    const styles = window.getComputedStyle(trayEl);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 14;
    const width = card ? card.getBoundingClientRect().width + gap : 180;
    const visible = Math.max(1, Math.floor((trayEl.clientWidth + gap) / width));
    return width * visible;
  }

  function canScrollCarousel(direction) {
    const max = Math.max(0, trayEl.scrollWidth - trayEl.clientWidth);
    if (direction < 0) {
      return trayEl.scrollLeft > 8;
    }
    return trayEl.scrollLeft < max - 8;
  }

  function scrollCarousel(direction) {
    const max = Math.max(0, trayEl.scrollWidth - trayEl.clientWidth);
    const from = carouselTarget ?? trayEl.scrollLeft;
    const next = Math.min(max, Math.max(0, from + direction * carouselCardStep()));
    carouselTarget = next;
    trayEl.scrollTo({ left: next, behavior: "smooth" });
  }

  function visibleCarouselRange() {
    const cards = [...trayEl.querySelectorAll(".studio-card")];
    if (cards.length === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    const trayBox = trayEl.getBoundingClientRect();
    let start = cards.length;
    let end = 0;
    cards.forEach((card, index) => {
      const cardBox = card.getBoundingClientRect();
      if (cardBox.right > trayBox.left + 16 && cardBox.left < trayBox.right - 16) {
        start = Math.min(start, index + 1);
        end = Math.max(end, index + 1);
      }
    });
    if (end === 0) {
      return { start: 1, end: 1, total: cards.length };
    }
    return { start, end, total: cards.length };
  }

  function updateCarouselUi() {
    const hasCards = tray.cards.length > 0;
    const atStart = !canScrollCarousel(-1);
    const atEnd = !canScrollCarousel(1);
    carouselPrev.disabled = !hasCards || atStart;
    carouselNext.disabled = !hasCards || (atEnd && (tray.reachedEnd || tray.loading));
    const range = visibleCarouselRange();
    if (!hasCards || range.total === 0) {
      carouselIndexEl.hidden = true;
      carouselIndexEl.textContent = "";
      return;
    }
    carouselIndexEl.hidden = false;
    carouselIndexEl.textContent = range.start === range.end
      ? `${range.start} of ${range.total}`
      : `${range.start}–${range.end} of ${range.total}`;
  }

  function maybeLoadMoreCarousel() {
    if (tray.loading || !tray.parsed || tray.reachedEnd) {
      return;
    }
    if (
      trayEl.scrollLeft + trayEl.clientWidth >= trayEl.scrollWidth - 120 ||
      trayEl.scrollTop + trayEl.clientHeight >= trayEl.scrollHeight - 120
    ) {
      void runSearch(tray.query, { reset: false });
    }
  }

  function renderBoard() {
    boardEl.replaceChildren();
    const total = boardCardCount();
    boardCountEl.textContent = total === 1 ? "1 card" : `${total} cards`;

    if (studio.cardKeys.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint studio-board-empty";
      empty.textContent = "Empty · Add Card to search, then drag cards on the playground";
      boardEl.append(empty);
      boardEl.style.minHeight = "";
      updateZoneCounts();
      return;
    }

    studio.cardKeys.forEach((key, index) => {
      const card = studio.cards[key];
      if (card) {
        boardEl.append(createMiniCard(card, { onBoard: true, layoutIndex: index }));
      }
    });
    window.requestAnimationFrame(() => layoutStudioBoard());
  }

  function selectStudioCard(key) {
    if (studio.selectedKey === key) {
      renderInspector();
      return;
    }
    studio.selectedKey = key;
    persist();
    boardEl.querySelectorAll("[data-studio-card]").forEach((el) => {
      el.classList.toggle("is-selected", el.dataset.studioCard === key);
    });
    trayEl?.querySelectorAll(".studio-card").forEach((el) => {
      el.classList.toggle("is-selected", el.dataset.studioCard === key);
    });
    renderInspector();
  }

  function snapStudioCoord(value) {
    return Math.round(value / STUDIO_SNAP) * STUDIO_SNAP;
  }

  function snapStudioPosition({ x, y, z }) {
    return {
      x: snapStudioCoord(x),
      y: snapStudioCoord(y),
      z,
    };
  }

  function estimateStudioSlot(index, cols = 4) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return snapStudioPosition({
      x: STUDIO_PADDING + col * (STUDIO_CARD_WIDTH + STUDIO_GAP_X),
      y: STUDIO_ZONE_HEAD + STUDIO_PADDING + row * (STUDIO_CARD_HEIGHT + STUDIO_GAP_Y),
      z: index + 1,
    });
  }

  function studioZoneSlot(index, boardWidth, boardHeight) {
    const splitX = Math.max(STUDIO_CARD_WIDTH + STUDIO_PADDING * 2, boardWidth * (studio.zoneSplit || 0.5));
    const usableHeight = Math.max(STUDIO_CARD_HEIGHT, boardHeight - STUDIO_ZONE_HEAD - STUDIO_PADDING);
    const rows = Math.max(1, Math.floor((usableHeight + STUDIO_GAP_Y) / (STUDIO_CARD_HEIGHT + STUDIO_GAP_Y)));
    const colsFor = (width) => {
      const inner = Math.max(STUDIO_CARD_WIDTH, width - STUDIO_PADDING * 2);
      return Math.max(1, Math.floor((inner + STUDIO_GAP_X) / (STUDIO_CARD_WIDTH + STUDIO_GAP_X)));
    };
    const colsA = colsFor(splitX);
    const zoneCapacity = colsA * rows;
    const zone = index < zoneCapacity ? 0 : 1;
    const local = zone === 0 ? index : index - zoneCapacity;
    const cols = zone === 0 ? colsA : colsFor(boardWidth - splitX);
    const col = local % cols;
    const row = Math.min(rows - 1, Math.floor(local / cols));
    return snapStudioPosition({
      x: (zone === 0 ? 0 : splitX) + STUDIO_PADDING + col * (STUDIO_CARD_WIDTH + STUDIO_GAP_X),
      y: STUDIO_ZONE_HEAD + STUDIO_PADDING + row * (STUDIO_CARD_HEIGHT + STUDIO_GAP_Y),
      z: index + 1,
    });
  }

  function studioZoneSplitX() {
    return (boardEl?.clientWidth || 0) * (studio.zoneSplit || 0.5);
  }

  function studioZoneForX(x) {
    return x + STUDIO_CARD_WIDTH / 2 < studioZoneSplitX() ? "a" : "b";
  }

  function applyZoneSplit() {
    const split = clampStudioZoneSplit(studio.zoneSplit);
    studio.zoneSplit = split;
    playgroundEl?.style.setProperty("--studio-split", `${split * 100}%`);
    zoneSplitterEl?.setAttribute("aria-valuenow", String(Math.round(split * 100)));
  }

  function enableZoneSplitter() {
    if (!zoneSplitterEl || !playgroundEl) {
      return;
    }
    zoneSplitterEl.setAttribute("role", "separator");
    zoneSplitterEl.setAttribute("aria-valuemin", String(Math.round(STUDIO_ZONE_SPLIT_MIN * 100)));
    zoneSplitterEl.setAttribute("aria-valuemax", String(Math.round(STUDIO_ZONE_SPLIT_MAX * 100)));
    applyZoneSplit();

    let pointerId = null;

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      const rect = playgroundEl.getBoundingClientRect();
      const width = rect.width || 1;
      studio.zoneSplit = clampStudioZoneSplit((event.clientX - rect.left) / width);
      applyZoneSplit();
      updateZoneCounts();
    };

    const onPointerUp = (event) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      pointerId = null;
      zoneSplitterEl.classList.remove("is-dragging");
      try {
        zoneSplitterEl.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture was already released.
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      persist();
    };

    zoneSplitterEl.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      pointerId = event.pointerId;
      zoneSplitterEl.classList.add("is-dragging");
      try {
        zoneSplitterEl.setPointerCapture(event.pointerId);
      } catch {
        // Window listeners still handle move/up if capture is rejected.
      }
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });

    zoneSplitterEl.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -0.02 : 0.02;
      studio.zoneSplit = clampStudioZoneSplit(studio.zoneSplit + delta);
      applyZoneSplit();
      persist();
    });
  }

  function updateZoneCounts() {
    let a = 0;
    let b = 0;
    for (const key of studio.cardKeys) {
      const x = Number(studio.positions[key]?.x);
      const qty = getQuantity(key);
      if (Number.isFinite(x) && studioZoneForX(x) === "b") {
        b += qty;
      } else {
        a += qty;
      }
    }
    if (zoneACountEl) {
      zoneACountEl.textContent = String(a);
    }
    if (zoneBCountEl) {
      zoneBCountEl.textContent = String(b);
    }
    zoneACountEl?.closest(".studio-zone")?.setAttribute("aria-label", `Area A, ${a} cards`);
    zoneBCountEl?.closest(".studio-zone")?.setAttribute("aria-label", `Area B, ${b} cards`);
  }

  function layoutStudioBoard({ force = false } = {}) {
    if (!boardEl || studioPhysicsHeld()) {
      return;
    }
    const cards = [...boardEl.querySelectorAll("[data-studio-card]")];
    if (cards.length === 0) {
      boardEl.style.minHeight = "";
      updateZoneCounts();
      return;
    }

    const boardWidth = Math.max(boardEl.clientWidth || playgroundEl?.clientWidth || 640, 240);
    const boardHeight = Math.max(boardEl.clientHeight || playgroundEl?.clientHeight || 320, 240);

    const occupied = new Set();
    if (!force) {
      cards.forEach((cardEl) => {
        const saved = studio.positions[cardEl.dataset.studioCard];
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          occupied.add(`${Math.round(saved.x)}:${Math.round(saved.y)}`);
        }
      });
    }

    let nextSlot = 0;
    cards.forEach((cardEl, index) => {
      const key = cardEl.dataset.studioCard;
      const saved = studio.positions[key];
      let x;
      let y;
      let z;

      if (!force && saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
        x = saved.x;
        y = saved.y;
        z = Number.isFinite(saved.z) ? saved.z : index + 1;
      } else {
        let slotKey;
        do {
          const slot = studioZoneSlot(nextSlot, boardWidth, boardHeight);
          x = slot.x;
          y = slot.y;
          slotKey = `${Math.round(x)}:${Math.round(y)}`;
          nextSlot += 1;
        } while (occupied.has(slotKey));
        occupied.add(slotKey);
        z = index + 1;
      }

      const clamped = clampStudioBoardPoint(x, y);
      x = clamped.x;
      y = clamped.y;
      z = Number.isFinite(z) ? z : index + 1;

      cardEl.style.left = `${x}px`;
      cardEl.style.top = `${y}px`;
      cardEl.style.zIndex = String(z);
      studio.positions[key] = { x, y, z };
      studio.nextZ = Math.max(studio.nextZ, z + 1);
    });

    boardEl.style.minHeight = "";
    cards.forEach((cardEl) => applyStudioPose(cardEl, getStudioPhysics(cardEl.dataset.studioCard)));
    persist();
  }

  function studioCardPoint(cardEl) {
    const saved = studio.positions[cardEl.dataset.studioCard];
    return {
      x: Number.parseFloat(cardEl.style.left) || saved?.x || 0,
      y: Number.parseFloat(cardEl.style.top) || saved?.y || 0,
    };
  }

  function restStudioPhysics(key) {
    const body = getStudioPhysics(key);
    body.vx = 0;
    body.vy = 0;
    body.lift = 0;
    body.spin = 0;
    body.held = false;
    body.hop = 0;
    body.hopV = 0;
    body.squash = 0;
    body.squashV = 0;
  }

  function layoutCardsInZone(cardEls, zone) {
    const boardWidth = boardEl?.clientWidth || 0;
    const boardHeight = boardEl?.clientHeight || 0;
    const splitX = studioZoneSplitX();
    const left = zone === "b" ? splitX : 0;
    const right = zone === "b" ? boardWidth : splitX;
    const width = Math.max(STUDIO_CARD_WIDTH, right - left);
    const inner = Math.max(STUDIO_CARD_WIDTH, width - STUDIO_PADDING * 2);
    const cols = Math.max(1, Math.floor((inner + STUDIO_GAP_X) / (STUDIO_CARD_WIDTH + STUDIO_GAP_X)));
    const stepX = STUDIO_CARD_WIDTH + STUDIO_GAP_X;
    const stepY = STUDIO_CARD_HEIGHT + STUDIO_GAP_Y + STUDIO_QTY_HANG;
    const usableHeight = Math.max(stepY, boardHeight - STUDIO_ZONE_HEAD - STUDIO_PADDING);
    const rows = Math.max(1, Math.floor((usableHeight + STUDIO_GAP_Y) / stepY));
    const minX = left + STUDIO_PADDING;
    const maxX = Math.max(minX, right - STUDIO_CARD_WIDTH - STUDIO_PADDING);

    cardEls.forEach((cardEl, index) => {
      const key = cardEl.dataset.studioCard;
      const col = index % cols;
      const row = Math.min(rows - 1, Math.floor(index / cols));
      const next = clampStudioBoardPoint(
        Math.min(maxX, minX + col * stepX),
        STUDIO_ZONE_HEAD + STUDIO_PADDING + row * stepY,
      );
      restStudioPhysics(key);
      writeStudioCardPosition(cardEl, key, next.x, next.y);
      applyStudioPose(cardEl, getStudioPhysics(key));
    });
  }

  function organizeStudioBoard() {
    if (!boardEl || studioPhysicsHeld()) {
      return;
    }
    const cards = [...boardEl.querySelectorAll("[data-studio-card]")];
    if (cards.length === 0) {
      return;
    }

    const groups = { a: [], b: [] };
    for (const cardEl of cards) {
      groups[studioZoneForX(studioCardPoint(cardEl).x)].push(cardEl);
    }
    const byReadingOrder = (left, right) => {
      const a = studioCardPoint(left);
      const b = studioCardPoint(right);
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      return a.x - b.x;
    };
    groups.a.sort(byReadingOrder);
    groups.b.sort(byReadingOrder);
    cards.forEach((cardEl) => cardEl.classList.add("is-organizing"));
    void boardEl.offsetWidth;
    layoutCardsInZone(groups.a, "a");
    layoutCardsInZone(groups.b, "b");
    persist();
    window.setTimeout(() => {
      boardEl.querySelectorAll(".is-organizing").forEach((cardEl) => {
        cardEl.classList.remove("is-organizing");
      });
    }, 420);
  }

  function isEmptyPlaygroundTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }
    if (target.closest(".studio-card, .studio-zone-splitter, .studio-qty-stepper, button, select, a, input, textarea")) {
      return false;
    }
    return Boolean(target.closest(".studio-board, .studio-playground, .studio-zones"));
  }

  function enablePlaygroundOrganize() {
    if (!playgroundEl) {
      return;
    }
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let lastOrganizeAt = 0;

    const onEmptyDoubleTap = () => {
      const now = performance.now();
      if (now - lastOrganizeAt < 400) {
        return;
      }
      lastOrganizeAt = now;
      lastTapAt = 0;
      organizeStudioBoard();
    };

    playgroundEl.addEventListener("pointerup", (event) => {
      if (event.button != null && event.button !== 0) {
        return;
      }
      if (!isEmptyPlaygroundTarget(event.target)) {
        lastTapAt = 0;
        return;
      }
      const now = performance.now();
      const near = Math.hypot(event.clientX - lastTapX, event.clientY - lastTapY) <= STUDIO_DOUBLE_TAP_PX;
      if (lastTapAt && now - lastTapAt <= STUDIO_DOUBLE_TAP_MS && near) {
        event.preventDefault();
        onEmptyDoubleTap();
        return;
      }
      lastTapAt = now;
      lastTapX = event.clientX;
      lastTapY = event.clientY;
    });

    playgroundEl.addEventListener("dblclick", (event) => {
      if (!isEmptyPlaygroundTarget(event.target)) {
        return;
      }
      event.preventDefault();
      onEmptyDoubleTap();
    });
  }

  function getStudioPhysics(key) {
    let body = physics.get(key);
    if (!body) {
      body = { vx: 0, vy: 0, lift: 0, spin: 0, held: false, hop: 0, hopV: 0, squash: 0, squashV: 0 };
      physics.set(key, body);
    }
    return body;
  }

  function studioPhysicsHeld() {
    for (const body of physics.values()) {
      if (body.held) {
        return true;
      }
    }
    return false;
  }

  function studioPhysicsBusy() {
    for (const body of physics.values()) {
      if (
        body.held
        || body.lift > 0.02
        || Math.hypot(body.vx, body.vy) > STUDIO_MIN_SPEED
        || Math.abs(body.hop) > 0.4
        || Math.abs(body.hopV) > 0.03
        || Math.abs(body.squash) > 0.006
        || Math.abs(body.squashV) > 0.0003
      ) {
        return true;
      }
    }
    return false;
  }

  function clampStudioBoardPoint(x, y) {
    const boardWidth = boardEl?.clientWidth || 0;
    const boardHeight = boardEl?.clientHeight || 0;
    const maxX = Math.max(0, boardWidth - STUDIO_CARD_WIDTH);
    const maxY = Math.max(STUDIO_ZONE_HEAD, boardHeight - STUDIO_CARD_HEIGHT - STUDIO_QTY_HANG);
    return {
      x: Math.min(maxX, Math.max(0, x)),
      y: Math.min(maxY, Math.max(STUDIO_ZONE_HEAD, y)),
    };
  }

  function applyStudioPose(cardEl, body) {
    const lift = body.lift;
    const scale = 1 + STUDIO_LIFT_SCALE * lift;
    const squash = body.squash || 0;
    const hop = body.hop || 0;
    const scaleX = scale * (1 + squash * 0.5);
    const scaleY = scale * (1 - squash * 0.58);
    const tiltY = Math.max(-STUDIO_MAX_TILT, Math.min(STUDIO_MAX_TILT, body.vx * 22 * lift));
    const tiltX = Math.max(-STUDIO_MAX_TILT, Math.min(STUDIO_MAX_TILT, -body.vy * 18 * lift));
    const spin = Math.max(-10, Math.min(10, body.spin));
    cardEl.style.transform = `translateY(${hop}px) translateZ(${STUDIO_LIFT_Z * lift}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${spin}deg) scale(${scaleX}, ${scaleY})`;
    const frame = cardEl.querySelector(".studio-card-frame");
    if (frame) {
      frame.style.boxShadow = `0 ${10 + 36 * lift - hop * 0.4}px ${20 + 42 * lift}px rgba(0, 0, 0, ${0.32 + 0.3 * lift})`;
    }
    cardEl.classList.toggle("is-lifted", lift > 0.08 || hop < -2);
    cardEl.classList.toggle("dragging", body.held);
  }

  function writeStudioCardPosition(cardEl, key, x, y) {
    const z = Number.parseInt(cardEl.style.zIndex, 10) || studio.nextZ;
    cardEl.style.left = `${x}px`;
    cardEl.style.top = `${y}px`;
    studio.positions[key] = { x, y, z };
    updateZoneCounts();
  }

  function resolveStudioCollisions(bodies) {
    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < bodies.length; i += 1) {
        for (let j = i + 1; j < bodies.length; j += 1) {
          const a = bodies[i];
          const b = bodies[j];
          if (a.body.held || b.body.held) {
            continue;
          }
          const aActive = studioBodyDrifting(a.body);
          const bActive = studioBodyDrifting(b.body);
          if (!aActive && !bActive) {
            continue;
          }
          const dx = (a.x + STUDIO_CARD_WIDTH / 2) - (b.x + STUDIO_CARD_WIDTH / 2);
          const dy = (a.y + STUDIO_CARD_HEIGHT / 2) - (b.y + STUDIO_CARD_HEIGHT / 2);
          const overlapX = STUDIO_CARD_WIDTH - Math.abs(dx);
          const overlapY = STUDIO_CARD_HEIGHT - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) {
            continue;
          }
          const alongX = overlapX < overlapY;
          const dir = alongX ? (dx < 0 ? -1 : 1) : (dy < 0 ? -1 : 1);
          const overlap = alongX ? overlapX : overlapY;
          if (aActive && !bActive) {
            if (alongX) {
              a.x += overlap * dir;
              a.body.vx *= 0.12;
            } else {
              a.y += overlap * dir;
              a.body.vy *= 0.12;
            }
          } else if (bActive && !aActive) {
            if (alongX) {
              b.x -= overlap * dir;
              b.body.vx *= 0.12;
            } else {
              b.y -= overlap * dir;
              b.body.vy *= 0.12;
            }
          } else {
            const push = overlap * 0.32 * dir;
            if (alongX) {
              a.x += push;
              b.x -= push;
            } else {
              a.y += push;
              b.y -= push;
            }
          }
        }
      }
    }
  }

  function studioBodyDrifting(body) {
    return body.lift > 0.16 || Math.hypot(body.vx, body.vy) > STUDIO_MIN_SPEED * 3;
  }

  function stepStudioPhysics(now) {
    const dt = Math.max(8, Math.min(32, now - physicsLastTs));
    physicsLastTs = now;
    const cards = [...boardEl.querySelectorAll("[data-studio-card]")];
    const bodies = cards.map((el) => ({
      el,
      key: el.dataset.studioCard,
      x: Number.parseFloat(el.style.left) || 0,
      y: Number.parseFloat(el.style.top) || 0,
      body: getStudioPhysics(el.dataset.studioCard),
    }));

    for (const item of bodies) {
      const body = item.body;
      const liftTarget = body.held ? 1 : 0;
      const liftRate = body.held ? STUDIO_LIFT_RISE : STUDIO_LIFT_DROP;
      body.lift += (liftTarget - body.lift) * (1 - Math.exp(-liftRate * dt));
      if (!body.held) {
        item.x += body.vx * dt;
        item.y += body.vy * dt;
        const damp = Math.exp(-STUDIO_FRICTION * dt);
        body.vx *= damp;
        body.vy *= damp;
        body.spin *= Math.exp(-0.008 * dt);
        if (Math.hypot(body.vx, body.vy) < STUDIO_MIN_SPEED) {
          body.vx = 0;
          body.vy = 0;
        }
        body.hopV += STUDIO_GRAVITY * dt;
        body.hop += body.hopV * dt;
        if (body.hop >= 0) {
          body.hop = 0;
          if (body.hopV > 0.12) {
            const impact = body.hopV;
            body.hopV *= -STUDIO_BOUNCE_KEEP;
            body.squash = Math.min(0.05, 0.01 + impact * 0.06);
            body.squashV = -impact * 0.006;
          } else {
            body.hopV = 0;
          }
        }
        body.squashV += (-STUDIO_SQUASH_SPRING * body.squash - STUDIO_SQUASH_DAMP * body.squashV) * dt;
        body.squash += body.squashV * dt;
        if (Math.abs(body.squash) < 0.004 && Math.abs(body.squashV) < 0.00025) {
          body.squash = 0;
          body.squashV = 0;
        }
        const clamped = clampStudioBoardPoint(item.x, item.y);
        if (clamped.x !== item.x) {
          body.vx *= -STUDIO_RESTITUTION;
        }
        if (clamped.y !== item.y) {
          body.vy *= -STUDIO_RESTITUTION;
        }
        item.x = clamped.x;
        item.y = clamped.y;
      } else {
        body.spin += (body.vx * 9 - body.spin) * 0.18;
        body.hop = 0;
        body.hopV = 0;
      }
    }

    resolveStudioCollisions(bodies);

    for (const item of bodies) {
      if (!item.body.held) {
        const clamped = clampStudioBoardPoint(item.x, item.y);
        item.x = clamped.x;
        item.y = clamped.y;
      }
      writeStudioCardPosition(item.el, item.key, item.x, item.y);
      applyStudioPose(item.el, item.body);
    }

    if (studioPhysicsBusy()) {
      physicsRaf = window.requestAnimationFrame(stepStudioPhysics);
      return;
    }
    physicsRaf = 0;
    persist();
  }

  function kickStudioPhysics() {
    if (physicsRaf) {
      return;
    }
    physicsLastTs = performance.now();
    physicsRaf = window.requestAnimationFrame(stepStudioPhysics);
  }

  function openStudioCardLightbox(key) {
    const card = studio.cards[key];
    if (!card || typeof api.openLightbox !== "function") {
      return;
    }
    const cards = studio.cardKeys.map((cardKey) => studio.cards[cardKey]).filter(Boolean);
    api.openLightbox(card, { source: "studio", cards });
  }

  function enableStudioDrag(cardEl, key) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let originPointerX = 0;
    let originPointerY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPointerT = 0;
    let dragMoved = false;
    let tapCount = 0;
    let lastTapAt = 0;

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      const now = performance.now();
      const dx = event.clientX - originPointerX;
      const dy = event.clientY - originPointerY;
      if (Math.hypot(dx, dy) > 4) {
        dragMoved = true;
      }
      const frameDt = Math.max(8, now - lastPointerT);
      const body = getStudioPhysics(key);
      body.vx = (event.clientX - lastPointerX) / frameDt;
      body.vy = (event.clientY - lastPointerY) / frameDt;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerT = now;

      const next = clampStudioBoardPoint(startX + dx, startY + dy);
      writeStudioCardPosition(cardEl, key, next.x, next.y);
      applyStudioPose(cardEl, body);
      kickStudioPhysics();
    };

    const onPointerUp = (event) => {
      if (pointerId !== event.pointerId) {
        return;
      }
      pointerId = null;
      const body = getStudioPhysics(key);
      body.held = false;
      try {
        cardEl.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture was already released.
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (!dragMoved) {
        body.vx = 0;
        body.vy = 0;
        body.spin = 0;
        body.hop = 0;
        body.hopV = 0;
        body.squash = 0;
        body.squashV = 0;
        selectStudioCard(key);
        const now = Date.now();
        if (now - lastTapAt > STUDIO_TRIPLE_TAP_MS) {
          tapCount = 0;
        }
        tapCount += 1;
        lastTapAt = now;
        if (tapCount >= 3) {
          tapCount = 0;
          lastTapAt = 0;
          openStudioCardLightbox(key);
        }
      } else {
        tapCount = 0;
        lastTapAt = 0;
        body.hop = 0;
        body.hopV = 0;
        body.squash = 0.028;
        body.squashV = -0.002;
      }
      kickStudioPhysics();
    };

    cardEl.addEventListener("pointerdown", (event) => {
      if (event.button != null && event.button !== 0) {
        return;
      }
      if (event.target.closest(".studio-card-qty, .studio-qty-stepper, .studio-card-remove, select, button.studio-card-remove")) {
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
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      lastPointerT = performance.now();

      studio.nextZ += 1;
      cardEl.style.zIndex = String(studio.nextZ);
      const body = getStudioPhysics(key);
      body.held = true;
      body.vx = 0;
      body.vy = 0;
      applyStudioPose(cardEl, body);
      kickStudioPhysics();

      try {
        cardEl.setPointerCapture(event.pointerId);
      } catch {
        // Window listeners still handle move/up if capture is rejected.
      }

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  }

  function renderInspector() {
    const card = studio.cards[studio.selectedKey];
    inspectorEl.replaceChildren();
    inspectorPanel?.classList.toggle("is-empty", !card);
    inspectorEl.classList.toggle("is-empty", !card);

    if (!card) {
      const heading = document.createElement("p");
      heading.className = "eyebrow studio-spotlight-kicker";
      heading.textContent = "Spotlight";
      inspectorEl.append(heading);
      const empty = document.createElement("p");
      empty.className = "studio-spotlight-empty";
      empty.textContent = "Click a card to put it on camera.";
      inspectorEl.append(empty);
      return;
    }

    const imageUrl = api.getImageUrl(api.resolveCardImage(card) || api.getPrimaryEdition(card)?.image);
    if (imageUrl) {
      const backdrop = document.createElement("div");
      backdrop.className = "studio-inspector-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "";
      backdrop.append(image);
      inspectorEl.append(backdrop);
    }

    const name = document.createElement("h2");
    name.className = "studio-inspector-name";
    name.textContent = card.name;

    const stats = document.createElement("div");
    stats.className = "studio-stats";
    const cost = getStudioCostStat(card);
    stats.append(
      createStudioStat(cost.label, cost.value),
      createStudioStat("Power", formatStudioStat(card.power)),
      createStudioStat("Life", formatStudioStat(card.life)),
    );

    const effect = document.createElement("p");
    effect.className = "studio-inspector-effect";
    const effectText = getEffectText(card).replace(/\s+\n/g, "\n").trim();
    effect.textContent = effectText || "No effect text on this printing.";

    const copy = document.createElement("div");
    copy.className = "studio-inspector-copy";
    copy.append(name, stats, effect);

    const actions = document.createElement("div");
    actions.className = "studio-inspector-actions";
    const onBoard = studio.cardKeys.includes(api.getCardKey(card));
    const qtyLabel = document.createElement("div");
    qtyLabel.className = "studio-inspector-qty";
    const qtyText = document.createElement("span");
    qtyText.textContent = "Qty";
    const qtyStepper = createQuantityStepper({
      value: onBoard ? getQuantity(api.getCardKey(card)) : STUDIO_MIN_QTY,
      ariaLabel: `Copies of ${card.name}`,
      className: "studio-inspector-qty-stepper",
      onChange: onBoard
        ? (amount) => {
            addCardToPlayground(api.getCardKey(card), amount, {
              notify: true,
              updated: true,
            });
          }
        : null,
    });
    qtyLabel.append(qtyText, qtyStepper);
    actions.append(qtyLabel);
    if (!onBoard) {
      const add = document.createElement("button");
      add.type = "button";
      add.textContent = "Add to playground";
      add.addEventListener("click", () => {
        addCardToPlayground(api.getCardKey(card), Number(qtyStepper.dataset.qty) || 1);
      });
      actions.append(add);
    } else {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeCardFromBoard(api.getCardKey(card)));
      actions.append(remove);
    }
    copy.append(actions);
    inspectorEl.append(copy);
  }

  function createMiniCard(card, { inTray = false, onBoard = false, layoutIndex = 0 } = {}) {
    const key = api.getCardKey(card);
    const item = document.createElement("article");
    item.className = "studio-card";
    item.dataset.studioCard = key;
    item.classList.toggle("studio-card-in-tray", inTray);
    item.classList.toggle("studio-freehand-card", onBoard);
    item.classList.toggle("is-selected", key === studio.selectedKey);
    item.title = onBoard
      ? `${card.name} ×${getQuantity(key)} — triple-click to enlarge, drag to move`
      : card.name;
    if (inTray) {
      item.draggable = true;
      item.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", key);
        event.dataTransfer.effectAllowed = "copyMove";
      });
    }
    if (onBoard) {
      const provisional = studio.positions[key] && Number.isFinite(studio.positions[key].x)
        ? studio.positions[key]
        : estimateStudioSlot(layoutIndex);
      item.style.left = `${provisional.x}px`;
      item.style.top = `${provisional.y}px`;
      item.style.zIndex = String(provisional.z || layoutIndex + 1);
      item.style.width = `${STUDIO_CARD_WIDTH}px`;
      item.style.height = `${STUDIO_CARD_HEIGHT}px`;
      applyStudioPose(item, getStudioPhysics(key));
    }

    const frame = document.createElement("div");
    frame.className = "studio-card-frame";

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "studio-card-image";
    imageButton.setAttribute("aria-label", `Inspect ${card.name}`);
    imageButton.addEventListener("click", () => {
      if (onBoard) {
        return;
      }
      rememberCard(card);
      selectStudioCard(key);
    });
    if (inTray) {
      imageButton.addEventListener("dblclick", (event) => {
        event.preventDefault();
        rememberCard(card);
        addCardToPlayground(key, 1);
      });
    }

    const imageUrl = api.getImageUrl(api.resolveCardImage(card) || api.getPrimaryEdition(card)?.image);
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = card.name;
      image.draggable = false;
      imageButton.append(image);
    } else {
      imageButton.append(api.createPlaceholder(card.name));
    }
    frame.append(imageButton);

    if (inTray) {
      const qtySelect = createQuantitySelect({
        includePlaceholder: true,
        value: "",
        ariaLabel: `Add ${card.name} to the playground`,
      });
      qtySelect.addEventListener("click", (event) => event.stopPropagation());
      qtySelect.addEventListener("mousedown", (event) => event.stopPropagation());
      qtySelect.addEventListener("pointerdown", (event) => event.stopPropagation());
      qtySelect.addEventListener("change", (event) => {
        event.stopPropagation();
        const amount = Number(qtySelect.value);
        if (!amount) {
          return;
        }
        rememberCard(card);
        addCardToPlayground(key, amount);
      });
      frame.append(qtySelect);
    } else if (onBoard) {
      const qty = getQuantity(key);
      const qtyBadge = document.createElement("span");
      qtyBadge.className = "studio-card-qty-badge";
      qtyBadge.textContent = `×${qty}`;
      qtyBadge.setAttribute("aria-label", `${qty} ${qty === 1 ? "copy" : "copies"}`);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "studio-card-remove";
      remove.setAttribute("aria-label", `Remove ${card.name}`);
      remove.textContent = "×";
      remove.addEventListener("pointerdown", (event) => event.stopPropagation());
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        removeCardFromBoard(key);
      });
      frame.append(qtyBadge, remove);
    }

    if (addedFeedback[key]) {
      const added = document.createElement("span");
      added.className = "result-added-message studio-card-added show";
      added.textContent = addedFeedback[key];
      frame.append(added);
    }

    item.append(frame);
    if (inTray) {
      const caption = document.createElement("p");
      caption.className = "studio-card-name";
      caption.textContent = card.name;
      item.append(caption);
    }
    if (onBoard) {
      enableStudioDrag(item, key);
    }

    return item;
  }

  function createQuantityStepper({ value, ariaLabel, onChange = null, className = "" }) {
    const wrap = document.createElement("div");
    wrap.className = `studio-qty-stepper ${className}`.trim();
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", ariaLabel);
    wrap.dataset.qty = String(clampStudioQty(value));

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "studio-qty-btn";
    minus.setAttribute("aria-label", "Decrease quantity");
    minus.textContent = "−";

    const display = document.createElement("span");
    display.className = "studio-qty-value";
    display.setAttribute("aria-hidden", "true");

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "studio-qty-btn";
    plus.setAttribute("aria-label", "Increase quantity");
    plus.textContent = "+";

    const apply = (next, emit) => {
      const qty = clampStudioQty(next);
      wrap.dataset.qty = String(qty);
      display.textContent = String(qty);
      minus.disabled = qty <= STUDIO_MIN_QTY;
      plus.disabled = qty >= STUDIO_MAX_QTY;
      if (emit && typeof onChange === "function") {
        onChange(qty);
      }
    };

    const halt = (event) => {
      event.stopPropagation();
    };
    wrap.addEventListener("pointerdown", halt);
    wrap.addEventListener("mousedown", halt);
    wrap.addEventListener("click", halt);
    minus.addEventListener("click", (event) => {
      event.preventDefault();
      apply(Number(wrap.dataset.qty) - 1, true);
    });
    plus.addEventListener("click", (event) => {
      event.preventDefault();
      apply(Number(wrap.dataset.qty) + 1, true);
    });

    apply(value, false);
    wrap.append(minus, display, plus);
    return wrap;
  }

  function createQuantitySelect({ includePlaceholder, value, ariaLabel, className = "studio-card-qty" }) {
    const select = document.createElement("select");
    select.className = className;
    select.setAttribute("aria-label", ariaLabel);
    if (includePlaceholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "+";
      select.append(placeholder);
    }
    for (let quantity = STUDIO_MIN_QTY; quantity <= STUDIO_MAX_QTY; quantity += 1) {
      const option = document.createElement("option");
      option.value = String(quantity);
      option.textContent = String(quantity);
      select.append(option);
    }
    if (value === "" || value == null) {
      select.value = includePlaceholder ? "" : "1";
    } else {
      select.value = String(value);
    }
    return select;
  }

  function addCardToPlayground(key, quantity = null, { notify = true, updated = false, position = null } = {}) {
    const card = studio.cards[key] || tray.cards.find((item) => api.getCardKey(item) === key);
    if (!card) {
      return;
    }
    rememberCard(card);
    const alreadyHere = studio.cardKeys.includes(key);
    if (!alreadyHere) {
      studio.cardKeys.push(key);
    }
    const nextQty = clampStudioQty(quantity ?? getQuantity(key));
    studio.quantities[key] = nextQty;
    studio.selectedKey = key;
    if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
      studio.nextZ += 1;
      const maxX = Math.max(0, (boardEl?.clientWidth || 640) - STUDIO_CARD_WIDTH);
      studio.positions[key] = snapStudioPosition({
        x: Math.min(maxX, Math.max(0, position.x)),
        y: Math.max(0, position.y),
        z: studio.nextZ,
      });
    }
    persist();
    if (notify) {
      const verb = updated || alreadyHere ? "updated on" : "added to";
      showStudioToast(`${nextQty} ${card.name} ${verb} the playground`);
      markAdded(key, `${nextQty} added`);
    }
    renderBoard();
    renderTray();
    renderInspector();
  }

  function removeCardFromBoard(key) {
    studio.cardKeys = studio.cardKeys.filter((cardKey) => cardKey !== key);
    delete studio.positions[key];
    physics.delete(key);
    persist();
    renderBoard();
    renderTray();
    renderInspector();
  }

  function getQuantity(key) {
    return clampStudioQty(studio.quantities?.[key] ?? STUDIO_MIN_QTY);
  }

  function markAdded(key, text) {
    addedFeedback[key] = text;
    window.clearTimeout(addedFeedbackTimers[key]);
    addedFeedbackTimers[key] = window.setTimeout(() => {
      delete addedFeedback[key];
      renderTray();
      if (!studioPhysicsHeld()) {
        renderBoard();
      }
    }, STUDIO_ADDED_MS);
  }

  function showStudioToast(message) {
    const toast = document.querySelector("#studio-toast");
    if (!toast) {
      return;
    }
    document.body.append(toast);
    window.clearTimeout(toastTimer);
    toast.classList.remove("show");
    toast.hidden = true;
    toast.textContent = message;
    toast.hidden = false;
    void toast.offsetWidth;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
      toast.hidden = true;
    }, STUDIO_TOAST_MS);
  }

  function rememberCard(card) {
    studio.cards[api.getCardKey(card)] = card;
  }

  function persist() {
    const liveKeys = new Set(studio.cardKeys);
    for (const key of Object.keys(studio.quantities || {})) {
      if (!liveKeys.has(key)) {
        delete studio.quantities[key];
      }
    }
    for (const key of Object.keys(studio.positions || {})) {
      if (!liveKeys.has(key)) {
        delete studio.positions[key];
      }
    }
    const liveCards = {};
    for (const key of liveKeys) {
      if (studio.cards[key]) {
        liveCards[key] = studio.cards[key];
      }
    }
    if (studio.selectedKey && studio.cards[studio.selectedKey]) {
      liveCards[studio.selectedKey] = studio.cards[studio.selectedKey];
    }
    api.saveStoredJson(STUDIO_STORAGE_KEY, {
      cardKeys: studio.cardKeys,
      positions: studio.positions,
      nextZ: studio.nextZ,
      selectedKey: studio.selectedKey,
      cards: liveCards,
      quantities: studio.quantities,
      zoneSplit: studio.zoneSplit,
    });
    updateZoneCounts();
  }

  function boardCardCount() {
    return studio.cardKeys.reduce((total, key) => total + getQuantity(key), 0);
  }

  function formatStudioDecklist() {
    const buckets = {
      material: [],
      main: [],
      sideboard: [],
    };
    const counts = new Map();
    for (const key of studio.cardKeys) {
      const card = studio.cards[key];
      const name = String(card?.name || "").trim();
      if (!name) {
        continue;
      }
      const copies = getQuantity(key);
      const current = counts.get(name);
      if (current) {
        current.qty += copies;
      } else {
        counts.set(name, { qty: copies, card });
      }
    }
    for (const entry of counts.values()) {
      buckets[api.defaultDeckSection(entry.card)].push(entry);
    }

    const header = [`// Studio brew`, `// Built with AdvGA Studio v${api.appVersion}`, ""].join("\n");
    const sections = [
      ["Material Deck", buckets.material],
      ["Main Deck", buckets.main],
      ["Sideboard", buckets.sideboard],
    ]
      .filter(([, cards]) => cards.length > 0)
      .map(([title, cards]) => [`# ${title}`, "", ...cards.map((entry) => `${entry.qty} ${entry.card.name}`)].join("\n"));
    return `${header}${sections.join("\n\n")}`.trim() + "\n";
  }

  function serializeStudioShare() {
    return {
      v: 1,
      split: studio.zoneSplit,
      cards: studio.cardKeys.map((key) => {
        const card = studio.cards[key];
        const pos = studio.positions[key] || {};
        return {
          n: card?.name || "",
          q: getQuantity(key),
          x: pos.x,
          y: pos.y,
          z: pos.z,
        };
      }).filter((entry) => entry.n),
    };
  }

  function clearStudioShareHash() {
    const next = new URL(window.location.href);
    next.hash = "";
    next.searchParams.delete("d");
    next.searchParams.delete("deck");
    history.replaceState(null, "", next);
  }

  async function shareStudioBrew(button) {
    if (boardCardCount() === 0) {
      window.alert("Add cards to the playground before sharing.");
      return;
    }
    if (typeof api.encodeDeckSharePayload !== "function" || typeof api.buildDeckShareUrl !== "function") {
      window.alert("Sharing is not available.");
      return;
    }

    let url = "";
    try {
      const payload = await api.encodeDeckSharePayload(JSON.stringify(serializeStudioShare()));
      url = api.buildDeckShareUrl(api.studioPageUrl, payload);
    } catch (error) {
      console.error(error);
      window.alert("Could not build a share link.");
      return;
    }

    const original = button?.textContent || "Share";
    try {
      await navigator.clipboard.writeText(url);
      if (button) {
        button.textContent = "Link copied";
      }
      showStudioToast("Share link copied");
    } catch {
      window.prompt("Copy this Studio link", url);
      if (button) {
        button.textContent = "Link copied";
      }
      showStudioToast("Share link ready to copy");
    } finally {
      window.setTimeout(() => {
        if (button) {
          button.textContent = original;
        }
      }, 1800);
    }
  }

  async function applyStudioShareEntries(entries) {
    const nextKeys = [];
    const nextCards = {};
    const nextQuantities = {};
    const nextPositions = {};
    let nextZ = 1;
    let loaded = 0;

    for (const entry of entries) {
      const name = String(entry.n || entry.name || "").trim();
      if (!name) {
        continue;
      }
      const card = await api.lookupCardByName(name);
      if (!card) {
        continue;
      }
      const key = api.getCardKey(card);
      rememberCard(card);
      nextCards[key] = card;
      if (!nextKeys.includes(key)) {
        nextKeys.push(key);
      }
      nextQuantities[key] = clampStudioQty((nextQuantities[key] || 0) + (entry.q || entry.quantity || STUDIO_MIN_QTY));
      const x = Number(entry.x);
      const y = Number(entry.y);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const z = Number.isFinite(Number(entry.z)) ? Number(entry.z) : nextZ;
        nextPositions[key] = { x, y, z };
        nextZ = Math.max(nextZ, z + 1);
      }
      loaded += 1;
    }

    if (loaded === 0) {
      return false;
    }

    studio.cardKeys = nextKeys;
    studio.cards = nextCards;
    studio.quantities = nextQuantities;
    studio.positions = nextPositions;
    studio.nextZ = nextZ;
    studio.selectedKey = nextKeys[0] || "";
    physics.clear();
    persist();
    renderBoard();
    renderInspector();
    if (Object.keys(nextPositions).length === 0) {
      window.requestAnimationFrame(() => organizeStudioBoard());
    }
    return true;
  }

  async function applyStudioShareText(text) {
    const raw = String(text || "").trim();
    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && Array.isArray(parsed.cards)) {
        if (Number.isFinite(Number(parsed.split))) {
          studio.zoneSplit = clampStudioZoneSplit(parsed.split);
          applyZoneSplit();
        }
        return applyStudioShareEntries(parsed.cards);
      }
    } catch {
      // Decklist text from Try it / Copy list.
    }

    if (typeof api.parseDeckImport !== "function") {
      return false;
    }
    const parsed = api.parseDeckImport(raw);
    return applyStudioShareEntries(
      (parsed.entries || []).map((entry) => ({
        n: entry.name,
        q: entry.quantity,
      })),
    );
  }

  async function loadSharedStudioBrew() {
    const raw = api.readDeckSharePayload?.();
    if (!raw || typeof api.decodeDeckSharePayload !== "function" || typeof api.lookupCardByName !== "function") {
      return;
    }
    showStudioToast("Loading shared brew…");
    try {
      const text = await api.decodeDeckSharePayload(raw);
      const loaded = await applyStudioShareText(text);
      if (!loaded) {
        window.alert("Could not load the shared brew from this link.");
        return;
      }
      clearStudioShareHash();
      showStudioToast("Shared brew loaded");
    } catch (error) {
      console.error(error);
      window.alert("Could not load the shared brew from this link.");
    }
  }

  async function copyStudioDecklist(button) {
    if (boardCardCount() === 0) {
      window.alert("Add cards to the playground before exporting a decklist.");
      return;
    }
    const text = formatStudioDecklist();
    const original = button?.textContent || "Copy decklist";
    try {
      await navigator.clipboard.writeText(text);
      if (button) {
        button.textContent = "Copied. Ready to paste.";
      }
    } catch {
      window.prompt("Copy this decklist", text);
      if (button) {
        button.textContent = "Copied. Ready to paste.";
      }
    } finally {
      window.setTimeout(() => {
        if (button) {
          button.textContent = original;
        }
      }, 1800);
    }
  }

  function studioBoardToDeckCards() {
    const merged = new Map();
    for (const key of studio.cardKeys) {
      const card = studio.cards[key];
      if (!card) {
        continue;
      }
      const section = api.defaultDeckSection(card);
      const copies = getQuantity(key);
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += copies;
        continue;
      }
      merged.set(key, {
        key,
        name: card.name,
        image: api.resolveCardImage(card) || "",
        line: api.formatCardLine(card),
        quantity: copies,
        section,
        types: Array.isArray(card.types) ? card.types : [],
        subtypes: Array.isArray(card.subtypes) ? card.subtypes : [],
        level: card.level ?? null,
        costType: card.cost?.type || card.costType || "",
      });
    }
    return [...merged.values()].map((card) => ({
      ...card,
      quantity: card.section === "material" ? Math.min(1, card.quantity) : Math.min(4, card.quantity),
    }));
  }

  function openStudioTryIt() {
    if (boardCardCount() === 0) {
      window.alert("Add cards to the playground before opening Try it.");
      return;
    }
    const cards = studioBoardToDeckCards();
    const mainCount = cards
      .filter((card) => card.section === "main")
      .reduce((total, card) => total + card.quantity, 0);
    if (mainCount === 0) {
      window.alert("Add a Main Deck card to the playground so Try it has something to draw.");
      return;
    }
    if (typeof api.writeDeckForTryIt === "function") {
      api.writeDeckForTryIt(cards, "Studio brew");
      return;
    }
    window.location.assign(api.tryItUrl);
  }

  function downloadStudioDecklist() {
    if (boardCardCount() === 0) {
      window.alert("Add cards to the playground before exporting a decklist.");
      return;
    }
    const text = formatStudioDecklist();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "studio-brew.txt";
    link.click();
    URL.revokeObjectURL(url);
  }
}

function loadStudioState() {
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem(STUDIO_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  })();
  const cardKeys = flattenStudioCardKeys(stored);
  const liveKeys = new Set(cardKeys);
  const quantities = {};
  const storedQuantities = stored.quantities && typeof stored.quantities === "object" ? stored.quantities : {};
  for (const key of liveKeys) {
    quantities[key] = clampStudioQty(storedQuantities[key] ?? STUDIO_MIN_QTY);
  }
  const positions = {};
  const storedPositions = stored.positions && typeof stored.positions === "object" ? stored.positions : {};
  let nextZ = Number.isFinite(stored.nextZ) ? stored.nextZ : 1;
  for (const key of liveKeys) {
    const pos = storedPositions[key];
    if (pos && Number.isFinite(Number(pos.x)) && Number.isFinite(Number(pos.y))) {
      const z = Number.isFinite(Number(pos.z)) ? Number(pos.z) : nextZ;
      positions[key] = { x: Number(pos.x), y: Number(pos.y), z };
      nextZ = Math.max(nextZ, z + 1);
    }
  }
  return {
    cardKeys,
    positions,
    nextZ,
    cards: stored.cards && typeof stored.cards === "object" ? stored.cards : {},
    selectedKey: String(stored.selectedKey || ""),
    quantities,
    zoneSplit: clampStudioZoneSplit(stored.zoneSplit ?? 0.5),
  };
}

function flattenStudioCardKeys(stored) {
  const seen = new Set();
  const keys = [];
  const addKey = (value) => {
    const key = String(value || "");
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    keys.push(key);
  };
  if (Array.isArray(stored.cardKeys)) {
    stored.cardKeys.forEach(addKey);
  }
  if (keys.length === 0 && Array.isArray(stored.groups)) {
    for (const group of stored.groups) {
      const groupKeys = Array.isArray(group?.cardKeys) ? group.cardKeys : [];
      groupKeys.forEach(addKey);
    }
  }
  return keys;
}

function formatStudioStat(value) {
  if (value == null || value === "") {
    return "—";
  }
  if (Number(value) === -1 || String(value).toUpperCase() === "X") {
    return "X";
  }
  return String(value);
}

function getStudioCostStat(card) {
  if (card.cost_memory != null) {
    return { value: formatStudioStat(card.cost_memory), label: "Memory" };
  }
  if (card.cost_reserve != null) {
    return { value: formatStudioStat(card.cost_reserve), label: "Cost" };
  }
  const cost = card.cost;
  if (cost && cost.type && cost.type !== "none" && cost.value != null) {
    const isMemory = String(cost.type).toLowerCase() === "memory";
    return { value: formatStudioStat(cost.value), label: isMemory ? "Memory" : "Cost" };
  }
  return { value: "—", label: "Cost" };
}

function createStudioStat(label, value) {
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

function getEffectText(card) {
  return (
    [
      card.effect_raw,
      card.effect,
      card.edition?.effect_raw,
      ...(card.result_editions || []).map((edition) => edition.effect_raw),
      ...(card.editions || []).map((edition) => edition.effect_raw),
    ]
      .filter(Boolean)
      .find((text) => String(text).trim()) || ""
  );
}
