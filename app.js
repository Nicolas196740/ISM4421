// FAU Owl Weather — powered by Open-Meteo (free, no API key).
(() => {
  "use strict";

  const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

  // Default: FAU Boca Raton campus
  const FAU_BOCA = {
    name: "FAU Boca Raton",
    region: "Florida, United States",
    latitude: 26.3705,
    longitude: -80.1024,
  };

  // WMO weather codes -> [description, day icon, night icon]
  const WMO = {
    0: ["Clear sky", "☀️", "🌙"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Fog", "🌫️", "🌫️"],
    48: ["Freezing fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Drizzle", "🌦️", "🌧️"],
    55: ["Heavy drizzle", "🌧️", "🌧️"],
    56: ["Freezing drizzle", "🌧️", "🌧️"],
    57: ["Freezing drizzle", "🌧️", "🌧️"],
    61: ["Light rain", "🌦️", "🌧️"],
    63: ["Rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Freezing rain", "🌧️", "🌧️"],
    67: ["Freezing rain", "🌧️", "🌧️"],
    71: ["Light snow", "🌨️", "🌨️"],
    73: ["Snow", "🌨️", "🌨️"],
    75: ["Heavy snow", "❄️", "❄️"],
    77: ["Snow grains", "🌨️", "🌨️"],
    80: ["Rain showers", "🌦️", "🌧️"],
    81: ["Rain showers", "🌧️", "🌧️"],
    82: ["Violent showers", "⛈️", "⛈️"],
    85: ["Snow showers", "🌨️", "🌨️"],
    86: ["Snow showers", "🌨️", "🌨️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm w/ hail", "⛈️", "⛈️"],
    99: ["Thunderstorm w/ hail", "⛈️", "⛈️"],
  };
  const wmo = (code, isDay = 1) => {
    const w = WMO[code] || ["Unknown", "🌡️", "🌡️"];
    return { desc: w[0], icon: isDay ? w[1] : w[2] };
  };

  const $ = (id) => document.getElementById(id);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  let unit = store.get("unit") === "celsius" ? "celsius" : "fahrenheit";
  let place = store.get("place") || FAU_BOCA;

  // ---------- UI helpers ----------
  function setStatus(msg, isError = false) {
    const el = $("status");
    el.textContent = msg;
    el.classList.toggle("error", isError);
  }

  function windDir(deg) {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
  }

  // Open-Meteo returns local times without offset (e.g. "2026-09-28T14:00") when timezone=auto,
  // so parse the pieces directly instead of letting the browser shift them.
  function parseLocal(iso) {
    const [d, t = "00:00"] = iso.split("T");
    const [y, m, day] = d.split("-").map(Number);
    const [h, min] = t.split(":").map(Number);
    return { y, m, day, h, min };
  }
  function fmtHour(iso) {
    const { h } = parseLocal(iso);
    const suffix = h < 12 ? "AM" : "PM";
    return `${h % 12 || 12} ${suffix}`;
  }
  function fmtTime(iso) {
    const { h, min } = parseLocal(iso);
    return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  }
  function fmtDay(iso, i) {
    if (i === 0) return "Today";
    const { y, m, day } = parseLocal(iso);
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  }

  function updateUnitButtons() {
    document.querySelectorAll(".unit-toggle button").forEach((b) => {
      const on = b.dataset.unit === unit;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  // ---------- API ----------
  async function fetchForecast(p) {
    const params = new URLSearchParams({
      latitude: p.latitude,
      longitude: p.longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
      temperature_unit: unit,
      wind_speed_unit: unit === "fahrenheit" ? "mph" : "kmh",
      precipitation_unit: unit === "fahrenheit" ? "inch" : "mm",
      timezone: "auto",
      forecast_days: "7",
    });
    const res = await fetch(`${FORECAST_URL}?${params}`);
    if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
    return res.json();
  }

  async function geocode(query) {
    const params = new URLSearchParams({ name: query, count: "6", language: "en", format: "json" });
    const res = await fetch(`${GEOCODE_URL}?${params}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    return (data.results || []).map((r) => ({
      name: r.name,
      region: [r.admin1, r.country].filter(Boolean).join(", "),
      latitude: r.latitude,
      longitude: r.longitude,
    }));
  }

  // ---------- Render ----------
  function render(data) {
    const c = data.current;
    const d = data.daily;
    const tempU = "°";
    const windU = data.current_units?.wind_speed_10m || (unit === "fahrenheit" ? "mph" : "km/h");
    const now = wmo(c.weather_code, c.is_day);

    $("place-name").textContent = place.name;
    $("updated").textContent = `${place.region ? place.region + " · " : ""}Updated ${fmtTime(c.time)} local time`;
    $("current-icon").textContent = now.icon;
    $("current-temp").textContent = `${Math.round(c.temperature_2m)}${tempU}`;
    $("current-desc").textContent = now.desc;
    $("current-hilo").textContent = `H: ${Math.round(d.temperature_2m_max[0])}${tempU}  ·  L: ${Math.round(d.temperature_2m_min[0])}${tempU}`;
    $("feels").textContent = `${Math.round(c.apparent_temperature)}${tempU}`;
    $("humidity").textContent = `${c.relative_humidity_2m}%`;
    $("wind").textContent = `${Math.round(c.wind_speed_10m)} ${windU} ${windDir(c.wind_direction_10m)}`;
    $("precip").textContent = `${d.precipitation_probability_max[0] ?? 0}%`;
    $("uv").textContent = d.uv_index_max[0] != null ? d.uv_index_max[0].toFixed(1) : "—";
    $("sun").textContent = `${fmtTime(d.sunrise[0])} / ${fmtTime(d.sunset[0])}`;

    // Hourly: next 24 hours starting from the current hour
    const h = data.hourly;
    let start = h.time.findIndex((t) => t >= c.time.slice(0, 13));
    if (start < 0) start = 0;
    const hourly = $("hourly");
    hourly.innerHTML = "";
    for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
      const w = wmo(h.weather_code[i], h.is_day[i]);
      const el = document.createElement("div");
      el.className = "hour";
      el.innerHTML = `
        <div class="t">${i === start ? "Now" : fmtHour(h.time[i])}</div>
        <div class="i" title="${w.desc}">${w.icon}</div>
        <div class="v">${Math.round(h.temperature_2m[i])}°</div>
        <div class="p">💧${h.precipitation_probability[i] ?? 0}%</div>`;
      hourly.appendChild(el);
    }

    // Daily with a temperature range bar
    const lo = Math.min(...d.temperature_2m_min);
    const hi = Math.max(...d.temperature_2m_max);
    const span = hi - lo || 1;
    const daily = $("daily");
    daily.innerHTML = "";
    d.time.forEach((t, i) => {
      const w = wmo(d.weather_code[i], 1);
      const left = ((d.temperature_2m_min[i] - lo) / span) * 100;
      const width = ((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / span) * 100;
      const li = document.createElement("li");
      li.className = "day";
      li.innerHTML = `
        <span class="name">${fmtDay(t, i)}</span>
        <span class="i" title="${w.desc}">${w.icon}</span>
        <span class="range">
          <span class="lo">${Math.round(d.temperature_2m_min[i])}°</span>
          <span class="bar"><span style="left:${left}%;width:${Math.max(width, 4)}%"></span></span>
          <span class="hi">${Math.round(d.temperature_2m_max[i])}°</span>
        </span>
        <span class="rain">💧${d.precipitation_probability_max[i] ?? 0}%</span>`;
      daily.appendChild(li);
    });

    ["current", "hourly-section", "daily-section"].forEach((id) => ($(id).hidden = false));
  }

  async function load(p) {
    place = p;
    store.set("place", p);
    setStatus(`Loading weather for ${p.name}…`);
    try {
      const data = await fetchForecast(p);
      render(data);
      setStatus("");
      document.title = `${Math.round(data.current.temperature_2m)}° ${p.name} · FAU Owl Weather`;
    } catch (err) {
      console.error(err);
      setStatus("Couldn't load the weather right now. Check your connection and try again.", true);
    }
  }

  // ---------- Search ----------
  const input = $("search-input");
  const list = $("suggestions");
  let results = [];
  let activeIdx = -1;
  let debounce;

  function showSuggestions(items) {
    results = items;
    activeIdx = -1;
    list.innerHTML = "";
    if (!items.length) { list.hidden = true; return; }
    items.forEach((r, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.innerHTML = `<div>${escapeHtml(r.name)}</div><div class="sub">${escapeHtml(r.region)}</div>`;
      li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(i); });
      list.appendChild(li);
    });
    list.hidden = false;
  }

  function choose(i) {
    const r = results[i];
    if (!r) return;
    list.hidden = true;
    input.value = "";
    load(r);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  input.addEventListener("input", () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (q.length < 2) { showSuggestions([]); return; }
    debounce = setTimeout(async () => {
      try { showSuggestions(await geocode(q)); } catch { showSuggestions([]); }
    }, 300);
  });

  input.addEventListener("keydown", (e) => {
    if (list.hidden) return;
    const items = list.querySelectorAll("li");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      activeIdx = (activeIdx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle("active", i === activeIdx));
    } else if (e.key === "Escape") {
      list.hidden = true;
    }
  });

  input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 150));

  $("search-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!list.hidden && activeIdx >= 0) { choose(activeIdx); return; }
    const q = input.value.trim();
    if (!q) return;
    setStatus(`Searching for “${q}”…`);
    try {
      const found = await geocode(q);
      if (!found.length) { setStatus(`No places found for “${q}”.`, true); return; }
      results = found;
      choose(0);
    } catch {
      setStatus("Search failed. Try again.", true);
    }
  });

  // ---------- Buttons ----------
  $("home-btn").addEventListener("click", () => load(FAU_BOCA));

  $("locate-btn").addEventListener("click", () => {
    if (!navigator.geolocation) { setStatus("Your browser doesn't support location.", true); return; }
    setStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => load({
        name: "My location",
        region: "",
        latitude: +pos.coords.latitude.toFixed(4),
        longitude: +pos.coords.longitude.toFixed(4),
      }),
      () => setStatus("Location permission denied. Search for a city instead.", true),
      { timeout: 10000 }
    );
  });

  document.querySelectorAll(".unit-toggle button").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.unit === unit) return;
      unit = b.dataset.unit;
      store.set("unit", unit);
      updateUnitButtons();
      load(place);
    })
  );

  // ---------- Init ----------
  updateUnitButtons();
  load(place);

  // Refresh every 15 minutes while the tab is open
  setInterval(() => { if (!document.hidden) load(place); }, 15 * 60 * 1000);
})();
