// window thermal calculator

const KEY_SINGLE_DOOR = "singleDoor";
const KEY_DOUBLE_DOOR = "doubleDoor";
const KEY_SLIDING = "sliding";
const KEY_FIXED = "fixed";

const MM_TO_M = 0.001;

let commonData = {};

// output コントロール
const output = document.getElementById("output");
const output2 = document.getElementById("output2");

const params = new URLSearchParams(window.location.search);

// string
const clientId = params.get("client");
console.log("clientId =", clientId);

function debuglog(msg) {
  if (!output) return;
  output.textContent += "\n" + msg;
}

function debuglog2(msg) {
  if (!output2) return;
  output2.textContent += "\n" + msg;
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

    buildSelectFromObject(
      "idSlidingType",
      commonData.slidingTypes,
      commonData.defaultSlidingType
    );  

    buildSelectFromObject(
      "idPocketType",
      commonData.pocketTypes,
      commonData.defaultPocketType
    );    

    // 枚数プルダウンの初期化
    rebuildSashCount(commonData.defaultSashCount);

    // イベント登録
    document
      .getElementById("idWindowType")
      .addEventListener("change", changeWindowType);

    document
      .getElementById("idSlidingType")
      .addEventListener("change", changeSlidingType);

    document
      .getElementById("idPocketType")
      .addEventListener("change", changePocketType);

    changeWindowType();

    buildSelectFromObject(
      "idAdvantageType",
      commonData.advantageTypes,
      commonData.defaultAdvantageType
    );

    buildSelectFromObject(
      "idWoodType",
      commonData.woodTypes,
      commonData.defaultWoodType
    );   

    buildSelectFromObject(
      "idSpacerType",
      commonData.spacerTypes,
      commonData.defaultSpacerType
    );
 
    // 初期値代入
    document.getElementById("fw").value = 1000;
    document.getElementById("fh").value = 1000;
    document.getElementById("ugInput").value = 1.6;


  if (client) {
        console.log("client config =", client);

        // コントロールに代入
        document.getElementById("headFaceW").value = client.HeadFaceWidth ?? "";
        document.getElementById("jambFaceW").value = client.JambFaceWidth ?? "";
        document.getElementById("sillFaceW").value = client.SillFaceWidth ?? "";
        

        document.getElementById("sillUpperH").value =
      client.SillUpperFaceWidth  ?? "";

      document.getElementById("frameD").value = client.FrameDepth ?? "";

      document.getElementById("sillUpperD").value =
      client.SillUpperDepth ?? "";

        document.getElementById("topRailFaceW").value = client.TopRailFaceWidth ?? "";
        document.getElementById("stileFaceW").value = client.StileFaceWidth ?? "";
        document.getElementById("bottomRailFaceW").value = client.BottomRailFaceWidth ?? "";
        document.getElementById("sashD").value = client.SashDepth ?? "";

        document.getElementById("meetingD").value =
      client.MeetingDepth ?? "";

        document.getElementById("hol").value = client.HeadOverlap ?? "";
        document.getElementById("jol").value = client.JambOverlap ?? "";
        document.getElementById("sol").value = client.SillOverlap ?? "";

        document.getElementById("capTotalH").value =
      client.CapTotalHeight ?? "";

    document.getElementById("capVisibleH").value =
      client.CapVisibleHeight ?? "";
      }     

      updateCalculation();   

  })
  .catch(err => {
    console.log("init error", err);
  });

// イベント登録
/*
if (btn) {
  btn.addEventListener("click", updateCalculation);
}*/

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

function getSashCountItems() {

  const sashCountItems =
    commonData.sashCountItems;

  const slidingType =
    document.getElementById("idSlidingType").value;
  const pocketType =
    document.getElementById("idPocketType").value;

  if(slidingType === "doublePocketSliding") {
    // 両袖引き込みは2固定
    return {
      "2": sashCountItems["2"]
    };
  }

  if (slidingType === "biPartingSliding") {
    return {
      "2": sashCountItems["2"],
      "4": sashCountItems["4"],
      "6": sashCountItems["6"],
      "8": sashCountItems["8"]
    };
  }

  if (slidingType === "unequalSliding") {
   
    if (pocketType === "noPocket") {
      return {
        "2": sashCountItems["2"],
        "3": sashCountItems["3"],
        "4": sashCountItems["4"],
        "5": sashCountItems["5"],
        "6": sashCountItems["6"],
        "7": sashCountItems["7"],
        "8": sashCountItems["8"]       
      };
    }
    
    return {
        "1": sashCountItems["1"],  
        "2": sashCountItems["2"],
        "3": sashCountItems["3"],
        "4": sashCountItems["4"],
        "5": sashCountItems["5"],
        "6": sashCountItems["6"],
        "7": sashCountItems["7"]             
    };

  }

  return {};
}

