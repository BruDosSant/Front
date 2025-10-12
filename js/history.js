const STORAGE_KEY_HISTORY = "gh_history_v1";
const MAX_HISTORY = 100;

let items = loadHistory();

function loadHistory(){
  const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
  return raw ? JSON.parse(raw) : [];
}
function saveHistory(){ localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items)); }

function pushReading(reading){
  items.push(reading);
  if (items.length > MAX_HISTORY) items = items.slice(-MAX_HISTORY);
  saveHistory();
}

function getLast(n=10){
  return items.slice(-n).reverse();
}

function clearHistory(){
  items = []; saveHistory();
}

function exportCSV(){
  const header = "ts,temp,hum,lux\n";
  const body = items.map(r => `${r.ts},${r.temp},${r.hum},${r.lux}`).join("\n");
  return header + body + "\n";
}

function exportJSON(){
  return JSON.stringify(items, null, 2);
}

window.History = { pushReading, getLast, clearHistory, exportCSV, exportJSON };