// 게임 설정 및 상수 (간소화 버전)

const CONFIG = {
    // 게임 기본 설정
    GAME: {
        MAX_ROUNDS: Infinity, // 무한 라운드
        ROUND_DURATION: 30, // 초 (일반 라운드)
        BOSS_ROUND_DURATION: 60, // 초 (보스 라운드)
        GRID_ROWS: 3, // 그리드 행 수 (모바일 최적화)
        GRID_COLS: 4, // 그리드 열 수 (모바일 최적화)
        TOWERS_PER_SLOT: 50, // 각 칸당 최대 타워 수 (물량전)
        MAX_MONSTERS: 200, // 최대 몬스터 수 (초과 시 게임 오버)
        CANVAS_WIDTH: 800, // 모바일 너비
        CANVAS_HEIGHT: 600, // 모바일 높이
        FPS: 60
    },

    // 그래픽 설정
    GRAPHICS: {
        PARTICLE_QUALITY: 'high' // high, low, off
    },

    // 경제 설정
    ECONOMY: {
        STARTING_GOLD: 250,
        SINGLE_PULL_COST: 50,
        TEN_PULL_COST: 450,
        MISSION_BOSS_COOLDOWN: 300, // 초 (5분)
        SELL_REFUND_PERCENT: 0.5 // 판매 시 50% 환불
    },

    // 등급 시스템
    RARITY: {
        COMMON: { name: '일반', multiplier: 1.0, color: '#94A3B8', probability: 0.50, sellPrice: 5 },
        UNCOMMON: { name: '희귀', multiplier: 2.0, color: '#22C55E', probability: 0.331, sellPrice: 8 },
        RARE: { name: '레어', multiplier: 5.0, color: '#3B82F6', probability: 0.102, sellPrice: 20 },
        EPIC: { name: '에픽', multiplier: 10.0, color: '#A855F7', probability: 0.051, sellPrice: 50 },
        UNIQUE: { name: '유니크', multiplier: 50.0, color: '#E879F9', probability: 0.008, sellPrice: 100 },
        LEGENDARY: { name: '레전드', multiplier: 200.0, color: '#F43F5E', probability: 0.005, sellPrice: null }, // 판매 불가
        MYTHIC: { name: '미스틱', multiplier: 500.0, color: '#F59E0B', probability: 0.002, sellPrice: null }, // 판매 불가
        DIVINE: { name: '신화', multiplier: 1500.0, color: '#FBBF24', probability: 0.0008, sellPrice: null }, // 판매 불가
        TRANSCENDENT: { name: '초월', multiplier: 5000.0, color: '#06B6D4', probability: 0.00019, sellPrice: null } // 판매 불가
    },

    // 타워 정의 (3종류)
    TOWERS: {
        STANDARD: {
            id: 1,
            name: '일반 타워',
            type: 'attack',
            baseDamage: 40, // 20 -> 40 (2배 상향)
            attackSpeed: 0.8, // 1.0 -> 0.8 (상향)
            range: 450,
            description: '평범한 공격력과 공속',
            effect: 'single'
        },
        SPLASH: {
            id: 2,
            name: '스플래시 타워',
            type: 'attack',
            baseDamage: 10, // 4 -> 10 (2.5배 상향)
            attackSpeed: 1.2,
            range: 400,
            description: '범위 공격으로 다수 처치',
            effect: 'aoe',
            aoeRadius: 100
        },
        SNIPER: {
            id: 3,
            name: '저격 타워',
            type: 'attack',
            baseDamage: 100, // 50 -> 100 (대폭 상향)
            attackSpeed: 2.0, // 2.5 -> 2.0 (상향)
            range: 700,
            description: '강력한 단일 공격',
            effect: 'sniper'
        }
    },

    // 몬스터 스케일링
    MONSTER: {
        BASE_HP: 200,
        HP_SCALING: 1.125, // 1.15 -> 1.125 (하향 조정)
        BASE_SPEED: 1.0,
        MAX_SPEED: 2.5,
        BASE_GOLD: 1, // 마리당 1원
        GOLD_SCALING: 1, // 스케일링 없음
        ROUND_BONUS: 20 // 라운드 시작 시 20원 보너스
    },

    // 몬스터 타입
    MONSTER_TYPES: {
        NORMAL: {
            name: '일반형',
            hpMult: 1.0,
            speedMult: 1.0,
            defense: 0,
            goldMult: 1.0,
            color: '#94A3B8', // 회색
            shape: 'circle',
            size: 20
        },
        SWIFT: {
            name: '빠른형',
            hpMult: 0.5,
            speedMult: 2.0,
            defense: 0,
            goldMult: 0.8,
            color: '#10B981', // 초록색
            shape: 'triangle',
            size: 18
        },
        ARMORED: {
            name: '중장갑형',
            hpMult: 0.8,
            speedMult: 0.6,
            defense: 0.5,
            goldMult: 1.5,
            color: '#92400E', // 갈색
            shape: 'hexagon',
            size: 22
        },
        TANK: {
            name: '탱크형',
            hpMult: 3.0,
            speedMult: 0.4,
            defense: 0,
            goldMult: 2.0,
            color: '#991B1B', // 진한 빨강
            shape: 'square',
            size: 28
        },
        REGENERATOR: {
            name: '재생형',
            hpMult: 1.5,
            speedMult: 0.8,
            defense: 0,
            goldMult: 1.8,
            regenRate: 0.02, // 초당 2% 재생
            color: '#84CC16', // 연두색
            shape: 'circle',
            size: 22
        }
    },

    // 라운드별 몬스터 타입 (20라운드 사이클)
    ROUND_MONSTER_TYPE: {
        1: 'NORMAL', 2: 'NORMAL', 3: 'NORMAL', 4: 'SWIFT',
        5: 'NORMAL', 6: 'ARMORED', 7: 'NORMAL', 8: 'SWIFT',
        9: 'NORMAL', 10: 'TANK', 11: 'NORMAL', 12: 'SWIFT',
        13: 'NORMAL', 14: 'ARMORED', 15: 'NORMAL', 16: 'SWIFT',
        17: 'NORMAL', 18: 'REGENERATOR', 19: 'NORMAL'
        // 20은 보스
    },

    // 보스 설정
    BOSS: {
        INTERVAL: 20, // 20라운드마다 보스 등장
        HP_MULTIPLIER: 50, // 일반 몬스터 체력의 배수
        DEFENSE: 0.3, // 30% 방어막
        SPEED_MULTIPLIER: 0.6, // 보스는 느림
        REGEN_RATE: 0.01, // 초당 1% 체력 재생
        REWARDS: {
            // 보스 처치 시 보상 (기본값)
            DEFAULT: 100
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

    // 타워 강화 설정 (타워 종류별)
    TOWER_UPGRADES: {
        STANDARD: {
            name: '일반 타워 강화',
            baseCost: 20,
            costPerLevel: 10, // 레벨당 10원 증가
            maxLevel: 100,
            damagePerLevel: 100 // 레벨당 100% 증가 (x2, x3, x4...)
        },
        SPLASH: {
            name: '스플래시 타워 강화',
            baseCost: 20,
            costPerLevel: 10, // 레벨당 10원 증가
            maxLevel: 100,
            damagePerLevel: 100
        },
        SNIPER: {
            name: '저격 타워 강화',
            baseCost: 20,
            costPerLevel: 10, // 레벨당 10원 증가
            maxLevel: 100,
            damagePerLevel: 100
        }
    },

    // 타워 특수 기술 (등급별)
    TOWER_SKILLS: {
        // 스플래시 타워
        SPLASH: {
            LEGENDARY: {
                name: 'Magma Pool (마그마 지대)',
                type: 'ground',
                duration: 4.0, // 4초 지속
                damageMult: 0.4, // 매초 공격력의 40%
                radius: 40, // 마그마 범위
                description: '공격한 적의 위치에 4초 동안 마그마 지대 생성 (매초 40% 피해)'
            },
            MYTHIC: {
                name: 'Divine Punishment (천벌)',
                type: 'chance',
                chance: 0.30, // 30% 확률
                damageMult: 1.0, // 100% 피해
                description: '공격 시 30% 확률로 맵의 모든 적에게 번개 낙하'
            },
            DIVINE: {
                name: 'Absolute Zero (절대 영도)',
                type: 'hit',
                chance: 1.0, // 100%
                duration: 0.3, // 기본 0.3초 (공속에 따라 변동)
                description: '공격 시 적을 얼려 잠시 동안 멈추게 함 (공속 비례)'
            },
            TRANSCENDENT: {
                name: 'Armageddon (아마겟돈)',
                type: 'cooldown',
                cooldown: 8.0, // 8초마다
                damageMult: 2.0, // 200% 데미지
                description: '8초마다 화면 전체 적에게 3초간 200% 지속 피해'
            }
        },
        // 저격 타워
        SNIPER: {
            LEGENDARY: {
                name: 'Expose Weakness (약점 노출)',
                type: 'debuff',
                duration: 5.0, // 5초 지속
                damageAmpMult: 1.2, // 받는 피해 20% 증가
                description: '공격당한 적은 5초 동안 받는 모든 피해 20% 증가'
            },
            MYTHIC: {
                name: 'Armor Piercing (관통 사격)',
                type: 'passive',
                bonusDamageMult: 0.3, // 30% 추가 피해
                description: '방어력을 무시하고 30% 추가 피해'
            },
            DIVINE: {
                name: 'Executioner (처형인)',
                type: 'passive',
                hpThreshold: 0.5, // HP 50% 이하
                damageMult: 2.0, // 데미지 2배
                description: '체력 50% 이하 적에게 2배 피해'
            },
            TRANSCENDENT: {
                name: 'Orbital Laser (궤도 레이저)',
                type: 'cooldown',
                cooldown: 4.0, // 4초마다
                damageMult: 20.0, // 2000% 데미지
                description: '4초마다 궤도 레이저 발사 (극딜)'
            }
        },
        // 일반 타워
        STANDARD: {
            LEGENDARY: {
                name: 'Battle Rush (전투 흥분)',
                type: 'chance',
                chance: 0.10, // 10% 확률
                duration: 5.0, // 5초 지속
                speedBoost: 0.5, // 공격 속도 50% 증가
                description: '공격 시 10% 확률로 5초 동안 공격 속도 50% 증가'
            },
            MYTHIC: {
                name: 'Chain Attack (연쇄 공격)',
                type: 'chance',
                chance: 0.50, // 50% 확률
                description: '공격 시 50% 확률로 즉시 한 번 더 공격'
            },
            DIVINE: {
                name: "Commander's Aura (지휘관의 오라)",
                type: 'aura',
                range: 0, // 같은 칸
                speedMult: 1.3, // 공격 속도 30% 증가 (1.3배)
                description: '같은 칸에 있는 모든 타워의 공격 속도 30% 증가 (중첩 불가)'
            },
            TRANSCENDENT: {
                name: 'Doppelganger (도플갱어)',
                type: 'passive',
                cloneCount: 2, // 분신 2마리
                cloneDamageMult: 1.0, // 각 분신이 100% 데미지
                description: '매 공격마다 그림자 분신 2마리가 함께 공격 (각각 100% 피해)'
            }
        }
    },

    // 배틀패스
    BATTLEPASS: {
        MAX_TIER: 30,
        XP_PER_TIER: 100,
        XP_PER_ROUND: 5
    },

    // 맵 경로 (사각형 루트 - 모바일 800x600 기준)
    PATH: {
        points: [
            { x: 80, y: 80 },    // 시작 (좌상단)
            { x: 720, y: 80 },   // 우상단
            { x: 720, y: 520 },  // 우하단
            { x: 80, y: 520 },   // 좌하단
            { x: 80, y: 80 }     // 다시 좌상단 (루프)
        ]
    },

    // 그리드 영역 (타워 배치 가능 영역 - 모바일 최적화)
    GRID_AREA: {
        x: 140, // (800 - 520) / 2
        y: 105, // (600 - 390) / 2
        width: 520, // 4칸 x 130px
        height: 390, // 3칸 x 130px
        cellWidth: 130, // 크기 조정
        cellHeight: 130
    },

    // Supabase 설정 (env.js에서 로드)
    SUPABASE: {
        URL: window.ENV ? window.ENV.SUPABASE_URL : '',
        KEY: window.ENV ? window.ENV.SUPABASE_KEY : '',
        TABLE: 'rankings'
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
