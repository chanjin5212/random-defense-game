// 업그레이드 시스템

class UpgradeManager {
    constructor() {
        this.levels = {
            ATK_PERCENT: 0,
            ASPD_PERCENT: 0,
            CRIT_RATE: 0,
            CRIT_DAMAGE: 0,
            BOSS_DAMAGE: 0,
            STARTING_GOLD: 0
        };
    }

    upgrade(key) {
        const config = CONFIG.UPGRADES[key];
        const currentLevel = this.levels[key];

        if (currentLevel >= config.maxLevel) {
            return { success: false, reason: '최대 레벨입니다' };
        }

        const cost = calculateUpgradeCost(key, currentLevel);

        if (window.economy && window.economy.spendUpgradeStones(cost)) {
            this.levels[key]++;
            this.save();
            return { success: true, newLevel: this.levels[key] };
        }

        return { success: false, reason: '강화석이 부족합니다' };
    }

    getStats() {
        return {
            ATK_PERCENT: this.levels.ATK_PERCENT * CONFIG.UPGRADES.ATK_PERCENT.valuePerLevel,
            ASPD_PERCENT: this.levels.ASPD_PERCENT * CONFIG.UPGRADES.ASPD_PERCENT.valuePerLevel,
            CRIT_RATE: this.levels.CRIT_RATE * CONFIG.UPGRADES.CRIT_RATE.valuePerLevel,
            CRIT_DAMAGE: this.levels.CRIT_DAMAGE * CONFIG.UPGRADES.CRIT_DAMAGE.valuePerLevel,
            BOSS_DAMAGE: this.levels.BOSS_DAMAGE * CONFIG.UPGRADES.BOSS_DAMAGE.valuePerLevel,
            STARTING_GOLD: this.levels.STARTING_GOLD * CONFIG.UPGRADES.STARTING_GOLD.valuePerLevel
        };
    }

    save() {
        // localStorage.setItem('upgrades', JSON.stringify(this.levels));
    }

    load() {
        // const data = localStorage.getItem('upgrades');
        // if (data) {
        //     this.levels = JSON.parse(data);
        // }
    }
}

// 업그레이드 UI
function initUpgradeUI() {
    const upgradesBtn = document.getElementById('upgrades-btn');
    if (!upgradesBtn) return; // 버튼이 없으면 초기화 중단

    const upgradeList = document.getElementById('upgrade-list');

    upgradesBtn.addEventListener('click', () => {
        updateUpgradeList();
        document.getElementById('upgrades-modal').classList.add('active');
    });
}

function updateUpgradeList() {
    const upgradeList = document.getElementById('upgrade-list');
    upgradeList.innerHTML = '';

    Object.keys(CONFIG.UPGRADES).forEach(key => {
        const config = CONFIG.UPGRADES[key];
        const currentLevel = window.upgradeManager ? window.upgradeManager.levels[key] : 0;
        const cost = calculateUpgradeCost(key, currentLevel);
        const isMaxLevel = currentLevel >= config.maxLevel;

        const item = document.createElement('div');
        item.className = 'upgrade-item';

        item.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${config.name}</div>
                <div class="upgrade-level">레벨: ${currentLevel} / ${config.maxLevel}</div>
                <div class="upgrade-value">효과: +${currentLevel * config.valuePerLevel}${key.includes('GOLD') ? '' : '%'}</div>
            </div>
            <div class="upgrade-action">
                <div class="upgrade-cost">${isMaxLevel ? 'MAX' : cost + ' 강화석'}</div>
                <button class="btn btn-primary btn-upgrade" 
                    data-upgrade="${key}" 
                    ${isMaxLevel ? 'disabled' : ''}>
                    강화
                </button>
            </div>
        `;

        upgradeList.appendChild(item);
    });

    // 버튼 이벤트
    document.querySelectorAll('.btn-upgrade').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-upgrade');
            const result = window.upgradeManager.upgrade(key);

            if (result.success) {
                showToast(`${CONFIG.UPGRADES[key].name} 강화 성공!`, 'success');
                updateUpgradeList();
                updateLobbyUI();
            } else {
                showToast(result.reason, 'error');
            }
        });
    });
}
