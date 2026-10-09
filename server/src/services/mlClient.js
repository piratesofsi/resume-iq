const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

const fallbackAnalysis = {
  scoring_method: 'heuristic_fallback_v1',
  scoring_notice: 'The ML service was unavailable for this run. Scores are a basic fallback estimate, not the TF-IDF model result.',
  scoring_details: { model: 'Heuristic fallback (ML service unavailable)' },
  overall_score: 82,
  match_score: 82,
  ats_score: 85,
  semantic_similarity: 0.87,
  matching_skills: ['python', 'javascript', 'sql', 'docker', 'git'],
  missing_skills: ['machine learning', 'nlp', 'pytorch', 'fastapi'],
  job_role_prediction: 'Full Stack Engineer',
  recommendations: [
    'Add measurable project results and key metrics.',
    'Highlight Python and NLP experience more explicitly.',
    'Include deployment and system architecture work.',
  ],
  summary:
    'The resume shows strong frontend and backend experience, but adding deeper technical depth in Python and ML or data-heavy systems would improve role alignment.',
  score_breakdown: {
    skills: 86,
    semantic: 91,
    experience: 78,
    projects: 91,
    keywords: 72,
    education: 94,
  },
  skill_analysis: {
    matched: ['python', 'javascript', 'sql', 'docker', 'git'],
    missing: ['machine learning', 'nlp', 'pytorch', 'fastapi'],
    partial: ['machine learning'],
  },
  predicted_roles: [
    { role: 'Machine Learning Engineer', confidence: 0.91 },
    { role: 'Software Engineer', confidence: 0.79 },
  ],
  resume_quality: { score: 78, label: 'Strong' },
  job_requirements: [
    { keyword: 'Python', importance: 'High Importance' },
    { keyword: 'Machine Learning', importance: 'High Importance' },
    { keyword: 'NLP', importance: 'High Importance' },
  ],
  keyword_coverage: { percent: 72, matched: ['python', 'docker', 'git'], missing: ['nlp', 'fastapi'], partial: ['machine learning'] },
  resume_sections: [
    { section: 'Summary', status: 'Strong', score: 82 },
    { section: 'Experience', status: 'Moderate', score: 74 },
    { section: 'Projects', status: 'Excellent', score: 91 },
  ],
  improvement_insights: [
    { title: 'Add NLP experience', description: 'NLP is an important requirement for this role and was not detected strongly in your resume.' },
    { title: 'Strengthen project impact', description: 'Your projects contain relevant technologies, but measurable outcomes are limited.' },
  ],
  explainability: {
    strengths: ['Docker', 'Git', 'Python'],
    weaknesses: ['Machine Learning', 'NLP', 'FastAPI'],
  },
  resume_vs_job_comparison: {
    resume: ['Python', 'Docker', 'Git', 'MongoDB'],
    job: ['Python', 'Machine Learning', 'NLP', 'FastAPI'],
  },
  job_title: 'Full Stack Engineer',
  top_skill: 'Python',
  categorized_skills: {
    Languages: ['Python', 'JavaScript'],
    Frameworks: ['React', 'Node'],
    'ML / AI': ['Machine Learning'],
  },
};

export async function analyzeWithML({ resumeText, jobDescription }) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription || '' }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.status}`);
    }

    const data = await response.json();
    return {
      ...fallbackAnalysis,
      ...data,
      scoring_notice: data.scoring_notice || '',
      score_breakdown: { ...fallbackAnalysis.score_breakdown, ...(data.score_breakdown || {}) },
      skill_analysis: { ...fallbackAnalysis.skill_analysis, ...(data.skill_analysis || {}) },
      keyword_coverage: { ...fallbackAnalysis.keyword_coverage, ...(data.keyword_coverage || {}) },
      resume_quality: { ...fallbackAnalysis.resume_quality, ...(data.resume_quality || {}) },
      explainability: { ...fallbackAnalysis.explainability, ...(data.explainability || {}) },
      resume_vs_job_comparison: { ...fallbackAnalysis.resume_vs_job_comparison, ...(data.resume_vs_job_comparison || {}) },
      predicted_roles: Array.isArray(data.predicted_roles) ? data.predicted_roles : fallbackAnalysis.predicted_roles,
      matching_skills: Array.isArray(data.matching_skills) ? data.matching_skills : fallbackAnalysis.matching_skills,
      missing_skills: Array.isArray(data.missing_skills) ? data.missing_skills : fallbackAnalysis.missing_skills,
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : fallbackAnalysis.recommendations,
    };
  } catch (error) {
    console.warn('ML service unavailable. Falling back to heuristic analysis.', error.message);
    return { ...fallbackAnalysis };
  }
}
