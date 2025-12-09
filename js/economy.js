// 경제 시스템

class EconomyManager {
    constructor() {
        this.accountGold = 0;
        this.premiumCash = 0;
        this.upgradeStones = 0;
    }

    addAccountGold(amount) {
        this.accountGold += amount;
        this.save();
    }

    spendAccountGold(amount) {
        if (this.accountGold >= amount) {
            this.accountGold -= amount;
            this.save();
            return true;
        }
        return false;
    }

    addUpgradeStones(amount) {
        this.upgradeStones += amount;
        this.save();
    }

    spendUpgradeStones(amount) {
        if (this.upgradeStones >= amount) {
            this.upgradeStones -= amount;
            this.save();
            return true;
        }
        return false;
    }

    save() {
        // const data = {
        //     accountGold: this.accountGold,
        //     premiumCash: this.premiumCash,
        //     upgradeStones: this.upgradeStones
        // };
        // localStorage.setItem('economy', JSON.stringify(data));
    }

    load() {
        // const data = localStorage.getItem('economy');
        // if (data) {
        //     const parsed = JSON.parse(data);
        //     this.accountGold = parsed.accountGold || 0;
        //     this.premiumCash = parsed.premiumCash || 0;
        //     this.upgradeStones = parsed.upgradeStones || 0;
        // }
    }
}
