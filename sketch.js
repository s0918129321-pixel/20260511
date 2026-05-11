let capture;
let faceMesh;
let predictions = [];

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
  // 繪製影像，並將其置中於目前座標
  image(capture, -w / 2, -h / 2, w, h);

  // 繪製耳垂位置
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      let keypoints = predictions[i].keypoints;
      // FaceMesh 索引: 132 為右耳垂區域, 361 為左耳垂區域
      let earIndices = [132, 361];

      fill(255, 255, 0); // 黃色
      noStroke();
      for (let index of earIndices) {
        let p = keypoints[index];
        // 將攝影機原始座標對應到畫布上的縮放座標
        let x = map(p.x, 0, capture.width, -w / 2, w / 2);
        let y = map(p.y, 0, capture.height, -h / 2, h / 2);
        ellipse(x, y, 15, 15);
      }
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
