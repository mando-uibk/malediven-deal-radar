import test from "node:test";
import assert from "node:assert/strict";
import { renderReport } from "../src/render.js";

test("escaped Inhalte aus der Websuche erscheinen sicher im HTML-Bericht", () => {
  const config = {
    locale: "de-AT",
    timezone: "Europe/Vienna",
    windowStart: "2026-11-26",
    windowEnd: "2026-12-10",
    minimumNights: 9,
    maximumPricePerPersonEur: 4000,
    travelers: 2
  };
  const offer = {
    resortName: "Lagoon <script>alert(1)</script>",
    island: "Testinsel",
    atoll: null,
    provider: "Test & Reisen",
    url: "https://example.com/?a=1&b=2",
    dealStatus: "new",
    score: 90,
    pricePerPersonEur: 3500,
    previousPricePerPersonEur: null,
    totalPriceEur: 7000,
    priceConfidence: "live",
    departureAirport: "MUC",
    departureDate: "2026-11-27",
    returnDate: "2026-12-07",
    nights: 10,
    board: "all_inclusive_plus",
    room: null,
    transfer: "included",
    transferType: "Speedboat",
    baggage: "included",
    ratingOutOf10: 9,
    stars: 5,
    reasons: ["AI+ bevorzugt"]
  };

  const { html } = renderReport({ offers: [offer], config, generatedAt: new Date("2026-08-20T08:00:00Z") });
  assert.ok(html.includes("Lagoon &lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(html.includes("https://example.com/?a=1&amp;b=2"));
});
