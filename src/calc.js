// window thermal calculator

const KEY_SINGLE_DOOR = "singleDoor";
const KEY_DOUBLE_DOOR = "doubleDoor";
const KEY_SLIDING = "sliding";
const KEY_FIXED = "fixed";

let commonData = {};

// output コントロール
const output = document.getElementById("output");

const btn = document.getElementById("calcBtn");

const params = new URLSearchParams(window.location.search);

// string
const clientId = params.get("client");
console.log("clientId =", clientId);

function debuglog(msg) {
  if (!output) return;
  output.textContent += "\n" + msg;
}

// client.json 取得
let clientPromise;

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

// common.json 取得
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
    if (!common) {
      console.log("common config is null");
      return;
    }

    commonData = common;
    console.log("common config =", commonData);

     // プルダウン生成
    buildSelectFromObject(
      "idGlassType",
      commonData.glassTypes,
      commonData.defaultGlass
    );

    buildSelectFromObject(
      "idWindowType",
      commonData.windowTypes,
      commonData.defaultWindowType
    );
    
    // 初期値代入
    document.getElementById("fWidth").value = 2000;
    document.getElementById("fHeight").value = 2200;
    document.getElementById("ugResult").value = 1.6;


  if (client) {
        console.log("client config =", client);

        // コントロールに代入
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

      updateCalculation();   

  })
  .catch(err => {
    console.log("init error", err);
  });

// イベント登録
if (btn) {
  btn.addEventListener("click", updateCalculation);
}

document.querySelectorAll("input, select").forEach(el => {
  //el.addEventListener("input", updateCalculation);
  el.addEventListener("change", updateCalculation);
});

function buildSelectFromObject(selectId, items, selectedKey) {
  const select = document.getElementById(selectId);
  if (!select || !items) return;

  // いったん中身を消す
  select.innerHTML = "";

  Object.entries(items).forEach(([key, item]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = item.name;

    if (key === selectedKey) {
      option.selected = true;
    }

    select.appendChild(option);
  });

  // selectedKey が存在しない場合は先頭を選ぶ
  if (!items[selectedKey] && select.options.length > 0) {
    select.selectedIndex = 0;
  }

  console.log("selectedKey =", selectedKey);
  console.log("items =", items);
}


// 
function updateCalculation() {

  output.textContent = "";

  const inputs = getInputs();
  const selected = getSelected();

  const selectedGlass = commonData.glassTypes?.[selected.glassTypeKey];
  const selectedWindow = commonData.windowTypes?.[selected.windowTypeKey];

  if (!selectedGlass || !selectedWindow) {
    console.log("選択値が不正です");
    return;
  }

  const result = calculateUw(inputs,selected);

  if (result == null) {
  debuglog("計算できませんでした");
  return;
  }

  renderResult(result);
}

// 計算メイン関数
function calculateUw(inputs,selected) {
  
  
  // 計算スタート
  
  if (!commonData.glassTypes || !commonData.windowTypes) {
  debuglog("commonData未ロード");
  return null;
  }
  
  
  const vGlazing = commonData.glassTypes && commonData.glassTypes[selected.glassTypeKey];
  if (!vGlazing){

    console.log(selected.glassTypeKey);
    console.log(commonData.glassTypes);
    return null;     
  }  

  const vWindow = commonData.windowTypes && commonData.windowTypes[selected.windowTypeKey];
  if (!vWindow) return null;

  const areaSet = getAreas(inputs,selected);

  debuglog("上枠の表面積: " + areaSet.headArea);
  debuglog("縦枠の表面積: " + areaSet.jambArea);
  debuglog("下枠の表面積: " + areaSet.sillArea);
  debuglog("上框の表面積: " + areaSet.topRailArea);
  debuglog("縦框の表面積: " + areaSet.stileArea);
  debuglog("下框の表面積: " + areaSet.bottomArea);

  if(commonData.lambdaWood <= 0 ){
    debuglog("木部の熱伝導率: lambdaWood が 0 以下です");
    return null;
  }

  const resistSet = getResist(inputs);

  debuglog("枠の総抵抗値: " + resistSet.frameResist);
  debuglog("障子の総抵抗値: " + resistSet.sashResist);
  debuglog("Ug: " + vGlazing.Ug);

  if(resistSet.frameResist <=0 || resistSet.sashResist <=0){
    debuglog("熱抵抗: frameResist 又は sashResistが 0 以下です");
    return null;
  }  

  // コンダクタンス
  const fConductance = (1/resistSet.frameResist)*(areaSet.headArea+areaSet.jambArea+areaSet.sillArea) + (1/resistSet.sashResist)*(areaSet.topRailArea+areaSet.stileArea+areaSet.bottomArea);
  debuglog("木部のコンダクタンス: " + fConductance);

  const gConductance = inputs.ugResult*areaSet.glazingArea;
  debuglog("グレージングのコンダクタンス: " + gConductance);

  const pConductance = commonData.AluSpacerPsi*areaSet.glazingPerimeter;
  debuglog("スペーサーのコンダクタンス: " + pConductance);

  const totalConductance = fConductance + gConductance + pConductance

  const Uw = totalConductance/(areaSet.totalArea);

  return Uw;
 
}

