
/* ===== Estado agua + riego ===== */
let uiWaterLevelPct = 62;              // porcentaje actual (placeholder)
let lastIrrigationAt = null;           // timestamp del último encendido de bomba
let _prevAct = null;

/* ===== Util ===== */
function formatTime(ms) { return new Date(ms).toLocaleTimeString(); }
function timeAgo(ts){
  if (!ts) return "—";
  const s = Math.max(0, Math.floor((Date.now()-ts)/1000));
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s/60); if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m/60); return `hace ${h} h`;
}

/* ===== Backend enchufable (sugeridos) ===== */
const API_BASE = "";      

/* ===== Auto por planta: persistencia ===== */
const AUTO_KEY  = 'autoByPlant';
const PLANT_KEY = 'plantName';
function getAutoByPlant(){ return localStorage.getItem(AUTO_KEY) === '1'; }
function setAutoByPlant(v){ localStorage.setItem(AUTO_KEY, v ? '1' : '0'); }
function getPlantName(){ return localStorage.getItem(PLANT_KEY) || ''; }
function setPlantName(name){ localStorage.setItem(PLANT_KEY, String(name||'').trim()); }
function clearPlantName(){ localStorage.removeItem(PLANT_KEY); }


/* API pública para backend */
window.setWaterLevel = (pct, label) => {
  renderWaterLevel(pct, label);
  uiWaterLevelPct = Math.max(0, Math.min(100, Number(pct)||0));
};

/* ===== Dashboard ===== */
function updateCardsFromReading(reading) {
  const t = (reading.temp != null) ? Number(reading.temp).toFixed(0) : "--";
  const h = (reading.hum  != null) ? Number(reading.hum).toFixed(0)  : "--";
  document.getElementById("card-temp-value").innerText = `${t}°C`;
  document.getElementById("card-hum-value").innerText  = `${h}%`;

  const hs = (reading.humSoil != null) ? Number(reading.humSoil).toFixed(0) : "—";
  const elSoil = document.getElementById("card-humsoil-value");
  if (elSoil) elSoil.innerText = `${hs}%`;
}

/* ===== Mini chart 24h ===== */
function drawLineChart(canvasId, values, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  if (!values || !values.length) return;

  const pad = 20, x0 = pad, y0 = h - pad, x1 = w - pad, y1 = pad;
  const plotW = x1 - x0, plotH = y0 - y1;
  const minV = Math.min(...values), maxV = Math.max(...values);
  const span = (maxV === minV) ? 1 : (maxV - minV);

  ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1; ctx.beginPath();
  for (let i=0;i<=4;i++){ const y = y1 + (plotH * i/4); ctx.moveTo(x0,y); ctx.lineTo(x1,y); }
  ctx.stroke();

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = x0 + (plotW * (i / (values.length - 1 || 1)));
    const y = y1 + plotH * (1 - ((v - minV) / span));
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.lineWidth = 2; ctx.strokeStyle = options.color || "#2f6b31"; ctx.stroke();

  ctx.fillStyle = ctx.strokeStyle;
  values.forEach((v, i) => {
    const x = x0 + (plotW * (i / (values.length - 1 || 1)));
    const y = y1 + plotH * (1 - ((v - minV) / span));
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
  });
}

/* ===== Historial ===== */
function renderHistoryTable() {
  const table = document.getElementById("hist-table");
  table.innerHTML =
    `<tr><th>Hora</th><th>Temp (°C)</th><th>Hum (%)</th><th>Luz (lx)</th></tr>`;
}
function downloadText(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}
function initHistoryView() {
  document.getElementById("btn-export-csv").onclick  = () => downloadText("data.csv",  History.exportCSV());
  document.getElementById("btn-export-json").onclick = () => downloadText("data.json", History.exportJSON());
  document.getElementById("btn-clear-history").onclick = () => { History.clearHistory(); renderHistoryTable(); };
  renderHistoryTable();
}

