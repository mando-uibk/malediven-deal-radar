import { readFile } from "node:fs/promises";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function loadConfig(path = process.env.TRIP_CONFIG_PATH || "config/trip.json") {
  const config = JSON.parse(await readFile(path, "utf8"));
  const required = [
    "destination",
    "travelers",
    "windowStart",
    "windowEnd",
    "minimumNights",
    "maximumPricePerPersonEur",
    "departureAirports",
    "acceptedBoard",
    "acceptedSourceLanguages"
  ];

  for (const key of required) {
    if (config[key] === undefined || config[key] === null) {
      throw new Error(`Fehlende Konfiguration: ${key}`);
    }
  }

  if (!DATE_PATTERN.test(config.windowStart) || !DATE_PATTERN.test(config.windowEnd)) {
    throw new Error("windowStart und windowEnd müssen YYYY-MM-DD verwenden.");
  }
  if (config.windowStart >= config.windowEnd) {
    throw new Error("windowEnd muss nach windowStart liegen.");
  }
  if (!Number.isInteger(config.travelers) || config.travelers < 1) {
    throw new Error("travelers muss eine positive Ganzzahl sein.");
  }
  if (!Number.isInteger(config.minimumNights) || config.minimumNights < 1) {
    throw new Error("minimumNights muss eine positive Ganzzahl sein.");
  }
  if (!Array.isArray(config.departureAirports) || config.departureAirports.length === 0) {
    throw new Error("Mindestens ein Abflughafen ist erforderlich.");
  }
  if (!Array.isArray(config.acceptedSourceLanguages) || config.acceptedSourceLanguages.length === 0) {
    throw new Error("Mindestens eine akzeptierte Quellsprache ist erforderlich.");
  }

  return {
    preferredBoard: "all_inclusive_plus",
    topOffers: 7,
    offersPerAirport: 8,
    currency: "EUR",
    locale: "de-AT",
    timezone: "Europe/Vienna",
    searchSources: [],
    ...config
  };
}

export function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Fehlende Umgebungsvariablen: ${missing.join(", ")}`);
  }
}
