// ===== キャラ一覧タブ =====
// キャラの一覧（刀剣男士・衣装・刀種・ゆかり・奥義など）は data/master.xlsx → js/master/characters.js で管理する。
// ここで編集するのは、所持・強化待ち・レベル上限・信頼度の育成状況だけ

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
    needsUpgrade: false,
    levelCap: '',
    trustLevel: '',
    secretColor: ''
};

function matchesFilter(char) {
    const p = getProgress(char.name);
    if (filters.keyword && !(char.base || char.name).includes(filters.keyword)) return false;
    if (filters.costume && char.costume !== filters.costume) return false;
    if (filters.owned === 'owned' && !p.owned) return false;
    if (filters.owned === 'notOwned' && p.owned) return false;
    if (filters.swordType && char.swordType !== filters.swordType) return false;
    if (filters.yukari && !yukariOf(char).includes(filters.yukari)) return false;
    if (filters.needsUpgrade && !p.needsUpgrade) return false;
    if (filters.levelCap !== '' && p.levelCap !== parseInt(filters.levelCap)) return false;
    if (filters.trustLevel !== '' && p.trustLevel < parseInt(filters.trustLevel)) return false;
    if (filters.secretColor && char.secretColor !== filters.secretColor) return false;
    return true;
}

function applyFilters() {
    filters.keyword = document.getElementById('filter-keyword').value.trim();
    filters.costume = document.getElementById('filter-costume').value;
    filters.owned = document.getElementById('filter-owned').value;
    filters.swordType = document.getElementById('filter-swordType').value;
    filters.yukari = document.getElementById('filter-yukari').value;
    filters.needsUpgrade = document.getElementById('filter-needsUpgrade').checked;
    filters.levelCap = document.getElementById('filter-levelCap').value;
    filters.trustLevel = document.getElementById('filter-trustLevel').value;
    filters.secretColor = document.getElementById('filter-secretColor').value;
    renderCharacters();
}

function clearFilters() {
    filters = { keyword: '', owned: '', costume: '', swordType: '', yukari: '', needsUpgrade: false, levelCap: '', trustLevel: '', secretColor: '' };
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
        <div class="sub-title" style="margin-top: 16px;">育成状況</div>
        <div style="margin-bottom: 12px;">
            <label><input type="checkbox" id="edit-owned" ${p.owned ? 'checked' : ''} style="margin-right: 8px;">所持している</label>
        </div>
        <div style="margin-bottom: 12px;">
            <label><input type="checkbox" id="edit-needsUpgrade" ${p.needsUpgrade ? 'checked' : ''} style="margin-right: 8px;">強化待ち</label>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">レベル上限</label>
            <select id="edit-levelCap" style="width: 100%;">
                ${levelCapOptions().map(n => `<option value="${n}" ${p.levelCap === n ? 'selected' : ''}>Lv${n}</option>`).join('')}
            </select>
        </div>
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">信頼度</label>
            <input type="number" id="edit-trustLevel" value="${p.trustLevel}" min="0" max="${MAX_TRUST_LEVEL}" style="width: 100%;">
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="secondary" onclick="closeCharEditDialog()">キャンセル</button>
            <button onclick="saveCharProgress(${jsArg(name)})">保存</button>
        </div>
    </div>`;
    document.body.appendChild(modal);
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
            ${skills.map(([lv, text]) => `<div style="font-size: 12px; color: #666; margin-bottom: 6px; white-space: pre-line;"><span class="stat-value">Lv${lv}</span>　${escapeHtml(text)}</div>`).join('')}` : ''}
        ${(char.limitBreaks || []).length > 0 ? `<div class="sub-title" style="margin-top: 12px;">上限突破の必要素材</div>
            ${char.limitBreaks.map(lb => `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">
                <span class="stat-value">Lv${lb.from}→${lb.to}</span>　${Object.entries(lb.materials).map(([m, n]) =>
                    `${escapeHtml(m)}×${n}<span class="${getCount(m) >= n ? 'enough' : 'shortage'}">（所持${getCount(m)}）</span>`).join('、')}
            </div>`).join('')}` : ''}
        ${levels.length > 0 ? `<div class="sub-title" style="margin-top: 12px;">能力</div>
            <table class="stat-table">
                <tr><th>Lv</th><th>体力</th><th>攻撃</th></tr>
                ${levels.map(([lv, [hp, atk]]) => `<tr><td>${lv}</td><td>${hp}</td><td>${atk}</td></tr>`).join('')}
            </table>` : ''}
    </div>`;
}

function saveCharProgress(name) {
    setProgress(name, {
        owned: document.getElementById('edit-owned').checked,
        needsUpgrade: document.getElementById('edit-needsUpgrade').checked,
        trustLevel: Math.min(MAX_TRUST_LEVEL, toCount(document.getElementById('edit-trustLevel').value)),
        levelCap: parseInt(document.getElementById('edit-levelCap').value) || 10
    });
    closeCharEditDialog();
    renderCharacters();
}

function renderCharFilters() {
    const costumes = [...new Set(allCharacters().map(c => c.costume).filter(Boolean))];
    const swordTypes = [...new Set(allCharacters().map(c => c.swordType).filter(Boolean))];
    const yukaris = [...new Set(allCharacters().flatMap(yukariOf))];
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
                <label class="filter-label">信頼度（以上）</label>
                <input type="number" id="filter-trustLevel" min="0" max="${MAX_TRUST_LEVEL}" placeholder="0-${MAX_TRUST_LEVEL}" value="${escapeHtml(filters.trustLevel)}" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
            </div>
            <div style="display: flex; align-items: flex-end;">
                <label style="font-size: 12px;"><input type="checkbox" id="filter-needsUpgrade" ${filters.needsUpgrade ? 'checked' : ''} onchange="applyFilters()" style="margin-right: 4px;">強化待ち</label>
            </div>
        </div>
        <button class="secondary small" onclick="clearFilters()">リセット</button>
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
                    ${p.needsUpgrade ? badge('#fff3e0', '🔧 強化待ち') : ''}
                    ${p.levelCap > 10 ? badge('#e0f2f1', `🔓 Lv上限${p.levelCap}`) : ''}
                    ${p.trustLevel > 0 ? badge('#f0f4c3', `💖 ${p.trustLevel}`) : ''}
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
        // 並び順は Excel（js/master/characters.js）の行の順
        const list = chars.filter(c => (c.rarity || 'その他') === rarity && matchesFilter(c));
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
