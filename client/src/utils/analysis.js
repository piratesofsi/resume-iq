export function normalizeAnalysis(item = {}) {
  // Older API processes may spread a Mongoose document, placing schema data in `_doc`.
  // Unwrap it so existing saved analyses still normalize while the API is restarted.
  if (item?._doc && typeof item._doc === 'object') {
    item = { ...item._doc, ...(item.id ? { id: item.id } : {}) };
  }

  const matchScore = Number(item.match_score ?? item.matchScore ?? item.overall_score ?? item.score ?? 0);
  const atsScore = Number(item.ats_score ?? item.atsScore ?? 0);
  const semanticSimilarity = Number(item.semantic_similarity ?? item.semanticSimilarity ?? 0);
  const skillAnalysis = item.skill_analysis ?? item.skillAnalysis ?? {
    matched: item.matching_skills ?? [],
    missing: item.missing_skills ?? [],
    partial: [],
  };

  const scoreBreakdown = item.score_breakdown ?? item.scoreBreakdown ?? {
    skills: 0,
    semantic: 0,
    experience: 0,
    projects: 0,
    keywords: 0,
    education: 0,
  };

  const predictedRoles = item.predicted_roles ?? item.predictedRoles ?? [
    { role: item.job_role_prediction || 'Role Prediction', confidence: matchScore / 100 },
  ];

  return {
    ...item,
    id: item._id || item.id,
    userId: item.user || item.userId,
    jobTitle: item.jobTitle || item.job_title || item.job_role_prediction || 'Role Analysis',
    matchScore,
    atsScore,
    semanticSimilarity,
    scoringMethod: item.scoring_method ?? item.scoringMethod ?? 'legacy',
    scoringDetails: item.scoring_details ?? item.scoringDetails ?? {},
    scoringNotice: item.scoring_notice ?? item.scoringNotice ?? '',
    overallScore: Number(item.overall_score ?? matchScore),
    matchingSkills: item.matching_skills ?? skillAnalysis.matched ?? [],
    missingSkills: item.missing_skills ?? skillAnalysis.missing ?? [],
    scoreBreakdown,
    skillAnalysis,
    skillEvidence: item.skill_evidence ?? item.skillEvidence ?? {},
    predictedRoles,
    resumeQuality: item.resume_quality ?? item.resumeQuality ?? { score: matchScore, label: 'Strong' },
    recommendations: item.recommendations ?? [],
    summary: item.summary ?? '',
    jobRequirements: item.job_requirements ?? item.jobRequirements ?? [],
    keywordCoverage: item.keyword_coverage ?? item.keywordCoverage ?? { percent: 0, matched: [], missing: [], partial: [] },
    resumeSections: item.resume_sections ?? item.resumeSections ?? [],
    improvementInsights: item.improvement_insights ?? item.improvementInsights ?? [],
    explainability: item.explainability ?? { strengths: [], weaknesses: [] },
    comparison: item.resume_vs_job_comparison ?? item.resumeVsJobComparison ?? { resume: [], job: [] },
    createdAt: item.createdAt || item.created_at,
  };
}

export function getScoreTone(score) {
  if (score >= 80) return { label: 'Strong', color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 60) return { label: 'Moderate', color: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Weak', color: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' };
}

export function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
