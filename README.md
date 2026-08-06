# AdvGA

A Grand Archive TCG deck builder and natural-language card finder. Search the
official Grand Archive API with phrases like `fire spells that target units`,
add cards to Material, Main, and Sideboard sections, then validate and export
a constructed deck list.

## Features

- Natural-language search for elements, card types, subtypes, classes, sets,
  legality, speed, rarity, stats, costs, and effect text.
- Interchangeable phrase order such as `2 cost ally` and `ally that cost 2`.
- Parsed filter chips, search explanations, advanced filter controls, sorting,
  keyword helpers, recent searches, and shareable search URLs.
- Deck Builder with named decks, Material / Main / Sideboard sections, quantity
  controls, live constructed legality checks, and composition totals.
- Import pasted deck lists, copy export text, or download a `.txt` deck file.
- Responsive card grid with result badges, loading skeletons, lightbox details,
  and in-deck quantity indicators.
- Local browser storage so your current deck persists between sessions.

## Deck rules tracked

- Material deck: max 12 unique cards, at least one Level 0 champion
- Main deck: at least 60 cards, max 4 copies of a card
- Sideboard: max 15 cards and 15 points (Main cards 1 pt, Champion/Regalia 3 pts)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

The app can be served two ways:

- GitHub Pages from the repository root, because `index.html` uses relative
  `./src/...` asset paths.
- The included GitHub Actions workflow, which builds Vite and deploys the
  generated `dist` directory with the `/AdvGA/` base path.
