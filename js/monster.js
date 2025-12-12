// 몬스터 클래스

class Monster {
    constructor(round, isBoss = false, isMissionBoss = false, monsterType = null) {
        this.round = round;
        this.isBoss = isBoss;
        this.isMissionBoss = isMissionBoss;

        // 몬스터 타입 결정
        if (!isBoss && !monsterType) {
            const roundInCycle = ((round - 1) % 20) + 1;
            const typeKey = CONFIG.ROUND_MONSTER_TYPE[roundInCycle] || 'NORMAL';
            this.type = CONFIG.MONSTER_TYPES[typeKey];
            this.typeKey = typeKey;
        } else if (monsterType) {
            this.type = CONFIG.MONSTER_TYPES[monsterType];
            this.typeKey = monsterType;
        } else {
            this.type = null;
            this.typeKey = null;
        }

        // 기본 스탯
        if (isBoss) {
            this.maxHP = calculateBossHP(round);
            this.speed = calculateMonsterSpeed(round) * CONFIG.BOSS.SPEED_MULTIPLIER * 100; // 100배 빠르게
            this.defense = CONFIG.BOSS.DEFENSE;
            // 미션 보스는 고정 500골드, 일반 보스는 라운드 비례
            this.goldReward = isMissionBoss ? 500 : getBossReward(round);
            this.abilities = getBossAbilities(round);
            this.size = isMissionBoss ? 50 : 40;
        } else {
            // 타입별 스탯 적용
            const baseHP = calculateMonsterHP(round);
            const baseSpeed = calculateMonsterSpeed(round);
            const baseGold = calculateGoldDrop(round);

            this.maxHP = baseHP * this.type.hpMult;
            this.speed = baseSpeed * this.type.speedMult * 100;
            this.defense = this.type.defense;
            this.goldReward = baseGold * this.type.goldMult;
            this.abilities = [];
            this.size = this.type.size;

            // 재생형 설정
            if (this.type.regenRate) {
                this.regenRate = this.type.regenRate;
            }
        }

        this.hp = this.maxHP;
        this.progress = 0; // 0 ~ 1 (경로 진행도)
        this.alive = true;
        this.goldAwarded = false; // 골드 지급 여부 플래그 (중복 방지)

        // 상태 효과
        this.statusEffects = {
            slow: { active: false, duration: 0, percent: 0 },
            stun: { active: false, duration: 0 },
            freeze: { active: false, duration: 0 }, // 빙결 추가
            fireDot: { active: false, duration: 0, damage: 0 },
            poisonDot: { active: false, duration: 0, percent: 0 }
        };

        // 보스 전용
        if (isBoss) {
            this.shieldCooldown = 0;
            this.shieldActive = false;
            this.shieldHP = 0; // 실드 체력
            this.maxShieldHP = this.maxHP * CONFIG.BOSS.SHIELD_PERCENT; // 최대 실드 = 체력의 1%
        }

        // 위치
        const pos = getPositionOnPath(this.progress);
        this.x = pos.x;
        this.y = pos.y;

        // 시각 효과 제거됨

        // 데미지 텍스트
        this.damageTexts = [];

        // 더미 모드 (관리자용)
        this.isDummy = false;
        this.centerX = 0;
        this.centerY = 0;
        this.angle = 0;
        this.radius = 30;
    }

