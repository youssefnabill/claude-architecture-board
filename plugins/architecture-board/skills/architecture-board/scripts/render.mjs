// Render an architecture-board HTML file:
//   <out>.pdf                 every page, each at its own CSS page size
//   <out>-page-N.png          one preview per page (for visual QA, or as deliverables)
//   <out>-flow-<id>.mmd       Mermaid source for every drawSequence() diagram
// and print layout warnings (text overflowing boxes, boxes outside the page).
// Invoked by render.sh, which provides AB_DEPS (node_modules dir) and AB_CHROME.
import { createRequire } from "module";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "url";

const [, , input, output] = process.argv;
const require = createRequire(resolve(process.env.AB_DEPS, "node_modules") + "/");
const { chromium } = require("playwright-core");

const browser = await chromium.launch(process.env.AB_CHROME ? { executablePath: process.env.AB_CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1800, height: 1300 } });
const consoleWarnings = [];
page.on("console", (m) => { if (["warning", "error"].includes(m.type())) consoleWarnings.push(m.text()); });
page.on("pageerror", (e) => consoleWarnings.push("JS error: " + e.message));

await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const base = output.replace(/\.pdf$/i, "");
await page.pdf({ path: output, preferCSSPageSize: true, printBackground: true });
console.log("PDF:", output);

const pages = await page.$$(".page");
for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${base}-page-${i + 1}.png` });
console.log(`PNGs: ${base}-page-1..${pages.length}.png`);

const flows = await page.evaluate(() => (window.__flows || []).map((f) => ({ id: f.id, mmd: window.toMermaid(f) })));
for (const f of flows) writeFileSync(`${base}-flow-${f.id}.mmd`, f.mmd);
if (flows.length) console.log(`Mermaid: ${flows.map((f) => `${base}-flow-${f.id}.mmd`).join(", ")}`);

const layout = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".page").forEach((pg, i) => {
    pg.querySelectorAll(".box").forEach((b) => {
      const name = (b.querySelector("h3,h4")?.textContent || b.textContent).trim().slice(0, 40);
      if (b.scrollHeight > b.clientHeight + 2 || b.scrollWidth > b.clientWidth + 2)
        out.push(`page ${i + 1}: text overflows box "${name}"`);
      if (b.offsetLeft + b.offsetWidth > pg.clientWidth + 1 || b.offsetTop + b.offsetHeight > pg.clientHeight + 1)
        out.push(`page ${i + 1}: box "${name}" extends past the page edge`);
    });
  });
  return out;
});
for (const w of [...layout, ...consoleWarnings]) console.log("WARNING:", w);
if (!layout.length && !consoleWarnings.length) console.log("Layout check: no overflow detected (still look at the PNGs).");
await browser.close();