function rebuildSashCount(selectedKey) {
  buildSelectFromObject(
    "idSashCount",
    getSashCountItems(),
    selectedKey
  );
}
 
function changeWindowType() {

  // 窓種プルダウンが選択されたとき
  const allControls = [
    "idSlidingType",
    "idPocketType",
    "idSashCount",
    "labelTopRailFaceW",
    "topRailFaceW",
    "labelTopRailFaceWMM",
    "labelStileFaceW",
    "stileFaceW",
    "labelStileFaceWMM",    
    "labelBottomRailFaceW",
    "bottomRailFaceW",
    "labelBottomRailFaceWMM",
    "labelSashD",
    "sashD",
    "labelSashDMM",
    "labelHol",
    "hol",
    "labelHolMM",
    "labelJol",
    "jol",
    "labelJolMM",
    "labelSol",
    "sol",
    "labelSolMM",
    "labelSillUpperH",
    "sillUpperH",
    "labelSillUpperHMM",
    "labelSillUpperD",
    "sillUpperD",
    "labelSillUpperDMM",
    "labelMeetingD",
    "meetingD",
    "labelMeetingDMM",
    "labelCapTotalH",
    "capTotalH",
    "labelCapTotalHMM",
    "labelCapVisibleH",
    "capVisibleH",
    "labelCapVisibleHMM"
  ]; 

  const map = {
    sliding: [
      "idSlidingType",
      "idPocketType",
      "idSashCount",
      "labelTopRailFaceW",
      "topRailFaceW",
      "labelTopRailFaceWMM",
      "labelStileFaceW",
      "stileFaceW",
      "labelStileFaceWMM",    
      "labelBottomRailFaceW",
      "bottomRailFaceW",
      "labelBottomRailFaceWMM",
      "labelSashD",
      "sashD",
      "labelSashDMM",
      "idSlidingType",
      "idPocketType",
      "idSashCount",
      "labelSillUpperH",
      "sillUpperH",
      "labelSillUpperHMM",
      "labelSillUpperD",
      "sillUpperD",
      "labelSillUpperDMM",
      "labelMeetingD",
      "meetingD",
      "labelMeetingDMM",
      "labelCapTotalH",
      "capTotalH",
      "labelCapTotalHMM",
      "labelCapVisibleH",
      "capVisibleH",
      "labelCapVisibleHMM"   
    ],
    singleDoor: [
      "labelTopRailFaceW",
      "topRailFaceW",
      "labelTopRailFaceWMM",
      "labelStileFaceW",
      "stileFaceW",
      "labelStileFaceWMM",    
      "labelBottomRailFaceW",
      "bottomRailFaceW",
      "labelBottomRailFaceWMM",
      "labelSashD",
      "sashD",
      "labelSashDMM",
      "labelHol",
      "hol",
      "labelHolMM",
      "labelJol",
      "jol",
      "labelJolMM",
      "labelSol",
      "sol",
      "labelSolMM"
    ],
    doubleDoor: [
      "labelTopRailFaceW",
      "topRailFaceW",
      "labelTopRailFaceWMM",
      "labelStileFaceW",
      "stileFaceW",
      "labelStileFaceWMM",    
      "labelBottomRailFaceW",
      "bottomRailFaceW",
      "labelBottomRailFaceWMM",
      "labelSashD",
      "sashD",
      "labelSashDMM",
      "labelHol",
      "hol",
      "labelHolMM",
      "labelJol",
      "jol",
      "labelJolMM",
      "labelSol",
      "sol",
      "labelSolMM"
    ],
    fixed: []
  };

   // 一旦、制御対象を全部隠す
  allControls.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.hidden = true;
    }
  });

  // 選択されたものだけ表示
  const windowType =
    document.getElementById("idWindowType")?.value;

  const targetIds = map[windowType] ?? [];

  targetIds.forEach(id => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.hidden = false;
    }
  });

  console.log(
  document.getElementById("idSlidingType").value
);
}

function changeSlidingType() {
  const current =
    document.getElementById("idSashCount").value;

  rebuildSashCount(current);
}

