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

function renderCard(offer, config, index) {
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
  const searchable = [offer.resortName, offer.provider, offer.island, offer.atoll].filter(Boolean).join(" ").toLocaleLowerCase("de");
  const imageUrls = Array.isArray(offer.imageUrls) ? offer.imageUrls.filter((url) => /^https:\/\//.test(url)).slice(0, 3) : [];
  const gallery = imageUrls.length
    ? `<div class="deal-gallery" aria-label="Bilder von ${escapeHtml(offer.resortName)}">${imageUrls.map((url, imageIndex) => `<div class="gallery-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(offer.resortName)} – Bild ${imageIndex + 1}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true"></div>`).join("")}</div>`
    : `<div class="deal-gallery deal-gallery--fallback" aria-label="Kein Resortbild verfügbar"><span>🌴</span></div>`;

  return `
    <article class="deal-card" data-offer-card data-id="${escapeHtml(offer.id)}" data-airport="${escapeHtml(offer.departureAirport)}" data-board="${escapeHtml(offer.board)}" data-price="${offer.pricePerPersonEur}" data-score="${offer.score}" data-nights="${offer.nights}" data-search="${escapeHtml(searchable)}">
      ${gallery}
      <div class="card-topline">
        <div class="badges">
          <span class="badge badge--status badge--${escapeHtml(offer.dealStatus)}">${escapeHtml(STATUS_LABELS[offer.dealStatus])}</span>
          <span class="badge badge--board badge--${offer.board === "all_inclusive_plus" ? "board-plus" : "board-ai"}" title="${escapeHtml(BOARD_LABELS[offer.board])}">${escapeHtml(BOARD_BADGES[offer.board])}</span>
          ${dealLabel ? `<span class="badge badge--deal">${escapeHtml(dealLabel)}</span>` : ""}
          ${offer.membershipRequired ? `<span class="badge badge--member">Login nötig</span>` : ""}
        </div>
        <button class="favorite" type="button" data-favorite="${escapeHtml(offer.id)}" aria-label="Angebot merken" aria-pressed="false">☆</button>
      </div>

      <div class="rank">#${index + 1} · Deal-Score ${offer.score}</div>
      <h2>${escapeHtml(offer.resortName)}</h2>
      <p class="location">${escapeHtml(location)} · ${escapeHtml(offer.provider)}</p>

      <div class="price-row">
        <div><strong>${eur(offer.pricePerPersonEur, locale)}</strong><span>pro Person</span></div>
        ${offer.dealStatus === "price_drop" && offer.previousPricePerPersonEur
          ? `<div class="old-price">vorher ${eur(offer.previousPricePerPersonEur, locale)}</div>`
          : ""}
      </div>
      <p class="total">${eur(offer.totalPriceEur, locale)} gesamt für ${config.travelers} Personen · ${offer.priceConfidence === "live" ? "Live-Preis" : offer.priceConfidence === "recent" ? "aktueller Fund" : "Richtpreis"}</p>

      <div class="trip-facts">
        <div class="airport">${escapeHtml(offer.departureAirport)}</div>
        <div><strong>${shortDate(offer.departureDate, locale)}–${shortDate(offer.returnDate, locale)}</strong><span>${offer.nights} Nächte</span></div>
        <div><strong>${escapeHtml(BOARD_LABELS[offer.board])}</strong><span>${escapeHtml(offer.room || "Doppelzimmer")}</span></div>
      </div>

      ${quality.length ? `<div class="quality">${quality.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      ${offer.bookingDeadline ? `<p class="deadline">Nur bis ${escapeHtml(offer.bookingDeadline)} buchbar</p>` : ""}

      <details>
        <summary>Warum dieser Deal?</summary>
        <p>${escapeHtml(offer.reasons.join(" · ") || "Erfüllt alle Suchkriterien")}</p>
        ${offer.evidence ? `<p class="evidence">Quellenhinweis: ${escapeHtml(offer.evidence)}</p>` : ""}
      </details>

      <a class="deal-link" href="${escapeHtml(offer.url)}" target="_blank" rel="noopener noreferrer nofollow">Angebot beim Anbieter prüfen <span>↗</span></a>
    </article>`;
}

export function renderSite({ offers, config, warnings = [], generatedAt = new Date() }) {
  const locale = config.locale || "de-AT";
  const aiPlusCount = offers.filter((offer) => offer.board === "all_inclusive_plus").length;
  const aiCount = offers.filter((offer) => offer.board === "all_inclusive").length;
  const bestPrice = offers.length ? Math.min(...offers.map((offer) => offer.pricePerPersonEur)) : null;
  const cards = offers.map((offer, index) => renderCard(offer, config, index)).join("");
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
    .deal-link{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding:14px 16px;border-radius:12px;background:var(--teal-dark);color:#fff;text-decoration:none;font-size:14px;font-weight:800}.deal-link:hover{background:#043e45}.deal-link span{font-size:18px}
    .empty{display:none;grid-column:1/-1;text-align:center;background:#fff;border:1px dashed #bdd4d2;border-radius:20px;padding:44px 20px;color:var(--muted)}.empty.visible{display:block}
    .notice{margin-top:24px;padding:18px;border-radius:16px;background:var(--sand);border:1px solid #f4dfb7;color:#6d5833;font-size:12px;line-height:1.55}.warning{margin-top:12px;color:#9a3412}
    footer{max-width:760px;margin:30px auto 0;text-align:center;color:#678083;font-size:11px;line-height:1.6}
    [hidden]{display:none!important}
    @media(max-width:760px){.hero{padding-left:16px;padding-right:16px;padding-bottom:82px}.page{padding-left:12px;padding-right:12px}.stats{grid-template-columns:repeat(2,1fr);border-radius:18px}.stat{padding:15px}.stat:nth-child(2){border-right:0}.stat:nth-child(-n+2){border-bottom:1px solid var(--line)}.stat strong{font-size:20px}.grid{grid-template-columns:1fr}.filters{padding:12px}.filter-row{gap:8px}.chip--saved{margin-left:0}.deal-card{padding:17px;border-radius:19px}.deal-gallery{margin:-17px -17px 16px;border-radius:18px 18px 11px 11px;grid-template-rows:repeat(2,82px)}.deal-gallery--fallback{height:164px}.results-head{margin-top:22px}.results-head h2{font-size:21px}}
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
      <div class="stat"><strong>${offers.length}</strong><span>passende Deals</span></div>
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
        <select id="price" aria-label="Maximalpreis filtern"><option value="99999">Bis ${eur(config.maximumPricePerPersonEur, locale)}</option><option value="3000">Bis 3.000 €</option><option value="3500">Bis 3.500 €</option></select>
        <select id="sort" aria-label="Angebote sortieren"><option value="score">Beste zuerst</option><option value="price">Günstigste zuerst</option><option value="nights">Längste zuerst</option></select>
        <button class="chip chip--saved" id="saved-only" type="button" aria-pressed="false">★ Gemerkte</button>
      </div>
    </section>

    <div class="results-head">
      <div><h2>Aktuelle Funde</h2><p>${fullDate(config.windowStart, locale)}–${fullDate(config.windowEnd, locale)}</p></div>
      <div class="result-count" id="result-count">${offers.length} angezeigt</div>
    </div>

    <section class="grid" id="deal-grid" aria-live="polite">
      ${cards}
      <div class="empty" id="empty"><strong>Keine passenden Angebote</strong><br>Es erscheint nur, was alle Kriterien erfüllt und auf einer seriösen deutschen oder englischen Angebotsseite belegt ist.</div>
    </section>

    <aside class="notice">
      <strong>Vor der Buchung kurz gegenprüfen:</strong> All Inclusive und All Inclusive Plus/Premium/Ultra sind auf der Seite getrennt gekennzeichnet. Angezeigt werden nur ausgewählte seriöse Quellen mit deutscher oder englischer Angebotsseite. Preise und Verfügbarkeiten ändern sich schnell. Bitte dort Reisedaten, Abflughafen, Gepäck, Transfer, genaue Verpflegungsstufe und Endpreis für ${config.travelers} Personen bestätigen. Mitgliederpreise sind entsprechend markiert.
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
          const matches = (airport === 'all' || card.dataset.airport === airport)
            && (boardValue === 'all' || card.dataset.board === boardValue)
            && Number(card.dataset.price) <= maxPrice
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
        count.textContent = visible.length + ' angezeigt';
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