    setDummyMode(progress) {
        this.isDummy = true;
        this.maxHP = 10000000; // 매우 높은 체력
        this.hp = this.maxHP;
        this.defense = 0;
        this.speed = 40; // 적당한 고정 속도

        // 경로 진행도 설정
        this.progress = progress;

        // 초기 위치 설정
        const pos = getPositionOnPath(this.progress);
        this.x = pos.x;
        this.y = pos.y;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // 더미 모드여도 일반 이동 로직을 따름
        // 단, 상태 이상(스턴 등)은 적용받을 수 있음

        // 스턴 체크
        if (this.statusEffects.stun.active) {
            this.statusEffects.stun.duration -= deltaTime;
            if (this.statusEffects.stun.duration <= 0) {
                this.statusEffects.stun.active = false;
            }
            return; // 스턴 중에는 이동 안 함
        }

        // 빙결 체크 (Absolute Zero)
        if (this.statusEffects.freeze.active) {
            this.statusEffects.freeze.duration -= deltaTime;
            if (this.statusEffects.freeze.duration <= 0) {
                this.statusEffects.freeze.active = false;
            }
            return; // 빙결 중에는 이동 안 함 (완전 정지)
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

        // 시각 효과 제거됨

        // 데미지 텍스트 업데이트
        this.damageTexts.forEach(text => {
            text.y -= 30 * deltaTime; // 위로 떠오름
            text.life -= deltaTime;
            text.alpha = Math.max(0, text.life / text.maxLife);
        });
        this.damageTexts = this.damageTexts.filter(text => text.life > 0);

        // Expose Weakness 디버프 타이머
        if (this.exposeWeaknessTimer && this.exposeWeaknessTimer > 0) {
            this.exposeWeaknessTimer -= deltaTime;
        }
    }

    createDamageText(damage) {
        // 데미지 텍스트 개수 제한 (성능 최적화 - 최대 3개)
        if (this.damageTexts.length >= 3) return;

        // 데미지 텍스트 객체 생성
        const text = {
            damage: Math.round(damage),
            x: this.x + (Math.random() - 0.5) * 20, // 약간의 랜덤 오프셋
            y: this.y - this.size - 20,
            life: 1.0, // 1초 동안 표시
            maxLife: 1.0,
            alpha: 1.0
        };
        this.damageTexts.push(text);
    }

    applyDoTDamage(deltaTime) {
        // 재생형 회복
        if (this.regenRate && this.hp < this.maxHP) {
            this.hp = Math.min(this.hp + (this.maxHP * this.regenRate * deltaTime), this.maxHP);
        }

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
        // 실드 능력
        if (this.abilities.includes('shield')) {
            // 실드 재생 쿨다운
            if (this.shieldCooldown > 0) {
                this.shieldCooldown -= deltaTime;
            } else {
                // 실드 재생
                this.shieldHP = this.maxShieldHP;
                this.shieldCooldown = CONFIG.BOSS.SHIELD_REGEN_INTERVAL;
            }
        }
    }

    takeDamage(damage) {
        if (!this.alive) return 0;

        // Expose Weakness 디버프 적용
        if (this.exposeWeaknessTimer && this.exposeWeaknessTimer > 0) {
            damage *= this.exposeWeaknessMult;
        }

        // 방어력 적용
        let actualDamage = damage * (1 - this.defense);

        // 보스 실드 적용 (실드가 먼저 데미지 흡수)
        if (this.isBoss && this.shieldHP > 0) {
            if (actualDamage <= this.shieldHP) {
                // 실드가 모든 데미지 흡수
                this.shieldHP -= actualDamage;
                actualDamage = 0;
            } else {
                // 실드가 일부만 흡수하고 나머지는 체력에
                actualDamage -= this.shieldHP;
                this.shieldHP = 0;
            }
        }

        this.hp -= actualDamage;
        // hitFlash 제거됨

        // 데미지 텍스트 생성
        this.createDamageText(actualDamage);

        if (this.hp <= 0) {
            if (this.isDummy) {
                // 더미는 죽지 않고 즉시 회복
                this.hp = this.maxHP;
                // hitFlash 제거됨
                return actualDamage;
            }
            this.die();
        }

        return actualDamage;
    }

    die() {
        this.alive = false;

        // 골드 지급 (중복 방지)
        if (!this.goldAwarded && window.game) {
            window.game.addGold(this.goldReward);
            window.game.killCount++;

            // 보스 킬 카운트
            if (this.isBoss) {
                window.game.bossKills++;
            }

            this.goldAwarded = true;
        }

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

    applyFreeze(duration) {
        this.statusEffects.freeze.active = true;
        this.statusEffects.freeze.duration = Math.max(this.statusEffects.freeze.duration, duration);

        // 얼음 모양 생성 (처음 얼 때만)
        if (!this.iceVertices) {
            this.iceVertices = [];
            const numPoints = 8;
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 * i) / numPoints;
                // 불규칙한 반지름 (뾰족뾰족하게) - 크기 축소 (1.3 ~ 1.7배)
                const radius = this.size * (1.3 + (Math.random() * 0.4));
                this.iceVertices.push({
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                });
            }
        }
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

        // 히트 플래시 제거됨

        // 보스는 더 크고 화려하게
        if (this.isBoss) {
            this.drawBoss(ctx);
        } else {
            // 타입별 몬스터 그리기
            this.drawMonsterByType(ctx);
        }

        ctx.restore();

        // HP 바
        this.drawHealthBar(ctx);

        // 데미지 텍스트 렌더링
        this.drawDamageTexts(ctx);
    }

