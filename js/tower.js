// 타워 클래스 (간소화 버전 - 공격형만)

class Tower {
    constructor(towerKey, rarity, gridX, gridY, slotIndex) {
        this.towerKey = towerKey;
        this.towerData = CONFIG.TOWERS[towerKey];
        this.rarity = rarity;
        this.rarityData = CONFIG.RARITY[rarity];
        this.gridX = gridX;
        this.gridY = gridY;
        this.slotIndex = slotIndex;

        // 스탯 계산 (등급 배수 + 타워 강화 보너스 적용)
        let damageMultiplier = this.rarityData.multiplier;

        // 타워 강화 보너스 적용 (타워 종류별)
        if (window.towerUpgradeManager) {
            const upgradeMultiplier = window.towerUpgradeManager.getDamageMultiplier(this.towerKey);
            damageMultiplier *= upgradeMultiplier;
        }

        this.damage = this.towerData.baseDamage * damageMultiplier;
        this.attackSpeed = this.towerData.attackSpeed;
        this.range = this.towerData.range;
        this.type = this.towerData.type;
        this.effect = this.towerData.effect;

        // 공격 타이머
        this.attackCooldown = 0;

        // 위치 계산
        this.setPosition();

        // 시각 효과
        this.attackAnimation = 0;

        // 판매 가격 (등급별 설정 사용)
        this.sellPrice = this.rarityData.sellPrice || 5;

        // 스킬 초기화
        this.skill = null;
        if (CONFIG.TOWER_SKILLS && CONFIG.TOWER_SKILLS[this.towerKey]) {
            this.skill = CONFIG.TOWER_SKILLS[this.towerKey][this.rarity];
        }

        // 스킬 상태 변수
        this.skillCooldown = 0;
        this.skillActive = false;
        this.skillTimer = 0;
        this.attackCount = 0;
        this.originalAttackSpeed = this.attackSpeed; // 공속 복구용
    }

