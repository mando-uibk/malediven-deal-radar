import test from "node:test";
import assert from "node:assert/strict";
import { filterAndRank, validateOffer } from "../src/rank.js";

const config = {
  travelers: 2,
  windowStart: "2026-11-26",
  windowEnd: "2026-12-10",
  minimumNights: 9,
  maximumPricePerPersonEur: 4000,
  departureAirports: [{ code: "MUC", name: "München" }],
  acceptedBoard: ["all_inclusive_plus", "all_inclusive"],
  preferredBoard: "all_inclusive_plus",
  acceptedSourceLanguages: ["de", "en"],
  topOffers: 7
};

function offer(overrides = {}) {
  return {
    resortName: "Test Resort",
    provider: "Testanbieter",
    url: "https://example.com/offer",
    sourceLanguage: "de",
    departureAirport: "MUC",
    departureDate: "2026-11-27",
    returnDate: "2026-12-07",
    nights: 10,
    board: "all_inclusive_plus",
    packageIncludesFlights: true,
    transfer: "included",
    transferType: "Speedboat",
    baggage: "included",
    pricePerPersonEur: 3500,
    totalPriceEur: 7000,
    priceConfidence: "live",
    ratingOutOf10: 8.5,
    stars: 5,
    room: null,
    island: null,
    atoll: null,
    evidence: "test",
    ...overrides
  };
}

test("akzeptiert ein passendes Pauschalangebot und berechnet Nächte neu", () => {
  const result = validateOffer(offer({ nights: 99 }), config);
  assert.equal(result.valid, true);
  assert.equal(result.offer.nights, 10);
});

test("behält belegte Hotelnächte bei Pauschalreisen mit Nachtflug", () => {
  const result = validateOffer(offer({ nights: 9 }), config);
  assert.equal(result.valid, true);
  assert.equal(result.offer.nights, 9);
});

test("verwirft zu kurze, zu teure und Hotel-only Angebote", () => {
  assert.equal(validateOffer(offer({ returnDate: "2026-12-06", departureDate: "2026-11-27" }), { ...config, minimumNights: 9 }).valid, true);
  assert.equal(validateOffer(offer({ returnDate: "2026-12-06", departureDate: "2026-11-28" }), { ...config, minimumNights: 9 }).valid, false);
  assert.equal(validateOffer(offer({ pricePerPersonEur: 4001 }), config).valid, false);
  assert.equal(validateOffer(offer({ totalPriceEur: 9000 }), config).valid, false);
  assert.equal(validateOffer(offer({ packageIncludesFlights: false }), config).valid, false);
});

test("akzeptiert AI und AI+ getrennt, verwirft aber nicht lesbare Quellsprachen", () => {
  assert.equal(validateOffer(offer({ board: "all_inclusive" }), config).valid, true);
  assert.equal(validateOffer(offer({ sourceLanguage: "sk" }), config).valid, false);
  assert.equal(validateOffer(offer({ sourceLanguage: "en" }), config).valid, true);
});

test("AI+ erhält bei sonst gleichen Daten das höhere Ranking", () => {
  const result = filterAndRank([
    offer({ resortName: "AI Resort", board: "all_inclusive" }),
    offer({ resortName: "AI Plus Resort", board: "all_inclusive_plus" })
  ], config);
  assert.equal(result.offers[0].board, "all_inclusive_plus");
});

test("dedupliziert gleiches Resort und behält den günstigeren Treffer", () => {
  const expensive = offer({ pricePerPersonEur: 3700, totalPriceEur: 7400 });
  const cheap = offer({ pricePerPersonEur: 3300, totalPriceEur: 6600, url: "https://example.com/cheap" });
  const result = filterAndRank([expensive, cheap], config);
  assert.equal(result.offers.length, 1);
  assert.equal(result.offers[0].pricePerPersonEur, 3300);
});


test("behält Anbieter-Alternativen desselben Resorts getrennt", () => {
  const result = filterAndRank([
    offer({ provider: "TUI", pricePerPersonEur: 3300, totalPriceEur: 6600 }),
    offer({ provider: "DERTOUR", pricePerPersonEur: 3400, totalPriceEur: 6800 })
  ], config);
  assert.equal(result.offers.length, 2);
  assert.deepEqual(new Set(result.offers.map((item) => item.provider)), new Set(["TUI", "DERTOUR"]));
});
