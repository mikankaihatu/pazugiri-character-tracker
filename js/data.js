// データ構造・保存（localStorage）
// ここに保存するのは自分の育成状況だけ。キャラと素材の一覧は js/master/ にある

// ===== データ構造 =====
const INITIAL_DATA = {
    characterProgress: {},   // { キャラ名: { owned, level, levelCap, trustLevel } }
    characterLevelUps: {},   // { キャラ名: { 素材名: 必要数 } }
    levelUpTargets: {},      // { キャラ名: 上限突破後のレベル上限 }（上限突破の素材をセットしたとき）
    inventory: {},           // { 素材名: 所持数 }
    runs: [],                // 周回記録 [{ id, stage, date, drops, addedToInventory, party? }]
    dropParty: []            // ドロップ統計で最後に選んだ出陣キャラ（キャラ名3つまで）
};

// ===== データ管理 =====
function validateData(savedData) {
    if (!savedData.characterProgress) savedData.characterProgress = {};
    if (!savedData.characterLevelUps) savedData.characterLevelUps = {};
    if (!savedData.levelUpTargets) savedData.levelUpTargets = {};
    if (!savedData.inventory) savedData.inventory = {};
    if (!Array.isArray(savedData.runs)) savedData.runs = [];
    if (!Array.isArray(savedData.dropParty)) savedData.dropParty = [];

    // 旧形式（キャラを画面から追加していた頃）のデータを、キャラ名で保存する形に変換する
    if (savedData.characters) {
        const oldChars = [...(savedData.characters.rare || []), ...(savedData.characters.unrevealed || [])];
        oldChars.forEach(c => {
            savedData.characterProgress[c.name] = {
                owned: true,
                breakthrough: c.breakthrough || 0,   // 下でレベル上限に変換する
                trustLevel: c.trustLevel || 0
            };
            if (savedData.characterLevelUps[c.id]) {
                savedData.characterLevelUps[c.name] = savedData.characterLevelUps[c.id];
                delete savedData.characterLevelUps[c.id];
            }
        });
        delete savedData.characters;
    }
    // 「限界突破（0〜6）」はレベル上限（上限突破）に一本化した：0→Lv10、1→Lv20、2→Lv30、3以上→Lv35
    Object.values(savedData.characterProgress).forEach(p => {
        if (p.breakthrough === undefined) return;
        if (p.levelCap === undefined) p.levelCap = [10, 20, 30, 35][Math.min(p.breakthrough || 0, 3)];
        delete p.breakthrough;
    });
    // 「強化待ち」はなくした
    Object.values(savedData.characterProgress).forEach(p => delete p.needsUpgrade);
    // 素材の分類と合成レシピは js/master/materials.js に移った
    delete savedData.materialCategories;
    delete savedData.recipes;
    // ステージは js/master/stages.js に移った
    delete savedData.stageDrops;

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
