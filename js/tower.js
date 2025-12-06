// 타워 클래스 (간소화 버전 - 공격형만)

class Tower {
    constructor(towerKey, rarity, gridX, gridY, slotIndex) {
        this.towerKey = towerKey;
        this.towerData = CONFIG.TOWERS[towerKey];
        this.rarity = rarity;
        this.rarityData = CONFIG.RARITY[rarity];
        this.gridX = gridX;
        this.gridY = gridY;
        this.slotIndex = slotIndex;

        // 스탯 계산
        this.damage = this.towerData.baseDamage * this.rarityData.multiplier;
        this.attackSpeed = this.towerData.attackSpeed;
        this.range = this.towerData.range;
        this.type = this.towerData.type;
        this.effect = this.towerData.effect;

        // 공격 타이머
        this.attackCooldown = 0;

        // 위치 계산
        this.setPosition();

        // 시각 효과
        this.attackAnimation = 0;

        // 판매 가격 계산 (뽑기 비용의 50%)
        this.sellPrice = Math.floor(CONFIG.ECONOMY.SINGLE_PULL_COST * CONFIG.ECONOMY.SELL_REFUND_PERCENT);
    }

    setPosition() {
        const grid = CONFIG.GRID_AREA;
        const cellWidth = grid.cellWidth;
        const cellHeight = grid.cellHeight;

        const cellCenterX = grid.x + (this.gridX * cellWidth) + (cellWidth / 2);
        const cellCenterY = grid.y + (this.gridY * cellHeight) + (cellHeight / 2);

        const angle = (Math.PI * 2 / CONFIG.GAME.TOWERS_PER_SLOT) * this.slotIndex;
        const radius = 25;

        this.x = cellCenterX + Math.cos(angle) * radius;
        this.y = cellCenterY + Math.sin(angle) * radius;
    }

    update(deltaTime, monsters) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.attackAnimation > 0) {
            this.attackAnimation -= deltaTime * 5;
        }

        if (this.attackCooldown <= 0) {
            this.attack(monsters);
        }
    }

    attack(monsters) {
        const targets = this.findTargets(monsters);
        if (targets.length === 0) return;

        this.executeAttack(targets[0]);

        if (this.attackSpeed > 0) {
            this.attackCooldown = this.attackSpeed;
        }

        this.attackAnimation = 1.0;
    }

    findTargets(monsters) {
        const aliveMonsters = monsters.filter(m => m.alive);
        const inRange = aliveMonsters.filter(m => {
            return distance(this.x, this.y, m.x, m.y) <= this.range;
        });

        if (inRange.length === 0) return [];

        if (this.effect === 'sniper') {
            return [inRange.reduce((max, m) => m.hp > max.hp ? m : max)];
        }

        return [inRange.reduce((closest, m) => {
            const d1 = distance(this.x, this.y, closest.x, closest.y);
            const d2 = distance(this.x, this.y, m.x, m.y);
            return d2 < d1 ? m : closest;
        })];
    }

    executeAttack(target) {
        let finalDamage = this.applyAccountStats(this.damage, target);

        if (window.game) {
            const projectile = new Projectile(
                this.x, this.y,
                target.x, target.y,
                finalDamage,
                this.rarityData.color
            );
            projectile.tower = this;
            projectile.target = target;
            window.game.projectiles.push(projectile);
        }
    }

    applyDamageToTarget(target, damage) {
        const actualDamage = target.takeDamage(damage);

        // AOE 효과
        if (this.effect === 'aoe') {
            this.applyAOEDamage(target, damage);
        }

        // 골드 획득
        if (!target.alive && window.game) {
            window.game.addGold(target.goldReward);
            window.game.killCount++;
        }

        return actualDamage;
    }

    applyAOEDamage(epicenter, damage) {
        if (!window.game) return;

        const radius = this.towerData.aoeRadius || 80;
        const monsters = window.game.monsterManager.getAliveMonsters();

        monsters.forEach(monster => {
            if (monster === epicenter) return;
            const dist = distance(epicenter.x, epicenter.y, monster.x, monster.y);
            if (dist <= radius) {
                monster.takeDamage(damage * 0.7);
            }
        });

        this.createExplosionParticles(epicenter.x, epicenter.y);
    }

    applyAccountStats(baseDamage, target) {
        if (!window.game || !window.game.accountStats) return baseDamage;

        const stats = window.game.accountStats;
        let damage = baseDamage;

        damage *= (1 + stats.ATK_PERCENT / 100);

        if (Math.random() < stats.CRIT_RATE / 100) {
            damage *= (1 + stats.CRIT_DAMAGE / 100);
        }

        if (target.isBoss) {
            damage *= (1 + stats.BOSS_DAMAGE / 100);
        }

        return damage;
    }

    createExplosionParticles(x, y) {
        if (!window.game) return;

        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = randomInt(2, 5);
            const particle = new Particle(
                x, y,
                this.rarityData.color,
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }
            );
            window.game.particles.push(particle);
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.attackAnimation > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.rarityData.color;
        }

        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 12);
        gradient.addColorStop(0, this.rarityData.color);
        gradient.addColorStop(1, this.darkenColor(this.rarityData.color));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.rarityData.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    darkenColor(color) {
        const rgb = hexToRgb(color);
        if (!rgb) return color;
        return rgbToHex(
            Math.floor(rgb.r * 0.6),
            Math.floor(rgb.g * 0.6),
            Math.floor(rgb.b * 0.6)
        );
    }

    getDetails() {
        return {
            name: this.towerData.name,
            rarity: this.rarityData.name,
            damage: Math.floor(this.damage),
            attackSpeed: this.attackSpeed.toFixed(1),
            range: this.range,
            effect: this.towerData.description,
            sellPrice: this.sellPrice,
            gridX: this.gridX,
            gridY: this.gridY,
            slotIndex: this.slotIndex
        };
    }
}

