function start() {
    document.getElementById('start').style.display = 'none';
    updatePrice();
    setInterval(updatePrice, 300000);
}

function work() {
    playDon();
    setTimeout(playDon, 1200000);
}

let lastTime = null;

async function playBuy() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            let buyNotice = new Audio('buy.mp3');
            buyNotice.play();
        }, 100);
    }
}
async function playSell() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            let sellNotice = new Audio('sell.mp3');
            sellNotice.play();
        }, 100);
    }
}
async function playDon() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            let don = new Audio('don.mp3');
            don.play();
        }, 100);
    }
}

function updatePrice() {
    // https://api.takasumibot.com/v1/trade
    let url = 'https://api.takasumibot.com/v1/trade';
    // データを取得する
    let options = { mode: "cors" }
    fetch(url, options)
        .then(response => response.json())
        .then(data => {
            priceLog = data.data;
            // グラフの描画
            drawGraph(priceLog);
            let price = priceLog[priceLog.length - 1].price;
            document.getElementById('price').innerText = price + 'コイン';
            let fluctPrice = price - priceLog[priceLog.length - 2].price;
            let fluctRate = fluctPrice / priceLog[priceLog.length - 2].price * 100;
            document.getElementById('fluctPrice').innerText = fluctPrice.toFixed(2) + 'コイン';
            document.getElementById('fluctRate').innerText = fluctRate.toFixed(2) + '%';
            let fluctBox = document.getElementById('fluct');
            if (priceLog[priceLog.length - 1].time !== lastTime && lastTime == null) {
                lastTime = priceLog[priceLog.length - 1].time;
                if (fluctPrice > 0) {
                    fluctBox.style.backgroundColor = 'green';
                    if (fluctPrice > 40) {
                        playSell();
                    }
                }
                else {
                    fluctBox.style.backgroundColor = 'red';
                    if (fluctPrice < -40) {
                        playBuy();
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Canvas要素を取得
const canvas = document.getElementById('chart');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const ctx = canvas.getContext('2d');
let priceLog = [];
let dataLocations = [];
let lastData = null;

// グラフの描画
function drawGraph(data) {
    // リセット
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // グラフの幅と高さ
    const width = canvas.width;
    const height = canvas.height;
    // 軸を描画
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(100, 0);// 原点
    ctx.lineTo(100, height - 100);// y軸
    ctx.lineTo(width - 100, height - 100);// x軸
    ctx.stroke();
    // マス目を描画
    ctx.beginPath();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < height / 50 - 2; i++) {
        ctx.moveTo(100, 50 * i);
        ctx.lineTo(width - 100, 50 * i);
    }
    for (let i = 0; i < (width - 200) / 50; i++) {
        ctx.moveTo(100 + 50 * i, 0);
        ctx.lineTo(100 + 50 * i, height - 100);
    }
    ctx.stroke();

    // データの最大/最小値を取得
    const maxPrice = Math.max(...data.map(item => parseInt(item.price)));
    const minPrice = Math.min(...data.map(item => parseInt(item.price)));

    // 最大/最小値の間にグラフを描画
    const topLine = maxPrice + 10;
    const underLine = minPrice - 10;
    const priceRange = topLine - underLine;
    const pxPerPrice = (height - 100) / priceRange;
    // 目盛りを描画
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
        ctx.fillText(Math.round(priceRange / 12 * i + underLine), 90, (height - 100) / 12 * (12 - i));
    }
    ctx.textAlign = 'center';
    // 時間と分だけを取得
    // 2024-05-06 08:45:00
    let times = data.map(item => item.time.slice(11, 16));
    for (let i = 0; i < 24; i++) {
        // 全部で96個のデータがある
        ctx.fillText(times[4 * i], 100 + (width - 200) / 24 * i, height - 80);
    }
    ctx.fillText("now", width - 100, height - 80);
    ctx.stroke();

    // データを描画
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth
    ctx.moveTo(100, (topLine - data[0].price) * pxPerPrice);
    dataLocations = [[100, (topLine - data[0].price) * pxPerPrice]];
    for (let i = 1; i < data.length; i++) {
        ctx.lineTo(100 + (width - 200) / 96 * i, (topLine - data[i].price) * pxPerPrice);
        dataLocations.push([100 + (width - 200) / 96 * i, (topLine - data[i].price) * pxPerPrice]);
    }
    ctx.stroke();

    // マウスが乗ったときに30px以内の最も近いデータを表示
    // 現在のグラフを保存
    lastData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}
canvas.addEventListener('mousemove', e => {
    let x = e.offsetX;
    let y = e.offsetY;
    let minDist = 120;// 120px以内のデータを表示
    let minIndex = -1;
    for (let i = 0; i < dataLocations.length; i++) {
        let dist = Math.sqrt((x - dataLocations[i][0]) ** 2 + (y - dataLocations[i][1]) ** 2);
        if (dist < minDist) {
            minDist = dist;
            minIndex = i;
        }
    }
    if (minIndex !== -1) {
        // 点を描画
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(lastData, 0, 0);
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.arc(dataLocations[minIndex][0], dataLocations[minIndex][1], 5, 0, Math.PI * 2);
        ctx.stroke();
        // データを表示
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // 背景
        ctx.fillStyle = 'white';
        ctx.fillRect(dataLocations[minIndex][0] + 10, dataLocations[minIndex][1] - 30, 80, 50);
        // データ
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(priceLog[minIndex].price + 'コイン', dataLocations[minIndex][0] + 20, dataLocations[minIndex][1] - 10);
        ctx.fillText(priceLog[minIndex].time.slice(11, 16), dataLocations[minIndex][0] + 20, dataLocations[minIndex][1] + 10);
    }
});
canvas.addEventListener('mouseleave', e => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(lastData, 0, 0);
});
