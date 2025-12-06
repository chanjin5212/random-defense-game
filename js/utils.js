// 유틸리티 함수들

// 한국식 숫자 포맷팅
function formatNumber(num) {
    if (num >= 100000000) {
        return (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
}

// 거리 계산
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 각도 계산
function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// 랜덤 정수
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 랜덤 선택
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 경로 상의 위치 계산
function getPositionOnPath(progress) {
    const path = CONFIG.PATH.points;
    const totalSegments = path.length - 1;
    const segmentProgress = progress * totalSegments;
    const currentSegment = Math.floor(segmentProgress);
    const segmentFraction = segmentProgress - currentSegment;

    if (currentSegment >= totalSegments) {
        return path[path.length - 1];
    }

    const start = path[currentSegment];
    const end = path[currentSegment + 1];

    return {
        x: start.x + (end.x - start.x) * segmentFraction,
        y: start.y + (end.y - start.y) * segmentFraction
    };
}

// 경로 총 길이 계산
function getPathLength() {
    const path = CONFIG.PATH.points;
    let totalLength = 0;

    for (let i = 0; i < path.length - 1; i++) {
        totalLength += distance(
            path[i].x, path[i].y,
            path[i + 1].x, path[i + 1].y
        );
    }

    return totalLength;
}

// 몬스터 HP 계산
function calculateMonsterHP(round) {
    return Math.floor(CONFIG.MONSTER.BASE_HP * Math.pow(CONFIG.MONSTER.HP_SCALING, round - 1));
}

// 몬스터 속도 계산
function calculateMonsterSpeed(round) {
    const speedRange = CONFIG.MONSTER.MAX_SPEED - CONFIG.MONSTER.BASE_SPEED;
    const speedIncrease = (speedRange / (CONFIG.GAME.MAX_ROUNDS - 1)) * (round - 1);
    return CONFIG.MONSTER.BASE_SPEED + speedIncrease;
}

// 몬스터 골드 드랍 계산
function calculateGoldDrop(round) {
    return Math.floor(CONFIG.MONSTER.BASE_GOLD + (round / CONFIG.MONSTER.GOLD_SCALING));
}

// 보스 HP 계산
function calculateBossHP(round) {
    const bossIndex = CONFIG.BOSS.ROUNDS.indexOf(round);
    return Math.floor(CONFIG.BOSS.BASE_HP * Math.pow(CONFIG.BOSS.HP_SCALING, bossIndex));
}

// 보스 라운드 확인
function isBossRound(round) {
    return CONFIG.BOSS.ROUNDS.includes(round);
}

// 보스 능력 가져오기
function getBossAbilities(round) {
    return CONFIG.BOSS.ABILITIES[round] || [];
}

// 보스 보상 가져오기
function getBossReward(round) {
    return CONFIG.BOSS.REWARDS[round] || 0;
}

// 업그레이드 비용 계산
function calculateUpgradeCost(upgradeKey, currentLevel) {
    const upgrade = CONFIG.UPGRADES[upgradeKey];
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costScaling, currentLevel));
}

// 토스트 알림 표시
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// 로컬 스토리지 저장
function saveGame(data) {
    try {
        localStorage.setItem('randomDefenseGame', JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('저장 실패:', e);
        return false;
    }
}

// 로컬 스토리지 로드
function loadGame() {
    try {
        const data = localStorage.getItem('randomDefenseGame');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('로드 실패:', e);
        return null;
    }
}

// 파티클 클래스
class Particle {
    constructor(x, y, color, velocity = { x: 0, y: 0 }) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = randomInt(2, 5);
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.1; // 중력
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 투사체 클래스
class Projectile {
    constructor(x, y, targetX, targetY, damage, color = '#3B82F6') {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.color = color;
        this.speed = 10;
        this.size = 5;

        const ang = angle(x, y, targetX, targetY);
        this.vx = Math.cos(ang) * this.speed;
        this.vy = Math.sin(ang) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    hasReachedTarget() {
        return distance(this.x, this.y, this.targetX, this.targetY) < this.speed;
    }
}

// 디버그 로그
function debugLog(...args) {
    if (window.DEBUG_MODE) {
        console.log('[DEBUG]', ...args);
    }
}

// 성능 측정
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }

    getFPS() {
        return this.fps;
    }
}

// 이징 함수
const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};

// 색상 유틸리티
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 배열 셔플
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 클램프 (값 제한)
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 선형 보간
function lerp(start, end, t) {
    return start + (end - start) * t;
}
