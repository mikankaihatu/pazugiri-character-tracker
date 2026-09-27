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

function craftableCount(product) {
    const recipe = recipeOf(product);
    if (!recipe) return 0;
    return Math.min(...Object.entries(recipe).map(([m, n]) => Math.floor(getCount(m) / n)));
}

function craft(product) {
    if (craftableCount(product) < 1) return;
    for (const [m, n] of Object.entries(recipeOf(product))) data.inventory[m] = getCount(m) - n;
    data.inventory[product] = getCount(product) + 1;
    saveData();
    renderInventory();
}

function renderInventory() {
    let html = '';
    for (const category of MATERIAL_CATEGORIES) {
        const materials = materialsInCategory(category);
        html += `<div class="rarity-section">
            <div class="rarity-title">${escapeHtml(category)}</div>`;
        if (materials.length === 0) {
            html += '<div class="empty">js/master/materials.js に素材を登録すると、ここに表示されます</div>';
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
            if (recipeOf(m)) {
                const recipeText = Object.entries(recipeOf(m))
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
