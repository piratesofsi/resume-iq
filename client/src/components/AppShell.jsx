import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { id: 'analyze', label: 'Analyze', to: '/analyze' },
  { id: 'ats', label: 'ATS Checker', to: '/ats-checker' },
  { id: 'resumes', label: 'My Resumes', to: '/resumes' },
  { id: 'history', label: 'Analyses', to: '/history' },
  { id: 'jobs', label: 'Compare Analyses', to: '/compare' },
];

function getInitials(name = 'User') {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('search') || '');
  }, [location.search]);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/history?search=${encodeURIComponent(search.trim())}`);
  };

  const isActive = (to) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-white px-4 py-3 font-semibold text-indigo-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <div className="mx-auto flex max-w-[1680px]">
        <aside className="hidden min-h-screen w-[270px] border-r border-slate-200/80 bg-white p-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              R
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-slate-900">ResumeIQ</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Career workspace</div>
            </div>
          </div>

          <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</div>
          <nav className="mt-3 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive: active }) => `flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active || isActive(item.to)
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <Link to="/analyze" className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-indigo-700">
            <span className="text-lg leading-none">＋</span> New analysis
          </Link>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                {getInitials(user?.name || 'User')}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</div>
                <div className="truncate text-xs text-slate-500">{user?.email || 'resumeiq@example.com'}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 sm:px-7">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                  aria-label="Toggle navigation"
                  aria-expanded={mobileNavOpen}
                  aria-controls="mobile-workspace-nav"
                >
                  ☰
                </button>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-sm font-semibold text-slate-700">{location.pathname === '/dashboard' ? 'Overview' : navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'Report'}</span>
                </div>
              </div>

              <div className="hidden flex-1 justify-center px-6 sm:flex">
                <form onSubmit={submitSearch} className="w-full max-w-md">
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 focus-within:border-indigo-300 focus-within:bg-white">
                    <span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles or skills…" className="w-full bg-transparent outline-none placeholder:text-slate-400" aria-label="Search analyses" />
                    <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">↵</kbd>
                  </label>
                </form>
              </div>

              <ThemeToggle className="mr-2" />
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log out
              </button>
            </div>

            {mobileNavOpen && (
              <div id="mobile-workspace-nav" className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
                <form onSubmit={submitSearch} className="mb-4 sm:hidden">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    <span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles or skills…" className="w-full bg-transparent outline-none placeholder:text-slate-400" aria-label="Search analyses" />
                    <button type="submit" className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white">Search</button>
                  </label>
                </form>
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive: active }) => `block rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        active || isActive(item.to)
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            )}
          </header>

          <main id="main-content" tabIndex={-1} className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
