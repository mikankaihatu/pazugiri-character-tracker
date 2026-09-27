// ===== ステージの固定データ =====
// このファイルは tools/convert_master.py で data/master.xlsx から作っています。
// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。

// drops の kind は、素材シートにない品の種類（絵馬 など）
const STAGES = [
    {"name": "1-2", "advantage": ["太刀", "打刀"], "drops": [{"name": "葉っぱ"}, {"name": "水"}, {"name": "桃"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-4", "advantage": ["太刀", "打刀"], "drops": [{"name": "ふさふさの毛"}, {"name": "丸太"}, {"name": "大豆"}, {"name": "骨付き肉"}, {"name": "卵"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-7", "advantage": ["太刀", "打刀"], "drops": [{"name": "麦"}, {"name": "丸太"}, {"name": "葉っぱ"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-9", "advantage": ["太刀", "打刀"], "drops": [{"name": "水"}, {"name": "大豆"}, {"name": "桃"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-11", "advantage": ["太刀", "打刀"], "drops": [{"name": "麦"}, {"name": "ふさふさの毛"}, {"name": "骨付き肉"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-12", "advantage": ["太刀", "打刀"], "drops": [{"name": "ふさふさの毛"}, {"name": "麦"}, {"name": "丸太"}, {"name": "獣の牙"}, {"name": "トラの毛皮"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-13", "advantage": ["太刀", "打刀"], "drops": [{"name": "葉っぱ"}, {"name": "大豆"}, {"name": "卵"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "1-17", "advantage": ["太刀", "打刀"], "drops": [{"name": "水"}, {"name": "大豆"}, {"name": "トラの毛皮"}, {"name": "鬼のツノ"}, {"name": "塩おにぎり", "kind": "絵馬"}]},
    {"name": "2-2", "advantage": ["打刀", "短刀"], "drops": [{"name": "お米"}, {"name": "麦"}, {"name": "大豆"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-5", "advantage": ["打刀", "短刀"], "drops": [{"name": "鉄"}, {"name": "骨付き肉"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-6", "advantage": ["打刀", "短刀"], "drops": [{"name": "お魚"}, {"name": "木の枝"}, {"name": "粘土"}, {"name": "水"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-7", "advantage": ["打刀", "短刀"], "drops": [{"name": "お魚"}, {"name": "粘土"}, {"name": "油"}, {"name": "水"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-11", "advantage": ["打刀", "短刀"], "drops": [{"name": "お魚"}, {"name": "粘土"}, {"name": "水"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-12", "advantage": ["打刀", "短刀"], "drops": [{"name": "お米"}, {"name": "大豆"}, {"name": "お魚"}, {"name": "鉄"}, {"name": "卵"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-16", "advantage": ["打刀", "短刀"], "drops": [{"name": "丸太"}, {"name": "火打ち石"}, {"name": "木の枝"}, {"name": "サイコロ"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-19", "advantage": ["打刀", "短刀"], "drops": [{"name": "お米"}, {"name": "ふさふさの毛"}, {"name": "骨付き肉"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-22", "advantage": ["打刀", "短刀"], "drops": [{"name": "みかげ石"}, {"name": "火打ち石"}, {"name": "木の枝"}, {"name": "ろうそく"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-24", "advantage": ["打刀", "短刀"], "drops": [{"name": "サイコロ"}, {"name": "ろうそく"}, {"name": "みかげ石"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-25", "advantage": ["打刀", "短刀"], "drops": [{"name": "お花"}, {"name": "木の枝"}, {"name": "丸太"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-27", "advantage": ["打刀", "短刀"], "drops": [{"name": "水"}, {"name": "鬼のツノ"}, {"name": "獣の牙"}, {"name": "トラの毛皮"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
    {"name": "2-29", "advantage": ["打刀", "短刀"], "drops": [{"name": "ふさふさの毛"}, {"name": "元結"}, {"name": "[4級]２本の矢", "kind": "絵馬"}]},
];
