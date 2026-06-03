# AdvGA

A Grand Archive TCG card finder for players who want to search with natural
English. The app uses the official Grand Archive API and translates queries like
`fire spells that target units` into element, subtype, and effect-text filters.

## Features

- Natural-language search for elements, card types, subtypes, classes, and effect
  text.
- Responsive card grid populated from live Grand Archive card data.
- Click any card to open a lightbox with a larger image, print details, stats,
  and effect text.

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

