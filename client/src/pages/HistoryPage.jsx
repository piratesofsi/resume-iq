import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatDate, getScoreTone, normalizeAnalysis } from '../utils/analysis';

const filters = ['All', 'High Match', 'Medium Match', 'Low Match'];

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Newest');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/analyses');
        setHistory((response.data.analyses || []).map(normalizeAnalysis));
      } catch (error) {
        console.error(error);
        setLoadError('Could not load analyses. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const deleteAnalysis = async (item) => {
    if (!window.confirm(`Delete the analysis for ${item.jobTitle || 'this role'}?`)) return;
    try {
      await api.delete(`/analyses/${item.id}`);
      setHistory((items) => items.filter((entry) => entry.id !== item.id));
    } catch (error) {
      window.alert(error.response?.data?.message || 'Could not delete this analysis.');
    }
  };

  const filteredHistory = useMemo(() => {
    const query = search.toLowerCase();
    let results = history.filter((item) => {
      const role = (item.jobTitle || item.job_role_prediction || '').toLowerCase();
      const skills = [...(item.matchingSkills || []), ...(item.missingSkills || [])];
      const matchesSearch = !query || role.includes(query) || skills.some((skill) => skill.toLowerCase().includes(query));
      const score = item.matchScore || item.overallScore || 0;
      const matchesFilter =
        filter === 'All' ||
        (filter === 'High Match' && score >= 80) ||
        (filter === 'Medium Match' && score >= 60 && score < 80) ||
        (filter === 'Low Match' && score < 60);
      return matchesSearch && matchesFilter;
    });

    if (sort === 'Newest') results = results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'Oldest') results = results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === 'Highest Score') results = results.sort((a, b) => (b.matchScore || b.overallScore || 0) - (a.matchScore || a.overallScore || 0));
    if (sort === 'Lowest Score') results = results.sort((a, b) => (a.matchScore || a.overallScore || 0) - (b.matchScore || b.overallScore || 0));

    return results;
  }, [history, search, filter, sort]);

  return (
    <div className="space-y-6 text-slate-900">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Your activity</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Analysis history</h1>
            <p className="mt-1 text-sm text-slate-500">Review and compare how your resume fits each role.</p>
          </div>
          <Link to="/analyze" className="btn-primary">Analyze New Resume</Link>
        </div>

        <div className="card p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="text"
              value={search}
              aria-label="Search analysis history"
              onChange={(event) => { setSearch(event.target.value); setSearchParams(event.target.value ? { search: event.target.value } : {}); }}
              placeholder="Search..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500"
            />
            <div className="flex flex-wrap gap-2">
              {filters.map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${filter === option ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <select aria-label="Sort analysis history" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none">
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest Score</option>
              <option>Lowest Score</option>
            </select>
          </div>
        </div>

        {loadError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError} <button type="button" onClick={() => window.location.reload()} className="ml-2 font-semibold underline">Reload</button></div>}

        <div className="mt-6 space-y-3 md:hidden">
          {loading ? <div className="card p-7 text-center text-sm text-slate-500" role="status">Loading your analysis history…</div> : loadError ? null : filteredHistory.length === 0 ? (
            <div className="card p-7 text-center">
              <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-600">▤</span>
              <h2 className="mt-3 font-semibold text-slate-900">{history.length ? 'No matching analyses' : 'Your history is ready for its first report'}</h2>
              <p className="mt-1 text-sm text-slate-500">{history.length ? 'Try another search or clear the match filter.' : 'Analyze a resume against a job description to see your results here.'}</p>
              {!history.length && <Link to="/analyze" className="btn-primary mt-4">Analyze a role</Link>}
            </div>
          ) : filteredHistory.map((item) => {
            const tone = getScoreTone(item.matchScore || item.overallScore || 0);
            return <article key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-900">{item.jobTitle || item.job_role_prediction || 'Role Analysis'}</h2><p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>{item.matchScore || item.overallScore || 0}% match</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{(item.matchingSkills || []).slice(0, 3).join(', ') || 'No matching skills listed'}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">ATS {item.atsScore || item.ats_score || 0}</span>
                <div className="flex gap-4"><Link to={`/analysis/${item.id}`} className="font-semibold text-indigo-600">View report</Link><button type="button" onClick={() => deleteAnalysis(item)} className="font-medium text-red-600" aria-label={`Delete ${item.jobTitle || 'analysis'}`}>Delete</button></div>
              </div>
            </article>;
          })}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Match</th>
                  <th className="px-4 py-3 font-semibold">ATS</th>
                  <th className="px-4 py-3 font-semibold">Top Skills</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">{loading ? 'Loading analysis history…' : history.length ? 'No analyses match your filters.' : <span>No reports yet. <Link to="/analyze" className="font-semibold text-indigo-600 underline">Create your first analysis</Link>.</span>}</td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => {
                    const tone = getScoreTone(item.matchScore || item.overallScore || 0);
                    return (
                      <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-4 font-semibold text-slate-900">{item.jobTitle || item.job_role_prediction || 'Role Analysis'}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>{item.matchScore || item.overallScore || 0}%</span>
                        </td>
                        <td className="px-4 py-4">{item.atsScore || item.ats_score || 0}</td>
                        <td className="px-4 py-4 text-slate-600">{(item.matchingSkills || []).slice(0, 3).join(', ') || 'N/A'}</td>
                        <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3"><Link to={`/analysis/${item.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">Report →</Link><button type="button" onClick={() => deleteAnalysis(item)} className="font-medium text-slate-400 hover:text-red-600" aria-label={`Delete ${item.jobTitle}`}>Delete</button></div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
