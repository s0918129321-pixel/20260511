let capture;
let faceMesh;
let handPose;
let predictions = [];
let hands = [];
let earringImages = []; // 儲存 5 種耳環圖片
let currentEarringIndex = 0; // 預設使用第一對

function preload() {
  // 載入 images 目錄下對應手勢的耳環圖片
  earringImages[0] = loadImage('images/acc1_ring.png');
  earringImages[1] = loadImage('images/acc2_pearl.png');
  earringImages[2] = loadImage('images/acc3_tassel.png');
  earringImages[3] = loadImage('images/acc4_jade.png');
  earringImages[4] = loadImage('images/acc5_phoenix.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  // 隱藏預設產生的 HTML5 video 元件，只在畫布上繪製
  capture.hide();

  // 初始化 FaceMesh 模型
  faceMesh = ml5.faceMesh(capture, modelReady);
  // 開始持續偵測臉部
  faceMesh.detectStart(capture, results => {
    predictions = results;
  });

  // 初始化 HandPose 模型
  handPose = ml5.handPose(capture, () => console.log("HandPose Model Ready!"));
  // 開始持續偵測手部
  handPose.detectStart(capture, results => {
    hands = results;
    updateEarringSelection();
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

  // 繪製耳垂位置
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      let keypoints = predictions[i].keypoints;
      // FaceMesh 索引: 132 為右耳垂區域, 361 為左耳垂區域
      let earIndices = [132, 361];
      for (let index of earIndices) {
        let p = keypoints[index];
        // 使用更安全的座標對應方式
        let x = map(p.x, 0, 640, -w / 2, w / 2);
        let y = map(p.y, 0, 480, -h / 2, h / 2);
        
        // 顯示目前根據手勢選中的耳環
        if (earringImages[currentEarringIndex]) {
          image(earringImages[currentEarringIndex], x, y, 40, 80); // 調整大小讓耳環更明顯
        }
      }
    }
  }
  pop();
}

/**
 * 根據偵測到的手指數量更新 currentEarringIndex
 */
function updateEarringSelection() {
  if (hands.length > 0) {
    let hand = hands[0];
    let count = 0;

    // 判定食指、中指、無名指、小指是否伸直 (指尖 Y 座標小於第二關節)
    if (hand.index_finger_tip.y < hand.index_finger_pip.y) count++;
    if (hand.middle_finger_tip.y < hand.middle_finger_pip.y) count++;
    if (hand.ring_finger_tip.y < hand.ring_finger_pip.y) count++;
    if (hand.pinky_finger_tip.y < hand.pinky_finger_pip.y) count++;

    // 判定大拇指 (根據 X 座標判斷是否張開，需考量鏡像)
    // 這裡使用簡單的距離判定或相對位置
    if (dist(hand.thumb_tip.x, hand.thumb_tip.y, hand.pinky_finger_mcp.x, hand.pinky_finger_mcp.y) > 
        dist(hand.thumb_ip.x, hand.thumb_ip.y, hand.pinky_finger_mcp.x, hand.pinky_finger_mcp.y)) {
      count++;
    }

    // 如果手指數量在 1-5 之間，更新索引 (1指對應 index 0, 5指對應 index 4)
    if (count >= 1 && count <= 5) {
      currentEarringIndex = count - 1;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