// 最終表示
function renderResult(result) {
  document.getElementById("uwResult").value = result;
}


// Get系関数
function getInputs() {
  return {
    
    fWidth: parseFloat(document.getElementById("fWidth").value) || 0,
    fHeight: parseFloat(document.getElementById("fHeight").value) || 0,

    ugResult: parseFloat(document.getElementById("ugResult").value) || 0,
  
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
  };
}

function getSelected() {
  return {    
    glassTypeKey: document.getElementById("idGlassType").value,
    windowTypeKey: document.getElementById("idWindowType").value,    
  };
}


function getAreas(inputs,selected) {


  const i ={
    w: inputs.fWidth / 1000,
    h: inputs.fHeight / 1000,
    hfWidth: inputs.hfWidth/1000,
    jfWidth: inputs.jfWidth/1000,
    sfWidth: inputs.sfWidth/1000,
    fDepth: inputs.fDepth/1000,

    trfWidth: inputs.trfWidth/1000,
    stilefWidth: inputs.stilefWidth/1000,
    bfWidth: inputs.bfWidth/1000,
    sDepth: inputs.sDepth/1000,
    
    hol: inputs.hol/1000,
    jol: inputs.jol/1000,
    sol: inputs.sol/1000,
  }

  const wt = commonData.windowTypes[selected.windowTypeKey];

  const c ={    
    sashCount : wt.sashCount ?? 0,
    overlapCount : wt.overlapCount ?? 0,
    category: wt.category ?? "unknown",
  }
  
  const topRailVisible = i.trfWidth-i.hol;
  const stileVisible = i.stilefWidth-i.jol;
  const bottomVisible = i.bfWidth-i.sol;

  const sashTotalWidth = i.w-i.jfWidth*2;
  const glazingTotalWidth = sashTotalWidth-i.stilefWidth*c.sashCount*2+i.jol*c.overlapCount;


  const hasSash = c.sashCount > 0 ? 1 : 0;
  const sashHeight = i.h-i.hfWidth-i.sfWidth;
  const glazingHeight = sashHeight-topRailVisible*hasSash-bottomVisible*hasSash;

  
  if (glazingTotalWidth <= 0) {
    debuglog("エラー: glazingTotalWidth が 0 以下です");
  }

  if (glazingHeight <= 0) {
    debuglog("エラー: glazingHeight が 0 以下です");
  }

  // グレージングの枚数
  const glazingCount = (c.category === "fixed") ? 1 : c.sashCount;
 
  // グレージングの総表面積
  const glazingArea = glazingTotalWidth*glazingHeight;

  // グレージングの総周長
  const glazingPerimeter = glazingTotalWidth*2+glazingHeight*glazingCount*2;
  
  /*
  debuglog("wM: " + i.w);
  debuglog("縦枠の見付け: " + inputs.jfWidth/1000);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("縦框の見付け: " + inputs.stilefWidth/1000);
  */

  debuglog("ガラスの総幅: " + glazingTotalWidth);
  debuglog("ガラスの高さ: " + glazingHeight);
  debuglog("上框の見える部分: " + topRailVisible);
  debuglog("縦框の見える部分: " + stileVisible);
  debuglog("下框の見える部分: " + bottomVisible);
  
  const headArea = i.w*i.hfWidth;                                                                          // 上枠の表面積
  const jambArea = (i.h-i.hfWidth-i.sfWidth)*i.jfWidth*2;                              // 縦枠の表面積
  const sillArea = i.w*i.sfWidth;                                                                            // 下枠の表面積
  const topRailArea = glazingTotalWidth*topRailVisible*hasSash;                                                         // 上框の表面積
  const stileArea = (i.h-i.hfWidth-i.sfWidth)*(i.stilefWidth*c.sashCount*2-i.jol*c.overlapCount);        // 縦框の表面積
  const bottomArea = glazingTotalWidth*bottomVisible*hasSash;                                                           // 下框の表面積

  const totalArea = headArea + jambArea + sillArea + topRailArea + stileArea + bottomArea + glazingArea;

  debuglog("木部の総面積: " + (headArea + jambArea + sillArea + topRailArea + stileArea + bottomArea));
  debuglog("グレージングの総面積: " + glazingArea);
  debuglog("グレージングの周長: " + glazingPerimeter);
  debuglog("窓の総面積: " + totalArea);


  return {
    glazingArea: glazingArea,
    glazingPerimeter: glazingPerimeter,
    totalArea: totalArea,
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