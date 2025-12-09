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
document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-filter');
    if (!btn) return;

    if (!window.game || !window.game.towerManager.selectedCell) return;

    const category = btn.dataset.category; // 'type' or 'rarity'
    const value = btn.dataset.value;
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
            <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">자동 집결 필터 (종류 + 등급)</div>
            
            <!-- 종류 필터 -->
            <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                <button class="btn-filter ${typeFilter === 'STANDARD' ? 'active' : ''}" data-category="type" data-value="STANDARD" 
                    style="flex: 1; padding: 6px; border: 1px solid #444; border-radius: 4px; background: ${typeFilter === 'STANDARD' ? '#3B82F6' : '#1e293b'}; color: white; font-size: 11px; cursor: pointer;">
                    일반
                </button>
                <button class="btn-filter ${typeFilter === 'SPLASH' ? 'active' : ''}" data-category="type" data-value="SPLASH" 
                    style="flex: 1; padding: 6px; border: 1px solid #444; border-radius: 4px; background: ${typeFilter === 'SPLASH' ? '#EF4444' : '#1e293b'}; color: white; font-size: 11px; cursor: pointer;">
                    광역
                </button>
                <button class="btn-filter ${typeFilter === 'SNIPER' ? 'active' : ''}" data-category="type" data-value="SNIPER" 
                    style="flex: 1; padding: 6px; border: 1px solid #444; border-radius: 4px; background: ${typeFilter === 'SNIPER' ? '#10B981' : '#1e293b'}; color: white; font-size: 11px; cursor: pointer;">
                    저격
                </button>
            </div>

            <!-- 등급 필터 -->
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                <button class="btn-filter ${rarityFilter === 'COMMON' ? 'active' : ''}" data-category="rarity" data-value="COMMON" 
                    style="flex: 1; padding: 4px; border: 1px solid #444; border-radius: 4px; background: ${rarityFilter === 'COMMON' ? '#94A3B8' : '#1e293b'}; color: white; font-size: 10px; cursor: pointer;">
                    일반
                </button>
                <button class="btn-filter ${rarityFilter === 'UNCOMMON' ? 'active' : ''}" data-category="rarity" data-value="UNCOMMON" 
                    style="flex: 1; padding: 4px; border: 1px solid #444; border-radius: 4px; background: ${rarityFilter === 'UNCOMMON' ? '#10B981' : '#1e293b'}; color: white; font-size: 10px; cursor: pointer;">
                    고급
                </button>
                <button class="btn-filter ${rarityFilter === 'RARE' ? 'active' : ''}" data-category="rarity" data-value="RARE" 
                    style="flex: 1; padding: 4px; border: 1px solid #444; border-radius: 4px; background: ${rarityFilter === 'RARE' ? '#3B82F6' : '#1e293b'}; color: white; font-size: 10px; cursor: pointer;">
                    희귀
                </button>
                <button class="btn-filter ${rarityFilter === 'EPIC' ? 'active' : ''}" data-category="rarity" data-value="EPIC" 
                    style="flex: 1; padding: 4px; border: 1px solid #444; border-radius: 4px; background: ${rarityFilter === 'EPIC' ? '#8B5CF6' : '#1e293b'}; color: white; font-size: 10px; cursor: pointer;">
                    영웅
                </button>
                <button class="btn-filter ${rarityFilter === 'LEGENDARY' ? 'active' : ''}" data-category="rarity" data-value="LEGENDARY" 
                    style="flex: 1; padding: 4px; border: 1px solid #444; border-radius: 4px; background: ${rarityFilter === 'LEGENDARY' ? '#F59E0B' : '#1e293b'}; color: white; font-size: 10px; cursor: pointer;">
                    전설
                </button>
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
                name: key
            };
        }
        summary[key].count++;
    });

    html += '<div class="tower-summary" style="display: flex; flex-direction: column; gap: 5px;">';

    Object.values(summary).sort((a, b) => b.count - a.count).forEach(item => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${item.color};">
                <span style="color: ${item.color}; font-weight: bold; font-size: 0.9em;">${item.name}</span>
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
        showToast(`타워 판매 완료! +${sellPrice}G`, 'success');
        updateCellTowerList(); // 목록 갱신
    } else {
        showToast('판매 실패', 'error');
    }
}

// 전역 스코프로 노출
window.showTowerDetails = showTowerDetails;
window.sellTowerAtIndex = sellTowerAtIndex;
window.updateCellTowerList = updateCellTowerList;
