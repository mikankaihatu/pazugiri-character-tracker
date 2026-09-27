// データ構造・保存（localStorage）
// 全ファイルから参照するため、最初に読み込む

// ===== データ構造 =====
const INITIAL_DATA = {
    characters: { rare: [], unrevealed: [] },
    materialCategories: {
        'ドロップ素材': ['金', '銀', '鋼', '刀彩'],
        '合成素材': [],
        '貴重素材': []
    },
    recipes: {},
    characterLevelUps: {},
    stageDrops: {},
    inventory: {},
    runs: []
};

// ===== データ管理 =====
function validateData(savedData) {
    if (!savedData.characters) savedData.characters = { rare: [], unrevealed: [] };
    if (!savedData.recipes) savedData.recipes = {};
    if (!savedData.characterLevelUps) savedData.characterLevelUps = {};
    if (!savedData.stageDrops) savedData.stageDrops = {};
    if (!savedData.inventory) savedData.inventory = {};
    if (!Array.isArray(savedData.runs)) savedData.runs = [];

    if (!savedData.materialCategories || typeof savedData.materialCategories !== 'object') {
        savedData.materialCategories = {
            'ドロップ素材': ['金', '銀', '鋼', '刀彩'],
            '合成素材': [],
            '貴重素材': []
        };
    }

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
