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
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
});

renderCharacters();
