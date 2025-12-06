// 몬스터 클래스

class Monster {
    constructor(round, isBoss = false, isMissionBoss = false) {
        this.round = round;
        this.isBoss = isBoss;
        this.isMissionBoss = isMissionBoss;

        // 기본 스탯
        if (isBoss) {
            this.maxHP = calculateBossHP(round);
            this.speed = calculateMonsterSpeed(round) * CONFIG.BOSS.SPEED_MULTIPLIER * 100; // 100배 빠르게
            this.defense = CONFIG.BOSS.DEFENSE;
            this.goldReward = getBossReward(round);
            this.abilities = getBossAbilities(round);
        } else {
            this.maxHP = calculateMonsterHP(round);
            this.speed = calculateMonsterSpeed(round) * 100; // 100배 빠르게
            this.defense = 0;
            this.goldReward = calculateGoldDrop(round);
            this.abilities = [];
        }

        this.hp = this.maxHP;
        this.progress = 0; // 0 ~ 1 (경로 진행도)
        this.alive = true;

        // 상태 효과
        this.statusEffects = {
            slow: { active: false, duration: 0, percent: 0 },
            stun: { active: false, duration: 0 },
            fireDot: { active: false, duration: 0, damage: 0 },
            poisonDot: { active: false, duration: 0, percent: 0 }
        };

        // 보스 전용
        if (isBoss) {
            this.shieldCooldown = 0;
            this.shieldActive = false;
            this.regenTick = 0;
        }

        // 위치
        const pos = getPositionOnPath(this.progress);
        this.x = pos.x;
        this.y = pos.y;

        // 시각 효과
        this.hitFlash = 0;
        this.size = isBoss ? 30 : 20;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // 스턴 체크
        if (this.statusEffects.stun.active) {
            this.statusEffects.stun.duration -= deltaTime;
            if (this.statusEffects.stun.duration <= 0) {
                this.statusEffects.stun.active = false;
            }
            return; // 스턴 중에는 이동 안 함
        }

        // 이동 속도 계산
        let currentSpeed = this.speed;

        // 슬로우 적용
        if (this.statusEffects.slow.active) {
            currentSpeed *= (1 - this.statusEffects.slow.percent);
            this.statusEffects.slow.duration -= deltaTime;
            if (this.statusEffects.slow.duration <= 0) {
                this.statusEffects.slow.active = false;
            }
        }

        // 경로 진행
        const pathLength = getPathLength();
        this.progress += (currentSpeed / pathLength) * deltaTime;

        // 경로 끝 도달
        if (this.progress >= 1.0) {
            this.reachEnd();
            return;
        }

        // 위치 업데이트
        const pos = getPositionOnPath(this.progress);
        this.x = pos.x;
        this.y = pos.y;

        // DoT 데미지 적용
        this.applyDoTDamage(deltaTime);

        // 보스 능력 업데이트
        if (this.isBoss) {
            this.updateBossAbilities(deltaTime);
        }

        // 시각 효과 업데이트
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime * 5;
        }
    }

    applyDoTDamage(deltaTime) {
        // 화염 DoT
        if (this.statusEffects.fireDot.active) {
            this.takeDamage(this.statusEffects.fireDot.damage * deltaTime);
            this.statusEffects.fireDot.duration -= deltaTime;
            if (this.statusEffects.fireDot.duration <= 0) {
                this.statusEffects.fireDot.active = false;
            }
        }

        // 독 DoT
        if (this.statusEffects.poisonDot.active) {
            const poisonDamage = this.maxHP * this.statusEffects.poisonDot.percent * deltaTime;
            this.takeDamage(poisonDamage);
            this.statusEffects.poisonDot.duration -= deltaTime;
            if (this.statusEffects.poisonDot.duration <= 0) {
                this.statusEffects.poisonDot.active = false;
            }
        }
    }

    updateBossAbilities(deltaTime) {
        // 재생 능력
        if (this.abilities.includes('regen')) {
            this.regenTick += deltaTime;
            if (this.regenTick >= 1.0) {
                this.hp = Math.min(this.hp + this.maxHP * 0.01, this.maxHP);
                this.regenTick = 0;
            }
        }

        // 실드 능력
        if (this.abilities.includes('shield')) {
            if (this.shieldCooldown > 0) {
                this.shieldCooldown -= deltaTime;
            } else {
                this.shieldActive = true;
                this.shieldCooldown = 5.0;
                setTimeout(() => {
                    this.shieldActive = false;
                }, 3000);
            }
        }
    }

    takeDamage(damage) {
        if (!this.alive) return 0;

        // 방어력 적용
        let actualDamage = damage * (1 - this.defense);

        // 보스 실드 적용
        if (this.isBoss && this.shieldActive) {
            actualDamage *= 0.5;
        }

        this.hp -= actualDamage;
        this.hitFlash = 1.0;

        if (this.hp <= 0) {
            this.die();
        }

        return actualDamage;
    }

    die() {
        this.alive = false;

        // 분열 능력 (보스)
        if (this.isBoss && this.abilities.includes('split')) {
            // 게임 매니저에서 처리
            if (window.game) {
                window.game.spawnSplitMonsters(this.x, this.y, this.round);
            }
        }
    }

    reachEnd() {
        // 루프로 다시 시작
        this.progress = 0;
    }

    applySlow(percent, duration) {
        this.statusEffects.slow.active = true;
        this.statusEffects.slow.percent = Math.max(this.statusEffects.slow.percent, percent);
        this.statusEffects.slow.duration = Math.max(this.statusEffects.slow.duration, duration);
    }

    applyStun(duration) {
        this.statusEffects.stun.active = true;
        this.statusEffects.stun.duration = Math.max(this.statusEffects.stun.duration, duration);
    }

    applyFireDot(damage, duration) {
        this.statusEffects.fireDot.active = true;
        this.statusEffects.fireDot.damage = damage;
        this.statusEffects.fireDot.duration = duration;
    }

    applyPoisonDot(percent, duration) {
        this.statusEffects.poisonDot.active = true;
        this.statusEffects.poisonDot.percent = percent;
        this.statusEffects.poisonDot.duration = duration;
    }

    draw(ctx) {
        if (!this.alive) return;

        // 몬스터 본체
        ctx.save();

        // 히트 플래시
        if (this.hitFlash > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FF0000';
        }

        // 보스는 더 크고 화려하게
        if (this.isBoss) {
            // 보스 외곽선
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();

            // 보스 본체
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, '#FF4444');
            gradient.addColorStop(1, '#AA0000');
            ctx.fillStyle = gradient;
        } else {
            // 일반 몬스터
            ctx.fillStyle = '#EF4444';
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 실드 표시
        if (this.isBoss && this.shieldActive) {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 상태 효과 표시
        if (this.statusEffects.stun.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('★', this.x - 8, this.y - this.size - 10);
        }

        if (this.statusEffects.fireDot.active) {
            ctx.fillStyle = '#FF6600';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('🔥', this.x + this.size - 10, this.y - this.size);
        }

        if (this.statusEffects.poisonDot.active) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('☠', this.x - this.size, this.y - this.size);
        }

        ctx.restore();

        // HP 바
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 15;

        // 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP
        const hpPercent = this.hp / this.maxHP;
        let hpColor = '#10B981';
        if (hpPercent < 0.3) hpColor = '#EF4444';
        else if (hpPercent < 0.6) hpColor = '#F59E0B';

        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // 테두리
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // 보스는 HP 수치 표시
        if (this.isBoss) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(formatNumber(this.hp), this.x, barY - 5);
        }
    }
}

