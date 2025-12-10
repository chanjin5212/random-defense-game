// 멀티플레이 게임 동기화
let gameStateSyncInterval = null;
let otherPlayersStates = new Map(); // playerId -> gameState

// 멀티플레이 게임 리스너 설정
function setupMultiplayerGameListeners() {
    const socket = getSocket();

    // 기존 리스너 제거 (재연결 시 중복 방지)
    socket.off('player-state-update');
    socket.off('player-game-over');
    socket.off('speed-changed');

    // 다른 플레이어 상태 업데이트
    socket.on('player-state-update', (data) => {
        const { playerId, gameState } = data;
        otherPlayersStates.set(playerId, gameState);

        // UI 업데이트 (다른 플레이어 필드 표시)
        updateOtherPlayerField(playerId, gameState);
    });

    // 다른 플레이어 게임 종료
    socket.on('player-game-over', (data) => {
        const { playerName, score, round } = data;
        console.log(`${playerName}님이 게임 종료! (Round ${round})`);
    });

    // 속도 변경 (방장이 변경)
    socket.on('speed-changed', (data) => {
        const { speed } = data;
        applySpeedChange(speed);
    });

    console.log('✅ 게임 리스너 설정 완료');
}

// 게임 상태 동기화 시작
function startGameStateSync() {
    if (gameStateSyncInterval) {
        clearInterval(gameStateSyncInterval);
    }

    // 0.5초마다 게임 상태 전송
    gameStateSyncInterval = setInterval(() => {
        if (window.isMultiplayerMode && window.multiplayerRoomCode) {
            sendGameState();
        }
    }, 500);
}

// 게임 상태 동기화 중지
function stopGameStateSync() {
    if (gameStateSyncInterval) {
        clearInterval(gameStateSyncInterval);
        gameStateSyncInterval = null;
    }
}

// 게임 상태 전송
function sendGameState() {
    const socket = getSocket();

    if (!isSocketConnected()) {
        console.warn('⚠️ Socket not connected, skipping game state update');
        return;
    }

    if (!window.isMultiplayerMode) {
        console.warn('⚠️ Not in multiplayer mode, skipping game state update');
        return;
    }

    // 현재 게임 상태 수집
    const game = window.game;
    const gameState = {
        round: game?.currentRound || window.currentRound || 1,
        gold: game?.gold || window.gold || 0,
        kills: game?.killCount || window.killCount || 0,
        monsters: game?.monsterManager?.monsters?.length || 0, // 현재 필드의 몬스터 수
        timestamp: Date.now()
    };

    socket.emit('game-state-update', {
        roomCode: window.multiplayerRoomCode,
        gameState: gameState
    });

    console.log('📤 게임 상태 전송:', gameState);
}

// 타워 데이터 수집
function collectTowerData() {
    if (typeof cells === 'undefined' || !cells) {
        return [];
    }

    const towerData = [];

    cells.forEach((cell, index) => {
        if (cell.towers && cell.towers.length > 0) {
            cell.towers.forEach(tower => {
                towerData.push({
                    cellIndex: index,
                    rarity: tower.rarity,
                    type: tower.type,
                    level: tower.level || 1
                });
            });
        }
    });

    return towerData;
}

// 속도 변경 전송 (방장만)
function sendSpeedChange(speed) {
    const socket = getSocket();

    if (!isSocketConnected() || !window.isMultiplayerMode) {
        return;
    }

    socket.emit('speed-change', {
        roomCode: window.multiplayerRoomCode,
        speed: speed
    });

    console.log(`⚡ 속도 변경 전송: ${speed}x`);
}

// 속도 변경 적용
function applySpeedChange(speed) {
    if (!window.game) return;

    window.game.gameSpeed = speed;

    // UI 업데이트
    const btn = document.getElementById('game-speed-display');
    if (btn) btn.textContent = `x${speed}`;

    console.log(`⚡ 속도 변경 적용: ${speed}x`);
}

// 타워 획득 알림 전송 (고급 타워만)
function notifyTowerAcquired(tower) {
    const socket = getSocket();

    if (!isSocketConnected() || !window.isMultiplayerMode) {
        return;
    }

    const notifiableRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];

    if (notifiableRarities.includes(tower.rarity)) {
        socket.emit('tower-acquired', {
            roomCode: window.multiplayerRoomCode,
            playerName: currentPlayerName,
            tower: {
                rarity: tower.rarity,
                type: tower.type,
                name: tower.name || getTowerDisplayName(tower)
            }
        });
    }
}

// 게임 종료 알림 전송
function notifyGameOver(score, round) {
    const socket = getSocket();

    if (!isSocketConnected() || !window.isMultiplayerMode) {
        return;
    }

    socket.emit('game-over', {
        roomCode: window.multiplayerRoomCode,
        score: score,
        round: round
    });

    // 동기화 중지
    stopGameStateSync();
}