    setPosition(instant = true) {
        const grid = CONFIG.GRID_AREA;
        const cellWidth = grid.cellWidth;
        const cellHeight = grid.cellHeight;

        const cellCenterX = grid.x + (this.gridX * cellWidth) + (cellWidth / 2);
        const cellCenterY = grid.y + (this.gridY * cellHeight) + (cellHeight / 2);

        // 랜덤 산개 배치 (자연스럽게)
        // 시드 기반 랜덤을 사용하면 좋겠지만, 간단하게 슬롯 인덱스 기반으로 약간의 랜덤성 부여
        const angle = (Math.PI * 2 / CONFIG.GAME.TOWERS_PER_SLOT) * this.slotIndex + (Math.random() * 0.5 - 0.25);
        const radius = 20 + (Math.random() * 20); // 20~40 범위로 산개

        this.targetX = cellCenterX + Math.cos(angle) * radius;
        this.targetY = cellCenterY + Math.sin(angle) * radius;

        if (instant) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
        } else {
            this.isMoving = true;
            this.moveSpeed = 500; // 픽셀/초
        }
    }

    update(deltaTime, monsters) {
        // 이동 로직
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                const moveDist = this.moveSpeed * deltaTime;
                this.x += (dx / dist) * moveDist;
                this.y += (dy / dist) * moveDist;
            }
        }

        // 스킬 업데이트
        this.updateSkills(deltaTime, monsters);

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.attackAnimation > 0) {
            this.attackAnimation -= deltaTime * 5;
        }

        if (this.attackCooldown <= 0) {
            this.attack(monsters);
        }
    }

    updateSkills(deltaTime, monsters) {
        if (!this.skill) return;

        // 쿨타임 스킬 (Armageddon, Orbital Laser, Overdrive)
        if (this.skill.type === 'cooldown') {
            if (this.skillCooldown > 0) {
                this.skillCooldown -= deltaTime;
            } else if (monsters && monsters.length > 0) {
                this.triggerSkill(monsters);
                this.skillCooldown = this.skill.cooldown;
            }
        }

        // 지속 효과 타이머 (Overdrive)
        if (this.skillActive) {
            this.skillTimer -= deltaTime;
            if (this.skillTimer <= 0) {
                this.deactivateSkill();
            }
        }
    }

    triggerSkill(monsters) {
        if (!window.game) return;

        if (this.skill.name.includes('Armageddon')) {
            this.castArmageddon(monsters);
        } else if (this.skill.name.includes('Orbital Laser')) {
            this.castOrbitalLaser(monsters);
        } else if (this.skill.name.includes('Overdrive')) {
            this.activateOverdrive();
        }
    }

    activateOverdrive() {
        this.skillActive = true;
        this.skillTimer = this.skill.duration;
        this.attackSpeed = this.originalAttackSpeed / this.skill.speedMult;
        // 시각 효과 (임시)
        if (window.game) window.game.createHitParticles(this.x, this.y, '#FFFF00');
    }

    deactivateSkill() {
        this.skillActive = false;
        if (this.skill.name.includes('Overdrive') || this.skill.name.includes('Battle Rush')) {
            this.attackSpeed = this.originalAttackSpeed;
        }
    }

    castArmageddon(monsters) {
        if (!window.game) return;

        // 전역 충격(Global Shock) 발동
        // 데미지: 스킬 데미지 (초당 DPS로 적용)
        // 지속시간: 3초
        // 3초간 지직거리며 전체 경로에 데미지를 줌
        const dps = this.damage * this.skill.damageMult;

        window.game.activateGlobalShock(3.0, dps);

        // 스킬 발동 알림 (선택사항, 지직거리는 효과가 충분하다면 생략 가능)
        // showToast('⚡ GLOBAL SHOCK! ⚡', 'error');
    }

    castOrbitalLaser(monsters) {
        if (monsters.length === 0) return;

        // 가장 체력 많은 적 (보스 우선)
        const target = monsters.reduce((max, m) => m.hp > max.hp ? m : max, monsters[0]);
        if (target && target.alive) {
            const damage = this.damage * this.skill.damageMult;
            target.takeDamage(damage);

            // 궤도 레이저 이펙트 생성
            this.createLaserEffect(this, target, true); // true = super laser
        }
    }

    attack(monsters) {
        const targets = this.findTargets(monsters);
        if (targets.length === 0) return;

        // 모든 타겟 공격 (Multi-Shot 지원)
        targets.forEach(target => {
            this.executeAttack(target);
        });

        if (this.attackSpeed > 0) {
            // 공격 속도 버프 적용 (Commander's Aura)
            this.attackCooldown = this.getBuffedAttackInterval();
        }

        this.attackAnimation = 1.0;
    }

    findTargets(monsters) {
        const aliveMonsters = monsters.filter(m => m.alive);
        const inRange = aliveMonsters.filter(m => {
            return distance(this.x, this.y, m.x, m.y) <= this.range;
        });

        // Multi-Shot (Standard Mythic)
        if (this.skill && this.skill.name.includes('Multi-Shot')) {
            // 거리순 정렬 후 상위 N명
            inRange.sort((a, b) => distance(this.x, this.y, a.x, a.y) - distance(this.x, this.y, b.x, b.y));
            return inRange.slice(0, this.skill.targetCount);
        }

        if (inRange.length === 0) return [];

        if (this.effect === 'sniper') {
            return [inRange.reduce((max, m) => m.hp > max.hp ? m : max)];
        }

        return [inRange.reduce((closest, m) => {
            const d1 = distance(this.x, this.y, closest.x, closest.y);
            const d2 = distance(this.x, this.y, m.x, m.y);
            return d2 < d1 ? m : closest;
        })];
    }

    executeAttack(target) {
        // 기본 데미지 계산
        let finalDamage = this.applyAccountStats(this.damage, target);

        // 스킬 데미지 보정
        if (this.skill) {
            // Armor Piercing (Sniper Mythic) - 30% 추가 피해
            if (this.skill.name.includes('Armor Piercing')) {
                finalDamage *= (1 + this.skill.bonusDamageMult);
            }

            // Executioner (Sniper Divine)
            if (this.skill.name.includes('Executioner') && (target.hp / target.maxHP) <= this.skill.hpThreshold) {
                finalDamage *= this.skill.damageMult;
            }
        }

        if (window.game) {
            // 스플래시 타워(AOE): 즉발 연쇄 번개 공격
            if (this.effect === 'aoe') {
                this.createSingleLightning(this, target);
                this.applyDamageToTarget(target, finalDamage);

                // Frozen Field (Splash Mythic) - 기존 빙결 스킬
                if (this.skill && this.skill.name.includes('Frozen Field') && Math.random() < this.skill.chance) {
                    if (target.applyStun && !target.isBoss) {
                        target.applyStun(this.skill.duration);
                    }
                }
            }
            // 저격 타워(SNIPER): 즉발 레이저 공격
            else if (this.effect === 'sniper') {
                this.createLaserEffect(this, target);
                this.applyDamageToTarget(target, finalDamage);

                // Expose Weakness (Sniper Legendary) - 약점 노출 디버프
                if (this.skill && this.skill.name.includes('Expose Weakness')) {
                    target.exposeWeaknessTimer = this.skill.duration;
                    target.exposeWeaknessMult = this.skill.damageAmpMult;
                }
            }
            // 일반 타워: 투사체 발사
            else {
                const projectile = new Projectile(
                    this.x, this.y,
                    target.x, target.y,
                    finalDamage,
                    this.rarityData.color
                );
                projectile.tower = this;
                projectile.target = target;
                window.game.projectiles.push(projectile);
            }

            // 공격 후 발동 스킬
            if (this.skill) {
                // Battle Rush (Standard Legendary) - 10% 확률로 공속 버프
                if (this.skill.name.includes('Battle Rush') && Math.random() < this.skill.chance) {
                    this.skillActive = true;
                    this.skillTimer = this.skill.duration;
                    this.attackSpeed = this.originalAttackSpeed / (1 + this.skill.speedBoost);
                    if (window.game) window.game.createHitParticles(this.x, this.y, '#FFD700');
                }

                // Chain Attack (Standard Mythic) - 50% 확률로 즉시 재공격
                if (this.skill.name.includes('Chain Attack') && Math.random() < this.skill.chance) {
                    // 같은 대상에게 약간의 딜레이 후 한 번 더 공격 (따당 효과)
                    const chainDamage = this.applyAccountStats(this.damage, target);

                    setTimeout(() => {
                        if (!window.game || !target.alive) return;

                        if (this.effect === 'aoe') {
                            this.createSingleLightning(this, target);
                            this.applyDamageToTarget(target, chainDamage);
                        } else if (this.effect === 'sniper') {
                            this.createLaserEffect(this, target);
                            this.applyDamageToTarget(target, chainDamage);
                        } else {
                            const projectile = new Projectile(
                                this.x, this.y,
                                target.x, target.y,
                                chainDamage,
                                '#FF6B6B' // 연쇄 공격은 빨간색
                            );
                            projectile.tower = this;
                            projectile.target = target;
                            window.game.projectiles.push(projectile);
                        }
                    }, 150); // 150ms 딜레이로 "따당" 효과
                }

                // Magma Pool (Splash Legendary) - 마그마 지대 생성
                if (this.skill.name.includes('Magma Pool')) {
                    this.createMagmaPool(target);
                }

                // Meteor (Splash Divine)
                if (this.skill.name.includes('Meteor')) {
                    this.attackCount++;
                    if (this.attackCount >= this.skill.count) {
                        this.castMeteor(target);
                        this.attackCount = 0;
                    }
                }

                // Doppelganger (Standard Transcendent) - 분신 2마리
                if (this.skill.name.includes('Doppelganger')) {
                    this.castDoppelgangerAttack(target);
                }
            }
        }
    }

    castMeteor(target) {
        if (!window.game) return;

        // 메테오 파라미터
        const damage = this.damage * this.skill.damageMult;
        const radius = this.skill.radius;
        const startY = target.y - 600; // 화면 위에서 시작

        // 메테오 투사체 생성 (낙하)
        const projectile = new Projectile(
            target.x, startY,
            target.x, target.y,
            damage,
            '#FF4500',
            'meteor'
        );

        // 충돌 시 실행될 로직 (콜백)
        projectile.onHit = () => {
            if (!window.game) return;

            // 1. 화면 흔들림 및 폭발 이펙트
            if (window.game.renderer) {
                window.game.renderer.drawMeteor(target.x, target.y, radius);
            }

            // 2. 광역 데미지
            const monsters = window.game.monsterManager.getAliveMonsters();
            let hitCount = 0;
            monsters.forEach(m => {
                const dist = Math.sqrt((target.x - m.x) ** 2 + (target.y - m.y) ** 2);
                if (dist <= radius) {
                    const actualDmg = m.takeDamage(damage);
                    if (window.game) window.game.damageDealt += actualDmg;
                    hitCount++;
                }
            });
        };

        window.game.projectiles.push(projectile);
    }

    createMagmaPool(target) {
        if (!window.game) return;

        // 마그마 지대 생성
        const magmaPool = {
            x: target.x,
            y: target.y,
            radius: this.skill.radius,
            damage: this.damage * this.skill.damageMult, // 매초 피해량
            duration: this.skill.duration,
            timer: this.skill.duration,
            tower: this
        };

        // 게임에 마그마 풀 배열 추가
        if (!window.game.magmaPools) {
            window.game.magmaPools = [];
        }
        window.game.magmaPools.push(magmaPool);
    }

    castDivinePunishment() {
        if (!window.game) return;

        const monsters = window.game.monsterManager.getAliveMonsters();
        const damage = this.applyAccountStats(this.damage, null);

        // 모든 적에게 번개 공격
        monsters.forEach(monster => {
            // 번개 이펙트 생성
            this.createSingleLightning(this, monster);

            // 데미지 적용
            const actualDmg = monster.takeDamage(damage);
            if (window.game) window.game.damageDealt += actualDmg;
        });

        // 화면 흔들림 효과
        if (window.game.renderer) {
            window.game.renderer.shakeScreen(3, 0.2);
        }
    }

    castDoppelgangerAttack(target) {
        if (!window.game) return;

        const cloneCount = this.skill.cloneCount || 1;
        const damage = this.applyAccountStats(this.damage, target) * this.skill.cloneDamageMult;
        const cloneOffset = 18; // 분신 위치 (drawStandardTower와 동일)

        // 분신들을 각자의 위치에서 발사
        for (let i = 0; i < cloneCount; i++) {
            const side = i === 0 ? -1 : 1; // 왼쪽, 오른쪽
            const cloneX = this.x + (side * cloneOffset);
            const cloneY = this.y;
            const alpha = 0.7 - (i * 0.15); // 투사체도 점점 투명

            const projectile = new Projectile(
                cloneX, cloneY, // 분신 위치에서 발사
                target.x, target.y,
                damage,
                `rgba(96, 165, 250, ${alpha})` // 하늘색 (#60A5FA)
            );
            projectile.tower = this;
            projectile.target = target;
            window.game.projectiles.push(projectile);
        }
    }

    createLaserEffect(from, to, isSuper = false) {
        if (!window.game) return;

        const beam = {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            life: isSuper ? 0.3 : 0.15,
            maxLife: isSuper ? 0.3 : 0.15,
            color: isSuper ? '#00FFFF' : '#EF4444', // 슈퍼 레이저는 청록색
            width: isSuper ? 12 : 4
        };

        window.game.beamEffects = window.game.beamEffects || [];
        window.game.beamEffects.push(beam);
    }

    createSingleLightning(from, to) {
        if (!window.game) return;

        const lightning = {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            life: 0.2, // 짧고 강렬하게
            color: '#60A5FA', // 밝은 파란색
            width: 3
        };

        window.game.lightningEffects = window.game.lightningEffects || [];
        window.game.lightningEffects.push(lightning);
    }

    applyDamageToTarget(target, damage) {
        const actualDamage = target.takeDamage(damage);

        // AOE 효과
        if (this.effect === 'aoe') {
            this.applyAOEDamage(target, damage);
        }

        // 골드 획득
        if (!target.alive && window.game) {
            window.game.addGold(target.goldReward);
            window.game.killCount++;
        }

        return actualDamage;
    }

    applyAOEDamage(epicenter, damage) {
        if (!window.game) return;

        const radius = 250; // 범위 대폭 증가 (연쇄가 잘 되도록)

        // Divine Punishment (Splash Mythic) - 30% 확률로 모든 적에게 연쇄
        let maxChains = 8; // 기본 최대 8번 연쇄
        let isDivinePunishment = false;

        if (this.skill && this.skill.name.includes('Divine Punishment') && Math.random() < this.skill.chance) {
            maxChains = 999; // 모든 적에게 연쇄
            isDivinePunishment = true;
        }

        const monsters = window.game.monsterManager.getAliveMonsters();

        // 이미 맞은 몬스터 추적
        const hitMonsters = new Set([epicenter]);
        let currentTarget = epicenter;
        let chainCount = 0;

        // Absolute Zero (Splash Divine)
        let freezeDuration = 0;
        if (this.skill && this.skill.name.includes('Absolute Zero')) {
            freezeDuration = 0.6 / this.attackSpeed;
            epicenter.applyFreeze(freezeDuration);
        }

        // 연쇄 번개 효과를 위해 타겟 수집
        const chainTargets = [epicenter];

        while (chainCount < maxChains) {
            // 현재 타겟 주변의 다음 타겟 찾기 (가장 가까운)
            let nearestMonster = null;
            let nearestDist = Infinity;

            monsters.forEach(monster => {
                if (hitMonsters.has(monster) || !monster.alive) return;

                const dist = distance(currentTarget.x, currentTarget.y, monster.x, monster.y);
                if (dist <= radius && dist < nearestDist) {
                    nearestDist = dist;
                    nearestMonster = monster;
                }
            });

            if (!nearestMonster) break;

            // 다음 타겟에게 데미지 (감소 없이 100% 데미지)
            const chainDamage = damage;
            nearestMonster.takeDamage(chainDamage);

            // 빙결 적용
            if (freezeDuration > 0) {
                nearestMonster.applyFreeze(freezeDuration);
            }

            // 골드 획득 처리
            if (!nearestMonster.alive) {
                window.game.addGold(nearestMonster.goldReward);
                window.game.killCount++;
            }

            hitMonsters.add(nearestMonster);
            chainTargets.push(nearestMonster);
            currentTarget = nearestMonster;
            chainCount++;
        }



        // 번개 이펙트 생성
        this.createChainLightning(chainTargets);
    }

    createChainLightning(targets) {
        if (!window.game || targets.length < 2) return;

        // 번개 연쇄 이펙트 생성
        for (let i = 0; i < targets.length - 1; i++) {
            const from = targets[i];
            const to = targets[i + 1];

            const lightning = {
                x1: from.x,
                y1: from.y,
                x2: to.x,
                y2: to.y,
                life: 0.3, // 0.3초 동안 표시
                color: '#60A5FA', // 밝은 파란색 번개
                width: 3
            };

            window.game.lightningEffects = window.game.lightningEffects || [];
            window.game.lightningEffects.push(lightning);
        }

        // 각 타겟에 번개 파티클 생성
        targets.forEach(target => {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const speed = 2;
                const particle = new Particle(
                    target.x, target.y,
                    '#60A5FA',
                    {
                        x: Math.cos(angle) * speed,
                        y: Math.sin(angle) * speed
                    }
                );
                window.game.particles.push(particle);
            }
        });
    }

    applyAccountStats(baseDamage, target) {
        if (!window.game || !window.game.accountStats) return baseDamage;

        const stats = window.game.accountStats;
        let damage = baseDamage;

        damage *= (1 + stats.ATK_PERCENT / 100);

        if (Math.random() < stats.CRIT_RATE / 100) {
            damage *= (1 + stats.CRIT_DAMAGE / 100);
        }

        if (target.isBoss) {
            damage *= (1 + stats.BOSS_DAMAGE / 100);
        }

        return damage;
    }

    createExplosionParticles(x, y) {
        if (!window.game) return;

        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = randomInt(2, 5);
            const particle = new Particle(
                x, y,
                this.rarityData.color,
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }
            );
            window.game.particles.push(particle);
        }
    }

    draw(ctx) {
        ctx.save();

        // 공격 애니메이션 효과 (공통)
        if (this.attackAnimation > 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.rarityData.color;
            // 공격 시 살짝 커짐
            const scale = 1 + (this.attackAnimation * 0.1);
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        const color = this.rarityData.color;
        const darkColor = this.darkenColor(color);

        // 타워 타입별 그리기
        if (this.effect === 'aoe') {
            this.drawSplashTower(ctx, color, darkColor);
        } else if (this.effect === 'sniper') {
            this.drawSniperTower(ctx, color, darkColor);
        } else {
            this.drawStandardTower(ctx, color, darkColor);
        }

        ctx.restore();
    }

    // 일반 타워: 원형 기본형에 사각형 포신
    drawStandardTower(ctx, color, darkColor) {
        // Doppelganger 분신 그리기 (초월 등급)
        if (this.skill && this.skill.name.includes('Doppelganger')) {
            const cloneCount = this.skill.cloneCount || 1;
            const cloneOffset = 18; // 본체로부터의 거리

            for (let i = 0; i < cloneCount; i++) {
                const side = i === 0 ? -1 : 1; // 왼쪽, 오른쪽
                const cloneX = this.x + (side * cloneOffset);
                const cloneY = this.y;
                const alpha = 0.4 - (i * 0.1); // 점점 투명해짐

                ctx.save();
                ctx.globalAlpha = alpha;

                // 분신 베이스 (원형)
                const gradient = ctx.createRadialGradient(cloneX, cloneY, 0, cloneX, cloneY, 10);
                gradient.addColorStop(0, '#666666');
                gradient.addColorStop(1, '#333333');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cloneX, cloneY, 10, 0, Math.PI * 2);
                ctx.fill();

                // 분신 테두리
                ctx.strokeStyle = '#888888';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(cloneX, cloneY, 10, 0, Math.PI * 2);
                ctx.stroke();

                // 분신 포신
                ctx.fillStyle = '#999999';
                ctx.fillRect(cloneX - 3, cloneY - 3, 6, 6);

                ctx.restore();
            }
        }

        // 본체 베이스 (원형)
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 12);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, darkColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.stroke();

        // 포신 (중앙 사각형)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
    }

    // 스플래시 타워: 육각형 에너지 수정
    drawSplashTower(ctx, color, darkColor) {
        const size = 13;

        // 베이스 (육각형)
        ctx.fillStyle = darkColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = this.x + Math.cos(angle) * size;
            const py = this.y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 에너지 코어 (내부 원 + 번개 마크 느낌)
        ctx.fillStyle = '#FFFFFF'; // 밝은 코어
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 주변 위성 (작은 점 3개)
        const time = Date.now() / 500;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + time;
            const orbitR = 10;
            const ox = this.x + Math.cos(angle) * orbitR;
            const oy = this.y + Math.sin(angle) * orbitR;

            ctx.beginPath();
            ctx.arc(ox, oy, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    // 저격 타워: 삼각형 조준선
    drawSniperTower(ctx, color, darkColor) {
        const size = 14;

        // 베이스 (역삼각형)
        ctx.fillStyle = darkColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        const angles = [Math.PI / 2, Math.PI / 2 + 2 * Math.PI / 3, Math.PI / 2 + 4 * Math.PI / 3];
        // 위쪽이 뾰족하지 않고 아래쪽이 뾰족한 역삼각형 (또는 반대) -> 여기선 위쪽을 평평하게 하고 아래로 뾰족하게
        // 사실 삼각형은 회전 안하면 좀 이상할 수 있으니 십자선(+) 모양이 나을 수도 있음
        // 일단 삼각형으로

        for (let i = 0; i < 3; i++) {
            // 정삼각형 (위쪽 꼭지점)
            const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
            const px = this.x + Math.cos(angle) * size;
            const py = this.y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 조준선 (십자)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x, this.y + 8);
        ctx.moveTo(this.x - 8, this.y);
        ctx.lineTo(this.x + 8, this.y);
        ctx.stroke();

        // 중앙 점
        ctx.fillStyle = '#EF4444'; // 빨간 조준점
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    darkenColor(color) {
        const rgb = hexToRgb(color);
        if (!rgb) return color;
        return rgbToHex(
            Math.floor(rgb.r * 0.6),
            Math.floor(rgb.g * 0.6),
            Math.floor(rgb.b * 0.6)
        );
    }

    getDetails() {
        // 기본 데미지 계산 (등급 배수만 적용)
        const baseDamage = Math.floor(this.towerData.baseDamage * this.rarityData.multiplier);

        // 보너스 데미지 계산 (강화 보너스)
        let bonusDamage = 0;
        if (window.towerUpgradeManager) {
            const upgradeMultiplier = window.towerUpgradeManager.getDamageMultiplier(this.towerKey);
            bonusDamage = Math.floor(baseDamage * (upgradeMultiplier - 1));
        }

        return {
            name: this.towerData.name,
            rarity: this.rarityData.name,
            damage: Math.floor(this.damage),
            baseDamage: baseDamage,
            bonusDamage: bonusDamage,
            attackSpeed: this.attackSpeed.toFixed(1),
            range: this.range,
            effect: this.towerData.description,
            sellPrice: this.sellPrice,
            gridX: this.gridX,
            gridY: this.gridY,
            slotIndex: this.slotIndex
        };
    }

    getBuffedAttackInterval() {
        let interval = this.attackSpeed;

        // Commander's Aura (Standard Divine) 체크
        if (window.game && window.game.towerManager) {
            const towersInCell = window.game.towerManager.grid[this.gridY][this.gridX];
            if (towersInCell) {
                // 같은 칸에 'Commander's Aura' 스킬을 가진 타워가 있는지 확인
                const hasCommander = towersInCell.some(t =>
                    t.skill && t.skill.name.includes("Commander's Aura")
                );

                if (hasCommander) {
                    // 스킬 데이터에서 배율 가져오기 (없으면 기본 3.0)
                    const buffValue = CONFIG.TOWER_SKILLS.STANDARD.DIVINE.speedMult || 3.0;
                    interval /= buffValue;
                }
            }
        }

        return interval;
    }
}

// 타워 매니저
class TowerManager {
    constructor() {
        this.grid = [];
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                this.grid[y][x] = [];
            }
        }
        this.selectedCell = null;
        this.selectedTower = null; // 선택된 타워

        // 셀 필터 초기화 (Dual Filter: { type: null, rarity: null })
        this.cellFilters = [];
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            this.cellFilters[y] = [];
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                this.cellFilters[y][x] = { type: null, rarity: null };
            }
        }
    }

    setCellFilter(x, y, category, value) {
        if (x >= 0 && x < CONFIG.GAME.GRID_COLS && y >= 0 && y < CONFIG.GAME.GRID_ROWS) {
            // category: 'type' or 'rarity'
            if (this.cellFilters[y][x][category] === value) {
                this.cellFilters[y][x][category] = null; // 토글 해제
            } else {
                this.cellFilters[y][x][category] = value; // 설정
            }

            // 필터 변경 시 모든 타워 재배치 시도
            this.redistributeTowers();
            return true;
        }
        return false;
    }

    getCellFilter(x, y) {
        if (x >= 0 && x < CONFIG.GAME.GRID_COLS && y >= 0 && y < CONFIG.GAME.GRID_ROWS) {
            return this.cellFilters[y][x];
        }
        return null;
    }

    moveTowers(sourceX, sourceY, targetX, targetY, towerKey, rarity, count) {
        if (sourceX === targetX && sourceY === targetY) return 0;

        const sourceCell = this.grid[sourceY][sourceX];
        const targetCell = this.grid[targetY][targetX];

        // 이동할 타워 후보 찾기
        const candidates = sourceCell.filter(t =>
            t.towerKey === towerKey && t.rarity === rarity
        );

        if (candidates.length === 0) return 0;

        // 실제 이동할 수량 결정 (요청 수량 vs 보유 수량)
        const moveCount = Math.min(count, candidates.length);

        // 타겟 공간 확인
        const availableSpace = CONFIG.GAME.TOWERS_PER_SLOT - targetCell.length;
        const actualMoveCount = Math.min(moveCount, availableSpace);

        if (actualMoveCount <= 0) return 0;

        // 이동 실행
        for (let i = 0; i < actualMoveCount; i++) {
            const tower = candidates[i];

            // 소스에서 제거
            const index = sourceCell.indexOf(tower);
            if (index > -1) {
                sourceCell.splice(index, 1);
            }

            // 타겟에 추가
            targetCell.push(tower);
            tower.gridX = targetX;
            tower.gridY = targetY;
            tower.slotIndex = targetCell.length - 1; // 슬롯 인덱스 업데이트

            // 위치 업데이트
            // getCellCenter 로직 직접 구현
            const grid = CONFIG.GRID_AREA;
            const cellCenterX = grid.x + (targetX * grid.cellWidth) + (grid.cellWidth / 2);
            const cellCenterY = grid.y + (targetY * grid.cellHeight) + (grid.cellHeight / 2);

            // 약간의 랜덤성 부여 (setPosition 로직과 유사하게)
            const angle = (Math.PI * 2 / CONFIG.GAME.TOWERS_PER_SLOT) * tower.slotIndex;
            const radius = 20 + (Math.random() * 20);

            tower.x = cellCenterX + Math.cos(angle) * radius;
            tower.y = cellCenterY + Math.sin(angle) * radius;
            tower.targetX = tower.x;
            tower.targetY = tower.y;
            tower.isMoving = false;
        }

        // 소스 셀에 남은 타워들 재정렬
        sourceCell.forEach((t, i) => {
            t.slotIndex = i;
            t.setPosition(true); // 즉시 위치 재조정
        });

        return actualMoveCount;
    }

    findTargetCell(towerType, towerRarity, currentTower = null) {
        let bestScore = -1;
        let bestCandidates = [];

        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                const filter = this.cellFilters[y][x];
                const count = this.grid[y][x].length;

                let isCurrentPos = false;
                if (currentTower && currentTower.gridX === x && currentTower.gridY === y) {
                    isCurrentPos = true;
                }

                if (!isCurrentPos && count >= CONFIG.GAME.TOWERS_PER_SLOT) continue;

                // 점수 계산
                let score = 0;

                // 필터 매칭 점수
                const typeMatch = filter.type === towerType;
                const rarityMatch = filter.rarity === towerRarity;
                const typeSet = filter.type !== null;
                const raritySet = filter.rarity !== null;

                if (typeSet && raritySet) {
                    if (typeMatch && rarityMatch) score = 30; // 완벽 일치
                    else score = -1; // 둘 다 설정됐는데 하나라도 안 맞으면 탈락
                } else if (typeSet) {
                    if (typeMatch) score = 20;
                    else score = -1;
                } else if (raritySet) {
                    if (rarityMatch) score = 20;
                    else score = -1;
                } else {
                    // 필터 없음
                    score = 10;
                }

                // 점수가 -1이면 스킵
                if (score === -1) continue;

                // 현재 위치 우대 (불필요한 이동 방지)
                if (isCurrentPos) score += 5;

                if (score > bestScore) {
                    bestScore = score;
                    bestCandidates = [{ x, y }];
                } else if (score === bestScore) {
                    bestCandidates.push({ x, y });
                }
            }
        }

        if (bestCandidates.length > 0) {
            // 후보 중 좌상단 우선
            bestCandidates.sort((a, b) => (a.y * CONFIG.GAME.GRID_COLS + a.x) - (b.y * CONFIG.GAME.GRID_COLS + b.x));
            return bestCandidates[0];
        }

        return null; // 갈 곳이 없음
    }

    spawnTowerGlobal(towerKey, rarity) {
        const towerType = towerKey;
        const target = this.findTargetCell(towerType, rarity);

        if (!target) {
            return { success: false, reason: '배치할 공간이 없습니다.' };
        }

        const { x, y } = target;
        const cell = this.grid[y][x];
        const slotIndex = cell.length;

        const tower = new Tower(towerKey, rarity, x, y, slotIndex);

        // 초기 위치 설정 (화면 중앙 하단에서 시작)
        tower.x = CONFIG.GAME.CANVAS_WIDTH / 2;
        tower.y = CONFIG.GAME.CANVAS_HEIGHT + 50; // 화면 밖에서 날아오기

        // 목표 위치로 이동 시작
        tower.setPosition(false); // instant = false

        cell.push(tower);

        return { success: true, tower: tower, x, y };
    }

    selectCell(gridX, gridY) {
        if (gridX >= 0 && gridX < CONFIG.GAME.GRID_COLS &&
            gridY >= 0 && gridY < CONFIG.GAME.GRID_ROWS) {
            this.selectedCell = { x: gridX, y: gridY };
            this.selectedTower = null; // 셀 선택 시 타워 선택 해제
            return true;
        }
        return false;
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedCell = { x: tower.gridX, y: tower.gridY };
    }

    getTowerAt(x, y) {
        // 캔버스 좌표에서 타워 찾기
        const towers = this.getAllTowers();
        for (const tower of towers) {
            const dist = distance(x, y, tower.x, tower.y);
            if (dist <= 14) { // 타워 반지름
                return tower;
            }
        }
        return null;
    }

    sellTower(tower) {
        const { gridX, gridY, slotIndex } = tower;
        const cell = this.grid[gridY][gridX];

        // 타워 제거
        const index = cell.indexOf(tower);
        if (index > -1) {
            cell.splice(index, 1);

            // 남은 타워들의 슬롯 인덱스 재조정
            cell.forEach((t, i) => {
                t.slotIndex = i;
                t.setPosition();
            });

            // 골드 환불
            if (window.game) {
                window.game.addGold(tower.sellPrice);
            }

            this.selectedTower = null;
            return true;
        }
        return false;
    }

    addTowerToSelectedCell(towerKey, rarity) {
        if (!this.selectedCell) {
            return { success: false, reason: '칸을 먼저 선택하세요' };
        }

        const { x, y } = this.selectedCell;
        const cell = this.grid[y][x];

        if (cell.length >= CONFIG.GAME.TOWERS_PER_SLOT) {
            return { success: false, reason: '이 칸은 가득 찼습니다 (최대 10개)' };
        }

        const slotIndex = cell.length;
        const tower = new Tower(towerKey, rarity, x, y, slotIndex);
        cell.push(tower);

        return { success: true, tower: tower };
    }

    getAllTowers() {
        const towers = [];
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                towers.push(...this.grid[y][x]);
            }
        }
        return towers;
    }

    getTowerCount() {
        return this.getAllTowers().length;
    }

    getCellTowerCount(gridX, gridY) {
        if (gridX >= 0 && gridX < CONFIG.GAME.GRID_COLS &&
            gridY >= 0 && gridY < CONFIG.GAME.GRID_ROWS) {
            return this.grid[gridY][gridX].length;
        }
        return 0;
    }

    update(deltaTime, monsters) {
        const towers = this.getAllTowers();
        towers.forEach(tower => {
            tower.update(deltaTime, monsters);
        });
    }

    draw(ctx) {
        const towers = this.getAllTowers();
        towers.forEach(tower => tower.draw(ctx));

        // 선택된 타워 하이라이트
        if (this.selectedTower) {
            ctx.save();
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.selectedTower.x, this.selectedTower.y, 18, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    clear() {
        for (let y = 0; y < CONFIG.GAME.GRID_ROWS; y++) {
            for (let x = 0; x < CONFIG.GAME.GRID_COLS; x++) {
                this.grid[y][x] = [];
            }
        }
        this.selectedCell = null;
        this.selectedTower = null;
    }

    // 모든 타워에 대해 다시 목적지를 계산하고 이동 명령
    redistributeTowers() {

        const allTowers = this.getAllTowers();

        allTowers.forEach(tower => {
            const bestCell = this.findTargetCell(tower.towerKey, tower.rarity, tower);

            if (bestCell) {
                // 목표가 변경되었거나, 현재 위치가 아닌 경우 이동
                if (bestCell.x !== tower.gridX || bestCell.y !== tower.gridY) {
                    // 즉시 논리적 그리드 이동 수행
                    this.moveTowerLogical(tower, bestCell.x, bestCell.y);

                    // 시각적 이동 시작
                    tower.setPosition(false);
                }
            }
        });
    }

    moveTowerLogical(tower, newX, newY) {
        const oldX = tower.gridX;
        const oldY = tower.gridY;

        // 기존 칸에서 제거
        const oldCell = this.grid[oldY][oldX];
        const idx = oldCell.indexOf(tower);
        if (idx > -1) {
            oldCell.splice(idx, 1);
            // 기존 칸 슬롯 재정렬 (빈 공간 없애기)
            oldCell.forEach((t, i) => {
                t.slotIndex = i;
                if (!t.isMoving) t.setPosition(true); // 정지해 있는 타워만 위치 재조정
            });
        }

        // 새 칸에 추가
        const newCell = this.grid[newY][newX];
        tower.gridX = newX;
        tower.gridY = newY;
        tower.slotIndex = newCell.length;
        newCell.push(tower);
    }
}
