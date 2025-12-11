// 복사 방지 스크립트

// 우클릭 메뉴 방지
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
});

// 복사 방지
document.addEventListener('copy', function (e) {
    e.preventDefault();
    return false;
});

// 잘라내기 방지
document.addEventListener('cut', function (e) {
    e.preventDefault();
    return false;
});

// 키보드 단축키 방지 (Ctrl+C, Ctrl+X, Ctrl+A 등)
document.addEventListener('keydown', function (e) {
    // Ctrl+C, Cmd+C (복사)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        return false;
    }
    // Ctrl+X, Cmd+X (잘라내기)
    if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        return false;
    }
    // Ctrl+A, Cmd+A (전체 선택) - 선택적으로 허용 가능
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        return false;
    }
});

// 드래그 방지
document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
});

// 선택 방지
document.addEventListener('selectstart', function (e) {
    e.preventDefault();
    return false;
});

console.log('복사 방지 활성화됨');
