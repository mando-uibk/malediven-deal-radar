import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadConfig, requireEnv } from "./config.js";
import { sendEmail } from "./email.js";
import { filterAndRank } from "./rank.js";
import { renderReport } from "./render.js";
import { searchAllAirports } from "./search.js";
import { renderSite } from "./site.js";
import { annotateWithHistory, loadState, saveState } from "./state.js";

async function loadOffers(config) {
  if (process.env.LOCAL_OFFERS_PATH || process.env.FIXTURE_PATH) {
    const path = process.env.LOCAL_OFFERS_PATH || process.env.FIXTURE_PATH;
    const fixture = JSON.parse(await readFile(path, "utf8"));
    const isDemo = Boolean(process.env.FIXTURE_PATH && !process.env.LOCAL_OFFERS_PATH);
    return {
      offers: fixture.offers || [],
      warnings: [
        ...(fixture.warnings || []),
        ...(isDemo ? ["Demo-Modus: Beispieldaten, keine Live-Suche."] : [])
      ],
      model: isDemo ? "fixture" : "Codex-Routine"
    };
  }
  requireEnv(["OPENAI_API_KEY"]);
  return searchAllAirports(config);
}

async function main() {
  const config = await loadConfig();
  const statePath = process.env.STATE_PATH || ".data/state.json";
  const reportPath = process.env.REPORT_PATH || "output/latest-report.html";
  const sitePath = process.env.SITE_PATH || "site/index.html";
  const generatedAt = new Date();

  const search = await loadOffers(config);
  const ranked = filterAndRank(search.offers, config);
  const state = await loadState(statePath);
  const offers = annotateWithHistory(ranked.offers, state, generatedAt);
  await saveState(statePath, state);

  const report = renderReport({ offers, config, warnings: search.warnings, generatedAt });
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report.html, "utf8");
  const site = renderSite({ offers, config, warnings: search.warnings, generatedAt });
  await mkdir(dirname(sitePath), { recursive: true });
  await writeFile(sitePath, site, "utf8");

  const send = process.env.SEND_EMAIL?.toLowerCase() === "true";
  if (send) {
    requireEnv(["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_TO"]);
    const bestPrice = offers.length ? Math.min(...offers.map((offer) => offer.pricePerPersonEur)) : null;
    const subject = bestPrice == null
      ? "Malediven-Scan: heute kein belastbarer Treffer"
      : `Malediven: ${offers.length} Deal${offers.length === 1 ? "" : "s"} ab ${Math.round(bestPrice)} € p. P.`;
    const result = await sendEmail({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject,
      ...report
    });
    console.log(`E-Mail versendet (${result.id || "ohne ID"}).`);
  } else {
    console.log(`Vorschau erstellt: ${reportPath} und ${sitePath}`);
  }

  console.log(JSON.stringify({
    searched: search.offers.length,
    accepted: offers.length,
    rejected: ranked.rejected.length,
    warnings: search.warnings.length,
    model: search.model
  }));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
