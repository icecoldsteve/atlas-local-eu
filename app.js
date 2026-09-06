const STORAGE = "atlas-local-eu-leads-v1";
const state = {
  tab: "playbook",
  country: "BE",
  city: "Antwerp",
  niche: "roofer",
  engine: "Grok",
  clients: 8,
  fee: 549,
  draft: {
    name: "Dakwerken Vermeulen",
    type: "dakwerker",
    rating: "4.6",
    reviews: "37",
    years: "12+",
    website: "none",
    observation: "strong storm-damage reviews but the listed site is a broken WordPress page from 2015",
    language: "NL",
  },
  leads: [],
};

function countryOf(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}
function nicheOf(id) {
  return NICHES.find((n) => n.id === id) || NICHES[0];
}
function cityOf() {
  return CITIES.find((c) => c.name === state.city && c.country === state.country) || CITIES.find((c) => c.country === state.country) || CITIES[0];
}
function langKey(rule) {
  return rule.language.split(" / ")[0];
}
function mapsUrl(query, city) {
  return `https://www.google.com/maps/search/${encodeURIComponent(`${query} ${city.mapsQuery}`)}`;
}
function loadLeads() {
  try { state.leads = JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { state.leads = []; }
}
function saveLeads() {
  localStorage.setItem(STORAGE, JSON.stringify(state.leads));
}

function strategistPrompt() {
  const rule = countryOf(state.country);
  const city = cityOf();
  const d = state.draft;
  return `You are a senior local-marketing strategist working only in the European market (${rule.name}). Currency is EUR. Do not use US examples, US cities, USD, or US legal assumptions.\n\nFor each business in the list, generate three deliverables in ${langKey(rule)} first, then a short English gloss if the primary language is not English.\n\n1. Diagnosis (50 words): what is wrong with their current online presence and what revenue is leaking because of it. Be concrete. No buzzwords. Reference European search behaviour (Google Maps / Local Pack).\n\n2. Site brief (100 words): hero angle, key services to highlight, tone that fits this trade in ${rule.name}, the call to action that will convert (call, WhatsApp, or form), one design choice that sets them apart from nearby competitors.\n\n3. Opening message (under 70 words): opens with one specific observation about THIS business, references their actual service or commune, ends with a soft ask to look at a mockup. Sound like a neighbour who looked them up. No corporate language. No mention of AI, ChatGPT, Grok, Claude, or Lovable.\n\nCompliance for ${rule.name}: ${rule.note}\nPreferred channels in order: ${rule.preferred.join(", ")}.\nIf email is not preferred, write the message so it can be spoken on the phone or pasted into a GBP/website form.\n\nFormat as a clean table: Business | Diagnosis | Site brief | Message | Suggested channel.\n\nHere is the list:\n${d.name}, ${d.type}, ${city.name}, ${d.years} years, ${d.rating}★, ${d.reviews} reviews, website=${d.website}, ${d.observation}`;
}

function lovablePrompt() {
  const d = state.draft;
  const city = cityOf();
  return `Build a landing page for ${d.name}, a ${d.type} in ${city.name}, ${state.country}.\n\nAudience: local residents and property managers in and around ${city.name} who need this trade this week.\nBrand feel: grounded, craft-led, trustworthy.\nHero focus: ${d.observation}.\n\nSections in order:\n1. Hero with primary CTA (Call now + WhatsApp or request a visit)\n2. Three core services\n3. About with credibility positioning\n4. Social proof placeholder\n5. Final CTA, not Welcome to\n\nDesign: deep forest green + warm paper + copper accents, mobile-first, no flashy effects.\nTone: ${d.language}. Use € if prices appear. Never use $.\n\nAvoid: AI gradients, American suburb stock photos, Welcome to, Your trusted partner.`;
}

function outreachMessage() {
  const d = state.draft;
  const city = cityOf();
  return `Hi, I was looking at ${d.name} on Google Maps — ${d.observation}. I put together a simple one-page mockup so people in ${city.name} can call you without hunting. Preview is ready if you want a look. No obligation.`;
}

function retainerPitch() {
  const city = cityOf();
  const niche = nicheOf(state.niche);
  return `A new website is a one-off invoice. Ranking in the Google Local Pack in ${city.name} is a monthly system.\n\nWhat you get each month:\n• Google Business Profile kept complete\n• Review replies in the local language\n• Weekly posts for ${niche.label.toLowerCase()} in this commune\n• NAP consistency\n• A short monthly note\n\nLocal Pack placement captures a large share of local-intent taps without a media budget.\nTypical independent trades in the Benelux and DACH pay €449–€749 / month.`;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const prev = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = prev; }, 1400);
  });
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll("[data-panel]").forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== tab));
  if (tab === "prompts" || tab === "outreach" || tab === "retainers" || tab === "hunt") refreshDynamic();
  if (tab === "pipeline") renderPipeline();
}

