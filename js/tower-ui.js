// 타워 UI 함수 (새 레이아웃용)

function showTowerDetails(tower) {
    const details = tower.getDetails();

    const message = `
타워: ${details.name}
등급: ${details.rarity}
데미지: ${details.damage}
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
        html += `
            <div class="tower-item" 
                 style="border-left-color: ${tower.rarityData.color};"
                 onclick="showTowerDetails(window.game.towerManager.grid[${y}][${x}][${index}])">
                <div class="tower-item-name" style="color: ${tower.rarityData.color};">
                    ${details.name}
                </div>
                <div class="tower-item-stats">
                    ${details.rarity} | 데미지: ${details.damage} | 사거리: ${details.range}
                </div>
            </div>
        `;
    });

    listDiv.innerHTML = html;
}

// updateGameUI에 자동으로 추가
if (typeof updateGameUI !== 'undefined') {
    const originalUpdateGameUI = updateGameUI;
    updateGameUI = function () {
        originalUpdateGameUI();
        updateCellTowerList();
    };
}
