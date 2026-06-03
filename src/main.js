const API_BASE = "https://api.gatcg.com";
const PAGE_SIZE = 50;
const EXAMPLE_QUERY = "fire spells that target units";

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

const state = {
  cards: [],
  loading: false,
  options: FALLBACK_OPTIONS,
  page: 1,
  parsed: null,
  query: EXAMPLE_QUERY,
  reachedEnd: false,
  status: "Loading Grand Archive card terms...",
};

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero" aria-labelledby="app-title">
      <div>
        <p class="eyebrow">Grand Archive TCG</p>
        <h1 id="app-title">Natural language card finder</h1>
        <p class="hero-copy">
          Search by plain English. Try element, type, subtype, class, and effect text
          in one sentence.
        </p>
      </div>

      <form class="search-card" id="search-form">
        <label for="search-input">Search cards</label>
        <div class="search-row">
          <input
            id="search-input"
            name="query"
            autocomplete="off"
            spellcheck="true"
            value="${EXAMPLE_QUERY}"
            placeholder="fire spells that target units"
          />
          <button type="submit">Search</button>
        </div>
        <div class="quick-searches" aria-label="Example searches">
          <button type="button" data-example="water allies that draw a card">
            water allies that draw a card
          </button>
          <button type="button" data-example="mage attacks that deal damage">
            mage attacks that deal damage
          </button>
          <button type="button" data-example="wind cards with floating memory">
            wind cards with floating memory
          </button>
        </div>
      </form>
    </section>

    <section class="toolbar" aria-live="polite">
      <div>
        <p class="status" id="status"></p>
        <div class="chips" id="chips"></div>
      </div>
    </section>

    <section class="results-grid" id="results" aria-label="Search results"></section>

    <div class="actions">
      <button class="secondary hidden" type="button" id="load-more">Load more</button>
    </div>
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
      </div>
    </article>
  </dialog>
