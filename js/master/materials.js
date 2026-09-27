// ===== 素材の固定データ =====
// 素材を増やすときは、MATERIALS に 1 行追加する。
//   name     : 素材名（ほかの素材・キャラと重ならない名前にする。在庫などはこの名前で保存される）
//   category : MATERIAL_CATEGORIES のどれか
//   recipe   : 合成素材のときだけ。{ 材料の素材名: 1個作るのに必要な数 }
//
// 例：{ name: '玉鋼', category: '合成素材', recipe: { '金': 2, '銀': 1 } },

const MATERIAL_CATEGORIES = ['ドロップ素材', '合成素材', '貴重素材'];

const MATERIALS = [
    // ドロップ素材
    { name: '金', category: 'ドロップ素材' },
    { name: '銀', category: 'ドロップ素材' },
    { name: '鋼', category: 'ドロップ素材' },
    { name: '刀彩', category: 'ドロップ素材' },

    // 合成素材

    // 貴重素材
];
