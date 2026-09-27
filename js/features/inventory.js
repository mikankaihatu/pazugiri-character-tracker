// ===== 在庫管理タブ =====
// 素材の所持数を管理し、合成レシピがあれば合成する

let showOnlyNeeded = false;

// 在庫を変えたら、在庫管理と素材トラッキングの両方を描き直す
function refreshInventoryViews() {
    saveData();
    renderInventory();
    renderMaterials();
}

function setInventory(material, value) {
    data.inventory[material] = toCount(value);
    refreshInventoryViews();
}

function changeInventory(material, delta) {
    data.inventory[material] = Math.max(0, getCount(material) + delta);
    refreshInventoryViews();
}

function toggleShowOnlyNeeded(checked) {
    showOnlyNeeded = checked;
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
    refreshInventoryViews();
}

// 素材トラッキングの必要数を、在庫の各素材に1行で出す
function renderNeedLine(p) {
    if (!p) return '';
    const parts = [`育成に必要 ${p.need}`];
    if (p.crafting > 0) parts.push(`うち合成の材料 ${p.crafting}`);
    if (p.toCraft > 0) parts.push(`あと ${p.toCraft} 個合成`);
    const status = p.short > 0 ? `<span class="shortage">不足 ${p.short}</span>`
        : p.toCraft > 0 ? `<span class="to-craft">合成が必要</span>`
        : `<span class="enough">足りています</span>`;
    return `<div style="font-size: 12px; color: #666; margin-top: 6px;">📋 ${parts.join('・')}　${status}</div>`;
}

function renderInventory() {
    const plan = requirementPlan(trackedNeeds());
    const neededCount = Object.keys(plan).length;
    let html = `<div class="hint" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span>📋 は素材トラッキングに登録したキャラの育成に必要な数です（合成の材料も含みます）</span>
        <label style="font-size: 13px; color: #333;"><input type="checkbox" ${showOnlyNeeded ? 'checked' : ''} onchange="toggleShowOnlyNeeded(this.checked)"> 育成に必要な素材だけ表示（${neededCount}）</label>
    </div>`;
    for (const category of MATERIAL_CATEGORIES) {
        const materials = materialsInCategory(category).filter(m => !showOnlyNeeded || plan[m]);
        if (showOnlyNeeded && materials.length === 0) continue;
        html += `<div class="rarity-section">
            <div class="rarity-title">${escapeHtml(category)}</div>`;
        if (materials.length === 0) {
            html += '<div class="empty">js/master/materials.js に素材を登録すると、ここに表示されます</div>';
        }
        materials.forEach(m => {
            html += `<div class="material-item">
                <div class="material-header" style="margin-bottom: 0;">
                    <span class="material-name">${escapeHtml(m)}${effectOf(m) ? `<span class="hint-inline">${escapeHtml(effectOf(m))}</span>` : ''}</span>
                    <span class="input-wrapper">
                        <button class="secondary small" onclick="changeInventory(${jsArg(m)}, -1)">−</button>
                        <input type="number" min="0" value="${getCount(m)}" onchange="setInventory(${jsArg(m)}, this.value)">
                        <button class="secondary small" onclick="changeInventory(${jsArg(m)}, 1)">＋</button>
                    </span>
                </div>
                ${renderNeedLine(plan[m])}`;
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
