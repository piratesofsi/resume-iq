import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { formatDate, getScoreTone, normalizeAnalysis } from '../utils/analysis';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const chartColors = theme === 'dark'
    ? { grid: '#293449', axis: '#9aa9bf', tooltip: '#111827', ats: '#a5b4fc', match: '#34d399' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltip: '#ffffff', ats: '#4f46e5', match: '#059669' };
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/analyses');
        setHistory((response.data.analyses || []).map(normalizeAnalysis));
      } catch (error) {
        console.error(error);
        setLoadError('We could not load your dashboard right now. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const totalAnalyses = history.length;
  const averageMatch = totalAnalyses
    ? Math.round(history.reduce((sum, item) => sum + (item.matchScore || item.overallScore || 0), 0) / totalAnalyses)
    : 0;
  const bestMatch = history.length
    ? Math.max(...history.map((item) => item.matchScore || item.overallScore || 0))
    : 0;
  const skillsIdentified = history.reduce((sum, item) => sum + (item.matchingSkills?.length || 0), 0);
  const chartData = [...history].slice(0, 6).reverse().map((item) => ({
    name: formatDate(item.createdAt).split(' ').slice(0, 2).join(' '),
    role: item.jobTitle || item.job_role_prediction || 'Role analysis',
    atsScore: item.atsScore || null,
    matchScore: item.matchScore || item.overallScore || 0,
  }));

  const recentList = useMemo(() => [...history].slice(0, 5), [history]);

  const strongestSkill = useMemo(() => {
    const counts = {};
    history.forEach((item) => {
      (item.matchingSkills || []).forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'No data yet';
  }, [history]);

  const mostCommonMissing = useMemo(() => {
    const counts = {};
    history.forEach((item) => {
      (item.missingSkills || []).forEach((skill) => {
        counts[skill] = (counts[skill] || 0) + 1;
      });
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'No data yet';
  }, [history]);

  const bestRole = useMemo(() => {
    if (!history.length) return 'No data yet';
    const counts = {};
    history.forEach((item) => {
      const role = item.jobTitle || item.job_role_prediction || 'Full Stack Engineer';
      counts[role] = (counts[role] || 0) + 1;
    });
    const [role] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return role || 'Full Stack Engineer';
  }, [history]);

  const analysesWithAtsScore = history.filter((item) => item.atsScore > 0);
  const avgAts = analysesWithAtsScore.length
    ? Math.round(analysesWithAtsScore.reduce((sum, item) => sum + item.atsScore, 0) / analysesWithAtsScore.length)
    : 0;

  const recommendedNextAction =
    history.length === 0
      ? 'Upload your first resume to get a personalized role-fit report.'
      : `${mostCommonMissing} remains the most common gap across your recent analyses. Consider improving that skill before your next application.`;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-indigo-900/10 bg-gradient-to-br from-[#252554] via-indigo-800 to-violet-700 p-6 text-white shadow-[0_24px_60px_rgba(54,49,120,0.20)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">{new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{user?.name || 'User'}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
              Your job search, with a clearer signal. See where you fit and what to strengthen next.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/analyze" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50">
              <span>＋</span> Analyze a role
            </Link>
            <Link to="/ats-checker" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
              Check ATS score
            </Link>
            <Link to="/resumes" className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700/60">
              View Resumes
            </Link>
            {history[0] && <Link to={`/analysis/${history[0].id}`} className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">Continue last report</Link>}
          </div>
        </div>
      </section>

      {loadError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError} <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Reload</button></div>}

      {!loading && !loadError && history.length === 0 && (
        <section aria-labelledby="getting-started-title" className="rounded-3xl border border-brand-200 bg-brand-50 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Your first report</p>
              <h2 id="getting-started-title" className="mt-2 text-2xl font-bold text-slate-900">Get started in three steps</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Add your resume and a target job description to see your match, strengths, and areas to improve.</p>
            </div>
            <Link to="/analyze" className="btn-primary shrink-0">Create your first analysis <span aria-hidden="true">→</span></Link>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Upload a PDF resume', 'Paste a job description', 'Review your tailored report'].map((step, index) => (
              <li key={step} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 text-sm font-medium text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{index + 1}</span>{step}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
            <span>Works well for roles like:</span><span className="font-semibold">Frontend Developer</span><span className="font-semibold">Data Analyst</span><span className="font-semibold">Product Designer</span>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Analyses', value: totalAnalyses },
          { label: 'Average Match', value: `${averageMatch}%` },
          { label: 'Best Match', value: `${bestMatch}%` },
          { label: 'Avg. ATS score', value: `${avgAts}%` },
          { label: 'Skills Identified', value: skillsIdentified },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Performance</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">ATS compatibility vs. job match</h2>
              <p className="mt-1 text-xs text-slate-500">Scores show estimated alignment with each job description, not an employer pass/fail decision.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">Recent trend</span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: `1px solid ${chartColors.grid}`, backgroundColor: chartColors.tooltip, color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.role ? `${label} · ${payload[0].payload.role}` : label}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="atsScore" name="ATS compatibility" connectNulls={false} stroke={chartColors.ats} strokeWidth={3} dot={{ r: 4, fill: chartColors.ats }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="matchScore" name="Overall job match" stroke={chartColors.match} strokeWidth={3} dot={{ r: 4, fill: chartColors.match }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-500">
              {loading ? <span role="status">Loading your score history…</span> : <>
                <span aria-hidden="true" className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-600">↗</span>
                <span className="font-semibold text-slate-700">Your score trend starts here</span>
                <span className="mt-1">Run an analysis to track your fit over time.</span>
                <Link to="/analyze" className="mt-4 font-semibold text-indigo-600 underline-offset-4 hover:underline">Analyze a role</Link>
              </>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Activity</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Recent analyses</h2>
            </div>
          </div>

          <div className="space-y-3">
            {recentList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              {loading ? <p role="status">Loading recent reports…</p> : <>
                <span aria-hidden="true" className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600">▤</span>
                <div className="font-semibold text-slate-700">No recent reports yet</div>
                <p className="mt-1">Your latest role analyses will show up here.</p>
                <Link to="/analyze" className="mt-3 inline-flex font-semibold text-indigo-600 underline-offset-4 hover:underline">Start an analysis →</Link>
              </>}
              </div>
            ) : (
              recentList.map((item) => {
                const tone = getScoreTone(item.matchScore || item.overallScore || 0);
                return (
                  <Link
                    key={item.id}
                    to={`/analysis/${item.id}`}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{item.jobTitle || item.job_role_prediction || 'Role Analysis'}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${tone.color}`}>{item.matchScore || item.overallScore || 0}%</div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Match</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Resume intelligence</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Key signals</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Strongest skill</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{strongestSkill}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Missing skill</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{mostCommonMissing}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Best-fit role</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{bestRole}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Avg ATS</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{avgAts}%</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Avg match</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{averageMatch}%</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Role fit</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{bestMatch}%</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Next action</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Recommended next action</h2>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-slate-100">
            <div className="text-sm font-medium text-slate-300">Priority focus</div>
            <div className="mt-3 text-lg font-semibold text-white">{mostCommonMissing}</div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{recommendedNextAction}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
