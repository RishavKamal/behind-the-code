import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("btc-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("btc-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark"
    );
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-switcher"
      onClick={toggleTheme}
      aria-label={`Switch to ${
        isDark ? "light" : "dark"
      } theme`}
      title={`Switch to ${
        isDark ? "light" : "dark"
      } theme`}
    >
      <span className="theme-icon">
        {isDark ? "☾" : "☀"}
      </span>

      <span className="theme-name">
        {isDark ? "Midnight" : "Light"}
      </span>

      <span className="theme-arrow">
        ↓
      </span>
    </button>
  );
};

export default ThemeSwitcher;