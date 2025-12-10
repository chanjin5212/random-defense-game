// 멀티플레이 방 관리
let currentRoom = null;
let currentPlayerName = '';
let isRoomHost = false;

// 방 생성
function createMultiplayerRoom(playerName) {
    const socket = getSocket();

    if (!isSocketConnected()) {
        showToast('서버에 연결되지 않았습니다.', 'error');
        return;
    }

    currentPlayerName = playerName;

    socket.emit('create-room', { playerName });

    // 로딩 표시
    showToast('방 생성 중...', 'info');
}

// 방 입장
function joinMultiplayerRoom(roomCode, playerName) {
    const socket = getSocket();

    if (!isSocketConnected()) {
        showToast('서버에 연결되지 않았습니다.', 'error');
        return;
    }

    currentPlayerName = playerName;

    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), playerName });

    // 로딩 표시
    showToast('방 입장 중...', 'info');
}

// 방 나가기
function leaveMultiplayerRoom() {
    const socket = getSocket();

    if (currentRoom) {
        socket.emit('leave-room', { roomCode: currentRoom.code });
        currentRoom = null;
        isRoomHost = false;

        // 로비로 돌아가기
        showScreen('multiplayer-lobby-screen');
    }
}

// 게임 시작 (방장만)
function startMultiplayerGame() {
    const socket = getSocket();

    if (!isRoomHost) {
        showToast('방장만 게임을 시작할 수 있습니다.', 'error');
        return;
    }

    if (currentRoom) {
        socket.emit('start-game', { roomCode: currentRoom.code });
    }
}

// Socket 이벤트 리스너 설정
function setupMultiplayerRoomListeners() {
    const socket = getSocket();

    // 기존 리스너 제거 (재연결 시 중복 방지)
    socket.off('room-created');
    socket.off('room-joined');
    socket.off('player-joined');
    socket.off('player-left');
    socket.off('game-started');
    socket.off('room-error');

    // 방 생성 완료
    socket.on('room-created', (data) => {
        console.log('🏠 방 생성 이벤트 수신:', data);
        currentRoom = {
            code: data.roomCode,
            players: data.players
        };
        isRoomHost = data.isHost;

        showToast(`방이 생성되었습니다! 코드: ${data.roomCode}`, 'success');

        // 대기실 화면으로 이동
        showWaitingRoom();
        updatePlayerList(data.players);
    });

    // 방 입장 완료
    socket.on('room-joined', (data) => {
        console.log('🚪 방 입장 이벤트 수신:', data);
        currentRoom = {
            code: data.roomCode,
            players: data.players
        };
        isRoomHost = data.isHost;

        showToast('방에 입장했습니다!', 'success');

        // 대기실 화면으로 이동
        showWaitingRoom();
        updatePlayerList(data.players);
    });

    // 새 플레이어 입장
    socket.on('player-joined', (data) => {
        if (currentRoom) {
            currentRoom.players.push(data.player);
            updatePlayerList(currentRoom.players);
            showToast(`${data.player.name}님이 입장했습니다.`, 'info');
        }
    });

    // 플레이어 퇴장
    socket.on('player-left', (data) => {
        if (currentRoom) {
            currentRoom.players = data.players;
            updatePlayerList(data.players);

            // 방장이 바뀐 경우
            if (data.newHost && data.newHost.id === socket.id) {
                isRoomHost = true;
                showToast('방장이 되었습니다!', 'info');
                updateStartGameButton();
            }
        }
    });

    // 게임 시작
    socket.on('game-started', (data) => {
        showToast('게임이 시작됩니다!', 'success');

        // 멀티플레이 모드로 게임 시작
        setTimeout(() => {
            startGameInMultiplayerMode();
        }, 1000);
    });

    // 에러 처리
    socket.on('room-error', (data) => {
        showToast(data.message, 'error');
    });

    console.log('✅ 멀티플레이 리스너 설정 완료');
}

// 대기실 화면 표시
function showWaitingRoom() {
    showScreen('waiting-room-screen');

    // 방 코드 표시
    const roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay && currentRoom) {
        roomCodeDisplay.textContent = currentRoom.code;
    }

    // 게임 시작 버튼 상태 업데이트
    updateStartGameButton();
}

// 플레이어 목록 업데이트
function updatePlayerList(players) {
    const playerListContainer = document.getElementById('waiting-room-player-list');
    if (!playerListContainer) return;

    playerListContainer.innerHTML = '';

    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';

        const hostBadge = player.isHost ? '<span class="host-badge">👑 방장</span>' : '';

        playerCard.innerHTML = `
            <div class="player-name">${player.name} ${hostBadge}</div>
            <div class="player-status">대기 중</div>
        `;

        playerListContainer.appendChild(playerCard);
    });
}

// 게임 시작 버튼 상태 업데이트
function updateStartGameButton() {
    const startButton = document.getElementById('start-multiplayer-game-btn');
    if (!startButton) return;

    if (isRoomHost) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.cursor = 'pointer';
    } else {
        startButton.disabled = true;
        startButton.style.opacity = '0.5';
        startButton.style.cursor = 'not-allowed';
    }
}

// 멀티플레이 모드로 게임 시작
function startGameInMultiplayerMode() {
    // 게임 화면으로 전환
    showScreen('game-screen');

    // 멀티플레이 모드 플래그 설정
    window.isMultiplayerMode = true;
    window.multiplayerRoomCode = currentRoom.code;

    // 게임 초기화 및 시작
    if (typeof initGame === 'function') {
        initGame();
    }
    if (typeof startGame === 'function') {
        startGame();
    }

    // 게임 상태 동기화 시작
    if (typeof startGameStateSync === 'function') {
        startGameStateSync();
        console.log('🔄 게임 상태 동기화 시작');
    }
}

// 초기화
if (typeof window !== 'undefined') {
    window.createMultiplayerRoom = createMultiplayerRoom;
    window.joinMultiplayerRoom = joinMultiplayerRoom;
    window.leaveMultiplayerRoom = leaveMultiplayerRoom;
    window.startMultiplayerGame = startMultiplayerGame;
    window.setupMultiplayerRoomListeners = setupMultiplayerRoomListeners;

    // isRoomHost를 전역으로 노출 (getter 사용)
    Object.defineProperty(window, 'isRoomHost', {
        get: function () { return isRoomHost; },
        set: function (value) { isRoomHost = value; }
    });
}
