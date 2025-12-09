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

        // this.load(); // 자동 로드 비활성화
    }

    // ... (중략)

    // 저장 (비활성화)
    save() {
        // localStorage.setItem('towerUpgradesV2', JSON.stringify(this.upgrades));
    }

    // 로드 (비활성화)
    load() {
        // const saved = localStorage.getItem('towerUpgradesV2');
        // if (saved) {
        //     try {
        //         const loaded = JSON.parse(saved);
        //         Object.keys(loaded).forEach(key => {
        //             if (this.upgrades[key]) {
        //                 this.upgrades[key] = loaded[key];
        //             }
        //         });
        //     } catch (e) {
        //         console.error('타워 강화 데이터 로드 실패:', e);
        //     }
        // }
    }

    // 강화 비용 계산 (선형 증가)
    getUpgradeCost(key) {
        const config = CONFIG.TOWER_UPGRADES[key];
        const currentLevel = this.upgrades[key] ? this.upgrades[key].level : 0;

        if (currentLevel >= config.maxLevel) {
            return null; // 최대 레벨
        }

        // 선형 증가: 기본 비용 + (현재 레벨 * 레벨당 증가 비용)
        // 예: 기본 10, 증가 2 -> 0렙: 10, 1렙: 12, 2렙: 14...
        return config.baseCost + (currentLevel * config.costPerLevel);
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

    // 저장 (비활성화)
    save() {
        // localStorage.setItem('towerUpgradesV2', JSON.stringify(this.upgrades));
    }

    // 로드 (비활성화)
    load() {
        // 로드 로직 제거
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
            if (typeof window.showUpgradeView === 'function') {
                window.showUpgradeView();
            } else if (typeof showUpgradeView === 'function') {
                showUpgradeView();
            } else {
                console.error('showUpgradeView is not defined');
            }
        });
    } else {
        console.error('tower-upgrade-btn not found');
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

    // 리스트가 비어있으면 초기 생성
    if (listDiv.children.length === 0) {
        let html = '';
        upgrades.forEach(upgrade => {
            html += `
            <div class="upgrade-item" id="upgrade-item-${upgrade.key}" style="border-left-color: ${upgrade.color}; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="upgrade-header">
                        <span class="upgrade-name" style="color: ${upgrade.color};">${upgrade.name}</span>
                    </div>
                    <div class="upgrade-level" id="upgrade-level-${upgrade.key}" style="margin-bottom: 4px;">Lv ${upgrade.level}/${upgrade.maxLevel}</div>
                    <div class="upgrade-stats" id="upgrade-stats-${upgrade.key}" style="margin-bottom: 8px;">데미지 x${(1 + upgrade.damageBonus / 100).toFixed(1)}</div>
                </div>
                
                <div class="upgrade-footer" id="upgrade-footer-${upgrade.key}" style="flex-direction: column; gap: 4px; align-items: stretch;">
                    <!-- 동적 콘텐츠 -->
                </div>
            </div>
        `;
        });
        listDiv.innerHTML = html;
    }

    // 값 업데이트
    upgrades.forEach(upgrade => {
        const itemEl = document.getElementById(`upgrade-item-${upgrade.key}`);
        if (!itemEl) return;

        const levelEl = document.getElementById(`upgrade-level-${upgrade.key}`);
        const statsEl = document.getElementById(`upgrade-stats-${upgrade.key}`);
        const footerEl = document.getElementById(`upgrade-footer-${upgrade.key}`);

        if (levelEl) levelEl.textContent = `Lv ${upgrade.level}/${upgrade.maxLevel}`;
        if (statsEl) statsEl.textContent = `데미지 x${(1 + upgrade.damageBonus / 100).toFixed(1)}`;

        const isMaxLevel = upgrade.level >= upgrade.maxLevel;
        const canAfford = window.game && window.game.gold >= upgrade.cost;
        const disabled = isMaxLevel || !canAfford;

        // 푸터 내용 업데이트 (상태가 변경되었을 때만 다시 그리는 것이 좋지만, 간단하게 처리)
        // 버튼의 이벤트 리스너 유지를 위해 버튼이 이미 있고 상태만 바뀌는 경우를 처리해야 함

        let existingBtn = footerEl.querySelector('.btn-upgrade-action');
        let existingMax = footerEl.querySelector('.upgrade-max');

        if (isMaxLevel) {
            if (!existingMax) {
                footerEl.innerHTML = '<div class="upgrade-max" style="text-align: center;">MAX</div>';
            }
        } else {
            // 최대 레벨이 아님
            if (existingMax) {
                // MAX였다가 아니게 된 경우 (치트 등?) 혹은 초기화
                footerEl.innerHTML = '';
                existingBtn = null;
            }

            if (!existingBtn) {
                footerEl.innerHTML = `
                    <div class="upgrade-cost" style="text-align: center; margin-bottom: 4px;">${formatNumber(upgrade.cost)}G</div>
                    <button class="btn-upgrade-action" 
                            data-key="${upgrade.key}"
                            style="width: 100%;">
                        강화
                    </button>
                `;
                // 새 버튼에 리스너 추가
                const newBtn = footerEl.querySelector('.btn-upgrade-action');
                newBtn.addEventListener('click', () => {
                    performUpgrade(upgrade.key);
                });
            } else {
                // 버튼이 이미 있으면 텍스트와 상태만 업데이트
                const costEl = footerEl.querySelector('.upgrade-cost');
                if (costEl) costEl.textContent = `${formatNumber(upgrade.cost)}G`;

                if (disabled) {
                    existingBtn.classList.add('disabled');
                    existingBtn.disabled = true;
                } else {
                    existingBtn.classList.remove('disabled');
                    existingBtn.disabled = false;
                }
            }
        }
    });
}

// 강화 실행
function performUpgrade(key) {
    if (!window.towerUpgradeManager || !window.game) return;

    const result = window.towerUpgradeManager.upgrade(key);

    if (result.success) {
        const config = CONFIG.TOWER_UPGRADES[key];
        // showToast(`${config.name} 완료! Lv ${result.newLevel} (-${formatNumber(result.cost)}G)`, 'success');

        // UI 업데이트
        window.game.updateUI();
        updateTowerUpgradeList();

        // **기존 타워 스탯 업데이트 추가**
        if (window.game && window.game.towerManager) {
            const towers = window.game.towerManager.getAllTowers();
            towers.forEach(t => {
                if (t.towerKey === key && typeof t.updateStats === 'function') {
                    t.updateStats();
                }
            });
        }
    } else {
        showToast(result.reason, 'error');
    }
}
