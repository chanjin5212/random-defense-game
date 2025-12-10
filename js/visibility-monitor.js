// 페이지 가시성 모니터링
let isPageVisible = true;
let backgroundTimeout = null;

// Page Visibility API 설정
function setupVisibilityMonitoring() {
    if (typeof document.hidden !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    } else if (typeof document.webkitHidden !== 'undefined') {
        document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
    }

    // 페이지 언로드 시 방 나가기
    window.addEventListener('beforeunload', handlePageUnload);
}

function handleVisibilityChange() {
    const isHidden = document.hidden || document.webkitHidden;

    if (isHidden && window.isMultiplayerMode) {
        // 탭이 백그라운드로 감 - 5초 후 자동 퇴장
        isPageVisible = false;
        console.warn('⚠️ 탭이 백그라운드로 이동 - 5초 후 자동 퇴장');

        backgroundTimeout = setTimeout(() => {
            if (!isPageVisible && window.isMultiplayerMode) {
                console.log('🚪 백그라운드 상태로 5초 경과 - 자동 퇴장');
                autoLeaveRoom('탭이 백그라운드 상태입니다');
            }
        }, 5000); // 5초 유예

    } else if (!isHidden) {
        // 탭이 다시 포그라운드로 옴 - 타이머 취소
        isPageVisible = true;
        if (backgroundTimeout) {
            clearTimeout(backgroundTimeout);
            backgroundTimeout = null;
            console.log('✅ 탭 복귀 - 자동 퇴장 취소');
        }
    }
}

function handlePageUnload() {
    if (window.isMultiplayerMode && window.multiplayerRoomCode) {
        // 페이지를 닫을 때 방 나가기
        const socket = getSocket();
        if (socket && isSocketConnected()) {
            socket.emit('leave-room', { roomCode: window.multiplayerRoomCode });
            console.log('🚪 페이지 종료 - 방 나가기');
        }
    }
}

function autoLeaveRoom(reason) {
    if (typeof leaveMultiplayerRoom === 'function') {
        showToast(reason + ' - 방에서 나갑니다', 'warning');
        setTimeout(() => {
            leaveMultiplayerRoom();
        }, 1000);
    }
}

// 초기화
if (typeof window !== 'undefined') {
    setupVisibilityMonitoring();
    window.setupVisibilityMonitoring = setupVisibilityMonitoring;
}
