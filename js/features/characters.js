// ===== キャラ一覧タブ =====

let filters = {
    swordType: '',
    needsUpgrade: false,
    breakthrough: '',
    trustLevel: '',
    secretColor: ''
};

function addCharacter(rarity, name) {
    if (!name.trim()) return;
    const char = {
        id: Date.now(),
        name: name.trim(),
        swordType: '',
        needsUpgrade: false,
        breakthrough: 0,
        trustLevel: 0,
        secretColor: ''
    };

    if (rarity === 'rare') {
        data.characters.rare.push(char);
    } else {
        data.characters.unrevealed.push(char);
    }
    saveData();
    renderCharacters();
}

function deleteCharacter(rarity, id) {
    if (rarity === 'rare') {
        data.characters.rare = data.characters.rare.filter(c => c.id !== id);
    } else {
        data.characters.unrevealed = data.characters.unrevealed.filter(c => c.id !== id);
    }
    delete data.characterLevelUps[id];
    saveData();
    renderCharacters();
}

function matchesFilter(char) {
    if (filters.swordType && !char.swordType?.includes(filters.swordType)) return false;
    if (filters.needsUpgrade && !char.needsUpgrade) return false;
    if (filters.breakthrough && parseInt(char.breakthrough) !== parseInt(filters.breakthrough)) return false;
    if (filters.trustLevel && parseInt(char.trustLevel) < parseInt(filters.trustLevel)) return false;
    if (filters.secretColor && char.secretColor !== filters.secretColor) return false;
    return true;
}

function applyFilters() {
    filters.swordType = document.getElementById('filter-swordType')?.value || '';
    filters.needsUpgrade = document.getElementById('filter-needsUpgrade')?.checked || false;
    filters.breakthrough = document.getElementById('filter-breakthrough')?.value || '';
    filters.trustLevel = document.getElementById('filter-trustLevel')?.value || '';
    filters.secretColor = document.getElementById('filter-secretColor')?.value || '';
    renderCharacters();
}

function clearFilters() {
    filters = { swordType: '', needsUpgrade: false, breakthrough: '', trustLevel: '', secretColor: '' };
    if (document.getElementById('filter-swordType')) document.getElementById('filter-swordType').value = '';
    if (document.getElementById('filter-needsUpgrade')) document.getElementById('filter-needsUpgrade').checked = false;
    if (document.getElementById('filter-breakthrough')) document.getElementById('filter-breakthrough').value = '';
    if (document.getElementById('filter-trustLevel')) document.getElementById('filter-trustLevel').value = '';
    if (document.getElementById('filter-secretColor')) document.getElementById('filter-secretColor').value = '';
    renderCharacters();
}

