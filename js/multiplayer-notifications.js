// 멀티플레이 알림 시스템
let notificationQueue = [];
let isShowingNotification = false;

// 타워 획득 알림 리스너 설정
function setupMultiplayerNotifications() {
    const socket = getSocket();

    // 기존 리스너 제거 (재연결 시 중복 방지)
    socket.off('tower-notification');

    socket.on('tower-notification', (data) => {
        showTowerNotification(data.playerName, data.tower);
    });

    console.log('✅ 알림 리스너 설정 완료');
}

// 타워 획득 알림 표시
function showTowerNotification(playerName, tower) {
    const notification = {
        playerName: playerName,
        tower: tower
    };

    notificationQueue.push(notification);

    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

// 알림 큐 처리
function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const notification = notificationQueue.shift();

    displayNotification(notification);
}

// 알림 표시
function displayNotification(notification) {
    const { playerName, tower } = notification;

    // 알림 컨테이너 가져오기 또는 생성
    let container = document.getElementById('multiplayer-notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'multiplayer-notification-container';
        document.body.appendChild(container);
    }

    // 알림 요소 생성
    const notificationEl = document.createElement('div');
    notificationEl.className = 'multiplayer-notification';

    // 등급별 색상
    const rarityColors = {
        'LEGENDARY': '#F59E0B',
        'MYTHIC': '#A855F7',
        'DIVINE': '#EC4899',
        'TRANSCENDENT': '#EF4444'
    };

    const color = rarityColors[tower.rarity] || '#10B981';

    // 등급별 이모지
    const rarityEmojis = {
        'LEGENDARY': '⭐',
        'MYTHIC': '✨',
        'DIVINE': '💫',
        'TRANSCENDENT': '🌟'
    };

    const emoji = rarityEmojis[tower.rarity] || '🎉';

    notificationEl.innerHTML = `
        <div class="notification-icon" style="color: ${color};">${emoji}</div>
        <div class="notification-content">
            <div class="notification-player">${playerName}님이</div>
            <div class="notification-tower" style="color: ${color};">${tower.name}</div>
            <div class="notification-text">을(를) 획득했습니다!</div>
        </div>
    `;

    // 컨테이너에 추가
    container.appendChild(notificationEl);

    // 애니메이션 시작
    setTimeout(() => {
        notificationEl.classList.add('show');
    }, 10);

    // 3초 후 사라짐
    setTimeout(() => {
        notificationEl.classList.remove('show');
        notificationEl.classList.add('hide');

        // 애니메이션 완료 후 제거
        setTimeout(() => {
            notificationEl.remove();

            // 다음 알림 처리
            processNotificationQueue();
        }, 500);
    }, 3000);
}

// 초기화
if (typeof window !== 'undefined') {
    window.setupMultiplayerNotifications = setupMultiplayerNotifications;
    window.showTowerNotification = showTowerNotification;
}
