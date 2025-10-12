const STORAGE_KEY_ACTUATORS = "gh_actuators_v1";
const DEFAULT_ACTUATORS = {
  bomba:{ mode:"manual", on:false },
  ventilador:{ mode:"manual", on:false },
  luces:{ mode:"manual", on:false }
};

let state = null;
const listeners = [];

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY_ACTUATORS);
  return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_ACTUATORS));
}

function saveState(){ localStorage.setItem(STORAGE_KEY_ACTUATORS, JSON.stringify(state)); }
function notify(){ listeners.forEach(cb => cb(getActuators())); }

function getActuators(){
  if (!state) state = loadState();
  return JSON.parse(JSON.stringify(state));
}

function setActuator(name, partial){
  if (!state) state = loadState();
  state[name] = { ...state[name], ...partial };
  saveState(); notify();
}

function subscribeActuators(cb){
  listeners.push(cb); cb(getActuators());
  return () => { const i = listeners.indexOf(cb); if (i>=0) listeners.splice(i,1); };
}

function computeAuto(reading, thresholds){
  return {
    bombaOn:      reading.hum  < thresholds.humMin,
    ventiladorOn: reading.temp > thresholds.tempMax,
    lucesOn:      reading.lux  < thresholds.luxMin,
  };
}

function applyAuto(reading){
  if (!state) state = loadState();
  const th = Thresholds.getThresholds();
  const s = computeAuto(reading, th);
  let changed = false;
  if (state.bomba.mode==="auto" && state.bomba.on !== s.bombaOn) { state.bomba.on = s.bombaOn; changed = true; }
  if (state.ventilador.mode==="auto" && state.ventilador.on !== s.ventiladorOn) { state.ventilador.on = s.ventiladorOn; changed = true; }
  if (state.luces.mode==="auto" && state.luces.on !== s.lucesOn) { state.luces.on = s.lucesOn; changed = true; }
  if (changed){ saveState(); notify(); }
}

window.Actuators = { getActuators, setActuator, subscribeActuators, computeAuto, applyAuto };