
const loadHistory = async () => {
  try {
    const url = "/lecturas";
    const response = await fetch(url);
    const chart = await import("./setupChart/renderChart.js");
    if (response.ok && chart) {
      const data = await response.json();

      data.sort((fechaDesde, fechaHasta) => new Date(fechaDesde.fecha_hora) - new Date(fechaHasta.fecha_hora));

      const labels = data.map(d => new Date(d.fecha_hora).toLocaleString());
      const temperatura = data.map(d => d.temperatura);
      const humedad = data.map(d => d.humedad);
      const nivelDeAgua = data.map(d => d.nivel_de_agua);

      chart.renderChart(labels, temperatura, humedad, nivelDeAgua);
    } else {
      console.error(response.status);
    }
  } catch (ex) {
    console.error(ex);
  }
}

loadHistory();


function clearHistory() {
  items = []; saveHistory();
}

function exportCSV() {
  const header = "ts,temp,hum,lux\n";
  const body = items.map(r => `${r.ts},${r.temp},${r.hum},${r.lux}`).join("\n");
  return header + body + "\n";
}

function exportJSON() {
  return JSON.stringify(items, null, 2);
}