function refreshDynamic() {
  const rule = countryOf(state.country);
  const city = cityOf();
  const niche = nicheOf(state.niche);
  const term = niche.search[langKey(rule)] || niche.search.NL || niche.search.EN;
  const link = mapsUrl(term, city);
  const citySel = document.getElementById("city");
  if (citySel) {
    citySel.innerHTML = CITIES.filter((c) => c.country === state.country).map((c) => `<option ${c.name === city.name ? "selected" : ""}>${c.name}</option>`).join("");
    state.city = city.name;
  }
  const huntHint = document.getElementById("hunt-hint");
  if (huntHint) huntHint.innerHTML = `Search in Maps as <strong>“${term} ${city.mapsQuery}”</strong>. ${niche.why}`;
  const mapsA = document.getElementById("maps-link");
  if (mapsA) mapsA.href = link;
  const cpc = document.getElementById("cpc");
  if (cpc) cpc.textContent = `Indicative Search CPC for this trade: €${niche.cpcLow.toFixed(1)}–€${niche.cpcHigh.toFixed(1)}`;
  const filter = document.getElementById("filter-copy");
  if (filter) filter.textContent = `Language on the profile: ${rule.language}. Score each listing against the sweet spot before it enters the sheet.`;
  const st = document.getElementById("strategist");
  if (st) st.textContent = strategistPrompt();
  const lv = document.getElementById("lovable");
  if (lv) lv.textContent = lovablePrompt();
  const msg = document.getElementById("message");
  if (msg) msg.textContent = outreachMessage();
  const pitch = document.getElementById("pitch");
  if (pitch) pitch.textContent = retainerPitch();
  const banner = document.getElementById("legal-banner");
  if (banner) {
    banner.className = rule.email === "opt-in" ? "banner alert" : "banner";
    banner.innerHTML = `<strong>${rule.name}: ${rule.email === "opt-in" ? "treat email as opt-in." : "B2B email can work with legitimate interest."}</strong><p style="margin-top:6px">${rule.note}</p><p style="margin-top:8px">Use in this order: ${rule.preferred.join(" → ")}. Do not harvest personal Gmail addresses from Maps.</p>`;
  }
  const engineLabel = document.getElementById("engine-label");
  if (engineLabel) engineLabel.textContent = `Step 2 · ${state.engine}`;
  const copyEngine = document.getElementById("copy-engine");
  if (copyEngine) copyEngine.textContent = `Copy for ${state.engine}`;
  updateMath();
}

function updateMath() {
  const monthly = document.getElementById("monthly");
  const explain = document.getElementById("math-explain");
  if (!monthly) return;
  const niche = nicheOf(state.niche);
  const total = state.clients * state.fee;
  monthly.innerHTML = `€${total.toLocaleString("nl-BE")}<span class="muted"> / month</span>`;
  const low = Math.round(state.clients * 80);
  const high = Math.round(state.clients * 160);
  explain.textContent = `At €${niche.cpcLow.toFixed(1)}–€${niche.cpcHigh.toFixed(1)} CPC for ${niche.label.toLowerCase()}, ${state.clients} clients is in the same conversation as roughly ${low}–${high} paid clicks — without buying the auction.`;
}

