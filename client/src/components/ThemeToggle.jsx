import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const nextMode = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 transition hover:bg-slate-50 ${className}`}
      aria-label={`Switch to ${nextMode} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextMode} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