// 다른 플레이어 필드 업데이트
function updateOtherPlayerField(playerId, gameState) {
    // 다른 플레이어 필드 뷰어가 있으면 업데이트
    const playerFieldContainer = document.getElementById('other-players-fields');
    if (!playerFieldContainer) return;

    let playerField = document.getElementById(`player-field-${playerId}`);

    if (!playerField) {
        // 새 플레이어 필드 생성
        playerField = document.createElement('div');
        playerField.id = `player-field-${playerId}`;
        playerField.className = 'other-player-field';
        playerFieldContainer.appendChild(playerField);
    }

    // 플레이어 정보 표시
    const playerInfo = currentRoom?.players.find(p => p.id === playerId);
    const playerName = playerInfo ? playerInfo.name : '플레이어';

    playerField.innerHTML = `
        <div class="player-field-header">
            <span class="player-field-name">${playerName}</span>
            <span class="player-field-round">Round ${gameState.round}</span>
        </div>
        <div class="player-field-stats">
            <span>💰 ${formatNumber(gameState.gold)}</span>
            <span>👾 ${gameState.monsters || 0}</span>
        </div>
    `;

    // 클릭 이벤트 추가 (상세 정보 패널)
    playerField.style.cursor = 'pointer';
    playerField.onclick = () => {
        showPlayerDetailPanel(playerId, playerName, gameState);
    };
}

// 타워 표시 이름 가져오기
function getTowerDisplayName(tower) {
    const rarityNames = {
        'COMMON': '일반',
        'UNCOMMON': '희귀',
        'RARE': '레어',
        'EPIC': '에픽',
        'UNIQUE': '유니크',
        'LEGENDARY': '레전드',
        'MYTHIC': '미스틱',
        'DIVINE': '신화',
        'TRANSCENDENT': '초월'
    };

    const typeNames = {
        'STANDARD': '일반',
        'SPLASH': '스플래시',
        'SNIPER': '저격'
    };

    const rarity = rarityNames[tower.rarity] || tower.rarity;
    const type = typeNames[tower.type] || tower.type;

    return `${rarity} ${type} 타워`;
}

// 플레이어 상세 정보 패널
function showPlayerDetailPanel(playerId, playerName, gameState) {
    // 기존 패널 제거
    let panel = document.getElementById('player-detail-panel');
    if (panel) {
        panel.remove();
    }

    // 새 패널 생성
    panel = document.createElement('div');
    panel.id = 'player-detail-panel';

    // 타워 목록 생성
    let towerListHTML = '';
    if (gameState.towers && gameState.towers.length > 0) {
        const towerCounts = {};
        gameState.towers.forEach(tower => {
            const key = `${tower.rarity}-${tower.type}`;
            towerCounts[key] = (towerCounts[key] || 0) + 1;
        });

        for (const [key, count] of Object.entries(towerCounts)) {
            const [rarity, type] = key.split('-');
            const rarityColor = {
                'COMMON': '#9CA3AF', 'UNCOMMON': '#10B981', 'RARE': '#3B82F6',
                'EPIC': '#8B5CF6', 'UNIQUE': '#EC4899', 'LEGENDARY': '#F59E0B',
                'MYTHIC': '#A855F7', 'DIVINE': '#EC4899', 'TRANSCENDENT': '#EF4444'
            }[rarity] || '#9CA3AF';

            towerListHTML += `
                <div style="border-left: 3px solid ${rarityColor}; padding: 8px; margin-bottom: 5px; background: rgba(45, 55, 72, 0.5); border-radius: 4px; display: flex; justify-content: space-between;">
                    <span>${getTowerDisplayName({ rarity, type })}</span>
                    <span style="font-weight: bold;">x${count}</span>
                </div>
            `;
        }
    } else {
        towerListHTML = '<p style="text-align: center; color: #718096;">타워 없음</p>';
    }

    panel.innerHTML = `
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #4A5568;">
                <h2 style="margin: 0; font-size: 1.5em;">👤 ${playerName}</h2>
                <button onclick="this.closest('#player-detail-panel').remove()" style="background: none; border: none; color: white; font-size: 1.5em; cursor: pointer; padding: 5px 10px;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.85em; color: #E2E8F0; margin-bottom: 5px;">라운드</div>
                    <div style="font-size: 1.8em; font-weight: bold;">${gameState.round}</div>
                </div>
                <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.85em; color: #E2E8F0; margin-bottom: 5px;">골드</div>
                    <div style="font-size: 1.8em; font-weight: bold;">💰 ${formatNumber(gameState.gold)}</div>
                </div>
                <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.85em; color: #E2E8F0; margin-bottom: 5px;">몬스터</div>
                    <div style="font-size: 1.8em; font-weight: bold;">👾 ${gameState.monsters || 0}</div>
                </div>
            </div>
            
            <div>
                <h3 style="margin-bottom: 15px; color: #E2E8F0;">보유 타워</h3>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${towerListHTML}
                </div>
            </div>
        </div>
    `;

    panel.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center;
        align-items: center; z-index: 10000; opacity: 0; transition: opacity 0.3s ease;
    `;

    document.body.appendChild(panel);
    setTimeout(() => { panel.style.opacity = '1'; }, 10);

    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.style.opacity = '0';
            setTimeout(() => panel.remove(), 300);
        }
    });

    console.log(`📊 ${playerName} 상세 정보 표시`);
}

// 초기화
if (typeof window !== 'undefined') {
    window.setupMultiplayerGameListeners = setupMultiplayerGameListeners;
    window.startGameStateSync = startGameStateSync;
    window.stopGameStateSync = stopGameStateSync;
    window.sendSpeedChange = sendSpeedChange;
    window.applySpeedChange = applySpeedChange;
    window.notifyTowerAcquired = notifyTowerAcquired;
    window.notifyGameOver = notifyGameOver;
    window.showPlayerDetailPanel = showPlayerDetailPanel;
}
