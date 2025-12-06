// 게임 설정 및 상수 (간소화 버전)

const CONFIG = {
    // 게임 기본 설정
    GAME: {
        MAX_ROUNDS: 100,
        ROUND_DURATION: 30, // 초
        GRID_ROWS: 5, // 그리드 행 수
        GRID_COLS: 8, // 그리드 열 수
        TOWERS_PER_SLOT: 10, // 각 칸당 최대 타워 수
        CANVAS_WIDTH: 1200,
        CANVAS_HEIGHT: 700,
        FPS: 60
    },

    // 경제 설정
    ECONOMY: {
        STARTING_GOLD: 50,
        SINGLE_PULL_COST: 10,
        TEN_PULL_COST: 90,
        MISSION_BOSS_COOLDOWN: 60, // 초
        SELL_REFUND_PERCENT: 0.5 // 판매 시 50% 환불
    },

    // 등급 시스템
    RARITY: {
        COMMON: { name: '일반', multiplier: 1.0, color: '#9CA3AF', probability: 0.60 },
        UNCOMMON: { name: '희귀', multiplier: 1.2, color: '#10B981', probability: 0.20 },
        RARE: { name: '레어', multiplier: 1.5, color: '#3B82F6', probability: 0.10 },
        EPIC: { name: '에픽', multiplier: 2.0, color: '#8B5CF6', probability: 0.05 },
        UNIQUE: { name: '유니크', multiplier: 2.7, color: '#F59E0B', probability: 0.03 },
        LEGENDARY: { name: '레전드', multiplier: 3.5, color: '#EF4444', probability: 0.015 },
        MYTHIC: { name: '미스틱', multiplier: 4.5, color: '#EC4899', probability: 0.004 },
        DIVINE: { name: '신화', multiplier: 6.0, color: '#FBBF24', probability: 0.0009 },
        TRANSCENDENT: { name: '초월', multiplier: 8.0, color: '#06B6D4', probability: 0.0001 }
    },

    // 타워 정의 (5종류만)
    TOWERS: {
        SINGLE: {
            id: 1,
            name: '단일 타워',
            type: 'attack',
            baseDamage: 10,
            attackSpeed: 1.0,
            range: 450,
            description: '가장 가까운 적 1명 공격',
            effect: 'single'
        },
        RAPID: {
            id: 2,
            name: '연사 타워',
            type: 'attack',
            baseDamage: 5,
            attackSpeed: 0.5,
            range: 360,
            description: '초고속 단일 연사',
            effect: 'rapid'
        },
        EXPLOSIVE: {
            id: 3,
            name: '폭발 타워',
            type: 'attack',
            baseDamage: 25,
            attackSpeed: 1.6,
            range: 420,
            description: '주변 범위 AOE 공격',
            effect: 'aoe',
            aoeRadius: 80
        },
        PIERCING: {
            id: 4,
            name: '관통 타워',
            type: 'attack',
            baseDamage: 12,
            attackSpeed: 1.2,
            range: 540,
            description: '일직선 관통 4명',
            effect: 'pierce',
            pierceCount: 4
        },
        SNIPER: {
            id: 5,
            name: '저격 타워',
            type: 'attack',
            baseDamage: 35,
            attackSpeed: 2.2,
            range: 750,
            description: '체력 가장 높은 적 우선 공격',
            effect: 'sniper'
        }
    },

    // 몬스터 스케일링
    MONSTER: {
        BASE_HP: 100,
        HP_SCALING: 1.08, // HP = 100 × (1.08 ^ (round-1))
        BASE_SPEED: 1.0,
        MAX_SPEED: 2.5,
        BASE_GOLD: 1,
        GOLD_SCALING: 15 // 1 + (round/15)
    },

    // 보스 설정
    BOSS: {
        ROUNDS: [25, 50, 75, 100],
        BASE_HP: 2000,
        HP_SCALING: 1.1, // BossHP = 2000 × (1.1 ^ (boss_round-1))
        DEFENSE: 0.3, // 30% 방어막
        SPEED_MULTIPLIER: 0.6, // 보스는 느림
        REWARDS: {
            25: 50,
            50: 150,
            75: 300,
            100: 800
        },
        ABILITIES: {
            25: ['regen'], // 체력 재생 1%/초
            50: ['shield'], // 실드 (피해 50% 감소, 5초 간격)
            75: ['split'], // 분열 (죽을 때 2마리 스폰)
            100: ['regen', 'shield', 'split'] // 모든 능력
        }
    },

    // 계정 스탯 업그레이드
    UPGRADES: {
        ATK_PERCENT: {
            name: '공격력%',
            baseCost: 10,
            costScaling: 1.12,
            maxLevel: 200,
            valuePerLevel: 1 // 1% per level
        },
        ASPD_PERCENT: {
            name: '공격속도%',
            baseCost: 12,
            costScaling: 1.12,
            maxLevel: 50,
            valuePerLevel: 1
        },
        CRIT_RATE: {
            name: '크리율%',
            baseCost: 15,
            costScaling: 1.12,
            maxLevel: 30,
            valuePerLevel: 1
        },
        CRIT_DAMAGE: {
            name: '크리뎀%',
            baseCost: 15,
            costScaling: 1.12,
            maxLevel: 100,
            valuePerLevel: 1
        },
        BOSS_DAMAGE: {
            name: '보스뎀%',
            baseCost: 10,
            costScaling: 1.12,
            maxLevel: 50,
            valuePerLevel: 1
        },
        STARTING_GOLD: {
            name: '시작 골드',
            baseCost: 8,
            costScaling: 1.12,
            maxLevel: 50,
            valuePerLevel: 1
        }
    },

    // 배틀패스
    BATTLEPASS: {
        MAX_TIER: 30,
        XP_PER_TIER: 100,
        XP_PER_ROUND: 5
    },

    // 맵 경로 (사각형 루트)
    PATH: {
        points: [
            { x: 100, y: 100 },   // 시작 (좌상단)
            { x: 1100, y: 100 },  // 우상단
            { x: 1100, y: 600 },  // 우하단
            { x: 100, y: 600 },   // 좌하단
            { x: 100, y: 100 }    // 다시 좌상단 (루프)
        ]
    },

    // 그리드 영역 (타워 배치 가능 영역)
    GRID_AREA: {
        x: 200,
        y: 150,
        width: 800,
        height: 400,
        cellWidth: 100,
        cellHeight: 80
    }
};

// 등급 배열 (가챠용)
const RARITY_ARRAY = [];
Object.keys(CONFIG.RARITY).forEach(key => {
    const rarity = CONFIG.RARITY[key];
    const count = Math.round(rarity.probability * 10000);
    for (let i = 0; i < count; i++) {
        RARITY_ARRAY.push(key);
    }
});

// 타워 배열 (가챠용)
const TOWER_ARRAY = Object.keys(CONFIG.TOWERS);
