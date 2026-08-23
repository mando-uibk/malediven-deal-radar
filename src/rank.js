const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function nightsBetween(start, end) {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  return Math.round((to - from) / DAY_MS);
}

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateOffer(raw, config) {
  const reasons = [];
  if (!raw || typeof raw !== "object") return { valid: false, reasons: ["kein Objekt"] };
  if (!raw.resortName?.trim()) reasons.push("Resort fehlt");
  if (!raw.provider?.trim()) reasons.push("Anbieter fehlt");
  if (!validHttpsUrl(raw.url)) reasons.push("keine gültige HTTPS-URL");
  const acceptedSourceLanguages = config.acceptedSourceLanguages || ["de", "en"];
  if (!acceptedSourceLanguages.includes(raw.sourceLanguage)) {
    reasons.push("Quelle nicht auf Deutsch oder Englisch");
  }
  if (!DATE_PATTERN.test(raw.departureDate || "") || !DATE_PATTERN.test(raw.returnDate || "")) {
    reasons.push("ungültige Reisedaten");
  }

  const airportCodes = new Set(config.departureAirports.map((airport) => airport.code));
  if (!airportCodes.has(raw.departureAirport)) reasons.push("falscher Abflughafen");
  if (raw.departureDate < config.windowStart) reasons.push("Abflug vor Reisezeitraum");
  if (raw.returnDate > config.windowEnd) reasons.push("Rückflug nach Reisezeitraum");

  const calculatedNights = nightsBetween(raw.departureDate, raw.returnDate);
  const statedNights = Number.isInteger(raw.nights) && raw.nights > 0 && raw.nights <= calculatedNights
    ? raw.nights
    : calculatedNights;
  if (!Number.isFinite(statedNights) || statedNights < config.minimumNights) {
    reasons.push("zu wenige Nächte");
  }
  if (raw.packageIncludesFlights !== true) reasons.push("kein bestätigtes Flugpaket");
  if (!config.acceptedBoard.includes(raw.board)) reasons.push("Verpflegung nicht akzeptiert");
  if (!Number.isFinite(raw.pricePerPersonEur) || raw.pricePerPersonEur <= 0) reasons.push("ungültiger Preis");
  if (raw.pricePerPersonEur > config.maximumPricePerPersonEur) reasons.push("über Budget");
  if (raw.totalPriceEur != null) {
    const total = Number(raw.totalPriceEur);
    const expectedTotal = Number(raw.pricePerPersonEur) * config.travelers;
    if (!Number.isFinite(total) || total <= 0) {
      reasons.push("ungültiger Gesamtpreis");
    } else if (total > config.maximumPricePerPersonEur * config.travelers) {
      reasons.push("Gesamtpreis über Budget");
    } else if (Number.isFinite(expectedTotal) && Math.abs(total - expectedTotal) > Math.max(100, expectedTotal * 0.05)) {
      reasons.push("widersprüchliche Preisangaben");
    }
  }

  const rating = raw.ratingOutOf10 == null ? null : Number(raw.ratingOutOf10);
  if (rating !== null && (rating < 0 || rating > 10)) reasons.push("ungültige Bewertung");

  return {
    valid: reasons.length === 0,
    reasons,
    offer: reasons.length === 0 ? {
      ...raw,
      dealType: raw.dealType || "regular",
      membershipRequired: raw.membershipRequired === true,
      bookingDeadline: raw.bookingDeadline || null,
      nights: statedNights,
      pricePerPersonEur: Math.round(Number(raw.pricePerPersonEur) * 100) / 100,
      totalPriceEur: raw.totalPriceEur == null
        ? Math.round(Number(raw.pricePerPersonEur) * config.travelers * 100) / 100
        : Math.round(Number(raw.totalPriceEur) * 100) / 100,
      ratingOutOf10: rating
    } : null
  };
}

export function scoreOffer(offer, config) {
  let score = 50;
  const reasons = [];

  if (offer.board === config.preferredBoard) {
    score += 24;
    reasons.push("AI+ / Premium / Ultra");
  } else if (offer.board === "all_inclusive") {
    score += 15;
    reasons.push("All Inclusive");
  }

  const budgetHeadroom = 1 - offer.pricePerPersonEur / config.maximumPricePerPersonEur;
  const valuePoints = Math.max(0, Math.min(20, budgetHeadroom * 30));
  score += valuePoints;
  if (budgetHeadroom >= 0.15) reasons.push("guter Budgetpuffer");

  const extraNights = Math.max(0, offer.nights - config.minimumNights);
  score += Math.min(10, extraNights * 2);
  if (extraNights > 0) reasons.push(extraNights === 1 ? "1 Extra-Nacht" : `${extraNights} Extra-Nächte`);

  if (offer.ratingOutOf10 != null) {
    score += Math.max(-5, Math.min(10, (offer.ratingOutOf10 - 7.5) * 5));
    if (offer.ratingOutOf10 >= 8.5) reasons.push("sehr gut bewertet");
  }
  if (offer.transfer === "included") {
    score += 6;
    reasons.push("Transfer inklusive");
  }
  if (offer.baggage === "included") score += 3;
  if (offer.priceConfidence === "live") {
    score += 6;
    reasons.push("Live-Preis");
  } else if (offer.priceConfidence === "indicative") {
    score -= 8;
  }
  if (["last_minute", "flash_sale", "member_deal", "editorial_deal"].includes(offer.dealType)) {
    const label = {
      last_minute: "Last-Minute-Fund",
      flash_sale: "Flash Sale",
      member_deal: "Mitgliederangebot",
      editorial_deal: "kuratierter Deal"
    }[offer.dealType];
    reasons.push(label);
  }

  return { score: Math.round(score * 10) / 10, reasons };
}

function dedupeKey(offer) {
  return [
    offer.resortName.toLocaleLowerCase("de"),
    offer.provider.toLocaleLowerCase("de"),
    offer.departureAirport,
    offer.departureDate,
    offer.returnDate,
    offer.board
  ].join("|");
}

export function filterAndRank(rawOffers, config) {
  const rejected = [];
  const unique = new Map();

  for (const raw of rawOffers) {
    const validation = validateOffer(raw, config);
    if (!validation.valid) {
      rejected.push({ offer: raw, reasons: validation.reasons });
      continue;
    }
    const offer = validation.offer;
    const key = dedupeKey(offer);
    const previous = unique.get(key);
    if (!previous || offer.pricePerPersonEur < previous.pricePerPersonEur) unique.set(key, offer);
  }

  const ranked = [...unique.values()]
    .map((offer) => ({ ...offer, ...scoreOffer(offer, config) }))
    .sort((a, b) => b.score - a.score || a.pricePerPersonEur - b.pricePerPersonEur)
    .slice(0, config.topOffers);

  return { offers: ranked, rejected };
}