function changePocketType() {
  const current =
    document.getElementById("idSashCount").value;

  rebuildSashCount(current);
}


function updateCalculation() {

  if(output) output.textContent = "";
  if(output2) output2.textContent = "";
  
  const inputs = getInputs();
  const selected = getSelected();
  const config = getConfig(selected);

  const result = calculateUw(inputs,selected,config);

  if (result == null) {
  debuglog("計算できませんでした");
  return;
  }

  renderResult(result);
}

// 計算メイン関数
function calculateUw(inputs,selected,config) {
    
  // 計算スタート  

  const areaSet = getAreas(inputs,selected,config);

  debuglog("上枠の表面積: " + areaSet.headArea*MM_TO_M*MM_TO_M);
  debuglog("縦枠の表面積: " + areaSet.jambArea*MM_TO_M*MM_TO_M);
  debuglog("下枠の表面積: " + areaSet.sillArea*MM_TO_M*MM_TO_M);
  debuglog("上框の表面積: " + areaSet.topRailArea*MM_TO_M*MM_TO_M);
  debuglog("縦框の表面積: " + areaSet.stileArea*MM_TO_M*MM_TO_M);
  debuglog("下框の表面積: " + areaSet.bottomArea*MM_TO_M*MM_TO_M);

  if(selected.lambdaWood <= 0 ){
    debuglog("木部の熱伝導率: lambdaWood が 0 以下です");
    return null;
  }

  const resistSet = getResist(inputs,selected,config);

  debuglog2("3方枠の総抵抗値: " + resistSet.frameResistSide);
  debuglog2("下枠の総抵抗値: " + resistSet.frameResistSill);
  if(areaSet.topRailArea + areaSet.stileArea + areaSet.bottomArea>0) debuglog2("障子の総抵抗値: " + resistSet.sashResist);
  debuglog("Ug: " + inputs.ugInput);

  if(resistSet.frameResistSide <=0 || resistSet.frameResistSill <=0 || resistSet.sashResist <=0 ){
    debuglog("熱抵抗: frameResistSide 又は frameResistSill 又は sashResistが 0 以下です");
    return null;
  } 

  // 熱損失係数
  const fHeatLossRate = (1/resistSet.frameResistSide)*(areaSet.headArea*MM_TO_M*MM_TO_M+areaSet.jambArea*MM_TO_M*MM_TO_M)+(1/resistSet.frameResistSill)*areaSet.sillArea*MM_TO_M*MM_TO_M + (1/resistSet.sashResist)*(areaSet.topRailArea*MM_TO_M*MM_TO_M+areaSet.stileArea*MM_TO_M*MM_TO_M+areaSet.bottomArea*MM_TO_M*MM_TO_M);
  debuglog("木部の熱損失係数: " + fHeatLossRate);

  const gHeatLossRate = inputs.ugInput*areaSet.glazingArea*MM_TO_M*MM_TO_M;
  debuglog("グレージングの熱損失係数: " + gHeatLossRate);

  const pHeatLossRate = config.spacerPsi*areaSet.glazingPerimeter*MM_TO_M;
  
  debuglog("スペーサーの熱損失係数: " + pHeatLossRate);
  debuglog("スペーサーのpsi: " + config.spacerPsi);

  const totalHeatLossRate = fHeatLossRate + gHeatLossRate + pHeatLossRate

  const Uw = totalHeatLossRate/(areaSet.totalArea*MM_TO_M*MM_TO_M);

  const UwDisolay = Uw.toFixed(2);
  
  return UwDisolay;
 
}

// 最終表示
function renderResult(result) {
  document.getElementById("uwResult").value = result;
}

// Get系関数

