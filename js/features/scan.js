// ===== スクショから在庫を読み取る =====
// ゲームの「アイテム一覧 → 贈物」のスクショから、素材の名前と所持数を読み取って在庫に入れる
// ・マス（丸いアイコン）の位置は色で見つける
// ・名前は文字認識（tesseract.js、vendor/tesseract/）で読み、素材シートの名前にいちばん近いものにする
// ・数字はゲームの数字の形（DIGIT_TEMPLATES）と比べて読む
// 画像はブラウザの中だけで処理し、どこにも送らない

// ゲームの数字 0〜9 の形（スクショから作ったもの）：[数字, 縦横比, 10×14マスの濃さ(0〜9)]
const DIGIT_TEMPLATES = [
    ["9", 0.73, "00267962000399999960299999999369930039999970000799999000099969961169992999999995029999999100023999500000699910000399930000049950000000140000"],
    ["9", 0.73, "00267962000399999960299999999469930039999990000799999000099969961169991999999996027999999200013999500000599910000399930000039960000000051000"],
    ["8", 0.78, "01599995001999999960699633999499900039967993005995399979999105666666406999779993999100399999600009999991003999699966999406999999500025664100"],
    ["6", 0.75, "00049400000019992000007997000002999100000899977200299999997047777777729994007998998000099999800009998994007997299999999203999999300015774100"],
    ["5", 0.74, "02999999300399999970069987774007996310000477777300099999996003334899910000008993000000399700000037731942049993699999999089999999100267774000"],
    ["1", 0.36, "00002559575597797977979779797797977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770000252955"],
    ["4", 0.72, "00001797000000399700177339970069963997007993399700799339970047722774009991399700999999999299999999947777899974000039970000003997000000037400"],
    ["3", 0.74, "69997999207999799900577979920000055770000009799500005979997000132677710000007995000000399702000059971751027772799979999199997999300267576100"],
    ["2", 0.71, "05989965008998998980999889899218600158840110004998000000699600000158820000068991000049896000019989000015885200019899899619989989986885885885"],
    ["2", 0.74, "03997993003999799930999959999106700067720120007997000000799500000077720000059990000019995000037997000006577100007979999607997999973777577775"],
    ["1", 0.39, "00227497974797979797779797979794749494940000979797000097979700009494940000979797000097979700009797970000949494000097979700009797970000429494"],
    ["2", 0.71, "04989965005998998980999899899216600058850120004998000000499800000058840000058992000019899000019989100004885400008899898508989989984885885885"],
    ["1", 0.37, "00222959775797797977979779797795555959550007797977000779797700055959550007797977000779797700077979770005595955000779797700077979770000255955"],
    ["1", 0.37, "00522959777797797977979779797795555959550007797977000779797700055959550007797977000779797700077979770005595955000779797700077979770002275955"],
    ["8", 0.78, "00469963001799999960599945999479910039967992004996499967999205666666403999999993999400499999600007999970001999799966999619999999600036666300"],
    ["2", 0.69, "02779953003997997970999799799219900169970010002775000000399700000179960000077991000039796000017757000016997500019799799719979979973775775773"],
    ["9", 0.75, "00279974000599999970299988999479930039999990000899999000099947730037772999889998039999999200147999800000399920000199950000059980000000271000"],
    ["4", 0.72, "00002997000000399700277439970039973997007993399700799339970047722774008993399700999999999399999999966777899974000039970000003997000000033300"],
    ["8", 0.76, "00367662000699999960499856899479910039967991003996499866999208999999605999679994998100299999600006999981002999699977999405999999500013663100"],
    ["1", 0.38, "00004294942497979797779797979797979797970000949494000097979700009797970000979797000097979700009494940000979797000097979700009797970000424492"],
    ["1", 0.36, "00022559775797797977979779797795977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770002252955"],
    ["0", 0.82, "00158951000399999810189999998059971189945662002664999000199899700009999980000999999000199856620036645998348994089999997001899997100004684000"],
    ["1", 0.36, "00002559775597797977779779797795977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770000252755"],
    ["2", 0.71, "05989986006998998980999889899506600048850110004998000000499800000058840000058992000019899000019989100005885200008899899808989989984885885885"],
    ["1", 0.36, "00002559572597797977779779797795977979770000595955000079797700007979770000797977000079797700005959550000797977000079797700007979770000252755"],
    ["7", 0.72, "79997999969999799992677758999000000599700000057720000009992000002999000000699600000179930000025770000007798000000979600000097930000000160000"],
    ["3", 0.72, "69997999008999799800777979920000087990000017576200006979993000232899910000006995000000399701000037725973269992999979998079997998100035532000"],
    ["1", 0.36, "00002559755597797977979779797797977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770002275955"],
    ["7", 0.69, "79979979979997997995777579799200000579900000055750000009795000002979200000697900000099770000007752000003997100000799600000079930000000270000"],
    ["5", 0.7, "03997999600599799980079967776007993100000999799610099979999000012577720000007997000000399702000059972983269995899979999069997998100033332000"],
    ["3", 0.76, "39999999006999999600233699920000037760000009999500003999997000001577710000007993000000399703100079951773357772699999999069999999100036763000"],
    ["2", 0.69, "02779953003997997970999799799219910169970010002775000000399700000179950000077991000039796000007757000016997500019799799719979979975775775775"],
    ["2", 0.69, "02769953003997997970999799799219910169970010002775000000399700000179960000067992000039796000006757100016997500019799799719979979975775775775"],
    ["1", 0.36, "00022759775797797977979779797795977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770000252552"],
    ["1", 0.38, "00004294972497979797779797979794949797970000949494000097979700009797970000979797000097979700009494940000979797000097979700009797970000424292"],
    ["1", 0.36, "00022759775797797977979779797795977979770005595955000779797700077979770007797977000779797700055959550007797977000779797700077979770002252552"]
];

