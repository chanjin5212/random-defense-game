// 업적 시스템 - 타워 수집 기반

class AchievementManager {
    constructor() {
        this.achievements = this.initAchievements();
        this.completed = [];
        this.towerCollection = {}; // 획득한 타워 추적 { towerKey: { rarity: count } }
    }

    initAchievements() {
        return [
            // 1. 등급별 수집 (가로 수집)
            {
                id: 'uncommon_collector',
                name: '희귀 컬렉터',
                description: '희귀 등급 타워 3종류 획득',
                condition: () => this.countRarityTypes('UNCOMMON') >= 3,
                reward: 500,
                category: 'rarity'
            },
            {
                id: 'rare_collector',
                name: '레어 컬렉터',
                description: '레어 등급 타워 3종류 획득',
                condition: () => this.countRarityTypes('RARE') >= 3,
                reward: 1000,
                category: 'rarity'
            },
            {
                id: 'epic_collector',
                name: '에픽 컬렉터',
                description: '에픽 등급 타워 3종류 획득',
                condition: () => this.countRarityTypes('EPIC') >= 3,
                reward: 2000,
                category: 'rarity'
            },
            {
                id: 'unique_collector',
                name: '유니크 컬렉터',
                description: '유니크 등급 타워 3종류 획득',
                condition: () => this.countRarityTypes('UNIQUE') >= 3,
                reward: 5000,
                category: 'rarity'
            },

            // 2. 특정 타워 등급 세트 (세로 수집)
            {
                id: 'standard_collection',
                name: '일반 타워 컬렉션',
                description: '일반 타워로 일반~유니크 등급 모두 획득',
                condition: () => this.hasTowerRaritySet('STANDARD', ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE']),
                reward: 1000,
                category: 'tower_set'
            },
            {
                id: 'splash_collection',
                name: '스플래시 타워 컬렉션',
                description: '스플래시 타워로 일반~유니크 등급 모두 획득',
                condition: () => this.hasTowerRaritySet('SPLASH', ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE']),
                reward: 1000,
                category: 'tower_set'
            },
            {
                id: 'sniper_collection',
                name: '저격 타워 컬렉션',
                description: '저격 타워로 일반~유니크 등급 모두 획득',
                condition: () => this.hasTowerRaritySet('SNIPER', ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE']),
                reward: 1000,
                category: 'tower_set'
            },

            // 3. 완벽주의자 업적
            {
                id: 'tower_doctor',
                name: '타워 박사',
                description: '한 종류 타워로 모든 등급 획득 (일반~초월)',
                condition: () => this.hasCompleteTowerSet(),
                reward: 30000,
                category: 'master'
            },
            {
                id: 'legendary_master',
                name: '레전더리 마스터',
                description: '레전드 이상 등급 타워 3종류 획득',
                condition: () => this.countLegendaryTypes() >= 3,
                reward: 10000,
                category: 'master'
            },
            {
                id: 'perfect_collection',
                name: '완벽한 컬렉션',
                description: '모든 타워 × 모든 등급 획득 (27개)',
                condition: () => this.hasPerfectCollection(),
                reward: 100000,
                category: 'master'
            }
        ];
    }

    // 타워 획득 추적
    addTower(towerKey, rarity) {
        if (!this.towerCollection[towerKey]) {
            this.towerCollection[towerKey] = {};
        }
        if (!this.towerCollection[towerKey][rarity]) {
            this.towerCollection[towerKey][rarity] = 0;
        }
        this.towerCollection[towerKey][rarity]++;

        // 업적 체크
        this.checkAchievements();
    }

    // 특정 등급의 타워 종류 수 계산
    countRarityTypes(rarity) {
        let count = 0;
        Object.keys(this.towerCollection).forEach(towerKey => {
            if (this.towerCollection[towerKey][rarity] && this.towerCollection[towerKey][rarity] > 0) {
                count++;
            }
        });
        return count;
    }

    // 특정 타워가 특정 등급 세트를 모두 가지고 있는지 확인
    hasTowerRaritySet(towerKey, rarities) {
        if (!this.towerCollection[towerKey]) return false;

        return rarities.every(rarity => {
            return this.towerCollection[towerKey][rarity] && this.towerCollection[towerKey][rarity] > 0;
        });
    }

    // 한 종류 타워로 모든 등급 획득 확인
    hasCompleteTowerSet() {
        const allRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE', 'LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];

        return Object.keys(this.towerCollection).some(towerKey => {
            return this.hasTowerRaritySet(towerKey, allRarities);
        });
    }

    // 레전드 이상 등급 타워 종류 수 계산
    countLegendaryTypes() {
        const legendaryRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
        const uniqueTowers = new Set();

        Object.keys(this.towerCollection).forEach(towerKey => {
            legendaryRarities.forEach(rarity => {
                if (this.towerCollection[towerKey][rarity] && this.towerCollection[towerKey][rarity] > 0) {
                    uniqueTowers.add(`${towerKey}_${rarity}`);
                }
            });
        });

        return uniqueTowers.size;
    }

    // 완벽한 컬렉션 확인 (3종류 타워 × 9등급 = 27개)
    hasPerfectCollection() {
        const allRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE', 'LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
        const allTowers = ['STANDARD', 'SPLASH', 'SNIPER'];

        return allTowers.every(towerKey => {
            return this.hasTowerRaritySet(towerKey, allRarities);
        });
    }

    checkAchievements() {
        const newlyCompleted = [];

        this.achievements.forEach(achievement => {
            if (!this.completed.includes(achievement.id) && achievement.condition()) {
                this.completed.push(achievement.id);
                newlyCompleted.push(achievement);

                // 골드 보상 지급
                if (window.game) {
                    window.game.addGold(achievement.reward);
                    showToast(`🏆 업적 달성: ${achievement.name} (+${achievement.reward}골드)`, 'success');
                }
            }
        });

        if (newlyCompleted.length > 0) {
            this.save();
        }

        return newlyCompleted;
    }

    getProgress() {
        return {
            completed: this.completed.length,
            total: this.achievements.length,
            percentage: Math.floor((this.completed.length / this.achievements.length) * 100)
        };
    }

    save() {
        // localStorage 비활성화
    }

    load() {
        // localStorage 비활성화
    }
}

// 업적 UI
function initAchievementUI() {
    const achievementsBtn = document.getElementById('achievements-btn');
    if (!achievementsBtn) return;

    achievementsBtn.addEventListener('click', () => {
        updateAchievementList();
        document.getElementById('achievements-modal').classList.add('active');
    });
}

function updateAchievementList() {
    const achievementList = document.getElementById('achievement-list');
    if (!achievementList) return;

    achievementList.innerHTML = '';

    if (!window.achievementManager) return;

    // 카테고리별로 그룹화
    const categories = {
        'rarity': '등급별 수집',
        'tower_set': '타워 컬렉션',
        'master': '완벽주의자'
    };

    Object.keys(categories).forEach(category => {
        const categoryAchievements = window.achievementManager.achievements.filter(a => a.category === category);

        if (categoryAchievements.length > 0) {
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'achievement-category';
            categoryHeader.innerHTML = `<h3>${categories[category]}</h3>`;
            achievementList.appendChild(categoryHeader);

            categoryAchievements.forEach(achievement => {
                const isCompleted = window.achievementManager.completed.includes(achievement.id);

                const item = document.createElement('div');
                item.className = 'achievement-item' + (isCompleted ? ' completed' : '');

                item.innerHTML = `
                    <div class="achievement-icon">${isCompleted ? '✓' : '○'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                    <div class="achievement-reward">
                        <span class="reward-amount">+${achievement.reward}</span>
                        <span class="reward-type">골드</span>
                    </div>
                `;

                achievementList.appendChild(item);
            });
        }
    });

    // 진행도 표시
    const progress = window.achievementManager.getProgress();
    const progressBar = document.createElement('div');
    progressBar.className = 'achievement-progress';
    progressBar.innerHTML = `
        <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <div style="margin-bottom: 5px; color: #F1F5F9;">진행도: ${progress.completed}/${progress.total} (${progress.percentage}%)</div>
            <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden;">
                <div style="width: ${progress.percentage}%; height: 100%; background: linear-gradient(90deg, #10B981, #3B82F6); transition: width 0.3s;"></div>
            </div>
        </div>
    `;
    achievementList.appendChild(progressBar);
}
