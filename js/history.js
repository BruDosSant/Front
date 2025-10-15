
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

function saveFile(url, filename) {
  a.href = url;
  a.download = filename || "file-name";
  document.body.appendChild(a);
  document.body.removeChild(a);
}

async function exportCSVbyDates(dateFrom, dateUntil) {
  try {
    const url = "/csv?dateFrom=" + dateFrom + "&dateUntil=" + dateUntil;
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      console.log("blob: ", blob);
      const downloadUrl = URL.createObjectURL(blob);
      console.log("downloadUrl: ", downloadUrl);
      
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `export_${dateFrom}_to_${dateUntil}.csv`; 
      console.log("a: ", a);
      
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(downloadUrl);
    } else {
      console.error(response.status);
    }
  } catch (ex) {
    console.error(ex);
  }
}

//exportCSVbyDates();
