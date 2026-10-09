import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const features = [
  'AI-powered resume-to-job matching',
  'Skill gap analysis and recommendations',
  'ATS readiness and role-fit scoring',
  'Persistent analysis history for every user',
];

export default function LandingPage() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg">R</span>
          ResumeIQ
        </div>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <ThemeToggle />
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <Link to="/login" className="btn-secondary border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">Login</Link>
          <Link to="/register" className="btn-primary">Get started</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className={`mb-4 inline-flex rounded-full border border-brand-400/40 bg-brand-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${dark ? 'text-brand-100' : 'text-brand-700'}`}>
              Resume Intelligence Platform
            </p>
            <h1 className={`text-5xl font-black leading-tight tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
              Turn your resume into a stronger match for the job you want.
            </h1>
            <p className={`mt-6 max-w-xl text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
              ResumeIQ analyzes your resume against a job description, identifies missing skills, and highlights the strongest opportunities to improve your candidacy.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to="/register" className="btn-primary">Create account</Link>
              <Link to="/login" className="btn-secondary border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800">View demo</Link>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 text-left">
              <div>
                <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>92%</div>
                <div className="text-sm text-slate-500">Role fit score</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>4.8x</div>
                <div className="text-sm text-slate-500">Faster screening</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>24/7</div>
                <div className="text-sm text-slate-500">AI analysis</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-soft">
            <div className="rounded-2xl bg-slate-800 p-5">
              <div className="mb-4 flex items-center justify-between text-sm text-slate-300">
                <span>Job match overview</span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">Strong Match</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>ATS compatibility</span>
                    <span>88%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-700">
                    <div className="h-full w-[88%] rounded-full bg-brand-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>Skill alignment</span>
                    <span>81%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-700">
                    <div className="h-full w-[81%] rounded-full bg-cyan-400" />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>Experience fit</span>
                    <span>76%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-700">
                    <div className="h-full w-[76%] rounded-full bg-amber-400" />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-700/70 p-4 text-sm text-slate-200">
                <div className="font-semibold text-white">Top suggestions</div>
                <ul className="mt-2 space-y-2 text-slate-300">
                  <li>• Add Python + NLP project experience</li>
                  <li>• Highlight SQL and data pipeline work</li>
                  <li>• Emphasize stakeholder communication metrics</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Why ResumeIQ</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Built for candidates and recruiters.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature} className="card p-5">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-lg text-brand-600">✓</div>
                <p className="text-lg font-semibold text-slate-900">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-slate-100 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="card p-6">
                <div className="text-3xl font-black text-brand-600">01</div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Upload resume</h3>
                <p className="mt-2 text-slate-600">Send a PDF resume and let ResumeIQ extract your key details.</p>
              </div>
              <div className="card p-6">
                <div className="text-3xl font-black text-brand-600">02</div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Match against role</h3>
                <p className="mt-2 text-slate-600">Compare the content to the job description using AI and NLP heuristics.</p>
              </div>
              <div className="card p-6">
                <div className="text-3xl font-black text-brand-600">03</div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">Improve your profile</h3>
                <p className="mt-2 text-slate-600">View recommended skills, missing experiences, and job-fit signals.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
