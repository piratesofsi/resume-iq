import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { formatDate, getScoreTone, normalizeAnalysis } from '../utils/analysis';

const scoreCardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

export default function AnalysisDetailPage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const chartColors = theme === 'dark'
    ? { grid: '#293449', axis: '#9aa9bf', tooltip: '#111827', line: '#a5b4fc', ring: '#293449' }
    : { grid: '#e2e8f0', axis: '#64748b', tooltip: '#ffffff', line: '#2563eb', ring: '#e2e8f0' };
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [compareId, setCompareId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/analyses');
        const analyses = (response.data.analyses || []).map(normalizeAnalysis);
        setHistory(analyses);

        const selected = analyses.find((item) => item.id === id) || analyses[0] || null;
        setAnalysis(selected);
        setCompareId(analyses.length > 1 ? analyses[1]?.id || analyses[0]?.id : '');
      } catch (error) {
        console.error(error);
        setLoadError(error.response?.data?.message || 'Could not load this report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const compareAnalysis = useMemo(() => {
    if (!history.length) return null;
    if (!compareId) return history[0];
    return history.find((item) => item.id === compareId) || history[0];
  }, [compareId, history]);

  const comparisonData = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return [
      { name: 'ATS', left: analysis.atsScore, right: compareAnalysis?.atsScore ?? 0 },
      { name: 'Semantic', left: Math.round((analysis.semanticSimilarity || 0) * 100), right: Math.round((compareAnalysis?.semanticSimilarity || 0) * 100) },
      { name: 'Skill', left: analysis.scoreBreakdown?.skills ?? 0, right: compareAnalysis?.scoreBreakdown?.skills ?? 0 },
      { name: 'Match', left: analysis.matchScore, right: compareAnalysis?.matchScore ?? 0 },
    ];
  }, [analysis, compareAnalysis]);

  const skillSections = analysis?.skillAnalysis?.matched ?? [];
  const missingSkills = analysis?.skillAnalysis?.missing ?? [];
  const partialSkills = analysis?.skillAnalysis?.partial ?? [];
  const scoreComponents = analysis?.scoringDetails?.score_components ?? {};

  if (!analysis) {
    return <div className="card mx-auto max-w-xl p-8 text-center" role={loading ? 'status' : undefined}>
      <div className="text-lg font-semibold text-slate-900">{loading ? 'Loading your report…' : loadError || 'This analysis could not be found.'}</div>
      {!loading && <div className="mt-5 flex justify-center gap-3"><Link to="/history" className="btn-secondary">Analysis history</Link><Link to="/analyze" className="btn-primary">Start an analysis</Link></div>}
    </div>;
  }

  const tone = getScoreTone(analysis.matchScore);
  const reportSections = [
    ['score', 'Score'], ['score-breakdown', 'Breakdown'], ['semantic-match', 'Semantic match'], ['skills', 'Skills'],
    ['roles', 'Roles'], ['resume-quality', 'Resume quality'], ['resume-sections', 'Resume sections'], ['requirements', 'Requirements'], ['keywords', 'Keywords'],
    ['insights', 'Insights'], ['comparison', 'Comparison'], ['explainability', 'Why this score'], ['trend', 'Trend'],
  ];

  return (
    <div className="space-y-8 text-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Analysis Details</p>
            <h1 className="text-3xl font-bold text-slate-900">{analysis.jobTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {analysis.scoringMethod === 'tfidf_cosine_weighted_v1' ? 'Scored with a TF-IDF text model and cosine similarity.' : analysis.scoringMethod === 'heuristic_fallback_v1' ? 'This report used fallback scoring because the ML service was unavailable.' : 'Legacy report; model details were not recorded.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/history" className="btn-secondary">Back to history</Link>
            <Link to="/analyze" className="btn-primary">Analyze another</Link>
          </div>
        </div>

        <nav aria-label="Report sections" className="sticky top-[68px] z-10 -mx-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur">
          <div className="flex min-w-max gap-1">
            {reportSections.map(([target, label]) => (
              <a key={target} href={`#${target}`} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{label}</a>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section id="score" className={`${scoreCardClass} flex scroll-mt-36 items-center justify-center p-8`}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                className="relative flex h-48 w-48 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${chartColors.line} ${analysis.matchScore * 3.6}deg, ${chartColors.ring} 0deg)`,
                }}
              >
                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white text-slate-900">
                  <div className="text-5xl font-black leading-none">{analysis.matchScore}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">/100</div>
                </div>
              </div>
              <div>
                <div className={`text-xl font-bold ${tone.color}`}>{tone.label}</div>
                <p className="mt-2 max-w-md text-sm text-slate-600">
                  {analysis.summary || 'Your resume is aligned with the target role and has meaningful overlap with the job requirements.'}
                </p>
              </div>
            </div>
          </section>

          <section id="score-breakdown" className={`${scoreCardClass} scroll-mt-36`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">How the job match score is calculated</h2>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>{tone.label}</span>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-600">{analysis.scoringDetails?.match_formula || 'This score combines job-description keyword coverage and resume/job text similarity.'}</p>
            <div className="space-y-4">
              {[
                { key: 'keyword_coverage', label: 'Job-description keyword coverage', fallbackScore: analysis.atsScore, fallbackWeight: 60 },
                { key: 'tfidf_similarity', label: 'TF-IDF text similarity', fallbackScore: Math.round((analysis.semanticSimilarity || 0) * 100), fallbackWeight: 40 },
              ].map(({ key, label, fallbackScore, fallbackWeight }) => {
                const component = scoreComponents[key] || {};
                const score = Number(component.score ?? fallbackScore);
                const weight = Number(component.weight_percent ?? fallbackWeight);
                const contribution = Number(component.contribution ?? (score * weight / 100));
                return <div key={key}>
                  <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm text-slate-600">
                    <span>{label} <span className="text-slate-400">({weight}% weight)</span></span>
                    <span>{score}% score · {contribution.toFixed(1)} points</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-brand-600" style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
                  </div>
                </div>;
              })}
            </div>
            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">{analysis.scoringDetails?.keyword_score_note || 'The ATS-related component here reflects keyword coverage against this job description; it is not the separate resume-only ATS readiness check.'} Scores are estimates based on extracted text.</p>
          </section>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div id="semantic-match" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Semantic Match</h2>
            <div className="mt-4 text-4xl font-black text-slate-900">{Math.round((analysis.semanticSimilarity || 0) * 100)}%</div>
            <div className="mt-2 text-sm font-medium text-brand-600">Resume ↔ Job Description</div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              This percentage measures TF-IDF text similarity between the resume and job description. It can reflect related wording, but it is not a human judgment of experience or a guarantee of passing an employer’s ATS.
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-700">Top matching concepts</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(analysis.matchingSkills || []).slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          <div id="skills" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Skill Intelligence</h2>
            <p className="mt-2 text-sm text-slate-500">Matched skills are terms detected in the resume and job description. Evidence excerpts are copied from your resume text.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{skillSections.length} Matched</span>
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{missingSkills.length} Missing</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{partialSkills.length} Partial</span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Matched</div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {skillSections.length ? skillSections.map((skill) => <li key={skill} className="rounded-lg bg-emerald-50 p-2.5">
                    <div>✓ {skill}</div>
                    {analysis.skillEvidence?.[skill] && <p className="mt-1 text-xs leading-5 text-slate-600">“{analysis.skillEvidence[skill]}”</p>}
                  </li>) : <li className="text-slate-400">No matches detected</li>}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Missing</div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {missingSkills.length ? missingSkills.map((skill) => <li key={skill} className="rounded-lg bg-red-50 p-2.5">+ {skill}<span className="mt-1 block text-xs text-slate-500">Not found in extracted resume text. Add it only if it reflects your experience.</span></li>) : <li className="text-slate-400">No major gaps</li>}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Partial</div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {partialSkills.length ? partialSkills.map((skill) => <li key={skill}>~ {skill}</li>) : <li className="text-slate-400">No partials</li>}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div id="roles" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Predicted Roles</h2>
            <div className="mt-5 space-y-3">
              {(analysis.predictedRoles || []).map((role) => (
                <div key={role.role}>
                  <div className="mb-1 flex justify-between text-sm text-slate-700">
                    <span>{role.role}</span>
                    <span>{Math.round((role.confidence || 0) * 100)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${Math.round((role.confidence || 0) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="resume-quality" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Resume Quality</h2>
            <div className="mt-4 text-4xl font-black text-slate-900">{analysis.resumeQuality?.score ?? analysis.matchScore} / 100</div>
            <div className="mt-2 text-lg font-semibold text-emerald-600">{analysis.resumeQuality?.label ?? tone.label}</div>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              <li>✓ Contact information</li>
              <li>✓ Skills section</li>
              <li>✓ Projects</li>
              <li>✓ Education</li>
              <li>⚠ Experience lacks measurable outcomes</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div id="resume-sections" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Resume Sections</h2>
            <div className="mt-4 space-y-3">
              {(analysis.resumeSections || []).map((section) => (
                <div key={section.section} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{section.section}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{section.status}</span>
                    <span className="font-semibold text-slate-900">{section.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="requirements" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Job Requirements</h2>
            <div className="mt-4 space-y-3">
              {(analysis.jobRequirements || []).map((item) => (
                <div key={item.keyword} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{item.keyword}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">{item.importance}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div id="keywords" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Keyword Coverage</h2>
            <div className="mt-4 text-4xl font-black text-slate-900">{analysis.keywordCoverage?.percent ?? 0}%</div>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              {(analysis.keywordCoverage?.matched || []).slice(0, 6).map((keyword) => <div key={keyword}>✓ {keyword}</div>)}
              {(analysis.keywordCoverage?.missing || []).slice(0, 6).map((keyword) => <div key={keyword}>✗ {keyword}</div>)}
              {(analysis.keywordCoverage?.partial || []).slice(0, 6).map((keyword) => <div key={keyword}>~ {keyword}</div>)}
            </div>
          </div>

          <div id="insights" className={`${scoreCardClass} scroll-mt-36`}>
            <h2 className="text-xl font-semibold text-slate-900">Improvement Insights</h2>
            <div className="mt-5 space-y-4">
              {(analysis.improvementInsights || []).map((item, index) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">0{index + 1}</div>
                  <div className="mt-2 text-base font-semibold text-slate-800">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comparison" className={`${scoreCardClass} scroll-mt-36`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Resume vs Job Comparison</h2>
            {history.length > 1 && (
              <select
                aria-label="Choose an analysis to compare"
                value={compareId}
                onChange={(event) => setCompareId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {history.filter((item) => item.id !== analysis.id).map((item) => (
                  <option key={item.id} value={item.id}>{item.jobTitle}</option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[420px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Skill</th>
                  <th className="pb-3 font-medium">Current</th>
                  <th className="pb-3 font-medium">Compare</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100 text-slate-700">
                    <td className="py-3 font-medium">{row.name}</td>
                    <td className="py-3">{row.left}%</td>
                    <td className="py-3">{row.right}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="explainability" className={`${scoreCardClass} scroll-mt-36`}>
          <h2 className="text-xl font-semibold text-slate-900">Why did I get {analysis.matchScore}%?</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 font-semibold text-emerald-700">Your strongest areas</div>
              <ul className="space-y-2 text-sm text-emerald-800">
                {(analysis.explainability?.strengths || []).map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="mb-3 font-semibold text-red-700">Areas reducing your score</div>
              <ul className="space-y-2 text-sm text-red-800">
                {(analysis.explainability?.weaknesses || []).map((item) => <li key={item}>× {item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="trend" className={`${scoreCardClass} scroll-mt-36`}>
          <h2 className="text-xl font-semibold text-slate-900">Score Trend</h2>
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.slice(0, 6).reverse().map((item, index) => ({ name: formatDate(item.createdAt), score: item.matchScore || item.overallScore || 0, index }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: `1px solid ${chartColors.grid}`, backgroundColor: chartColors.tooltip, color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }} />
                <Line type="monotone" dataKey="score" stroke={chartColors.line} strokeWidth={3} dot={{ r: 4, fill: chartColors.line }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
    </div>
  );
}
