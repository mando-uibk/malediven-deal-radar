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
    imageUrls: ["https://images.example.com/one.jpg", "https://images.example.com/two.jpg", "https://images.example.com/three.jpg"],
    sourceLanguage: "de",
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
    restaurantInfo: {
      total: 2,
      buffet: 1,
      aLaCarte: 1,
      venues: [
        { name: "Lagoon Buffet", type: "buffet", allInclusive: "included", allInclusivePlus: "included", note: "Alle Mahlzeiten inklusive." },
        { name: "Reef Grill", type: "a_la_carte", allInclusive: "chargeable", allInclusivePlus: "included_limited", note: "Ein Dinner pro Aufenthalt." }
      ],
      extraCharge: ["Private Dining"],
      caveat: "Tarifdetails vor Buchung prüfen.",
      sourceUrls: [{ label: "Resortquelle", url: "https://example.com/restaurants" }],
      verifiedAt: "2026-08-23T12:00:00+02:00"
    },
    dealStatus: "new",
    previousPricePerPersonEur: null,
    score: 95,
    reasons: ["AI+ / Premium / Ultra", "Mitgliederangebot"],
    ...overrides
  };
}

test("erzeugt eine mobile, nach AI und AI+ filterbare Seite mit Favoriten", () => {
  const html = renderSite({
    offers: [
      siteOffer(),
      siteOffer({ id: "offer-2", provider: "TUI", board: "all_inclusive", pricePerPersonEur: 3400, totalPriceEur: 6800, score: 88 }),
      siteOffer({ id: "offer-3", resortName: "Classic AI Resort", board: "all_inclusive", score: 82 })
    ],
    config,
    generatedAt: new Date("2026-08-20T08:00:00Z")
  });
  assert.ok(html.includes('name="viewport"'));
  assert.ok(html.includes("data-airport-filter=\"MUC\""));
  assert.ok(html.includes('data-favorite="resort-lagoon-resort"'));
  assert.equal((html.match(/data-offer-card data-id=/g) || []).length, 2);
  assert.equal((html.match(/class="offer-option" data-provider-offer/g) || []).length, 3);
  assert.ok(html.includes("2 Anbieterangebote"));
  assert.ok(html.includes("2 Angebote von 2 Anbietern"));
  assert.ok(html.includes("TUI"));
  assert.ok(html.includes("günstigstes zuerst"));
  assert.ok(html.includes("Mitglieder-Deal"));
  assert.ok(html.includes("Deutschsprachige Quelle"));
  assert.ok(html.includes('<option value="all_inclusive_plus">Nur AI+</option>'));
  assert.ok(html.includes('<option value="all_inclusive">Nur AI</option>'));
  assert.ok(html.includes('title="All Inclusive Plus">AI+</span>'));
  assert.ok(html.includes('title="All Inclusive">AI</span>'));
  assert.ok(html.includes('class="deal-gallery"'));
  assert.equal((html.match(/class="gallery-image"/g) || []).length, 6);
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes("Lagoon Resort – Bild 1"));
  assert.equal((html.match(/data-restaurant-info/g) || []).length, 2);
  assert.ok(html.includes("2 gesamt · 1 Buffet · 1 À la carte"));
  assert.ok(html.includes("AI: gegen Gebühr"));
  assert.ok(html.includes("AI+: begrenzt inklusive"));
  assert.ok(html.includes("https://example.com/restaurants"));
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
  assert.ok(html.includes("https://images.example.com/one.jpg"));
});
