// 유틸리티 함수들

// 알파벳 숫자 포맷팅 (1a = 1,000)
function formatNumber(num) {
    if (num === 0) return '0';
    if (num < 1000) return Math.floor(num).toString();

    const units = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    // 1000 = 1a, 1,000,000 = 1b, ... (10^3 단위)
    const order = Math.floor(Math.log10(num) / 3);
    const unitName = units[order - 1] || '?';

    // 유효숫자 처리 (ex: 1.2a)
    const val = num / Math.pow(1000, order);

    // 소수점 제거 (정수부만 표시하거나 깔끔하게)
    // 10보다 작으면 소수점 1자리, 아니면 정수
    if (val < 10) {
        return val.toFixed(1) + unitName;
    } else {
        return Math.floor(val) + unitName;
    }
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
    // 마리당 1원 고정
    return CONFIG.MONSTER.BASE_GOLD;
}

// 보스 HP 계산
function calculateBossHP(round) {
    // 20라운드마다 보스가 나오므로, 해당 라운드의 몬스터 체력을 기준으로 뻥튀기
    // 보스는 몬스터의 100배 체력
    const monsterHP = calculateMonsterHP(round);
    return monsterHP * 100;
}

// 보스 라운드 확인
function isBossRound(round) {
    return round > 0 && round % CONFIG.BOSS.INTERVAL === 0;
}

// 보스 능력 가져오기
function getBossAbilities(round) {
    // 라운드가 진행될수록 능력 추가
    const bossCount = Math.floor(round / CONFIG.BOSS.INTERVAL);
    const abilities = [];

    if (bossCount >= 1) abilities.push('regen');
    if (bossCount >= 2) abilities.push('shield');
    if (bossCount >= 3) abilities.push('split');

    return abilities;
}

// 보스 보상 가져오기
function getBossReward(round) {
    const baseReward = CONFIG.BOSS.REWARDS.DEFAULT || 1000;
    const bossCount = Math.max(1, Math.floor(round / CONFIG.BOSS.INTERVAL));
    return baseReward * bossCount; // 보스 잡을 때마다 보상 증가
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

    // 최대 5개까지만 표시, 초과하면 가장 오래된 것 제거
    const maxToasts = 5;
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length > maxToasts) {
        const oldestToast = toasts[0];
        oldestToast.style.opacity = '0';
        setTimeout(() => {
            if (oldestToast.parentNode) {
                container.removeChild(oldestToast);
            }
        }, 300);
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 레전드 이상 등급 축하 효과
function showLegendaryCelebration(towerName, rarityName, rarityKey, rarityColor) {
    // 화면 중앙에 큰 축하 메시지 표시
    const celebration = document.createElement('div');
    celebration.className = 'legendary-celebration';
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        text-align: center;
        pointer-events: none;
    `;

    // 등급별 이모지와 효과
    let emoji = '⭐';
    let glowIntensity = '20px';
    let scale = 'scale(1)';

    if (rarityKey === 'LEGENDARY') {
        emoji = '🌟';
        glowIntensity = '25px';
        scale = 'scale(1.1)';
    } else if (rarityKey === 'MYTHIC') {
        emoji = '✨';
        glowIntensity = '30px';
        scale = 'scale(1.2)';
    } else if (rarityKey === 'DIVINE') {
        emoji = '💫';
        glowIntensity = '35px';
        scale = 'scale(1.3)';
    } else if (rarityKey === 'TRANSCENDENT') {
        emoji = '🌠';
        glowIntensity = '40px';
        scale = 'scale(1.4)';
    }

    celebration.innerHTML = `
        <div style="
            font-size: 3em;
            margin-bottom: 10px;
            animation: celebrate-bounce 0.6s ease-out;
        ">${emoji}</div>
        <div style="
            font-size: 2em;
            font-weight: bold;
            color: ${rarityColor};
            text-shadow: 0 0 ${glowIntensity} ${rarityColor}, 0 0 ${glowIntensity} ${rarityColor};
            margin-bottom: 10px;
            animation: celebrate-glow 1.5s ease-in-out infinite;
        ">${rarityName}</div>
        <div style="
            font-size: 1.5em;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            animation: celebrate-fade-in 0.8s ease-out;
        ">${towerName}</div>
    `;

    document.body.appendChild(celebration);

    // 애니메이션 후 제거
    setTimeout(() => {
        celebration.style.animation = 'celebrate-fade-out 0.5s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(celebration);
        }, 500);
    }, 3000);

    // 배경 플래시 효과
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, ${rarityColor}33 0%, transparent 70%);
        z-index: 9999;
        pointer-events: none;
        animation: celebrate-flash 0.5s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => document.body.removeChild(flash), 500);
}

// 로컬 스토리지 저장 (비활성화)
function saveGame(data) {
    // localStorage.setItem('randomDefenseGame', JSON.stringify(data));
    return true;
}

// 로컬 스토리지 로드 (비활성화 - 항상 초기화)
function loadGame() {
    // try {
    //     const data = localStorage.getItem('randomDefenseGame');
    //     return data ? JSON.parse(data) : null;
    // } catch (e) {
    //     console.error('로드 실패:', e);
    //     return null;
    // }
    return null;
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
    constructor(x, y, targetX, targetY, damage, color = '#3B82F6', type = 'normal') {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.damage = damage;
        this.color = color;
        this.type = type; // 'normal', 'meteor', 'armageddon', 'laser'
        this.onHit = null; // 타격 시 콜백

        // 메테오/아마겟돈 속도 및 크기 조절
        if (type === 'meteor') {
            this.speed = 8;
            this.size = 20;
        } else if (type === 'armageddon') {
            this.speed = 4; // 웅장하게 천천히
            this.size = 80; // 매우 거대함
        } else {
            this.speed = 10;
            this.size = 5;
        }

        const ang = angle(x, y, targetX, targetY);
        this.vx = Math.cos(ang) * this.speed;
        this.vy = Math.sin(ang) * this.speed;

        // 메테오/아마겟돈 트레일 효과용
        this.trail = [];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'meteor' || this.type === 'armageddon') {
            this.trail.push({ x: this.x, y: this.y, life: 1.0 });
            if (this.trail.length > 15) this.trail.shift();
            // 트레일 수명 감소
            this.trail.forEach(t => t.life -= 0.05);
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'meteor' || this.type === 'armageddon') {
            const isArmageddon = this.type === 'armageddon';

            // 트레일
            this.trail.forEach(t => {
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * t.life * (isArmageddon ? 0.9 : 0.6), 0, Math.PI * 2);
                ctx.fillStyle = isArmageddon
                    ? `rgba(255, 50, 50, ${t.life * 0.7})`
                    : `rgba(255, 100, 0, ${t.life * 0.6})`;
                ctx.fill();
            });

            // 본체
            ctx.shadowBlur = isArmageddon ? 50 : 30;
            ctx.shadowColor = isArmageddon ? '#FF0000' : '#FF4500';
            ctx.fillStyle = isArmageddon ? '#FFFFFF' : '#FFFF00'; // 아마겟돈 핵은 흰색

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // 외곽
            ctx.strokeStyle = isArmageddon ? '#8B0000' : '#FF0000';
            ctx.lineWidth = isArmageddon ? 5 : 3;
            ctx.stroke();
        } else {
            // 일반 투사체
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    hasReachedTarget() {
        return distance(this.x, this.y, this.targetX, this.targetY) < this.speed;
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
