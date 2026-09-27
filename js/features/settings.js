// ===== 設定タブ =====
// 不具合の報告・情報の提供と、データのバックアップ
// （キャラ・素材・合成レシピ・ステージは data/master.xlsx → js/master/ で管理する）

// ----- 不具合の報告 -----
function copyEnvironmentInfo(button) {
    const text = document.getElementById('envInfo');
    const done = () => { button.textContent = 'コピーしました'; setTimeout(() => { button.textContent = '使用環境をコピー'; }, 2000); };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text.value).then(done, () => { text.select(); document.execCommand('copy'); done(); });
    } else {
        // ファイルを直接開いたときなど、clipboard API が使えない場合
        text.select();
        document.execCommand('copy');
        done();
    }
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
    // 不具合の報告
    let html = `<div class="settings-section">
        <div class="settings-title">不具合の報告</div>
        <div class="hint">おかしな動きを見つけたら、フォームから教えてください。下の「使用環境」をコピーしてフォームに貼ってもらえると、原因を調べやすくなります。</div>
        <textarea id="envInfo" readonly rows="6" style="width: 100%; font-size: 12px; font-family: monospace; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; resize: vertical;">${escapeHtml(environmentInfo())}</textarea>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="secondary" onclick="copyEnvironmentInfo(this)">使用環境をコピー</button>
            <a href="${REPORT_FORM_URL}" target="_blank" rel="noopener"><button>報告フォームを開く</button></a>
        </div>
    </div>`;

    // 情報の提供
    html += `<div class="settings-section">
        <div class="settings-title">情報の提供</div>
        <div class="hint">キャラの能力・奥義・上限突破の必要素材、合成レシピ、ステージのドロップ品など、まだ載っていない情報を教えてください。</div>
        <a href="${INFO_FORM_URL}" target="_blank" rel="noopener"><button>情報提供フォームを開く</button></a>
    </div>`;

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
