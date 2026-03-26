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
  el.addEventListener("input", updateCalculation);
  el.addEventListener("change", updateCalculation);
});


function updateCalculation() {

  output.textContent = "";

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
  
  if (!commonData) {
    debuglog("commonData未ロード");
    return "";
  }  
  
  
  const vGlazing = commonData.glassTypes && commonData.glassTypes[inputs.glassTypeKey];
  if (!vGlazing){

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
  debuglog("縦框の表面積: " + areaSet.stileArea);
  debuglog("下框の表面積: " + areaSet.bottomArea);

  if(commonData.lambdaWood <= 0 ){
    debuglog("木部の熱伝導率: lambdaWood が 0 以下です");
    return "";
  }

  const resistSet = getResist(inputs);

  debuglog("枠の総抵抗値: " + resistSet.frameResist);
  debuglog("障子の総抵抗値: " + resistSet.sashResist);
  debuglog("Ug: " + vGlazing.Ug);

  if(resistSet.frameResist <=0 || resistSet.sashResist <=0){
    debuglog("熱抵抗: frameResist 又は sashResistが 0 以下です");
    return "";
  }  

  // コンダクタンス
  const fConductance = (1/resistSet.frameResist)*(areaSet.headArea+areaSet.jambArea+areaSet.sillArea) + (1/resistSet.sashResist)*(areaSet.topRailArea+areaSet.stileArea+areaSet.bottomArea);
  debuglog("木部のコンダクタンス: " + fConductance);

  const gConductance = vGlazing.Ug*areaSet.glazingArea;
  debuglog("グレージングのコンダクタンス: " + gConductance);

  const pConductance = commonData.AluSpacerPsi*areaSet.glazingPerimeter;
  debuglog("スペーサーのコンダクタンス: " + pConductance);

  const Uw = (fConductance + gConductance + pConductance)/windowArea;
  return Uw;
 
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
  const bottomVisible = inputs.bfWidth/1000-inputs.sol/1000

  const glazingTotalWidth = wm-(inputs.jfWidth/1000)*2-stileVisible*2-(inputs.stilefWidth/1000)*2;
  const glazingHeight = hm-inputs.hfWidth/1000-inputs.sfWidth/1000-topRailVisible-bottomVisible;
  
  if (glazingTotalWidth <= 0) {
    debuglog("エラー: glazingTotalWidth が 0 以下です");
  }

  if (glazingHeight <= 0) {
    debuglog("エラー: glazingHeight が 0 以下です");
  }

  const glazingArea = glazingTotalWidth*glazingHeight;
  const glazingPerimeter = glazingTotalWidth*2+glazingHeight*4;
  const windowArea = headArea + jambArea + sillArea + topRailArea + stileArea + bottomArea + glazingArea;
  /*
  debuglog("wm: " + wm);
  debuglog("縦枠の見付け: " + inputs.jfWidth/1000);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("縦框の見付け: " + inputs.stilefWidth/1000);
  */

  debuglog("ガラスの総幅: " + glazingTotalWidth);
  debuglog("ガラスの高さ: " + glazingHeight);
  debuglog("上框の見える部分: " + topRailVisible);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("下框の見える部分: " + bottomVisible);
  
  const headArea = wm*(inputs.hfWidth/1000);
  const jambArea = (hm-inputs.hfWidth/1000-inputs.sfWidth/1000)*(inputs.jfWidth/1000)*2;
  const sillArea = wm*inputs.sfWidth/1000;
  const topRailArea = (glazingTotalWidth/2)*topRailVisible*2;
  const stileArea = (hm-inputs.hfWidth/1000-inputs.sfWidth/1000)*(stileVisible*2+(inputs.stilefWidth/1000)*2);
  const bottomArea = (glazingTotalWidth/2)*bottomVisible*2;

  debuglog("木部の総面積: " + (headArea+jambArea+sillArea+topRailArea+stileArea+bottomArea));
  debuglog("グレージングの総面積: " + glazingArea);
  debuglog("グレージングの周長: " + glazingPerimeter);
  debuglog("窓の総面積: " + windowArea);


  return {
    glazingArea: glazingArea,
    glazingPerimeter: glazingPerimeter,
    windowArea: windowArea,
    headArea: headArea,
    jambArea: jambArea,
    sillArea: sillArea,
    topRailArea: topRailArea,
    stileArea: stileArea,
    bottomArea: bottomArea

  };
}

 
function getResist(inputs) {

  const frameResist = commonData.Rsi+(inputs.fDepth/1000)/commonData.lambdaWood+commonData.Rse;
  const sashResist = commonData.Rsi+(inputs.sDepth/1000)/commonData.lambdaWood+commonData.Rse;

  return {
    frameResist: frameResist,
    sashResist: sashResist   
  };
 
 
}