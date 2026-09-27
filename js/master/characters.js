// ===== キャラの固定データ =====
// このファイルは tools/convert_master.py で data/master.xlsx から作っています。
// 直接書き換えても動きますが、次に変換したときに Excel の内容で上書きされます。

const CHARACTERS = [
    {"no": 3, "name": "三日月宗近-戦装束", "base": "三日月宗近", "costume": "戦装束", "rarity": "通常", "swordType": "", "yukari": [], "secretColor": "", "skillValue": "", "skills": {}, "levels": {}},
    {"no": 3, "name": "三日月宗近-戦装束-レア", "base": "三日月宗近", "costume": "戦装束", "rarity": "レア", "swordType": "太刀", "yukari": ["夜", "天下五剣"], "secretColor": "赤", "skillValue": 22, "skills": {"1": "【すべて】のト餓鬼を消去し、敵に【特小++】ダメージを与える"}, "levels": {}},
    {"no": 5, "name": "小狐丸-戦装束", "base": "小狐丸", "costume": "戦装束", "rarity": "通常", "swordType": "太刀", "yukari": ["けもの"], "secretColor": "赤", "skillValue": 27, "skills": {"1": "ボムを【3個】生成する"}, "levels": {"5": [740, 77]}},
    {"no": 7, "name": "石切丸-戦装束", "base": "石切丸", "costume": "戦装束", "rarity": "通常", "swordType": "大太刀", "yukari": ["ご神刀"], "secretColor": "青", "skillValue": 22, "skills": {"1": "【扇型・中範囲】のト餓鬼を消去し、敵に【特小-】ダメージを与える。味方全体に被ダメージ軽減【極小+・3手】を付与する"}, "levels": {"1": [561, 61]}},
];
