// Socket.IO 클라이언트 초기화
let socket = null;
let isConnected = false;

// 서버 연결
function initializeSocket() {
    if (socket && isConnected) {
        return socket;
    }

    // 서버 URL (개발 환경)
    const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://localhost:3000`
        : window.location.origin;

    socket = io(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    // 연결 성공
    socket.on('connect', () => {
        console.log('✅ 서버 연결 성공:', socket.id);
        isConnected = true;

        // 연결 상태 UI 업데이트 (선택사항)
        updateConnectionStatus(true);

        // 멀티플레이 리스너 자동 설정
        if (typeof setupMultiplayerRoomListeners === 'function') {
            setupMultiplayerRoomListeners();
        }
        if (typeof setupMultiplayerGameListeners === 'function') {
            setupMultiplayerGameListeners();
        }
        if (typeof setupMultiplayerNotifications === 'function') {
            setupMultiplayerNotifications();
        }
    });

    // 연결 끊김
    socket.on('disconnect', (reason) => {
        console.log('❌ 서버 연결 끊김:', reason);
        isConnected = false;

        updateConnectionStatus(false);

        if (reason === 'io server disconnect') {
            // 서버가 연결을 끊음 - 수동 재연결
            socket.connect();
        }
    });

    // 재연결 시도
    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 재연결 시도 ${attemptNumber}...`);
    });

    // 재연결 성공
    socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ 재연결 성공 (${attemptNumber}번째 시도)`);
        isConnected = true;
        updateConnectionStatus(true);
    });

    // 재연결 실패
    socket.on('reconnect_failed', () => {
        console.error('❌ 재연결 실패');
        showToast('서버 연결에 실패했습니다. 페이지를 새로고침해주세요.', 'error');
    });

    // 연결 에러
    socket.on('connect_error', (error) => {
        console.error('❌ 연결 에러:', error);
        isConnected = false;
        updateConnectionStatus(false);
    });

    return socket;
}

// 연결 상태 UI 업데이트
function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('connection-status');
    if (statusIndicator) {
        if (connected) {
            statusIndicator.textContent = '🟢 연결됨';
            statusIndicator.style.color = '#10B981';
        } else {
            statusIndicator.textContent = '🔴 연결 끊김';
            statusIndicator.style.color = '#EF4444';
        }
    }
}

// Socket 가져오기
function getSocket() {
    if (!socket || !isConnected) {
        initializeSocket();
    }
    return socket;
}

// 연결 상태 확인
function isSocketConnected() {
    return socket && isConnected;
}

// 연결 해제
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnected = false;
    }
}
