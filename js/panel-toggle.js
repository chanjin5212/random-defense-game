// 패널 토글 기능

(function () {
    function initPanelToggle() {
        const toggleBtn = document.getElementById('panel-toggle-btn');
        const panel = document.getElementById('control-panel-mobile');

        if (!toggleBtn || !panel) {
            console.log('패널 토글 요소를 찾을 수 없습니다.');
            return;
        }

        // 초기 상태: 닫힘
        let isOpen = false;

        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;

            if (isOpen) {
                panel.classList.add('open');
                toggleBtn.classList.add('open');
            } else {
                panel.classList.remove('open');
                toggleBtn.classList.remove('open');
            }
        });

        console.log('패널 토글 초기화 완료');
    }

    // DOM 로드 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanelToggle);
    } else {
        initPanelToggle();
    }
})();
