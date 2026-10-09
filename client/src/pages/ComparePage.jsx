import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { formatDate, getScoreTone, normalizeAnalysis } from '../utils/analysis';

function ScoreCell({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className={`mt-3 text-3xl font-black ${tone || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export default function ComparePage() {
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/analyses');
        const items = (response.data.analyses || []).map(normalizeAnalysis);
        setHistory(items);

        const params = new URLSearchParams(location.search);
        const requestedLeft = params.get('left') || items[0]?.id || '';
        const requestedRight = params.get('right') || items[1]?.id || items[0]?.id || '';
        setLeftId(requestedLeft);
        setRightId(requestedRight);
      } catch (error) {
        console.error(error);
        setLoadError('Could not load analyses to compare. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [location.search]);

  const leftAnalysis = useMemo(
    () => history.find((item) => item.id === leftId) || history[0] || null,
    [history, leftId],
  );
  const rightAnalysis = useMemo(
    () => history.find((item) => item.id === rightId) || history[1] || history[0] || null,
    [history, rightId],
  );

  const rows = useMemo(() => {
    if (!leftAnalysis || !rightAnalysis) return [];

    return [
      ['Match Score', leftAnalysis.matchScore ?? 0, rightAnalysis.matchScore ?? 0],
      ['ATS Score', leftAnalysis.atsScore ?? 0, rightAnalysis.atsScore ?? 0],
      ['Semantic Similarity', Math.round((leftAnalysis.semanticSimilarity ?? 0) * 100), Math.round((rightAnalysis.semanticSimilarity ?? 0) * 100)],
      ['Resume Quality', leftAnalysis.resumeQuality?.score ?? 0, rightAnalysis.resumeQuality?.score ?? 0],
    ];
  }, [leftAnalysis, rightAnalysis]);

  const winner = useMemo(() => {
    if (!leftAnalysis || !rightAnalysis) return null;
    const scoreDiff = (leftAnalysis.matchScore ?? 0) - (rightAnalysis.matchScore ?? 0);
    return scoreDiff >= 0 ? leftAnalysis : rightAnalysis;
  }, [leftAnalysis, rightAnalysis]);

  if (loading) {
    return <div className="card p-8 text-center text-sm text-slate-500" role="status">Loading analyses to compare…</div>;
  }

  if (loadError) {
    return <div className="card p-8 text-center text-sm text-red-700" role="alert">{loadError} <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Reload</button></div>;
  }

  if (!history.length) {
    return (
      <div className="space-y-6 text-slate-900">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-10">
            <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600">⇄</span>
            <div className="mt-4 text-xl font-semibold text-slate-900">Compare your progress over time</div>
            <p className="mx-auto mt-2 max-w-md text-slate-600">Create analyses for different roles or resume updates. Your match, ATS, and quality scores will appear side by side here.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-50 px-3 py-1.5">Frontend Engineer</span><span className="rounded-full bg-slate-50 px-3 py-1.5">Data Scientist</span><span className="rounded-full bg-slate-50 px-3 py-1.5">UX Designer</span></div>
            <Link to="/analyze" className="btn-primary mt-5 inline-flex">Create first analysis</Link>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Side by side</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Compare analyses</h1>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="compare-first" className="mb-2 block text-sm font-medium text-slate-700">First analysis</label>
            <select id="compare-first" value={leftId} onChange={(event) => setLeftId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none">
              {history.map((item) => (
                <option key={item.id} value={item.id}>{item.jobTitle || 'Role Analysis'} • {formatDate(item.createdAt)}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label htmlFor="compare-second" className="mb-2 block text-sm font-medium text-slate-700">Second analysis</label>
            <select id="compare-second" value={rightId} onChange={(event) => setRightId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 outline-none">
              {history.map((item) => (
                <option key={item.id} value={item.id}>{item.jobTitle || 'Role Analysis'} • {formatDate(item.createdAt)}</option>
              ))}
            </select>
          </div>
        </div>

        {leftAnalysis && rightAnalysis ? (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <ScoreCell label="Left" value={`${leftAnalysis.matchScore ?? 0}%`} tone={getScoreTone(leftAnalysis.matchScore ?? 0).color} />
              <ScoreCell label="Right" value={`${rightAnalysis.matchScore ?? 0}%`} tone={getScoreTone(rightAnalysis.matchScore ?? 0).color} />
            </div>

            {winner ? (
              <div className="mb-8 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Winner</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{winner.jobTitle || 'Role Analysis'} with {winner.matchScore ?? 0}% match</div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {rows.map(([label, leftValue, rightValue]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500">First</div>
                      <div className="mt-2 text-2xl font-black text-slate-900">{leftValue}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500">Second</div>
                      <div className="mt-2 text-2xl font-black text-slate-900">{rightValue}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
    </div>
  );
}
