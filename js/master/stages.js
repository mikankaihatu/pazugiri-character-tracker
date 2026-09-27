// ===== ステージの固定データ =====
// このファイルは tools/convert_master.py で data/master.xlsx から作っています。
// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。

// drops の kind は、素材シートにない品の種類（絵馬 など）
const STAGES = [
    {"name": "1-2", "drops": [{"name": "葉っぱ"}, {"name": "水"}, {"name": "桃"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-4", "drops": [{"name": "ふさふさの毛"}, {"name": "丸太"}, {"name": "大豆"}, {"name": "骨付き肉"}, {"name": "卵"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-7", "drops": [{"name": "麦"}, {"name": "丸太"}, {"name": "葉っぱ"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
];
