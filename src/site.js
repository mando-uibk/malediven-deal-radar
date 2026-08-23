const BOARD_LABELS = {
  all_inclusive_plus: "All Inclusive Plus",
  all_inclusive: "All Inclusive",
  full_board_plus: "Vollpension Plus",
  full_board: "Vollpension",
  half_board: "Halbpension",
  unknown: "Unbekannt"
};

const DEAL_LABELS = {
  regular: null,
  last_minute: "Last Minute",
  flash_sale: "Flash Sale",
  member_deal: "Mitglieder-Deal",
  editorial_deal: "Deal-Tipp"
};

const STATUS_LABELS = {
  new: "Neu gefunden",
  price_drop: "Preis gesunken",
  known: "Weiterhin verfügbar"
};

const LANGUAGE_LABELS = {
  de: "Deutschsprachige Quelle",
  en: "Englischsprachige Quelle"
};

const BOARD_BADGES = {
  all_inclusive_plus: "AI+",
  all_inclusive: "AI"
};

const RESTAURANT_STATUS_LABELS = {
  "included": "inklusive",
  "included_limited": "begrenzt inklusive",
  "chargeable": "gegen Gebühr",
  "restricted": "nur bestimmte Villen",
  "verify": "vor Buchung prüfen"
};

const RESTAURANT_STATUS_CLASSES = {
  "included": "included",
  "included_limited": "limited",
  "chargeable": "chargeable",
  "restricted": "restricted",
  "verify": "verify"
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
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function shortDate(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function fullDate(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function normalizeResortName(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/&/g, " und ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function sortOffers(offers) {
  return [...offers].sort((a, b) =>
    a.pricePerPersonEur - b.pricePerPersonEur
    || a.departureDate.localeCompare(b.departureDate)
    || a.returnDate.localeCompare(b.returnDate)
    || a.provider.localeCompare(b.provider, "de")
  );
}

function groupOffersByResort(offers) {
  const groups = new Map();
  for (const offer of offers) {
    const key = normalizeResortName(offer.resortName);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(offer);
  }
  return [...groups.values()]
    .map(sortOffers)
    .sort((a, b) =>
      a[0].pricePerPersonEur - b[0].pricePerPersonEur
      || b[0].score - a[0].score
      || a[0].resortName.localeCompare(b[0].resortName, "de")
    );
}

function renderBoardBadge(board) {
  return `<span class="badge badge--board badge--${board === "all_inclusive_plus" ? "board-plus" : "board-ai"}" title="${escapeHtml(BOARD_LABELS[board])}">${escapeHtml(BOARD_BADGES[board])}</span>`;
}

function renderProviderOffer(item, locale, travelers, index) {
  const confidence = item.priceConfidence === "live" ? "Live-Preis" : item.priceConfidence === "recent" ? "aktueller Fund" : "Richtpreis";
  return `
    <div class="offer-option" data-provider-offer data-airport="${escapeHtml(item.departureAirport)}" data-board="${escapeHtml(item.board)}" data-price="${item.pricePerPersonEur}" data-search="${escapeHtml([item.provider, item.room, BOARD_LABELS[item.board]].filter(Boolean).join(" ").toLocaleLowerCase("de"))}">
      <div class="offer-option-head">
        <div><span class="offer-number">#${index + 1}</span><strong>${escapeHtml(item.provider)}</strong></div>
        ${renderBoardBadge(item.board)}
      </div>
      <div class="offer-option-facts">
        <span><strong>${escapeHtml(item.departureAirport)}</strong></span>
        <span>${shortDate(item.departureDate, locale)}–${shortDate(item.returnDate, locale)}</span>
        <span>${item.nights} Nächte</span>
      </div>
      <p class="offer-room">${escapeHtml(BOARD_LABELS[item.board])} · ${escapeHtml(item.room || "Doppelzimmer")}</p>
      <div class="offer-option-bottom">
        <div class="offer-price"><strong>${eur(item.pricePerPersonEur, locale)} p. P.</strong><span>${eur(item.totalPriceEur, locale)} gesamt für ${travelers}</span></div>
        <a class="offer-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer nofollow">Zum Angebot <span>↗</span></a>
      </div>
      ${item.evidence ? `<details class="offer-evidence"><summary>Live-Prüfung und Hinweise</summary><p>${escapeHtml(item.evidence)}</p></details>` : ""}
    </div>`;
}

function renderRestaurantInfo(info) {
  if (!info || typeof info !== "object" || !Array.isArray(info.venues) || info.venues.length === 0) return "";
  const typeLabel = (type) => type === "buffet" ? "Buffet" : "À la carte";
  const planBadge = (plan, status) => {
    if (!status) return "";
    const label = RESTAURANT_STATUS_LABELS[status] || RESTAURANT_STATUS_LABELS.verify;
    const className = RESTAURANT_STATUS_CLASSES[status] || RESTAURANT_STATUS_CLASSES.verify;
    return `<span class="restaurant-plan restaurant-plan--${className}">${escapeHtml(plan)}: ${escapeHtml(label)}</span>`;
  };
  const venues = info.venues.map((venue) => `
        <div class="restaurant-venue">
          <div class="restaurant-venue-head"><strong>${escapeHtml(venue.name)}</strong><span>${escapeHtml(typeLabel(venue.type))}</span></div>
          <div class="restaurant-plans">${planBadge("AI", venue.allInclusive)}${planBadge("AI+", venue.allInclusivePlus)}</div>
          ${venue.note ? `<p>${escapeHtml(venue.note)}</p>` : ""}
        </div>`).join("");
  const extras = Array.isArray(info.extraCharge) && info.extraCharge.length
    ? `<div class="restaurant-extra"><strong>Gegen Gebühr / nicht enthalten</strong><ul>${info.extraCharge.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`
    : "";
  const sources = Array.isArray(info.sourceUrls) && info.sourceUrls.length
    ? `<div class="restaurant-sources"><strong>Quellen:</strong> ${info.sourceUrls.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(source.label)}</a>`).join(" · ")}</div>`
    : "";
  const verified = info.verifiedAt
    ? new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" }).format(new Date(info.verifiedAt))
    : null;
  return `
      <details class="restaurant-info" data-restaurant-info>
        <summary><span>🍽 Restaurants & AI-Leistungen</span><span class="restaurant-count">${Number(info.total) || info.venues.length} gesamt · ${Number(info.buffet) || 0} Buffet · ${Number(info.aLaCarte) || 0} À la carte</span></summary>
        <div class="restaurant-body">
          <div class="restaurant-list">${venues}</div>
          ${extras}
          ${info.caveat ? `<p class="restaurant-caveat">${escapeHtml(info.caveat)}</p>` : ""}
          ${sources}
          ${verified ? `<p class="restaurant-verified">Restaurantstand geprüft: ${escapeHtml(verified)}</p>` : ""}
        </div>
      </details>`;
}

function renderCard(groupOffers, config, index) {
  const offer = groupOffers[0];
  const locale = config.locale || "de-AT";
  const dealLabel = DEAL_LABELS[offer.dealType];
  const location = [offer.island, offer.atoll].filter(Boolean).join(", ") || "Malediven";
  const quality = [
    offer.ratingOutOf10 != null ? `${offer.ratingOutOf10.toFixed(1)}/10` : null,
    offer.stars != null ? `${offer.stars}★` : null,
    offer.transfer === "included" ? `Transfer inkl.${offer.transferType ? ` · ${offer.transferType}` : ""}` : null,
    offer.baggage === "included" ? "Gepäck inkl." : null,
    LANGUAGE_LABELS[offer.sourceLanguage] || null
  ].filter(Boolean);
  const providers = [...new Set(groupOffers.map((item) => item.provider))];
  const boards = [...new Set(groupOffers.map((item) => item.board))];
  const searchable = groupOffers
    .flatMap((item) => [item.resortName, item.provider, item.island, item.atoll, item.room, BOARD_LABELS[item.board]])
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("de");
  const resortSearchable = [offer.resortName, offer.island, offer.atoll].filter(Boolean).join(" ").toLocaleLowerCase("de");
  const groupId = `resort-${normalizeResortName(offer.resortName).replaceAll(" ", "-")}`;
  const maxScore = Math.max(...groupOffers.map((item) => item.score));
  const maxNights = Math.max(...groupOffers.map((item) => item.nights));
  const imageUrls = groupOffers
    .flatMap((item) => Array.isArray(item.imageUrls) ? item.imageUrls : [])
    .filter((url, imageIndex, urls) => /^https:\/\//.test(url) && urls.indexOf(url) === imageIndex)
    .slice(0, 3);
  const gallery = imageUrls.length
    ? `<div class="deal-gallery" aria-label="Bilder von ${escapeHtml(offer.resortName)}">${imageUrls.map((url, imageIndex) => `<div class="gallery-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(offer.resortName)} – Bild ${imageIndex + 1}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true"></div>`).join("")}</div>`
    : `<div class="deal-gallery deal-gallery--fallback" aria-label="Kein Resortbild verfügbar"><span>🌴</span></div>`;

  return `
    <article class="deal-card" data-offer-card data-id="${escapeHtml(groupId)}" data-price="${offer.pricePerPersonEur}" data-score="${maxScore}" data-nights="${maxNights}" data-search="${escapeHtml(searchable)}" data-resort-search="${escapeHtml(resortSearchable)}">
      ${gallery}
      <div class="card-topline">
        <div class="badges">
          <span class="badge badge--status badge--${escapeHtml(offer.dealStatus)}">${escapeHtml(STATUS_LABELS[offer.dealStatus])}</span>
          ${boards.map(renderBoardBadge).join("")}
          ${dealLabel ? `<span class="badge badge--deal">${escapeHtml(dealLabel)}</span>` : ""}
          ${groupOffers.some((item) => item.membershipRequired) ? `<span class="badge badge--member">Login nötig</span>` : ""}
        </div>
        <button class="favorite" type="button" data-favorite="${escapeHtml(groupId)}" aria-label="Resort merken" aria-pressed="false">☆</button>
      </div>

      <div class="rank">#${index + 1} · bester Deal-Score ${maxScore}</div>
      <h2>${escapeHtml(offer.resortName)}</h2>
      <p class="location">${escapeHtml(location)} · ${groupOffers.length} ${groupOffers.length === 1 ? "Angebot" : "Angebote"} von ${providers.length} ${providers.length === 1 ? "Anbieter" : "Anbietern"}</p>

      <div class="price-row">
        <div><strong>ab ${eur(offer.pricePerPersonEur, locale)}</strong><span>pro Person</span></div>
        ${offer.dealStatus === "price_drop" && offer.previousPricePerPersonEur
          ? `<div class="old-price">vorher ${eur(offer.previousPricePerPersonEur, locale)}</div>`
          : ""}
      </div>
      <p class="total">${eur(offer.totalPriceEur, locale)} gesamt für ${config.travelers} Personen · günstigstes Angebot</p>

      <div class="trip-facts">
        <div class="airport">${escapeHtml(offer.departureAirport)}</div>
        <div><strong>${shortDate(offer.departureDate, locale)}–${shortDate(offer.returnDate, locale)}</strong><span>${offer.nights} Nächte</span></div>
        <div><strong>${escapeHtml(BOARD_LABELS[offer.board])}</strong><span>${escapeHtml(offer.room || "Doppelzimmer")}</span></div>
      </div>

      ${quality.length ? `<div class="quality">${quality.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      ${offer.bookingDeadline ? `<p class="deadline">Nur bis ${escapeHtml(offer.bookingDeadline)} buchbar</p>` : ""}

      ${renderRestaurantInfo(offer.restaurantInfo)}

      <details class="offer-options" data-offer-options>
        <summary><span>${groupOffers.length} ${groupOffers.length === 1 ? "Anbieterangebot" : "Anbieterangebote"}</span><span class="summary-hint">günstigstes zuerst</span></summary>
        <div class="offer-list">${groupOffers.map((item, offerIndex) => renderProviderOffer(item, locale, config.travelers, offerIndex)).join("")}</div>
      </details>

      <details class="deal-reasons">
        <summary>Warum ist das günstigste ein Deal?</summary>
        <p>${escapeHtml((offer.reasons || []).join(" · ") || "Erfüllt alle Suchkriterien")}</p>
      </details>

      <a class="deal-link" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener noreferrer nofollow">Günstigstes Angebot prüfen <span>↗</span></a>
    </article>`;
}

export function renderSite({ offers, config, warnings = [], generatedAt = new Date() }) {
  const locale = config.locale || "de-AT";
  const groups = groupOffersByResort(offers);
  const aiPlusCount = offers.filter((offer) => offer.board === "all_inclusive_plus").length;
  const aiCount = offers.filter((offer) => offer.board === "all_inclusive").length;
  const bestPrice = offers.length ? Math.min(...offers.map((offer) => offer.pricePerPersonEur)) : null;
  const cards = groups.map((group, index) => renderCard(group, config, index)).join("");
  const updated = generatedAt.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: config.timezone
  });

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#063c43">
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="Aktuelle Malediven-Pauschalreisen mit All Inclusive oder All Inclusive Plus ab München, Zürich und Wien.">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8C%B4%3C/text%3E%3C/svg%3E">
  <title>Malediven Deal Radar</title>
  <style>
    :root{--ink:#0d3035;--muted:#5d7477;--teal:#087f8c;--teal-dark:#07545d;--aqua:#dff7f3;--sand:#fff9ed;--coral:#f97360;--line:#d8e8e6;--white:#fff;--shadow:0 18px 55px rgba(5,55,61,.11)}
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;background:#eef8f6;color:var(--ink);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    button,select,input{font:inherit}
    button,a{-webkit-tap-highlight-color:transparent}
    .hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#063c43 0%,#087f8c 58%,#24a89d 100%);color:#fff;padding:calc(28px + env(safe-area-inset-top)) 18px 96px}
    .hero:before,.hero:after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.08)}
    .hero:before{width:240px;height:240px;right:-90px;top:-80px}
    .hero:after{width:180px;height:180px;left:-100px;bottom:-90px}
    .hero-inner{position:relative;z-index:1;max-width:1080px;margin:auto}
    .eyebrow{display:flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:800;color:#bff8ef}
    .pulse{width:9px;height:9px;border-radius:50%;background:#8df2d8;box-shadow:0 0 0 6px rgba(141,242,216,.14)}
    h1{max-width:720px;margin:20px 0 10px;font-size:clamp(38px,7vw,72px);line-height:.98;letter-spacing:-.055em}
    .hero-copy{max-width:700px;margin:0;color:#d5f4f0;font-size:clamp(15px,2vw,19px);line-height:1.55}
    .updated{display:inline-flex;margin-top:22px;padding:8px 12px;border:1px solid rgba(255,255,255,.22);border-radius:999px;color:#eafffb;font-size:13px;background:rgba(4,43,48,.18);backdrop-filter:blur(8px)}
    .page{max-width:1080px;margin:-62px auto 0;position:relative;z-index:2;padding:0 18px 60px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid rgba(255,255,255,.65);border-radius:22px;box-shadow:var(--shadow);overflow:hidden}
    .stat{padding:20px 22px;border-right:1px solid var(--line)}
    .stat:last-child{border:0}.stat strong{display:block;font-size:24px;letter-spacing:-.03em}.stat span{display:block;margin-top:4px;color:var(--muted);font-size:12px}
    .filters{margin:24px 0 18px;background:rgba(255,255,255,.91);border:1px solid var(--line);border-radius:20px;padding:16px;box-shadow:0 8px 30px rgba(5,55,61,.05);backdrop-filter:blur(12px)}
    .search{position:relative}.search span{position:absolute;left:14px;top:12px;color:var(--muted)}
    .search input{width:100%;height:46px;border:1px solid var(--line);border-radius:12px;padding:0 14px 0 40px;background:#f9fcfb;color:var(--ink);outline:none}.search input:focus{border-color:#62bdb5;box-shadow:0 0 0 3px rgba(98,189,181,.15)}
    .filter-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center}
    .chip{border:1px solid var(--line);background:#fff;color:var(--ink);min-height:40px;padding:8px 14px;border-radius:999px;cursor:pointer;font-weight:700;font-size:13px}.chip[aria-pressed="true"]{background:var(--teal-dark);border-color:var(--teal-dark);color:#fff}.chip--saved{margin-left:auto}
    select{height:40px;border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);padding:0 34px 0 11px;font-size:13px;font-weight:650}
    .results-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:28px 2px 14px}.results-head h2{font-size:24px;margin:0;letter-spacing:-.035em}.results-head p{margin:3px 0 0;color:var(--muted);font-size:13px}.result-count{font-weight:800;color:var(--teal-dark);white-space:nowrap}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .deal-card{background:#fff;border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 10px 35px rgba(6,60,67,.06);display:flex;flex-direction:column;min-width:0;transition:transform .2s ease,box-shadow .2s ease}.deal-card:hover{transform:translateY(-2px);box-shadow:0 18px 45px rgba(6,60,67,.1)}
    .deal-gallery{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:repeat(2,92px);gap:3px;margin:-20px -20px 18px;overflow:hidden;border-radius:21px 21px 12px 12px;background:linear-gradient(135deg,#b9eee5,#f7deb0)}.gallery-image{min-width:0;min-height:0;background:linear-gradient(135deg,#8ed8cd,#f3cf91)}.gallery-image:first-child{grid-row:1/3}.gallery-image img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s ease}.deal-card:hover .gallery-image img{transform:scale(1.025)}.deal-gallery--fallback{display:flex;align-items:center;justify-content:center;height:184px;color:#fff;font-size:46px}.deal-gallery--fallback span{filter:drop-shadow(0 5px 8px rgba(6,60,67,.25))}
    .card-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.badges{display:flex;flex-wrap:wrap;gap:6px}.badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:10px;line-height:1;font-weight:850;text-transform:uppercase;letter-spacing:.055em}.badge--status{background:#e5f7f3;color:#07675f}.badge--price_drop{background:#fff0e6;color:#b04422}.badge--board-plus{background:#dff7f3;color:#07545d}.badge--board-ai{background:#eef2f6;color:#405466}.badge--deal{background:#fff3c6;color:#8d5d00}.badge--member{background:#eee9ff;color:#5f3bb1}
    .favorite{flex:0 0 auto;width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#fff;color:#ad7d00;font-size:23px;line-height:1;cursor:pointer}.favorite[aria-pressed="true"]{background:#fff5ca;border-color:#f0d979}.rank{margin-top:17px;color:var(--teal);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.08em}
    .deal-card h2{font-size:22px;line-height:1.14;letter-spacing:-.035em;margin:7px 0 5px}.location{color:var(--muted);font-size:13px;line-height:1.4;margin:0;min-height:36px}
    .price-row{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-top:20px}.price-row strong{display:block;font-size:31px;letter-spacing:-.045em}.price-row span{display:block;color:var(--muted);font-size:11px}.old-price{color:#9b6a59;font-size:12px;text-decoration:line-through}.total{margin:5px 0 16px;color:var(--muted);font-size:12px}
    .trip-facts{display:grid;grid-template-columns:auto 1fr;gap:12px 13px;padding:15px;background:var(--aqua);border-radius:15px}.trip-facts>div{min-width:0}.trip-facts>div:last-child{grid-column:2}.trip-facts strong,.trip-facts span{display:block}.trip-facts strong{font-size:13px}.trip-facts span{margin-top:2px;color:#426b6b;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.airport{grid-row:1/3;display:flex;align-items:center;justify-content:center;min-width:55px;border-radius:12px;background:#fff;color:var(--teal-dark);font-weight:900;font-size:16px;box-shadow:0 4px 14px rgba(6,60,67,.08)}
    .quality{display:flex;flex-wrap:wrap;gap:6px;margin:13px 0}.quality span{padding:5px 8px;background:#f5f8f8;border-radius:7px;color:#48666a;font-size:11px}.deadline{margin:12px 0 0;color:#a74223;font-size:12px;font-weight:750}
    details{margin-top:14px;border-top:1px solid #edf3f2;padding-top:12px;color:var(--muted);font-size:12px}summary{cursor:pointer;color:#375c60;font-weight:750}details p{line-height:1.5}.evidence{font-size:11px}
    .offer-options{margin:16px 0 14px;border:1px solid #bcded9;border-radius:14px;padding:0;overflow:hidden;background:#f7fcfb;color:var(--ink)}.offer-options>summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 15px;list-style:none;background:#e8f8f5;color:var(--teal-dark);font-size:13px;font-weight:850}.offer-options>summary::-webkit-details-marker{display:none}.offer-options>summary:after{content:"＋";font-size:17px;line-height:1}.offer-options[open]>summary:after{content:"−"}.summary-hint{margin-left:auto;color:#5a7a7b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.055em}.offer-list{display:grid;gap:9px;padding:10px}.offer-option{padding:12px;border:1px solid var(--line);border-radius:11px;background:#fff}.offer-option-head,.offer-option-head>div,.offer-option-bottom{display:flex;align-items:center}.offer-option-head{justify-content:space-between;gap:10px}.offer-option-head>div{gap:7px}.offer-number{color:var(--teal);font-size:10px;font-weight:850}.offer-option-head strong{font-size:13px}.offer-option-facts{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.offer-option-facts span{padding:4px 7px;border-radius:6px;background:#eef7f5;color:#315d60;font-size:10px}.offer-room{margin:8px 0;color:#536f72;font-size:11px}.offer-option-bottom{justify-content:space-between;gap:12px}.offer-price strong,.offer-price span{display:block}.offer-price strong{font-size:14px}.offer-price span{margin-top:2px;color:var(--muted);font-size:10px}.offer-link{display:inline-flex;align-items:center;gap:5px;flex:0 0 auto;padding:8px 10px;border-radius:8px;background:var(--teal-dark);color:#fff;text-decoration:none;font-size:11px;font-weight:800}.offer-link:hover{background:#043e45}.offer-evidence{margin-top:9px;padding-top:8px}.offer-evidence summary{font-size:10px}.offer-evidence p{margin:6px 0 0;color:#647b7e;font-size:10px}.restaurant-info{margin:14px 0 0;border:1px solid #d7e8e5;border-radius:14px;padding:0;overflow:hidden;background:#fffdf7;color:var(--ink)}.restaurant-info>summary{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;list-style:none;background:#fff6dc;color:#694d12;font-size:12px;font-weight:850}.restaurant-info>summary::-webkit-details-marker{display:none}.restaurant-info>summary:after{content:"＋";font-size:16px}.restaurant-info[open]>summary:after{content:"−"}.restaurant-count{margin-left:auto;color:#7c6840;font-size:9px;font-weight:750;text-align:right}.restaurant-body{padding:10px}.restaurant-list{display:grid;gap:8px}.restaurant-venue{padding:10px;border:1px solid #eadfca;border-radius:10px;background:#fff}.restaurant-venue-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.restaurant-venue-head strong{font-size:12px}.restaurant-venue-head>span{color:#76664a;font-size:9px;text-transform:uppercase;letter-spacing:.05em}.restaurant-plans{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.restaurant-plan{display:inline-flex;padding:4px 6px;border-radius:999px;font-size:9px;font-weight:800}.restaurant-plan--included{background:#dcfce7;color:#166534}.restaurant-plan--limited{background:#fef3c7;color:#854d0e}.restaurant-plan--chargeable{background:#fee2e2;color:#991b1b}.restaurant-plan--restricted,.restaurant-plan--verify{background:#e2e8f0;color:#475569}.restaurant-venue p{margin:7px 0 0;color:#5b6f70;font-size:10px;line-height:1.45}.restaurant-extra{margin-top:10px;padding:10px;border-radius:10px;background:#fff1ed;color:#8a3b24;font-size:10px}.restaurant-extra ul{margin:6px 0 0;padding-left:17px}.restaurant-extra li+li{margin-top:3px}.restaurant-caveat{margin:10px 0 0;color:#6a6459;font-size:10px;line-height:1.5}.restaurant-sources{margin-top:9px;color:#647b7e;font-size:9px;line-height:1.45}.restaurant-sources a{color:var(--teal-dark)}.restaurant-verified{margin:7px 0 0;color:#718385;font-size:9px}.deal-reasons{margin-top:10px}
    .deal-link{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding:14px 16px;border-radius:12px;background:var(--teal-dark);color:#fff;text-decoration:none;font-size:14px;font-weight:800}.deal-link:hover{background:#043e45}.deal-link span{font-size:18px}
    .empty{display:none;grid-column:1/-1;text-align:center;background:#fff;border:1px dashed #bdd4d2;border-radius:20px;padding:44px 20px;color:var(--muted)}.empty.visible{display:block}
    .notice{margin-top:24px;padding:18px;border-radius:16px;background:var(--sand);border:1px solid #f4dfb7;color:#6d5833;font-size:12px;line-height:1.55}.warning{margin-top:12px;color:#9a3412}
    footer{max-width:760px;margin:30px auto 0;text-align:center;color:#678083;font-size:11px;line-height:1.6}
    [hidden]{display:none!important}
    @media(max-width:760px){.hero{padding-left:16px;padding-right:16px;padding-bottom:82px}.page{padding-left:12px;padding-right:12px}.stats{grid-template-columns:repeat(2,1fr);border-radius:18px}.stat{padding:15px}.stat:nth-child(2){border-right:0}.stat:nth-child(-n+2){border-bottom:1px solid var(--line)}.stat strong{font-size:20px}.grid{grid-template-columns:1fr}.filters{padding:12px}.filter-row{gap:8px}.chip--saved{margin-left:0}.deal-card{padding:17px;border-radius:19px}.deal-gallery{margin:-17px -17px 16px;border-radius:18px 18px 11px 11px;grid-template-rows:repeat(2,82px)}.deal-gallery--fallback{height:164px}.results-head{margin-top:22px}.results-head h2{font-size:21px}.offer-options>summary{padding:13px}.offer-option-bottom{align-items:flex-end}}
    @media(max-width:390px){h1{font-size:39px}.filter-row select{width:100%}.chip{flex:1}.chip--saved{flex-basis:100%}.price-row strong{font-size:28px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.deal-card{transition:none}}
  </style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <div class="eyebrow"><span class="pulse"></span> 2× täglich frisch gesucht</div>
      <h1>Malediven<br>Deal Radar</h1>
      <p class="hero-copy">Handverlesene Pauschalreisen mit Flug ab München, Zürich oder Wien – mindestens ${config.minimumNights} Nächte. All Inclusive und All Inclusive Plus/Premium/Ultra werden getrennt ausgewiesen. Nur seriöse Angebotsseiten auf Deutsch oder Englisch.</p>
      <div class="updated">Aktualisiert: ${escapeHtml(updated)} Uhr</div>
    </div>
  </header>

  <main class="page">
    <section class="stats" aria-label="Zusammenfassung">
      <div class="stat"><strong>${groups.length}</strong><span>Resorts · ${offers.length} Angebote</span></div>
      <div class="stat"><strong>${aiPlusCount}</strong><span>AI+ / Premium / Ultra</span></div>
      <div class="stat"><strong>${aiCount}</strong><span>All Inclusive</span></div>
      <div class="stat"><strong>${bestPrice == null ? "–" : eur(bestPrice, locale)}</strong><span>bester Preis p. P.</span></div>
    </section>

    <section class="filters" aria-label="Angebote filtern">
      <label class="search"><span>⌕</span><input id="search" type="search" autocomplete="off" placeholder="Resort, Insel oder Anbieter suchen" aria-label="Angebote durchsuchen"></label>
      <div class="filter-row">
        <button class="chip" type="button" data-airport-filter="all" aria-pressed="true">Alle Flughäfen</button>
        ${config.departureAirports.map((airport) => `<button class="chip" type="button" data-airport-filter="${escapeHtml(airport.code)}" aria-pressed="false">${escapeHtml(airport.code)}</button>`).join("")}
        <select id="board" aria-label="Verpflegung filtern"><option value="all">AI & AI+</option><option value="all_inclusive_plus">Nur AI+</option><option value="all_inclusive">Nur AI</option></select>
        <select id="price" aria-label="Maximalpreis filtern"><option value="${config.maximumPricePerPersonEur}">Bis ${eur(config.maximumPricePerPersonEur, locale)}</option><option value="3000">Bis 3.000 €</option><option value="3500">Bis 3.500 €</option></select>
        <select id="sort" aria-label="Angebote sortieren"><option value="score">Beste zuerst</option><option value="price">Günstigste zuerst</option><option value="nights">Längste zuerst</option></select>
        <button class="chip chip--saved" id="saved-only" type="button" aria-pressed="false">★ Gemerkte</button>
      </div>
    </section>

    <div class="results-head">
      <div><h2>Aktuelle Funde</h2><p>${fullDate(config.windowStart, locale)}–${fullDate(config.windowEnd, locale)}</p></div>
      <div class="result-count" id="result-count">${groups.length} Resorts · ${offers.length} Angebote</div>
    </div>

    <section class="grid" id="deal-grid" aria-live="polite">
      ${cards}
      <div class="empty" id="empty"><strong>Keine passenden Angebote</strong><br>Es erscheint nur, was alle Kriterien erfüllt und auf einer seriösen deutschen oder englischen Angebotsseite belegt ist.</div>
    </section>

    <aside class="notice">
      <strong>Vor der Buchung kurz gegenprüfen:</strong> All Inclusive und All Inclusive Plus/Premium/Ultra sind auf der Seite getrennt gekennzeichnet. Angezeigt werden nur ausgewählte seriöse Quellen mit deutscher oder englischer Angebotsseite. Preise, Restaurantöffnungen und Verfügbarkeiten ändern sich schnell. Bitte dort Reisedaten, Abflughafen, Gepäck, Transfer, genaue Verpflegungsstufe, Restaurantleistungen und Endpreis für ${config.travelers} Personen bestätigen. Mitgliederpreise sind entsprechend markiert.
      ${warnings.length ? `<div class="warning"><strong>Hinweis zur aktuellen Suche:</strong> ${warnings.map(escapeHtml).join(" · ")}</div>` : ""}
    </aside>
    <footer>Keine Cookies, kein Tracking, keine Buchung über diese Seite. Favoriten werden ausschließlich im Browser dieses Geräts gespeichert.</footer>
  </main>

  <script>
    (() => {
      const grid = document.querySelector('#deal-grid');
      const cards = [...document.querySelectorAll('[data-offer-card]')];
      const search = document.querySelector('#search');
      const board = document.querySelector('#board');
      const price = document.querySelector('#price');
      const sort = document.querySelector('#sort');
      const count = document.querySelector('#result-count');
      const empty = document.querySelector('#empty');
      const savedOnly = document.querySelector('#saved-only');
      const airportButtons = [...document.querySelectorAll('[data-airport-filter]')];
      const storageKey = 'maldives-deal-favorites';
      let airport = 'all';
      let favorites;
      try { favorites = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { favorites = new Set(); }

      const updateFavoriteButtons = () => {
        document.querySelectorAll('[data-favorite]').forEach((button) => {
          const active = favorites.has(button.dataset.favorite);
          button.setAttribute('aria-pressed', String(active));
          button.textContent = active ? '★' : '☆';
          button.setAttribute('aria-label', active ? 'Aus Favoriten entfernen' : 'Angebot merken');
        });
      };

      const apply = () => {
        const needle = search.value.trim().toLocaleLowerCase('de');
        const maxPrice = Number(price.value);
        const boardValue = board.value;
        const onlySaved = savedOnly.getAttribute('aria-pressed') === 'true';
        const visible = cards.filter((card) => {
          const resortTextMatches = !needle || card.dataset.resortSearch.includes(needle);
          const matchingOptions = [...card.querySelectorAll('[data-provider-offer]')].filter((option) => {
            const matches = (airport === 'all' || option.dataset.airport === airport)
              && (boardValue === 'all' || option.dataset.board === boardValue)
              && Number(option.dataset.price) <= maxPrice
              && (!needle || resortTextMatches || option.dataset.search.includes(needle));
            option.hidden = !matches;
            return matches;
          });
          const matches = matchingOptions.length > 0
            && (!needle || card.dataset.search.includes(needle))
            && (!onlySaved || favorites.has(card.dataset.id));
          card.hidden = !matches;
          return matches;
        });
        visible.sort((a, b) => sort.value === 'price'
          ? Number(a.dataset.price) - Number(b.dataset.price)
          : sort.value === 'nights'
            ? Number(b.dataset.nights) - Number(a.dataset.nights)
            : Number(b.dataset.score) - Number(a.dataset.score));
        visible.forEach((card) => grid.insertBefore(card, empty));
        const visibleOffers = visible.reduce((sum, card) => sum + [...card.querySelectorAll('[data-provider-offer]')].filter((option) => !option.hidden).length, 0);
        count.textContent = visible.length + (visible.length === 1 ? ' Resort · ' : ' Resorts · ') + visibleOffers + (visibleOffers === 1 ? ' Angebot' : ' Angebote');
        empty.classList.toggle('visible', visible.length === 0);
      };

      airportButtons.forEach((button) => button.addEventListener('click', () => {
        airport = button.dataset.airportFilter;
        airportButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        apply();
      }));
      [search, board, price, sort].forEach((control) => control.addEventListener(control === search ? 'input' : 'change', apply));
      savedOnly.addEventListener('click', () => {
        savedOnly.setAttribute('aria-pressed', String(savedOnly.getAttribute('aria-pressed') !== 'true'));
        apply();
      });
      document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => {
        const id = button.dataset.favorite;
        favorites.has(id) ? favorites.delete(id) : favorites.add(id);
        try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch {}
        updateFavoriteButtons();
        apply();
      }));
      updateFavoriteButtons();
      apply();
    })();
  </script>
</body>
</html>`;
}
