// Theme initialization script to prevent flash of unstyled content
(function() {
  const getTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  };

  const applyTheme = () => {
    const theme = getTheme();
    const root = document.documentElement;
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Apply theme immediately
  applyTheme();
})();
