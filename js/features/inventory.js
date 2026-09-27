// ===== 在庫管理タブ =====
// 素材の所持数を管理し、合成レシピがあれば合成する

function setInventory(material, value) {
    data.inventory[material] = toCount(value);
    saveData();
    renderInventory();
}

function changeInventory(material, delta) {
    data.inventory[material] = Math.max(0, getCount(material) + delta);
    saveData();
    renderInventory();
}

function hasRecipe(product) {
    return !!data.recipes[product] && Object.keys(data.recipes[product]).length > 0;
}

function craftableCount(product) {
    if (!hasRecipe(product)) return 0;
    return Math.min(...Object.entries(data.recipes[product]).map(([m, n]) => Math.floor(getCount(m) / n)));
}

function craft(product) {
    if (craftableCount(product) < 1) return;
    for (const [m, n] of Object.entries(data.recipes[product])) data.inventory[m] = getCount(m) - n;
    data.inventory[product] = getCount(product) + 1;
    saveData();
    renderInventory();
}

function renderInventory() {
    let html = '';
    for (const [category, materials] of Object.entries(data.materialCategories)) {
        html += `<div class="rarity-section">
            <div class="rarity-title">${escapeHtml(category)}</div>`;
        if (materials.length === 0) {
            html += '<div class="empty">設定タブで素材を登録してください</div>';
        }
        materials.forEach(m => {
            html += `<div class="material-item">
                <div class="material-header" style="margin-bottom: 0;">
                    <span class="material-name">${escapeHtml(m)}</span>
                    <span class="input-wrapper">
                        <button class="secondary small" onclick="changeInventory(${jsArg(m)}, -1)">−</button>
                        <input type="number" min="0" value="${getCount(m)}" onchange="setInventory(${jsArg(m)}, this.value)">
                        <button class="secondary small" onclick="changeInventory(${jsArg(m)}, 1)">＋</button>
                    </span>
                </div>`;
            if (hasRecipe(m)) {
                const recipeText = Object.entries(data.recipes[m])
                    .map(([src, n]) => `${escapeHtml(src)}×${n}（所持${getCount(src)}）`).join('、');
                const craftable = craftableCount(m);
                html += `<div class="material-header" style="margin: 8px 0 0; font-size: 12px; color: #666;">
                    <span>レシピ：${recipeText}</span>
                    <button class="small" ${craftable < 1 ? 'disabled' : ''} onclick="craft(${jsArg(m)})">合成（あと${craftable}回）</button>
                </div>`;
            }
            html += '</div>';
        });
        html += '</div>';
    }
    document.getElementById('inventory').innerHTML = html;
}
