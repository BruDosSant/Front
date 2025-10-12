const STORAGE_KEY_THRESHOLDS = "gh_thresholds_v1";
const DEFAULT_THRESHOLDS = { tempMax:30, humMin:30, luxMin:200 };

function getThresholds() {
  const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
  return raw ? JSON.parse(raw) : { ...DEFAULT_THRESHOLDS };
}

function validateThresholds(th) {
  if (!(th && Number.isFinite(th.tempMax) && th.tempMax>=0 && th.tempMax<=60)) throw new Error("tempMax inválido (0–60).");
  if (!(Number.isFinite(th.humMin) && th.humMin>=0 && th.humMin<=100))       throw new Error("humMin inválido (0–100).");
  if (!(Number.isFinite(th.luxMin) && th.luxMin>=0 && th.luxMin<=20000))     throw new Error("luxMin inválido (0–20000).");
}

function setThresholds(th) {
  validateThresholds(th);
  localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(th));
}

function resetThresholds() {
  localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(DEFAULT_THRESHOLDS));
}

window.Thresholds = { getThresholds, setThresholds, resetThresholds };