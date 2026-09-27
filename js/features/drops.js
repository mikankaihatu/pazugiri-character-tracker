// ===== ドロップ統計タブ =====
// 周回ごとのドロップを記録し、ステージ別に集計する

let selectedDropStage = '';

// ステージで入力する素材（設定タブで未指定ならドロップ素材すべて）
function dropMaterialsFor(stage) {
    const listed = data.stageDrops[stage] || [];
    return listed.length > 0 ? listed : materialsInCategory('ドロップ素材');
}

function selectDropStage(stage) {
    selectedDropStage = stage;
    renderDrops();
}

function recordRun() {
    const stage = selectedDropStage;
    if (!stage) return;
    const drops = {};
    dropMaterialsFor(stage).forEach((m, i) => {
        const n = toCount(document.getElementById(`run-drop-${i}`).value);
        if (n > 0) drops[m] = n;
    });
    const addedToInventory = document.getElementById('run-addToInventory').checked;
    data.runs.push({ id: Date.now(), stage, date: new Date().toISOString(), drops, addedToInventory });
    if (addedToInventory) {
        for (const [m, n] of Object.entries(drops)) data.inventory[m] = getCount(m) + n;
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
        for (const [m, n] of Object.entries(run.drops)) data.inventory[m] = Math.max(0, getCount(m) - n);
    }
    data.runs = data.runs.filter(r => r.id !== id);
    saveData();
    renderDrops();
}

function stageStats() {
    const stats = {};
    data.runs.forEach(run => {
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
    const stages = Object.keys(data.stageDrops);
    if (!stages.includes(selectedDropStage)) selectedDropStage = stages[0] || '';

    // 記録フォーム
    let html = `<div class="stage-row">
        <div class="stage-name">周回を記録</div>`;
    if (stages.length === 0) {
        html += '<div class="empty">設定タブでステージを登録すると、ここで記録できます</div>';
    } else {
        html += `<div class="stage-input-group">
                <label style="font-size: 12px; color: #666;">ステージ</label>
                <select onchange="selectDropStage(this.value)">
                    ${stages.map(s => `<option value="${escapeHtml(s)}" ${s === selectedDropStage ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
                </select>
            </div>
            <div class="input-wrapper" style="gap: 12px; margin-bottom: 12px;">
                ${dropMaterialsFor(selectedDropStage).map((m, i) => `
                    <span class="input-wrapper"><label>${escapeHtml(m)}</label>
                    <input type="number" id="run-drop-${i}" min="0" value="0"></span>
                `).join('') || '<span class="empty">js/master/materials.js に素材を登録してください</span>'}
            </div>
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                <button onclick="recordRun()">記録する</button>
                <label style="font-size: 13px; color: #666;"><input type="checkbox" id="run-addToInventory" checked> 在庫に加算する</label>
            </div>`;
    }
    html += '</div>';

    // ステージ別の集計
    const stats = stageStats();
    const statStages = Object.keys(stats);
    html += '<div class="section-title">ステージ別の集計</div>';
    if (statStages.length === 0) {
        html += '<div class="empty" style="margin-bottom: 20px;">まだ記録がありません</div>';
    } else {
        html += '<div class="grid">';
        statStages.forEach(stage => {
            const s = stats[stage];
            const materials = [...new Set([...dropMaterialsFor(stage), ...Object.keys(s.totals)])];
            html += `<div class="card">
                <div class="card-title">${escapeHtml(stage)}</div>
                <div class="stat-row"><span>周回数</span><span class="stat-value">${s.runs}</span></div>
                <table class="stat-table">
                    <tr><th>素材</th><th>合計</th><th>1周平均</th><th>ドロップ率</th></tr>
                    ${materials.map(m => `<tr>
                        <td>${escapeHtml(m)}</td>
                        <td>${s.totals[m] || 0}</td>
                        <td>${((s.totals[m] || 0) / s.runs).toFixed(2)}</td>
                        <td>${Math.round((s.hits[m] || 0) / s.runs * 100)}%</td>
                    </tr>`).join('')}
                </table>
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
        const dropText = Object.entries(run.drops).map(([m, n]) => `${escapeHtml(m)}×${n}`).join('、') || 'ドロップなし';
        html += `<div class="material-item material-header" style="margin-bottom: 6px;">
            <div style="font-size: 13px;">
                <span style="color: #999; margin-right: 8px;">${formatDate(run.date)}</span>
                <span class="material-name" style="margin-right: 8px;">${escapeHtml(run.stage)}</span>
                <span style="color: #666;">${dropText}</span>
            </div>
            <button class="danger small" onclick="deleteRun(${run.id})">削除</button>
        </div>`;
    });

    document.getElementById('drops').innerHTML = html;
}
