// window thermal calculator

let commonData = null;
const output = document.getElementById("output");

const params = new URLSearchParams(window.location.search);
const clientId = params.get("client");

console.log("clientId =", clientId);

if (clientId) {
  fetch(`./config/clients/${clientId}.json`)
    .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
    .then(client => {
      console.log("client config =", client);

      if (client) {
        //output.textContent = "client: " + JSON.stringify(client);

        document.getElementById("hfWidth").value = client.HeadFaceWidth ?? "";;
        document.getElementById("jfWidth").value = client.JambFaceWidth ?? "";;
        document.getElementById("sfWidth").value = client.SillFaceWidth ?? "";;
        document.getElementById("fDepth").value = client.FrameDepth ?? "";;

        document.getElementById("trfWidth").value = client.TopRailFaceWidth ?? "";;
        document.getElementById("stilefWidth").value = client.StileFaceWidth ?? "";;
        document.getElementById("bfWidth").value = client.BottomRailFaceWidth ?? "";;
        document.getElementById("sDepth").value = client.SashDepth ?? "";;

        document.getElementById("hol").value = client.HeadOverlap ?? "";;
        document.getElementById("jol").value = client.JambOverlap ?? "";;
        document.getElementById("sol").value = client.SillOverlap ?? "";;
   
      }


    })
    .catch(() => {
      console.log("client config not found");
    });
}

fetch("./config/common.json")
  .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
  .then(common => {
    commonData = common;

    if(commonData){

      console.log("common config =", commonData);

      document.getElementById("fWidth").value = 1000;
      document.getElementById("fHeight").value = 2000;

      //output.textContent += "\ncommon: " + JSON.stringify(commonData);
      updateCalculation();
    }
  });


const btn = document.getElementById("calcBtn");

btn.addEventListener("click", updateCalculation);

document.querySelectorAll("input, select").forEach(el => {
  el.addEventListener("input", updateCalculation);
  el.addEventListener("change", updateCalculation);
});


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
    jfWidth: parseFloat(document.getElementById("jfWidth").value) || 0,
    sfWidth: parseFloat(document.getElementById("sfWidth").value) || 0,
    fDepth: parseFloat(document.getElementById("fDepth").value) || 0,

    trfWidth: parseFloat(document.getElementById("trfWidth").value) || 0,
    stilefWidth: parseFloat(document.getElementById("stilefWidth").value) || 0,
    bfWidth: parseFloat(document.getElementById("bfWidth").value) || 0,
    sDepth: parseFloat(document.getElementById("sDepth").value) || 0,
    
    hol: parseFloat(document.getElementById("hol").value) || 0,
    jol: parseFloat(document.getElementById("jol").value) || 0,
    sol: parseFloat(document.getElementById("sol").value) || 0,

    glassTypeKey: document.getElementById("idGlassType").value,
    windowTypeKey: document.getElementById("idWindowType").value,

    lambdaWood: parseFloat(document.getElementById("lambdaWood").value) || 0

  };
}

function calculateUw(inputs) {
  
  if (!commonData) return "";
  
  const vGlass = commonData.glassTypes && commonData.glassTypes[inputs.glassTypeKey];
  if (!vGlass){

    console.log(inputs.glassTypeKey);
    console.log(commonData.glassTypes);
    return "";     
  }  

  const vWindow = commonData.windowTypes && commonData.windowTypes[inputs.windowTypeKey];
  if (!vWindow) return "";

  // 実際の計算スタート
 
  // 上枠の熱抵抗
  let resist;

  if(inputs.lambdaWood > 0 ){
    resist = (inputs.hfWidth/1000)/inputs.lambdaWood;
    output.textContent += "\n上枠の熱抵抗: " + resist;   
  }
  else{
    output.textContent += "\n上枠の熱抵抗: lambdaWood が 0 以下です";
    return "";
  }
  

 
//output.textContent += "\ncommon: " + JSON.stringify(commonData);
  const ug = vGlass.Ug;
  
  const area = (inputs.fWidth / 1000) * (inputs.fHeight / 1000);
  return area;
 }

function renderResult(result) {
  document.getElementById("uwResult").value = result;
  
}