// ===== ドロップ統計タブ =====
// 周回ごとのドロップを記録し、ステージ別に集計する

let selectedDropChapter = '';
let selectedDropStage = '';
let compareYukari = '';   // 集計を「このゆかりのキャラがいる周回 / いない周回」に分けて比べる

const PARTY_SIZE = 3;

// ステージと落ちる品は data/master.xlsx の「ステージドロップ品」シート → js/master/stages.js

// 章を選ぶと、その章の最初のステージを選び直す
function selectDropChapter(chapter) {
    selectedDropChapter = chapter;
    selectedDropStage = stageNames().find(s => chapterOf(s) === chapter) || '';
    renderDrops();
}

// ステージの有利刀種（Excel の「有利刀種」列）
function renderAdvantage(stage) {
    const master = STAGES.find(s => s.name === stage);
    const types = (master && master.advantage) || [];
    if (types.length === 0) return '';
    return `<div class="hint" style="margin-bottom: 10px;">有利刀種：${types.map(t => `<span class="chip" style="padding: 1px 8px; margin-right: 4px;">⚔️ ${escapeHtml(t)}</span>`).join('')}</div>`;
}

function selectDropStage(stage) {
    selectedDropStage = stage;
    renderDrops();
}

// ===== 出陣キャラ（ゆかりとドロップの関係を調べるため） =====
function partyOf(run) {
    return Array.isArray(run.party) ? run.party : [];
}

function partyYukari(party) {
    return party.flatMap(name => {
        const c = CHARACTERS.find(ch => ch.name === name);
        return c ? yukariOf(c) : [];
    });
}

function selectPartyMember(index, name) {
    const party = [...data.dropParty];
    party[index] = name;
    data.dropParty = party.slice(0, PARTY_SIZE);
    saveData();
    renderDrops();
}

function renderPartyPicker() {
    const owned = CHARACTERS.filter(c => getProgress(c.name).owned);
    const party = data.dropParty;
    const selects = [...Array(PARTY_SIZE)].map((_, i) => {
        const current = party[i] || '';
        // 同じキャラを2回選べないようにする（自分の枠の分は残す）
        const others = party.filter((n, j) => j !== i && n);
        return `<select onchange="selectPartyMember(${i}, this.value)" style="min-width: 0; flex: 1;">
            <option value="">（なし）</option>
            ${owned.filter(c => !others.includes(c.name)).map(c => `<option value="${escapeHtml(c.name)}" ${c.name === current ? 'selected' : ''}>${escapeHtml(charLabel(c.name))}</option>`).join('')}
        </select>`;
    }).join('');
    const counts = {};
    partyYukari(party.filter(Boolean)).forEach(y => { counts[y] = (counts[y] || 0) + 1; });
    const yukariText = Object.entries(counts).map(([y, n]) => `<span class="chip" style="padding: 1px 8px; margin-right: 4px;">🔗 ${escapeHtml(y)}${n > 1 ? `×${n}` : ''}</span>`).join('');
    return `<div style="margin-bottom: 12px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">出陣したキャラ（所持キャラから3体まで）</div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">${selects}</div>
        ${owned.length === 0 ? '<div class="hint" style="margin: 4px 0 0;">キャラ一覧で「所持」にチェックすると選べます</div>' : ''}
        ${yukariText ? `<div class="hint" style="margin: 6px 0 0;">ゆかり：${yukariText}</div>` : ''}
    </div>`;
}

function selectCompareYukari(yukari) {
    compareYukari = yukari;
    renderDrops();
}

function recordRun() {
    const stage = selectedDropStage;
    if (!stage) return;
    const drops = {};
    dropsFor(stage).forEach((m, i) => {
        const n = toCount(document.getElementById(`run-drop-${i}`).value);
        if (n > 0) drops[m] = n;
    });
    const addedToInventory = document.getElementById('run-addToInventory').checked;
    const party = data.dropParty.filter(Boolean);
    const run = { id: Date.now(), stage, date: new Date().toISOString(), drops, addedToInventory };
    if (party.length > 0) run.party = party;
    data.runs.push(run);
    // 在庫に足すのは素材だけ（絵馬などは記録のみ）
    if (addedToInventory) {
        for (const [m, n] of Object.entries(drops)) {
            if (allMaterials().includes(m)) data.inventory[m] = getCount(m) + n;
        }
    }
    saveData();
    renderDrops();
}

