const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./server/roomManager');
const GameSync = require('./server/gameSync');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(__dirname));

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 방 관리자 및 게임 동기화 초기화
const roomManager = new RoomManager();
const gameSync = new GameSync(io, roomManager);

// Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log(`✅ 플레이어 연결: ${socket.id}`);

    // 방 생성
    socket.on('create-room', (data) => {
        const { playerName } = data;
        const result = roomManager.createRoom(socket.id, playerName);

        if (result.success) {
            socket.join(result.roomCode);
            socket.emit('room-created', {
                roomCode: result.roomCode,
                players: result.players,
                isHost: true
            });
            console.log(`🏠 방 생성: ${result.roomCode} by ${playerName}`);
        } else {
            socket.emit('room-error', { message: result.message });
        }
    });

    // 방 입장
    socket.on('join-room', (data) => {
        const { roomCode, playerName } = data;
        const result = roomManager.joinRoom(roomCode, socket.id, playerName);

        if (result.success) {
            socket.join(roomCode);

            // 입장한 플레이어에게 알림
            socket.emit('room-joined', {
                roomCode: roomCode,
                players: result.players,
                isHost: result.isHost
            });

            // 방의 다른 플레이어들에게 알림
            socket.to(roomCode).emit('player-joined', {
                player: result.newPlayer
            });

            console.log(`👋 ${playerName} 입장: ${roomCode}`);
        } else {
            socket.emit('room-error', { message: result.message });
        }
    });

    // 방 나가기
    socket.on('leave-room', (data) => {
        const { roomCode } = data;
        handlePlayerLeave(socket, roomCode);
    });

    // 게임 시작
    socket.on('start-game', (data) => {
        const { roomCode } = data;
        const result = roomManager.startGame(roomCode, socket.id);

        if (result.success) {
            io.to(roomCode).emit('game-started', { roomCode });
            console.log(`🎮 게임 시작: ${roomCode}`);
        } else {
            socket.emit('room-error', { message: result.message });
        }
    });

    // 타워 획득 (고급 타워만)
    socket.on('tower-acquired', (data) => {
        gameSync.handleTowerAcquired(socket, data);
    });

    // 게임 상태 업데이트
    socket.on('game-state-update', (data) => {
        gameSync.handleGameStateUpdate(socket, data);
    });

    // 게임 종료
    socket.on('game-over', (data) => {
        gameSync.handleGameOver(socket, data);
    });

    // 게임 속도 변경 (방장만)
    socket.on('speed-change', (data) => {
        const { roomCode, speed } = data;
        const room = roomManager.rooms.get(roomCode);

        if (!room) {
            socket.emit('room-error', { message: '방을 찾을 수 없습니다.' });
            return;
        }

        // 방장 확인
        if (room.host !== socket.id) {
            socket.emit('room-error', { message: '방장만 속도를 변경할 수 있습니다.' });
            return;
        }

        // 방의 모든 플레이어에게 속도 변경 브로드캐스트
        io.to(roomCode).emit('speed-changed', { speed });
        console.log(`⚡ 속도 변경: ${roomCode} -> ${speed}x`);
    });

    // 연결 끊김
    socket.on('disconnect', () => {
        console.log(`❌ 플레이어 연결 끊김: ${socket.id}`);

        // 플레이어가 속한 방 찾기
        const roomCode = roomManager.findRoomByPlayerId(socket.id);
        if (roomCode) {
            handlePlayerLeave(socket, roomCode);
        }
    });
});

// 플레이어 퇴장 처리 함수
function handlePlayerLeave(socket, roomCode) {
    const result = roomManager.leaveRoom(roomCode, socket.id);

    if (result.success) {
        socket.leave(roomCode);

        if (result.roomDeleted) {
            console.log(`🗑️ 방 삭제: ${roomCode}`);
        } else {
            // 남은 플레이어들에게 알림
            io.to(roomCode).emit('player-left', {
                playerId: socket.id,
                players: result.players,
                newHost: result.newHost
            });
            console.log(`👋 플레이어 퇴장: ${roomCode}`);
        }
    }
}

// 서버 시작
server.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO 준비 완료`);
});
