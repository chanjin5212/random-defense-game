// 사운드 시스템 (Web Audio API)

class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3; // 기본 볼륨 30%

        // 사용자 인터랙션 후 초기화
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('Sound system initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    // 일반 타워: 총알 발사 소리 ("탕!")
    playStandardShot() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 오실레이터 (주파수 변조)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

        gainNode.gain.setValueAtTime(this.volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // 스플래시 타워: 전기/번개 소리 ("찌지직!")
    playSplashAttack() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 화이트 노이즈로 전기 소리 생성
        const bufferSize = ctx.sampleRate * 0.1; // 0.1초
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.Q.value = 1;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(this.volume * 0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.1);
    }

    // 저격 타워: 레이저 빔 소리 ("슈웅~")
    playSniperShot() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // 사인파로 레이저 소리 생성
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        gainNode.gain.setValueAtTime(this.volume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 몬스터 처치 소리
    playKill() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

        gainNode.gain.setValueAtTime(this.volume * 0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 볼륨 조절
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // 사운드 토글
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 전역 사운드 시스템
window.soundSystem = new SoundSystem();
