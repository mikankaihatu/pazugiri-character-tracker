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

function allMaterials() {
    return Object.values(data.materialCategories).flat();
}

function allCharacters() {
    return [...data.characters.rare, ...data.characters.unrevealed];
}

function getCount(material) {
    return data.inventory[material] || 0;
}

function toCount(value) {
    return Math.max(0, parseInt(value) || 0);
}
