// 메인 게임 클래스

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);

        // 게임 상태
        this.state = 'idle'; // idle, playing, paused, gameover
        this.currentRound = 1;
        this.roundTimer = CONFIG.GAME.ROUND_DURATION;
        this.gold = CONFIG.ECONOMY.STARTING_GOLD;
        this.killCount = 0;
        this.bossKills = 0;
        this.totalGoldEarned = 0;
        this.dps = 0;

        // 매니저들
        this.monsterManager = new MonsterManager();
        this.towerManager = new TowerManager();
        this.gacha = new GachaSystem();

        // 투사체와 파티클
        this.projectiles = [];
        this.particles = [];

        // 미션 보스
        this.missionBossCooldown = 0;

        // 계정 스탯
        this.accountStats = window.upgradeManager ? window.upgradeManager.getStats() : {
            ATK_PERCENT: 0,
            ASPD_PERCENT: 0,
            CRIT_RATE: 0,
            CRIT_DAMAGE: 0,
            BOSS_DAMAGE: 0,
            STARTING_GOLD: 0
        };

        // 시작 골드 적용
        this.gold += this.accountStats.STARTING_GOLD;

        // 게임 루프
        this.lastTime = 0;
        this.animationId = null;

        // DPS 계산
        this.damageDealt = 0;
        this.dpsTimer = 0;

        // 캔버스 클릭 이벤트 (그리드 선택)
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleCanvasClick(event) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 그리드 영역 내 클릭인지 확인
        const grid = CONFIG.GRID_AREA;
        if (x >= grid.x && x <= grid.x + grid.width &&
            y >= grid.y && y <= grid.y + grid.height) {

            // 클릭한 셀 계산
            const gridX = Math.floor((x - grid.x) / grid.cellWidth);
            const gridY = Math.floor((y - grid.y) / grid.cellHeight);

            // 셀 선택
            if (this.towerManager.selectCell(gridX, gridY)) {
                const count = this.towerManager.getCellTowerCount(gridX, gridY);
                showToast(`칸 선택됨 (${count}/10)`, 'success');
            }
        }
    }

    start() {
        this.state = 'playing';
        this.currentRound = 1;
        this.roundTimer = CONFIG.GAME.ROUND_DURATION;
        this.killCount = 0;
        this.bossKills = 0;
        this.totalGoldEarned = 0;

        // 계정 스탯 다시 로드
        this.accountStats = window.upgradeManager ? window.upgradeManager.getStats() : {
            ATK_PERCENT: 0,
            ASPD_PERCENT: 0,
            CRIT_RATE: 0,
            CRIT_DAMAGE: 0,
            BOSS_DAMAGE: 0,
            STARTING_GOLD: 0
        };

        this.gold = CONFIG.ECONOMY.STARTING_GOLD + this.accountStats.STARTING_GOLD;

        this.monsterManager.clear();
        this.towerManager.clear();
        this.projectiles = [];
        this.particles = [];

        this.startRound();
        this.gameLoop();
    }

    restart() {
        this.start();
    }

    startRound() {
        this.roundTimer = CONFIG.GAME.ROUND_DURATION;
        this.monsterManager.startRound(this.currentRound);
        this.updateUI();
    }

    nextRound() {
        this.currentRound++;

        if (this.currentRound > CONFIG.GAME.MAX_ROUNDS) {
            // 게임 클리어!
            showToast('게임 클리어! 축하합니다!', 'success');
            this.gameOver();
            return;
        }

        this.startRound();
    }

    gameLoop(timestamp = 0) {
        if (this.state !== 'playing') return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (deltaTime > 0 && deltaTime < 0.1) { // 최대 100ms
            this.update(deltaTime);
        }

        this.render();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // 라운드 타이머
        this.roundTimer -= deltaTime;

        if (this.roundTimer <= 0) {
            // 라운드 종료 - 몬스터가 남아있어도 다음 라운드로
            if (this.monsterManager.isRoundComplete()) {
                this.nextRound();
            } else {
                // 시간 초과해도 다음 라운드로 (몬스터는 계속 쌓임)
                this.nextRound();
            }
        }

        // 미션 보스 쿨다운
        if (this.missionBossCooldown > 0) {
            this.missionBossCooldown -= deltaTime;
        }

        // 몬스터 업데이트
        this.monsterManager.update(deltaTime);

        // 몬스터 300마리 이상 시 게임 오버
        const monsterCount = this.monsterManager.getAliveMonsters().length;
        if (monsterCount >= 300) {
            showToast('몬스터가 300마리를 초과했습니다!', 'error');
            this.gameOver();
            return;
        }

        // 타워 업데이트
        this.towerManager.update(deltaTime, this.monsterManager.getAliveMonsters());

        // 투사체 업데이트
        this.updateProjectiles(deltaTime);

        // 파티클 업데이트
        this.updateParticles(deltaTime);

        // DPS 계산
        this.updateDPS(deltaTime);

        // UI 업데이트
        this.updateUI();
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update();

            // 타겟 도달 체크
            if (projectile.hasReachedTarget() && projectile.target && projectile.target.alive) {
                // 데미지 적용
                if (projectile.tower) {
                    const damage = projectile.tower.applyDamageToTarget(projectile.target, projectile.damage);
                    this.damageDealt += damage;

                    // 파티클 생성
                    this.createHitParticles(projectile.target.x, projectile.target.y, projectile.color);
                }

                projectile.dead = true;
            }

            // 화면 밖으로 나가면 제거
            if (projectile.x < 0 || projectile.x > this.canvas.width ||
                projectile.y < 0 || projectile.y > this.canvas.height) {
                projectile.dead = true;
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    updateParticles(deltaTime) {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(p => !p.isDead());
    }

    updateDPS(deltaTime) {
        this.dpsTimer += deltaTime;

        if (this.dpsTimer >= 1.0) {
            this.dps = this.damageDealt / this.dpsTimer;
            this.damageDealt = 0;
            this.dpsTimer = 0;
        }
    }

    createHitParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randomInt(1, 3);
            const particle = new Particle(
                x, y, color,
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }
            );
            this.particles.push(particle);
        }
    }

    render() {
        this.renderer.render(this);
    }

    updateUI() {
        updateGameUI();
    }

    addGold(amount) {
        this.gold += amount;
        this.totalGoldEarned += amount;
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    spawnMissionBoss() {
        if (this.missionBossCooldown > 0) return;

        this.monsterManager.spawnMissionBoss(this.currentRound);
        this.missionBossCooldown = CONFIG.ECONOMY.MISSION_BOSS_COOLDOWN;
    }

    spawnSplitMonsters(x, y, round) {
        this.monsterManager.spawnSplitMonsters(x, y, round);
    }

    monsterReachedEnd() {
        // 게임 오버
        this.gameOver();
    }

    gameOver() {
        this.state = 'gameover';

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        showGameOver();
    }
}

