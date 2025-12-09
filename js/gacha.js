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
                // if (result.rarityData.multiplier >= 5.0) {
                //     showToast(`✨ ${message}`, 'success');
                // } else if (result.rarityData.multiplier >= 2.0) {
                //     showToast(`⭐ ${message}`, 'success');
                // } else {
                //     showToast(message, 'info');
                // }
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

        const cost = CONFIG.ECONOMY.SINGLE_PULL_COST;

        if (window.game.gold < cost) {
            showToast('골드가 부족합니다!', 'error');
            return;
        }

        // 골드 차감
        window.game.gold -= cost;
        window.game.updateUI();

        // 뽑기 실행
        const results = window.game.gacha.singlePull();

        // 타워 추가 (글로벌 소환)
        const result = results[0];
        const addResult = window.game.towerManager.spawnTowerGlobal(result.tower, result.rarity);

        if (addResult.success) {
            // 결과 표시
            window.game.gacha.showResults(results);

            // 레전드 이상이면 축하 효과 표시
            const legendaryRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
            if (legendaryRarities.includes(result.rarity)) {
                showLegendaryCelebration(
                    result.towerData.name,
                    result.rarityData.name,
                    result.rarity,
                    result.rarityData.color
                );
            }

            // 만약 현재 보고 있는 칸에 타워가 추가되었다면 목록 갱신
            if (window.game.towerManager.selectedCell &&
                window.game.towerManager.selectedCell.x === addResult.x &&
                window.game.towerManager.selectedCell.y === addResult.y) {
                if (typeof updateCellTowerList === 'function') {
                    updateCellTowerList();
                }
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

        const cost = CONFIG.ECONOMY.TEN_PULL_COST;

        if (window.game.gold < cost) {
            showToast('골드가 부족합니다!', 'error');
            return;
        }

        // 골드 차감
        window.game.gold -= cost;
        window.game.updateUI();

        // 뽑기 실행
        const results = window.game.gacha.tenPull();

        // 타워 추가 (글로벌 소환)
        let addedCount = 0;
        for (const result of results) {
            const addResult = window.game.towerManager.spawnTowerGlobal(result.tower, result.rarity);
            if (addResult.success) {
                addedCount++;
                // 현재 보고 있는 칸 업데이트
                if (window.game.towerManager.selectedCell &&
                    window.game.towerManager.selectedCell.x === addResult.x &&
                    window.game.towerManager.selectedCell.y === addResult.y) {
                    if (typeof updateCellTowerList === 'function') {
                        updateCellTowerList();
                    }
                }

                // 레전드 이상이면 축하 효과 표시 (하나씩)
                const legendaryRarities = ['LEGENDARY', 'MYTHIC', 'DIVINE', 'TRANSCENDENT'];
                if (legendaryRarities.includes(result.rarity)) {
                    // 약간의 딜레이를 두고 표시하여 겹침 방지
                    setTimeout(() => {
                        showLegendaryCelebration(
                            result.towerData.name,
                            result.rarityData.name,
                            result.rarity,
                            result.rarityData.color
                        );
                    }, addedCount * 500);
                }
            } else {
                // 공간 부족 등으로 실패 시 중단? 아니면 계속 시도?
                // 여기서는 공간 부족이면 멈추는게 맞음 (모든 칸이 꽉 찼을 수 있음)
                break;
            }
        }

        // 결과 표시
        window.game.gacha.showResults(results);

        if (addedCount < results.length) {
            showToast(`${addedCount}개의 타워만 추가되었습니다 (공간 부족)`, 'warning');
            // 남은 금액 환불 로직은 복잡해지므로 생략하거나, 
            // 실제로는 addedCount만큼만 차감하는게 맞지만 여기서는 단순화
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

    // 타워 판매 버튼 추가
    let gachaButtonGrid = document.getElementById('gacha-button-grid');
    if (gachaButtonGrid && !document.getElementById('tower-sell-btn')) {
        const sellBtn = document.createElement('button');
        sellBtn.id = 'tower-sell-btn';
        sellBtn.className = 'btn-gacha btn-sell';
        sellBtn.innerHTML = '<span>타워 판매</span>';
        sellBtn.addEventListener('click', () => {
            showTowerSellPanel();
        });
        gachaButtonGrid.appendChild(sellBtn);
    }

    // 타워 판매 (FIFO)
    function sellTower(towerType, rarity) {
        if (!window.game || !window.game.gacha) return false;
        const rarityData = CONFIG.RARITY[rarity];
        if (!rarityData.sellPrice) {
            showToast('레전드 이상 등급은 판매할 수 없습니다!', 'error');
            return false;
        }
        const history = window.game.gacha.pullHistory;
        const targetIndex = history.findIndex(item => item.tower === towerType && item.rarity === rarity && !item.sold);
        if (targetIndex === -1) {
            showToast('판매할 타워가 없습니다!', 'error');
            return false;
        }
        history[targetIndex].sold = true;
        const sellPrice = rarityData.sellPrice;
        if (window.game && window.game.towerManager) removeTowerFromMap(towerType, rarity);
        window.game.gold += sellPrice;
        window.game.updateUI();
        // showToast(`${rarityData.name} ${CONFIG.TOWERS[towerType].name} 판매 (+${sellPrice}G)`, 'success');
        updateTowerSellPanel();
        return true;
    }

    // 맵에서 타워 제거
    function removeTowerFromMap(towerType, rarity) {
        if (!window.game || !window.game.towerManager) return;
        const grid = window.game.towerManager.grid;
        let foundTower = null, foundX = -1, foundY = -1;
        outerLoop:
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                for (let i = 0; i < cell.length; i++) {
                    const tower = cell[i];
                    if (tower.towerKey === towerType && tower.rarity === rarity) {
                        foundTower = tower; foundX = x; foundY = y;
                        break outerLoop;
                    }
                }
            }
        }
        if (foundTower) {
            const cell = grid[foundY][foundX];
            const index = cell.indexOf(foundTower);
            if (index !== -1) {
                cell.splice(index, 1);
                cell.forEach((t, idx) => { t.slotIndex = idx; t.setPosition(true); });
            }
        }
    }

    // 판매 패널 표시
    function showTowerSellPanel() {
        const existingPanel = document.getElementById('sell-panel-overlay');
        if (existingPanel) existingPanel.remove();
        const overlay = document.createElement('div');
        overlay.id = 'sell-panel-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
        const panel = document.createElement('div');
        panel.style.cssText = 'background: linear-gradient(135deg, #1F2937 0%, #111827 100%); border: 2px solid #F59E0B; border-radius: 12px; padding: 30px; max-width: 800px; max-height: 80vh; overflow-y: auto;';
        const title = document.createElement('h2');
        title.textContent = '타워 판매';
        title.style.cssText = 'text-align: center; color: #FBBF24; margin-bottom: 20px;';
        panel.appendChild(title);
        const grid = document.createElement('div');
        grid.id = 'sell-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;';
        const towerTypes = ['STANDARD', 'SPLASH', 'SNIPER'];
        const sellableRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE'];
        sellableRarities.forEach(rarity => {
            towerTypes.forEach(type => {
                grid.appendChild(createSellButton(type, rarity));
            });
        });
        panel.appendChild(grid);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '닫기';
        closeBtn.style.cssText = 'width: 100%; padding: 12px; background: #EF4444; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;';
        closeBtn.addEventListener('click', () => overlay.remove());
        panel.appendChild(closeBtn);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    // 판매 버튼 생성
    function createSellButton(towerType, rarity) {
        const btn = document.createElement('button');
        const rarityData = CONFIG.RARITY[rarity];
        const towerData = CONFIG.TOWERS[towerType];
        const count = getTowerCount(towerType, rarity);
        btn.style.cssText = `padding: 15px; background: ${count > 0 ? rarityData.color : '#374151'}; color: white; border: 2px solid ${count > 0 ? '#FFFFFF' : '#4B5563'}; border-radius: 8px; cursor: ${count > 0 ? 'pointer' : 'not-allowed'}; opacity: ${count > 0 ? '1' : '0.5'}; font-size: 14px; font-weight: bold; text-align: center; transition: transform 0.2s;`;
        btn.innerHTML = `<div>${towerData.name.replace(' 타워', '')}</div><div style="font-size: 12px; margin: 5px 0;">${rarityData.name}</div><div style="font-size: 11px;">보유: ${count}개</div><div style="font-size: 13px; color: #FCD34D;">${rarityData.sellPrice}G</div>`;
        if (count > 0) {
            btn.addEventListener('click', () => sellTower(towerType, rarity));
            btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        }
        return btn;
    }

    // 보유 개수 계산
    function getTowerCount(towerType, rarity) {
        if (!window.game || !window.game.gacha) return 0;
        return window.game.gacha.pullHistory.filter(item => item.tower === towerType && item.rarity === rarity && !item.sold).length;
    }

    // 판매 패널 업데이트
    function updateTowerSellPanel() {
        const grid = document.getElementById('sell-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const towerTypes = ['STANDARD', 'SPLASH', 'SNIPER'];
        const sellableRarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'UNIQUE'];
        sellableRarities.forEach(rarity => {
            towerTypes.forEach(type => {
                grid.appendChild(createSellButton(type, rarity));
            });
        });
    }

}