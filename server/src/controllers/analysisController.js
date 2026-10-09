import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Analysis from '../models/Analysis.js';
import { analyzeWithML } from '../services/mlClient.js';
import {
  createMemoryAnalysis,
  deleteMemoryAnalysisById,
  findMemoryAnalysesByUser,
  findMemoryAnalysisById,
} from '../store/inMemoryStore.js';

function enrichAnalysisPayload(payload, req) {
  const matchScore = payload.match_score ?? payload.matchScore ?? payload.overall_score ?? 0;
  const atsScore = payload.ats_score ?? payload.atsScore ?? 0;
  const semantic = payload.semantic_similarity ?? payload.semanticSimilarity ?? 0;
  const title = req.body.jobTitle?.trim() || payload.job_title || payload.jobTitle || payload.job_role_prediction || 'Role Analysis';

  return {
    user: req.user?._id || null,
    jobDescription: req.body.jobDescription,
    resumeFileName: req.file?.originalname || payload.resumeFileName || 'resume.pdf',
    storagePath: req.file?.path || payload.storagePath || '',
    jobTitle: title,
    overall_score: payload.overall_score ?? matchScore,
    match_score: matchScore,
    ats_score: atsScore,
    semantic_similarity: semantic,
    scoring_method: payload.scoring_method ?? payload.scoringMethod ?? 'legacy',
    scoring_details: payload.scoring_details ?? payload.scoringDetails ?? {},
    scoring_notice: payload.scoring_notice ?? payload.scoringNotice ?? '',
    matching_skills: payload.matching_skills ?? [],
    missing_skills: payload.missing_skills ?? [],
    job_role_prediction: payload.job_role_prediction ?? title,
    recommendations: payload.recommendations ?? [],
    summary: payload.summary ?? '',
    score_breakdown: payload.score_breakdown ?? payload.scoreBreakdown ?? {},
    skill_analysis: payload.skill_analysis ?? payload.skillAnalysis ?? { matched: [], missing: [], partial: [] },
    skill_evidence: payload.skill_evidence ?? payload.skillEvidence ?? {},
    predicted_roles: payload.predicted_roles ?? payload.predictedRoles ?? [],
    resume_quality: payload.resume_quality ?? payload.resumeQuality ?? { score: 0, label: 'Strong' },
    job_requirements: payload.job_requirements ?? payload.jobRequirements ?? [],
    keyword_coverage: payload.keyword_coverage ?? payload.keywordCoverage ?? { percent: 0, matched: [], missing: [], partial: [] },
    resume_sections: payload.resume_sections ?? payload.resumeSections ?? [],
    improvement_insights: payload.improvement_insights ?? payload.improvementInsights ?? [],
    explainability: payload.explainability ?? { strengths: [], weaknesses: [] },
    resume_vs_job_comparison: payload.resume_vs_job_comparison ?? payload.resumeVsJobComparison ?? { resume: [], job: [] },
    top_skill: payload.top_skill ?? payload.topSkill ?? '',
    categorized_skills: payload.categorized_skills ?? payload.categorizedSkills ?? {},
  };
}

