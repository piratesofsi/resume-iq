import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobDescription: { type: String, required: true },
    resumeFileName: { type: String, required: true },
    storagePath: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    overall_score: { type: Number, default: 0 },
    match_score: { type: Number, default: 0 },
    ats_score: { type: Number, default: 0 },
    semantic_similarity: { type: Number, default: 0 },
    scoring_method: { type: String, default: 'legacy' },
    scoring_details: { type: mongoose.Schema.Types.Mixed, default: {} },
    scoring_notice: { type: String, default: '' },
    matching_skills: [{ type: String }],
    missing_skills: [{ type: String }],
    job_role_prediction: { type: String, default: 'Data Analyst' },
    recommendations: [{ type: String }],
    summary: { type: String, default: '' },
    score_breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        skills: 0,
        semantic: 0,
        experience: 0,
        projects: 0,
        keywords: 0,
        education: 0,
      },
    },
    skill_analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: { matched: [], missing: [], partial: [] },
    },
    skill_evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    predicted_roles: [{ type: mongoose.Schema.Types.Mixed }],
    resume_quality: { type: mongoose.Schema.Types.Mixed, default: { score: 0, label: 'Strong' } },
    job_requirements: [{ type: mongoose.Schema.Types.Mixed }],
    keyword_coverage: { type: mongoose.Schema.Types.Mixed, default: { percent: 0, matched: [], missing: [], partial: [] } },
    resume_sections: [{ type: mongoose.Schema.Types.Mixed }],
    improvement_insights: [{ type: mongoose.Schema.Types.Mixed }],
    explainability: { type: mongoose.Schema.Types.Mixed, default: { strengths: [], weaknesses: [] } },
    resume_vs_job_comparison: { type: mongoose.Schema.Types.Mixed, default: { resume: [], job: [] } },
    top_skill: { type: String, default: '' },
    categorized_skills: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.models.Analysis || mongoose.model('Analysis', analysisSchema);