function getConfig(selected) {

  if (!commonData) {
    debuglog("commonData未ロード");
    return null;
  }  
  
  const gt = commonData.glassTypes?.[selected.glassTypeKey];
  if (!gt){
    debuglog(selected.glassTypeKey);
    debuglog(commonData.glassTypes);
    return null;     
  }

  const slt = commonData.slidingTypes?.[selected.slidingTypeKey];
  if (!slt){
    debuglog(selected.slidingTypeKey);
    debuglog(commonData.slidingTypes);
    return null;
  }

  const pt = commonData.pocketTypes?.[selected.pocketTypeKey];
  if (!pt){
    debuglog(selected.pocketTypeKey);
    debuglog(commonData.pocketTypes);
    return null;
  }

  const sct = commonData.sashCountItems?.[selected.sashCountKey];
  if (!sct){
    debuglog(selected.sashCountKey);
    debuglog(commonData.sashCountItems);
    return null;
  }

  const wt = commonData.windowTypes?.[selected.windowTypeKey];
  if (!wt){
    debuglog(selected.windowTypeKey);
    debuglog(commonData.windowTypes);
    return null;
  } 

  const at = commonData.advantageTypes?.[selected.advantageTypeKey];
  if (!at){
    debuglog(selected.advantageTypeKey);
    debuglog(commonData.advantageTypes);
    return null;
  } 

  const woodt = commonData.woodTypes?.[selected.woodTypeKey];
  if (!woodt){
    debuglog(selected.woodTypeKey);
    debuglog(commonData.woodTypes);
    return null;
  } 

  const st = commonData.spacerTypes?.[selected.spacerTypeKey];
  if (!st){
    debuglog(selected.spacerTypeKey);
    debuglog(commonData.spacerTypes);
    return null;
  } 

  return {
    gt: gt,
    slt: slt,
    pt: pt,
    sct: sct,
    wt: wt,
    at: at,
    woodt: woodt,
    st: st,

    sashCount: parseInt(selected.sashCountKey) || 0,
    overlapCount: wt.overlapCount ?? 0,
    category: wt.category ?? "unknown",
        
    lambdaWood: woodt.lambdaWood ?? 0,
    spacerPsi: st.psi ?? 0,    

    rsi: commonData.rsi,
    rse: commonData.rse
  };
}

function getInputs() {
  return {
    
    fw: parseFloat(document.getElementById("fw").value) || 0,
    fh: parseFloat(document.getElementById("fh").value) || 0,

    ugInput: parseFloat(document.getElementById("ugInput").value) || 0,
  
    headFaceW: parseFloat(document.getElementById("headFaceW").value) || 0,
    jambFaceW: parseFloat(document.getElementById("jambFaceW").value) || 0,
    sillFaceW: parseFloat(document.getElementById("sillFaceW").value) || 0,

    sillUpperH: parseFloat(document.getElementById("sillUpperH").value) || 0,

    frameD: parseFloat(document.getElementById("frameD").value) || 0,

    sillUpperD: parseFloat(document.getElementById("sillUpperD").value) || 0,

    topRailFaceW: parseFloat(document.getElementById("topRailFaceW").value) || 0,
    stileFaceW: parseFloat(document.getElementById("stileFaceW").value) || 0,
    bottomRailFaceW: parseFloat(document.getElementById("bottomRailFaceW").value) || 0,
    sashD: parseFloat(document.getElementById("sashD").value) || 0,

    meetingD: parseFloat(document.getElementById("meetingD").value) || 0,
    
    hol: parseFloat(document.getElementById("hol").value) || 0,
    jol: parseFloat(document.getElementById("jol").value) || 0,
    sol: parseFloat(document.getElementById("sol").value) || 0,

    capTotalH: parseFloat(document.getElementById("capTotalH").value) || 0,
    capVisibleH: parseFloat(document.getElementById("capVisibleH").value) || 0
  };
}

function getSelected() {
  return {    
    glassTypeKey: document.getElementById("idGlassType").value,
    slidingTypeKey: document.getElementById("idSlidingType").value,
    pocketTypeKey: document.getElementById("idPocketType").value,
    sashCountKey: document.getElementById("idSashCount").value,
    windowTypeKey: document.getElementById("idWindowType").value,
    advantageTypeKey: document.getElementById("idAdvantageType").value,
    woodTypeKey: document.getElementById("idWoodType").value,
    spacerTypeKey: document.getElementById("idSpacerType").value,   
  };
}

