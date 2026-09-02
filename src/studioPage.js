const STUDIO_STORAGE_KEY = "advga.studio";
const DEFAULT_GROUPS = [
  { id: "engine", name: "Engine" },
  { id: "payoff", name: "Payoff" },
  { id: "maybe", name: "Maybe / Cuts" },
];

export function getStudioShellHtml({ appVersion, builderUrl }) {
  return `
  <p class="app-version" aria-label="App version">v${appVersion}</p>
  <main class="page-shell studio-page">
    <header class="panel studio-header">
      <div class="studio-header-copy">
        <p class="eyebrow">AdvGA Studio</p>
        <h1>Playground</h1>
      </div>
      <p class="hint studio-header-hint">Search, pile cards into groups, then click a card to read it. Built for brewing on camera.</p>
      <nav class="studio-header-nav">
        <a class="ghost compact" href="${builderUrl}">Deck builder</a>
        <button class="ghost compact" type="button" id="studio-clear-board">Clear board</button>
      </nav>
    </header>

    <section class="panel studio-search-panel">
      <form class="studio-search" id="studio-search-form">
        <label class="studio-search-label" for="studio-search-input">Search cards</label>
        <div class="search-row studio-search-row">
          <div class="search-input-wrap">
            <input
              id="studio-search-input"
              name="query"
              autocomplete="off"
              spellcheck="true"
              placeholder="harmony or melody in PRD"
            />
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
      <div class="studio-examples" aria-label="Example searches">
        <button type="button" data-studio-example="harmony in PRD">harmony in PRD</button>
        <button type="button" data-studio-example="melody in PRD">melody in PRD</button>
        <button type="button" data-studio-example="unique allies in PRD">unique allies in PRD</button>
      </div>
      <p class="hint studio-search-status" id="studio-search-status">Search to fill the tray, then add cards to a pile.</p>
      <div class="studio-tray" id="studio-tray" aria-label="Search results tray"></div>
      <div class="studio-tray-actions">
        <button class="ghost compact hidden" type="button" id="studio-load-more">Load more</button>
      </div>
    </section>

    <div class="studio-workspace">
      <section class="panel studio-board-panel" aria-label="Playground">
        <div class="studio-board-toolbar">
          <p class="studio-board-count" id="studio-board-count">Board 0</p>
          <button class="secondary compact" type="button" id="studio-add-group">Add group</button>
        </div>
        <div class="studio-board" id="studio-board"></div>
      </section>
      <aside class="panel studio-inspector" id="studio-inspector" aria-label="Card info"></aside>
    </div>
  </main>
  `;
}

