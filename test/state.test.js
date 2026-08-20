import test from "node:test";
import assert from "node:assert/strict";
import { annotateWithHistory } from "../src/state.js";

const base = {
  resortName: "Lagoon Resort",
  departureAirport: "MUC",
  departureDate: "2026-11-27",
  returnDate: "2026-12-08",
  board: "all_inclusive_plus",
  pricePerPersonEur: 3600,
  url: "https://example.com/lagoon"
};

test("markiert ersten Fund als neu und eine Preissenkung beim Folgelauf", () => {
  const state = { offers: {} };
  const first = annotateWithHistory([base], state, new Date("2026-08-20T08:00:00Z"));
  assert.equal(first[0].dealStatus, "new");
  const second = annotateWithHistory([{ ...base, pricePerPersonEur: 3400 }], state, new Date("2026-08-21T08:00:00Z"));
  assert.equal(second[0].dealStatus, "price_drop");
  assert.equal(second[0].previousPricePerPersonEur, 3600);
});