function getSlidingAreas(inputs, selected, config) {

  const sillUpperH = inputs.sillUpperH;
  const sillUpperD = inputs.sillUpperD;

  const meetingD = inputs.meetingD;

  const capTotalH = inputs.capTotalH;
  const capVisibleH = inputs.capVisibleH;
  
  debuglog2("下枠上段高さ: " + sillUpperH);
  debuglog2("下枠上段見込み: " + sillUpperD);
  debuglog2("召合せ見込み: " + meetingD);
  debuglog2("笠木全高さ: " + capTotalH);
  debuglog2("笠木見え掛かり: " + capVisibleH);
 
  // 左右の縦枠を除いた枠内幅
  const frameInnerWidth = inputs.fw - inputs.jambFaceW * 2;

  /// 上枠と下枠全体を除いた枠内高さ
  const frameInnerHeight = inputs.fh - inputs.headFaceW - inputs.sillFaceW;

  // 下枠下段の高さ
  const sillLowerH =
    inputs.sillFaceW - sillUpperH;

  // 笠木と障子が重なる高さ
  const capOverlapH = capTotalH - capVisibleH;
  debuglog2("笠木重なり高さ: " + capOverlapH);

  const sashCount = config.sashCount;
  const meetingCount = sashCount - 1;

  // 笠木の見え掛かりを除いた障子高さ
  const sashHeight = frameInnerHeight - capVisibleH;

  // 召し合わせの見付け
  const meetingFaceW = inputs.stileFaceW;

  // 全障子の実幅合計
  const sashTotalWidth = frameInnerWidth + meetingFaceW * meetingCount;

  // 障子1枚の幅
  const sashWidth =
    sashTotalWidth / sashCount;

  // ガラスの枚数
  const glazingCount =
    sashCount;

  // 障子1枚当たりのガラス幅
  const glazingWidth =
    sashWidth - inputs.stileFaceW * 2;

  // 障子1枚当たりのガラス高さ
  const glazingHeight =
    sashHeight
    - inputs.topRailFaceW
    - inputs.bottomRailFaceW;

  // 全ガラスの幅合計
  const glazingTotalWidth =
    glazingWidth * glazingCount;

  // 通常の縦框数
  // 左端と右端の2本
  const normalStileCount = 2;

  // 召合せ優先のため、笠木から召合せ幅を除いた長さ
  const capEffectiveLength =
    frameInnerWidth
    - meetingFaceW * meetingCount;

  // 召合せ框の高さ
  const meetingHeight =
    sashHeight;


  // 三方枠
  const threeSideFrameArea =
    inputs.fw * inputs.headFaceW
    + frameInnerHeight * inputs.jambFaceW * 2;

  // 下枠上段
  const sillUpperArea =
    inputs.fw * sillUpperH;

  // 下枠下段
  const sillLowerArea =
  inputs.fw * sillLowerH;

  // 笠木見え掛かり部
  const capVisibleArea =
  capEffectiveLength * capVisibleH;
 
  // 通常障子框
  const normalSashArea =
    glazingTotalWidth * inputs.topRailFaceW
    + glazingTotalWidth * inputs.bottomRailFaceW
    + normalStileCount * inputs.stileFaceW * sashHeight;

    debuglog2(
  "通常縦框2本のみ: "
  + normalStileArea * MM_TO_M * MM_TO_M
);

debuglog2(
  "通常縦框1本換算: "
  + normalStileArea / normalStileCount * MM_TO_M * MM_TO_M
);

debuglog2(
  "召合せ1本: "
  + meetingFaceW * meetingHeight * MM_TO_M * MM_TO_M
);

  // 召合せ部
  const meetingArea =
    meetingFaceW * meetingHeight * meetingCount;


  // 笠木・障子重なり部
  const capSashOverlapArea =
    capEffectiveLength * capOverlapH;

  // ガラス
  const glazingArea =
    glazingWidth * glazingHeight * glazingCount;

  // スペーサー周長
  const glazingPerimeter =
    (glazingWidth + glazingHeight) * 2 * glazingCount;
  
  // 表面積の総合計
  const totalArea =
    threeSideFrameArea
    + sillUpperArea
    + sillLowerArea
    + capVisibleArea
    + normalSashArea
    + meetingArea
    + capSashOverlapArea
    + glazingArea;

   // デバッグ表示
    debuglog2(
      "三方枠の表面積: "
      + threeSideFrameArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "下枠上段の表面積: "
      + sillUpperArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "下枠下段の表面積: "
      + sillLowerArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "笠木見え掛かり部の表面積: "
      + capVisibleArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "通常障子框の表面積: "
      + normalSashArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "召合せ部の表面積: "
      + meetingArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "笠木・障子重なり部の表面積: "
      + capSashOverlapArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "ガラスの総表面積: "
      + glazingArea * MM_TO_M * MM_TO_M
    );

    debuglog2(
      "スペーサーの総周長: "
      + glazingPerimeter * MM_TO_M
    );

    debuglog2(
      "表面積の総合計: "
      + totalArea * MM_TO_M * MM_TO_M
    );
    
    return {
      threeSideFrameArea: threeSideFrameArea,

      sillUpperArea: sillUpperArea,
      sillLowerArea: sillLowerArea,

      capVisibleArea: capVisibleArea,

      normalSashArea: normalSashArea,
      meetingArea: meetingArea,

      capSashOverlapArea: capSashOverlapArea,

      glazingArea: glazingArea,
      glazingPerimeter: glazingPerimeter
    };

}