function renderPipeline() {
  const root = document.getElementById("pipeline-list");
  if (!root) return;
  if (!state.leads.length) {
    root.innerHTML = `<div class="card"><p class="muted">No names yet. Hunt a commune and tap Save to pipeline.</p></div>`;
    return;
  }
  root.innerHTML = state.leads.map((l) => `
    <article class="lead">
      <header>
        <strong>${escapeHtml(l.name)} · ${escapeHtml(l.type)} · ${escapeHtml(l.city)}</strong>
        <span class="chip">${escapeHtml(l.rating)}★ · ${escapeHtml(l.reviews)} reviews · ${escapeHtml(l.years)}</span>
      </header>
      <p class="muted">${escapeHtml(l.observation)}</p>
      <div class="row" style="margin-top:8px">
        ${["new", "briefed", "mocked", "sent", "won", "no"].map((s) => `<button class="${l.status === s ? "btn" : "btn ghost"}" data-status="${s}" data-id="${l.id}">${s}</button>`).join("")}
        <button class="btn ghost" data-remove="${l.id}">remove</button>
      </div>
    </article>`).join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c]));
}

function bind() {
  document.querySelectorAll(".nav button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  document.getElementById("country").addEventListener("change", (e) => {
    state.country = e.target.value;
    const first = CITIES.find((c) => c.country === state.country);
    if (first) state.city = first.name;
    refreshDynamic();
  });
  document.getElementById("city").addEventListener("change", (e) => { state.city = e.target.value; refreshDynamic(); });
  document.getElementById("niche").addEventListener("change", (e) => { state.niche = e.target.value; refreshDynamic(); });
  ["name", "type", "language", "rating", "reviews", "years", "website", "observation"].forEach((key) => {
    document.getElementById(key).addEventListener("input", (e) => { state.draft[key] = e.target.value; });
  });
  document.getElementById("save-lead").addEventListener("click", () => {
    state.leads.unshift({ id: crypto.randomUUID(), ...state.draft, city: cityOf().name, country: state.country, status: "new" });
    saveLeads();
    setTab("pipeline");
  });
  document.querySelectorAll("[data-engine]").forEach((b) => b.addEventListener("click", () => {
    state.engine = b.dataset.engine;
    document.querySelectorAll("[data-engine]").forEach((x) => x.className = x.dataset.engine === state.engine ? "btn" : "btn ghost");
    refreshDynamic();
  }));
  document.getElementById("copy-strategist").addEventListener("click", (e) => copyText(strategistPrompt(), e.currentTarget));
  document.getElementById("copy-lovable").addEventListener("click", (e) => copyText(lovablePrompt(), e.currentTarget));
  document.getElementById("copy-message").addEventListener("click", (e) => copyText(outreachMessage(), e.currentTarget));
  document.getElementById("copy-pitch").addEventListener("click", (e) => copyText(retainerPitch(), e.currentTarget));
  document.getElementById("copy-maps").addEventListener("click", (e) => copyText(document.getElementById("maps-link").href, e.currentTarget));
  document.getElementById("clients").addEventListener("input", (e) => { state.clients = Number(e.target.value) || 0; updateMath(); });
  document.getElementById("fee").addEventListener("input", (e) => { state.fee = Number(e.target.value) || 0; updateMath(); });
  document.getElementById("pipeline-list").addEventListener("click", (e) => {
    const t = e.target;
    if (t.dataset.remove) {
      state.leads = state.leads.filter((l) => l.id !== t.dataset.remove);
      saveLeads();
      renderPipeline();
    }
    if (t.dataset.status) {
      state.leads = state.leads.map((l) => l.id === t.dataset.id ? { ...l, status: t.dataset.status } : l);
      saveLeads();
      renderPipeline();
    }
  });
}

function fillSelects() {
  document.getElementById("country").innerHTML = COUNTRIES.map((c) => `<option value="${c.code}">${c.name}</option>`).join("");
  document.getElementById("niche").innerHTML = NICHES.map((n) => `<option value="${n.id}">${n.label}</option>`).join("");
  document.getElementById("legal-table").innerHTML = COUNTRIES.map((c) => `<tr><td>${c.name}</td><td>${c.email === "opt-in" ? "opt-in" : "B2B + opt-out"}</td><td>${c.preferred[0]}</td></tr>`).join("");
}

loadLeads();
fillSelects();
bind();
refreshDynamic();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
