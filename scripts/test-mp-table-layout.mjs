import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: "/usr/local/bin/google-chrome",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  protocolTimeout: 120000,
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:5173/AdvGA/tryit.html?mpLayoutTest=1", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await page.waitForSelector("[data-mp-dual]", { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 500));

  const info = await page.evaluate(() => {
    const dual = document.querySelector("[data-mp-dual]");
    const selfBoard = document.querySelector(
      "[data-mp-self-mount] [data-opening-hand-board]",
    );
    const oppBoard = document.querySelector(
      "[data-mp-opponent-mount] [data-opening-hand-board]",
    );
    const headerTitle = document.querySelector(".tryit-chrome-full h1");
    const headerHidden = Boolean(
      document.querySelector(".tryit-page.is-mp-dual") &&
        headerTitle &&
        getComputedStyle(headerTitle.closest(".tryit-chrome-full")).display === "none",
    );
    return {
      version: document.querySelector(".app-version")?.textContent,
      hasDual: Boolean(dual),
      selfSeat: selfBoard?.dataset.mpSeat || null,
      oppSeat: oppBoard?.dataset.mpSeat || null,
      oppFacedownHands: (() => {
        const cards = [...(oppBoard?.querySelectorAll("[data-oh-card]") || [])];
        const hands = cards.filter((card) =>
          String(card.title || "").toLowerCase().includes("reveal"),
        );
        return hands.length > 0 && hands.every((card) => card.classList.contains("is-facedown"));
      })(),
      selfDamage: selfBoard?.querySelector("[data-oh-damage-value]")?.textContent,
      oppDamage: oppBoard?.querySelector("[data-oh-damage-value]")?.textContent,
      headerHidden,
      opponentRotated: Boolean(document.querySelector(".mp-dual-opponent")),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/mp-dual-portrait-test.png",
    fullPage: true,
  });

  const pass =
    info.hasDual &&
    info.selfSeat === "a" &&
    info.oppSeat === "b" &&
    info.headerHidden &&
    info.opponentRotated &&
    info.selfDamage === "2" &&
    info.oppDamage === "4" &&
    info.oppFacedownHands;

  console.log("PASS", pass);
  if (!pass) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