export function bootStudioPage(api) {
  const studio = loadStudioState();
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
  const loadMoreButton = document.querySelector("#studio-load-more");
  const boardEl = document.querySelector("#studio-board");
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

  document.querySelector("#studio-clear-board")?.addEventListener("click", () => {
    if (!window.confirm("Clear every pile on the playground?")) {
      return;
    }
    studio.groups = DEFAULT_GROUPS.map((group) => ({ ...group, cardKeys: [] }));
    studio.cards = {};
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
      statusEl.textContent = "Search to fill the tray, then add cards to a pile.";
      renderTray();
      return;
    }

    if (reset) {
      tray.cards = [];
      tray.page = 1;
      tray.reachedEnd = false;
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
        ? `${tray.cards.length}${totalLabel} in the tray · click to inspect, + to pile`
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
    trayEl.replaceChildren();
    if (tray.loading && tray.cards.length === 0) {
      statusEl.textContent = "Searching cards...";
    }
    for (const card of tray.cards) {
      rememberCard(card);
      trayEl.append(createMiniCard(card, { inTray: true }));
    }
    loadMoreButton.classList.toggle("hidden", !tray.parsed || tray.reachedEnd);
    loadMoreButton.disabled = tray.loading;
    loadMoreButton.textContent = tray.loading ? "Loading..." : "Load more";
  }

  function renderBoard() {
    boardEl.replaceChildren();
    let total = 0;
    for (const group of studio.groups) {
      total += group.cardKeys.length;
      const pile = document.createElement("section");
      pile.className = "studio-pile";
      pile.dataset.studioPile = group.id;
      pile.classList.toggle("is-active", group.id === studio.activeGroupId);
      const header = document.createElement("header");
      header.className = "studio-pile-header";
      const title = document.createElement("button");
      title.type = "button";
      title.className = "studio-pile-title";
      title.textContent = `${group.name} (${group.cardKeys.length})`;
      title.addEventListener("click", () => {
        studio.activeGroupId = group.id;
        persist();
        renderBoard();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost compact";
      remove.textContent = "Remove";
      remove.hidden = studio.groups.length <= 1;
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        if (!window.confirm(`Remove group “${group.name}”?`)) {
          return;
        }
        studio.groups = studio.groups.filter((item) => item.id !== group.id);
        if (studio.activeGroupId === group.id) {
          studio.activeGroupId = studio.groups[0]?.id || "";
        }
        persist();
        renderBoard();
        renderInspector();
      });
      header.append(title, remove);
      const cards = document.createElement("div");
      cards.className = "studio-pile-cards";
      for (const key of group.cardKeys) {
        const card = studio.cards[key];
        if (card) {
          cards.append(createMiniCard(card, { groupId: group.id }));
        }
      }
      if (group.cardKeys.length === 0) {
        const empty = document.createElement("p");
        empty.className = "hint studio-pile-empty";
        empty.textContent = group.id === studio.activeGroupId
          ? "Selected pile · add from the tray"
          : "Empty pile";
        cards.append(empty);
      }
      pile.append(header, cards);
      boardEl.append(pile);
    }
    boardCountEl.textContent = `Board ${total}`;
  }

  function renderInspector() {
    const card = studio.cards[studio.selectedKey];
    inspectorEl.replaceChildren();
    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = "Card info";
    inspectorEl.append(heading);

    if (!card) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Click a card to show its art, type line, and effect here.";
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

    const line = document.createElement("p");
    line.className = "studio-inspector-line";
    line.textContent = [
      api.formatCardLine(card),
      api.formatCost(card.cost_memory || card.cost),
      api.getPrimaryEdition(card)?.set?.name || api.getPrimaryEdition(card)?.set?.prefix,
    ]
      .filter(Boolean)
      .join(" · ");

    const effect = document.createElement("p");
    effect.className = "studio-inspector-effect";
    const effectText = getEffectText(card).replace(/\s+\n/g, "\n").trim();
    effect.textContent = effectText || "No effect text on this printing.";

    inspectorEl.append(figure, name, line, effect);

    const shared = getSharedTags(card);
    if (shared.length) {
      const label = document.createElement("p");
      label.className = "studio-inspector-share-label";
      label.textContent = "Also shares on this board";
      const chips = document.createElement("div");
      chips.className = "studio-share-chips";
      for (const tag of shared) {
        const chip = document.createElement("span");
        chip.textContent = `${tag.label} · ${tag.count}`;
        chips.append(chip);
      }
      inspectorEl.append(label, chips);
    }

    const actions = document.createElement("div");
    actions.className = "studio-inspector-actions";
    const onBoard = studio.groups.some((group) => group.cardKeys.includes(api.getCardKey(card)));
    if (!onBoard) {
      const add = document.createElement("button");
      add.type = "button";
      add.textContent = `Add to ${activeGroup()?.name || "pile"}`;
      add.addEventListener("click", () => addCardToGroup(api.getCardKey(card), studio.activeGroupId));
      actions.append(add);
    } else {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "Remove from board";
      remove.addEventListener("click", () => removeCardFromBoard(api.getCardKey(card)));
      actions.append(remove);
    }
    inspectorEl.append(actions);
  }

  function createMiniCard(card, { inTray = false, groupId = "" } = {}) {
    const key = api.getCardKey(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "studio-card";
    button.classList.toggle("is-selected", key === studio.selectedKey);
    button.draggable = true;
    button.title = card.name;
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", key);
      event.dataTransfer.effectAllowed = "copyMove";
    });
    button.addEventListener("click", () => {
      studio.selectedKey = key;
      rememberCard(card);
      persist();
      renderBoard();
      renderTray();
      renderInspector();
    });
    if (inTray) {
      button.addEventListener("dblclick", (event) => {
        event.preventDefault();
        rememberCard(card);
        addCardToGroup(key, studio.activeGroupId);
      });
    }

    const imageUrl = api.getImageUrl(api.resolveCardImage(card) || api.getPrimaryEdition(card)?.image);
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = card.name;
      image.draggable = false;
      button.append(image);
    } else {
      button.append(api.createPlaceholder(card.name));
    }

    if (inTray) {
      const add = document.createElement("span");
      add.className = "studio-card-add";
      add.textContent = "+";
      add.title = `Add to ${activeGroup()?.name || "pile"}`;
      add.addEventListener("click", (event) => {
        event.stopPropagation();
        rememberCard(card);
        addCardToGroup(key, studio.activeGroupId);
      });
      button.append(add);
    } else if (groupId) {
      const remove = document.createElement("span");
      remove.className = "studio-card-remove";
      remove.textContent = "×";
      remove.title = "Remove from pile";
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        removeCardFromGroup(key, groupId);
      });
      button.append(remove);
    }

    return button;
  }

  function addCardToGroup(key, groupId) {
    const card = studio.cards[key] || tray.cards.find((item) => api.getCardKey(item) === key);
    if (!card) {
      return;
    }
    rememberCard(card);
    const group = studio.groups.find((item) => item.id === groupId) || activeGroup();
    if (!group) {
      return;
    }
    studio.groups.forEach((item) => {
      item.cardKeys = item.cardKeys.filter((cardKey) => cardKey !== key);
    });
    group.cardKeys.push(key);
    studio.activeGroupId = group.id;
    studio.selectedKey = key;
    persist();
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
    renderInspector();
  }

  function removeCardFromBoard(key) {
    studio.groups.forEach((group) => {
      group.cardKeys = group.cardKeys.filter((cardKey) => cardKey !== key);
    });
    persist();
    renderBoard();
    renderInspector();
  }

  function rememberCard(card) {
    studio.cards[api.getCardKey(card)] = card;
  }

  function activeGroup() {
    return studio.groups.find((group) => group.id === studio.activeGroupId) || studio.groups[0];
  }

  function getSharedTags(card) {
    const boardCards = studio.groups.flatMap((group) =>
      group.cardKeys.map((key) => studio.cards[key]).filter(Boolean),
    );
    const selectedKey = api.getCardKey(card);
    const counts = new Map();
    const add = (label) => {
      const key = String(label || "").trim();
      if (!key) {
        return;
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    };
    for (const other of boardCards) {
      if (api.getCardKey(other) === selectedKey) {
        continue;
      }
      intersect(card.subtypes, other.subtypes).forEach((value) => add(api.titleCase(value)));
      intersect(card.elements, other.elements).forEach((value) => add(api.titleCase(value)));
      intersect(card.types, other.types).forEach((value) => add(api.titleCase(value)));
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 8);
  }

  function persist() {
    api.saveStoredJson(STUDIO_STORAGE_KEY, {
      groups: studio.groups,
      selectedKey: studio.selectedKey,
      activeGroupId: studio.activeGroupId,
      cards: studio.cards,
    });
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
    ? stored.groups.map((group) => ({
        id: String(group.id || `group-${Math.random().toString(36).slice(2)}`),
        name: String(group.name || "Group"),
        cardKeys: Array.isArray(group.cardKeys) ? group.cardKeys.map(String) : [],
      }))
    : DEFAULT_GROUPS.map((group) => ({ ...group, cardKeys: [] }));
  return {
    groups,
    cards: stored.cards && typeof stored.cards === "object" ? stored.cards : {},
    selectedKey: String(stored.selectedKey || ""),
    activeGroupId: String(stored.activeGroupId || groups[0].id),
  };
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

function intersect(left = [], right = []) {
  const other = new Set((right || []).map((value) => String(value).toUpperCase()));
  return (left || []).filter((value) => other.has(String(value).toUpperCase()));
}
