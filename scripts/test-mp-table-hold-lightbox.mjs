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
  await page.waitForSelector('[data-mp-seat="a"] [data-oh-card]', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 400));

  const card = await page.$('[data-mp-seat="a"] [data-oh-card]');
  const box = await card.boundingBox();
  if (!box) {
    throw new Error("No card box");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 1100));
  await page.mouse.up();

  await page.waitForSelector("[data-oh-card-preview].is-visible", { timeout: 3000 });
  const preview = await page.evaluate(() => {
    const el = document.querySelector("[data-oh-card-preview]");
    return {
      visible: el?.classList.contains("is-visible") || false,
      caption: el?.querySelector(".opening-hand-card-preview-caption")?.textContent || "",
      hasImage: Boolean(el?.querySelector("img")?.getAttribute("src")),
      version: document.querySelector(".app-version")?.textContent || "",
    };
  });
  console.log(JSON.stringify(preview, null, 2));
  await page.screenshot({
    path: "/opt/cursor/artifacts/screenshots/mp-table-hold-lightbox.png",
    fullPage: true,
  });

  if (!preview.visible || !preview.hasImage || !preview.version.includes("0.87")) {
    process.exitCode = 1;
  } else {
    console.log("PASS");
  }
} finally {
  await browser.close();
}
