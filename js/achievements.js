// 업적 시스템

class AchievementManager {
    constructor() {
        this.achievements = this.initAchievements();
        this.completed = [];
    }

    initAchievements() {
        return [
            { id: 'round_10', name: '첫 걸음', description: '라운드 10 달성', condition: (stats) => stats.bestRound >= 10, reward: 10 },
            { id: 'round_25', name: '첫 보스', description: '라운드 25 달성', condition: (stats) => stats.bestRound >= 25, reward: 25 },
            { id: 'round_50', name: '중반전', description: '라운드 50 달성', condition: (stats) => stats.bestRound >= 50, reward: 50 },
            { id: 'round_75', name: '후반전', description: '라운드 75 달성', condition: (stats) => stats.bestRound >= 75, reward: 75 },
            { id: 'round_100', name: '완벽한 승리', description: '라운드 100 클리어', condition: (stats) => stats.bestRound >= 100, reward: 200 },

            { id: 'kills_100', name: '학살자', description: '100마리 처치', condition: (stats) => stats.totalKills >= 100, reward: 15 },
            { id: 'kills_1000', name: '대학살', description: '1000마리 처치', condition: (stats) => stats.totalKills >= 1000, reward: 50 },
            { id: 'kills_10000', name: '전설의 사냥꾼', description: '10000마리 처치', condition: (stats) => stats.totalKills >= 10000, reward: 150 },

            { id: 'tower_10', name: '타워 수집가', description: '타워 10개 획득', condition: (stats) => stats.totalTowers >= 10, reward: 10 },
            { id: 'tower_50', name: '타워 마스터', description: '타워 50개 획득', condition: (stats) => stats.totalTowers >= 50, reward: 30 },
            { id: 'tower_100', name: '타워 전문가', description: '타워 100개 획득', condition: (stats) => stats.totalTowers >= 100, reward: 60 },

            { id: 'legendary_pull', name: '행운아', description: '레전드 이상 등급 획득', condition: (stats) => stats.legendaryPulls >= 1, reward: 50 },
            { id: 'transcendent_pull', name: '초월자', description: '초월 등급 획득', condition: (stats) => stats.transcendentPulls >= 1, reward: 200 },

            { id: 'boss_kill_1', name: '보스 헌터', description: '보스 1마리 처치', condition: (stats) => stats.bossKills >= 1, reward: 20 },
            { id: 'boss_kill_10', name: '보스 슬레이어', description: '보스 10마리 처치', condition: (stats) => stats.bossKills >= 10, reward: 50 },

            { id: 'gold_10k', name: '부자', description: '골드 10,000 획득', condition: (stats) => stats.totalGoldEarned >= 10000, reward: 25 },
            { id: 'gold_100k', name: '대부호', description: '골드 100,000 획득', condition: (stats) => stats.totalGoldEarned >= 100000, reward: 100 }
        ];
    }

    checkAchievements(stats) {
        const newlyCompleted = [];

        this.achievements.forEach(achievement => {
            if (!this.completed.includes(achievement.id) && achievement.condition(stats)) {
                this.completed.push(achievement.id);
                newlyCompleted.push(achievement);

                // 보상 지급
                if (window.economy) {
                    window.economy.addUpgradeStones(achievement.reward);
                }

                showToast(`업적 달성: ${achievement.name}`, 'success');
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
            percentage: (this.completed.length / this.achievements.length) * 100
        };
    }

    save() {
        localStorage.setItem('achievements', JSON.stringify(this.completed));
    }

    load() {
        const data = localStorage.getItem('achievements');
        if (data) {
            this.completed = JSON.parse(data);
        }
    }
}

// 업적 UI
function initAchievementUI() {
    const achievementsBtn = document.getElementById('achievements-btn');

    achievementsBtn.addEventListener('click', () => {
        updateAchievementList();
        document.getElementById('achievements-modal').classList.add('active');
    });
}

function updateAchievementList() {
    const achievementList = document.getElementById('achievement-list');
    achievementList.innerHTML = '';

    if (!window.achievementManager) return;

    window.achievementManager.achievements.forEach(achievement => {
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
                <span class="reward-type">강화석</span>
            </div>
        `;

        achievementList.appendChild(item);
    });
}
