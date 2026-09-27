// ===== 素材の固定データ =====
// このファイルは tools/convert_master.py で data/master.xlsx から作っています。
// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。

const MATERIAL_CATEGORIES = ["贈物"];

const MATERIALS = [
    {"name": "お花", "category": "贈物", "source": "ドロップ"},
    {"name": "葉っぱ", "category": "贈物", "source": "ドロップ"},
    {"name": "火打ち石", "category": "贈物", "source": "ドロップ"},
    {"name": "桃", "category": "贈物", "source": "ドロップ"},
    {"name": "木の枝", "category": "贈物", "source": "ドロップ"},
    {"name": "卵", "category": "贈物", "source": "ドロップ"},
    {"name": "お魚", "category": "贈物", "source": "ドロップ"},
    {"name": "サンゴ", "category": "贈物", "source": "ドロップ"},
    {"name": "丸太", "category": "贈物", "source": "ドロップ"},
    {"name": "骨付き肉", "category": "贈物", "source": "ドロップ"},
    {"name": "粘土", "category": "贈物", "source": "ドロップ"},
    {"name": "お米", "category": "贈物", "source": "ドロップ"},
    {"name": "鉄", "category": "贈物", "source": "ドロップ"},
    {"name": "昆布", "category": "贈物", "source": "ドロップ"},
    {"name": "ふさふさの毛", "category": "贈物", "source": "ドロップ"},
    {"name": "麦", "category": "贈物", "source": "ドロップ"},
    {"name": "塩", "category": "贈物", "source": "ドロップ"},
    {"name": "サイコロ", "category": "贈物", "source": "ドロップ"},
    {"name": "油", "category": "贈物", "source": "ドロップ"},
    {"name": "ネジ", "category": "贈物", "source": "ドロップ"},
    {"name": "水", "category": "贈物", "source": "ドロップ"},
    {"name": "大豆", "category": "贈物", "source": "ドロップ"},
    {"name": "紙", "category": "贈物", "source": "合成", "recipe": {"木の枝": 1, "丸太": 1, "水": 1}},
];
