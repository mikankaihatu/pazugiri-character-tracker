// ===== キャラ一覧タブ =====
// キャラの一覧（刀剣男士・衣装・刀種・ゆかり・奥義など）は data/master.xlsx → js/master/characters.js で管理する。
// ここで編集するのは、所持・レベル・レベル上限・信頼度の育成状況だけ

const SECRET_COLORS = {
    '赤': { icon: '🔴', bg: '#ffebee' },
    '青': { icon: '🔵', bg: '#e3f2fd' },
    '黄': { icon: '🟡', bg: '#fffde7' }
};

// 一覧の見出しの並び順（ここにない分類は後ろに並ぶ）
const RARITY_ORDER = ['レア', '通常'];

let filters = {
    keyword: '',
    owned: '',
    costume: '',
    swordType: '',
    yukari: '',
    levelCap: '',
    trustLevel: '',
    secretColor: '',
    skillEffect: '',
    skillRange: ''
};

// 一覧の並び順（フィルターのリセットでは変えない）
let charSort = '';
const CHAR_SORTS = {
    '': { label: '標準（Excel の順）' },
    owned: { label: '所持を先に', compare: (a, b) => Number(b.p.owned) - Number(a.p.owned) },
    level: { label: 'レベルが高い順', compare: (a, b) => Number(b.p.owned) - Number(a.p.owned) || b.p.level - a.p.level },
    trust: { label: '信頼度が高い順', compare: (a, b) => Number(b.p.owned) - Number(a.p.owned) || b.p.trustLevel - a.p.trustLevel },
    no: { label: '刀剣男士番号順', compare: (a, b) => (Number(a.c.no) || 9999) - (Number(b.c.no) || 9999) }
};

function sortCharacters(list) {
    const sort = CHAR_SORTS[charSort];
    if (!sort || !sort.compare) return list;
    // 同じ順位のときは Excel の順のまま（安定ソート）
    return list.map(c => ({ c, p: getProgress(c.name) })).sort(sort.compare).map(x => x.c);
}

function selectCharSort(value) {
    charSort = value;
    renderCharacters();
}

function matchesFilter(char) {
    const p = getProgress(char.name);
    if (filters.keyword && !(char.base || char.name).includes(filters.keyword)) return false;
    if (filters.costume && char.costume !== filters.costume) return false;
    if (filters.owned === 'owned' && !p.owned) return false;
    if (filters.owned === 'notOwned' && p.owned) return false;
    if (filters.swordType && char.swordType !== filters.swordType) return false;
    if (filters.yukari && !yukariOf(char).includes(filters.yukari)) return false;
    if (filters.levelCap !== '' && p.levelCap !== parseInt(filters.levelCap)) return false;
    if (filters.trustLevel !== '' && p.trustLevel < parseInt(filters.trustLevel)) return false;
    if (filters.secretColor && char.secretColor !== filters.secretColor) return false;
    // 「group:バフ」はバフのどれか、「バフ:攻撃力上昇」はその効果だけ
    if (filters.skillEffect) {
        const effects = skillEffectsOf(char);
        const [kind, value] = filters.skillEffect.split(':');
        if (kind === 'group' ? !effects.some(e => e.group === value) : !effects.some(e => e.label === value)) return false;
    }
    if (filters.skillRange && skillRangeOf(char) !== filters.skillRange) return false;
    return true;
}

function applyFilters() {
    filters.keyword = document.getElementById('filter-keyword').value.trim();
    filters.costume = document.getElementById('filter-costume').value;
    filters.owned = document.getElementById('filter-owned').value;
    filters.swordType = document.getElementById('filter-swordType').value;
    filters.yukari = document.getElementById('filter-yukari').value;
    filters.levelCap = document.getElementById('filter-levelCap').value;
    filters.trustLevel = document.getElementById('filter-trustLevel').value;
    filters.secretColor = document.getElementById('filter-secretColor').value;
    filters.skillEffect = document.getElementById('filter-skillEffect').value;
    filters.skillRange = document.getElementById('filter-skillRange').value;
    renderCharacters();
}

