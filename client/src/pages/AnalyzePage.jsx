import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const steps = ['Upload Resume', 'Job Description', 'Analyze', 'Results'];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const canSubmit = resumeFile && jobDescription.trim().length > 80;

  useEffect(() => {
    if (!resumeFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(resumeFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resumeFile]);

  const selectResume = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 5 * 1024 * 1024) {
      setError('Choose a PDF file smaller than 5 MB.');
      return;
    }
    setError('');
    setResumeFile(file);
  };

  const statusSteps = [
    { label: 'Resume selected', complete: !!resumeFile },
    { label: 'Job description added', complete: jobDescription.trim().length > 80 },
    { label: 'Uploading resume PDF', complete: uploadProgress === 100, active: uploadProgress < 100 },
    { label: 'Extracting text and comparing skills', complete: false, active: uploadProgress === 100 },
  ];

  const submitAnalysis = async (event) => {
    event.preventDefault();
    if (!resumeFile || !jobDescription.trim()) {
      setError('Please upload a PDF resume and enter a job description.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    formData.append('jobTitle', jobTitle);

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);
      const response = await api.post('/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setResult(response.data.analysis);
      navigate(`/analysis/${response.data.analysis?._id || 'latest'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Resume analysis failed. Your information is still here, so you can try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Resume intelligence</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Start a new analysis</h1>
            <p className="mt-1 text-sm text-slate-500">Add a resume and a job description to get a tailored fit report.</p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {steps.map((step, index) => (
            <div key={step} className={`flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium ${index === 0 ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${index === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <form onSubmit={submitAnalysis} className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">01 <span className="ml-1">Upload your resume</span></h2>
            <div
              className={`mt-5 rounded-2xl border-2 border-dashed p-6 text-center transition ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}`}
              onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                const file = event.dataTransfer.files?.[0];
                selectResume(file);
              }}
            >
              {resumeFile ? (
                <div className="text-left">
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{resumeFile.name}</div>
                      <div className="text-xs text-slate-500">{(resumeFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for analysis</div>
                    </div>
                    <button type="button" onClick={() => setResumeFile(null)} className="text-sm font-medium text-red-600">Remove</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Replace file<input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(event) => selectResume(event.target.files?.[0])} /></label>
                    <details className="group text-sm">
                      <summary className="cursor-pointer rounded-xl px-3 py-2 font-medium text-indigo-600 hover:bg-indigo-50">Preview resume</summary>
                      <div className="mt-3 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <iframe title={`PDF preview of ${resumeFile.name}`} src={previewUrl} className="h-[420px] w-full" />
                      </div>
                    </details>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-600">↓</div>
                  <div className="text-lg font-semibold text-slate-900">Upload Resume</div>
                  <p className="mt-2 text-sm text-slate-600">Drag & drop your PDF here or choose a file</p>
                  <label className="mt-5 inline-flex cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Choose PDF<input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={(event) => selectResume(event.target.files?.[0])} /></label>
                  <div className="mt-4 text-xs text-slate-500">PDF • Max 5 MB</div>
                </>
              )}
            </div>

            {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">02 Job Description</h2>
            <div className="mt-5">
              <label htmlFor="job-title" className="mb-2 block text-sm font-medium text-slate-700">Role title <span className="font-normal text-slate-400">(optional)</span></label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="e.g. Machine Learning Engineer"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400"
              />
            </div>
            <div className="mt-5">
              <label htmlFor="job-description" className="mb-2 block text-sm font-medium text-slate-700">Paste the job description</label>
              <textarea
                id="job-description"
                rows={14}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste responsibilities, qualifications, and skills from the job posting…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-500"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{jobDescription.trim() ? `${jobDescription.trim().split(/\s+/).length} words · ${jobDescription.length} characters` : 'Paste the full job posting'}</span>
              <span>{jobDescription.trim().length > 80 ? 'Ready to analyze' : `${Math.max(0, 81 - jobDescription.trim().length)} more characters needed`}</span>
            </div>
            <button type="submit" disabled={!canSubmit || loading} className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-slate-300">
              {loading ? (uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Analyzing resume…') : 'Analyze Resume'}
            </button>
          </div>
        </form>

        {loading && (
          <div className="mt-8 card p-5 sm:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{uploadProgress < 100 ? 'Uploading your resume' : 'Building your report'}</div>
                <p className="mt-1 text-sm text-slate-500" role="status" aria-live="polite">{uploadProgress < 100 ? 'Uploading your PDF.' : 'The upload is complete. We are extracting and comparing resume details.'}</p>
              </div>
              <span className="text-sm font-semibold text-indigo-600">{uploadProgress}%</span>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Resume upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadProgress}>
              <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="space-y-3">
              {statusSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3 text-sm text-slate-700" aria-current={step.active ? 'step' : undefined}>
                  <span aria-hidden="true" className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step.complete ? 'bg-emerald-100 text-emerald-700' : step.active ? 'animate-pulse bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{step.complete ? '✓' : step.active ? '•' : '·'}</span>
                  <span className={step.active ? 'font-semibold' : ''}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            Analysis complete. View the detailed report in the results page.
          </div>
        )}
    </div>
  );
}
