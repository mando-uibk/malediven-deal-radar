const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    offers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          resortName: { type: "string" },
          island: { type: ["string", "null"] },
          atoll: { type: ["string", "null"] },
          provider: { type: "string" },
          url: { type: "string" },
          departureAirport: { type: "string" },
          departureDate: { type: "string" },
          returnDate: { type: "string" },
          nights: { type: "integer" },
          board: {
            type: "string",
            enum: ["all_inclusive_plus", "all_inclusive", "full_board_plus", "full_board", "half_board", "unknown"]
          },
          packageIncludesFlights: { type: "boolean" },
          transfer: { type: "string", enum: ["included", "extra", "unknown"] },
          transferType: { type: ["string", "null"] },
          baggage: { type: "string", enum: ["included", "extra", "unknown"] },
          pricePerPersonEur: { type: "number" },
          totalPriceEur: { type: ["number", "null"] },
          priceConfidence: { type: "string", enum: ["live", "recent", "indicative"] },
          dealType: { type: "string", enum: ["regular", "last_minute", "flash_sale", "member_deal", "editorial_deal"] },
          membershipRequired: { type: "boolean" },
          bookingDeadline: { type: ["string", "null"] },
          stars: { type: ["number", "null"] },
          ratingOutOf10: { type: ["number", "null"] },
          room: { type: ["string", "null"] },
          evidence: { type: "string" }
        },
        required: [
          "resortName", "island", "atoll", "provider", "url", "departureAirport",
          "departureDate", "returnDate", "nights", "board", "packageIncludesFlights",
          "transfer", "transferType", "baggage", "pricePerPersonEur", "totalPriceEur",
          "priceConfidence", "dealType", "membershipRequired", "bookingDeadline", "stars",
          "ratingOutOf10", "room", "evidence"
        ]
      }
    }
  },
  required: ["offers"]
};

function buildPrompt(config, airport, today) {
  const sourceText = config.searchSources.length
    ? `Prüfe insbesondere diese Reiseanbieter: ${config.searchSources.join(", ")}.`
    : "Prüfe mehrere seriöse deutschsprachige Pauschalreiseanbieter.";

  return `
Heute ist ${today}. Finde bis zu ${config.offersPerAirport} aktuell öffentlich auffindbare und buchbare Pauschalreise-Angebote nach ${config.destination}.

Harte Kriterien:
- Abflug ausschließlich ${airport.name} (${airport.code}).
- Hinflug am oder nach ${config.windowStart}; Rückflug am oder vor ${config.windowEnd}.
- Mindestens ${config.minimumNights} Nächte.
- Flug und Hotel müssen im Preis als Pauschalreise enthalten sein.
- Maximal ${config.maximumPricePerPersonEur} EUR pro Person bei ${config.travelers} Erwachsenen im Doppelzimmer.
- Verpflegung ausschließlich All Inclusive Plus/All Inclusive Premium oder All Inclusive.

${sourceText}
Suche ausdrücklich auch bei Last-Minute-, Flash-Sale- und Mitgliederportalen wie Secret Escapes, Voyage Privé, Restplatzbörse, 5vorFlug, L'TUR, Urlaubspiraten und Travelzoo.

Qualitätsregeln:
- Öffne nach Möglichkeit die konkrete Angebots- oder Buchungsseite; verwende keine redaktionellen Preisbeispiele.
- Übernimm nur Angaben, die eine Quelle stützt. Erfinde keine Preise, Termine, Verpflegung, Bewertungen oder Inklusivleistungen.
- Nutze die endgültige Anbieter-URL, keine Suchmaschinen-URL.
- Bei einem kuratierten Dealportal darf die konkrete Deal-Seite verlinkt werden. Keine Start-, Kategorie- oder allgemeine Suchseite.
- Secret-Escapes-/Voyage-Privé-/Travelzoo-Mitgliederpreise nur aufnehmen, wenn Preis, Termin und Leistungen durch die öffentlich auffindbare Quelle belegt sind; membershipRequired dann true setzen.
- Flüge "optional" reicht nicht: Der angegebene Preis muss die ausgewählte Flugoption ab ${airport.code} bereits enthalten.
- dealType unterscheidet reguläre Angebote, Last Minute, zeitlich begrenzte Flash Sales, Mitgliederangebote und redaktionell kuratierte Deals. bookingDeadline nur bei belegtem Datum, sonst null.
- priceConfidence = live nur bei sichtbarer aktueller Buchungsabfrage, recent bei einem datierten aktuellen Treffer, sonst indicative.
- Normalisiere Bewertungen auf eine Skala von 0 bis 10. Unbekannte optionale Angaben sind null/unknown.
- Gib lieber wenige belastbare Treffer als viele unsichere zurück. Wenn nichts passt, gib eine leere Liste zurück.
`.trim();
}

function extractOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  throw new Error("Die OpenAI-Antwort enthielt keinen auswertbaren Text.");
}

async function callResponsesApi({ apiKey, model, prompt, timezone }) {
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions: "Du bist ein sehr genauer deutschsprachiger Reise-Deal-Analyst. Quellenbezug und harte Filter sind wichtiger als die Anzahl der Treffer.",
      input: prompt,
      tools: [{
        type: "web_search",
        search_context_size: "high",
        user_location: {
          type: "approximate",
          country: "AT",
          city: "Innsbruck",
          region: "Tyrol",
          timezone
        }
      }],
      text: {
        format: {
          type: "json_schema",
          name: "maldives_package_offers",
          strict: true,
          schema: RESPONSE_SCHEMA
        }
      },
      store: false
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${details.slice(0, 700)}`);
  }

  const payload = await response.json();
  return JSON.parse(extractOutputText(payload));
}

export async function searchAllAirports(config, options = {}) {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt.");
  const model = options.model || process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const today = options.today || new Date().toISOString().slice(0, 10);

  const results = await Promise.allSettled(config.departureAirports.map(async (airport) => {
    const data = await callResponsesApi({
      apiKey,
      model,
      prompt: buildPrompt(config, airport, today),
      timezone: config.timezone
    });
    return { airport, offers: data.offers || [] };
  }));

  const offers = [];
  const warnings = [];
  results.forEach((result, index) => {
    const airport = config.departureAirports[index];
    if (result.status === "fulfilled") {
      offers.push(...result.value.offers);
    } else {
      warnings.push(`${airport.code}: ${result.reason?.message || String(result.reason)}`);
    }
  });

  if (warnings.length === config.departureAirports.length) {
    throw new Error(`Alle Suchen sind fehlgeschlagen. ${warnings.join(" | ")}`);
  }
  return { offers, warnings, model };
}
