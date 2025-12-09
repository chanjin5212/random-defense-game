// 타워 UI 함수 (새 레이아웃용)

// 이벤트 위임 방식으로 판매 버튼 처리 (중복 방지 및 동적 요소 대응)
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-sell');
    if (!btn) return;

    e.stopPropagation(); // 버튼 클릭 시 다른 이벤트 간섭 차단

    const x = parseInt(btn.dataset.x, 10);
    const y = parseInt(btn.dataset.y, 10);
    const index = parseInt(btn.dataset.index, 10);

    if (!isNaN(x) && !isNaN(y) && !isNaN(index)) {
        sellTowerAtIndex(x, y, index);
    }
});

// 필터 버튼 처리
// 필터 변경 처리 (Select Box)
document.addEventListener('change', function (e) {
    const select = e.target.closest('.filter-select');
    if (!select) return;

    if (!window.game || !window.game.towerManager.selectedCell) return;

    const category = select.dataset.category; // 'type' or 'rarity'
    const value = select.value;
    const { x, y } = window.game.towerManager.selectedCell;

    window.game.towerManager.setCellFilter(x, y, category, value);
    updateCellTowerList(); // UI 갱신
});

function updateCellTowerList() {
    const listDiv = document.getElementById('cell-tower-list');
    const cellInfoSpan = document.getElementById('selected-cell-info');

    if (!listDiv) return;

    if (!window.game || !window.game.towerManager.selectedCell) {
        listDiv.innerHTML = '<p style="text-align: center; opacity: 0.6; color: #F1F5F9;">칸을 선택하세요</p>';
        if (cellInfoSpan) cellInfoSpan.textContent = '없음';
        return;
    }

    const { x, y } = window.game.towerManager.selectedCell;
    const towers = window.game.towerManager.grid[y][x];

    if (cellInfoSpan) {
        cellInfoSpan.textContent = `(${x}, ${y}) - ${towers.length}/${CONFIG.GAME.TOWERS_PER_SLOT}`;
    }

    let html = '';

    // 필터 설정 UI
    const currentFilter = window.game.towerManager.getCellFilter(x, y);
    const typeFilter = currentFilter.type;
    const rarityFilter = currentFilter.rarity;

    html += `
        <div class="filter-section" style="margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
            <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">자동 집결 필터</div>
            
            <div style="display: flex; gap: 10px;">
                <!-- 종류 필터 -->
                <div style="flex: 1;">
                    <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">종류</div>
                    <select class="filter-select" data-category="type" style="width: 100%; padding: 6px; background: #1e293b; color: white; border: 1px solid #444; border-radius: 4px;">
                        <option value="" ${!typeFilter ? 'selected' : ''}>전체</option>
                        <option value="STANDARD" ${typeFilter === 'STANDARD' ? 'selected' : ''}>일반</option>
                        <option value="SPLASH" ${typeFilter === 'SPLASH' ? 'selected' : ''}>광역</option>
                        <option value="SNIPER" ${typeFilter === 'SNIPER' ? 'selected' : ''}>저격</option>
                    </select>
                </div>

                <!-- 등급 필터 -->
                <div style="flex: 1;">
                    <div style="font-size: 10px; color: #aaa; margin-bottom: 4px;">등급</div>
                    <select class="filter-select" data-category="rarity" style="width: 100%; padding: 6px; background: #1e293b; color: white; border: 1px solid #444; border-radius: 4px;">
                        <option value="" ${!rarityFilter ? 'selected' : ''}>전체</option>
                        <option value="COMMON" ${rarityFilter === 'COMMON' ? 'selected' : ''}>일반</option>
                        <option value="UNCOMMON" ${rarityFilter === 'UNCOMMON' ? 'selected' : ''}>고급</option>
                        <option value="RARE" ${rarityFilter === 'RARE' ? 'selected' : ''}>희귀</option>
                        <option value="EPIC" ${rarityFilter === 'EPIC' ? 'selected' : ''}>영웅</option>
                        <option value="LEGENDARY" ${rarityFilter === 'LEGENDARY' ? 'selected' : ''}>전설</option>
                        <option value="MYTHIC" ${rarityFilter === 'MYTHIC' ? 'selected' : ''}>미스틱</option>
                        <option value="DIVINE" ${rarityFilter === 'DIVINE' ? 'selected' : ''}>신화</option>
                        <option value="TRANSCENDENT" ${rarityFilter === 'TRANSCENDENT' ? 'selected' : ''}>초월</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    if (towers.length === 0) {
        html += '<p style="text-align: center; opacity: 0.6; color: #F1F5F9;">이 칸에 타워가 없습니다</p>';
        listDiv.innerHTML = html;
        return;
    }

    // 타워 요약 (Summary View)
    const summary = {};
    towers.forEach(tower => {
        const key = `${tower.rarityData.name} ${tower.towerData.name}`;
        if (!summary[key]) {
            summary[key] = {
                count: 0,
                color: tower.rarityData.color,
                name: key,
                towerKey: tower.towerKey,
                rarity: tower.rarity
            };
        }
        summary[key].count++;
    });

    // 등급 순서 (높은 등급이 우선)
    const rarityOrder = {
        'TRANSCENDENT': 0,
        'DIVINE': 1,
        'MYTHIC': 2,
        'LEGENDARY': 3,
        'UNIQUE': 4,
        'EPIC': 5,
        'RARE': 6,
        'UNCOMMON': 7,
        'COMMON': 8
    };

    html += '<div class="tower-summary" style="display: flex; flex-direction: column; gap: 5px;">';

    Object.values(summary)
        .sort((a, b) => {
            // 1. 등급 정렬
            const orderA = rarityOrder[a.rarity] !== undefined ? rarityOrder[a.rarity] : 99;
            const orderB = rarityOrder[b.rarity] !== undefined ? rarityOrder[b.rarity] : 99;
            if (orderA !== orderB) return orderA - orderB;
            // 2. 이름 정렬
            return a.name.localeCompare(b.name);
        })
        .forEach(item => {
            // 공격력 정보 계산
            const towerRef = towers.find(t => t.towerKey === item.towerKey && t.rarity === item.rarity);
            let dmgInfo = '';
            if (towerRef) {
                // 기본 데미지 (CONFIG 참조)
                const baseDmg = CONFIG.TOWERS[item.towerKey].baseDamage * towerRef.rarityData.multiplier;
                // 현재 최종 데미지
                const currentDmg = towerRef.damage;
                // 계정 스탯 등 추가 보정 적용된 최종 예상 데미지 (UI 표시용)
                const finalDmg = towerRef.applyAccountStats(currentDmg, { isBoss: false });

                const bonus = Math.max(0, finalDmg - baseDmg);

                dmgInfo = `
                    <div style="font-size: 0.8em; color: #aaa; margin-top: 2px;">
                        ATK: <span style="color: #fff;">${formatNumber(finalDmg)}</span>
                        ${bonus > 0 ? `<span style="color: #10B981;">(+${formatNumber(bonus)})</span>` : ''}
                    </div>
                `;
            }

            // 클릭 시 이동 모드 진입
            html += `
                <div onclick="initiateManualMove('${item.towerKey}', '${item.rarity}', ${item.count})" 
                     style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${item.color}; cursor: pointer; margin-bottom: 5px;">
                    <div>
                        <span style="color: ${item.color}; font-weight: bold; font-size: 0.9em; display: block;">${item.name}</span>
                        ${dmgInfo}
                    </div>
                    <span style="font-weight: bold; color: white;">x${item.count}</span>
                </div>
            `;
        });

    html += '</div>';

    listDiv.innerHTML = html;
}

function sellTowerAtIndex(x, y, index) {
    if (!window.game) {
        return;
    }

    // 타워가 존재하는지 확인
    const towers = window.game.towerManager.grid[y][x];
    if (!towers || !towers[index]) {
        showToast('타워를 찾을 수 없습니다.', 'error');
        return;
    }

    const tower = towers[index];
    const sellPrice = tower.sellPrice;

    // 바로 판매
    const success = window.game.towerManager.sellTower(tower);
    if (success) {
        // showToast(`타워 판매 완료! +${sellPrice}G`, 'success');
        updateCellTowerList(); // 목록 갱신
    } else {
        showToast('판매 실패', 'error');
    }
}

function initiateManualMove(towerKey, rarity, maxCount) {
    if (!window.game || !window.game.towerManager.selectedCell) return;

    const countStr = prompt(`이동할 수량을 입력하세요 (최대 ${maxCount}개)`, maxCount);
    if (countStr === null) return; // 취소

    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) {
        showToast('유효한 수량을 입력해주세요.', 'error');
        return;
    }

    const moveCount = Math.min(count, maxCount);
    const selectedCell = window.game.towerManager.selectedCell;

    window.game.startManualMove(
        selectedCell.x,
        selectedCell.y,
        towerKey,
        rarity,
        moveCount
    );
}

// 전역 스코프로 노출
// window.showTowerDetails = showTowerDetails; // Removed
window.sellTowerAtIndex = sellTowerAtIndex;
window.updateCellTowerList = updateCellTowerList;
window.initiateManualMove = initiateManualMove;
