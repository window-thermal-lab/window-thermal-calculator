// window thermal calculator

let commonData = null;

// output Element
const output = document.getElementById("output");

const params = new URLSearchParams(window.location.search);

// string
const clientId = params.get("client");

function debuglog(msg) {
  output.textContent += "\n" + msg;
}

console.log("clientId =", clientId);


let clientPromise;

// client.json取得
if (clientId) {
  clientPromise = fetch(`./config/clients/${clientId}.json`)
    .then(r => {
      if (!r.ok) return null;
      return r.json();
    })
    .catch(() => {
      console.log("client config not found");
      return null;
    });
} else {
  clientPromise = Promise.resolve(null);
}

const commonPromise = fetch("./config/common.json")
  .then(r => {
    if (!r.ok) return null;
    return r.json();
  })
  .catch(() => {
    console.log("common config not found");
    return null;
  });

Promise.all([commonPromise, clientPromise])
  .then(([common, client]) => {
    commonData = common;


  if (client) {
        console.log("client config =", client);

        document.getElementById("hfWidth").value = client.HeadFaceWidth ?? "";
        document.getElementById("jfWidth").value = client.JambFaceWidth ?? "";
        document.getElementById("sfWidth").value = client.SillFaceWidth ?? "";
        document.getElementById("fDepth").value = client.FrameDepth ?? "";

        document.getElementById("trfWidth").value = client.TopRailFaceWidth ?? "";
        document.getElementById("stilefWidth").value = client.StileFaceWidth ?? "";
        document.getElementById("bfWidth").value = client.BottomRailFaceWidth ?? "";
        document.getElementById("sDepth").value = client.SashDepth ?? "";

        document.getElementById("hol").value = client.HeadOverlap ?? "";
        document.getElementById("jol").value = client.JambOverlap ?? "";
        document.getElementById("sol").value = client.SillOverlap ?? "";
      }


       if (commonData) {
      console.log("common config =", commonData);

      document.getElementById("fWidth").value = 2000;
      document.getElementById("fHeight").value = 2200;

      updateCalculation();
    }

  })
  .catch(err => {
    console.log("init error", err);
  });

const btn = document.getElementById("calcBtn");
if (btn) {
  btn.addEventListener("click", updateCalculation);
}

document.querySelectorAll("input, select").forEach(el => {
 // el.addEventListener("input", updateCalculation);
 // el.addEventListener("change", updateCalculation);
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

    
  };
}

function calculateUw(inputs) {
  
  
  // 計算スタート

  if (!commonData) return "";
  
  const vGlass = commonData.glassTypes && commonData.glassTypes[inputs.glassTypeKey];
  if (!vGlass){

    console.log(inputs.glassTypeKey);
    console.log(commonData.glassTypes);
    return "";     
  }  

  const vWindow = commonData.windowTypes && commonData.windowTypes[inputs.windowTypeKey];
  if (!vWindow) return "";

  const areaSet = getAreas(inputs);

  debuglog("上枠の表面積: " + areaSet.headArea);
  debuglog("縦枠の表面積: " + areaSet.jambArea);
  debuglog("下枠の表面積: " + areaSet.sillArea);
  debuglog("上框の表面積: " + areaSet.topRailArea);
  debuglog("縦框の表面積: " + areaSet.stillArea);
  debuglog("下框の表面積: " + areaSet.BottomArea);

 
  let resist;

  if(commonData.lambdaWood > 0 ){
    resist = (inputs.fDepth/1000)/commonData.lambdaWood;
    debuglog("上枠の熱抵抗: " + resist);   
    
    resist = (inputs.fDepth/1000)/commonData.lambdaWood;
    debuglog("縦枠の熱抵抗: " + resist);

    resist = (inputs.fDepth/1000)/commonData.lambdaWood;
    debuglog("縦枠の熱抵抗: " + resist);

    



  }
  else{
    debuglog("上枠の熱抵抗: lambdaWood が 0 以下です");
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


// 共通関数
function getAreas(inputs) {

  const wm = inputs.fWidth / 1000;
  const hm = inputs.fHeight / 1000;
    
  const topRailVisible = inputs.trfWidth/1000-inputs.hol/1000
  const stileVisible = inputs.stilefWidth/1000-inputs.jol/1000
  const BottomVisible = inputs.bfWidth/1000-inputs.sol/1000

  const glassTotalWidth = wm-(inputs.jfWidth/1000)*2-stileVisible*2-(inputs.stilefWidth/1000)*2;
  const glassHeight = hm-inputs.hfWidth/1000-inputs.sfWidth/1000-topRailVisible-BottomVisible;

  /*
  debuglog("wm: " + wm);
  debuglog("縦枠の見付け: " + inputs.jfWidth/1000);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("縦框の見付け: " + inputs.stilefWidth/1000);
  */

  debuglog("ガラスの総幅: " + glassTotalWidth);
  debuglog("ガラスの高さ: " + glassHeight);
  debuglog("上框の見える部分: " + topRailVisible);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("下框の見える部分: " + BottomVisible);
  
  const headArea = wm*(inputs.hfWidth/1000);
  const jambArea = (hm-inputs.hfWidth/1000-inputs.sfWidth/1000)*(inputs.jfWidth/1000)*2;
  const sillArea = wm*inputs.sfWidth/1000;
  const topRailArea = (glassTotalWidth/2)*topRailVisible*2;
  const stileArea = (hm-(inputs.hfWidth/1000)-inputs.sfWidth/1000)*(stileVisible*2+(inputs.stilefWidth/1000)*2);
  const BottomArea = (glassTotalWidth/2)*BottomVisible*2;

  debuglog("木部の総面積: " + (headArea+jambArea+sillArea+topRailArea+stileArea+BottomArea));
  debuglog("グレージングの総面積: " + glassTotalWidth*glassHeight);
  debuglog("窓の総面積: " + (headArea+jambArea+sillArea+topRailArea+stileArea+BottomArea+glassTotalWidth*glassHeight));

  return {
    headArea: headArea,
    jambArea: jambArea,
    sillArea: sillArea,
    topRailArea: topRailArea,
    stileArea: stileArea,
    BottomArea: BottomArea

  };
 
 
}