// 타워 교환 시스템

// 타워 교환 모달 열기
function openTowerExchangeModal() {
    const modal = document.getElementById('tower-exchange-modal');
    if (!modal) return;

    // 교환 가능한 타워 목록 업데이트
    updateExchangeTowerList();

    modal.classList.add('active');
}

// 교환 가능한 타워 목록 업데이트
function updateExchangeTowerList() {
    const listContainer = document.getElementById('exchange-tower-list');
    if (!listContainer || !window.game) return;

    // 레전드 이상 타워만 필터링
    const exchangeableRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
    const allTowers = [];

    // 모든 그리드 셀에서 타워 수집
    window.game.towerManager.grid.forEach((row, y) => {
        row.forEach((cell, x) => {
            cell.forEach(tower => {
                if (exchangeableRarities.includes(tower.rarity)) {
                    allTowers.push({
                        tower: tower,
                        gridX: x,
                        gridY: y
                    });
                }
            });
        });
    });

    // 타워가 없으면 안내 메시지
    if (allTowers.length === 0) {
        listContainer.innerHTML = `
            <p style="text-align: center; opacity: 0.6; color: #F1F5F9; padding: 40px 20px;">
                교환 가능한 타워가 없습니다.<br>
                <span style="font-size: 0.9em; color: #94A3B8;">레전드 이상 타워만 교환 가능합니다.</span>
            </p>
        `;
        return;
    }

    // 타워 종류별로 그룹화
    const groupedTowers = {};
    allTowers.forEach(item => {
        const key = `${item.tower.rarity}-${item.tower.towerKey}`;
        if (!groupedTowers[key]) {
            groupedTowers[key] = {
                rarity: item.tower.rarity,
                towerKey: item.tower.towerKey,
                rarityData: item.tower.rarityData,
                towerData: item.tower.towerData,
                towers: []
            };
        }
        groupedTowers[key].towers.push(item);
    });

    // HTML 생성
    let html = '';
    Object.values(groupedTowers).forEach(group => {
        const exchangeConfig = CONFIG.TOWER_EXCHANGE[group.rarity];
        const cost = exchangeConfig.cost;
        const successRate = (exchangeConfig.successRate * 100).toFixed(0);

        html += `
            <div class="tower-exchange-item" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-left: 4px solid ${group.rarityData.color};
                border-radius: 5px;
            ">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <span style="color: ${group.rarityData.color}; font-weight: bold; font-size: 1.1em;">
                            ${group.rarityData.name}
                        </span>
                        <span style="color: #F1F5F9;">
                            ${group.towerData.name}
                        </span>
                        <span style="color: #94A3B8; font-size: 0.9em;">
                            x${group.towers.length}
                        </span>
                    </div>
                    <div style="font-size: 0.85em; color: #94A3B8;">
                        비용: ${cost}골드 | 성공률: ${successRate}%
                    </div>
                </div>
                <button 
                    class="btn-exchange" 
                    onclick="attemptTowerExchange('${group.rarity}', '${group.towerKey}')"
                    style="
                        padding: 8px 16px;
                        background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: transform 0.1s;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                >
                    교환
                </button>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// 타워 교환 시도
function attemptTowerExchange(rarity, towerKey) {
    if (!window.game) return;

    const exchangeConfig = CONFIG.TOWER_EXCHANGE[rarity];
    const cost = exchangeConfig.cost;
    const successRate = exchangeConfig.successRate;

    // 골드 확인
    if (window.game.gold < cost) {
        showToast('골드가 부족합니다!', 'error');
        return;
    }

    // 해당 타워 찾기
    let targetTower = null;
    let targetGridX = -1;
    let targetGridY = -1;

    outerLoop:
    for (let y = 0; y < window.game.towerManager.grid.length; y++) {
        for (let x = 0; x < window.game.towerManager.grid[y].length; x++) {
            const cell = window.game.towerManager.grid[y][x];
            for (let tower of cell) {
                if (tower.rarity === rarity && tower.towerKey === towerKey) {
                    targetTower = tower;
                    targetGridX = x;
                    targetGridY = y;
                    break outerLoop;
                }
            }
        }
    }

    if (!targetTower) {
        showToast('타워를 찾을 수 없습니다!', 'error');
        return;
    }

    // 골드 차감
    window.game.gold -= cost;

    // 성공 여부 판정
    const success = Math.random() < successRate;

    if (success) {
        // 성공: 다른 타입으로 변경
        const towerTypes = Object.keys(CONFIG.TOWERS);
        const otherTypes = towerTypes.filter(t => t !== towerKey);
        const newTowerKey = otherTypes[Math.floor(Math.random() * otherTypes.length)];

        // 타워 타입 변경
        targetTower.towerKey = newTowerKey;
        targetTower.towerData = CONFIG.TOWERS[newTowerKey];
        targetTower.effect = targetTower.towerData.effect;

        // 스킬 재설정
        if (CONFIG.TOWER_SKILLS[newTowerKey] && CONFIG.TOWER_SKILLS[newTowerKey][rarity]) {
            targetTower.skill = CONFIG.TOWER_SKILLS[newTowerKey][rarity];
        } else {
            targetTower.skill = null;
        }

        // 데미지 재계산
        const rarityData = CONFIG.RARITY[rarity];
        targetTower.damage = targetTower.towerData.baseDamage * rarityData.multiplier;

        // 타워 강화 적용
        if (window.towerUpgradeManager) {
            const upgradeMultiplier = window.towerUpgradeManager.getDamageMultiplier(newTowerKey);
            targetTower.damage *= upgradeMultiplier;
        }

        // 공격 속도 재설정
        targetTower.attackSpeed = targetTower.towerData.attackSpeed;
        targetTower.originalAttackSpeed = targetTower.towerData.attackSpeed;

        // 계정 스탯 적용
        if (window.game.accountStats) {
            targetTower.attackSpeed /= (1 + window.game.accountStats.ASPD_PERCENT / 100);
        }

        showToast(`✅ 교환 성공! ${targetTower.towerData.name}으로 변경되었습니다!`, 'success');
    } else {
        // 실패: 타워는 그대로
        showToast(`❌ 교환 실패! ${cost}골드가 소모되었습니다.`, 'error');
    }

    // UI 업데이트
    updateExchangeTowerList();
    if (window.game.updateUI) {
        window.game.updateUI();
    }
}

// 이벤트 리스너 등록
window.addEventListener('DOMContentLoaded', () => {
    const exchangeBtn = document.getElementById('tower-exchange-btn');
    if (exchangeBtn) {
        exchangeBtn.addEventListener('click', openTowerExchangeModal);
    }

    // 모달 닫기 버튼
    const modal = document.getElementById('tower-exchange-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-btn')) {
                modal.classList.remove('active');
            }
        });
    }
});