function deleteRun(id) {
    const run = data.runs.find(r => r.id === id);
    if (!run) return;
    const message = run.addedToInventory
        ? 'この記録を削除しますか？\n在庫に加算した分も差し引きます。'
        : 'この記録を削除しますか？';
    if (!confirm(message)) return;
    if (run.addedToInventory) {
        for (const [m, n] of Object.entries(run.drops)) {
            if (allMaterials().includes(m)) data.inventory[m] = Math.max(0, getCount(m) - n);
        }
    }
    data.runs = data.runs.filter(r => r.id !== id);
    saveData();
    renderDrops();
}

// filter を渡すと、その条件に合う周回だけを集計する
function stageStats(filter = () => true) {
    const stats = {};
    data.runs.filter(filter).forEach(run => {
        if (!stats[run.stage]) stats[run.stage] = { runs: 0, totals: {}, hits: {} };
        const s = stats[run.stage];
        s.runs++;
        for (const [m, n] of Object.entries(run.drops)) {
            s.totals[m] = (s.totals[m] || 0) + n;
            s.hits[m] = (s.hits[m] || 0) + 1;
        }
    });
    return stats;
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderDrops() {
    const stages = stageNames();
    const chapters = chapterNames();
    if (!chapters.includes(selectedDropChapter)) selectedDropChapter = chapters[0] || '';
    const chapterStages = stages.filter(s => chapterOf(s) === selectedDropChapter);
    if (!chapterStages.includes(selectedDropStage)) selectedDropStage = chapterStages[0] || '';

    // 記録フォーム
    let html = `<div class="stage-row">
        <div class="stage-name">周回を記録</div>`;
    if (stages.length === 0) {
        html += '<div class="empty">data/master.xlsx の「ステージドロップ品」シートにステージを登録すると、ここで記録できます</div>';
    } else {
        html += `<div class="stage-input-group" style="flex-wrap: wrap;">
                <label style="font-size: 12px; color: #666;">章</label>
                <select onchange="selectDropChapter(this.value)">
                    ${chapters.map(c => `<option value="${escapeHtml(c)}" ${c === selectedDropChapter ? 'selected' : ''}>${escapeHtml(chapterLabel(c))}</option>`).join('')}
                </select>
                <label style="font-size: 12px; color: #666; margin-left: 8px;">ステージ</label>
                <select onchange="selectDropStage(this.value)">
                    ${chapterStages.map(s => `<option value="${escapeHtml(s)}" ${s === selectedDropStage ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
            </div>
            ${renderAdvantage(selectedDropStage)}
            ${renderPartyPicker()}
            <div class="input-wrapper" style="gap: 12px; margin-bottom: 12px;">
                ${dropsFor(selectedDropStage).map((m, i) => `
                    <span class="input-wrapper"><label>${escapeHtml(dropLabel(selectedDropStage, m))}</label>
                    <input type="number" id="run-drop-${i}" min="0" value="0"></span>
                `).join('') || '<span class="empty">このステージに落ちる品が登録されていません</span>'}
            </div>
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <button onclick="recordRun()">記録する</button>
                <label style="font-size: 13px; color: #666;"><input type="checkbox" id="run-addToInventory" checked> 在庫に加算する（素材のみ）</label>
            </div>`;
    }
    html += '</div>';

    // ステージ別の集計（選んでいる章のステージだけ、Excel の順に並べる）
    const stats = stageStats();
    const order = s => (stages.indexOf(s) + 1) || stages.length + 1;
    const statStages = Object.keys(stats)
        .filter(s => chapterOf(s) === selectedDropChapter)
        .sort((a, b) => order(a) - order(b));
    html += `<div class="section-title">${escapeHtml(chapterLabel(selectedDropChapter || 'ステージ'))}の集計</div>`;
    // ゆかりで比べる：出陣キャラを記録した周回を、そのゆかりのキャラがいる / いないに分ける
    const recordedYukari = [...new Set(data.runs.flatMap(r => partyYukari(partyOf(r))))];
    const allYukari = [...new Set(CHARACTERS.flatMap(yukariOf))];
    const yukariOptions = [...recordedYukari, ...allYukari.filter(y => !recordedYukari.includes(y))];
    if (!yukariOptions.includes(compareYukari)) compareYukari = '';
    html += `<div class="stage-input-group" style="margin-bottom: 12px; flex-wrap: wrap;">
        <label style="font-size: 12px; color: #666;">ゆかりで比べる</label>
        <select onchange="selectCompareYukari(this.value)">
            <option value="">比べない</option>
            ${yukariOptions.map(y => `<option value="${escapeHtml(y)}" ${y === compareYukari ? 'selected' : ''}>${escapeHtml(y)}</option>`).join('')}
        </select>
        ${compareYukari ? '<span class="hint" style="margin: 0;">出陣キャラを記録した周回だけで比べます</span>' : ''}
    </div>`;
    const withYukari = run => partyYukari(partyOf(run)).includes(compareYukari);
    const statsWith = compareYukari ? stageStats(r => partyOf(r).length > 0 && withYukari(r)) : {};
    const statsWithout = compareYukari ? stageStats(r => partyOf(r).length > 0 && !withYukari(r)) : {};
    if (statStages.length === 0) {
        html += '<div class="empty" style="margin-bottom: 20px;">この章の記録はまだありません</div>';
    } else {
        html += '<div class="grid">';
        statStages.forEach(stage => {
            const s = stats[stage];
            const materials = [...new Set([...dropsFor(stage), ...Object.keys(s.totals)])];
            html += `<div class="card">
                <div class="card-title">${escapeHtml(stage)}</div>
                ${renderAdvantage(stage)}
                <div class="stat-row"><span>周回数</span><span class="stat-value">${s.runs}</span></div>
                ${compareYukari ? renderYukariCompare(stage, materials, statsWith[stage], statsWithout[stage]) : `<table class="stat-table">
                    <tr><th>品</th><th>合計</th><th>1周平均</th><th>ドロップ率</th></tr>
                    ${materials.map(m => `<tr>
                        <td>${escapeHtml(dropLabel(stage, m))}</td>
                        <td>${s.totals[m] || 0}</td>
                        <td>${((s.totals[m] || 0) / s.runs).toFixed(2)}</td>
                        <td>${Math.round((s.hits[m] || 0) / s.runs * 100)}%</td>
                    </tr>`).join('')}
                </table>`}
            </div>`;
        });
        html += '</div>';
    }

    // 記録の履歴
    const recent = data.runs.slice(-30).reverse();
    html += `<div class="section-title">最近の記録${data.runs.length > 30 ? `（最新30件 / 全${data.runs.length}件）` : ''}</div>`;
    if (recent.length === 0) {
        html += '<div class="empty">まだ記録がありません</div>';
    }
    recent.forEach(run => {
        const partyText = partyOf(run).map(charLabel).join('・');
        const dropText = Object.entries(run.drops).map(([m, n]) => `${escapeHtml(dropLabel(run.stage, m))}×${n}`).join('、') || 'ドロップなし';
        html += `<div class="material-item material-header" style="margin-bottom: 6px;">
            <div style="font-size: 13px;">
                <span style="color: #999; margin-right: 8px;">${formatDate(run.date)}</span>
                <span class="material-name" style="margin-right: 8px;">${escapeHtml(run.stage)}</span>
                <span style="color: #666;">${dropText}</span>
                ${partyText ? `<div style="color: #999; font-size: 12px; margin-top: 2px;">出陣：${escapeHtml(partyText)}</div>` : ''}
            </div>
            <button class="danger small" onclick="deleteRun(${run.id})">削除</button>
        </div>`;
    });

    document.getElementById('drops').innerHTML = html;
}

// ゆかりのキャラがいる周回 / いない周回の、1周平均とドロップ率を並べる
function renderYukariCompare(stage, materials, withStats, withoutStats) {
    const cell = (st, m) => st
        ? `<td>${((st.totals[m] || 0) / st.runs).toFixed(2)}<br><span style="color: #999;">${Math.round((st.hits[m] || 0) / st.runs * 100)}%</span></td>`
        : '<td>―</td>';
    return `<table class="stat-table">
        <tr><th>品</th><th>「${escapeHtml(compareYukari)}」あり<br>（${withStats ? withStats.runs : 0}周）</th><th>なし<br>（${withoutStats ? withoutStats.runs : 0}周）</th></tr>
        ${materials.map(m => `<tr><td>${escapeHtml(dropLabel(stage, m))}</td>${cell(withStats, m)}${cell(withoutStats, m)}</tr>`).join('')}
    </table>
    <div class="hint" style="margin: 4px 0 0;">上：1周平均　下：ドロップ率</div>`;
}