// 몬스터 매니저
class MonsterManager {
    constructor() {
        this.monsters = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5; // 초
        this.monstersToSpawn = 0;
    }

    startRound(round) {
        // 몬스터를 클리어하지 않음 - 계속 쌓임!
        // this.monsters = [];
        this.spawnTimer = 0;

        // 보스 라운드
        if (isBossRound(round)) {
            this.monstersToSpawn = 1;
            this.spawnBoss(round);
        } else {
            // 일반 라운드 - 라운드 수에 따라 몬스터 수 증가
            this.monstersToSpawn = Math.min(10 + Math.floor(round / 5), 50);
        }
    }

    spawnBoss(round) {
        const boss = new Monster(round, true, false);
        this.monsters.push(boss);
        this.monstersToSpawn--;
    }

    spawnMissionBoss(round) {
        const boss = new Monster(round, true, true);
        this.monsters.push(boss);
        showToast('미션 보스 출현!', 'warning');
    }

    spawnSplitMonsters(x, y, round) {
        // 보스 분열 시 2마리 생성
        for (let i = 0; i < 2; i++) {
            const monster = new Monster(round, false, false);
            monster.progress = 0.5; // 중간 지점에서 시작
            monster.x = x + (i === 0 ? -30 : 30);
            monster.y = y;
            this.monsters.push(monster);
        }
    }

    update(deltaTime) {
        // 몬스터 스폰
        if (this.monstersToSpawn > 0) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnMonster();
                this.spawnTimer = 0;
            }
        }

        // 몬스터 업데이트
        this.monsters.forEach(monster => monster.update(deltaTime));

        // 죽은 몬스터 제거
        this.monsters = this.monsters.filter(monster => monster.alive);
    }

    spawnMonster() {
        if (window.game) {
            const monster = new Monster(window.game.currentRound, false, false);
            this.monsters.push(monster);
            this.monstersToSpawn--;
        }
    }

    draw(ctx) {
        this.monsters.forEach(monster => monster.draw(ctx));
    }

    getAliveMonsters() {
        return this.monsters.filter(m => m.alive);
    }

    isRoundComplete() {
        return this.monstersToSpawn === 0 && this.monsters.length === 0;
    }

    clear() {
        this.monsters = [];
        this.monstersToSpawn = 0;
    }
}
