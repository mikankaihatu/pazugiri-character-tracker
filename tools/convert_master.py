"""data/master.xlsx から js/master/characters.js と js/master/materials.js を作り直す。

使い方（リポジトリのフォルダで実行）:
    python3 -m pip install openpyxl
    python3 tools/convert_master.py

Excel のシート:
    キャラクター名 : 刀剣男士番号 / 刀剣男士 / 衣装 / レア / 刀種類 / ゆかり / 奥義色(赤,黄,青) / 奥義lv1説明文 / 1lv[体力,攻撃] / 2lv / 3lv ...
    素材           : 分類 / 名前 / 入手方法
    合成レシピ     : 名前 / 必要素材,個数（[木の枝,1][丸太,1] の形）

刀剣男士が空の行は読み飛ばす。レアの列は、何か書いてあればレアとして扱う（○ など）。
アプリで記録を保存するときの名前は「刀剣男士-衣装」、レアなら「刀剣男士-衣装-レア」になる。
"""

import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('openpyxl が入っていません。先に「python3 -m pip install openpyxl」を実行してください。')

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / 'data' / 'master.xlsx'
OUT_DIR = ROOT / 'js' / 'master'


def text(value):
    return '' if value is None else str(value).strip()


def find_column(headers, keyword):
    # 見出しが完全に一致する列を優先し、なければ keyword を含む列を探す
    #（「刀剣男士」で「刀剣男士番号」の列を拾わないように）
    if keyword in headers:
        return headers.index(keyword)
    for i, h in enumerate(headers):
        if keyword in h:
            return i
    sys.exit(f'シートに「{keyword}」を含む列が見つかりません')


def parse_pairs(value):
    """'[木の枝,1][丸太,1]' や '[100,20]' を [['木の枝', '1'], ['丸太', '1']] にする"""
    return [[p.strip() for p in m.split(',')] for m in re.findall(r'\[([^\]]*)\]', text(value))]


def to_number(value):
    try:
        return int(value)
    except ValueError:
        return float(value)


def read_characters(ws):
    rows = list(ws.iter_rows(values_only=True))
    headers = [text(h) for h in rows[0]]
    col = {
        'no': find_column(headers, '番号'),
        'base': find_column(headers, '刀剣男士'),
        'costume': find_column(headers, '衣装'),
        'rare': find_column(headers, 'レア'),
        'swordType': find_column(headers, '刀種類'),
        'yukari': find_column(headers, 'ゆかり'),
        'secretColor': find_column(headers, '奥義色'),
        'skill': find_column(headers, '説明'),
    }
    # 「1lv[体力,攻撃]」「2lv」「3lv」… の列（増えても読めるようにする）
    level_cols = [i for i, h in enumerate(headers) if re.match(r'^\d+lv', h)]

    characters = []
    for row in rows[1:]:
        base = text(row[col['base']])
        if not base:
            continue
        costume = text(row[col['costume']])
        rare = text(row[col['rare']]) != ''
        name = '-'.join(p for p in [base, costume, 'レア' if rare else ''] if p)
        levels = []
        for i in level_cols:
            pairs = parse_pairs(row[i])
            if pairs and len(pairs[0]) == 2 and all(pairs[0]):
                levels.append([to_number(v) for v in pairs[0]])
        no = row[col['no']]
        characters.append({
            'no': int(no) if isinstance(no, (int, float)) else text(no),
            'name': name,
            'base': base,
            'costume': costume,
            'rarity': 'レア' if rare else '通常',
            'swordType': text(row[col['swordType']]),
            'yukari': text(row[col['yukari']]),
            'secretColor': text(row[col['secretColor']]),
            'skill': text(row[col['skill']]),
            'levels': levels,
        })
    return characters


def read_materials(ws_materials, ws_recipes):
    recipes = {}
    for row in list(ws_recipes.iter_rows(values_only=True))[1:]:
        name = text(row[0])
        if name:
            recipes[name] = {src: to_number(n) for src, n in parse_pairs(row[1])}

    materials = []
    for row in list(ws_materials.iter_rows(values_only=True))[1:]:
        name = text(row[1])
        if not name:
            continue
        material = {'name': name, 'category': text(row[0]), 'source': text(row[2])}
        if name in recipes:
            material['recipe'] = recipes[name]
        materials.append(material)
    return materials


def js_line(obj):
    return '    ' + json.dumps(obj, ensure_ascii=False) + ','


HEADER = '// このファイルは tools/convert_master.py で data/master.xlsx から作っています。\n' \
         '// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。\n\n'


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    characters = read_characters(wb['キャラクター名'])
    materials = read_materials(wb['素材'], wb['合成レシピ'])
    categories = list(dict.fromkeys(m['category'] for m in materials))

    (OUT_DIR / 'characters.js').write_text(
        '// ===== キャラの固定データ =====\n' + HEADER
        + 'const CHARACTERS = [\n' + '\n'.join(js_line(c) for c in characters) + '\n];\n',
        encoding='utf-8')
    (OUT_DIR / 'materials.js').write_text(
        '// ===== 素材の固定データ =====\n' + HEADER
        + 'const MATERIAL_CATEGORIES = ' + json.dumps(categories, ensure_ascii=False) + ';\n\n'
        + 'const MATERIALS = [\n' + '\n'.join(js_line(m) for m in materials) + '\n];\n',
        encoding='utf-8')

    print(f'キャラ {len(characters)} 件、素材 {len(materials)} 件を書き出しました')


if __name__ == '__main__':
    main()
