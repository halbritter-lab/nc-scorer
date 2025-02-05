// src/composables/useThemeToggle.js
import { ref } from 'vue';
import { useTheme } from 'vuetify';

export default function useThemeToggle() {
  const theme = useTheme();
  const darkTheme = ref(theme.global.current.value.dark);

  const toggleTheme = () => {
    const isDark = !theme.global.current.value.dark;
    theme.global.name.value = isDark ? 'dark' : 'light';
    localStorage.setItem('darkTheme', isDark.toString());
    darkTheme.value = isDark;
  };

  return { darkTheme, toggleTheme };
}
