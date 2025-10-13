export const renderChart = (labels, temperatura, humedad, nivelDeAgua) => {
    const ctx = document.getElementById("historialChart").getContext("2d");
  
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Temperatura (°C)",
            data: temperatura,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            yAxisID: "y",
          },
          {
            label: "Humedad (%)",
            data: humedad,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            yAxisID: "y1",
          },
          {
            label: "Nivel de agua (cm)",
            data: nivelDeAgua,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        stacked: false,
        plugins: {
          title: {
            display: true,
            text: "Historial de lecturas ambientales",
          },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "Temperatura (°C)" },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: { drawOnChartArea: false },
            title: { display: true, text: "Humedad (%)" },
          },
          y2: {
            type: "linear",
            display: false, 
            title: { display: true, text: "Nivel de agua (cm)" },
          },
          x: {
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
        },
      },
    });
  };