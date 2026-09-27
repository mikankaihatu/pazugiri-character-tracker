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

function effectOf(material) {
    const master = MATERIALS.find(m => m.name === material);
    return (master && master.effect) || '';
}

function getCount(material) {
    return data.inventory[material] || 0;
}

// ===== 不具合の報告 =====
const REPORT_FORM_URL = 'https://forms.gle/P9XydgGZhJAK1Bfn6';
// キャラ・素材・ステージなど、足りていない情報を送ってもらうフォーム
const INFO_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd20NaHxD78ToytsjdwiVBgYvdicYdNh_uqdTjLhYnRM8zObQ/viewform';

// キャラの固定データで、まだ埋まっていない項目の名前
function missingInfoOf(char) {
    const missing = [];
    if (!char.swordType) missing.push('刀種');
    if (yukariOf(char).length === 0) missing.push('ゆかり');
    if (!char.secretColor) missing.push('奥義色');
    if (!char.skillName) missing.push('奥義名');
    if (Object.keys(char.skills || {}).length === 0) missing.push('奥義の説明');
    if (Object.keys(char.levels || {}).length === 0) missing.push('能力');
    if ((char.limitBreaks || []).length === 0) missing.push('上限突破の必要素材');
    return missing;
}

// 報告フォームに貼ってもらう使用環境（個人の育成データは含めない）
function environmentInfo() {
    const owned = Object.values(data.characterProgress).filter(p => p.owned).length;
    return [
        `日時: ${new Date().toLocaleString('ja-JP')}`,
        `ブラウザ: ${navigator.userAgent}`,
        `画面: ${window.innerWidth}×${window.innerHeight}`,
        `URL: ${location.href}`,
        `固定データ: キャラ${CHARACTERS.length} / 素材${MATERIALS.length} / ステージ${STAGES.length}`,
        `保存データ: 所持${owned} / 周回記録${data.runs.length} / 育成中${Object.keys(data.characterLevelUps).length}`
    ].join('\n');
}

// ===== 育成に必要な素材の計算（素材トラッキングと在庫管理で共通） =====
// 素材トラッキングに登録した全キャラの必要素材を合計する
function trackedNeeds() {
    const total = {};
    CHARACTERS.forEach(c => {
        for (const [m, n] of Object.entries(data.characterLevelUps[c.name] || {})) total[m] = (total[m] || 0) + n;
    });
    return total;
}

// 必要な素材を在庫から割り当て、足りない合成素材はレシピをたどって材料まで展開する（何段階でも）
// 返り値：{ 素材名: { need: 必要数（合成の材料分を含む）, crafting: うち合成の材料分,
//                     toCraft: 合成して作る数, short: 集める必要がある数 } }
function requirementPlan(needs) {
    const left = { ...data.inventory };
    const plan = {};
    const row = m => plan[m] || (plan[m] = { need: 0, crafting: 0, toCraft: 0, short: 0 });
    const require = (m, qty, forCrafting, depth) => {
        const r = row(m);
        r.need += qty;
        if (forCrafting) r.crafting += qty;
        const use = Math.min(left[m] || 0, qty);
        left[m] = (left[m] || 0) - use;
        const rest = qty - use;
        if (rest <= 0) return;
        const recipe = recipeOf(m);
        if (recipe && depth < 10) {
            r.toCraft += rest;
            for (const [src, per] of Object.entries(recipe)) require(src, per * rest, true, depth + 1);
        } else {
            r.short += rest;
        }
    };
    for (const [m, n] of Object.entries(needs)) require(m, n, false, 0);
    return plan;
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
    return { owned: false, level: 1, trustLevel: 0, levelCap: 10, ...data.characterProgress[name] };
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

// 今のレベルからレベル上限までに必要な経験値の合計（途中のレベルの経験値が1つでも不明なら null）
function expToLevelCap(name) {
    const char = CHARACTERS.find(c => c.name === name);
    const { level, levelCap } = getProgress(name);
    if (!char || level >= levelCap) return null;
    let total = 0;
    for (let lv = level; lv < levelCap; lv++) {
        const stat = (char.levels || {})[lv];
        if (!stat || stat[2] === undefined) return null;
        total += stat[2];
    }
    return total;
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