function getAreas(inputs,selected,config) {

  if (config.category === "sliding") {
    return getSlidingAreas(inputs, selected, config);
  }


  // 障子の見え掛かり寸法
  const topRailVisible = inputs.topRailFaceW-inputs.hol;
  const stileVisible = inputs.stileFaceW-inputs.jol;
  const bottomVisible = inputs.bottomRailFaceW-inputs.sol;

  const sashTotalWidth = inputs.fw-inputs.jambFaceW*2;

  const glazingTotalWidth = sashTotalWidth-inputs.stileFaceW*config.sashCount*2+inputs.jol*config.overlapCount;

  // グレージングの枚数
  const glazingCount = (config.category === "fixed") ? 1 : config.sashCount;

  if(glazingCount===0) {
    debuglog("エラー: glazingCount が 0 です");
    return null;
  }

  // グレージング1枚あたりの幅
  const glazingWidth = glazingTotalWidth / glazingCount;

  // 障子が存在しているかどうか
  const hasSash = config.sashCount > 0 ? 1 : 0;

  const frameInnerHeight = inputs.fh-inputs.headFaceW-inputs.sillFaceW;
  const sashHeight = frameInnerHeight;
  const glazingHeight = sashHeight-topRailVisible*hasSash-bottomVisible*hasSash;

  
  if (glazingWidth <= 0) {
    debuglog("エラー: glazingWidth が 0 以下です");
  }

  if (glazingHeight <= 0) {
    debuglog("エラー: glazingHeight が 0 以下です");
  }
 
  // グレージングの総表面積
  const glazingArea = glazingWidth*glazingHeight*glazingCount;

  // グレージングの総周長
  const glazingPerimeter = (glazingWidth+glazingHeight)*2*glazingCount;
  
 
  debuglog2("グレージングの総幅: " + glazingTotalWidth*MM_TO_M);
  debuglog2("グレージングの高さ: " + glazingHeight*MM_TO_M);
 
  const frameInnerWidth = inputs.fw - inputs.jambFaceW*2;

  const isHorizontal = selected.advantageTypeKey === "horizontal";
  
  const headArea = isHorizontal ? inputs.fw*inputs.headFaceW : frameInnerWidth*inputs.headFaceW;       // 上枠の表面積
  const jambArea = isHorizontal ? frameInnerHeight*inputs.jambFaceW*2 : inputs.fh*inputs.jambFaceW*2; // 縦枠の表面積
  const sillArea = isHorizontal ? inputs.fw*inputs.sillFaceW : frameInnerWidth*inputs.sillFaceW;       // 下枠の表面積
  
  const topRailArea = glazingTotalWidth*topRailVisible*hasSash;                                                            // 上框の表面積
  const stileArea = frameInnerHeight*(inputs.stileFaceW*config.sashCount*2-inputs.jol*config.overlapCount);               // 縦框の表面積
  const bottomArea = glazingTotalWidth*bottomVisible*hasSash;                                                              // 下框の表面積

  const totalArea = headArea + jambArea + sillArea + topRailArea + stileArea + bottomArea + glazingArea;

  debuglog("木部の総面積: " + (headArea + jambArea + sillArea + topRailArea + stileArea + bottomArea)*MM_TO_M*MM_TO_M);
  debuglog("グレージングの総面積: " + glazingArea*MM_TO_M*MM_TO_M);
  debuglog2("グレージングの周長: " + glazingPerimeter*MM_TO_M);
  debuglog("窓の総面積: " + totalArea*MM_TO_M*MM_TO_M);

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

 
function getResist(inputs,selected,config) {

  const frameResistSide = config.rsi+(inputs.frameD*MM_TO_M)/config.lambdaWood+config.rse;
  const frameResistSill = config.rsi+(inputs.frameD*MM_TO_M)/config.lambdaWood+config.rse;
  const sashResist = config.rsi+(inputs.sashD*MM_TO_M)/config.lambdaWood+config.rse;

  debuglog("木部の熱伝導率: " + config.lambdaWood);
  debuglog2("室内側表面抵抗: " + config.rsi);
  debuglog2("室外側表面抵抗: " + config.rse);

  return {
    frameResistSide: frameResistSide,
    frameResistSill: frameResistSill,
    sashResist: sashResist   
  };
 
 
}