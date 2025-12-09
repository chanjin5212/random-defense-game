// UI 관리 (간소화 버전)

function initUI() {
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('lobby-btn').addEventListener('click', returnToLobby);
    document.getElementById('mission-boss-btn').addEventListener('click', spawnMissionBoss);

    // 관리자 기능
    const adminStartBtn = document.getElementById('admin-start-btn');
    if (adminStartBtn) adminStartBtn.addEventListener('click', startAdminGame);

    const adminSpawnBtn = document.getElementById('admin-spawn-btn');
    if (adminSpawnBtn) adminSpawnBtn.addEventListener('click', handleAdminSpawn);

    initGachaUI();
    initUpgradeUI();
    initBattlePassUI();
    initAchievementUI();
    updateLobbyUI();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function updateLobbyUI() {
    if (!window.economy) return;

    const accountGoldEl = document.getElementById('account-gold');
    const upgradeStonesEl = document.getElementById('upgrade-stones');
    const bestRoundEl = document.getElementById('best-round');

    if (accountGoldEl) accountGoldEl.textContent = formatNumber(window.economy.accountGold);
    if (upgradeStonesEl) upgradeStonesEl.textContent = formatNumber(window.economy.upgradeStones);

    const bestRound = localStorage.getItem('bestRound') || 0;
    if (bestRoundEl) bestRoundEl.textContent = bestRound;

    if (window.battlePass) {
        const progress = window.battlePass.getProgress();
        const progressEl = document.getElementById('battlepass-progress');
        const fillEl = document.getElementById('battlepass-fill');
        if (progressEl) progressEl.textContent = `${progress.currentTier}/${progress.maxTier}`;
        if (fillEl) fillEl.style.width = `${(progress.currentTier / progress.maxTier) * 100}%`;
    }
}

function updateGameUI() {
    if (!window.game) return;

    // 기본 정보
    const roundEl = document.getElementById('current-round');
    const timerEl = document.getElementById('round-timer');
    const goldEl = document.getElementById('game-gold');

    if (roundEl) roundEl.textContent = window.game.currentRound;
    if (timerEl) timerEl.textContent = Math.ceil(window.game.roundTimer);
    if (goldEl) goldEl.textContent = formatNumber(window.game.gold);

    // 통계
    const killCountEl = document.getElementById('kill-count');
    const dpsEl = document.getElementById('dps-display');
    if (killCountEl) killCountEl.textContent = window.game.killCount;
    if (dpsEl) dpsEl.textContent = Math.floor(window.game.dps);

    // 몬스터 카운트
    const monsterCountEl = document.getElementById('monster-count');
    if (monsterCountEl) {
        const monsterCount = window.game.monsterManager.getAliveMonsters().length;
        monsterCountEl.textContent = monsterCount;

        if (monsterCount >= 250) {
            monsterCountEl.style.color = '#EF4444';
        } else if (monsterCount >= 200) {
            monsterCountEl.style.color = '#F59E0B';
        } else {
            monsterCountEl.style.color = '#F1F5F9';
        }
    }

    // 미션 보스
    const bossBtn = document.getElementById('mission-boss-btn');
    const cooldownSpan = document.getElementById('boss-cooldown');

    if (bossBtn && cooldownSpan) {
        const bossCooldown = window.game.missionBossCooldown;
        if (bossCooldown > 0) {
            bossBtn.disabled = true;
            cooldownSpan.textContent = Math.ceil(bossCooldown) + '초';
        } else {
            bossBtn.disabled = false;
            cooldownSpan.textContent = '준비';
        }
    }

    // 가챠 버튼
    const singleBtn = document.getElementById('single-pull-btn');
    const tenBtn = document.getElementById('ten-pull-btn');

    if (singleBtn && tenBtn) {
        const selectedCell = window.game.towerManager.selectedCell;
        const hasSelection = selectedCell !== null;
        const hasGoldForSingle = window.game.gold >= CONFIG.ECONOMY.SINGLE_PULL_COST;
        const hasGoldForTen = window.game.gold >= CONFIG.ECONOMY.TEN_PULL_COST;

        let cellFull = false;
        if (selectedCell) {
            const count = window.game.towerManager.getCellTowerCount(selectedCell.x, selectedCell.y);
            cellFull = count >= CONFIG.GAME.TOWERS_PER_SLOT;
        }

        singleBtn.disabled = !hasGoldForSingle || cellFull;
        tenBtn.disabled = !hasGoldForTen || cellFull;
    }

    // 타워 강화 화면이 열려있으면 업데이트
    const upgradeView = document.getElementById('upgrade-view');
    if (upgradeView && upgradeView.classList.contains('active')) {
        if (typeof updateTowerUpgradeList === 'function') {
            updateTowerUpgradeList();
        }
    }
}

function showGameOver() {
    if (!window.game) return;

    const finalRoundEl = document.getElementById('final-round');
    const finalKillsEl = document.getElementById('final-kills');
    const finalXpEl = document.getElementById('final-xp');
    const finalStonesEl = document.getElementById('final-stones');

    if (finalRoundEl) finalRoundEl.textContent = window.game.currentRound;
    if (finalKillsEl) finalKillsEl.textContent = window.game.killCount;

    const xpGained = window.game.currentRound * CONFIG.BATTLEPASS.XP_PER_ROUND;
    if (finalXpEl) finalXpEl.textContent = '+' + xpGained;

    if (window.battlePass) {
        window.battlePass.addXP(xpGained);
    }

    const stonesGained = Math.floor(window.game.currentRound / 10);
    if (finalStonesEl) finalStonesEl.textContent = '+' + stonesGained;

    if (window.economy) {
        window.economy.addUpgradeStones(stonesGained);
    }

    const bestRound = parseInt(localStorage.getItem('bestRound') || 0);
    if (window.game.currentRound > bestRound) {
        localStorage.setItem('bestRound', window.game.currentRound);
        showToast('새로운 최고 기록!', 'success');
    }

    showScreen('gameover-screen');
    updateLobbyUI();
}

function startGame() {
    showScreen('game-screen');
    if (window.game) {
        window.game.start(false); // 일반 모드

        // 관리자 패널 숨김
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'none';

        // 헤더 복구
        const hudTop = document.querySelector('.hud-top');
        if (hudTop) hudTop.style.display = '';
    }
}

function startAdminGame() {
    showScreen('game-screen');
    if (window.game) {
        window.game.start(true); // 관리자 모드

        // 관리자 패널 표시
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'block';

        // 헤더 숨김 (관리자 모드 불필요)
        const hudTop = document.querySelector('.hud-top');
        if (hudTop) hudTop.style.display = 'none';
    }
}

function handleAdminSpawn() {
    if (!window.game) return;

    // 선택된 칸 확인
    if (!window.game.towerManager.selectedCell) {
        showToast('먼저 칸을 클릭하여 선택하세요!', 'warning');
        return;
    }

    const { x, y } = window.game.towerManager.selectedCell;
    const cellCount = window.game.towerManager.getCellTowerCount(x, y);

    if (cellCount >= CONFIG.GAME.TOWERS_PER_SLOT) {
        showToast('이 칸은 가득 찼습니다! (최대 10개)', 'warning');
        return;
    }

    // 선택된 등급과 타워 타입 가져오기
    const raritySelect = document.getElementById('admin-rarity-select');
    const towerSelect = document.getElementById('admin-tower-select');

    const selectedRarity = raritySelect.value;
    const selectedTower = towerSelect.value;

    // 타워 추가
    const addResult = window.game.towerManager.addTowerToSelectedCell(selectedTower, selectedRarity);

    if (addResult.success) {
        const rarityData = CONFIG.RARITY[selectedRarity];
        const towerData = CONFIG.TOWERS[selectedTower];
        showToast(`🔧 ${rarityData.name} ${towerData.name} 소환 완료!`, 'success');
    } else {
        showToast(addResult.reason, 'error');
    }

    // UI 업데이트
    window.game.updateUI();
}

function restartGame() {
    if (window.game) {
        window.game.restart();
    }
    showScreen('game-screen');
}

function returnToLobby() {
    showScreen('lobby-screen');
    updateLobbyUI();
}

function spawnMissionBoss() {
    if (window.game && window.game.missionBossCooldown <= 0) {
        window.game.spawnMissionBoss();
    }
}
