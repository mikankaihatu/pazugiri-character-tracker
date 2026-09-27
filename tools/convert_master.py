"""data/master.xlsx から js/master/characters.js と js/master/materials.js を作り直す。

使い方（リポジトリのフォルダで実行）:
    python3 -m pip install openpyxl
    python3 tools/convert_master.py

Excel のシート:
    キャラクター名 : 刀剣男士番号 / 刀剣男士 / 衣装 / レア / 刀種類 / ゆかり / 奥義色 / 奥義数値 /
                     奥義lv1説明文 … 奥義lv5説明文 / 1lv[体力,攻撃] … 30lv[体力,攻撃] /
                     上限突破10→20 / 上限突破20→30 / 上限突破30→35（[お花,3][葉っぱ,2] の形。列を足せば 35→40 なども読める）
    素材           : 分類 / 名前 / 入手方法
    合成レシピ     : 名前 / 必要素材,個数（[木の枝,1][丸太,1] の形）
    ステージドロップ品 : ステージ名 / 落ちる品 / 落ちる品 / …（見出し行なし。1行に1ステージ）
                         素材シートにない品は「[絵馬]塩おにぎり」のように [種類] を先頭につける

刀剣男士が空の行は読み飛ばす。レアの列は、何か書いてあればレアとして扱う（○ など）。
ゆかりは「夜,天下五剣」のようにカンマ区切りで複数書ける。
能力は「740,77」または「[740,77]」の形（空のレベルは飛ばしてよい）。
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


warnings = []


def parse_stat(value, where):
    """能力のセル（'740,77' / '[740,77]'）を [740, 77] にする。空なら None"""
    if value is None or text(value) == '':
        return None
    if isinstance(value, (int, float)):
        # Excel が「1060,140」を 1,060,140 という数値に変えてしまった場合
        warnings.append(f'{where}: 「{value}」が数値になっています。セルの書式を「文字列」にして「体力,攻撃」の形で入れ直してください')
        return None
    parts = [p.strip() for p in re.split(r'[,、，]', text(value).strip('[]［］ '))]
    if len(parts) != 2 or not all(re.fullmatch(r'\d+(\.\d+)?', p) for p in parts):
        warnings.append(f'{where}: 「{value}」は「体力,攻撃」の形になっていません')
        return None
    return [to_number(p) for p in parts]


def split_list(value):
    return [p.strip() for p in re.split(r'[,、，]', text(value)) if p.strip()]


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
        'skillValue': find_column(headers, '奥義数値'),
    }
    # 「奥義lv1説明文」…「奥義lv5説明文」と「1lv[体力,攻撃]」…「30lv[体力,攻撃]」の列（増えても読めるようにする）
    skill_cols = {int(m.group(1)): i for i, h in enumerate(headers) if (m := re.match(r'^奥義lv(\d+)', h))}
    level_cols = {int(m.group(1)): i for i, h in enumerate(headers) if (m := re.match(r'^(\d+)lv', h))}
    # 「上限突破10→20」などの列（→ / -> / ～ のどれでもよい）
    limit_cols = [(int(m.group(1)), int(m.group(2)), i) for i, h in enumerate(headers)
                  if (m := re.match(r'^上限突破\s*(\d+)\s*(?:→|->|～|~)\s*(\d+)', h))]

    characters = []
    for row_number, row in enumerate(rows[1:], start=2):
        base = text(row[col['base']])
        if not base:
            continue
        costume = text(row[col['costume']])
        rare = text(row[col['rare']]) != ''
        name = '-'.join(p for p in [base, costume, 'レア' if rare else ''] if p)
        # { レベル: [体力, 攻撃] }（書いてあるレベルだけ）
        levels = {}
        for lv, i in level_cols.items():
            stat = parse_stat(row[i], f'{row_number}行目 {base} {lv}lv')
            if stat:
                levels[str(lv)] = stat
        skills = {str(lv): text(row[i]) for lv, i in skill_cols.items() if text(row[i])}
        # [{ from: 10, to: 20, materials: { 素材名: 個数 } }]（書いてある段階だけ）
        limit_breaks = []
        for lv_from, lv_to, i in limit_cols:
            pairs = parse_pairs(row[i])
            if text(row[i]) and not pairs:
                warnings.append(f'{row_number}行目 {base} 上限突破{lv_from}→{lv_to}: 「{text(row[i])}」は [素材名,個数] の形になっていません')
            if pairs:
                limit_breaks.append({'from': lv_from, 'to': lv_to,
                                     'materials': {src: to_number(n) for src, n in pairs}})
        skill_value = row[col['skillValue']]
        no = row[col['no']]
        characters.append({
            'no': int(no) if isinstance(no, (int, float)) else text(no),
            'name': name,
            'base': base,
            'costume': costume,
            'rarity': 'レア' if rare else '通常',
            'swordType': text(row[col['swordType']]),
            'yukari': split_list(row[col['yukari']]),
            'secretColor': text(row[col['secretColor']]),
            'skillValue': to_number(skill_value) if isinstance(skill_value, (int, float)) else text(skill_value),
            'skills': skills,
            'levels': levels,
            'limitBreaks': limit_breaks,
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


def read_stages(ws):
    stages = []
    for row_number, row in enumerate(ws.iter_rows(values_only=True), start=1):
        name = text(row[0]) if row else ''
        if not name or name == 'ステージ':
            continue
        drops = []
        for value in row[1:]:
            item = text(value)
            if not item:
                continue
            # 「[絵馬]塩おにぎり」→ 種類「絵馬」の「塩おにぎり」（素材ではない品）
            m = re.fullmatch(r'[\[［]([^\]］]+)[\]］]\s*(.+)', item)
            drops.append({'name': m.group(2).strip(), 'kind': m.group(1).strip()} if m else {'name': item})
        stages.append({'name': name, 'drops': drops})
    return stages


def js_line(obj):
    return '    ' + json.dumps(obj, ensure_ascii=False) + ','


HEADER = '// このファイルは tools/convert_master.py で data/master.xlsx から作っています。\n' \
         '// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。\n\n'


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    characters = read_characters(wb['キャラクター名'])
    materials = read_materials(wb['素材'], wb['合成レシピ'])
    categories = list(dict.fromkeys(m['category'] for m in materials))
    stages = read_stages(wb['ステージドロップ品']) if 'ステージドロップ品' in wb.sheetnames else []

    (OUT_DIR / 'characters.js').write_text(
        '// ===== キャラの固定データ =====\n' + HEADER
        + 'const CHARACTERS = [\n' + '\n'.join(js_line(c) for c in characters) + '\n];\n',
        encoding='utf-8')
    (OUT_DIR / 'materials.js').write_text(
        '// ===== 素材の固定データ =====\n' + HEADER
        + 'const MATERIAL_CATEGORIES = ' + json.dumps(categories, ensure_ascii=False) + ';\n\n'
        + 'const MATERIALS = [\n' + '\n'.join(js_line(m) for m in materials) + '\n];\n',
        encoding='utf-8')

    (OUT_DIR / 'stages.js').write_text(
        '// ===== ステージの固定データ =====\n' + HEADER
        + '// drops の kind は、素材シートにない品の種類（絵馬 など）\n'
        + 'const STAGES = [\n' + '\n'.join(js_line(st) for st in stages) + '\n];\n',
        encoding='utf-8')

    print(f'キャラ {len(characters)} 件、素材 {len(materials)} 件、ステージ {len(stages)} 件を書き出しました')
    if warnings:
        print(f'\n確認してほしいところが {len(warnings)} 件あります（この値は読み飛ばしました）:')
        for w in warnings:
            print('  - ' + w)


if __name__ == '__main__':
    main()
