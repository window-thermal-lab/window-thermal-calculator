// window thermal calculator

const output = document.getElementById("output");

const params = new URLSearchParams(window.location.search);
const clientId = params.get("client");

console.log("clientId =", clientId);

if (clientId) {
  fetch(`config/clients/${clientId}.json`)
    .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
    .then(client => {
      console.log("client config =", client);

      if (client) {
        output.textContent = "client: " + JSON.stringify(client);

        document.getElementById("hfWidth").value = client.HeadFaceWidth ?? "";;
        document.getElementById("jfWidth").value = client.JambFaceWidth ?? "";;
      }


    })
    .catch(() => {
      console.log("client config not found");
    });
}

fetch("config/common.json")
  .then(r => r.json())
  .then(common => {
    console.log("common config =", common);

    document.getElementById("fWidth").value = 1000;
    document.getElementById("fHeight").value = 2000;

    output.textContent += "\ncommon: " + JSON.stringify(common);
  });


const btn = document.getElementById("calcBtn");

btn.addEventListener("click", updateCalculation);

function updateCalculation() {
  const inputs = getInputs();
  const result = calculateUw(inputs);

  renderResult(result);
}

function getInputs() {
  return {
    
    fWidth: parseFloat(document.getElementById("fWidth").value) || 0,
    fHeight: parseFloat(document.getElementById("fHeight").value) || 0,
    hfWidth: parseFloat(document.getElementById("hfWidth").value) || 0,
    jfWidth: parseFloat(document.getElementById("jfWidth").value) || 0
  
  };
}

function calculateUw(inputs) {
  
  const area = (inputs.fWidth / 1000) * (inputs.fHeight / 1000);
  return area;
 }

function renderResult(result) {
  document.getElementById("uwResult").value = result;
  
}