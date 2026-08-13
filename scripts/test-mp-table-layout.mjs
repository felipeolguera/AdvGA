import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  protocolTimeout: 120000,
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 1400 });
  await page.goto("http://127.0.0.1:5173/AdvGA/tryit.html?mpLayoutTest=1", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector('[data-mp-seat="a"]', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 500));

  const info = await page.evaluate(() => {
    const board = document.querySelector('[data-mp-seat="a"]');
    const field = board.querySelector("[data-oh-field]");
    const rect = field.getBoundingClientRect();
    const zones = {};
    for (const key of ["champion", "field", "memory", "graveyard", "banishment", "deck", "material", "hand"]) {
      const el = board.querySelector(`[data-oh-zone="${key}"]`);
      const r = el.getBoundingClientRect();
      zones[key] = {
        left: r.left - rect.left,
        top: r.top - rect.top,
        right: r.right - rect.left,
        bottom: r.bottom - rect.top,
      };
    }
    const cards = [...board.querySelectorAll("[data-oh-card]")].map((card) => {
      const left = Number.parseFloat(card.style.left) || 0;
      const top = Number.parseFloat(card.style.top) || 0;
      const cx = left + 48;
      const cy = top + 67;
      let zoneHit = "none";
      for (const [key, zone] of Object.entries(zones)) {
        if (cx >= zone.left && cx <= zone.right && cy >= zone.top && cy <= zone.bottom) {
          zoneHit = key;
        }
      }
      return {
        title: card.title || card.querySelector("img")?.alt || "",
        left,
        top,
        zoneHit,
        facedown: card.classList.contains("is-facedown"),
      };
    });
    const deckPile = board.querySelector("[data-oh-deck-pile]");
    const materialPile = board.querySelector("[data-oh-material-pile]");
    const deckLeft = Number.parseFloat(deckPile.style.left) || 0;
    const materialLeft = Number.parseFloat(materialPile.style.left) || 0;
    const deckCx = deckLeft + 48;
    const materialCx = materialLeft + 48;
    return {
      version: document.querySelector(".app-version")?.textContent,
      width: field.clientWidth,
      cardCount: cards.length,
      cards,
      deckInDeckZone: deckCx >= zones.deck.left && deckCx <= zones.deck.right,
      materialInMaterialZone:
        materialCx >= zones.material.left && materialCx <= zones.material.right,
      handCount: board.querySelector("[data-oh-hand-count]")?.textContent,
      damage: board.querySelector("[data-oh-damage-value]")?.textContent,
      zones,
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/mp-layout-test.png",
    fullPage: true,
  });

  const hits = Object.fromEntries(
    ["champion", "field", "memory", "hand", "graveyard", "banishment"].map((zone) => [
      zone,
      info.cards.filter((card) => card.zoneHit === zone).length,
    ]),
  );
  const handFacedown = info.cards
    .filter((card) => card.zoneHit === "hand")
    .every((card) => card.facedown);
  const ok =
    hits.champion >= 2 &&
    hits.field >= 2 &&
    hits.memory >= 3 &&
    hits.hand >= 2 &&
    handFacedown &&
    hits.graveyard >= 1 &&
    hits.banishment >= 1 &&
    info.deckInDeckZone &&
    info.materialInMaterialZone &&
    info.handCount === "2";

  console.log("hits", hits);
  console.log("handFacedown", handFacedown);
  console.log("PASS", ok);
  if (!ok) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