    drawBoss(ctx) {
        if (this.isMissionBoss) {
            // 미션 보스: 검은색 + 보라색 오라
            ctx.strokeStyle = '#9333EA';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#9333EA';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();

            // 본체 (검은색)
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            gradient.addColorStop(0, '#1F2937');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // 해골 마크
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☠', this.x, this.y);
        } else {
            // 일반 보스: 붉은색 별 + 금색 왕관
            // 금색 외곽선
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FFD700';

            // 별 모양 그리기
            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = this.x + Math.cos(angle) * this.size;
                const y = this.y + Math.sin(angle) * this.size;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                const innerAngle = angle + Math.PI / 5;
                const innerX = this.x + Math.cos(innerAngle) * (this.size * 0.4);
                const innerY = this.y + Math.sin(innerAngle) * (this.size * 0.4);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // 왕관
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', this.x, this.y - this.size - 10);
        }

        // 실드 표시 (실드 HP가 있을 때)
        if (this.shieldHP > 0) {
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawMonsterByType(ctx) {
        ctx.fillStyle = this.type.color;

        switch (this.type.shape) {
            case 'circle':
                // 원형 (일반형, 재생형)
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // 재생형 펄스 효과
                if (this.regenRate) {
                    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
                    ctx.strokeStyle = `rgba(132, 204, 22, ${pulse})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;

            case 'triangle':
                // 삼각형 (빠른형)
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();

                // 잔상 효과
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
                    const x = this.x - 5 + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
                break;

            case 'hexagon':
                // 육각형 (중장갑형)
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();

                // 금속 테두리
                ctx.strokeStyle = '#D97706';
                ctx.lineWidth = 3;
                ctx.stroke();
                break;

            case 'square':
                // 사각형 (탱크형)
                ctx.fillRect(
                    this.x - this.size,
                    this.y - this.size,
                    this.size * 2,
                    this.size * 2
                );

                // 테두리
                ctx.strokeStyle = '#7F1D1D';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    this.x - this.size,
                    this.y - this.size,
                    this.size * 2,
                    this.size * 2
                );
                break;
        }

        // 상태 효과 표시
        if (this.statusEffects.stun.active) {
            ctx.fillStyle = '#FFFF00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', this.x, this.y - this.size - 10);
        }

        // 빙결 이펙트
        if (this.statusEffects.freeze.active && this.iceVertices) {
            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.beginPath();
            this.iceVertices.forEach((v, i) => {
                if (i === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            });
            ctx.closePath();

            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
            grad.addColorStop(0, 'rgba(200, 240, 255, 0.4)');
            grad.addColorStop(1, 'rgba(100, 200, 255, 0.7)');
            ctx.fillStyle = grad;
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        if (this.statusEffects.fireDot.active) {
            ctx.fillStyle = '#FF6600';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔥', this.x + this.size, this.y - this.size);
        }

        if (this.statusEffects.poisonDot.active) {
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☠', this.x - this.size, this.y - this.size);
        }
    }

    drawDamageTexts(ctx) {
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.damageTexts.forEach(text => {
            ctx.globalAlpha = text.alpha;

            // 외곽선 (가독성 향상)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(formatNumber(text.damage), text.x, text.y);

            // 텍스트
            ctx.fillStyle = '#FFFF00'; // 노란색
            ctx.fillText(formatNumber(text.damage), text.x, text.y);
        });

        ctx.restore();
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
            // 일반 라운드 - 기본 30마리 시작
            this.monstersToSpawn = 30 + Math.floor(round / 2); // 라운드 진행에 따라 소폭 증가

            // 라운드 종료 5초 전까지 모든 몬스터 스폰
            const spawnDuration = CONFIG.GAME.ROUND_DURATION - 5;
            if (spawnDuration > 0 && this.monstersToSpawn > 0) {
                this.spawnInterval = spawnDuration / this.monstersToSpawn;
            } else {
                this.spawnInterval = 0.5; // fallback
            }
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

    spawnDummyMonsters(count) {
        this.monsters = []; // 기존 몬스터 제거

        // 경로상 고르게 분배 배치
        for (let i = 0; i < count; i++) {
            const monster = new Monster(1, false, false);
            // 0 ~ 1 사이를 균등하게 분할
            const progress = i / count;
            monster.setDummyMode(progress);
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
