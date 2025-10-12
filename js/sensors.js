const DEFAULT_INTERVAL_MS = 5000;
const RANDOM_RANGES = { temp:[18,36], hum:[20,80], lux:[50,800] };
let timerId = null;

function randomBetween(min, max) { return Math.round(min + Math.random()*(max-min)); }

function getReading() {
  return {
    ts: Date.now(),
    temp: randomBetween(...RANDOM_RANGES.temp),
    hum:  randomBetween(...RANDOM_RANGES.hum),
    lux:  randomBetween(...RANDOM_RANGES.lux)
  };
}

function subscribeReadings(cb, intervalMs = DEFAULT_INTERVAL_MS) {
  timerId = setInterval(() => cb(getReading()), intervalMs);
  return function unsubscribe(){ clearInterval(timerId); };
}

window.Sensors = { getReading, subscribeReadings };