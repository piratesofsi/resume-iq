import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate, normalizeAnalysis } from '../utils/analysis';

export default function ResumesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/analyses');
        setAnalyses((response.data.analyses || []).map(normalizeAnalysis));
      } catch (error) {
        console.error(error);
        setLoadError('Could not load your resume library. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resumes = useMemo(() => {
    const map = new Map();
    analyses.forEach((analysis) => {
      const key = analysis.resumeFileName || 'resume.pdf';
      if (!map.has(key)) {
        map.set(key, { name: key, updatedAt: analysis.createdAt, count: 0, id: analysis.id });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (new Date(analysis.createdAt) > new Date(entry.updatedAt)) {
        entry.updatedAt = analysis.createdAt;
        entry.id = analysis.id;
      }
    });
    return [...map.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [analyses]);

  return (
    <div className="space-y-6 text-slate-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Your documents</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Resume library</h1>
            <p className="mt-1 text-sm text-slate-500">Resume files surfaced from your saved analyses.</p>
          </div>
          <Link to="/analyze" className="btn-primary">Upload resume</Link>
        </div>

        {loadError ? (
          <div role="alert" className="card p-8 text-center text-sm text-red-700">{loadError} <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">Reload</button></div>
        ) : loading ? (
          <div className="card p-8 text-center text-sm text-slate-500" role="status">Loading your resume library…</div>
        ) : resumes.length === 0 ? (
          <div className="card p-8 text-center text-slate-600">
            <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600">▤</span>
            <div className="mt-4 text-lg font-semibold text-slate-900">Your resume library is empty</div>
            <p className="mx-auto mt-2 max-w-md">Upload a PDF while analyzing a role. Saved analyses will group your resume files here so you can return to them.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-slate-500"><span className="rounded-full bg-slate-50 px-3 py-1.5">Frontend Developer</span><span className="rounded-full bg-slate-50 px-3 py-1.5">Data Analyst</span><span className="rounded-full bg-slate-50 px-3 py-1.5">Product Designer</span></div>
            <Link to="/analyze" className="btn-primary mt-5">Analyze a resume</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div key={resume.name} className="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">▤</span><div><div className="text-lg font-semibold text-slate-900">{resume.name}</div><div className="mt-1 text-sm text-slate-500">Last analyzed {formatDate(resume.updatedAt)} · {resume.count} {resume.count === 1 ? 'analysis' : 'analyses'}</div></div></div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/analysis/${resume.id}`} className="btn-secondary">View</Link>
                  <Link to="/analyze" className="btn-secondary">Analyze</Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
