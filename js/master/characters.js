// ===== キャラの固定データ =====
// このファイルは tools/convert_master.py で data/master.xlsx から作っています。
// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。

const CHARACTERS = [
    {"no": 3, "name": "三日月宗近-戦装束", "base": "三日月宗近", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 3, "name": "三日月宗近-戦装束-レア", "base": "三日月宗近", "costume": "戦装束", "rarity": "レア", "swordType": "太刀", "yukari": ["夜", "天下五剣"], "secretColor": "赤", "skillValue": 22, "skills": {"1": "【すべて】のト餓鬼を消去し、敵に【特小++】ダメージを与える"}, "levels": {"13": [1060, 140]}, "limitBreaks": []},
    {"no": 5, "name": "小狐丸-戦装束", "base": "小狐丸", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": ["けもの"], "secretColor": "赤", "skillValue": 27, "skills": {"1": "ボムを【3個】生成する"}, "levels": {"5": [740, 77]}, "limitBreaks": []},
    {"no": 7, "name": "石切丸-戦装束", "base": "石切丸", "costume": "戦装束", "rarity": "通常", "swordType": "大太刀", "yukari": ["ご神刀"], "secretColor": "青", "skillValue": 22, "skills": {"1": "【扇型・中範囲】のト餓鬼を消去し、敵に【特小-】ダメージを与える。味方全体に被ダメージ軽減【極小+・3手】を付与する"}, "levels": {"1": [561, 61]}, "limitBreaks": []},
    {"no": 9, "name": "岩融-戦装束", "base": "岩融", "costume": "戦装束", "rarity": "通常", "swordType": "薙刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 23, "name": "鳴狐-戦装束", "base": "鳴狐", "costume": "戦装束", "rarity": "通常", "swordType": "打刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 25, "name": "一期一振-戦装束", "base": "一期一振", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 25, "name": "一期一振-戦装束-レア", "base": "一期一振", "costume": "戦装束", "rarity": "レア", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 27, "name": "鯰尾藤四郎-戦装束", "base": "鯰尾藤四郎", "costume": "戦装束", "rarity": "通常", "swordType": "脇刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 29, "name": "骨喰藤四郎-戦装束", "base": "骨喰藤四郎", "costume": "戦装束", "rarity": "通常", "swordType": "脇刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 31, "name": "平野藤四郎-戦装束", "base": "平野藤四郎", "costume": "戦装束", "rarity": "通常", "swordType": "短刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 33, "name": "厚藤四郎-戦装束", "base": "厚藤四郎", "costume": "戦装束", "rarity": "通常", "swordType": "短刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 45, "name": "乱藤四郎-戦装束", "base": "乱藤四郎", "costume": "戦装束", "rarity": "通常", "swordType": "短刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 45, "name": "乱藤四郎-戦装束-レア", "base": "乱藤四郎", "costume": "戦装束", "rarity": "レア", "swordType": "短刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 47, "name": "五虎退-戦装束", "base": "五虎退", "costume": "戦装束", "rarity": "通常", "swordType": "短刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 59, "name": "蛍丸-戦装束", "base": "蛍丸", "costume": "戦装束", "rarity": "通常", "swordType": "大太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 65, "name": "蜻蛉切-戦装束", "base": "蜻蛉切", "costume": "戦装束", "rarity": "通常", "swordType": "槍", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 79, "name": "江雪左文字-戦装束", "base": "江雪左文字", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 85, "name": "加州清光-戦装束", "base": "加州清光", "costume": "戦装束", "rarity": "通常", "swordType": "打刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 91, "name": "和泉守兼定-戦装束", "base": "和泉守兼定", "costume": "戦装束", "rarity": "通常", "swordType": "打刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 93, "name": "陸奥守吉行-戦装束", "base": "陸奥守吉行", "costume": "戦装束", "rarity": "通常", "swordType": "打刀", "yukari": ["海"], "secretColor": "黄", "skillValue": 16, "skills": {"1": "【横列・小範囲】のト餓鬼を消去し、敵に【極小】ダメージを与える味方全員に攻撃力上昇【極小++・3手】を付与する"}, "levels": {"30": [1575, 228]}, "limitBreaks": [{"from": 30, "to": 35, "materials": {"黄の絵具": 1, "書き物道具": 2, "花札": 2, "天ぷら": 2, "そろばん": 2, "打刀の心得": 1}}]},
    {"no": 95, "name": "山姥切国広-戦装束", "base": "山姥切国広", "costume": "戦装束", "rarity": "通常", "swordType": "打刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 97, "name": "山伏国広-戦装束", "base": "山伏国広", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 122, "name": "獅子王-戦装束", "base": "獅子王", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
    {"no": 130, "name": "鶴丸国永-戦装束", "base": "鶴丸国永", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}, "limitBreaks": []},
];
