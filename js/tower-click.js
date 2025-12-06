// 타워 클릭 핸들러 (칸 선택만)

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

            // 그리드 영역 클릭만 처리 (타워 개별 클릭 제거)
            const grid = CONFIG.GRID_AREA;
            if (x >= grid.x && x <= grid.x + grid.width &&
                y >= grid.y && y <= grid.y + grid.height) {

                const gridX = Math.floor((x - grid.x) / grid.cellWidth);
                const gridY = Math.floor((y - grid.y) / grid.cellHeight);

                this.towerManager.selectCell(gridX, gridY);
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