// 타워 매니저
class TowerManager {
    constructor() {
        this.grid = [];
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                this.grid[y][x] = [];
            }
        }
        this.selectedCell = null;
        this.selectedTower = null; // 선택된 타워
    }

    selectCell(gridX, gridY) {
        if (gridX >= 0 && gridX < CONFIG.GAME.GRID_COLS &&
            gridY >= 0 && gridY < CONFIG.GAME.GRID_ROWS) {
            this.selectedCell = { x: gridX, y: gridY };
            this.selectedTower = null; // 셀 선택 시 타워 선택 해제
            return true;
        }
        return false;
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedCell = { x: tower.gridX, y: tower.gridY };
    }

    getTowerAt(x, y) {
        // 캔버스 좌표에서 타워 찾기
        const towers = this.getAllTowers();
        for (const tower of towers) {
            const dist = distance(x, y, tower.x, tower.y);
            if (dist <= 14) { // 타워 반지름
                return tower;
            }
        }
        return null;
    }

    sellTower(tower) {
        const { gridX, gridY, slotIndex } = tower;
        const cell = this.grid[gridY][gridX];

        // 타워 제거
        const index = cell.indexOf(tower);
        if (index > -1) {
            cell.splice(index, 1);

            // 남은 타워들의 슬롯 인덱스 재조정
            cell.forEach((t, i) => {
                t.slotIndex = i;
                t.setPosition();
            });

            // 골드 환불
            if (window.game) {
                window.game.addGold(tower.sellPrice);
            }

            this.selectedTower = null;
            return true;
        }
        return false;
    }

    addTowerToSelectedCell(towerKey, rarity) {
        if (!this.selectedCell) {
            return { success: false, reason: '칸을 먼저 선택하세요' };
        }

        const { x, y } = this.selectedCell;
        const cell = this.grid[y][x];

        if (cell.length >= CONFIG.GAME.TOWERS_PER_SLOT) {
            return { success: false, reason: '이 칸은 가득 찼습니다 (최대 10개)' };
        }

        const slotIndex = cell.length;
        const tower = new Tower(towerKey, rarity, x, y, slotIndex);
        cell.push(tower);

        return { success: true, tower: tower };
    }

    getAllTowers() {
        const towers = [];
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                towers.push(...this.grid[y][x]);
            }
        }
        return towers;
    }

    getTowerCount() {
        return this.getAllTowers().length;
    }

    getCellTowerCount(gridX, gridY) {
        if (gridX >= 0 && gridX < CONFIG.GAME.GRID_COLS &&
            gridY >= 0 && gridY < CONFIG.GAME.GRID_ROWS) {
            return this.grid[gridY][gridX].length;
        }
        return 0;
    }

    update(deltaTime, monsters) {
        const towers = this.getAllTowers();
        towers.forEach(tower => {
            tower.update(deltaTime, monsters);
        });
    }

    draw(ctx) {
        const towers = this.getAllTowers();
        towers.forEach(tower => tower.draw(ctx));

        // 선택된 타워 하이라이트
        if (this.selectedTower) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.selectedTower.x, this.selectedTower.y, 18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    clear() {
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                this.grid[y][x] = [];
            }
        }
        this.selectedCell = null;
        this.selectedTower = null;
    }
}
