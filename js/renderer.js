// 렌더러 (그리드 기반)

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 화면 흔들림 효과
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }

    shakeScreen(intensity = 5, duration = 0.5) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
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
                    const cellX = grid.x + (x * cellWidth);
                    const cellY = grid.y + (y * cellHeight);

                    // 필터 표시
                    const filter = window.game.towerManager.getCellFilter(x, y);
                    if (filter && (filter.type || filter.rarity)) {
                        this.ctx.save();

                        // 1. 종류 필터 (Top Left)
                        if (filter.type) {
                            let color = '#FFFFFF';
                            let label = '';
                            if (filter.type === 'STANDARD') { color = '#3B82F6'; label = '일반'; }
                            else if (filter.type === 'SPLASH') { color = '#EF4444'; label = '광역'; }
                            else if (filter.type === 'SNIPER') { color = '#10B981'; label = '저격'; }

                            // 배경
                            this.ctx.fillStyle = color;
                            this.ctx.globalAlpha = 0.2;
                            this.ctx.fillRect(cellX + 2, cellY + 2, 40, 18);

                            // 텍스트
                            this.ctx.globalAlpha = 1.0;
                            this.ctx.fillStyle = color;
                            this.ctx.font = 'bold 11px Arial';
                            this.ctx.textAlign = 'left';
                            this.ctx.textBaseline = 'top';
                            this.ctx.fillText(label, cellX + 5, cellY + 5);
                        }

                        // 2. 등급 필터 (Bottom Left)
                        if (filter.rarity) {
                            let color = '#FFFFFF';
                            let label = '';
                            switch (filter.rarity) {
                                case 'COMMON': color = '#94A3B8'; label = '일반'; break;
                                case 'UNCOMMON': color = '#10B981'; label = '고급'; break;
                                case 'RARE': color = '#3B82F6'; label = '희귀'; break;
                                case 'EPIC': color = '#8B5CF6'; label = '영웅'; break;
                                case 'LEGENDARY': color = '#F59E0B'; label = '전설'; break;
                            }

                            // 배경
                            this.ctx.fillStyle = color;
                            this.ctx.globalAlpha = 0.2;
                            this.ctx.fillRect(cellX + 2, cellY + 22, 40, 18);

                            // 텍스트
                            this.ctx.globalAlpha = 1.0;
                            this.ctx.fillStyle = color;
                            this.ctx.font = 'bold 10px Arial';
                            this.ctx.textAlign = 'left';
                            this.ctx.textBaseline = 'top';
                            this.ctx.fillText(label, cellX + 5, cellY + 25);
                        }

                        this.ctx.restore();
                    }

                    // 타워 개수 표시
                    const count = window.game.towerManager.getCellTowerCount(x, y);
                    if (count > 0) {
                        this.ctx.fillStyle = '#CBD5E1';
                        this.ctx.font = '12px Arial';
                        this.ctx.textAlign = 'right';
                        this.ctx.textBaseline = 'top';
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

        this.ctx.save(); // 전체 상태 저장 (흔들림 효과용)

        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.ctx.translate(dx, dy);
            this.shakeTimer -= 1 / 60;
        }

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

        if (game.projectiles) {
            game.projectiles.forEach(projectile => {
                projectile.draw(this.ctx);
            });
        }

        // 아마겟돈(Global Shock) 이펙트 렌더링
        if (game.globalShockTimer > 0) {
            this.drawGlobalShock();
        }

        // 번개 이펙트 렌더링
        if (game.lightningEffects) {
            game.lightningEffects.forEach(lightning => {
                this.drawLightning(lightning);
            });
        }

        // 빔 이펙트 렌더링
        if (game.beamEffects) {
            game.beamEffects.forEach(beam => {
                this.drawBeam(beam);
            });
        }

        // 파티클 렌더링
        if (game.particles) {
            game.particles.forEach(particle => {
                particle.draw(this.ctx);
            });
        }

        this.ctx.restore(); // 전체 상태 복구
    }

    drawLightning(lightning) {
        const { x1, y1, x2, y2, color, width, life } = lightning;

        // 투명도 (생명력에 따라 페이드)
        const alpha = Math.min(1, life / 0.2); // 수명 0.2초 기준 페이드

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        // 번개 효과 (지그재그 패턴)
        const segments = 8; // 세그먼트 수 증가
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;

        const points = [{ x: x1, y: y1 }];

        for (let i = 1; i < segments; i++) {
            const jitter = 15; // 지그재그 강도
            const offsetX = (Math.random() - 0.5) * jitter;
            const offsetY = (Math.random() - 0.5) * jitter;
            points.push({
                x: x1 + dx * i + offsetX,
                y: y1 + dy * i + offsetY
            });
        }
        points.push({ x: x2, y: y2 });

        // 외부 광선 (파란색)
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();

        // 내부 코어 (흰색)
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = width;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#FFFFFF';

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawBeam(beam) {
        const { x1, y1, x2, y2, color, width, life, maxLife } = beam;
        const alpha = Math.min(1, life / maxLife);

        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.globalCompositeOperation = 'lighter'; // 빛나는 효과

        // 메인 빔 (외부 광선)
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // 코어 빔 (흰색)
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = width / 2;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#FFFFFF';

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawMeteor(x, y, radius) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;

        // 폭발 범위 표시 (그라데이션)
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 충격파링
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawGlobalShock() {
        const path = CONFIG.PATH.points;
        const ctx = this.ctx;

        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#60A5FA';

        // 경로 전체에 전기 흐름 효과 (3겹)
        for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);

            for (let i = 1; i < path.length; i++) {
                const start = path[i - 1];
                const end = path[i];
                const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                const steps = Math.max(2, Math.floor(dist / 30)); // 30픽셀 간격

                for (let k = 1; k <= steps; k++) {
                    const t = k / steps;
                    const x = start.x + (end.x - start.x) * t;
                    const y = start.y + (end.y - start.y) * t;

                    // 지그재그 (랜덤 변위)
                    const jitter = 20;
                    const offsetX = (Math.random() - 0.5) * jitter;
                    const offsetY = (Math.random() - 0.5) * jitter;

                    ctx.lineTo(x + offsetX, y + offsetY);
                }
            }

            // 색상 및 투명도 (흰색 -> 파란색 계열)
            if (j === 0) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
            } else if (j === 1) {
                ctx.strokeStyle = '#93C5FD';
                ctx.lineWidth = 6;
            } else {
                ctx.strokeStyle = '#3B82F6';
                ctx.lineWidth = 10;
            }

            ctx.globalAlpha = Math.random() * 0.3 + 0.3;
            ctx.stroke();
        }

        ctx.restore();
    }
}
