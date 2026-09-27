// ===== 設定タブ =====
// 素材・ステージ・合成レシピの登録と、データのバックアップ

// ----- 素材 -----
function addMaterial(categoryIndex) {
    const category = Object.keys(data.materialCategories)[categoryIndex];
    const name = document.getElementById(`newMaterial-${categoryIndex}`).value.trim();
    if (!name) return;
    if (allMaterials().includes(name)) {
        alert('同じ名前の素材がすでにあります');
        return;
    }
    data.materialCategories[category].push(name);
    saveData();
    renderSettings();
}

function deleteMaterial(name) {
    if (!confirm(`「${name}」を削除しますか？\n在庫・レシピ・ステージ・必要素材からも削除されます。`)) return;
    for (const category in data.materialCategories) {
        data.materialCategories[category] = data.materialCategories[category].filter(m => m !== name);
    }
    delete data.inventory[name];
    delete data.recipes[name];
    Object.values(data.recipes).forEach(recipe => delete recipe[name]);
    for (const stage in data.stageDrops) {
        data.stageDrops[stage] = data.stageDrops[stage].filter(m => m !== name);
    }
    Object.values(data.characterLevelUps).forEach(needs => delete needs[name]);
    saveData();
    renderSettings();
}

// ----- ステージ -----
function addStage() {
    const name = document.getElementById('newStage').value.trim();
    if (!name) return;
    if (data.stageDrops[name]) {
        alert('このステージはすでにあります');
        return;
    }
    data.stageDrops[name] = [];
    saveData();
    renderSettings();
}

function deleteStage(name) {
    if (!confirm(`ステージ「${name}」を削除しますか？\n（周回記録は残ります）`)) return;
    delete data.stageDrops[name];
    saveData();
    renderSettings();
}

function toggleStageDrop(stage, material, checked) {
    const drops = data.stageDrops[stage];
    if (checked && !drops.includes(material)) drops.push(material);
    if (!checked) data.stageDrops[stage] = drops.filter(m => m !== material);
    saveData();
}

// ----- 合成レシピ -----
function setRecipe(product, material, value) {
    const n = toCount(value);
    if (!data.recipes[product]) data.recipes[product] = {};
    if (n > 0) {
        data.recipes[product][material] = n;
    } else {
        delete data.recipes[product][material];
    }
    saveData();
}

// ----- バックアップ -----
function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pazugiri-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        let imported;
        try {
            imported = JSON.parse(reader.result);
            if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error();
            imported = validateData(imported);
        } catch (e) {
            alert('読み込めませんでした。バックアップのファイルか確認してください。');
            return;
        }
        if (!confirm('今のデータを、読み込んだデータで上書きしますか？')) return;
        data = imported;
        saveData();
        alert('読み込みました');
        renderSettings();
    };
    reader.readAsText(file);
    input.value = '';
}

function resetAllData() {
    if (!confirm('すべてのデータを削除して初期状態に戻しますか？\nこの操作は元に戻せません。')) return;
    data = JSON.parse(JSON.stringify(INITIAL_DATA));
    saveData();
    renderSettings();
}

// ----- 表示 -----
function renderSettings() {
    const categories = Object.keys(data.materialCategories);
    const materials = allMaterials();
    const stages = Object.keys(data.stageDrops);
    const products = data.materialCategories['合成素材'] || [];

    // 素材
    let html = `<div class="settings-section">
        <div class="settings-title">素材</div>`;
    categories.forEach((category, i) => {
        const list = data.materialCategories[category];
        html += `<div style="margin-bottom: 16px;">
            <div class="sub-title">${escapeHtml(category)}</div>
            <div class="chip-list">
                ${list.length === 0 ? '<span class="empty">まだありません</span>' : list.map(m => `
                    <span class="chip">${escapeHtml(m)}<button class="chip-delete" title="削除" onclick="deleteMaterial(${jsArg(m)})">×</button></span>
                `).join('')}
            </div>
            <div class="add-material">
                <input type="text" id="newMaterial-${i}" placeholder="素材名を入力">
                <button onclick="addMaterial(${i})">追加</button>
            </div>
        </div>`;
    });
    html += '</div>';

    // ステージ
    html += `<div class="settings-section">
        <div class="settings-title">ステージ</div>
        <div class="hint">チェックした素材が、ドロップ統計タブの入力欄に出ます（未チェックならドロップ素材をすべて表示）。</div>
        <div class="add-material">
            <input type="text" id="newStage" placeholder="ステージ名（1-1 など）">
            <button onclick="addStage()">追加</button>
        </div>`;
    if (stages.length === 0) {
        html += '<div class="empty">まだありません</div>';
    }
    stages.forEach(stage => {
        html += `<div class="stage-row">
            <div class="material-header">
                <div class="stage-name" style="margin-bottom: 0;">${escapeHtml(stage)}</div>
                <button class="danger small" onclick="deleteStage(${jsArg(stage)})">削除</button>
            </div>
            <div class="input-wrapper" style="gap: 12px;">
                ${materials.map(m => `
                    <label style="min-width: 0;"><input type="checkbox" ${data.stageDrops[stage].includes(m) ? 'checked' : ''}
                        onchange="toggleStageDrop(${jsArg(stage)}, ${jsArg(m)}, this.checked)"> ${escapeHtml(m)}</label>
                `).join('')}
            </div>
        </div>`;
    });
    html += '</div>';

    // 合成レシピ
    html += `<div class="settings-section">
        <div class="settings-title">合成レシピ</div>
        <div class="hint">「合成素材」に登録した素材を1個作るのに必要な数を入力します。在庫管理タブで合成できるようになります。</div>`;
    if (products.length === 0) {
        html += '<div class="empty">「合成素材」に素材を追加すると、ここでレシピを設定できます</div>';
    }
    products.forEach(product => {
        const recipe = data.recipes[product] || {};
        html += `<div class="stage-row">
            <div class="stage-name">${escapeHtml(product)} × 1</div>
            <div class="input-wrapper" style="gap: 12px;">
                ${materials.filter(m => m !== product).map(m => `
                    <span class="input-wrapper"><label>${escapeHtml(m)}</label>
                    <input type="number" min="0" value="${recipe[m] || 0}" onchange="setRecipe(${jsArg(product)}, ${jsArg(m)}, this.value)"></span>
                `).join('')}
            </div>
        </div>`;
    });
    html += '</div>';

    // バックアップ
    html += `<div class="settings-section">
        <div class="settings-title">データのバックアップ</div>
        <div class="hint">データはこのブラウザにだけ保存されています。別の端末に移すときや、念のための控えに使ってください。</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="exportData()">ファイルに書き出す</button>
            <button class="secondary" onclick="document.getElementById('importFile').click()">ファイルから読み込む</button>
            <input type="file" id="importFile" accept="application/json,.json" style="display: none;" onchange="importData(this)">
            <button class="danger" onclick="resetAllData()">全データを削除</button>
        </div>
    </div>`;

    document.getElementById('settings').innerHTML = html;
}
