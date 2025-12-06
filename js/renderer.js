// 렌더러 (그리드 기반)

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    }

    clear() {
        this.ctx.fillStyle = '#0F172A';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawPath() {
        const path = CONFIG.PATH.points;

        // 경로 배경
        this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.5)';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // 경로 중심선
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        this.ctx.stroke();

        // 시작점 표시
        this.ctx.fillStyle = '#10B981';
        this.ctx.beginPath();
        this.ctx.arc(path[0].x, path[0].y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // 화살표로 방향 표시
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('→', path[0].x, path[0].y);
    }

    drawGrid() {
        const grid = CONFIG.GRID_AREA;
        const cellWidth = grid.cellWidth;
        const cellHeight = grid.cellHeight;

        // 그리드 배경
        this.ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        this.ctx.fillRect(grid.x, grid.y, grid.width, grid.height);

        // 그리드 선
        this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        this.ctx.lineWidth = 1;

        // 세로선
        for (let x = 0; x <= CONFIG.GAME.GRID_COLS; x++) {
            const posX = grid.x + (x * cellWidth);
            this.ctx.beginPath();
            this.ctx.moveTo(posX, grid.y);
            this.ctx.lineTo(posX, grid.y + grid.height);
            this.ctx.stroke();
        }

        // 가로선
        for (let y = 0; y <= CONFIG.GAME.GRID_ROWS; y++) {
            const posY = grid.y + (y * cellHeight);
            this.ctx.beginPath();
            this.ctx.moveTo(grid.x, posY);
            this.ctx.lineTo(grid.x + grid.width, posY);
            this.ctx.stroke();
        }

        // 선택된 셀 하이라이트
        if (window.game && window.game.towerManager.selectedCell) {
            const sel = window.game.towerManager.selectedCell;
            const cellX = grid.x + (sel.x * cellWidth);
            const cellY = grid.y + (sel.y * cellHeight);

            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            this.ctx.fillRect(cellX, cellY, cellWidth, cellHeight);

            this.ctx.strokeStyle = '#3B82F6';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
        }

        // 각 셀의 타워 개수 표시
        if (window.game) {
            this.ctx.fillStyle = '#CBD5E1';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';

            for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
                for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                    const count = window.game.towerManager.getCellTowerCount(x, y);
                    if (count > 0) {
                        const cellX = grid.x + (x * cellWidth);
                        const cellY = grid.y + (y * cellHeight);
                        this.ctx.fillText(
                            `${count}/10`,
                            cellX + cellWidth - 5,
                            cellY + 5
                        );
                    }
                }
            }
        }
    }

    render(game) {
        this.clear();
        this.drawPath();
        this.drawGrid();

        // 타워 렌더링
        if (game.towerManager) {
            game.towerManager.draw(this.ctx);
        }

        // 몬스터 렌더링
        if (game.monsterManager) {
            game.monsterManager.draw(this.ctx);
        }

        // 투사체 렌더링
        if (game.projectiles) {
            game.projectiles.forEach(projectile => {
                projectile.draw(this.ctx);
            });
        }

        // 파티클 렌더링
        if (game.particles) {
            game.particles.forEach(particle => {
                particle.draw(this.ctx);
            });
        }
    }
}
