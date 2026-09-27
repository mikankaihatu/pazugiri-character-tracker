// タブ切り替えと初期化
// 各タブの render 関数を使うため、最後に読み込む

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'characters') renderCharacters();
    if (tabName === 'drops') renderDrops();
    if (tabName === 'materials') renderMaterials();
    if (tabName === 'inventory') renderInventory();
    if (tabName === 'settings') renderSettings();
}

// ===== 初期化 =====
// js/master/ に書き間違いがあれば、画面の上に表示する
const masterErrors = checkMasterData();
if (masterErrors.length > 0) {
    document.querySelector('.header').insertAdjacentHTML('beforeend', `<div class="master-error">
        <div style="font-weight: 600; margin-bottom: 4px;">js/master/ の固定データに問題があります</div>
        ${masterErrors.map(e => `<div>・${escapeHtml(e)}</div>`).join('')}
    </div>`);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
});

renderCharacters();
