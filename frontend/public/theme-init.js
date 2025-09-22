// Theme initialization script to prevent flash of unstyled content
(function() {
  try {
    const getTheme = () => {
      if (typeof window === 'undefined') return 'system';
      
      try {
        const stored = localStorage.getItem('theme');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          return stored;
        }
      } catch (e) {
        // localStorage might not be available
      }
      return 'system';
    };

    const applyTheme = () => {
      if (typeof window === 'undefined' || !document.documentElement) return;
      
      const theme = getTheme();
      const root = document.documentElement;
      
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  root.removeAttribute('data-theme');
      
      if (theme === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
          root.setAttribute('data-theme','dark');
        } else {
          root.classList.add('light');
          root.setAttribute('data-theme','light');
        }
      } else {
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
      }
    };

    // Apply theme immediately when script loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTheme);
    } else {
      applyTheme();
    }
  } catch (error) {
    // Fallback to light theme if anything goes wrong
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.add('light');
    }
  }
})();
