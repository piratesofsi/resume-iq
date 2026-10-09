import { useState } from 'react';
import api from '../services/api';
import { getScoreTone } from '../utils/analysis';

export default function AtsCheckerPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const selectResume = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF file smaller than 5 MB.');
      return;
    }
    setResumeFile(file);
    setResult(null);
    setError('');
  };

  const submitCheck = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setError('Choose a PDF resume to check.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      setLoading(true);
      setUploadProgress(0);
      setError('');
      setResult(null);
      const response = await api.post('/ats-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'The ATS check failed. Please check the PDF and try again.');
    } finally {
      setLoading(false);
    }
  };

  const score = result?.atsScore ?? 0;
  const tone = getScoreTone(score);

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Resume readiness</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">ATS score checker</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
          Check whether your resume is readable and has the structure screening software can scan. No job description needed.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={submitCheck} className="card space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">Upload a resume</h2>
            <p className="mt-1 text-sm text-slate-500">Text-based PDF only, up to 5 MB.</p>
          </div>

          <div>
            <label htmlFor="ats-resume" className="mb-2 block text-sm font-medium text-slate-700">Resume PDF</label>
            <input id="ats-resume" type="file" accept=".pdf,application/pdf" onChange={(event) => selectResume(event.target.files?.[0])} className="block w-full rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 file:mr-4 file:border-0 file:bg-indigo-50 file:px-4 file:py-3 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100" />
            {resumeFile && <p className="mt-2 text-xs text-emerald-700">Selected: {resumeFile.name} · {(resumeFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          {loading && <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex justify-between text-xs text-slate-500"><span>{uploadProgress < 100 ? 'Uploading resume…' : 'Checking readability and resume sections…'}</span><span>{uploadProgress}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="ATS check upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}><div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} /></div>
          </div>}
          <button type="submit" disabled={loading || !resumeFile} className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-slate-300">
            {loading ? 'Checking resume…' : 'Check ATS score'}
          </button>
          <p className="text-xs leading-5 text-slate-400">Projects and open-source work count as experience; certifications are optional. This ResumeIQ heuristic checks readability and resume structure, not an employer’s ATS result.</p>
        </form>

        {result ? (
          <section aria-live="polite" className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Resume ATS readiness</p>
                  <h2 className="mt-2 max-w-xl break-words text-lg font-bold">{result.fileName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{result.wordCount} words detected</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>{tone.label}</span>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className={`text-6xl font-black tracking-tight ${tone.color}`}>{score}</span>
                <span className="pb-2 text-sm font-medium text-slate-400">/ 100</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} /></div>
              <p className="mt-4 text-sm text-slate-500">{result.detectedSections?.length || 0} common resume sections detected.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold">Readiness checks</h3>
              <div className="mt-4 space-y-2">
                {(result.checks || []).map((check) => (
                  <div key={check.label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{check.passed ? '✓' : '!'}</span>
                      <span className="text-sm font-medium text-slate-700">{check.label}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">{check.score}/{check.max}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="font-semibold">Suggested improvements</h3>
              {result.suggestions?.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {result.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2"><span className="font-bold text-indigo-600">↗</span><span>{suggestion}</span></li>)}
                </ul>
              ) : <p className="mt-2 text-sm text-emerald-700">All of the checks passed. Your resume has a clear, readable structure.</p>}
            </div>
          </section>
        ) : (
          <div className="flex min-h-[360px] flex-col justify-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">✓</div>
            <h2 className="mt-4 text-lg font-semibold">Your score will appear here</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Upload a PDF to check whether its text and key resume sections can be read by screening software.</p>
          </div>
        )}
      </div>
    </div>
  );
}
