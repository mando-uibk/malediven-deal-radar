import test from "node:test";
import assert from "node:assert/strict";
import { renderSite } from "../src/site.js";

const config = {
  locale: "de-AT",
  timezone: "Europe/Vienna",
  windowStart: "2026-11-26",
  windowEnd: "2026-12-10",
  minimumNights: 9,
  maximumPricePerPersonEur: 4000,
  travelers: 2,
  departureAirports: [
    { code: "MUC", name: "München" },
    { code: "ZRH", name: "Zürich" },
    { code: "VIE", name: "Wien" }
  ]
};

function siteOffer(overrides = {}) {
  return {
    id: "offer-1",
    resortName: "Lagoon Resort",
    island: "Testinsel",
    atoll: "Test-Atoll",
    provider: "Secret Escapes",
    url: "https://example.com/deal?a=1&b=2",
    departureAirport: "MUC",
    departureDate: "2026-11-27",
    returnDate: "2026-12-08",
    nights: 11,
    board: "all_inclusive_plus",
    transfer: "included",
    transferType: "Speedboat",
    baggage: "included",
    pricePerPersonEur: 3600,
    totalPriceEur: 7200,
    priceConfidence: "live",
    dealType: "member_deal",
    membershipRequired: true,
    bookingDeadline: "2026-08-24",
    stars: 5,
    ratingOutOf10: 9,
    room: "Beach Villa",
    evidence: "Geprüfter Deal",
    dealStatus: "new",
    previousPricePerPersonEur: null,
    score: 95,
    reasons: ["AI+ bevorzugt", "Mitgliederangebot"],
    ...overrides
  };
}

test("erzeugt eine mobile, filterbare Seite mit Favoriten", () => {
  const html = renderSite({ offers: [siteOffer()], config, generatedAt: new Date("2026-08-20T08:00:00Z") });
  assert.ok(html.includes('name="viewport"'));
  assert.ok(html.includes("data-airport-filter=\"MUC\""));
  assert.ok(html.includes("data-favorite=\"offer-1\""));
  assert.ok(html.includes("Mitglieder-Deal"));
  assert.ok(html.includes("Keine Cookies, kein Tracking"));
});

test("escaped Angebotsdaten können weder Markup noch Script einschleusen", () => {
  const html = renderSite({
    offers: [siteOffer({ resortName: "<script>alert(1)</script>", evidence: "</script><script>alert(2)</script>" })],
    config,
    generatedAt: new Date("2026-08-20T08:00:00Z")
  });
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("<script>alert(2)</script>"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("https://example.com/deal?a=1&amp;b=2"));
});
