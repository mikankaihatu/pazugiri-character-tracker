// データ構造・保存（localStorage）
// ここに保存するのは自分の育成状況だけ。キャラと素材の一覧は js/master/ にある

// ===== データ構造 =====
const INITIAL_DATA = {
    characterProgress: {},   // { キャラ名: { owned, needsUpgrade, breakthrough, trustLevel } }
    characterLevelUps: {},   // { キャラ名: { 素材名: 必要数 } }
    stageDrops: {},          // { ステージ名: [落ちる素材名] }
    inventory: {},           // { 素材名: 所持数 }
    runs: []                 // 周回記録
};

// ===== データ管理 =====
function validateData(savedData) {
    if (!savedData.characterProgress) savedData.characterProgress = {};
    if (!savedData.characterLevelUps) savedData.characterLevelUps = {};
    if (!savedData.stageDrops) savedData.stageDrops = {};
    if (!savedData.inventory) savedData.inventory = {};
    if (!Array.isArray(savedData.runs)) savedData.runs = [];

    // 旧形式（キャラを画面から追加していた頃）のデータを、キャラ名で保存する形に変換する
    if (savedData.characters) {
        const oldChars = [...(savedData.characters.rare || []), ...(savedData.characters.unrevealed || [])];
        oldChars.forEach(c => {
            savedData.characterProgress[c.name] = {
                owned: true,
                needsUpgrade: !!c.needsUpgrade,
                breakthrough: c.breakthrough || 0,
                trustLevel: c.trustLevel || 0
            };
            if (savedData.characterLevelUps[c.id]) {
                savedData.characterLevelUps[c.name] = savedData.characterLevelUps[c.id];
                delete savedData.characterLevelUps[c.id];
            }
        });
        delete savedData.characters;
    }
    // 素材の分類と合成レシピは js/master/materials.js に移った
    delete savedData.materialCategories;
    delete savedData.recipes;

    return savedData;
}

let data = (() => {
    const saved = localStorage.getItem('toukenData');
    if (!saved) return JSON.parse(JSON.stringify(INITIAL_DATA));
    try {
        const parsed = JSON.parse(saved);
        return validateData(parsed);
    } catch (e) {
        return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
})();

function saveData() {
    localStorage.setItem('toukenData', JSON.stringify(data));
}
