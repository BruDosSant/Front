let currentState;
let listeners = [];

//Metodo GET
async function loadActuatorsState() {
  try {
    const url = "/mecanismos";
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      currentState = data;
    }
  } catch (ex) {
    console.error(ex);
  }
}

//Metodo PUT
function saveState() {
  fetch("/mecanismos", {
    method: "PUT",
    body: JSON.stringify({currentState}),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
  .then((response) => response.json())
  .then((json) => console.log(json));
}

function renderActuators(state) {
  const s = state || {};
  const lucesOn  = !!(s.luces && s.luces.on);
  const ventOn   = !!(s.ventilador && s.ventilador.on);
  const bombaOn  = !!(s.bomba && s.bomba.on);

  document.getElementById('tile-luces')?.classList.toggle('active', lucesOn);
  document.getElementById('tile-ventilador')?.classList.toggle('active', ventOn);
  document.getElementById('tile-bomba')?.classList.toggle('active', bombaOn);
}

//window.Actuators = { getActuators, setActuator, subscribeActuators, applyAuto };