`;

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const statusEl = document.querySelector("#status");
const chipsEl = document.querySelector("#chips");
const resultsEl = document.querySelector("#results");
const loadMoreButton = document.querySelector("#load-more");
const lightbox = document.querySelector("#lightbox");
const closeLightboxButton = document.querySelector("#close-lightbox");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(input.value.trim(), { reset: true });
});

document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.example;
    runSearch(input.value, { reset: true });
  });
});

loadMoreButton.addEventListener("click", () => {
  if (!state.loading && !state.reachedEnd) {
    runSearch(state.query, { reset: false });
  }
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

loadOptions().then(() => {
  runSearch(EXAMPLE_QUERY, { reset: true });
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
      subtype: normalizeOptions(options.subtype, FALLBACK_OPTIONS.subtype),
      type: normalizeOptions(options.type, FALLBACK_OPTIONS.type),
    };
    state.status = "Ready.";
  } catch (error) {
    console.warn(error);
    state.status = "Using built-in terms because the API options could not be loaded.";
  }

  render();
}

async function runSearch(query, { reset }) {
  if (!query) {
    state.cards = [];
    state.parsed = null;
    state.query = "";
    state.status = "Enter a search such as “fire spells that target units”.";
    state.reachedEnd = true;
    render();
    return;
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
    const nextCards = visibleCards.length > 0 ? visibleCards : cards;
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
    sort: "name",
  });

  appendAll(params, "element", parsed.filters.element);
  appendAll(params, "type", parsed.filters.type);
  appendAll(params, "subtype", parsed.filters.subtype);
  appendAll(params, "class", parsed.filters.class);

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
      subtype: [],
      type: [],
    },
    matchedLabels: [],
    nameQuery: "",
    raw: query,
  };

  const consumedPhrases = [];
  for (const field of ["element", "type", "subtype", "class"]) {
    const matches = matchOptions(normalized, options[field] || [], field);
    parsed.filters[field] = matches.map((match) => match.value);
    parsed.matchedLabels.push(
      ...matches.map((match) => ({
        field,
        text: match.text,
        value: match.value,
      })),
    );
    consumedPhrases.push(...matches.flatMap((match) => match.phrases));
  }

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

  parsed.effectQuery = normalizeEffectQuery(parsed.effectQuery);
  return parsed;
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
  const phrases = new Set([text, value]);
  const aliases = OPTION_ALIASES[field]?.[option.value] || [];

  aliases.forEach((alias) => phrases.add(normalizeText(alias)));

  for (const phrase of [...phrases]) {
    if (phrase && !phrase.endsWith("s")) {
      phrases.add(`${phrase}s`);
    }
  }

  return [...phrases].filter(Boolean).sort((a, b) => b.length - a.length);
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

  return cleanRemainder(cueMatch[1], []);
}

function cleanRemainder(normalizedQuery, consumedPhrases) {
  let remainder = ` ${normalizedQuery} `;
  for (const phrase of consumedPhrases) {
    remainder = remainder.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, "g"), " ");
  }

  remainder = remainder
    .replace(
      /\b(cards?|element|elements|types?|subtypes?|classes?|effect|effects|text|that|which|where|whose|with|has|have|having|include|includes|including|contain|contains|containing|of|the|a|an|and|or|is|are|for|in|to|using|use)\b/g,
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
  return Object.values(parsed.filters).some((values) => values.length > 0);
}

function cardMatchesParsedQuery(card, parsed) {
  return (
    fieldMatches(card.elements, parsed.filters.element) &&
    fieldMatches(card.types, parsed.filters.type) &&
    fieldMatches(card.subtypes, parsed.filters.subtype) &&
    fieldMatches(card.classes, parsed.filters.class) &&
    effectMatches(card, parsed.effectQuery)
  );
}

function fieldMatches(cardValues = [], requiredValues = []) {
  if (requiredValues.length === 0) {
    return true;
  }

  const normalizedValues = new Set(cardValues.map((value) => String(value).toUpperCase()));
  return requiredValues.every((value) => normalizedValues.has(value));
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

function render() {
  statusEl.textContent = state.status;
  renderChips();
  renderCards();
  loadMoreButton.classList.toggle("hidden", state.reachedEnd || state.cards.length === 0);
  loadMoreButton.disabled = state.loading;
  loadMoreButton.textContent = state.loading ? "Loading..." : "Load more";
}

function renderChips() {
  chipsEl.replaceChildren();

  if (!state.parsed) {
    return;
  }

  for (const match of state.parsed.matchedLabels) {
    chipsEl.append(createChip(`${titleCase(match.field)}: ${match.text}`));
  }

  if (state.parsed.effectQuery) {
    chipsEl.append(createChip(`Effect: ${state.parsed.effectQuery}`));
  } else if (state.parsed.nameQuery) {
    chipsEl.append(createChip(`Name: ${state.parsed.nameQuery}`));
  }
}

function renderCards() {
  resultsEl.replaceChildren();

  if (state.loading && state.cards.length === 0) {
    resultsEl.append(createEmptyState("Searching the Grand Archive database..."));
    return;
  }

  if (!state.loading && state.cards.length === 0) {
    resultsEl.append(
      createEmptyState("No cards matched. Try fewer filters or a shorter effect phrase."),
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

  meta.append(name, line);
  button.append(imageWrap, meta);
  return button;
}

function createEmptyState(message) {
  const element = document.createElement("p");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function createChip(text) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = text;
  return chip;
}

function createPlaceholder(name) {
  const placeholder = document.createElement("span");
  placeholder.className = "placeholder-card";
  placeholder.textContent = name;
  return placeholder;
}

function openLightbox(card) {
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
  for (const field of ["element", "type", "subtype", "class"]) {
    if (parsed.filters[field].length > 0) {
      criteria.push(`${field} ${parsed.filters[field].join(", ")}`);
    }
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
  return new RegExp(`(^|\\s)${escapeRegex(phrase)}($|\\s)`).test(haystack);
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