function clearFilters() {
    filters = { keyword: '', owned: '', costume: '', swordType: '', yukari: '', levelCap: '', trustLevel: '', secretColor: '', skillEffect: '', skillRange: '' };
    renderCharacters();
}

function toggleOwned(name, checked) {
    setProgress(name, { owned: checked });
    renderCharacters();
}

function closeCharEditDialog() {
    document.getElementById('charEditModal')?.remove();
}

function showCharEditDialog(name) {
    const char = allCharacters().find(c => c.name === name);
    if (!char) return;
    const p = getProgress(name);

    const modal = document.createElement('div');
    modal.id = 'charEditModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 16px;';
    modal.innerHTML = `<div style="background: white; border-radius: 8px; padding: 24px; width: 100%; max-width: 400px; max-height: 80vh; overflow-y: auto;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #333;">${escapeHtml(charLabel(name))}</div>
        ${renderCharInfo(char)}
        ${renderInfoRequest(char)}
        <div class="sub-title" style="margin-top: 16px;">育成状況</div>
        <div style="margin-bottom: 12px;">
            <label><input type="checkbox" id="edit-owned" ${p.owned ? 'checked' : ''} style="margin-right: 8px;">所持している</label>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">レベル / レベル上限</label>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 14px;">Lv</span>
                <input type="number" id="edit-level" value="${p.level}" min="1" max="${p.levelCap}" style="width: 80px;" oninput="updateExpStatus(${jsArg(name)})">
                <span style="font-size: 14px;">/</span>
                <select id="edit-levelCap" style="flex: 1;" onchange="document.getElementById('edit-level').max = this.value; updateExpStatus(${jsArg(name)})">
                    ${levelCapOptions().map(n => `<option value="${n}" ${p.levelCap === n ? 'selected' : ''}>Lv${n}</option>`).join('')}
                </select>
            </div>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">経験値（レベルアップ画面の「/」の左の数・なくても大丈夫です）</label>
            <input type="number" id="edit-exp" value="${typeof p.exp === 'number' ? p.exp : ''}" min="0" placeholder="例：27958" style="width: 100%;" oninput="updateExpStatus(${jsArg(name)})">
            <div id="edit-exp-status">${renderExpStatus(name)}</div>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">信頼度</label>
            <input type="number" id="edit-trustLevel" value="${p.trustLevel}" min="0" max="${MAX_TRUST_LEVEL}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">限界突破段階（＝奥義Lv） / 強化片の所持数</label>
            <div style="display: flex; gap: 8px; align-items: center;">
                <select id="edit-skillStage" style="flex: 1;" onchange="updateSkillUpgradeStatus(${jsArg(name)})">
                    ${[...Array(MAX_SKILL_STAGE)].map((_, i) => `<option value="${i + 1}" ${p.skillStage === i + 1 ? 'selected' : ''}>${i + 1} / ${MAX_SKILL_STAGE}</option>`).join('')}
                </select>
                <span style="font-size: 12px; color: #666;">強化片</span>
                <input type="number" id="edit-shards" value="${p.shards}" min="0" style="width: 80px;" oninput="updateSkillUpgradeStatus(${jsArg(name)})">
            </div>
            <div id="edit-skill-status">${renderSkillUpgradeStatus(name, p.skillStage, p.shards)}</div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="secondary" onclick="closeCharEditDialog()">キャンセル</button>
            <button onclick="saveCharProgress(${jsArg(name)})">保存</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
}

// 編集画面で入力中のレベル・レベル上限・経験値（保存前）
function editingProgress(name) {
    const levelCap = parseInt(document.getElementById('edit-levelCap').value) || 10;
    const expText = document.getElementById('edit-exp').value;
    return {
        ...getProgress(name),
        levelCap,
        level: Math.min(levelCap, Math.max(1, parseInt(document.getElementById('edit-level').value) || 1)),
        exp: expText === '' ? undefined : toCount(expText)
    };
}

// 入力するたびに「あと○○経験値」を計算し直す
function updateExpStatus(name) {
    document.getElementById('edit-exp-status').innerHTML = renderExpStatus(name, editingProgress(name));
}

// 次の限界突破に必要な強化片・小判と、最大段階までの合計
function renderSkillUpgradeStatus(name, stage, shards) {
    if (stage >= MAX_SKILL_STAGE) return '<div class="hint" style="margin: 6px 0 0;">限界突破は最大です</div>';
    const next = skillUpgradeOf(name, stage);
    const lines = [];
    if (next) {
        const parts = [];
        if (next.shards !== undefined) {
            parts.push(`強化片 <span class="stat-value">${next.shards}</span> <span class="${shards >= next.shards ? 'enough' : 'shortage'}">（所持${shards}${shards >= next.shards ? '' : `・あと${next.shards - shards}`}）</span>`);
        }
        if (next.coins !== undefined) parts.push(`小判 <span class="stat-value">${next.coins.toLocaleString()}</span>`);
        lines.push(`${stage}→${stage + 1}：${parts.join('・')}`);
    } else {
        lines.push(`${stage}→${stage + 1}：必要な強化片・小判はまだわかりません`);
    }
    const total = skillUpgradeTotal(name, stage);
    if (stage + 1 < MAX_SKILL_STAGE && total.unknown < MAX_SKILL_STAGE - stage) {
        lines.push(`${MAX_SKILL_STAGE}まで：強化片 ${total.shards}・小判 ${total.coins.toLocaleString()}${total.unknown > 0 ? `（わからない段階が${total.unknown}つあります）` : ''}`);
    }
    return `<div class="hint" style="margin: 6px 0 0;">${lines.join('<br>')}</div>`;
}

function updateSkillUpgradeStatus(name) {
    const stage = parseInt(document.getElementById('edit-skillStage').value) || 1;
    const shards = toCount(document.getElementById('edit-shards').value);
    document.getElementById('edit-skill-status').innerHTML = renderSkillUpgradeStatus(name, stage, shards);
}

// 次のレベル・レベル上限まであと何経験値か
function renderExpStatus(name, progress = getProgress(name)) {
    const { levelCap } = progress;
    const { entered, toNext, toCap } = expStatus(name, progress);
    const lines = [];
    if (toNext !== null) lines.push(`次のレベルまで あと <span class="stat-value">${toNext.toLocaleString()}</span>`);
    if (toCap !== null) lines.push(`Lv${levelCap}まで あと <span class="stat-value">${toCap.toLocaleString()}</span>`);
    if (lines.length === 0) return '';
    const extra = [];
    if (toCap !== null && toCap > 0 && expBooks().length > 0) {
        const books = Object.entries(booksFor(toCap)).map(([b, n]) => `${escapeHtml(b.replace(/^経験値の書・/, ''))}×${n}`).join('・');
        const owned = ownedBookExp();
        extra.push(`<br>Lv${levelCap}までの経験値の書：${books}`);
        extra.push(`<br>所持している経験値の書：経験値 ${owned.toLocaleString()} 分 ${owned >= toCap
            ? '<span class="enough">（足りています）</span>'
            : `<span class="shortage">（あと ${(toCap - owned).toLocaleString()} 足りません）</span>`}`);
    }
    return `<div class="hint" style="margin: 6px 0 0;">${lines.join('　')}${extra.join('')}${entered ? '' : '<br>（経験値を入れていないので、今のレベルになったばかりとして計算しています）'}</div>`;
}

// 足りていない情報があれば、情報提供フォームへのリンクを出す
function renderInfoRequest(char) {
    const missing = missingInfoOf(char);
    if (missing.length === 0) return '';
    return `<div class="hint" style="margin: 8px 0 0;">まだ情報がない項目：${escapeHtml(missing.join('・'))}
        <a href="${INFO_FORM_URL}" target="_blank" rel="noopener" style="margin-left: 4px;">📝 情報を提供する</a></div>`;
}

// 奥義の効果・範囲のタグ（説明文から見分けたもの）
const SKILL_GROUP_COLORS = { '攻撃': '#ffebee', 'バフ': '#e3f2fd', 'デバフ': '#f3e5f5', '盤面': '#fff8e1' };
function renderSkillTags(char) {
    const tags = [
        ...skillEffectsOf(char).map(e => `<span class="skill-tag" style="background: ${SKILL_GROUP_COLORS[e.group]};">${escapeHtml(e.group === '攻撃' ? e.label : `${e.group}：${e.label}`)}</span>`),
        ...(skillRangeOf(char) ? [`<span class="skill-tag">範囲：${escapeHtml(skillRangeOf(char))}</span>`] : [])
    ];
    return tags.length > 0 ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">${tags.join('')}</div>` : '';
}

