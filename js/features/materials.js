// ===== 素材トラッキングタブ =====
// キャラごとの育成に必要な素材を登録し、在庫と比べて不足を出す

function startTracking() {
    const name = document.getElementById('track-char').value;
    if (!name) return;
    data.characterLevelUps[name] = data.characterLevelUps[name] || {};
    // 次の上限突破の素材が固定データにあれば、最初からセットしておく
    if (nextLimitBreak(name)) {
        applyLimitBreak(name);
        return;
    }
    saveData();
    renderMaterials();
}

// 次の上限突破の必要素材を、そのキャラの必要素材にセットする（今の内容は置き換える）
function applyLimitBreak(name) {
    const lb = nextLimitBreak(name);
    if (!lb) return;
    data.characterLevelUps[name] = { ...lb.materials };
    data.levelUpTargets[name] = lb.to;
    saveData();
    renderMaterials();
}

function stopTracking(name) {
    if (!confirm('このキャラの必要素材を削除しますか？')) return;
    delete data.characterLevelUps[name];
    delete data.levelUpTargets[name];
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

// 育成完了：必要素材を在庫から差し引いて、トラッキングを終える
// 上限突破の素材をセットしていた場合は、レベル上限も上げる
function completeLevelUp(name) {
    const needs = data.characterLevelUps[name];
    const target = data.levelUpTargets[name];
    const message = target
        ? `必要素材を在庫から差し引いて、レベル上限を Lv${target} にしますか？`
        : '必要素材を在庫から差し引いて、トラッキングを終了しますか？';
    if (!confirm(message)) return;
    for (const [m, n] of Object.entries(needs)) data.inventory[m] = Math.max(0, getCount(m) - n);
    if (target) setProgress(name, { levelCap: target });
    delete data.levelUpTargets[name];
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

// 合成レシピがあって、今の在庫から作れるときだけ「合成」ボタンを出す（在庫管理の craft を使う）
function renderCraftButton(material) {
    if (!recipeOf(material) || craftableCount(material) < 1) return '';
    return `<button class="small secondary" style="padding: 2px 6px;" title="在庫から1個合成する" onclick="craft(${jsArg(material)})">合成</button>`;
}

// レベル上限と、次の上限突破の素材をセットするボタン
function renderLimitBreakLine(name) {
    const cap = getProgress(name).levelCap;
    const target = data.levelUpTargets[name];
    const lb = nextLimitBreak(name);
    let right = '';
    if (target) {
        right = `<span class="stat-value">Lv${cap}→${target} の素材</span>`;
    } else if (lb) {
        right = `<button class="small secondary" onclick="applyLimitBreak(${jsArg(name)})">Lv${lb.from}→${lb.to} の素材をセット</button>`;
    }
    return `<div class="stat-row" style="align-items: center;"><span>レベル上限 Lv${cap}</span>${right}</div>`;
}

function renderMaterials() {
    const chars = allCharacters();
    const trackedNames = chars.map(c => c.name).filter(name => data.characterLevelUps[name]);
    // 追加できるのは、所持していて、まだ追加していないキャラ
    const candidates = chars.filter(c => getProgress(c.name).owned && !data.characterLevelUps[c.name]);

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
                ${candidates.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(charLabel(c.name))}</option>`).join('')}
            </select>
            <button onclick="startTracking()">追加</button>
        </div>`;
    }
    html += '</div>';

    // 不足まとめ（合成素材はレシピをたどって材料まで展開する）
    const plan = requirementPlan(trackedNeeds());
    const rows = Object.entries(plan);
    html += '<div class="section-title">不足まとめ（全キャラ合計）</div>';
    if (rows.length === 0) {
        html += '<div class="empty" style="margin-bottom: 20px;">必要素材が登録されていません</div>';
    } else {
        html += `<div class="card" style="margin-bottom: 20px;">
            <div class="hint">在庫で足りない合成素材は、合成レシピをたどって材料まで計算しています。「合成」は、今の在庫から1個作ります。</div>
            <table class="stat-table">
                <tr><th>素材</th><th>必要</th><th>在庫</th><th>合成</th><th>不足</th></tr>
                ${rows.map(([m, r]) => `<tr>
                    <td>${escapeHtml(m)}</td>
                    <td>${r.need}${r.crafting > 0 ? `<span class="hint-inline">（うち合成の材料${r.crafting}）</span>` : ''}</td>
                    <td>${getCount(m)}</td>
                    <td>${r.toCraft > 0 ? `あと${r.toCraft} ${renderCraftButton(m)}` : ''}</td>
                    <td class="${r.short > 0 ? 'shortage' : r.toCraft > 0 ? 'to-craft' : 'enough'}">${r.short > 0 ? r.short : r.toCraft > 0 ? '合成' : 'OK'}${r.short > 0 ? ` ${findStagesButton(m)}` : ''}</td>
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
        const needs = data.characterLevelUps[name];
        const progress = progressOf(needs);
        const ready = Object.keys(needs).length > 0 && progress === 100;
        html += `<div class="card">
            <div class="material-header">
                <div class="card-title" style="margin-bottom: 0;">${escapeHtml(charLabel(name))}</div>
                <button class="danger small" onclick="stopTracking(${jsArg(name)})">外す</button>
            </div>
            ${renderLimitBreakLine(name)}
            <div class="stat-row"><span>達成率</span><span class="stat-value">${progress}%</span></div>
            <div class="progress-bar char-progress" style="margin-bottom: 12px;"><div class="progress-fill" style="width: ${progress}%;"></div></div>
            ${Object.entries(needs).map(([m, n]) => `
                <div class="stat-row" style="align-items: center;">
                    <span>${escapeHtml(m)}</span>
                    <span class="input-wrapper">
                        ${getCount(m) < n ? renderCraftButton(m) : ''}
                        <span class="${getCount(m) >= n ? 'enough' : 'shortage'}" style="font-size: 12px;">${getCount(m)} /</span>
                        <input type="number" min="0" value="${n}" style="width: 60px; padding: 4px 6px;" onchange="setLevelUpNeed(${jsArg(name)}, ${jsArg(m)}, this.value)">
                    </span>
                </div>
            `).join('')}
            ${Object.keys(needs).length === 0 ? '<div class="empty">上限突破の必要素材が Excel（キャラクター名シートの上限突破の列）にまだありません</div>' : ''}
            ${ready ? `<button style="width: 100%; margin-top: 12px;" onclick="completeLevelUp(${jsArg(name)})">${data.levelUpTargets[name] ? `上限突破完了（Lv${data.levelUpTargets[name]}へ・在庫から差し引く）` : '育成完了（在庫から差し引く）'}</button>` : ''}
        </div>`;
    });
    html += '</div>';

    document.getElementById('materials').innerHTML = html;
}
