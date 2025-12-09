// 패널 토글 기능

(function () {
    function initPanelToggle() {
        const toggleBtn = document.getElementById('panel-toggle-btn');
        const panel = document.getElementById('control-panel-mobile');

        if (!toggleBtn || !panel) {
            return;
        }

        toggleBtn.addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');

            if (!isOpen) {
                panel.classList.add('open');
                toggleBtn.classList.add('open');
            } else {
                panel.classList.remove('open');
                toggleBtn.classList.remove('open');
            }
        });

    }

    // DOM 로드 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPanelToggle);
    } else {
        initPanelToggle();
    }
})();
