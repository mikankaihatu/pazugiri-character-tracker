// ===== 設定タブ =====
// データのバックアップ
// （キャラ・素材・合成レシピ・ステージは data/master.xlsx → js/master/ で管理する）

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
    // バックアップ
    let html = `<div class="settings-section">
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
