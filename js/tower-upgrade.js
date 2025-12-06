// 타워 강화 시스템

class TowerUpgradeManager {
    constructor() {
        this.upgrades = {};

        // 모든 타워 종류 초기화 (STANDARD, SPLASH, SNIPER)
        Object.keys(CONFIG.TOWER_UPGRADES).forEach(key => {
            this.upgrades[key] = {
                level: 0
            };
        });

        this.load();
    }

    // 강화 비용 계산
    getUpgradeCost(key) {
        const config = CONFIG.TOWER_UPGRADES[key];
        const currentLevel = this.upgrades[key] ? this.upgrades[key].level : 0;

        if (currentLevel >= config.maxLevel) {
            return null; // 최대 레벨
        }

        return Math.floor(config.baseCost * Math.pow(config.costScaling, currentLevel));
    }

    // 강화 실행
    upgrade(key) {
        if (!this.upgrades[key]) this.upgrades[key] = { level: 0 };

        const config = CONFIG.TOWER_UPGRADES[key];
        const currentLevel = this.upgrades[key].level;

        // 최대 레벨 체크
        if (currentLevel >= config.maxLevel) {
            return { success: false, reason: '최대 레벨입니다!' };
        }

        const cost = this.getUpgradeCost(key);

        // 골드 체크
        if (!window.game || window.game.gold < cost) {
            return { success: false, reason: '골드가 부족합니다!' };
        }

        // 골드 차감
        window.game.gold -= cost;

        // 레벨 증가
        this.upgrades[key].level++;

        // 저장
        this.save();

        return {
            success: true,
            newLevel: this.upgrades[key].level,
            cost: cost
        };
    }

    // 현재 데미지 보너스 조회 (%)
    getDamageBonus(key) {
        if (!this.upgrades[key]) return 0;
        const config = CONFIG.TOWER_UPGRADES[key];
        const level = this.upgrades[key].level;
        return level * config.damagePerLevel;
    }

    // 데미지 배수 조회 (1.0 = 100%, 1.5 = 150%)
    getDamageMultiplier(key) {
        const bonus = this.getDamageBonus(key);
        return 1 + (bonus / 100);
    }

    // 모든 강화 정보 조회
    getAllUpgrades() {
        const result = [];

        // 타워 타입별 색상 매핑
        const typeColors = {
            STANDARD: '#E2E8F0', // 회색/흰색
            SPLASH: '#60A5FA',   // 파란색
            SNIPER: '#EF4444'    // 빨간색
        };

        Object.keys(CONFIG.TOWER_UPGRADES).forEach(key => {
            const config = CONFIG.TOWER_UPGRADES[key];
            const level = this.upgrades[key] ? this.upgrades[key].level : 0;
            const cost = this.getUpgradeCost(key);
            const bonus = this.getDamageBonus(key);

            result.push({
                key: key,
                name: config.name,
                color: typeColors[key] || '#FFFFFF',
                level: level,
                maxLevel: config.maxLevel,
                cost: cost,
                damageBonus: bonus
            });
        });

        return result;
    }

    // 저장
    save() {
        localStorage.setItem('towerUpgradesV2', JSON.stringify(this.upgrades));
    }

    // 로드
    load() {
        // V2로 변경 (키가 달라졌으므로 새로 저장해야 함)
        const saved = localStorage.getItem('towerUpgradesV2');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);

                // 기존 데이터와 병합
                Object.keys(loaded).forEach(key => {
                    if (this.upgrades[key]) {
                        this.upgrades[key] = loaded[key];
                    }
                });
            } catch (e) {
                console.error('타워 강화 데이터 로드 실패:', e);
            }
        }
    }

    // 초기화 (디버그용)
    reset() {
        Object.keys(this.upgrades).forEach(key => {
            this.upgrades[key].level = 0;
        });
        this.save();
    }
}

// 강화 UI 초기화
function initTowerUpgradeUI() {
    const upgradeBtn = document.getElementById('tower-upgrade-btn');

    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            showUpgradeView();
        });
    }

    // 뒤로가기 버튼
    const backBtn = document.getElementById('back-from-upgrade-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showMainView();
        });
    }
}

// 강화 목록 업데이트
function updateTowerUpgradeList() {
    const listDiv = document.getElementById('tower-upgrade-list');
    if (!listDiv || !window.towerUpgradeManager) return;

    const upgrades = window.towerUpgradeManager.getAllUpgrades();

    let html = '';

    upgrades.forEach(upgrade => {
        const isMaxLevel = upgrade.level >= upgrade.maxLevel;
        const canAfford = window.game && window.game.gold >= upgrade.cost;
        const disabled = isMaxLevel || !canAfford;

        html += `
            <div class="upgrade-item" style="border-left-color: ${upgrade.color};">
                <div class="upgrade-header">
                    <span class="upgrade-name" style="color: ${upgrade.color};">
                        ${upgrade.name}
                    </span>
                    <span class="upgrade-level">
                        Lv ${upgrade.level}/${upgrade.maxLevel}
                    </span>
                </div>
                <div class="upgrade-stats">
                    <span>공격력: +${upgrade.damageBonus}%</span>
                </div>
                <div class="upgrade-footer">
                    ${isMaxLevel ?
                '<span class="upgrade-max">최대 레벨</span>' :
                `<span class="upgrade-cost">비용: ${formatNumber(upgrade.cost)}G</span>
                         <button class="btn-upgrade-action ${disabled ? 'disabled' : ''}" 
                                 data-key="${upgrade.key}"
                                 ${disabled ? 'disabled' : ''}>
                             강화하기
                         </button>`
            }
                </div>
            </div>
        `;
    });

    listDiv.innerHTML = html;

    // 강화 버튼 이벤트 리스너
    listDiv.querySelectorAll('.btn-upgrade-action').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            performUpgrade(key);
        });
    });
}

// 강화 실행
function performUpgrade(key) {
    if (!window.towerUpgradeManager || !window.game) return;

    const result = window.towerUpgradeManager.upgrade(key);

    if (result.success) {
        const config = CONFIG.TOWER_UPGRADES[key];
        showToast(`${config.name} 완료! Lv ${result.newLevel} (-${formatNumber(result.cost)}G)`, 'success');

        // UI 업데이트
        window.game.updateUI();
        updateTowerUpgradeList();
    } else {
        showToast(result.reason, 'error');
    }
}
