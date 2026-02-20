const THEME_STORAGE_KEY = "book-tracker-theme";

export function loadTheme(fallbackTheme = "dark") {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme || fallbackTheme;
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
