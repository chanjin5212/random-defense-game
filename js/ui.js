// UI 관리 (간소화 버전)

function initUI() {
    // 기존 싱글 모드 버튼 (호환성 유지)
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGame);
    }

    // 싱글 모드 버튼 (새로운)
    const singleModeBtn = document.getElementById('single-mode-btn');
    if (singleModeBtn) {
        singleModeBtn.addEventListener('click', startGame);
    }

    // 멀티 모드 버튼
    const multiModeBtn = document.getElementById('multi-mode-btn');
    if (multiModeBtn) {
        multiModeBtn.addEventListener('click', () => {
            if (typeof initializeSocket === 'function') {
                initializeSocket();
            }
            showScreen('multiplayer-lobby-screen');
        });
    }

    // 멀티플레이 로비 버튼들
    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            const playerName = document.getElementById('player-name-input').value.trim();
            if (!playerName) {
                showToast('이름을 입력해주세요', 'error');
                return;
            }
            if (typeof createMultiplayerRoom === 'function') {
                createMultiplayerRoom(playerName);
            }
        });
    }

    const joinRoomBtn = document.getElementById('join-room-btn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', () => {
            const playerName = document.getElementById('player-name-input').value.trim();
            const roomCode = document.getElementById('room-code-input').value.trim();
            if (!playerName || !roomCode) {
                showToast('이름과 방 코드를 입력해주세요', 'error');
                return;
            }
            if (typeof joinMultiplayerRoom === 'function') {
                joinMultiplayerRoom(roomCode, playerName);
            }
        });
    }

    const backToLobbyBtn = document.getElementById('back-to-lobby-btn');
    if (backToLobbyBtn) {
        backToLobbyBtn.addEventListener('click', () => {
            showScreen('lobby-screen');
        });
    }

    const leaveRoomBtn = document.getElementById('leave-room-btn');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            if (typeof leaveMultiplayerRoom === 'function') {
                leaveMultiplayerRoom();
            }
        });
    }

    const startMultiGameBtn = document.getElementById('start-multiplayer-game-btn');
    if (startMultiGameBtn) {
        startMultiGameBtn.addEventListener('click', () => {
            if (typeof startMultiplayerGame === 'function') {
                startMultiplayerGame();
            }
        });
    }

    // 멀티플레이 리스너는 socket-client.js의 connect 이벤트에서 자동 설정됨

    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('lobby-btn').addEventListener('click', () => location.reload());
    document.getElementById('mission-boss-btn').addEventListener('click', spawnMissionBoss);

    // 3배속 버튼
    const speedBtn = document.getElementById('speed-btn-container');
    if (speedBtn) {
        speedBtn.addEventListener('click', () => {
            if (window.game) window.game.toggleGameSpeed();
        });
    }

    // FX 버튼
    const fxBtn = document.getElementById('fx-btn-container');
    if (fxBtn) {
        fxBtn.addEventListener('click', toggleGraphicsQuality);
    }

    // 관리자 기능
    const adminStartBtn = document.getElementById('admin-start-btn');
    if (adminStartBtn) adminStartBtn.addEventListener('click', startAdminGame);

    const adminSpawnBtn = document.getElementById('admin-spawn-btn');
    if (adminSpawnBtn) adminSpawnBtn.addEventListener('click', handleAdminSpawn);

    initGachaUI();
    initUpgradeUI();
    updateLobbyUI();
    updateGachaCosts(); // CONFIG에서 가챠 비용 업데이트
    initAchievementUI(); // 업적 UI 초기화
}

// CONFIG에서 가챠 비용 업데이트
function updateGachaCosts() {
    const singleCostEl = document.getElementById('single-pull-cost');
    const tenCostEl = document.getElementById('ten-pull-cost');

    if (singleCostEl) {
        singleCostEl.textContent = `${CONFIG.ECONOMY.SINGLE_PULL_COST}G`;
    }
    if (tenCostEl) {
        tenCostEl.textContent = `${CONFIG.ECONOMY.TEN_PULL_COST}G`;
    }
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

    // 몬스터 체력 표시
    const hpDisplay = document.getElementById('monster-hp-display');
    if (hpDisplay) {
        const round = window.game.currentRound;
        if (typeof isBossRound === 'function' && isBossRound(round)) {
            // 보스 라운드면 실제 보스 체력 표시 시도
            const boss = window.game.monsterManager.monsters.find(m => m.isBoss);
            if (boss) {
                hpDisplay.textContent = `(Boss: ${formatNumber(Math.ceil(boss.hp))})`;
            } else {
                // 보스 스폰 전 or 처치 후
                const maxHp = calculateBossHP(round);
                hpDisplay.textContent = `(Boss: ${formatNumber(maxHp)})`;
            }
        } else {
            // 일반 몬스터 체력
            const maxHp = calculateMonsterHP(round);
            hpDisplay.textContent = `(HP: ${formatNumber(maxHp)})`;
        }
    }

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
    const bossHpDisplay = document.getElementById('boss-hp-display');

    if (bossBtn && cooldownSpan) {
        const bossCooldown = window.game.missionBossCooldown;
        if (bossCooldown > 0) {
            bossBtn.disabled = true;
            cooldownSpan.textContent = Math.ceil(bossCooldown) + '초';
        } else {
            bossBtn.disabled = false;
            cooldownSpan.textContent = '준비';
        }

        // 미션 보스 체력 표시 (현재 라운드 기준)
        if (bossHpDisplay) {
            const currentRound = window.game.currentRound;
            const missionBossHP = calculateBossHP(currentRound);
            bossHpDisplay.textContent = `HP: ${formatNumber(missionBossHP)}`;
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

    if (finalRoundEl) finalRoundEl.textContent = window.game.currentRound;
    if (finalKillsEl) finalKillsEl.textContent = window.game.killCount;

    showScreen('gameover-screen');
}

function startGame() {
    // 사운드 시스템 초기화 (사용자 인터랙션 필요)
    if (window.soundSystem) {
        window.soundSystem.init();
    }

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

        // 레전드 이상이면 축하 효과 표시
        const legendaryRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
        if (legendaryRarities.includes(selectedRarity)) {
            showLegendaryCelebration(
                towerData.name,
                rarityData.name,
                selectedRarity,
                rarityData.color
            );
        }

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

function toggleGraphicsQuality() {
    const qualities = ['high', 'low', 'off'];
    const current = CONFIG.GRAPHICS.PARTICLE_QUALITY;
    const currentIndex = qualities.indexOf(current);
    const nextIndex = (currentIndex + 1) % qualities.length;

    CONFIG.GRAPHICS.PARTICLE_QUALITY = qualities[nextIndex];

    // UI 업데이트
    const btn = document.getElementById('fx-display');
    if (btn) {
        const labels = {
            'high': 'FX: High',
            'low': 'FX: Low',
            'off': 'FX: Off'
        };
        btn.textContent = labels[CONFIG.GRAPHICS.PARTICLE_QUALITY];
    }

    showToast(`그래픽 설정: ${CONFIG.GRAPHICS.PARTICLE_QUALITY.toUpperCase()}`, 'info');
}

// 전역 함수 노출 (멀티플레이에서 사용)
window.showScreen = showScreen;
