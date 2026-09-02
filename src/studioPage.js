const STUDIO_STORAGE_KEY = "advga.studio";
const DEFAULT_GROUPS = [
  { id: "engine", name: "Engine" },
  { id: "wincon", name: "Wincon" },
  { id: "maybe", name: "Maybe / Cuts" },
];
const STUDIO_MIN_QTY = 1;
const STUDIO_MAX_QTY = 4;
const STUDIO_TOAST_MS = 2400;
const STUDIO_ADDED_MS = 2200;

function clampStudioQty(value) {
  const quantity = Math.round(Number(value));
  if (!Number.isFinite(quantity) || quantity < STUDIO_MIN_QTY) {
    return STUDIO_MIN_QTY;
  }
  return Math.min(STUDIO_MAX_QTY, quantity);
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
        <button class="secondary compact" type="button" id="studio-add-group">Add group</button>
        <button class="ghost compact" type="button" id="studio-copy-decklist">Copy list</button>
        <button class="ghost compact" type="button" id="studio-download-decklist">Download</button>
        <button class="ghost compact" type="button" id="studio-clear-board">Clear</button>
        <a class="ghost compact" href="${builderUrl}">Builder</a>
      </nav>
    </header>

    <aside class="studio-inspector is-empty" id="studio-inspector" aria-label="Spotlight"></aside>
    <div class="studio-dock">
      <div class="studio-dock-row">
        <div class="studio-group-tabs" id="studio-group-tabs" role="tablist" aria-label="Deck groups"></div>
        <form class="studio-search" id="studio-search-form">
          <label class="studio-search-label" for="studio-search-input">Search cards</label>
          <div class="studio-search-bar">
            <div class="search-row studio-search-row">
              <div class="search-input-wrap">
                <input
                  id="studio-search-input"
                  name="query"
                  autocomplete="off"
                  spellcheck="true"
                  placeholder="Search a card"
                />
              </div>
              <button type="button" class="secondary" id="toggle-search-filters" aria-expanded="false" aria-controls="search-filters">
                Filters
              </button>
              <button type="submit">Search</button>
            </div>
            <div class="studio-examples" aria-label="Example searches">
              <button type="button" data-studio-example="harmony in PRD">harmony in PRD</button>
              <button type="button" data-studio-example="melody in PRD">melody in PRD</button>
              <button type="button" data-studio-example="unique allies in PRD">unique allies</button>
            </div>
          </div>
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
      </div>
      <section class="studio-board-panel" aria-label="Deck strip">
        <div class="studio-board" id="studio-board"></div>
      </section>
      <p class="hint studio-search-status" id="studio-search-status">Search, then click a card for the spotlight.</p>
      <div class="studio-carousel is-empty" id="studio-carousel">
        <button type="button" class="studio-carousel-nav" id="studio-carousel-prev" aria-label="Previous search results">‹</button>
        <div class="studio-tray" id="studio-tray" tabindex="0" aria-label="Search results carousel"></div>
        <button type="button" class="studio-carousel-nav" id="studio-carousel-next" aria-label="Next search results">›</button>
      </div>
      <div class="studio-carousel-meta">
        <p class="studio-carousel-index" id="studio-carousel-index" hidden></p>
        <button class="ghost compact hidden" type="button" id="studio-load-more">Load more</button>
      </div>
    </div>
  </main>
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
  const tabsEl = document.querySelector("#studio-group-tabs");
  const inspectorEl = document.querySelector("#studio-inspector");
  const boardCountEl = document.querySelector("#studio-board-count");
  const toggleFiltersButton = document.querySelector("#toggle-search-filters");
  const searchFiltersEl = document.querySelector("#search-filters");
  const applyFiltersButton = document.querySelector("#apply-search-filters");
  const clearFiltersButton = document.querySelector("#clear-search-filters");

  api.bindQuickFilterMultiSelects();
  api.updateSearchFiltersVisibility?.();

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    api.closeAllMultiSelects();
    void runSearch(searchInput.value.trim(), { reset: true });
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
    void runSearch(searchInput.value.trim(), { reset: true });
  });

  document.querySelectorAll("[data-studio-example]").forEach((button) => {
    button.addEventListener("click", () => {
      searchInput.value = button.dataset.studioExample || "";
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
  window.addEventListener("resize", () => updateCarouselUi());

  document.querySelector("#studio-try-it")?.addEventListener("click", () => {
    openStudioTryIt();
  });

  document.querySelector("#studio-add-group")?.addEventListener("click", () => {
    const name = window.prompt("Group name", "New group");
    if (!name?.trim()) {
      return;
    }
    const id = `group-${Date.now()}`;
    studio.groups.push({ id, name: name.trim(), cardKeys: [] });
    studio.activeGroupId = id;
    persist();
    renderBoard();
  });

  document.querySelector("#studio-copy-decklist")?.addEventListener("click", (event) => {
    void copyStudioDecklist(event.currentTarget);
  });
  document.querySelector("#studio-download-decklist")?.addEventListener("click", () => {
    downloadStudioDecklist();
  });

  document.querySelector("#studio-clear-board")?.addEventListener("click", () => {
    if (!window.confirm("Clear every pile on the playground?")) {
      return;
    }
    studio.groups = DEFAULT_GROUPS.map((group) => ({ ...group, cardKeys: [] }));
    studio.cards = {};
    studio.quantities = {};
    studio.selectedKey = "";
    studio.activeGroupId = studio.groups[0].id;
    persist();
    renderBoard();
    renderInspector();
  });

  boardEl?.addEventListener("dragover", (event) => {
    const pile = event.target.closest("[data-studio-pile]");
    if (!pile) {
      return;
    }
    event.preventDefault();
    pile.classList.add("is-drop-target");
  });
  boardEl?.addEventListener("dragleave", (event) => {
    event.target.closest("[data-studio-pile]")?.classList.remove("is-drop-target");
  });
  boardEl?.addEventListener("drop", (event) => {
    const pile = event.target.closest("[data-studio-pile]");
    pile?.classList.remove("is-drop-target");
    const key = event.dataTransfer?.getData("text/plain");
    if (!pile || !key) {
      return;
    }
    event.preventDefault();
    addCardToGroup(key, pile.dataset.studioPile);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
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
      statusEl.textContent = "Search to fill the carousel, then pick 1–4 to add a card to the selected pile.";
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
        ? `${tray.cards.length}${totalLabel} in the rack · click for spotlight, pick 1–4 to add`
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
    if (trayEl.scrollLeft + trayEl.clientWidth >= trayEl.scrollWidth - 120) {
      void runSearch(tray.query, { reset: false });
    }
  }

  function groupQuantity(group) {
    return group.cardKeys.reduce((total, key) => total + getQuantity(key), 0);
  }

  function renderBoard() {
    boardEl.replaceChildren();
    tabsEl?.replaceChildren();
    let total = 0;
    const tabsHost = tabsEl || boardEl;

    let active = studio.groups.find((group) => group.id === studio.activeGroupId) || studio.groups[0];
    for (const group of studio.groups) {
      const pileCount = groupQuantity(group);
      total += pileCount;
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "studio-group-tab";
      tab.classList.toggle("is-active", group.id === studio.activeGroupId);
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", group.id === studio.activeGroupId ? "true" : "false");
      tab.textContent = `${group.name} ${pileCount}`;
      tab.addEventListener("click", () => selectGroup(group.id));
      tabsHost.append(tab);
    }

    if (!active) {
      boardCountEl.textContent = "0 cards";
      return;
    }

    const tools = document.createElement("div");
    tools.className = "studio-group-tools";
    const title = document.createElement("button");
    title.type = "button";
    title.className = "studio-pile-title";
    title.textContent = active.name;
    title.title = "Double-click to rename";
    title.addEventListener("dblclick", (event) => {
      event.preventDefault();
      startRenameGroup(active);
    });
    const rename = document.createElement("button");
    rename.type = "button";
    rename.className = "ghost compact";
    rename.textContent = "Rename";
    rename.setAttribute("aria-label", `Rename ${active.name}`);
    rename.addEventListener("click", () => startRenameGroup(active));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost compact";
    remove.textContent = "Remove";
    remove.hidden = studio.groups.length <= 1;
    remove.addEventListener("click", () => {
      if (!window.confirm(`Remove group “${active.name}”?`)) {
        return;
      }
      studio.groups = studio.groups.filter((item) => item.id !== active.id);
      studio.activeGroupId = studio.groups[0]?.id || "";
      persist();
      renderBoard();
      renderInspector();
    });
    tools.append(title, rename, remove);
    tabsHost.append(tools);

    const pile = document.createElement("section");
    pile.className = "studio-pile is-active";
    pile.dataset.studioPile = active.id;
    const cards = document.createElement("div");
    cards.className = "studio-pile-cards";
    for (const key of active.cardKeys) {
      const card = studio.cards[key];
      if (card) {
        cards.append(createMiniCard(card, { groupId: active.id }));
      }
    }
    if (active.cardKeys.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint studio-pile-empty";
      empty.textContent = "Empty · add from search";
      cards.append(empty);
    }
    pile.append(cards);
    boardEl.append(pile);
    boardCountEl.textContent = total === 1 ? "1 card" : `${total} cards`;
  }

  function selectGroup(groupId) {
    if (studio.activeGroupId === groupId) {
      return;
    }
    studio.activeGroupId = groupId;
    persist();
    renderBoard();
    renderInspector();
  }

  function startRenameGroup(group) {
    const title =
      tabsEl?.querySelector(".studio-pile-title") ||
      boardEl.querySelector(".studio-pile-title");
    if (!title || title.tagName === "INPUT") {
      return;
    }
    const input = document.createElement("input");
    input.className = "studio-pile-name-input";
    input.type = "text";
    input.value = group.name;
    input.maxLength = 32;
    input.setAttribute("aria-label", "Group name");
    let finished = false;
    const finish = (save) => {
      if (finished) {
        return;
      }
      finished = true;
      const next = input.value.trim();
      if (save && next) {
        group.name = next;
        persist();
      }
      renderBoard();
      renderInspector();
    };
    input.addEventListener("click", (event) => event.stopPropagation());
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
    title.replaceWith(input);
    input.focus();
    input.select();
  }

  function renderInspector() {
    const card = studio.cards[studio.selectedKey];
    inspectorEl.replaceChildren();
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

    const figure = document.createElement("figure");
    figure.className = "studio-inspector-art";
    const imageUrl = api.getImageUrl(api.resolveCardImage(card) || api.getPrimaryEdition(card)?.image);
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = card.name;
      figure.append(image);
    } else {
      figure.append(api.createPlaceholder(card.name));
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
    const onBoard = studio.groups.some((group) => group.cardKeys.includes(api.getCardKey(card)));
    const qtyLabel = document.createElement("label");
    qtyLabel.className = "studio-inspector-qty";
    qtyLabel.append("Qty");
    const qtySelect = createQuantitySelect({
      includePlaceholder: !onBoard,
      value: onBoard ? getQuantity(api.getCardKey(card)) : "",
      ariaLabel: `Copies of ${card.name}`,
      className: "studio-inspector-qty-select",
    });
    qtyLabel.append(qtySelect);
    actions.append(qtyLabel);
    if (!onBoard) {
      const add = document.createElement("button");
      add.type = "button";
      add.textContent = `Add to ${activeGroup()?.name || "lane"}`;
      add.addEventListener("click", () => {
        addCardToGroup(api.getCardKey(card), studio.activeGroupId, Number(qtySelect.value) || 1);
      });
      actions.append(add);
    } else {
      qtySelect.addEventListener("change", () => {
        addCardToGroup(api.getCardKey(card), findGroupIdForCard(api.getCardKey(card)), Number(qtySelect.value), {
          notify: true,
          updated: true,
        });
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => removeCardFromBoard(api.getCardKey(card)));
      actions.append(remove);
    }
    copy.append(actions);
    inspectorEl.append(figure, copy);
  }

  function createMiniCard(card, { inTray = false, groupId = "" } = {}) {
    const key = api.getCardKey(card);
    const item = document.createElement("article");
    item.className = "studio-card";
    item.classList.toggle("studio-card-in-tray", inTray);
    item.classList.toggle("is-selected", key === studio.selectedKey);
    item.draggable = true;
    item.title = card.name;
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", key);
      event.dataTransfer.effectAllowed = "copyMove";
    });

    const frame = document.createElement("div");
    frame.className = "studio-card-frame";

    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "studio-card-image";
    imageButton.setAttribute("aria-label", `Inspect ${card.name}`);
    imageButton.addEventListener("click", () => {
      studio.selectedKey = key;
      rememberCard(card);
      persist();
      renderBoard();
      renderTray();
      renderInspector();
    });
    if (inTray) {
      imageButton.addEventListener("dblclick", (event) => {
        event.preventDefault();
        rememberCard(card);
        addCardToGroup(key, studio.activeGroupId, 1);
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
        ariaLabel: `Add ${card.name} to ${activeGroup()?.name || "pile"}`,
      });
      qtySelect.addEventListener("click", (event) => event.stopPropagation());
      qtySelect.addEventListener("mousedown", (event) => event.stopPropagation());
      qtySelect.addEventListener("change", (event) => {
        event.stopPropagation();
        const amount = Number(qtySelect.value);
        if (!amount) {
          return;
        }
        rememberCard(card);
        addCardToGroup(key, studio.activeGroupId, amount);
      });
      frame.append(qtySelect);
    } else if (groupId) {
      const qtySelect = createQuantitySelect({
        includePlaceholder: false,
        value: getQuantity(key),
        ariaLabel: `Copies of ${card.name}`,
      });
      qtySelect.addEventListener("click", (event) => event.stopPropagation());
      qtySelect.addEventListener("mousedown", (event) => event.stopPropagation());
      qtySelect.addEventListener("change", (event) => {
        event.stopPropagation();
        addCardToGroup(key, groupId, Number(qtySelect.value), { notify: true, updated: true });
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "studio-card-remove";
      remove.setAttribute("aria-label", `Remove ${card.name}`);
      remove.textContent = "×";
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        removeCardFromGroup(key, groupId);
      });
      frame.append(qtySelect, remove);
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

    return item;
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

  function addCardToGroup(key, groupId, quantity = null, { notify = true, updated = false } = {}) {
    const card = studio.cards[key] || tray.cards.find((item) => api.getCardKey(item) === key);
    if (!card) {
      return;
    }
    rememberCard(card);
    const group = studio.groups.find((item) => item.id === groupId) || activeGroup();
    if (!group) {
      return;
    }
    const alreadyHere = group.cardKeys.includes(key);
    studio.groups.forEach((item) => {
      item.cardKeys = item.cardKeys.filter((cardKey) => cardKey !== key);
    });
    group.cardKeys.push(key);
    const nextQty = clampStudioQty(quantity ?? getQuantity(key));
    studio.quantities[key] = nextQty;
    studio.activeGroupId = group.id;
    studio.selectedKey = key;
    persist();
    if (notify) {
      const verb = updated || alreadyHere ? "updated to" : "added to";
      showStudioToast(`${nextQty} ${card.name} ${verb} ${group.name}`);
      markAdded(key, `${nextQty} added`);
    }
    renderBoard();
    renderTray();
    renderInspector();
  }

  function removeCardFromGroup(key, groupId) {
    const group = studio.groups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }
    group.cardKeys = group.cardKeys.filter((cardKey) => cardKey !== key);
    persist();
    renderBoard();
    renderTray();
    renderInspector();
  }

  function removeCardFromBoard(key) {
    studio.groups.forEach((group) => {
      group.cardKeys = group.cardKeys.filter((cardKey) => cardKey !== key);
    });
    persist();
    renderBoard();
    renderTray();
    renderInspector();
  }

  function getQuantity(key) {
    return clampStudioQty(studio.quantities?.[key] ?? STUDIO_MIN_QTY);
  }

  function findGroupIdForCard(key) {
    return studio.groups.find((group) => group.cardKeys.includes(key))?.id || "";
  }

  function markAdded(key, text) {
    addedFeedback[key] = text;
    window.clearTimeout(addedFeedbackTimers[key]);
    addedFeedbackTimers[key] = window.setTimeout(() => {
      delete addedFeedback[key];
      renderTray();
      renderBoard();
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

  function activeGroup() {
    return studio.groups.find((group) => group.id === studio.activeGroupId) || studio.groups[0];
  }

  function persist() {
    const liveKeys = new Set(studio.groups.flatMap((group) => group.cardKeys));
    for (const key of Object.keys(studio.quantities || {})) {
      if (!liveKeys.has(key)) {
        delete studio.quantities[key];
      }
    }
    api.saveStoredJson(STUDIO_STORAGE_KEY, {
      groups: studio.groups,
      selectedKey: studio.selectedKey,
      activeGroupId: studio.activeGroupId,
      cards: studio.cards,
      quantities: studio.quantities,
    });
  }

  function boardCardCount() {
    return studio.groups.reduce((total, group) => total + groupQuantity(group), 0);
  }

  function formatStudioDecklist() {
    const buckets = {
      material: [],
      main: [],
      sideboard: [],
    };
    for (const group of studio.groups) {
      const counts = new Map();
      for (const key of group.cardKeys) {
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
      const sidePile = /maybe|cut|side/i.test(`${group.id} ${group.name}`);
      for (const entry of counts.values()) {
        const section = sidePile ? "sideboard" : api.defaultDeckSection(entry.card);
        buckets[section].push(entry);
      }
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

  async function copyStudioDecklist(button) {
    if (boardCardCount() === 0) {
      window.alert("Add cards to a pile before exporting a decklist.");
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
    for (const group of studio.groups) {
      const sidePile = /maybe|cut|side/i.test(`${group.id} ${group.name}`);
      for (const key of group.cardKeys) {
        const card = studio.cards[key];
        if (!card) {
          continue;
        }
        const section = sidePile ? "sideboard" : api.defaultDeckSection(card);
        const copies = getQuantity(key);
        const existing = merged.get(key);
        if (existing) {
          if (existing.section === "sideboard" && section !== "sideboard") {
            existing.section = section;
          }
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
    }
    return [...merged.values()].map((card) => ({
      ...card,
      quantity: card.section === "material" ? Math.min(1, card.quantity) : Math.min(4, card.quantity),
    }));
  }

  function openStudioTryIt() {
    if (boardCardCount() === 0) {
      window.alert("Add cards to a pile before opening Try it.");
      return;
    }
    const cards = studioBoardToDeckCards();
    const mainCount = cards
      .filter((card) => card.section === "main")
      .reduce((total, card) => total + card.quantity, 0);
    if (mainCount === 0) {
      window.alert("Add cards to a main pile (not only Maybe / Cuts) so Try it has a Main Deck.");
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
      window.alert("Add cards to a pile before exporting a decklist.");
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
  const groups = Array.isArray(stored.groups) && stored.groups.length
    ? stored.groups.map((group) => migrateStudioGroup(group))
    : DEFAULT_GROUPS.map((group) => ({ ...group, cardKeys: [] }));
  const liveKeys = new Set(groups.flatMap((group) => group.cardKeys));
  const quantities = {};
  const storedQuantities = stored.quantities && typeof stored.quantities === "object" ? stored.quantities : {};
  for (const key of liveKeys) {
    quantities[key] = clampStudioQty(storedQuantities[key] ?? STUDIO_MIN_QTY);
  }
  return {
    groups,
    cards: stored.cards && typeof stored.cards === "object" ? stored.cards : {},
    selectedKey: String(stored.selectedKey || ""),
    activeGroupId: migrateActiveGroupId(stored.activeGroupId, groups),
    quantities,
  };
}

function migrateStudioGroup(group) {
  let id = String(group.id || `group-${Math.random().toString(36).slice(2)}`);
  let name = String(group.name || "Group");
  if (id === "payoff" && /^payoff$/i.test(name.trim())) {
    id = "wincon";
    name = "Wincon";
  }
  return {
    id,
    name,
    cardKeys: Array.isArray(group.cardKeys) ? group.cardKeys.map(String) : [],
  };
}

function migrateActiveGroupId(storedId, groups) {
  let activeGroupId = String(storedId || groups[0]?.id || "");
  if (activeGroupId === "payoff" && groups.some((group) => group.id === "wincon") && !groups.some((group) => group.id === "payoff")) {
    activeGroupId = "wincon";
  }
  if (!groups.some((group) => group.id === activeGroupId)) {
    activeGroupId = groups[0]?.id || "";
  }
  return activeGroupId;
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