let scanResults = [];   // [{ material, count, current, sure, apply }]
let scanMessage = '';
let scanBusy = false;
let ocrWorker = null;

// tesseract.js はこの機能を使うときだけ読み込む
function loadTesseract() {
    if (window.Tesseract) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'vendor/tesseract/tesseract.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('文字認識の読み込みに失敗しました'));
        document.head.appendChild(s);
    });
}

async function getOcrWorker() {
    if (ocrWorker) return ocrWorker;
    await loadTesseract();
    ocrWorker = await Tesseract.createWorker('jpn', 1, {
        workerPath: 'vendor/tesseract/worker.min.js',
        corePath: 'vendor/tesseract/',
        langPath: 'vendor/tesseract/lang'
    });
    return ocrWorker;
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('画像を読み込めませんでした'));
        img.src = URL.createObjectURL(file);
    });
}

// 丸いアイコン（薄い黄色）のまとまりを探して、[{ x0, y0, x1, y1 }] を返す（上の行から左→右の順）
function findItemCells(pixels, W, H) {
    const step = Math.max(2, Math.round(W / 280));
    const w = Math.floor(W / step), h = Math.floor(H / step);
    const isCircle = i => {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        return r >= 235 && g >= 220 && g <= 250 && b >= 165 && b <= 200 && r - b >= 45;
    };
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = isCircle(((y * step) * W + x * step) * 4) ? 1 : 0;
    const seen = new Uint8Array(w * h);
    const cells = [];
    for (let start = 0; start < w * h; start++) {
        if (!mask[start] || seen[start]) continue;
        const queue = [start]; seen[start] = 1;
        let minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
        while (queue.length) {
            const p = queue.pop(), x = p % w, y = (p - x) / w;
            count++;
            if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
            for (const q of [p - 1, p + 1, p - w, p + w]) {
                if (q < 0 || q >= w * h || seen[q] || !mask[q]) continue;
                if (Math.abs((q % w) - x) > 1) continue;
                seen[q] = 1; queue.push(q);
            }
        }
        const cw = (maxX - minX) * step;
        if (cw < W * 0.12 || cw > W * 0.3 || count < 50) continue;
        // 上が画面の外で切れていても、丸は正円なので下端と幅から上端を決める
        cells.push({ x0: minX * step, x1: maxX * step, y1: maxY * step, y0: maxY * step - cw });
    }
    const rowH = W * 0.05;
    return cells.sort((a, b) => Math.abs(a.y1 - b.y1) > rowH ? a.y1 - b.y1 : a.x0 - b.x0);
}

