// 랭킹 시스템 관리자
console.log('ranking.js loaded');
class RankingManager {
    constructor() {
        this.client = null;
        // Supabase 로드 대기
        if (window.supabase) {
            this.init();
        } else {
            window.addEventListener('load', () => this.init());
        }
    }

    init() {
        if (window.supabase) {
            this.client = window.supabase.createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.KEY);
            console.log('Supabase initialized');
        } else {
            console.error('Supabase SDK not loaded');
        }
    }

    // 점수 제출 (게임 오버 시 호출)
    async submitScore(username, password, round, playTime) {
        if (!this.client) {
            showToast('랭킹 시스템이 연결되지 않았습니다.', 'error');
            return false;
        }

        try {
            // 1. 중복 아이디 확인
            const { data: existingUser, error: fetchError } = await this.client
                .from(CONFIG.SUPABASE.TABLE)
                .select('*')
                .eq('username', username)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 결과 없음 (정상)
                throw fetchError;
            }

            if (existingUser) {
                // 2. 이미 존재하는 경우 -> 비밀번호 확인
                if (existingUser.password === password) {
                    // 3. 비밀번호 일치 -> 덮어씌우기 (업데이트)
                    const { error: updateError } = await this.client
                        .from(CONFIG.SUPABASE.TABLE)
                        .update({ score: round, play_time: playTime })
                        .eq('id', existingUser.id);

                    if (updateError) throw updateError;
                    showToast(`기존 기록을 덮어씌웠습니다! (라운드: ${round})`, 'success');
                } else {
                    // 4. 비밀번호 불일치
                    showToast('비밀번호가 일치하지 않습니다! 덮어쓸 수 없습니다.', 'error');
                    return false;
                }
            } else {
                // 5. 새로운 유저 -> 신규 등록
                const { error: insertError } = await this.client
                    .from(CONFIG.SUPABASE.TABLE)
                    .insert([
                        { username: username, password: password, score: round, play_time: playTime }
                    ]);

                if (insertError) throw insertError;
                showToast('랭킹 등록 완료!', 'success');
            }

            // 랭킹 목록 갱신 및 내 점수 표시 (UI 닫기 등)
            this.updateRankingListUI();
            return true;

        } catch (error) {
            console.error('Error submitting score:', error);
            showToast('랭킹 등록 오류: ' + error.message, 'error');
            return false;
        }
    }

    // 랭킹 조회 (Top 10)
    async getRankings(limit = 10) {
        if (!this.client) return [];

        try {
            const { data, error } = await this.client
                .from(CONFIG.SUPABASE.TABLE)
                .select('username, score, play_time') // 비밀번호 제외하고 조회
                .order('score', { ascending: false }) // 점수(라운드) 내림차순
                .order('play_time', { ascending: true }) // 동점이면 시간 짧은 순
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching rankings:', error);
            // showToast('랭킹 로드 실패', 'error'); // 너무 자주 뜨면 거슬림
            return [];
        }
    }

    async updateRankingListUI() {
        const listDiv = document.getElementById('ranking-list');
        if (!listDiv) return;

        listDiv.innerHTML = '<p style="text-align:center; color:#888;">로딩 중...</p>';

        const rankings = await this.getRankings();

        if (rankings.length === 0) {
            listDiv.innerHTML = '<p style="text-align:center; color:#888;">등록된 랭킹이 없습니다.</p>';
            return;
        }

        let html = '<table style="width:100%; text-align:left; border-collapse: collapse;">';
        html += '<tr style="border-bottom: 1px solid #444; color: #fbbf24;"><th style="padding:5px;">#</th><th style="padding:5px;">ID</th><th style="padding:5px;">라운드</th></tr>';

        rankings.forEach((rank, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
            html += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding:8px;">${medal}</td>
                    <td style="padding:8px;">${rank.username}</td>
                    <td style="padding:8px;">${rank.score}R</td>
                </tr>
            `;
        });
        html += '</table>';
        listDiv.innerHTML = html;
    }
}

// 전역 인스턴스 생성
window.rankingManager = new RankingManager();

// UI 함수들
function openRankingModal() {
    console.log('openRankingModal called');
    const modal = document.getElementById('ranking-modal');
    if (modal) {
        modal.classList.add('active');
        if (window.rankingManager) {
            window.rankingManager.updateRankingListUI();
        } else {
            console.error('rankingManager not ready');
        }

        // 게임 오버 상태라면 등록 폼 표시
        const form = document.getElementById('ranking-register-form');
        if (window.game && window.game.state === 'gameover' && form) {
            form.style.display = 'block';
        } else if (form) {
            form.style.display = 'none';
        }
    } else {
        console.error('ranking-modal not found');
    }
}

// 이벤트 리스너 설정
window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('open-ranking-btn');
    if (btn) {
        btn.addEventListener('click', openRankingModal);
    }

    // 게임 오버 화면의 랭킹 등록 버튼
    const registerRankingBtn = document.getElementById('register-ranking-btn');
    if (registerRankingBtn) {
        registerRankingBtn.addEventListener('click', openRankingModal);
    }

    // 전역 노출 유지 (비상용)
    window.openRankingModal = openRankingModal;
});

window.submitMyScore = function () {
    const usernameInput = document.getElementById('ranking-username');
    const passwordInput = document.getElementById('ranking-password');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) {
        showToast('아이디를 입력해주세요.', 'error');
        return;
    }
    if (!password) {
        showToast('비밀번호를 입력해주세요.', 'error');
        return;
    }
    if (password.length < 4) {
        showToast('비밀번호는 4자리 이상이어야 합니다.', 'error');
        return;
    }

    if (!window.game) return;

    // 현재 점수 가져오기
    const round = window.game.currentRound;
    const playTime = Math.floor((CONFIG.GAME.ROUND_DURATION - window.game.roundTimer) + (round - 1) * CONFIG.GAME.ROUND_DURATION);
    // 정확한 플레이 시간 계산은 복잡하므로 간단하게 라운드 기준 근사치로 하거나, 게임 내에 totalPlayTime 변수를 두는게 좋음
    // 일단은 현재 라운드 정보만 사용

    window.rankingManager.submitScore(username, password, round, 0);
};
