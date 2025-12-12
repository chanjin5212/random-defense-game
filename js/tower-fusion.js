// 타워 합체 시스템 (Trinity Tower)

function openTowerFusionModal() {
    const modal = document.getElementById('tower-fusion-modal');
    if (!modal) return;
    updateFusionTowerList();
    modal.classList.add('active');
}

function updateFusionTowerList() {
    const listContainer = document.getElementById('fusion-tower-list');
    if (!listContainer || !window.game) return;

    const fusionableRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
    const groupedByRarity = {};

    fusionableRarities.forEach(rarity => {
        const towers = { STANDARD: [], SPLASH: [], SNIPER: [] };
        window.game.towerManager.grid.forEach((row, y) => {
            row.forEach((cell, x) => {
                cell.forEach(tower => {
                    // Trinity 타워는 제외하고, 일반 타워만 수집
                    if (tower.rarity === rarity && !tower.isTrinity && towers[tower.towerKey]) {
                        towers[tower.towerKey].push({ tower, x, y });
                    }
                });
            });
        });
        if (towers.STANDARD.length > 0 && towers.SPLASH.length > 0 && towers.SNIPER.length > 0) {
            groupedByRarity[rarity] = towers;
        }
    });

    if (Object.keys(groupedByRarity).length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; opacity: 0.6; color: #F1F5F9; padding: 40px 20px;">합체 가능한 타워가 없습니다.<br><span style="font-size: 0.9em; color: #94A3B8;">같은 등급의 서로 다른 타입 타워 3개가 필요합니다.</span></p>`;
        return;
    }

    let html = '';
    Object.entries(groupedByRarity).forEach(([rarity, towers]) => {
        const rarityData = CONFIG.RARITY[rarity];
        const fusionConfig = CONFIG.TOWER_FUSION[rarity];
        const cost = fusionConfig.fusionCost;
        const successRate = (fusionConfig.successRate * 100).toFixed(0);

        html += `
            <div class="tower-fusion-item" style="padding: 20px; margin-bottom: 15px; background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%); border-left: 4px solid ${rarityData.color}; border-radius: 8px;">
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: ${rarityData.color}; font-weight: bold; font-size: 1.2em;">${rarityData.name} 트리니티</span>
                        <span style="color: #FBBF24; font-weight: bold;">${cost}골드</span>
                    </div>
                    <div style="font-size: 0.85em; color: #94A3B8; margin-bottom: 10px;">성공률: ${successRate}% | 실패 시: 골드 소모 + 랜덤 1개 소실</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
                        <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;"><div style="color: #F1F5F9; font-size: 0.9em;">일반</div><div style="color: #10B981; font-weight: bold;">${towers.STANDARD.length}개</div></div>
                        <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;"><div style="color: #F1F5F9; font-size: 0.9em;">스플래시</div><div style="color: #10B981; font-weight: bold;">${towers.SPLASH.length}개</div></div>
                        <div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;"><div style="color: #F1F5F9; font-size: 0.9em;">저격</div><div style="color: #10B981; font-weight: bold;">${towers.SNIPER.length}개</div></div>
                    </div>
                </div>
                <button class="btn-fusion" onclick="attemptTowerFusion('${rarity}')" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1em; transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">🔮 합체 시도</button>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function attemptTowerFusion(rarity) {
    if (!window.game) return;

    const fusionConfig = CONFIG.TOWER_FUSION[rarity];
    const cost = fusionConfig.fusionCost;
    const successRate = fusionConfig.successRate;

    if (window.game.gold < cost) {
        showToast('골드가 부족합니다!', 'error');
        return;
    }

    const selectedTowers = { STANDARD: null, SPLASH: null, SNIPER: null };

    outerLoop:
    for (let y = 0; y < window.game.towerManager.grid.length; y++) {
        for (let x = 0; x < window.game.towerManager.grid[y].length; x++) {
            const cell = window.game.towerManager.grid[y][x];
            for (let tower of cell) {
                if (tower.rarity === rarity && !tower.isTrinity) {
                    if (!selectedTowers[tower.towerKey]) {
                        selectedTowers[tower.towerKey] = { tower, x, y };
                        if (selectedTowers.STANDARD && selectedTowers.SPLASH && selectedTowers.SNIPER) {
                            break outerLoop;
                        }
                    }
                }
            }
        }
    }

    if (!selectedTowers.STANDARD || !selectedTowers.SPLASH || !selectedTowers.SNIPER) {
        showToast('합체에 필요한 타워가 부족합니다!', 'error');
        return;
    }

    window.game.gold -= cost;
    const success = Math.random() < successRate;

    if (success) {
        createTrinityTower(rarity, selectedTowers);
        showToast(`✨ 합체 성공! ${CONFIG.RARITY[rarity].name} 트리니티 타워가 생성되었습니다!`, 'success');
    } else {
        const towerTypes = ['STANDARD', 'SPLASH', 'SNIPER'];
        const randomType = towerTypes[Math.floor(Math.random() * 3)];
        const toRemove = selectedTowers[randomType];
        const cell = window.game.towerManager.grid[toRemove.y][toRemove.x];
        const index = cell.indexOf(toRemove.tower);
        if (index !== -1) {
            cell.splice(index, 1);
            cell.forEach((t, idx) => { t.slotIndex = idx; t.setPosition(true); });
        }
        showToast(`❌ 합체 실패! ${CONFIG.TOWERS[randomType].name}이(가) 소실되었습니다.`, 'error');
    }

    updateFusionTowerList();
    if (window.game.updateUI) window.game.updateUI();
}

function createTrinityTower(rarity, selectedTowers) {
    if (!window.game) return;

    const targetPos = selectedTowers.STANDARD;
    const gridX = targetPos.x;
    const gridY = targetPos.y;

    // 스킬 수집
    const skills = [];
    Object.values(selectedTowers).forEach(({ tower }) => {
        if (tower.skill) skills.push(tower.skill);
    });

    // 기존 타워 제거
    Object.values(selectedTowers).forEach(({ tower, x, y }) => {
        const cell = window.game.towerManager.grid[y][x];
        const index = cell.indexOf(tower);
        if (index !== -1) cell.splice(index, 1);
    });

    // Trinity 타워 생성 (일반 타워처럼)
    const cell = window.game.towerManager.grid[gridY][gridX];
    const slotIndex = cell.length;
    const trinityTower = new Tower('TRINITY', rarity, gridX, gridY, slotIndex);

    // Trinity 전용 속성 추가
    trinityTower.trinitySkills = skills;
    trinityTower.chainMultiplier = CONFIG.TOWER_FUSION[rarity].chainMultiplier;

    // 그리드에 추가
    cell.push(trinityTower);
    cell.forEach((t, idx) => {
        t.slotIndex = idx;
        t.setPosition(true);
    });
}

// 이벤트 리스너
window.addEventListener('DOMContentLoaded', () => {
    const fusionBtn = document.getElementById('tower-fusion-btn');
    if (fusionBtn) fusionBtn.addEventListener('click', openTowerFusionModal);

    const modal = document.getElementById('tower-fusion-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('close-btn')) {
                modal.classList.remove('active');
            }
        });
    }
});