export async function createAnalysis(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF resume.' });
  }

  if (!req.body.jobDescription || !req.body.jobDescription.trim()) {
    return res.status(400).json({ message: 'Job description is required.' });
  }

  try {
    const resumeBuffer = await fs.readFile(req.file.path);
    const pdfText = await extractPdfText(resumeBuffer);
    const mlResult = await analyzeWithML({
      resumeText: pdfText || 'Resume content unavailable',
      jobDescription: req.body.jobDescription,
    });

    const analysisPayload = enrichAnalysisPayload(mlResult, req);
    let saved;

    if (mongoose.connection.readyState === 1) {
      saved = await Analysis.create(analysisPayload);
    } else {
      saved = createMemoryAnalysis(analysisPayload);
    }

    const responseAnalysis = saved && typeof saved.toObject === 'function' ? saved.toObject() : saved;

    return res.status(200).json({
      message: 'Resume analysis completed.',
      analysis: responseAnalysis ? { ...responseAnalysis, user: req.user?._id || null } : analysisPayload,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not process resume.', error: error.message });
  }
}

export async function checkAtsReadiness(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF resume.' });
  }

  try {
    const resumeBuffer = await fs.readFile(req.file.path);
    const { text: resumeText, lines, links } = await extractPdfAtsContent(resumeBuffer);
    const text = resumeText.replace(/\s+/g, ' ').trim();
    if (!text) {
      return res.status(422).json({ message: 'Could not extract readable text from this PDF. Try an exported, text-based PDF.' });
    }

    const sectionChecks = [
      { label: 'Experience, projects, or open source', max: 18, pattern: /^(work experience|professional experience|employment history|work history|professional history|relevant experience|open source contributions|selected projects|projects)$/i },
      { label: 'Skills', max: 12, pattern: /^(technical skills|core skills|key skills|skills)$/i },
      { label: 'Education', max: 12, pattern: /^(education|academic background)$/i },
      { label: 'Summary or objective', max: 8, pattern: /^(professional summary|summary|career objective|objective)$/i },
    ];
    const checks = sectionChecks.map(({ label, max, pattern }) => {
      const passed = lines.some((line) => pattern.test(line.trim().replace(/[:：]$/, '').trim()));
      return { label, score: passed ? max : 0, max, passed };
    });

    const linkedUrls = links.join(' ');
    const contactChecks = [
      { label: 'Email address', max: 4, pattern: /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/ },
      { label: 'Phone number', max: 3, pattern: /(?:\+?\d[\d ().-]{7,}\d)/ },
      { label: 'LinkedIn profile', max: 4, pattern: /linkedin\.com/i, linkOnly: true },
      { label: 'GitHub or portfolio link', max: 4, pattern: /(github\.com|gitlab\.com|bitbucket\.org|portfolio|vercel\.app|netlify\.app)/i, linkOnly: true },
    ].map(({ label, max, pattern, linkOnly }) => {
      const passed = pattern.test(linkOnly ? linkedUrls : text) || (label === 'Email address' && /mailto:/i.test(linkedUrls)) || (label === 'Phone number' && /tel:/i.test(linkedUrls));
      return { label, score: passed ? max : 0, max, passed };
    });

    const textLength = text.length;
    const textScore = textLength >= 300 ? 25 : textLength >= 150 ? 16 : textLength >= 50 ? 8 : 0;
    const numericSignals = (text.match(/(?:\b\d{1,3}%|\$\s?\d|\b\d{2,}\+?\b)/g) || []).length;
    const impactScore = numericSignals >= 3 ? 10 : numericSignals > 0 ? 6 : 0;
    const qualityChecks = [
      { label: 'Readable resume text', score: textScore, max: 25, passed: textScore > 0 },
      { label: 'Measurable results', score: impactScore, max: 10, passed: impactScore > 0 },
    ];

    const allChecks = [...checks, ...contactChecks, ...qualityChecks];
    const atsScore = allChecks.reduce((total, check) => total + check.score, 0);
    const suggestions = allChecks.filter((check) => !check.passed).map((check) => {
      if (check.label === 'Readable resume text') return 'Use a text-based PDF exported from a document editor so screening software can read its contents.';
      if (check.label === 'Measurable results') return 'Add measurable outcomes to experience bullets, such as time saved, revenue gained, or users reached.';
      if (check.label === 'Experience, projects, or open source') return 'Add a clearly labeled experience, projects, or open-source section with your role and contributions.';
      if (check.label === 'Skills') return 'Add a clearly labeled skills section using the names of tools and technologies you know.';
      if (check.label === 'Education') return 'Add a clearly labeled education section with your degree or relevant training.';
      if (check.label === 'Summary or objective') return 'Add a short professional summary or objective near the top of the resume.';
      if (check.label === 'Projects') return 'Add a projects section if you have relevant work samples or portfolio projects.';
      return `Add your ${check.label.toLowerCase()} to the resume header.`;
    });

    return res.json({
      fileName: req.file.originalname,
      atsScore,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      detectedSections: checks.filter((check) => check.passed).map((check) => check.label),
      checks: allChecks,
      suggestions,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not check this resume.', error: error.message });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
}

export async function getAnalyses(req, res) {
  try {
    let analyses;
    if (mongoose.connection.readyState === 1) {
      analyses = await Analysis.find({ user: req.user._id }).sort({ createdAt: -1 });
    } else {
      analyses = findMemoryAnalysesByUser(req.user._id);
    }

    return res.json({ analyses });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load analysis history.', error: error.message });
  }
}

export async function getAnalysisById(req, res) {
  try {
    let analysis;
    if (mongoose.connection.readyState === 1) {
      analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
    } else {
      analysis = findMemoryAnalysisById(req.user._id, req.params.id);
    }

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found.' });
    }

    return res.json({ analysis });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load analysis details.', error: error.message });
  }
}

export async function deleteAnalysis(req, res) {
  try {
    let deletedAnalysis;

    if (mongoose.connection.readyState === 1) {
      deletedAnalysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
      if (!deletedAnalysis) {
        return res.status(404).json({ message: 'Analysis not found.' });
      }

      const storagePath = deletedAnalysis.storagePath || '';
      await Analysis.deleteOne({ _id: req.params.id, user: req.user._id });

      if (storagePath) {
        await fs.unlink(storagePath).catch(() => {});
      }
    } else {
      deletedAnalysis = deleteMemoryAnalysisById(req.user._id, req.params.id);
      if (!deletedAnalysis) {
        return res.status(404).json({ message: 'Analysis not found.' });
      }

      const storagePath = deletedAnalysis.storagePath || '';
      if (storagePath) {
        await fs.unlink(storagePath).catch(() => {});
      }
    }

    return res.json({ message: 'Analysis deleted successfully.', deletedAnalysisId: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete analysis.', error: error.message });
  }
}

async function extractPdfText(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const standardFontDataUrl = path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/');
    const pdfjs = await pdfjsLib.getDocument({
      data,
      standardFontDataUrl,
    }).promise;

    const pages = [];

    for (let pageNum = 1; pageNum <= pdfjs.numPages; pageNum += 1) {
      const page = await pdfjs.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str || '').join(' ');
      pages.push(text);
    }

    return pages.join('\n').trim();
  } catch (error) {
    console.warn('PDF parse failed, falling back to raw text extraction.', error.message);
    return '';
  }
}

async function extractPdfAtsContent(buffer) {
  try {
    const data = new Uint8Array(buffer);
    const standardFontDataUrl = path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts/');
    const document = await pdfjsLib.getDocument({ data, standardFontDataUrl }).promise;
    const lines = [];
    const links = [];

    for (let pageNum = 1; pageNum <= document.numPages; pageNum += 1) {
      const page = await document.getPage(pageNum);
      const content = await page.getTextContent();
      const rows = new Map();

      content.items.forEach((item) => {
        const value = String(item.str || '').trim();
        if (!value) return;
        const y = Math.round(item.transform?.[5] || 0);
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push({ value, x: item.transform?.[4] || 0 });
      });

      rows.forEach((items) => {
        const line = items.sort((left, right) => left.x - right.x).map((item) => item.value).join(' ').replace(/\s+/g, ' ').trim();
        if (line) lines.push(line);
      });

      const annotations = await page.getAnnotations();
      annotations.forEach((annotation) => {
        const url = annotation.url || annotation.unsafeUrl;
        if (url) links.push(url);
      });
    }

    return { text: lines.join('\n'), lines, links };
  } catch (error) {
    console.warn('ATS PDF parse failed.', error.message);
    return { text: '', lines: [], links: [] };
  }
}
