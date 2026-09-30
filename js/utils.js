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

// その品が落ちるステージがあるか
function isDropped(item) {
    return STAGES.some(st => st.drops.some(d => d.name === item));
}

// 「🔍」ボタン：ドロップ統計のステージ検索で、その素材が落ちるステージを表示する
function findStagesButton(material) {
    return isDropped(material)
        ? `<button class="secondary small" title="落ちるステージを探す" onclick="findStagesFor(${jsArg(material)})">🔍</button>`
        : '';
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

// ===== 奥義の効果・範囲 =====
// 奥義の説明文に書いてある言葉から、効果と範囲を見分ける（Excel に列を足さなくてよい）
// 新しい効果が出てきたら、ここに1行足す
const SKILL_EFFECTS = [
    { group: '攻撃', label: 'ダメージ', pattern: /ダメージを与える/ },
    { group: 'バフ', label: '攻撃力上昇', pattern: /攻撃力上昇/ },
    { group: 'バフ', label: 'クリティカル率上昇', pattern: /クリティカル率上昇/ },
    { group: 'バフ', label: 'ブレイク力上昇', pattern: /ブレイク力上昇/ },
    { group: 'バフ', label: 'ガード率上昇', pattern: /ガード率上昇/ },
    { group: 'バフ', label: '被ダメージ軽減', pattern: /被ダメージ軽減/ },
    { group: 'バフ', label: 'バリア', pattern: /バリア/ },
    { group: 'デバフ', label: '被ダメージ増加', pattern: /被ダメージ増加【/ },
    { group: '盤面', label: 'ボム生成', pattern: /ボムを.*生成/ },
    { group: '盤面', label: 'ト餓鬼の色を変える', pattern: /色に(変換|変化)/ },
    { group: '盤面', label: 'ト餓鬼を集める', pattern: /集める/ },
    { group: '盤面', label: 'ブレイクゲージ減少量アップ', pattern: /ブレイクゲージ減少量/ }
];
const SKILL_EFFECT_GROUPS = ['攻撃', 'バフ', 'デバフ', '盤面'];

// 範囲はゲームの奥義名の横のアイコンと同じ1つだけ（ト餓鬼を消去する奥義のみ）
// 上から順に調べる：「ランダムな【円型】」はランダム、「指定した【縦列】」は指定
const SKILL_RANGES = [
    { label: 'ランダム', pattern: /ランダム/ },
    { label: '指定', pattern: /指定/ },
    { label: 'すべて', pattern: /【すべて】/ },
    { label: '円型', pattern: /円型/ },
    { label: '縦列', pattern: /縦列/ },
    { label: '横列', pattern: /横列/ },
    { label: '扇型', pattern: /扇型/ }
];

function skillTextOf(char) {
    return Object.values(char.skills || {}).join('\n');
}

// 奥義の効果の一覧（SKILL_EFFECTS の並び順）
function skillEffectsOf(char) {
    const text = skillTextOf(char);
    return SKILL_EFFECTS.filter(e => e.pattern.test(text));
}

// 奥義の範囲（ランダム・指定・円型 など。消去しない奥義は ''）
function skillRangeOf(char) {
    const text = skillTextOf(char);
    if (!/消去/.test(text)) return '';
    const range = SKILL_RANGES.find(r => r.pattern.test(text));
    return range ? range.label : '';
}

// ゆかりは複数ある（["夜", "天下五剣"]）。古い形の文字列でも配列にして返す
function yukariOf(char) {
    if (Array.isArray(char.yukari)) return char.yukari;
    return char.yukari ? [char.yukari] : [];
}

const MAX_TRUST_LEVEL = 10;

// skillStage は限界突破段階（＝奥義Lv、1〜6）
function getProgress(name) {
    return { owned: false, level: 1, trustLevel: 0, levelCap: 10, skillStage: 1, ...data.characterProgress[name] };
}

// ===== 限界突破（奥義強化） =====
const MAX_SKILL_STAGE = 6;

// stage → stage+1 に必要な { shards, coins }（わからなければ null）
function skillUpgradeOf(name, stage) {
    const char = CHARACTERS.find(c => c.name === name);
    const table = (typeof SKILL_UPGRADES !== 'undefined' && char) ? SKILL_UPGRADES[char.rarity] || {} : {};
    return table[stage] || null;
}

// 今の段階から最大段階までに必要な強化片・小判の合計（unknown はわからない段階の数）
function skillUpgradeTotal(name, stage) {
    const total = { shards: 0, coins: 0, unknown: 0 };
    for (let s = stage; s < MAX_SKILL_STAGE; s++) {
        const up = skillUpgradeOf(name, s);
        if (!up || up.shards === undefined || up.coins === undefined) { total.unknown++; continue; }
        total.shards += up.shards;
        total.coins += up.coins;
    }
    return total;
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

// ===== 経験値 =====
// EXP_TABLE[N] は Lv N から N+1 に上がるのに必要な累計経験値（ゲーム画面の「/」の右の数・全キャラ共通）
function expThreshold(level) {
    if (level <= 1) return 0;   // Lv1 は経験値 0 から
    const value = (typeof EXP_TABLE !== 'undefined' ? EXP_TABLE : {})[level - 1];
    return value === undefined ? null : value;
}

// 今の経験値と、次のレベル・レベル上限までにあと何経験値いるか（わからないものは null）
// 経験値を入れていない（または今のレベルと合わない）ときは、今のレベルになったばかりとして数える
// progress を渡すと、保存していない入力中の値で計算する
function expStatus(name, progress = getProgress(name)) {
    const { level, levelCap, exp } = progress;
    const start = expThreshold(level), next = expThreshold(level + 1);
    const fits = typeof exp === 'number' && (start === null || exp >= start) && (next === null || exp < next);
    const current = fits ? exp : start;
    const left = target => (current === null || target === null || level >= levelCap) ? null : Math.max(0, target - current);
    return { current, entered: fits, toNext: left(next), toCap: left(expThreshold(levelCap)) };
}

// 経験値の書（素材シートの効果が「経験値+150」の品）。経験値の多い順
function expBooks() {
    return MATERIALS.filter(m => m.exp > 0).sort((a, b) => b.exp - a.exp);
}

// amount の経験値をためるのに使う経験値の書の数 { 書の名前: 冊数 }
// 多い書から使い、端数は一番少ない書で埋める（少ない書を何冊も使うより上の書1冊ですむなら上の書にする）
function booksFor(amount) {
    const books = expBooks();
    const counts = books.map(() => 0);
    let rest = amount;
    books.forEach((b, i) => {
        const last = i === books.length - 1;
        counts[i] = last ? Math.ceil(Math.max(0, rest) / b.exp) : Math.floor(rest / b.exp);
        rest -= counts[i] * b.exp;
    });
    for (let i = books.length - 1; i > 0; i--) {
        if (counts[i] * books[i].exp >= books[i - 1].exp) {
            counts[i - 1] += 1;
            counts[i] = 0;
        }
    }
    const result = {};
    books.forEach((b, i) => { if (counts[i] > 0) result[b.name] = counts[i]; });
    return result;
}

// 在庫にある経験値の書の経験値の合計
function ownedBookExp() {
    return expBooks().reduce((sum, b) => sum + getCount(b.name) * b.exp, 0);
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