// 전역 변수들
window.game = null;
window.economy = null;
window.upgradeManager = null;
window.battlePass = null;
window.achievementManager = null;
window.DEBUG_MODE = false;

// 초기화
window.addEventListener('load', () => {
    // 매니저들 초기화
    window.economy = new EconomyManager();
    window.economy.load();

    window.upgradeManager = new UpgradeManager();
    window.upgradeManager.load();

    window.battlePass = new BattlePassManager();
    window.battlePass.load();

    window.achievementManager = new AchievementManager();
    window.achievementManager.load();

    // 게임 인스턴스 생성
    window.game = new Game();

    // UI 초기화
    initUI();

    // 로비 화면 표시
    showScreen('lobby-screen');
    updateLobbyUI();

    console.log('★ 랜덤 디펜스 게임 로드 완료! ★');
    console.log('디버그 모드: window.DEBUG_MODE = true');
});

// 키보드 단축키
window.addEventListener('keydown', (e) => {
    // D키 - 디버그 모드 토글
    if (e.key === 'd' || e.key === 'D') {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log('디버그 모드:', window.DEBUG_MODE);
    }

    // R키 - 라운드 스킵 (디버그)
    if (e.key === 'r' || e.key === 'R') {
        if (window.DEBUG_MODE && window.game && window.game.state === 'playing') {
            window.game.nextRound();
            console.log('라운드 스킵:', window.game.currentRound);
        }
    }

    // G키 - 골드 추가 (디버그)
    if (e.key === 'g' || e.key === 'G') {
        if (window.DEBUG_MODE && window.game) {
            window.game.addGold(1000);
            window.game.updateUI();
            console.log('골드 +1000');
        }
    }
});
