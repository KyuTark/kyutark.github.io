document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
  
    // 1. 저장된 테마가 있는지 확인
    const savedTheme = localStorage.getItem('theme');
    
    // 2. 저장된 테마가 있으면 적용, 없으면 OS 설정 확인
    if (savedTheme) {
      htmlElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      htmlElement.setAttribute('data-theme', 'dark');
    }
  
    // 3. 버튼 클릭 시 테마 전환
    toggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      
      if (currentTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  });