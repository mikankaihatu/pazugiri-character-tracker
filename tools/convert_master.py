"""data/master.xlsx から js/master/characters.js と js/master/materials.js を作り直す。

使い方（リポジトリのフォルダで実行）:
    python3 -m pip install openpyxl
    python3 tools/convert_master.py

Excel のシート:
    キャラクター名 : 刀剣男士番号 / 刀剣男士 / 衣装 / レア / 刀種類 / ゆかり / 奥義色 / 奥義数値 /
                     奥義lv1説明文 … 奥義lv5説明文 / 1lv[体力,攻撃] … 30lv[体力,攻撃] /
                     上限突破10→20 / 上限突破20→30 / 上限突破30→35（お花3,葉っぱ2 または [お花,3][葉っぱ,2] の形。列を足せば 35→40 なども読める）
    素材           : 分類 / 名前 / 入手方法 / 効果
    合成レシピ     : 名前 / 必要素材,個数（[木の枝,1][丸太,1] または 木の枝1,丸太1 の形）
    ステージドロップ品 : ステージ名 / 有利刀種 / ドロップ品 / ドロップ品 / …（1行に1ステージ。有利刀種は「太刀,打刀」のように複数可）
                         素材シートにない品は「[絵馬]塩おにぎり」のように [種類] を先頭につける

刀剣男士が空の行は読み飛ばす。レアの列は、何か書いてあればレアとして扱う（○ など）。
ゆかりは「夜,天下五剣」のようにカンマ区切りで複数書ける。
能力は「740,77」または「[740,77]」の形（空のレベルは飛ばしてよい）。
アプリで記録を保存するときの名前は「刀剣男士-衣装」、レアなら「刀剣男士-衣装-レア」になる。
"""

import json
import re
import sys
import unicodedata
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


warnings = []   # 読めなかった値（読み飛ばしたもの）
notes = []      # まだ埋まっていないところ（読み飛ばしてはいない）


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


def parse_materials(value, where):
    """素材と個数のセルを { 素材名: 個数 } にする。次のどちらの書き方でもよい
        [木の枝,1][丸太,1]
        黄の絵具1,書き物道具2（「黄の絵具×1」「黄の絵具 1」、全角数字も可）
    """
    cell = text(value)
    if not cell:
        return {}
    pairs = parse_pairs(cell)
    if pairs:
        return {src: to_number(n) for src, n in pairs}
    result = {}
    for part in re.split(r'[,、，\n]', cell):
        part = part.strip()
        if not part:
            continue
        m = re.fullmatch(r'(.+?)\s*[×xX*＊]?\s*([0-9０-９]+)', part)
        if not m:
            warnings.append(f'{where}: 「{part}」に個数がありません（「黄の絵具1」のように素材名のあとに数を書いてください）')
            continue
        result[m.group(1).strip()] = int(unicodedata.normalize('NFKC', m.group(2)))
    return result


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
            materials = parse_materials(row[i], f'{row_number}行目 {base} 上限突破{lv_from}→{lv_to}')
            if materials:
                limit_breaks.append({'from': lv_from, 'to': lv_to, 'materials': materials})
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
    for row_number, row in enumerate(list(ws_recipes.iter_rows(values_only=True))[1:], start=2):
        name = text(row[0])
        if name:
            recipes[name] = parse_materials(row[1], f'合成レシピ {row_number}行目 {name}')

    materials = []
    for row in list(ws_materials.iter_rows(values_only=True))[1:]:
        name = text(row[1])
        if not name:
            continue
        material = {'name': name, 'category': text(row[0]), 'source': text(row[2])}
        effect = text(row[3]) if len(row) > 3 else ''
        if effect:
            material['effect'] = effect
        if recipes.get(name):
            material['recipe'] = recipes[name]
        elif material['source'] == '合成':
            notes.append(f'「{name}」は入手方法が「合成」ですが、合成レシピがまだありません')
        materials.append(material)
    return materials


def read_stages(ws):
    rows = list(ws.iter_rows(values_only=True))
    # 見出し行（ステージ名 / 有利刀種 / ドロップ品 …）があれば、それで列を決める
    advantage_col, drops_from = None, 1
    if rows and text(rows[0][0]).startswith('ステージ'):
        headers = [text(h) for h in rows[0]]
        advantage_col = next((i for i, h in enumerate(headers) if '有利' in h), None)
        drops_from = next((i for i, h in enumerate(headers) if 'ドロップ' in h), 1)
        rows = rows[1:]
    stages = []
    for row in rows:
        name = text(row[0]) if row else ''
        if not name:
            continue
        drops = []
        for value in row[drops_from:]:
            item = text(value)
            if not item:
                continue
            # 「[絵馬]塩おにぎり」→ 種類「絵馬」の「塩おにぎり」（素材ではない品）
            m = re.fullmatch(r'[\[［]([^\]］]+)[\]］]\s*(.+)', item)
            drops.append({'name': m.group(2).strip(), 'kind': m.group(1).strip()} if m else {'name': item})
        stage = {'name': name}
        if advantage_col is not None:
            stage['advantage'] = split_list(row[advantage_col])
        stage['drops'] = drops
        stages.append(stage)
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

    # 素材シートにない名前（合成レシピ・上限突破・ステージドロップ品で使われているもの）
    known = {m['name'] for m in materials}
    missing = {}
    for m in materials:
        for src in m.get('recipe', {}):
            missing.setdefault(src, []).append(f'合成レシピ「{m["name"]}」')
    for c in characters:
        for lb in c['limitBreaks']:
            for src in lb['materials']:
                missing.setdefault(src, []).append(f'{c["base"]} 上限突破{lb["from"]}→{lb["to"]}')
    for st in stages:
        for d in st['drops']:
            if 'kind' not in d:
                missing.setdefault(d['name'], []).append(f'ステージ{st["name"]}')
    for name, places in missing.items():
        if name not in known:
            used = '、'.join(dict.fromkeys(places))
            warnings.append(f'「{name}」が素材シートにありません（使っているところ：{used}）')

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
    if notes:
        print(f'\nメモ（まだ埋まっていないところ）:')
        for n in notes:
            print('  - ' + n)
    if warnings:
        print(f'\n確認してほしいところが {len(warnings)} 件あります:')
        for w in warnings:
            print('  - ' + w)


if __name__ == '__main__':
    main()