/* ===== Config ===== */
function toggleManualInputs(enabled){
  ["in-tempMax","in-humMin","in-luxMin"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
}
function fillThresholdForm() {
  const inTemp = document.getElementById("in-tempMax");
  const inHum  = document.getElementById("in-humMin");
  const inLux  = document.getElementById("in-luxMin");
  inTemp.value = th.tempMax; inHum.value = th.humMin; inLux.value = th.luxMin;

  const chk = document.getElementById("chk-auto-plant");
  const plantInput = document.getElementById("in-plantName");
  const auto = getAutoByPlant();
  if (chk) chk.checked = auto;
  if (plantInput) plantInput.value = getPlantName();
  toggleManualInputs(!auto);
}


  document.getElementById("btn-save-thresholds").onclick = () => {
    try {
      setPlantName(plantInput?.value || '');
      msg.innerText = "Guardado ✔";
      refreshUIAfterThresholdChange();
      updateTopbarForView((location.hash || '#dashboard').slice(1));
    } catch (e) { msg.innerText = e.message || "Error al guardar"; }
  };

/* ===== Actuadores (UI + transiciones para “último riego”) ===== */
function renderActuators(state) {
  const s = state || {};
  const lucesOn  = !!(s.luces && s.luces.on);
  const ventOn   = !!(s.ventilador && s.ventilador.on);
  const bombaOn  = !!(s.bomba && s.bomba.on);

  document.getElementById('tile-luces')?.classList.toggle('active', lucesOn);
  document.getElementById('tile-ventilador')?.classList.toggle('active', ventOn);
  document.getElementById('tile-bomba')?.classList.toggle('active', bombaOn);

  // detectar encendido de bomba -> registrar "último riego"
  if (_prevAct && !_prevAct.bombaOn && bombaOn) lastIrrigationAt = Date.now();
  _prevAct = { bombaOn };
}
function bindActuatorEvents() {
  const tiles = [
    { id:'tile-luces',      key:'luces' },
    { id:'tile-ventilador', key:'ventilador' },
    { id:'tile-bomba',      key:'bomba' },
  ];
  tiles.forEach(t => {
    document.getElementById(t.id)?.addEventListener('click', () => {
      const cur = !!Actuators.getActuators()[t.key]?.on;
      Actuators.setActuator(t.key, { on: !cur });
    });
  });
  document.getElementById('btn-stop-all')?.addEventListener('click', () => {
    ['luces','ventilador','bomba'].forEach(k => Actuators.setActuator(k, { on:false }));
  });
}
function initActuatorsView() {
  renderActuators(Actuators.getActuators());
  Actuators.subscribeActuators(renderActuators);
  bindActuatorEvents();
}

/* ===== Nivel de agua (card en Actuadores) ===== */
function renderWaterLevel(level = 62, label = 'Tanque medio') {
  const pct = Math.max(0, Math.min(100, Number(level) || 0));
  document.getElementById('water-bar').style.width = pct + '%';
  document.getElementById('water-percent').textContent = pct + '%';
  document.getElementById('water-label').textContent = label || '';
}


/* ===== Sensores ===== */
function onReading(reading) {
  updateCardsFromReading(reading);
  renderHistoryTable();
}

/* ===== Menú ===== */
function initMenu() {
  const btn = document.getElementById('btn-menu');
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('menu-backdrop');
  if (!btn || !drawer || !backdrop) return;

  const open = () => { drawer.classList.add('open'); backdrop.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { drawer.classList.remove('open'); backdrop.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  const toggle = () => drawer.classList.contains('open') ? close() : open();

  btn.addEventListener('click', toggle);
  backdrop.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('hashchange', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ===== Topbar + back ===== */
function updateTopbarForView(name) {
  const back = document.getElementById('btn-back');
  const menu = document.getElementById('btn-menu');
  const title = document.getElementById('topbar-title');
  const titles = { dashboard:'Invernadero', actuators:'Actuadores', history:'Historial', config:'Config', sim:'Simulación' };
  const plant = getPlantName();

  title.textContent = (name === 'dashboard' && plant) ? `Invernadero · ${plant}` : (titles[name] || 'Invernadero');

  if (name === 'dashboard') { back.classList.add('hidden'); menu.classList.remove('hidden'); }
  else { back.classList.remove('hidden'); menu.classList.add('hidden'); }
}
function initBackButton() {
  const back = document.getElementById('btn-back');
  if (!back) return;
  back.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else location.hash = '#dashboard';
  });
}

/* ===== Router ===== */
function setActiveTab(name) {
  const ids = { dashboard:"tab-dashboard", actuators:"tab-actuators", history:"tab-history", config:"tab-config" };
  Object.values(ids).forEach(id => document.getElementById(id)?.classList.remove("active"));
  document.getElementById(ids[name])?.classList.add("active");
}
function showView(name) {
  ["dashboard","actuators","history","config","sim"].forEach(v => {
    const el = document.getElementById(`view-${v}`); if (el) el.classList.toggle("hidden", v !== name);
  });
  if (name === "history") renderHistoryTable();
  if (name === "actuators") renderWaterLevel(uiWaterLevelPct);
  setActiveTab(name);
  updateTopbarForView(name);
}
function initRouter() {
  const go = () => {
    if (!location.hash) { location.replace('#dashboard'); return; }
    const name = location.hash.slice(1);
    showView(name);
  };
  window.addEventListener("hashchange", go);
  go();
}


/* ===== Altura móvil ===== */
function setVhUnit() { const vh = window.innerHeight * 0.01; document.documentElement.style.setProperty('--vh', `${vh}px`); }
window.addEventListener('resize', setVhUnit); setVhUnit();

/* ===== Arranque ===== */
function initApp() {
  initActuatorsView();
  initHistoryView();
  initRouter();
  initMenu();
  initBackButton();
  renderWaterLevel(uiWaterLevelPct, 'Tanque medio'); // inicial
}
document.addEventListener("DOMContentLoaded", initApp);
