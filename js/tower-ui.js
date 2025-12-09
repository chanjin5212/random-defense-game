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

function showTowerDetails(tower) {
    const details = tower.getDetails();

    // 데미지 표시 형식 결정
    let damageDisplay = `${details.damage}`;
    if (details.bonusDamage > 0) {
        damageDisplay = `${details.baseDamage}+${details.bonusDamage}`;
    }

    const message = `
타워: ${details.name}
등급: ${details.rarity}
데미지: ${damageDisplay}
공격속도: ${details.attackSpeed}초
사정거리: ${details.range}
효과: ${details.effect}
위치: (${details.gridX}, ${details.gridY})
판매가: ${details.sellPrice}G
    `.trim();

    if (confirm(message + '\n\n이 타워를 판매하시겠습니까?')) {
        if (window.game && window.game.towerManager.sellTower(tower)) {
            showToast(`타워 판매 완료! +${details.sellPrice}G`, 'success');
            updateCellTowerList(); // 목록 갱신
        }
    }
}

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
        cellInfoSpan.textContent = `(${x}, ${y}) - ${towers.length}/10`;
    }

    if (towers.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; opacity: 0.6; color: #F1F5F9;">이 칸에 타워가 없습니다</p>';
        return;
    }

    let html = '';
    towers.forEach((tower, index) => {
        const details = tower.getDetails();

        // 데미지 표시 형식 결정
        let damageDisplay = `${details.damage}`;
        if (details.bonusDamage > 0) {
            damageDisplay = `${details.baseDamage}+<span style="color: #10B981;">${details.bonusDamage}</span>`;
        }

        html += `
            <div class="tower-item" style="border-left-color: ${tower.rarityData.color}; display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 8px; background: rgba(0,0,0,0.2); border-left-width: 4px; border-left-style: solid; border-radius: 4px;">
                <div class="tower-info" style="flex: 1; pointer-events: none;">
                    <div class="tower-item-name" style="color: ${tower.rarityData.color}; font-weight: bold;">
                        ${details.name}
                    </div>
                    <div class="tower-item-stats" style="font-size: 0.8em; opacity: 0.8;">
                        ${details.rarity} | Dmg: ${damageDisplay}
                    </div>
                </div>
                <button class="btn-sell" data-x="${x}" data-y="${y}" data-index="${index}" style="background: #ef4444; border: none; border-radius: 4px; color: white; padding: 6px 12px; font-size: 0.9em; cursor: pointer; margin-left: 8px; flex-shrink: 0; min-width: 70px;">
                    판매 <span style="font-weight: bold; color: #fbbf24;">${tower.sellPrice}G</span>
                </button>
            </div>
        `;
    });

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