// 固定データ（刀種・ゆかり・奥義・レベルごとの能力）
// skills は { 奥義レベル: 説明 }、levels は { レベル: [体力, 攻撃] }（書いてあるレベルだけ）
function renderCharInfo(char) {
    const color = SECRET_COLORS[char.secretColor];
    const row = (label, value) => `<div class="stat-row"><span>${label}</span><span class="stat-value">${value || '―'}</span></div>`;
    const byLevel = obj => Object.entries(obj || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
    const skills = byLevel(char.skills);
    const levels = byLevel(char.levels);
    return `<div style="background: #f9f9f9; border-radius: 6px; padding: 12px;">
        ${row('刀種', escapeHtml(char.swordType || ''))}
        ${row('ゆかり', escapeHtml(yukariOf(char).join('・')))}
        ${row('奥義色', color ? `${color.icon} ${escapeHtml(char.secretColor)}` : '')}
        ${row('奥義数値', escapeHtml(char.skillValue ?? ''))}
        ${skills.length > 0 || char.skillName ? `<div class="sub-title" style="margin-top: 12px;">奥義${char.skillName ? `：${escapeHtml(char.skillName)}` : ''}</div>
            ${renderSkillTags(char)}
            ${skills.map(([lv, text]) => `<div style="font-size: 12px; color: #666; margin-bottom: 6px; white-space: pre-line;${Number(lv) === getProgress(char.name).skillStage ? ' background: #fff8e1;' : ''}"><span class="stat-value">Lv${lv}</span>　${escapeHtml(text)}</div>`).join('')}` : ''}
        ${(char.limitBreaks || []).length > 0 ? `<div class="sub-title" style="margin-top: 12px;">上限突破の必要素材</div>
            ${char.limitBreaks.map(lb => `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                <span class="stat-value">Lv${lb.from}→${lb.to}</span>　${Object.entries(lb.materials).map(([m, n]) =>
                    `${escapeHtml(m)}×${n}<span class="${getCount(m) >= n ? 'enough' : 'shortage'}">（所持${getCount(m)}）</span>`).join('、')}
            </div>`).join('')}` : ''}
        ${levels.length > 0 ? `<div class="sub-title" style="margin-top: 12px;">能力</div>
            <table class="stat-table">
                <tr><th>Lv</th><th>体力</th><th>攻撃</th></tr>
                ${levels.map(([lv, [hp, atk]]) => `<tr${Number(lv) === getProgress(char.name).level ? ' style="background: #fff8e1; font-weight: 600;"' : ''}><td>${lv}</td><td>${hp}</td><td>${atk}</td></tr>`).join('')}
            </table>` : ''}
    </div>`;
}

function saveCharProgress(name) {
    // レベルは 1 〜 レベル上限の間、経験値は空なら記録しない（editingProgress で整える）
    const { level, levelCap, exp } = editingProgress(name);
    setProgress(name, {
        owned: document.getElementById('edit-owned').checked,
        trustLevel: Math.min(MAX_TRUST_LEVEL, toCount(document.getElementById('edit-trustLevel').value)),
        skillStage: Math.min(MAX_SKILL_STAGE, Math.max(1, parseInt(document.getElementById('edit-skillStage').value) || 1)),
        shards: toCount(document.getElementById('edit-shards').value),
        levelCap,
        level,
        exp
    });
    closeCharEditDialog();
    renderCharacters();
}

function renderCharFilters() {
    const costumes = [...new Set(allCharacters().map(c => c.costume).filter(Boolean))];
    const swordTypes = [...new Set(allCharacters().map(c => c.swordType).filter(Boolean))];
    const yukaris = [...new Set(allCharacters().flatMap(yukariOf))];
    // 奥義の効果・範囲は、いるキャラの分だけ選べるようにする
    const usedEffects = new Set(allCharacters().flatMap(c => skillEffectsOf(c).map(e => e.label)));
    const usedRanges = new Set(allCharacters().map(skillRangeOf));
    const option = (value, label, current) => `<option value="${escapeHtml(value)}" ${String(current) === String(value) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    return `<div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #333;">フィルター</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 8px;">
            <div>
                <label class="filter-label">名前</label>
                <input type="text" id="filter-keyword" placeholder="名前で検索" value="${escapeHtml(filters.keyword)}" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
            </div>
            <div>
                <label class="filter-label">衣装</label>
                <select id="filter-costume" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.costume)}${costumes.map(c => option(c, c, filters.costume)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">所持</label>
                <select id="filter-owned" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.owned)}${option('owned', '所持のみ', filters.owned)}${option('notOwned', '未所持のみ', filters.owned)}
                </select>
            </div>
            <div>
                <label class="filter-label">刀種</label>
                <select id="filter-swordType" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.swordType)}${swordTypes.map(t => option(t, t, filters.swordType)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">ゆかり</label>
                <select id="filter-yukari" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.yukari)}${yukaris.map(y => option(y, y, filters.yukari)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">レベル上限</label>
                <select id="filter-levelCap" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.levelCap)}${levelCapOptions().map(n => option(n, `Lv${n}`, filters.levelCap)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">奥義色</label>
                <select id="filter-secretColor" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.secretColor)}${Object.entries(SECRET_COLORS).map(([k, c]) => option(k, `${c.icon} ${k}`, filters.secretColor)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">奥義の効果</label>
                <select id="filter-skillEffect" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.skillEffect)}
                    ${SKILL_EFFECT_GROUPS.map(g => {
                        const effects = SKILL_EFFECTS.filter(e => e.group === g && usedEffects.has(e.label));
                        if (effects.length === 0) return '';
                        return `<optgroup label="${escapeHtml(g)}">
                            ${effects.length > 1 ? option(`group:${g}`, `${g}（どれか）`, filters.skillEffect) : ''}
                            ${effects.map(e => option(`${g}:${e.label}`, e.label, filters.skillEffect)).join('')}
                        </optgroup>`;
                    }).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">奥義の範囲</label>
                <select id="filter-skillRange" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    ${option('', 'すべて', filters.skillRange)}${SKILL_RANGES.filter(r => usedRanges.has(r.label)).map(r => option(r.label, r.label, filters.skillRange)).join('')}
                </select>
            </div>
            <div>
                <label class="filter-label">信頼度（以上）</label>
                <input type="number" id="filter-trustLevel" min="0" max="${MAX_TRUST_LEVEL}" placeholder="0-${MAX_TRUST_LEVEL}" value="${escapeHtml(filters.trustLevel)}" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
            </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="secondary small" onclick="clearFilters()">リセット</button>
            <label class="filter-label" style="margin: 0 0 0 auto;">並び順</label>
            <select style="font-size: 12px;" onchange="selectCharSort(this.value)">
                ${Object.entries(CHAR_SORTS).map(([k, v]) => option(k, v.label, charSort)).join('')}
            </select>
        </div>
    </div>`;
}

function renderCharCard(char) {
    const p = getProgress(char.name);
    const color = SECRET_COLORS[char.secretColor];
    const badge = (bg, text) => `<span style="background: ${bg}; padding: 1px 4px; border-radius: 2px;">${text}</span>`;
    return `<div class="card" style="${p.owned ? '' : 'opacity: 0.5;'}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
            <div style="flex: 1;">
                <div class="card-title" style="margin-bottom: 8px;">${escapeHtml(char.base || char.name)}</div>
                <div style="font-size: 11px; color: #666; display: flex; gap: 4px; flex-wrap: wrap;">
                    ${char.costume ? badge('#ede7f6', `👘 ${escapeHtml(char.costume)}`) : ''}
                    ${char.swordType ? badge('#e3f2fd', `⚔️ ${escapeHtml(char.swordType)}`) : ''}
                    ${yukariOf(char).map(y => badge('#e8f5e9', `🔗 ${escapeHtml(y)}`)).join('')}
                    ${color ? badge(color.bg, color.icon) : ''}
                    ${p.owned ? badge(p.level >= p.levelCap ? '#c8e6c9' : '#e0f2f1', `📈 Lv${p.level}/${p.levelCap}`) : ''}
                    ${p.trustLevel > 0 ? badge('#f0f4c3', `💖 ${p.trustLevel}`) : ''}
                    ${p.owned ? badge('#fce4ec', `✨ 限界突破${p.skillStage}/${MAX_SKILL_STAGE}`) : ''}
                </div>
            </div>
            <label style="font-size: 12px; white-space: nowrap;"><input type="checkbox" ${p.owned ? 'checked' : ''} onchange="toggleOwned(${jsArg(char.name)}, this.checked)"> 所持</label>
        </div>
        <button style="padding: 4px 8px; font-size: 11px; width: 100%; background: #f5f5f5; color: #333; border: 1px solid #ddd;" onclick="showCharEditDialog(${jsArg(char.name)})">編集</button>
    </div>`;
}

function renderCharacters() {
    const chars = allCharacters();
    let html = renderCharFilters();

    if (chars.length === 0) {
        html += '<div class="empty">js/master/characters.js にキャラを登録すると、ここに表示されます</div>';
    }

    const ownedCount = chars.filter(c => getProgress(c.name).owned).length;
    if (chars.length > 0) {
        html += `<div class="hint">所持 ${ownedCount} / ${chars.length}</div>`;
    }

    const rarities = [...new Set(chars.map(c => c.rarity || 'その他'))].sort((a, b) => {
        const ia = RARITY_ORDER.indexOf(a), ib = RARITY_ORDER.indexOf(b);
        return (ia < 0 ? RARITY_ORDER.length : ia) - (ib < 0 ? RARITY_ORDER.length : ib);
    });
    rarities.forEach((rarity, i) => {
        // 並び順は Excel（js/master/characters.js）の行の順。「並び順」を選んでいれば並べ替える
        const list = sortCharacters(chars.filter(c => (c.rarity || 'その他') === rarity && matchesFilter(c)));
        html += `<div class="rarity-section"><div class="rarity-title ${i > 0 ? 'unrevealed' : ''}">${escapeHtml(rarity)}</div>`;
        if (list.length === 0) {
            html += '<div class="empty">条件に合うキャラがありません</div>';
        } else {
            html += `<div class="grid">${list.map(renderCharCard).join('')}</div>`;
        }
        html += '</div>';
    });

    document.getElementById('characters').innerHTML = html;
}
