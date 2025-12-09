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
        this.lightningEffects = []; // 번개 이펙트
        this.beamEffects = []; // 레이저/빔 이펙트

        // 아마겟돈(Global Shock) 상태
        this.globalShockTimer = 0;
        this.globalShockDPS = 0;

        // 게임 루프 바인딩
        this.gameLoop = this.gameLoop.bind(this);

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

        // 수동 이동 상태
        this.moveState = {
            active: false,
            sourceX: -1,
            sourceY: -1,
            towerKey: null,
            rarity: null,
            count: 0
        };
    }

    handleCanvasClick(event) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();

        // object-fit: contain으로 인한 실제 렌더링 영역 계산 (tower-click.js 로직 통합)
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

        // 그리드 영역 내 클릭인지 확인
        const grid = CONFIG.GRID_AREA;
        if (x >= grid.x && x <= grid.x + grid.width &&
            y >= grid.y && y <= grid.y + grid.height) {

            // 클릭한 셀 계산
            const gridX = Math.floor((x - grid.x) / grid.cellWidth);
            const gridY = Math.floor((y - grid.y) / grid.cellHeight);

            // 수동 이동 모드일 경우
            if (this.moveState.active) {
                const moved = this.towerManager.moveTowers(
                    this.moveState.sourceX, this.moveState.sourceY,
                    gridX, gridY,
                    this.moveState.towerKey, this.moveState.rarity,
                    this.moveState.count
                );

                if (moved > 0) {
                    showToast(`${moved}개의 타워 이동 완료`, 'success');
                    // 이동 후 상태 초기화
                    this.moveState.active = false;

                    // UI 업데이트 (선택된 셀이 있다면)
                    if (window.ui) {
                        window.ui.updateTowerList();
                        // 하단 메뉴 다시 보이기 (선택사항)
                        const bottomPanel = document.getElementById('bottom-panel');
                        if (bottomPanel) bottomPanel.style.display = 'flex';
                    }
                } else {
                    if (this.moveState.sourceX === gridX && this.moveState.sourceY === gridY) {
                        showToast('이동 취소', 'info');
                    } else {
                        showToast('이동 실패 (공간 부족)', 'error');
                    }
                    this.moveState.active = false;
                    if (window.ui) {
                        const bottomPanel = document.getElementById('bottom-panel');
                        if (bottomPanel) bottomPanel.style.display = 'flex';
                    }
                }
                return;
            }

            // 일반 셀 선택
            if (this.towerManager.selectCell(gridX, gridY)) {
                const count = this.towerManager.getCellTowerCount(gridX, gridY);
                showToast(`칸 선택됨 (${count}/${CONFIG.GAME.TOWERS_PER_SLOT})`, 'success');
            }
        }
    }

    startManualMove(sourceX, sourceY, towerKey, rarity, count) {
        this.moveState = {
            active: true,
            sourceX,
            sourceY,
            towerKey,
            rarity,
            count
        };
        showToast('이동할 칸을 선택하세요', 'info');


        // 하단 메뉴 숨기기 (시야 확보)
        const bottomPanel = document.getElementById('bottom-panel');
        const mobilePanel = document.getElementById('control-panel-mobile');


        if (bottomPanel) bottomPanel.style.display = 'none';
        if (mobilePanel) mobilePanel.classList.remove('open');
    }

    start(isAdmin = false) {
        this.isAdminMode = isAdmin;
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

        // 초기화 먼저 실행
        this.monsterManager.clear();
        this.towerManager.clear();
        this.projectiles = [];
        this.particles = [];

        if (this.isAdminMode) {
            this.gold = 999999; // 테스트용 무한 골드
            this.spawnDummyMonsters();
            showToast('🔧 관리자 샌드박스 모드 시작', 'warning');
            this.updateUI();
        } else {
            this.startRound();
        }

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

        // 무한 라운드 모드이므로 게임 클리어 조건 제거 (필요시 MAX_ROUNDS 설정 복구 가능)
        if (CONFIG.GAME.MAX_ROUNDS !== Infinity && this.currentRound > CONFIG.GAME.MAX_ROUNDS) {
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
        // 라운드 타이머 (관리자 모드는 시간 무제한)
        if (!this.isAdminMode) {
            this.roundTimer -= deltaTime;
        }

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

        // 번개 이펙트 업데이트
        this.updateLightningEffects(deltaTime);

        // 빔 이펙트 업데이트
        this.updateBeamEffects(deltaTime);

        // 아마겟돈(Global Shock) 업데이트
        this.updateGlobalShock(deltaTime);

        // DPS 계산
        this.updateDPS(deltaTime);

        // UI 업데이트
        this.updateUI();
    }

    updateProjectiles(deltaTime) {
        this.projectiles.forEach(projectile => {
            projectile.update();

            // 타겟 도달 체크
            if (projectile.hasReachedTarget()) {
                // 커스텀 타격 효과 (메테오 등)
                if (projectile.onHit) {
                    projectile.onHit();
                    projectile.dead = true;
                }
                // 일반 타겟 공격
                else if (projectile.target && projectile.target.alive) {
                    // 데미지 적용
                    if (projectile.tower) {
                        const damage = projectile.tower.applyDamageToTarget(projectile.target, projectile.damage);
                        this.damageDealt += damage;

                        // 파티클 생성
                        this.createHitParticles(projectile.target.x, projectile.target.y, projectile.color);
                    }
                    projectile.dead = true;
                } else if (!projectile.target) {
                    // 타겟 없는 투사체 (그냥 도달하면 삭제)
                    projectile.dead = true;
                }
            }

            // 화면 밖으로 나가면 제거 (메테오, 아마겟돈 등 화면 밖 시작 고려하여 여유 둠)
            const margin = (projectile.type === 'meteor' || projectile.type === 'armageddon') ? 1000 : 50;
            if (projectile.x < -margin || projectile.x > this.canvas.width + margin ||
                projectile.y < -margin || projectile.y > this.canvas.height + margin) {
                projectile.dead = true;
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    updateParticles(deltaTime) {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(p => !p.isDead());
    }

    updateLightningEffects(deltaTime) {
        this.lightningEffects.forEach(lightning => {
            lightning.life -= deltaTime;
        });
        this.lightningEffects = this.lightningEffects.filter(l => l.life > 0);
    }

    updateBeamEffects(deltaTime) {
        if (this.beamEffects) {
            this.beamEffects.forEach(beam => {
                beam.life -= deltaTime;
            });
            this.beamEffects = this.beamEffects.filter(beam => beam.life > 0);
        }
    }

    // 아마겟돈 효과 발동
    activateGlobalShock(duration, dps) {
        this.globalShockTimer = duration;
        this.globalShockDPS = dps;
    }

    // 아마겟돈 효과 업데이트 (DOT)
    updateGlobalShock(deltaTime) {
        if (this.globalShockTimer > 0) {
            this.globalShockTimer -= deltaTime;

            // 프레임당 데미지
            const damageThisFrame = this.globalShockDPS * deltaTime;
            const monsters = this.monsterManager.getAliveMonsters();

            let totalDamage = 0;
            monsters.forEach(m => {
                const dealt = m.takeDamage(damageThisFrame);
                totalDamage += dealt;
            });

            this.damageDealt += totalDamage;


            if (this.globalShockTimer <= 0) {
                this.globalShockTimer = 0;
            }
        }
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

    addGold(amount) {
        this.gold += amount;
        this.totalGoldEarned += amount;
        this.updateUI(); // 골드 UI 즉시 갱신
    }


    spawnSplitMonsters(x, y, round) {
        this.monsterManager.spawnSplitMonsters(x, y, round);
    }

    spawnDummyMonsters() {
        if (this.monsterManager) {
            this.monsterManager.spawnDummyMonsters(20);
        }
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
window.towerUpgradeManager = null;

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

    window.towerUpgradeManager = new TowerUpgradeManager();

    // 게임 인스턴스 생성
    window.game = new Game();

    // UI 초기화
    initUI();
    initTowerUpgradeUI();

    // 로비 화면 표시
    showScreen('lobby-screen');
    updateLobbyUI();
});

