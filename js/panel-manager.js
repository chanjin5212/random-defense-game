// 패널 뷰 전환 관리

window.showMainView = function () {
    document.getElementById('main-view').classList.add('active');
    document.getElementById('cell-view').classList.remove('active');
    document.getElementById('upgrade-view').classList.remove('active');
}

window.showCellView = function () {
    document.getElementById('main-view').classList.remove('active');
    document.getElementById('cell-view').classList.add('active');
    document.getElementById('upgrade-view').classList.remove('active');
    updateCellTowerList();
}

window.showUpgradeView = function () {
    document.getElementById('main-view').classList.remove('active');
    document.getElementById('cell-view').classList.remove('active');
    document.getElementById('upgrade-view').classList.add('active');
    updateTowerUpgradeList();
}

// 뒤로가기 버튼 이벤트
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-to-main-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.showMainView();
            // 칸 선택 해제
            if (window.game && window.game.towerManager) {
                window.game.towerManager.selectedCell = null;
                window.game.towerManager.selectedTower = null;
            }
        });
    }
});

// 칸 선택 시 자동으로 cell-view로 전환
const originalSelectCell = TowerManager.prototype.selectCell;
TowerManager.prototype.selectCell = function (gridX, gridY) {
    const result = originalSelectCell.call(this, gridX, gridY);
    if (result) {
        window.showCellView();
    }
    return result;
};
