// 타워 클릭 핸들러 (좌표 수정 버전)

(function () {
    function initTowerClick() {
        if (!window.game || !window.game.canvas) {
            setTimeout(initTowerClick, 100);
            return;
        }

        console.log('타워 클릭 핸들러 초기화');

        // 새로운 핸들러로 교체
        window.game.handleCanvasClick = function (event) {
            if (this.state !== 'playing') return;

            const rect = this.canvas.getBoundingClientRect();
            // 캔버스 스케일 고려
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;

            console.log('클릭 좌표:', x, y);

            // 먼저 타워 클릭 체크
            const tower = this.towerManager.getTowerAt(x, y);
            if (tower) {
                this.towerManager.selectTower(tower);
                if (typeof showTowerDetails === 'function') {
                    showTowerDetails(tower);
                }
                return;
            }

            // 그리드 영역 클릭
            const grid = CONFIG.GRID_AREA;
            if (x >= grid.x && x <= grid.x + grid.width &&
                y >= grid.y && y <= grid.y + grid.height) {

                const gridX = Math.floor((x - grid.x) / grid.cellWidth);
                const gridY = Math.floor((y - grid.y) / grid.cellHeight);

                console.log('그리드 좌표:', gridX, gridY);

                if (this.towerManager.selectCell(gridX, gridY)) {
                    // 토스트 제거 - 패널 전환으로 충분
                }
            }
        };

        console.log('타워 클릭 핸들러 설정 완료');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTowerClick);
    } else {
        initTowerClick();
    }
})();
