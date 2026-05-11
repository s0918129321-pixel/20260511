let capture;
let faceMesh;
let handPose;
let predictions = [];
let hands = [];
let maskImages = []; // 儲存面具圖片
let currentMaskIndex = 0; // 預設使用第一個面具

function preload() {
  // 載入 mask 目錄下的面具圖片
  maskImages[0] = loadImage('images/mask/4379901.png');
  maskImages[1] = loadImage('images/mask/4379902.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 這裡設定偵測用的解析度
  // 隱藏預設產生的 HTML5 video 元件，只在畫布上繪製
  capture.hide();

  // 初始化 FaceMesh 模型
  faceMesh = ml5.faceMesh(capture, { maxFaces: 1, flipped: true }, modelReady);
  // 開始持續偵測臉部
  faceMesh.detectStart(capture, results => {
    predictions = results;
  });

  // 初始化 HandPose 模型
  handPose = ml5.handPose(capture, { flipped: true }, () => console.log("HandPose Model Ready!"));
  // 開始持續偵測手部，當偵測到手時會更新 hands 陣列
  handPose.detectStart(capture, results => {
    hands = results;
  });
}

function modelReady() {
  console.log("FaceMesh Model Ready!");
}

function draw() {
  background('#e7c6ff');

  let w = width * 0.5;
  let h = height * 0.5;

  push();
  // 移動座標原點至畫面中心
  translate(width / 2, height / 2);
  // 水平翻轉影像 (左右顛倒)
  scale(-1, 1);

  // 檢查攝影機是否正常運作
  if (capture.width <= 1) {
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(20);
    // 因為 scale(-1, 1)，文字也需要反過來才看得懂，或者暫時 pop 再畫
    scale(-1, 1); 
    text("找不到攝影機或正在載入中...", 0, 0);
    pop();
    return;
  }

  // 繪製影像，並將其置中於目前座標
  image(capture, -w / 2, -h / 2, w, h);
  
  // 設定圖片的繪製模式為中心點
  imageMode(CENTER);

  // 偵測手部是否出現在畫面中來切換面具 (揮手到螢幕前)
  if (hands.length > 0) {
    currentMaskIndex = 1;
  } else {
    currentMaskIndex = 0;
  }

  // 繪製面具位置
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      let keypoints = predictions[i].keypoints;
      
      // 取得臉部關鍵點：168 為鼻樑（中心），10 為頭頂，152 為下巴，234 為右臉邊緣，454 為左臉邊緣
      let pCenter = keypoints[168];
      let pTop = keypoints[10];
      let pBottom = keypoints[152];
      let pLeft = keypoints[234];
      let pRight = keypoints[454];

      // 將座標對應到畫布中央 50% 的區域
      let x = map(pCenter.x, 0, capture.width, -w / 2, w / 2);
      let y = map(pCenter.y, 0, capture.height, -h / 2, h / 2);
      
      // 計算面具應有的寬度與高度（根據臉部特徵點距離動態計算）
      let faceWidth = dist(pLeft.x, pLeft.y, pRight.x, pRight.y) * (w / capture.width);
      let faceHeight = dist(pTop.x, pTop.y, pBottom.x, pBottom.y) * (h / capture.height);

      // 顯示目前面具，並根據臉部大小進行縮放（1.6 與 2.0 為覆蓋率調整係數）
      if (maskImages[currentMaskIndex]) {
        image(maskImages[currentMaskIndex], x, y, faceWidth * 1.6, faceHeight * 2.0);
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
