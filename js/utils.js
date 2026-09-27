// 共通の小さな関数
// data.js の次に読み込む

// 入力された文字列を HTML に埋め込むときに使う（表示崩れ防止）
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// onclick="fn(${jsArg(name)})" のように、文字列を関数の引数として埋め込むときに使う
function jsArg(value) {
    return escapeHtml(JSON.stringify(value));
}

function toCount(value) {
    return Math.max(0, parseInt(value) || 0);
}

// ===== 素材 =====
function allMaterials() {
    return MATERIALS.map(m => m.name);
}

function materialsInCategory(category) {
    return MATERIALS.filter(m => m.category === category).map(m => m.name);
}

function recipeOf(material) {
    const master = MATERIALS.find(m => m.name === material);
    return master && master.recipe && Object.keys(master.recipe).length > 0 ? master.recipe : null;
}

function getCount(material) {
    return data.inventory[material] || 0;
}

// ===== キャラ =====
function allCharacters() {
    return CHARACTERS;
}

function getProgress(name) {
    return { owned: false, needsUpgrade: false, breakthrough: 0, trustLevel: 0, ...data.characterProgress[name] };
}

function setProgress(name, changes) {
    data.characterProgress[name] = { ...getProgress(name), ...changes };
    saveData();
}

// ===== 固定データのチェック =====
// js/master/ の書き間違いを見つけて、画面の上に表示する
function checkMasterData() {
    const errors = [];
    const names = allMaterials();
    names.filter((n, i) => names.indexOf(n) !== i)
        .forEach(n => errors.push(`素材「${n}」が2回以上登録されています`));
    MATERIALS.forEach(m => {
        if (!MATERIAL_CATEGORIES.includes(m.category)) {
            errors.push(`素材「${m.name}」の category「${m.category}」は MATERIAL_CATEGORIES にありません`);
        }
        Object.keys(m.recipe || {}).forEach(src => {
            if (!names.includes(src)) errors.push(`素材「${m.name}」のレシピにある「${src}」は素材に登録されていません`);
            if (src === m.name) errors.push(`素材「${m.name}」のレシピに自分自身が入っています`);
        });
    });
    const charNames = CHARACTERS.map(c => c.name);
    charNames.filter((n, i) => charNames.indexOf(n) !== i)
        .forEach(n => errors.push(`キャラ「${n}」が2回以上登録されています`));
    CHARACTERS.forEach(c => {
        if (c.secretColor && !['red', 'blue', 'yellow'].includes(c.secretColor)) {
            errors.push(`キャラ「${c.name}」の secretColor「${c.secretColor}」は red / blue / yellow のどれかにしてください`);
        }
    });
    return errors;
}
