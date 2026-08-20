import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

function fingerprint(offer) {
  const value = [offer.resortName, offer.departureAirport, offer.departureDate, offer.returnDate, offer.board]
    .join("|")
    .toLocaleLowerCase("de");
  return createHash("sha256").update(value).digest("hex").slice(0, 20);
}

export async function loadState(path) {
  try {
    const data = JSON.parse(await readFile(path, "utf8"));
    return data?.offers && typeof data.offers === "object" ? data : { offers: {} };
  } catch (error) {
    if (error.code === "ENOENT") return { offers: {} };
    throw error;
  }
}

export function annotateWithHistory(offers, state, now = new Date()) {
  const seenAt = now.toISOString();
  const annotated = offers.map((offer) => {
    const id = fingerprint(offer);
    const previous = state.offers[id];
    let dealStatus = "known";
    if (!previous) dealStatus = "new";
    else if (offer.pricePerPersonEur < previous.lowestPricePerPersonEur) dealStatus = "price_drop";

    state.offers[id] = {
      firstSeenAt: previous?.firstSeenAt || seenAt,
      lastSeenAt: seenAt,
      latestPricePerPersonEur: offer.pricePerPersonEur,
      lowestPricePerPersonEur: Math.min(previous?.lowestPricePerPersonEur ?? Infinity, offer.pricePerPersonEur),
      resortName: offer.resortName,
      url: offer.url
    };

    return {
      ...offer,
      id,
      dealStatus,
      previousPricePerPersonEur: previous?.latestPricePerPersonEur ?? null
    };
  });

  const cutoff = new Date(now.getTime() - 90 * 86_400_000).toISOString();
  for (const [id, entry] of Object.entries(state.offers)) {
    if (entry.lastSeenAt < cutoff) delete state.offers[id];
  }
  return annotated;
}

export async function saveState(path, state) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
