class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomCode -> room object
        this.playerRooms = new Map(); // playerId -> roomCode
    }

    // 8자리 랜덤 코드 생성
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 중복 체크
        if (this.rooms.has(code)) {
            return this.generateRoomCode();
        }

        return code;
    }

    // 방 생성
    createRoom(playerId, playerName) {
        const roomCode = this.generateRoomCode();

        const room = {
            code: roomCode,
            host: playerId,
            players: [{
                id: playerId,
                name: playerName,
                isHost: true,
                gameState: null
            }],
            status: 'waiting', // waiting, playing, finished
            createdAt: Date.now(),
            maxPlayers: 8
        };

        this.rooms.set(roomCode, room);
        this.playerRooms.set(playerId, roomCode);

        return {
            success: true,
            roomCode: roomCode,
            players: room.players
        };
    }

    // 방 입장
    joinRoom(roomCode, playerId, playerName) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            return {
                success: false,
                message: '존재하지 않는 방입니다.'
            };
        }

        if (room.status !== 'waiting') {
            return {
                success: false,
                message: '이미 게임이 진행 중입니다.'
            };
        }

        if (room.players.length >= room.maxPlayers) {
            return {
                success: false,
                message: '방이 가득 찼습니다.'
            };
        }

        // 이미 방에 있는지 체크
        if (room.players.some(p => p.id === playerId)) {
            return {
                success: false,
                message: '이미 방에 있습니다.'
            };
        }

        const newPlayer = {
            id: playerId,
            name: playerName,
            isHost: false,
            gameState: null
        };

        room.players.push(newPlayer);
        this.playerRooms.set(playerId, roomCode);

        return {
            success: true,
            players: room.players,
            newPlayer: newPlayer,
            isHost: false
        };
    }

    // 방 나가기
    leaveRoom(roomCode, playerId) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            return { success: false };
        }

        // 플레이어 제거
        room.players = room.players.filter(p => p.id !== playerId);
        this.playerRooms.delete(playerId);

        // 방이 비었으면 삭제
        if (room.players.length === 0) {
            this.rooms.delete(roomCode);
            return {
                success: true,
                roomDeleted: true
            };
        }

        // 방장이 나갔으면 다음 사람에게 방장 권한 이전
        let newHost = null;
        if (room.host === playerId) {
            room.host = room.players[0].id;
            room.players[0].isHost = true;
            newHost = room.players[0];
        }

        return {
            success: true,
            roomDeleted: false,
            players: room.players,
            newHost: newHost
        };
    }

    // 게임 시작
    startGame(roomCode, playerId) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            return {
                success: false,
                message: '존재하지 않는 방입니다.'
            };
        }

        if (room.host !== playerId) {
            return {
                success: false,
                message: '방장만 게임을 시작할 수 있습니다.'
            };
        }

        if (room.status !== 'waiting') {
            return {
                success: false,
                message: '이미 게임이 진행 중입니다.'
            };
        }

        room.status = 'playing';

        return {
            success: true
        };
    }

    // 플레이어가 속한 방 찾기
    findRoomByPlayerId(playerId) {
        return this.playerRooms.get(playerId) || null;
    }

    // 방 정보 가져오기
    getRoom(roomCode) {
        return this.rooms.get(roomCode) || null;
    }

    // 플레이어 게임 상태 업데이트
    updatePlayerGameState(roomCode, playerId, gameState) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            return false;
        }

        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.gameState = gameState;
            return true;
        }

        return false;
    }

    // 방의 모든 플레이어 상태 가져오기
    getAllPlayerStates(roomCode) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            return [];
        }

        return room.players.map(p => ({
            id: p.id,
            name: p.name,
            gameState: p.gameState
        }));
    }
}

module.exports = RoomManager;
