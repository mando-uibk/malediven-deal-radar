const BOARD_LABELS = {
  all_inclusive_plus: "All Inclusive Plus",
  all_inclusive: "All Inclusive",
  full_board_plus: "Vollpension Plus",
  full_board: "Vollpension",
  half_board: "Halbpension",
  unknown: "Unbekannt"
};

const STATUS_LABELS = {
  new: "NEU",
  price_drop: "PREIS GESUNKEN",
  known: "WIEDER GEFUNDEN"
};

const DEAL_TYPE_LABELS = {
  regular: null,
  last_minute: "LAST MINUTE",
  flash_sale: "FLASH SALE",
  member_deal: "MITGLIEDER-DEAL",
  editorial_deal: "DEAL-TIPP"
};

const LANGUAGE_LABELS = {
  de: "Deutschsprachige Quelle",
  en: "Englischsprachige Quelle"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function eur(value, locale) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function date(value, locale) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

export function renderReport({ offers, config, warnings = [], generatedAt = new Date() }) {
  const locale = config.locale || "de-AT";
  const cards = offers.map((offer, index) => {
    const location = [offer.island, offer.atoll].filter(Boolean).join(", ");
    const extras = [
      offer.transfer === "included" ? `Transfer inkl.${offer.transferType ? ` (${offer.transferType})` : ""}` : null,
      offer.baggage === "included" ? "Gepäck inkl." : null,
      LANGUAGE_LABELS[offer.sourceLanguage] || null,
      offer.ratingOutOf10 != null ? `Bewertung ${offer.ratingOutOf10.toFixed(1)}/10` : null,
      offer.stars != null ? `${offer.stars} Sterne` : null
    ].filter(Boolean).join(" · ");
    const previous = offer.dealStatus === "price_drop" && offer.previousPricePerPersonEur
      ? `<span style="color:#64748b;text-decoration:line-through;margin-left:8px">${eur(offer.previousPricePerPersonEur, locale)}</span>`
      : "";
    const dealType = DEAL_TYPE_LABELS[offer.dealType];
    const dealBadge = dealType
      ? `<span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:999px;padding:4px 8px;margin:8px 6px 0 0;font-size:11px;font-weight:800">${dealType}</span>`
      : "";
    const memberBadge = offer.membershipRequired
      ? `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:4px 8px;margin:8px 6px 0 0;font-size:11px;font-weight:800">LOGIN/MITGLIEDSCHAFT NÖTIG</span>`
      : "";
    const deadline = offer.bookingDeadline
      ? `<div style="font-size:13px;color:#9a3412;margin:10px 0 0"><strong>Buchbar bis:</strong> ${escapeHtml(offer.bookingDeadline)}</div>`
      : "";

    return `
      <div style="background:#ffffff;border:1px solid #dbe7e7;border-radius:16px;padding:22px;margin:0 0 16px">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:${offer.dealStatus === "price_drop" ? "#b45309" : "#087f8c"}">${STATUS_LABELS[offer.dealStatus]} · #${index + 1} · SCORE ${offer.score}</div>
        <div>${dealBadge}${memberBadge}</div>
        <h2 style="font-size:21px;line-height:1.25;margin:8px 0 4px;color:#12343b">${escapeHtml(offer.resortName)}</h2>
        <div style="color:#64748b;font-size:14px">${escapeHtml(location || "Malediven")} · ${escapeHtml(offer.provider)}</div>
        <div style="margin:18px 0 6px;font-size:28px;font-weight:800;color:#12343b">${eur(offer.pricePerPersonEur, locale)}${previous}<span style="font-size:13px;font-weight:500;color:#64748b"> p. P.</span></div>
        <div style="font-size:14px;color:#334155">Gesamt ${eur(offer.totalPriceEur, locale)} für ${config.travelers} Personen · ${offer.priceConfidence === "live" ? "Live-Preis" : offer.priceConfidence === "recent" ? "aktueller Preisfund" : "Richtpreis"}</div>
        <div style="background:#f0fdfa;border-radius:10px;padding:12px;margin:16px 0;color:#134e4a;font-size:14px;line-height:1.6">
          <strong>${escapeHtml(offer.departureAirport)}</strong> · ${date(offer.departureDate, locale)}–${date(offer.returnDate, locale)} · ${offer.nights} Nächte<br>
          ${escapeHtml(BOARD_LABELS[offer.board])}${offer.room ? ` · ${escapeHtml(offer.room)}` : ""}${extras ? `<br>${escapeHtml(extras)}` : ""}
        </div>
        <div style="font-size:13px;color:#64748b;margin:0 0 16px">Warum weit oben: ${escapeHtml(offer.reasons.join(" · ") || "erfüllt alle Kriterien")}</div>
        ${deadline}
        <a href="${escapeHtml(offer.url)}" style="display:inline-block;background:#087f8c;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:10px;${deadline ? "margin-top:14px" : ""}">Angebot prüfen</a>
      </div>`;
  }).join("");

  const empty = offers.length === 0
    ? `<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #dbe7e7">Heute wurde kein ausreichend belastbares Angebot gefunden, das alle harten Kriterien erfüllt.</div>`
    : "";
  const warningBlock = warnings.length
    ? `<div style="background:#fff7ed;color:#9a3412;border-radius:12px;padding:14px;margin-top:18px;font-size:13px"><strong>Hinweis zur aktuellen Suche:</strong><br>${warnings.map(escapeHtml).join("<br>")}</div>`
    : "";

  const html = `<!doctype html>
  <html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
  <body style="margin:0;background:#eaf6f5;font-family:Arial,Helvetica,sans-serif;color:#12343b">
    <div style="max-width:680px;margin:0 auto;padding:30px 16px 44px">
      <div style="padding:10px 4px 24px">
        <div style="font-size:13px;font-weight:800;color:#087f8c;letter-spacing:.12em">MALEDIVEN DEAL AGENT</div>
        <h1 style="font-size:31px;line-height:1.14;margin:9px 0 10px">Die besten Funde von heute 🌴</h1>
        <div style="color:#527079;line-height:1.5">${config.windowStart} bis ${config.windowEnd} · mindestens ${config.minimumNights} Nächte · All Inclusive oder AI+ / Premium / Ultra · deutsche oder englische Angebotsseite · bis ${eur(config.maximumPricePerPersonEur, locale)} p. P. · Abflug MUC/ZRH/VIE</div>
      </div>
      ${cards}${empty}${warningBlock}
      <div style="font-size:12px;line-height:1.5;color:#64748b;padding:20px 4px 0">
        Stand ${generatedAt.toLocaleString(locale, { timeZone: config.timezone })}. Preise und Verfügbarkeiten können sich jederzeit ändern. Der Agent rankt öffentlich auffindbare Angebote; vor Buchung bitte Reisedaten, Gepäck, Transfer und Gesamtpreis auf der Anbieterseite prüfen.
      </div>
    </div>
  </body></html>`;

  const text = offers.length
    ? offers.map((offer, index) => [
        `${index + 1}. ${offer.resortName} (${STATUS_LABELS[offer.dealStatus]})`,
        `${eur(offer.pricePerPersonEur, locale)} p. P. | ${offer.departureAirport} | ${offer.departureDate}–${offer.returnDate} | ${offer.nights} Nächte`,
        `${BOARD_LABELS[offer.board]} | ${offer.provider}${DEAL_TYPE_LABELS[offer.dealType] ? ` | ${DEAL_TYPE_LABELS[offer.dealType]}` : ""}${offer.membershipRequired ? " | Login/Mitgliedschaft nötig" : ""}`,
        offer.url
      ].join("\n")).join("\n\n")
    : "Heute wurde kein Angebot gefunden, das alle Kriterien erfüllt.";

  return { html, text };
}