function showCharEditDialog(charId) {
    const charList = [...data.characters.rare, ...data.characters.unrevealed];
    const char = charList.find(c => c.id === charId);
    if (!char) return;

    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: white; border-radius: 8px; padding: 24px; max-width: 500px; max-height: 80vh; overflow-y: auto;';

    dialog.innerHTML = `
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #333;">${char.name} - 属性編集</div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">刀種類</label>
            <input type="text" id="edit-swordType" value="${char.swordType || ''}" placeholder="打刀など" style="width: 100%;">
        </div>
        <div style="margin-bottom: 12px;">
            <label><input type="checkbox" id="edit-needsUpgrade" ${char.needsUpgrade ? 'checked' : ''} style="margin-right: 8px;">強化待ち</label>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">限界突破</label>
            <select id="edit-breakthrough" style="width: 100%;">
                <option value="0" ${char.breakthrough === 0 ? 'selected' : ''}>なし</option>
                <option value="1" ${char.breakthrough === 1 ? 'selected' : ''}>限界突破1</option>
                <option value="2" ${char.breakthrough === 2 ? 'selected' : ''}>限界突破2</option>
                <option value="3" ${char.breakthrough === 3 ? 'selected' : ''}>限界突破3</option>
                <option value="4" ${char.breakthrough === 4 ? 'selected' : ''}>限界突破4</option>
                <option value="5" ${char.breakthrough === 5 ? 'selected' : ''}>限界突破5</option>
                <option value="6" ${char.breakthrough === 6 ? 'selected' : ''}>限界突破6</option>
            </select>
        </div>
        <div style="margin-bottom: 12px;">
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: #666;">信頼度</label>
            <input type="number" id="edit-trustLevel" value="${char.trustLevel || 0}" min="0" max="100" style="width: 100%;">
        </div>
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 12px; margin-bottom: 8px; color: #666;">奥義色</label>
            <div style="display: flex; gap: 8px;">
                <label style="flex: 1; padding: 8px; border: 2px solid ${char.secretColor === 'red' ? '#d32f2f' : '#ddd'}; border-radius: 4px; text-align: center; cursor: pointer;">
                    <input type="radio" name="secretColor" value="red" ${char.secretColor === 'red' ? 'checked' : ''} style="margin-right: 4px;">🔴
                </label>
                <label style="flex: 1; padding: 8px; border: 2px solid ${char.secretColor === 'blue' ? '#1976d2' : '#ddd'}; border-radius: 4px; text-align: center; cursor: pointer;">
                    <input type="radio" name="secretColor" value="blue" ${char.secretColor === 'blue' ? 'checked' : ''} style="margin-right: 4px;">🔵
                </label>
                <label style="flex: 1; padding: 8px; border: 2px solid ${char.secretColor === 'yellow' ? '#f9a825' : '#ddd'}; border-radius: 4px; text-align: center; cursor: pointer;">
                    <input type="radio" name="secretColor" value="yellow" ${char.secretColor === 'yellow' ? 'checked' : ''} style="margin-right: 4px;">🟡
                </label>
                <label style="flex: 1; padding: 8px; border: 2px solid ${!char.secretColor ? '#ddd' : '#ddd'}; border-radius: 4px; text-align: center; cursor: pointer;">
                    <input type="radio" name="secretColor" value="" ${!char.secretColor ? 'checked' : ''} style="margin-right: 4px;">なし
                </label>
            </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="secondary" onclick="this.parentElement.parentElement.parentElement.remove()">キャンセル</button>
            <button onclick="saveCharAttributes(${charId}); this.parentElement.parentElement.parentElement.remove()">保存</button>
        </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);
}

function saveCharAttributes(charId) {
    const charList = [...data.characters.rare, ...data.characters.unrevealed];
    const char = charList.find(c => c.id === charId);
    if (!char) return;

    char.swordType = document.getElementById('edit-swordType').value;
    char.needsUpgrade = document.getElementById('edit-needsUpgrade').checked;
    char.breakthrough = parseInt(document.getElementById('edit-breakthrough').value) || 0;
    char.trustLevel = parseInt(document.getElementById('edit-trustLevel').value) || 0;
    char.secretColor = document.querySelector('input[name="secretColor"]:checked').value;

    saveData();
    renderCharacters();
}

function renderCharacters() {
    let html = `<div style="background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #333;">キャラを追加</div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <select id="newCharRarity" style="width: 100px;">
                <option value="rare">レア</option>
                <option value="unrevealed">その他</option>
            </select>
            <input type="text" id="newCharName" placeholder="キャラ名を入力" style="flex: 1;">
            <button onclick="addCharacterFromInput()">追加</button>
        </div>
    </div>

    <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #333;">フィルター</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 8px;">
            <div>
                <label style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">刀種類</label>
                <input type="text" id="filter-swordType" placeholder="フィルター" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
            </div>
            <div>
                <label style="font-size: 11px;"><input type="checkbox" id="filter-needsUpgrade" onchange="applyFilters()" style="margin-right: 4px;">強化待ち</label>
            </div>
            <div>
                <label style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">限界突破</label>
                <select id="filter-breakthrough" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    <option value="">すべて</option>
                    <option value="0">なし</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                </select>
            </div>
            <div>
                <label style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">奥義色</label>
                <select id="filter-secretColor" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
                    <option value="">すべて</option>
                    <option value="red">🔴 赤</option>
                    <option value="blue">🔵 青</option>
                    <option value="yellow">🟡 黄</option>
                </select>
            </div>
            <div>
                <label style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">信頼度</label>
                <input type="number" id="filter-trustLevel" min="0" max="100" placeholder="0-100" style="width: 100%; font-size: 12px;" onchange="applyFilters()">
            </div>
        </div>
        <button class="secondary" style="padding: 4px 8px; font-size: 12px;" onclick="clearFilters()">リセット</button>
    </div>`;

    const rareLst = data.characters.rare.filter(char => matchesFilter(char));
    const unrevealed = data.characters.unrevealed.filter(char => matchesFilter(char));

    html += '<div class="rarity-section"><div class="rarity-title">⭐ レア</div>';
    if (rareLst.length === 0) {
        html += '<div style="color: #999; font-size: 13px;">キャラがありません</div>';
    } else {
        html += '<div class="grid">';
        rareLst.forEach(char => html += renderCharCard(char, 'rare'));
        html += '</div>';
    }
    html += '</div>';

    html += '<div class="rarity-section"><div class="rarity-title rarity-title.unrevealed">その他</div>';
    if (unrevealed.length === 0) {
        html += '<div style="color: #999; font-size: 13px;">キャラがありません</div>';
    } else {
        html += '<div class="grid">';
        unrevealed.forEach(char => html += renderCharCard(char, 'unrevealed'));
        html += '</div>';
    }
    html += '</div>';

    document.getElementById('characters').innerHTML = html;
}

function renderCharCard(char, rarity) {
    return `<div class="card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="flex: 1;">
                <div class="card-title" style="cursor: pointer; color: #0066cc;">${char.name}</div>
                <div style="font-size: 11px; color: #666; display: flex; gap: 4px; flex-wrap: wrap;">
                    ${char.swordType ? `<span style="background: #e3f2fd; padding: 1px 4px; border-radius: 2px;">⚔️ ${char.swordType}</span>` : ''}
                    ${char.needsUpgrade ? `<span style="background: #fff3e0; padding: 1px 4px; border-radius: 2px;">🔧 強化待ち</span>` : ''}
                    ${char.breakthrough > 0 ? `<span style="background: #f3e5f5; padding: 1px 4px; border-radius: 2px;">⭐ 限界${char.breakthrough}</span>` : ''}
                    ${char.secretColor ? `<span style="background: ${char.secretColor === 'red' ? '#ffebee' : char.secretColor === 'blue' ? '#e3f2fd' : '#fffde7'}; padding: 1px 4px; border-radius: 2px;">${char.secretColor === 'red' ? '🔴' : char.secretColor === 'blue' ? '🔵' : '🟡'}</span>` : ''}
                    ${char.trustLevel > 0 ? `<span style="background: #f0f4c3; padding: 1px 4px; border-radius: 2px;">💖 ${char.trustLevel}</span>` : ''}
                </div>
            </div>
            <button class="danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteCharacter('${rarity}', ${char.id})">削除</button>
        </div>
        <button style="padding: 4px 8px; font-size: 11px; width: 100%; background: #f5f5f5; color: #333; border: 1px solid #ddd;" onclick="showCharEditDialog(${char.id})">編集</button>
    </div>`;
}

function addCharacterFromInput() {
    const rarity = document.getElementById('newCharRarity').value;
    const name = document.getElementById('newCharName').value;
    addCharacter(rarity, name);
    document.getElementById('newCharName').value = '';
}
