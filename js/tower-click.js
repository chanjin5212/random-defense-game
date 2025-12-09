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

            // object-fit: contain으로 인한 실제 렌더링 영역 계산
            const canvasRatio = this.canvas.width / this.canvas.height;
            const rectRatio = rect.width / rect.height;

            let renderWidth = rect.width;
            let renderHeight = rect.height;
            let offsetX = 0;
            let offsetY = 0;

            if (rectRatio > canvasRatio) {
                // 화면이 더 넓음 (좌우 여백 발생)
                renderWidth = rect.height * canvasRatio;
                offsetX = (rect.width - renderWidth) / 2;
            } else {
                // 화면이 더 높음 (상하 여백 발생)
                renderHeight = rect.width / canvasRatio;
                offsetY = (rect.height - renderHeight) / 2;
            }

            // 클릭 좌표를 캔버스 내부 좌표로 변환
            const clientX = event.clientX - rect.left - offsetX;
            const clientY = event.clientY - rect.top - offsetY;

            // 캔버스 스케일 적용
            const scaleX = this.canvas.width / renderWidth;
            const scaleY = this.canvas.height / renderHeight;

            const x = clientX * scaleX;
            const y = clientY * scaleY;

            // 그리드 영역 클릭만 처리
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
