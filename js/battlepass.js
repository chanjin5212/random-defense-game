// 배틀패스 시스템

class BattlePassManager {
    constructor() {
        this.currentXP = 0;
        this.currentTier = 0;
        this.claimedRewards = [];
    }

    addXP(amount) {
        this.currentXP += amount;

        // 티어 업 체크
        while (this.currentXP >= this.getXPForNextTier() && this.currentTier < CONFIG.BATTLEPASS.MAX_TIER) {
            this.currentXP -= this.getXPForNextTier();
            this.currentTier++;
            showToast(`배틀패스 티어 ${this.currentTier} 달성!`, 'success');
        }

        this.save();
    }

    getXPForNextTier() {
        return CONFIG.BATTLEPASS.XP_PER_TIER;
    }

    getProgress() {
        return {
            currentTier: this.currentTier,
            currentXP: this.currentXP,
            maxTier: CONFIG.BATTLEPASS.MAX_TIER,
            xpForNext: this.getXPForNextTier(),
            percentage: (this.currentXP / this.getXPForNextTier()) * 100
        };
    }

    claimReward(tier) {
        if (this.currentTier >= tier && !this.claimedRewards.includes(tier)) {
            this.claimedRewards.push(tier);
            this.save();
            return true;
        }
        return false;
    }

    save() {
        // const data = {
        //     currentXP: this.currentXP,
        //     currentTier: this.currentTier,
        //     claimedRewards: this.claimedRewards
        // };
        // localStorage.setItem('battlepass', JSON.stringify(data));
    }

    load() {
        // const data = localStorage.getItem('battlepass');
        // if (data) {
        //     const parsed = JSON.parse(data);
        //     this.currentXP = parsed.currentXP || 0;
        //     this.currentTier = parsed.currentTier || 0;
        //     this.claimedRewards = parsed.claimedRewards || [];
        // }
    }
}

// 배틀패스 UI
function initBattlePassUI() {
    const battlepassBtn = document.getElementById('battlepass-btn');
    if (!battlepassBtn) return;

    battlepassBtn.addEventListener('click', () => {
        updateBattlePassUI();
        document.getElementById('battlepass-modal').classList.add('active');
    });
}

function updateBattlePassUI() {
    const tiersContainer = document.getElementById('battlepass-tiers');
    tiersContainer.innerHTML = '';

    for (let tier = 1; tier <= CONFIG.BATTLEPASS.MAX_TIER; tier++) {
        const tierElement = document.createElement('div');
        tierElement.className = 'battlepass-tier';

        const isUnlocked = window.battlePass && window.battlePass.currentTier >= tier;
        const isClaimed = window.battlePass && window.battlePass.claimedRewards.includes(tier);

        tierElement.innerHTML = `
            <div class="tier-number">Tier ${tier}</div>
            <div class="tier-reward">
                ${getTierReward(tier)}
            </div>
            <div class="tier-status">
                ${isClaimed ? '✓ 획득' : isUnlocked ? '획득 가능' : '잠김'}
            </div>
        `;

        if (isUnlocked) {
            tierElement.classList.add('unlocked');
        }

        tiersContainer.appendChild(tierElement);
    }
}

function getTierReward(tier) {
    // 간단한 보상 시스템
    if (tier % 10 === 0) {
        return `강화석 x${tier}`;
    } else if (tier % 5 === 0) {
        return `골드 x${tier * 100}`;
    } else {
        return `강화석 x${Math.floor(tier / 2)}`;
    }
}
