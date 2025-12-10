class GameSync {
    constructor(io, roomManager) {
        this.io = io;
        this.roomManager = roomManager;

        // 고급 타워 등급 (알림을 보낼 등급)
        this.notifiableRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
    }

    // 타워 획득 처리
    handleTowerAcquired(socket, data) {
        const { roomCode, tower, playerName } = data;

        // 고급 타워인 경우에만 전체 알림
        if (this.notifiableRarities.includes(tower.rarity)) {
            this.io.to(roomCode).emit('tower-notification', {
                playerName: playerName,
                tower: {
                    rarity: tower.rarity,
                    type: tower.type,
                    name: tower.name || this.getTowerDisplayName(tower)
                }
            });

            console.log(`🎉 ${playerName}님이 ${tower.rarity} 타워 획득!`);
        }
    }

    // 게임 상태 업데이트 처리
    handleGameStateUpdate(socket, data) {
        const { roomCode, gameState } = data;

        console.log(`📥 게임 상태 수신: ${socket.id} - Round ${gameState.round}, 💰 ${gameState.gold}, 👾 ${gameState.monsters}`);

        // 플레이어 상태 저장
        this.roomManager.updatePlayerGameState(roomCode, socket.id, gameState);

        // 다른 플레이어들에게 상태 브로드캐스트
        socket.to(roomCode).emit('player-state-update', {
            playerId: socket.id,
            gameState: gameState
        });
    }

    // 게임 종료 처리
    handleGameOver(socket, data) {
        const { roomCode, score, round } = data;

        const room = this.roomManager.getRoom(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        // 다른 플레이어들에게 알림
        socket.to(roomCode).emit('player-game-over', {
            playerId: socket.id,
            playerName: player.name,
            score: score,
            round: round
        });

        console.log(`🏁 ${player.name} 게임 종료: Round ${round}, Score ${score}`);
    }

    // 타워 표시 이름 가져오기
    getTowerDisplayName(tower) {
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
}

module.exports = GameSync;
