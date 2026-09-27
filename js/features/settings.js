// ===== 設定タブ =====
// ステージの登録と、データのバックアップ
// （素材・キャラ・合成レシピは js/master/ で管理する）

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
    const materials = allMaterials();
    const stages = Object.keys(data.stageDrops);

    // ステージ
    let html = `<div class="settings-section">
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