// ゲームの数字（こげ茶色）を1文字ずつ切り出して、DIGIT_TEMPLATES と比べて読む
function readCount(pixels, W, H, cell) {
    const d = cell.x1 - cell.x0;
    const x0 = Math.round(cell.x0 + d * 0.5), y0 = Math.round(cell.y0 + d * 0.5);
    const x1 = Math.min(W, Math.round(cell.x1 + d * 0.18)), y1 = Math.min(H, Math.round(cell.y1 + d * 0.08));
    const bw = x1 - x0, bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return null;
    const isDigit = (x, y) => {
        const i = ((y0 + y) * W + (x0 + x)) * 4, r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        return r < 130 && r - b >= 30 && r >= g && g >= b;
    };
    const seen = new Uint8Array(bw * bh);
    const glyphs = [];
    for (let s = 0; s < bw * bh; s++) {
        const sx = s % bw, sy = (s - sx) / bw;
        if (seen[s] || !isDigit(sx, sy)) continue;
        const queue = [s]; seen[s] = 1; const pts = [];
        while (queue.length) {
            const p = queue.pop(), x = p % bw, y = (p - x) / bw;
            pts.push([x, y]);
            for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
                if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;
                const q = ny * bw + nx;
                if (seen[q] || !isDigit(nx, ny)) continue;
                seen[q] = 1; queue.push(q);
            }
        }
        if (pts.length <= 20) continue;
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        glyphs.push({ pts, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) });
    }
    if (glyphs.length === 0) return null;
    const hMax = Math.max(...glyphs.map(g => g.maxY - g.minY));
    const digits = glyphs.filter(g => g.maxY - g.minY >= hMax * 0.7).sort((a, b) => a.minX - b.minX);
    let text = '', worst = 0;
    for (const g of digits) {
        const gw = g.maxX - g.minX + 1, gh = g.maxY - g.minY + 1;
        const grid = new Array(140).fill(0);
        g.pts.forEach(([x, y]) => {
            const gx = Math.min(9, Math.floor((x - g.minX) / gw * 10)), gy = Math.min(13, Math.floor((y - g.minY) / gh * 14));
            grid[gy * 10 + gx]++;
        });
        const area = (gw / 10) * (gh / 14);
        const vec = grid.map(n => Math.min(9, Math.floor(Math.min(1, n / area) * 10)));
        const ratio = gw / gh;
        let best = null;
        for (const [ch, tr, t] of DIGIT_TEMPLATES) {
            let dist = (ratio - tr) * (ratio - tr) * 2000;
            for (let k = 0; k < 140; k++) { const diff = vec[k] - Number(t[k]); dist += diff * diff; }
            if (!best || dist < best.dist) best = { ch, dist };
        }
        text += best.ch;
        worst = Math.max(worst, best.dist);
    }
    return text ? { count: parseInt(text), sure: worst < 1500 } : null;
}

// 名前の欄（丸の下）を白黒にして切り出したキャンバス（[そのまま, 2倍]）
function nameCanvas(pixels, W, H, cell) {
    const d = cell.x1 - cell.x0;
    const x0 = Math.max(0, Math.round(cell.x0 - d * 0.3)), x1 = Math.min(W, Math.round(cell.x1 + d * 0.3));
    const y0 = Math.round(cell.y1 + d * 0.1), y1 = Math.min(H, Math.round(cell.y1 + d * 0.45));
    if (y1 - y0 < d * 0.2) return null;   // 名前が画面の外
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    const dark = (x, y) => { const i = (y * W + x) * 4; return pixels[i] < 150 && pixels[i + 1] < 150 && pixels[i + 2] < 150; };
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        if (dark(x, y)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
    if (maxX < 0) return null;
    const pad = 12, cw = maxX - minX + 1 + pad * 2, ch = maxY - minY + 1 + pad * 2;
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(cw, ch);
    out.data.fill(255);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        if (!dark(x, y)) continue;
        const i = ((y - minY + pad) * cw + (x - minX + pad)) * 4;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = 0;
    }
    ctx.putImageData(out, 0, 0);
    // 読めなかったときのために2倍の大きさも作る（小さい1文字の名前は2倍のほうが読めることがある）
    const big = document.createElement('canvas');
    big.width = cw * 2; big.height = ch * 2;
    const bctx = big.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(canvas, 0, 0, cw * 2, ch * 2);
    return [canvas, big];
}

function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
}

// 読み取った文字にいちばん近い素材名（{ name, score: 0 がぴったり }）
function closestMaterial(text) {
    if (!text) return null;
    let best = null;
    for (const name of allMaterials()) {
        const score = editDistance(text, name) / Math.max(name.length, text.length);
        if (!best || score < best.score) best = { name, score };
    }
    return best;
}

async function readName(canvases) {
    const worker = await getOcrWorker();
    const chars = [...new Set(allMaterials().join(''))].join('');
    let best = null;
    for (const canvas of canvases) {
        for (const psm of ['7', '8', '10']) {
            await worker.setParameters({ tessedit_pageseg_mode: psm, tessedit_char_whitelist: chars });
            const text = (await worker.recognize(canvas)).data.text.replace(/\s/g, '');
            const match = closestMaterial(text);
            if (match && (!best || match.score < best.score)) best = match;
            if (best && best.score === 0) return best;
        }
    }
    return best && best.score <= 0.5 ? best : null;
}

