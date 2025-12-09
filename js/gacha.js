// 가챠 시스템

class GachaSystem {
    constructor() {
        this.pullHistory = [];
    }

    // 단일 뽑기
    singlePull() {
        const result = this.performPull();
        return [result];
    }

    // 10연차
    tenPull() {
        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(this.performPull());
        }
        return results;
    }

    // 뽑기 실행
    performPull() {
        const rarity = this.determineRarity();
        const tower = this.determineTower();

        const result = {
            rarity: rarity,
            rarityData: CONFIG.RARITY[rarity],
            tower: tower,
            towerData: CONFIG.TOWERS[tower],
            timestamp: Date.now()
        };

        this.pullHistory.push(result);

        return result;
    }

    // 등급 결정
    determineRarity() {
        const roll = Math.random();
        let cumulative = 0;

        // 확률 순서대로 체크 (낮은 등급부터)
        const rarities = Object.keys(CONFIG.RARITY);

        for (const key of rarities) {
            cumulative += CONFIG.RARITY[key].probability;
            if (roll < cumulative) {
                return key;
            }
        }

        // 기본값 (일반)
        return 'COMMON';
    }

    // 타워 결정
    determineTower() {
        return randomChoice(TOWER_ARRAY);
    }

    // 뽑기 결과 표시
    showResults(results) {
        // 토스트로 결과 표시
        results.forEach((result, index) => {
            setTimeout(() => {
                const message = `${result.rarityData.name} ${result.towerData.name} (${Math.floor(result.towerData.baseDamage * result.rarityData.multiplier)} DMG)`;

                // 등급에 따라 다른 타입의 토스트
                if (result.rarityData.multiplier >= 5.0) {
                    showToast(`✨ ${message}`, 'success');
                } else if (result.rarityData.multiplier >= 2.0) {
                    showToast(`⭐ ${message}`, 'success');
                } else {
                    showToast(message, 'info');
                }
            }, index * 200); // 순차적으로 표시
        });
    }

    // 통계
    getStats() {
        const stats = {
            totalPulls: this.pullHistory.length,
            byRarity: {}
        };

        Object.keys(CONFIG.RARITY).forEach(key => {
            stats.byRarity[key] = 0;
        });

        this.pullHistory.forEach(pull => {
            stats.byRarity[pull.rarity]++;
        });

        return stats;
    }
}

// 가챠 UI 핸들러
function initGachaUI() {
    const singlePullBtn = document.getElementById('single-pull-btn');
    const tenPullBtn = document.getElementById('ten-pull-btn');

    singlePullBtn.addEventListener('click', () => {
        if (!window.game) return;

        // 선택된 칸 확인
        if (!window.game.towerManager.selectedCell) {
            showToast('먼저 칸을 클릭하여 선택하세요!', 'warning');
            return;
        }

        const cost = CONFIG.ECONOMY.SINGLE_PULL_COST;

        if (window.game.gold < cost) {
            showToast('골드가 부족합니다!', 'error');
            return;
        }

        const { x, y } = window.game.towerManager.selectedCell;
        const cellCount = window.game.towerManager.getCellTowerCount(x, y);

        if (cellCount >= CONFIG.GAME.TOWERS_PER_SLOT) {
            showToast('이 칸은 가득 찼습니다! (최대 10개)', 'warning');
            return;
        }

        // 골드 차감
        window.game.gold -= cost;
        window.game.updateUI();

        // 뽑기 실행
        const results = window.game.gacha.singlePull();

        // 타워 추가
        const result = results[0];
        const addResult = window.game.towerManager.addTowerToSelectedCell(result.tower, result.rarity);

        if (addResult.success) {
            // 결과 표시
            window.game.gacha.showResults(results);
            // 타워 목록 업데이트
            if (typeof updateCellTowerList === 'function') {
                updateCellTowerList();
            }
        } else {
            showToast(addResult.reason, 'error');
            // 골드 환불
            window.game.gold += cost;
        }

        // UI 업데이트
        window.game.updateUI();
    });

    tenPullBtn.addEventListener('click', () => {
        if (!window.game) return;

        // 선택된 칸 확인
        if (!window.game.towerManager.selectedCell) {
            showToast('먼저 칸을 클릭하여 선택하세요!', 'warning');
            return;
        }

        const cost = CONFIG.ECONOMY.TEN_PULL_COST;

        if (window.game.gold < cost) {
            showToast('골드가 부족합니다!', 'error');
            return;
        }

        const { x, y } = window.game.towerManager.selectedCell;
        const cellCount = window.game.towerManager.getCellTowerCount(x, y);
        const availableSlots = CONFIG.GAME.TOWERS_PER_SLOT - cellCount;

        if (availableSlots === 0) {
            showToast('이 칸은 가득 찼습니다! (최대 10개)', 'warning');
            return;
        }

        // 골드 차감
        window.game.gold -= cost;
        window.game.updateUI();

        // 뽑기 실행
        const results = window.game.gacha.tenPull();

        // 타워 추가 (슬롯이 있는 만큼만)
        let addedCount = 0;
        for (const result of results) {
            const addResult = window.game.towerManager.addTowerToSelectedCell(result.tower, result.rarity);
            if (addResult.success) {
                addedCount++;
            } else {
                break;
            }
        }

        // 결과 표시
        window.game.gacha.showResults(results);

        // 타워 목록 업데이트
        if (typeof updateCellTowerList === 'function') {
            updateCellTowerList();
        }

        if (addedCount < results.length) {
            showToast(`${addedCount}개의 타워만 추가되었습니다 (슬롯 부족)`, 'warning');
        }

        // UI 업데이트
        window.game.updateUI();
    });

    // 모달 닫기
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            modal.classList.remove('active');
        });
    });

    // 모달 외부 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

}
