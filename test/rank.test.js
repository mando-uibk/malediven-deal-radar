import test from "node:test";
import assert from "node:assert/strict";
import { filterAndRank, scoreOffer, validateOffer } from "../src/rank.js";

const config = {
  travelers: 2,
  windowStart: "2026-11-26",
  windowEnd: "2026-12-10",
  minimumNights: 9,
  maximumPricePerPersonEur: 4000,
  departureAirports: [{ code: "MUC", name: "München" }],
  acceptedBoard: ["all_inclusive_plus", "all_inclusive"],
  preferredBoard: "all_inclusive_plus",
  topOffers: 7
};

function offer(overrides = {}) {
  return {
    resortName: "Test Resort",
    provider: "Testanbieter",
    url: "https://example.com/offer",
    departureAirport: "MUC",
    departureDate: "2026-11-27",
    returnDate: "2026-12-07",
    nights: 10,
    board: "all_inclusive",
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

test("AI+ erhält bei sonst gleichen Daten das bessere Ranking", () => {
  const ai = scoreOffer(offer(), config);
  const aiPlus = scoreOffer(offer({ board: "all_inclusive_plus" }), config);
  assert.ok(aiPlus.score > ai.score);
});

test("dedupliziert gleiches Resort und behält den günstigeren Treffer", () => {
  const expensive = offer({ pricePerPersonEur: 3700, totalPriceEur: 7400 });
  const cheap = offer({ pricePerPersonEur: 3300, totalPriceEur: 6600, url: "https://example.com/cheap" });
  const result = filterAndRank([expensive, cheap], config);
  assert.equal(result.offers.length, 1);
  assert.equal(result.offers[0].pricePerPersonEur, 3300);
});