async function scanScreenshots(files) {
    if (!files || files.length === 0 || scanBusy) return;
    scanBusy = true;
    const found = {};
    const unknown = [];   // 数字は読めたが名前が読めなかったマス（名前を選んでもらう）
    let skipped = 0, done = 0, total = 0;
    try {
        scanMessage = '文字認識を準備しています…（初回は少し時間がかかります）';
        renderInventory();
        await getOcrWorker();
        for (const file of files) {
            const img = await loadImage(file);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const W = canvas.width, H = canvas.height;
            const pixels = ctx.getImageData(0, 0, W, H).data;
            const cells = findItemCells(pixels, W, H);
            total += cells.length;
            for (const cell of cells) {
                done++;
                scanMessage = `読み取り中… ${done} / ${total}`;
                renderInventory();
                const nc = nameCanvas(pixels, W, H, cell);
                const name = nc ? await readName(nc) : null;
                const count = readCount(pixels, W, H, cell);
                if (!count) { skipped++; continue; }
                if (!name) { unknown.push(count.count); continue; }
                const sure = name.score === 0 && count.sure;
                // 同じ素材が2枚のスクショに写っていたら、確かなほうを使う
                if (!found[name.name] || (sure && !found[name.name].sure)) found[name.name] = { count: count.count, sure };
            }
        }
        scanResults = allMaterials().filter(m => found[m]).map(m => ({
            material: m, count: found[m].count, current: getCount(m), sure: found[m].sure, apply: true
        }));
        // 名前が読めなかったマスは、素材を選べる行にする（選ぶまで反映しない）
        unknown.forEach(count => scanResults.push({ material: '', count, current: '', sure: false, apply: false, pick: true }));
        scanMessage = `${scanResults.length - unknown.length}種類の素材を読み取りました`
            + (unknown.length > 0 ? `。名前が読めなかったマスが${unknown.length}こあります（下で素材を選べます）` : '')
            + (skipped > 0 ? `。数字が読めなかったマスが${skipped}こあります` : '');
    } catch (e) {
        scanMessage = `読み取れませんでした：${e.message}`;
    }
    scanBusy = false;
    renderInventory();
}

function setScanCount(index, value) {
    scanResults[index].count = toCount(value);
    scanResults[index].sure = true;
}

function setScanMaterial(index, material) {
    scanResults[index].material = material;
    scanResults[index].current = material ? getCount(material) : '';
    scanResults[index].apply = !!material;
    renderInventory();
}

function setScanApply(index, checked) {
    scanResults[index].apply = checked;
}

function applyScanResults() {
    const rows = scanResults.filter(r => r.apply && r.material);
    rows.forEach(r => { data.inventory[r.material] = r.count; });
    const n = rows.length;
    saveData();
    scanResults = [];
    scanMessage = `${n}種類の在庫を更新しました`;
    renderInventory();
}

function cancelScan() {
    scanResults = [];
    scanMessage = '';
    renderInventory();
}

function renderScanBox() {
    let html = `<div class="card" style="margin-bottom: 16px;">
        <div class="card-title">📷 スクショから在庫を読み取る</div>
        <div class="hint">ゲームの「アイテム一覧 → 贈物」のスクショを選ぶと、素材の名前と数を読み取ります。何枚でもまとめて選べます。画像はこの端末の中だけで処理します。</div>
        <input type="file" accept="image/*" multiple ${scanBusy ? 'disabled' : ''} onchange="scanScreenshots(this.files)">
        ${scanMessage ? `<div class="hint" style="margin: 8px 0 0;">${escapeHtml(scanMessage)}</div>` : ''}`;
    if (scanResults.length > 0) {
        // 名前を選ぶ欄には、読み取れた素材とほかの欄で選んだ素材を出さない
        const usedMaterials = new Set(scanResults.map(r => r.material).filter(Boolean));
        html += `<div class="hint" style="margin: 8px 0 4px;">数を確かめてから「在庫に反映」を押してください。<span style="background: #fff3cd;">黄色</span>の行は読み取りに自信がないところです。</div>
            <table class="stat-table">
                <tr><th></th><th>素材</th><th>読み取った数</th><th>今の在庫</th></tr>
                ${scanResults.map((r, i) => `<tr${r.sure ? '' : ' style="background: #fff3cd;"'}>
                    <td><input type="checkbox" ${r.apply ? 'checked' : ''} onchange="setScanApply(${i}, this.checked)"></td>
                    <td>${!r.pick ? escapeHtml(r.material) : `<select onchange="setScanMaterial(${i}, this.value)" style="max-width: 120px;">
                        <option value="">名前が読めません</option>
                        ${allMaterials().filter(m => m === r.material || !usedMaterials.has(m)).map(m => `<option value="${escapeHtml(m)}" ${m === r.material ? 'selected' : ''}>${escapeHtml(m)}</option>`).join('')}
                    </select>`}</td>
                    <td><input type="number" min="0" value="${r.count}" style="width: 64px;" onchange="setScanCount(${i}, this.value)"></td>
                    <td>${r.current}</td>
                </tr>`).join('')}
            </table>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
                <button onclick="applyScanResults()">在庫に反映</button>
                <button class="secondary" onclick="cancelScan()">やめる</button>
            </div>`;
    }
    return html + '</div>';
}
