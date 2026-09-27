// 共通の小さな関数
// data.js の次に読み込む

// 入力された文字列を HTML に埋め込むときに使う（表示崩れ防止）
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// onclick="fn(${jsArg(name)})" のように、文字列を関数の引数として埋め込むときに使う
function jsArg(value) {
    return escapeHtml(JSON.stringify(value));
}

function toCount(value) {
    return Math.max(0, parseInt(value) || 0);
}

// ===== 素材 =====
function allMaterials() {
    return MATERIALS.map(m => m.name);
}

function materialsInCategory(category) {
    return MATERIALS.filter(m => m.category === category).map(m => m.name);
}

function recipeOf(material) {
    const master = MATERIALS.find(m => m.name === material);
    return master && master.recipe && Object.keys(master.recipe).length > 0 ? master.recipe : null;
}

function getCount(material) {
    return data.inventory[material] || 0;
}

// ===== ステージ =====
function stageNames() {
    return STAGES.map(s => s.name);
}

// 章はステージ名の「-」より前（「1-4」→「1」）。「-」がなければ「その他」
function chapterOf(stage) {
    return stage.includes('-') ? stage.split('-')[0] : 'その他';
}

function chapterLabel(chapter) {
    return /^\d+$/.test(chapter) ? `第${chapter}章` : chapter;
}

// Excel に書いた順の章の一覧
function chapterNames() {
    return [...new Set(stageNames().map(chapterOf))];
}

// ステージで落ちる品の名前（素材以外の品も含む）
function dropsFor(stage) {
    const master = STAGES.find(s => s.name === stage);
    return master ? master.drops.map(d => d.name) : [];
}

// 画面に出す品の名前：素材以外は「塩おにぎり（絵馬）」
function dropLabel(stage, item) {
    const master = STAGES.find(s => s.name === stage);
    const drop = master && master.drops.find(d => d.name === item);
    return drop && drop.kind ? `${item}（${drop.kind}）` : item;
}

// ===== キャラ =====
function allCharacters() {
    return CHARACTERS;
}

// 画面に出す名前：「三日月宗近（戦装束・レア）」
function charLabel(name) {
    const c = CHARACTERS.find(ch => ch.name === name);
    if (!c || !c.base) return name;
    const extra = [c.costume, c.rarity === 'レア' ? 'レア' : ''].filter(Boolean).join('・');
    return extra ? `${c.base}（${extra}）` : c.base;
}

// ゆかりは複数ある（["夜", "天下五剣"]）。古い形の文字列でも配列にして返す
function yukariOf(char) {
    if (Array.isArray(char.yukari)) return char.yukari;
    return char.yukari ? [char.yukari] : [];
}

const MAX_TRUST_LEVEL = 10;

function getProgress(name) {
    return { owned: false, needsUpgrade: false, breakthrough: 0, trustLevel: 0, levelCap: 10, ...data.characterProgress[name] };
}

// ===== レベル上限（上限突破） =====
// 選べるレベル上限：10 と、固定データにある上限突破後のレベル（20 / 30 / 35 …）
function levelCapOptions() {
    const caps = new Set([10, 20, 30, 35]);
    CHARACTERS.forEach(c => (c.limitBreaks || []).forEach(lb => { caps.add(lb.from); caps.add(lb.to); }));
    return [...caps].sort((a, b) => a - b);
}

// 今のレベル上限から次に行う上限突破（なければ null）
function nextLimitBreak(name) {
    const char = CHARACTERS.find(c => c.name === name);
    const cap = getProgress(name).levelCap;
    return (char && (char.limitBreaks || []).find(lb => lb.from === cap)) || null;
}

function setProgress(name, changes) {
    data.characterProgress[name] = { ...getProgress(name), ...changes };
    saveData();
}

// ===== 固定データのチェック =====
// js/master/ の書き間違いを見つけて、画面の上に表示する
function checkMasterData() {
    const errors = [];
    const names = allMaterials();
    names.filter((n, i) => names.indexOf(n) !== i)
        .forEach(n => errors.push(`素材「${n}」が2回以上登録されています`));
    MATERIALS.forEach(m => {
        if (!MATERIAL_CATEGORIES.includes(m.category)) {
            errors.push(`素材「${m.name}」の category「${m.category}」は MATERIAL_CATEGORIES にありません`);
        }
        if (m.source === '合成' && !recipeOf(m.name)) {
            errors.push(`素材「${m.name}」は入手方法が「合成」ですが、合成レシピがありません`);
        }
        Object.keys(m.recipe || {}).forEach(src => {
            if (!names.includes(src)) errors.push(`素材「${m.name}」のレシピにある「${src}」は素材に登録されていません`);
            if (src === m.name) errors.push(`素材「${m.name}」のレシピに自分自身が入っています`);
        });
    });
    const stages = stageNames();
    stages.filter((n, i) => stages.indexOf(n) !== i)
        .forEach(n => errors.push(`ステージ「${n}」が2回以上登録されています`));
    STAGES.forEach(st => st.drops.forEach(d => {
        if (!d.kind && !names.includes(d.name)) {
            errors.push(`ステージ「${st.name}」の「${d.name}」は素材に登録されていません（素材以外なら「[絵馬]${d.name}」のように書いてください）`);
        }
    }));
    const charNames = CHARACTERS.map(c => c.name);
    charNames.filter((n, i) => charNames.indexOf(n) !== i)
        .forEach(n => errors.push(`キャラ「${n}」が2回以上登録されています`));
    // 刀剣男士番号：同じ刀剣男士（衣装・レア違い）は同じ番号、違う刀剣男士は違う番号
    const numberOf = {}, baseOf = {};
    CHARACTERS.filter(c => c.base && c.no !== undefined && c.no !== '').forEach(c => {
        if (numberOf[c.base] !== undefined && numberOf[c.base] !== c.no) {
            errors.push(`刀剣男士「${c.base}」に違う番号（${numberOf[c.base]} と ${c.no}）がついています`);
        }
        if (baseOf[c.no] !== undefined && baseOf[c.no] !== c.base) {
            errors.push(`刀剣男士番号 ${c.no} が「${baseOf[c.no]}」と「${c.base}」の両方についています`);
        }
        numberOf[c.base] = numberOf[c.base] ?? c.no;
        baseOf[c.no] = baseOf[c.no] ?? c.base;
    });
    CHARACTERS.forEach(c => (c.limitBreaks || []).forEach(lb => Object.keys(lb.materials).forEach(m => {
        if (!names.includes(m)) errors.push(`キャラ「${c.name}」の上限突破${lb.from}→${lb.to}にある「${m}」は素材に登録されていません`);
    })));
    CHARACTERS.forEach(c => {
        if (c.secretColor && !['赤', '青', '黄'].includes(c.secretColor)) {
            errors.push(`キャラ「${c.name}」の奥義色「${c.secretColor}」は 赤 / 青 / 黄 のどれかにしてください`);
        }
    });
    return errors;
}
