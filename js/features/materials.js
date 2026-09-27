// ===== 素材トラッキングタブ =====
// キャラごとの育成に必要な素材を登録し、在庫と比べて不足を出す

function startTracking() {
    const name = document.getElementById('track-char').value;
    if (!name) return;
    data.characterLevelUps[name] = data.characterLevelUps[name] || {};
    saveData();
    renderMaterials();
}

function stopTracking(name) {
    if (!confirm('このキャラの必要素材を削除しますか？')) return;
    delete data.characterLevelUps[name];
    saveData();
    renderMaterials();
}

function setLevelUpNeed(name, material, value) {
    const needs = data.characterLevelUps[name];
    const n = toCount(value);
    if (n > 0) {
        needs[material] = n;
    } else {
        delete needs[material];
    }
    saveData();
    renderMaterials();
}

// index は CHARACTERS 内の位置（入力欄の id に使う）
function addLevelUpNeed(name, index) {
    const material = document.getElementById(`need-material-${index}`).value;
    const n = toCount(document.getElementById(`need-count-${index}`).value);
    if (!material || n === 0) return;
    setLevelUpNeed(name, material, n);
}

// 育成完了：必要素材を在庫から差し引いて、トラッキングを終える
function completeLevelUp(name) {
    const needs = data.characterLevelUps[name];
    if (!confirm('必要素材を在庫から差し引いて、トラッキングを終了しますか？')) return;
    for (const [m, n] of Object.entries(needs)) data.inventory[m] = Math.max(0, getCount(m) - n);
    delete data.characterLevelUps[name];
    saveData();
    renderMaterials();
}

function progressOf(needs) {
    const total = Object.values(needs).reduce((a, n) => a + n, 0);
    if (total === 0) return 0;
    const have = Object.entries(needs).reduce((a, [m, n]) => a + Math.min(getCount(m), n), 0);
    return Math.round(have / total * 100);
}

// 全キャラ分の必要数をまとめ、足りない合成素材はレシピの材料に展開する（1段階）
function shortageSummary(trackedNames) {
    const direct = {};
    trackedNames.forEach(name => {
        for (const [m, n] of Object.entries(data.characterLevelUps[name])) direct[m] = (direct[m] || 0) + n;
    });
    const forCrafting = {};
    for (const [m, n] of Object.entries(direct)) {
        const short = n - getCount(m);
        const recipe = recipeOf(m);
        if (short > 0 && recipe) {
            for (const [src, per] of Object.entries(recipe)) forCrafting[src] = (forCrafting[src] || 0) + per * short;
        }
    }
    const materials = [...new Set([...Object.keys(direct), ...Object.keys(forCrafting)])];
    return materials.map(m => {
        const need = (direct[m] || 0) + (forCrafting[m] || 0);
        return { material: m, need, crafting: forCrafting[m] || 0, have: getCount(m), short: Math.max(0, need - getCount(m)) };
    });
}

function renderMaterials() {
    const chars = allCharacters();
    const trackedNames = chars.map(c => c.name).filter(name => data.characterLevelUps[name]);
    // 追加できるのは、所持していて、まだ追加していないキャラ
    const candidates = chars.filter(c => getProgress(c.name).owned && !data.characterLevelUps[c.name]);
    const materials = allMaterials();

    // キャラの追加
    let html = `<div class="stage-row">
        <div class="stage-name">育成するキャラを追加</div>`;
    if (chars.length === 0) {
        html += '<div class="empty">js/master/characters.js にキャラを登録してください</div>';
    } else if (candidates.length === 0) {
        html += '<div class="empty">追加できるキャラがいません（キャラ一覧タブで「所持」にチェックを入れると選べます）</div>';
    } else {
        html += `<div class="add-material" style="margin-bottom: 0;">
            <select id="track-char" style="flex: 1;">
                ${candidates.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(charLabel(c.name))}${getProgress(c.name).needsUpgrade ? '（強化待ち）' : ''}</option>`).join('')}
            </select>
            <button onclick="startTracking()">追加</button>
        </div>`;
    }
    html += '</div>';

    // 不足まとめ
    const summary = shortageSummary(trackedNames);
    html += '<div class="section-title">不足まとめ（全キャラ合計）</div>';
    if (summary.length === 0) {
        html += '<div class="empty" style="margin-bottom: 20px;">必要素材が登録されていません</div>';
    } else {
        html += `<div class="card" style="margin-bottom: 20px;">
            <table class="stat-table">
                <tr><th>素材</th><th>必要</th><th>在庫</th><th>不足</th></tr>
                ${summary.map(r => `<tr>
                    <td>${escapeHtml(r.material)}</td>
                    <td>${r.need}${r.crafting > 0 ? `<span class="hint-inline">（うち合成用${r.crafting}）</span>` : ''}</td>
                    <td>${r.have}</td>
                    <td class="${r.short > 0 ? 'shortage' : 'enough'}">${r.short > 0 ? r.short : 'OK'}</td>
                </tr>`).join('')}
            </table>
        </div>`;
    }

    // キャラごと
    html += '<div class="section-title">キャラごとの必要素材</div>';
    if (trackedNames.length === 0) {
        html += '<div class="empty">上でキャラを追加してください</div>';
    }
    html += '<div class="grid">';
    trackedNames.forEach(name => {
        const index = chars.findIndex(c => c.name === name);
        const needs = data.characterLevelUps[name];
        const progress = progressOf(needs);
        const ready = Object.keys(needs).length > 0 && progress === 100;
        html += `<div class="card">
            <div class="material-header">
                <div class="card-title" style="margin-bottom: 0;">${escapeHtml(charLabel(name))}</div>
                <button class="danger small" onclick="stopTracking(${jsArg(name)})">外す</button>
            </div>
            <div class="stat-row"><span>達成率</span><span class="stat-value">${progress}%</span></div>
            <div class="progress-bar char-progress" style="margin-bottom: 12px;"><div class="progress-fill" style="width: ${progress}%;"></div></div>
            ${Object.entries(needs).map(([m, n]) => `
                <div class="stat-row" style="align-items: center;">
                    <span>${escapeHtml(m)}</span>
                    <span class="input-wrapper">
                        <span class="${getCount(m) >= n ? 'enough' : 'shortage'}" style="font-size: 12px;">${getCount(m)} /</span>
                        <input type="number" min="0" value="${n}" style="width: 60px; padding: 4px 6px;" onchange="setLevelUpNeed(${jsArg(name)}, ${jsArg(m)}, this.value)">
                    </span>
                </div>
            `).join('')}
            <div class="input-wrapper" style="margin-top: 8px;">
                <select id="need-material-${index}" style="flex: 1; padding: 4px 6px; font-size: 12px;">
                    ${materials.filter(m => !needs[m]).map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
                </select>
                <input type="number" id="need-count-${index}" min="0" placeholder="数" style="width: 60px; padding: 4px 6px;">
                <button class="small" onclick="addLevelUpNeed(${jsArg(name)}, ${index})">追加</button>
            </div>
            ${ready ? `<button style="width: 100%; margin-top: 12px;" onclick="completeLevelUp(${jsArg(name)})">育成完了（在庫から差し引く）</button>` : ''}
        </div>`;
    });
    html += '</div>';

    document.getElementById('materials').innerHTML = html;
}
