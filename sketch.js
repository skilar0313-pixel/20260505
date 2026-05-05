let capture;
let pg; // 宣告繪圖緩衝區
let saveBtn; // 儲存按鈕
let faceMesh; // FaceMesh 模型
let faces = []; // 存放偵測到的臉部結果

// 指定的臉部辨識連線編號順序
const lipIndices = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 取得攝影機影像
  capture = createCapture(VIDEO);
  
  // 隱藏預設出現在畫布下方的 HTML5 影片元件，只在畫布內繪製
  capture.hide();

  // 初始化 FaceMesh
  const faceMeshOptions = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
  faceMesh = ml5.faceMesh(faceMeshOptions, () => {
    console.log("臉部辨識模型已就緒");
  });
  // 開始持續偵測
  faceMesh.detectStart(capture, (results) => { faces = results; });

  // 建立一個繪圖緩衝區，大小設定為畫布寬高的 60%
  pg = createGraphics(windowWidth * 0.6, windowHeight * 0.6);

  // 建立儲存按鈕
  saveBtn = createButton('儲存影像');
  saveBtn.mousePressed(saveImage);
  updateButtonPosition();
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');
  
  // 檢查攝影機是否已就緒，避免 NotFoundError 導致寬度為 0 產生運算錯誤 (NaN)
  if (!capture || capture.width === 0 || capture.height === 0) {
    fill(50);
    textAlign(CENTER, CENTER);
    textSize(20);
    text("⚠️ 正在啟動攝影機，或找不到攝影機設備...\n(請檢查瀏覽器權限或是否使用 HTTPS/Localhost)", width / 2, height / 2);
    return;
  }

  // 計算影像寬高 (全螢幕的 60%)
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  
  // 計算置中座標
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;
  
  // 更新 createGraphics 緩衝區的內容
  pg.push();
  pg.clear(); // 清除上一幀內容，保持緩衝區乾淨（或透明）
  pg.translate(pg.width, 0);
  pg.scale(-1, 1); // 同樣實作鏡像翻轉，確保內容一致
  pg.image(capture, 0, 0, pg.width, pg.height);
  pg.pop();

  // 修正左右顛倒問題（實作水平翻轉鏡像）
  push(); 
  // 將原點移動到影像預定位置的右邊緣
  translate(x + videoW, y);
  // 水平翻轉座標軸：-1 代表 X 軸方向反轉
  scale(-1, 1);
  // 由於座標軸已翻轉，從 (0, 0) 開始繪製即可顯示在正確位置
  image(capture, 0, 0, videoW, videoH);

  // 繪製臉部網格連線
  if (faces.length > 0) {
    let face = faces[0];
    
    stroke(255, 0, 0); // 設定線條採用紅色
    strokeWeight(15);  // 設定線條粗細為 15
    noFill();
    
    for (let i = 0; i < lipIndices.length - 1; i++) {
      let p1 = face.keypoints[lipIndices[i]];
      let p2 = face.keypoints[lipIndices[i + 1]];
      if (p1 && p2) {
        // 利用 line 指令，將編號點串接在一起，並依比例映射到 60% 的畫面大小
        line(p1.x * (videoW / capture.width), p1.y * (videoH / capture.height), 
             p2.x * (videoW / capture.width), p2.y * (videoH / capture.height));
      }
    }
  }
  pop();

  // 將 pg 緩衝區的內容顯示在「視訊畫面的上方」
  // 這裡將 Y 座標稍微往上移（減去位移量），並縮小顯示以做出層次感
  image(pg, x + videoW * 0.1, y - 60, videoW * 0.8, videoH * 0.8);
}

// 當視窗大小改變時，自動調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 同步調整緩衝區的大小
  pg.resizeCanvas(windowWidth * 0.6, windowHeight * 0.6);
  updateButtonPosition();
}

// 更新按鈕位置，使其顯示在視訊畫面的右下方
function updateButtonPosition() {
  let videoW = width * 0.6;
  let videoH = height * 0.6;
  let x = (width - videoW) / 2;
  let y = (height - videoH) / 2;
  // 將按鈕放在視訊右下角偏移一點的位置
  saveBtn.position(x + videoW - 80, y + videoH + 20);
}

// 執行存檔
function saveImage() {
  saveCanvas('my_capture', 'png');
}