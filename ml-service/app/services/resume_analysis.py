import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


TECHNICAL_SKILLS = {
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'golang', 'ruby', 'php', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'node', 'sql', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis',
    'fastapi', 'express', 'spring', 'django', 'flask', 'nextjs', 'tailwind', '.net', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'html', 'css', 'cypress', 'pytest', 'jest', 'git', 'ci/cd', 'terraform',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'pandas', 'numpy', 'scikit-learn',
    'tensorflow', 'pytorch', 'opencv', 'data analysis', 'data science', 'data engineering', 'etl',
    'spark', 'airflow', 'api design', 'microservices', 'linux', 'agile', 'power bi', 'tableau',
}

ROLE_PROFILES = {
    'Frontend Engineer': 'frontend web developer user interface accessibility responsive design javascript typescript react angular vue css html testing',
    'Backend Engineer': 'backend server APIs databases distributed systems python java node express fastapi sql security',
    'Full Stack Engineer': 'full stack web application frontend backend javascript typescript react node APIs sql deployment',
    'Data Scientist': 'data science statistics experimentation machine learning python pandas numpy sql visualization',
    'Machine Learning Engineer': 'machine learning model training deployment python pytorch tensorflow nlp computer vision data pipelines',
    'DevOps Engineer': 'devops cloud infrastructure automation ci cd docker kubernetes aws azure terraform linux monitoring',
    'Product Designer': 'product design user research prototyping interaction design accessibility figma usability testing',
}

SECTION_PATTERNS = {
    'Summary': r'^(professional summary|summary|career objective|objective)$',
    'Experience': r'^(work experience|professional experience|employment history|work history|experience)$',
    'Projects': r'^(selected projects|personal projects|projects|project experience)$',
    'Skills': r'^(technical skills|core skills|key skills|skills|technologies)$',
    'Education': r'^(education|academic background)$',
    'Certifications': r'^(certifications|licenses|certificates)$',
}

SCORING_METHOD = 'tfidf_cosine_weighted_v1'


def normalize_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text or '').strip().lower()


def contains_term(text: str, term: str) -> bool:
    escaped = re.escape(term.lower()).replace(r'\ ', r'\s+')
    return bool(re.search(r'(?<![a-z0-9])' + escaped + r'(?![a-z0-9])', text.lower()))


def extract_skill_mentions(text: str):
    cleaned = normalize_text(text)
    return sorted(skill for skill in TECHNICAL_SKILLS if contains_term(cleaned, skill))


def build_skill_analysis(job_skills, resume_skills):
    matched = sorted(resume_skills & job_skills)
    missing = sorted(job_skills - resume_skills)
    return {'matched': matched[:12], 'missing': missing[:12], 'partial': []}


def find_skill_evidence(resume_text: str, skills):
    """Return short excerpts copied from the resume for detected skill mentions."""
    evidence = {}
    for skill in skills:
        escaped = re.escape(skill).replace(r'\ ', r'\s+')
        match = re.search(r'(?<![a-z0-9])' + escaped + r'(?![a-z0-9])', resume_text, re.IGNORECASE)
        if not match:
            continue
        start = max(0, match.start() - 48)
        end = min(len(resume_text), match.end() + 72)
        excerpt = re.sub(r'\s+', ' ', resume_text[start:end]).strip()
        if start > 0:
            excerpt = f'…{excerpt}'
        if end < len(resume_text):
            excerpt = f'{excerpt}…'
        evidence[skill] = excerpt
    return evidence


def categorize_skills(skills):
    categories = {
        'Languages': {'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'golang', 'ruby', 'php', 'swift', 'kotlin', 'sql'},
        'Frameworks': {'react', 'angular', 'vue', 'node', 'express', 'fastapi', 'spring', 'django', 'flask', 'nextjs', 'tailwind'},
        'ML / AI': {'machine learning', 'deep learning', 'nlp', 'computer vision', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'opencv', 'data science', 'data analysis'},
        'Databases': {'mongodb', 'postgresql', 'mysql', 'sqlite', 'sql', 'redis'},
        'Cloud': {'aws', 'azure', 'gcp'},
        'DevOps': {'docker', 'kubernetes', 'ci/cd', 'terraform', 'linux', 'git'},
        'Tools': {'cypress', 'pytest', 'jest', 'api design', 'microservices', 'etl', 'spark', 'airflow', 'power bi', 'tableau', 'agile'},
    }
    result = {name: sorted(skill for skill in skills if skill in members) for name, members in categories.items()}
    return {name: values for name, values in result.items() if values}


def fit_tfidf_pair(resume_text: str, job_description: str):
    resume = normalize_text(resume_text)
    job = normalize_text(job_description)
    role_texts = list(ROLE_PROFILES.values())
    documents = [resume, job, f'{resume} {job}', *role_texts]
    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents='unicode',
        stop_words='english',
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=3000,
    )
    matrix = vectorizer.fit_transform(documents)
    similarity = float(cosine_similarity(matrix[0], matrix[1])[0, 0]) if resume and job else 0.0
    job_weights = matrix[1].toarray().ravel()
    terms = vectorizer.get_feature_names_out()
    ranked_terms = sorted(
        ((str(terms[index]), float(weight)) for index, weight in enumerate(job_weights) if weight > 0 and len(str(terms[index])) > 2),
        key=lambda item: item[1],
        reverse=True,
    )
    role_start = 3
    role_scores = cosine_similarity(matrix[role_start:], matrix[2]).ravel()
    ranked_roles = sorted(
        ({'role': role, 'confidence': round(float(score), 4)} for role, score in zip(ROLE_PROFILES, role_scores)),
        key=lambda item: item['confidence'],
        reverse=True,
    )
    return similarity, ranked_terms, ranked_roles


def score_resume_sections(resume_text: str):
    lines = [line.strip().rstrip(':').lower() for line in (resume_text or '').splitlines()]
    sections = []
    for name, pattern in SECTION_PATTERNS.items():
        detected = any(re.fullmatch(pattern, line) for line in lines)
        sections.append({'section': name, 'status': 'Detected' if detected else 'Not found', 'score': 100 if detected else 0})
    return sections


def build_improvement_insights(missing_terms, has_metrics):
    if not missing_terms and has_metrics:
        return [{'title': 'Strong role coverage', 'description': 'The resume includes measurable outcomes and the prominent terms identified in this job description.'}]
    insights = [
        {'title': f'Add evidence for {term.title()}', 'description': f'This job description emphasizes “{term}”. Include it where your actual experience supports it.'}
        for term in missing_terms[:3]
    ]
    if not has_metrics:
        insights.append({'title': 'Quantify your impact', 'description': 'Add truthful numbers to describe the scale or outcomes of your work, such as users supported, time saved, or reliability improved.'})
    return insights[:4]


def analyze_resume(resume_text: str, job_description: str):
    resume_text = resume_text or ''
    job_description = job_description or ''
    normalized_resume = normalize_text(resume_text)
    normalized_job = normalize_text(job_description)

    # The pair-fitted TF-IDF model learns term weights from these documents and
    # estimates semantic-style similarity using cosine distance in vector space.
    semantic_similarity, ranked_terms, ranked_roles = fit_tfidf_pair(resume_text, job_description)

    resume_skills = set(extract_skill_mentions(resume_text))
    job_skills = set(extract_skill_mentions(job_description))
    skill_analysis = build_skill_analysis(job_skills, resume_skills)
    matched_skills = skill_analysis['matched']
    missing_skills = skill_analysis['missing']
    skill_evidence = find_skill_evidence(resume_text, matched_skills)

    top_job_terms = [term for term, _ in ranked_terms[:12]]
    matched_terms = [term for term in top_job_terms if contains_term(normalized_resume, term)]
    missing_terms = [term for term in top_job_terms if term not in matched_terms]
    skill_coverage = len(matched_skills) / len(job_skills) if job_skills else 0.0
    term_coverage = len(matched_terms) / len(top_job_terms) if top_job_terms else 0.0
    keyword_coverage = round(100 * (0.7 * skill_coverage + 0.3 * term_coverage)) if job_skills else round(100 * term_coverage)
    semantic_score = round(100 * semantic_similarity)
    ats_score = keyword_coverage
    match_score = round(0.6 * ats_score + 0.4 * semantic_score)

    sections = score_resume_sections(resume_text)
    section_scores = {item['section']: item['score'] for item in sections}
    score_breakdown = {
        'skills': round(100 * skill_coverage),
        'semantic': semantic_score,
        'experience': section_scores['Experience'],
        'projects': section_scores['Projects'],
        'keywords': keyword_coverage,
        'education': section_scores['Education'],
    }
    has_metrics = bool(re.search(r'(?:\b\d{1,3}%|\$\s?\d|\b\d{2,}\+?\b)', resume_text))
    section_coverage = sum(item['score'] for item in sections) / max(1, len(sections))
    word_count = len(normalized_resume.split())
    readability_signal = min(100, round(word_count / 250 * 100))
    resume_quality_score = round(0.65 * section_coverage + 0.35 * readability_signal)
    quality_label = 'Strong' if resume_quality_score >= 75 else 'Moderate' if resume_quality_score >= 50 else 'Needs work'

    role_title = ranked_roles[0]['role'] if ranked_roles and ranked_roles[0]['confidence'] > 0 else 'Unclassified role'
    recommendations = []
    if missing_skills:
        recommendations.append(f'If accurate, add evidence of these requested skills: {", ".join(missing_skills[:4])}.')
    elif missing_terms:
        recommendations.append(f'Use relevant job language where it accurately describes your experience: {", ".join(missing_terms[:4])}.')
    if not has_metrics:
        recommendations.append('Add truthful, measurable outcomes to experience or project bullets.')
    if not any(item['section'] == 'Experience' and item['score'] for item in sections):
        recommendations.append('Add a clearly labeled experience section, including relevant projects if you are early in your career.')
    if not recommendations:
        recommendations.append('Tailor the summary and strongest accomplishment to the most important needs in this job description.')

    strengths = matched_skills[:4] or matched_terms[:4]
    weaknesses = missing_skills[:4] or missing_terms[:4]
    summary = (
        f'TF-IDF text similarity is {semantic_score}%, with {keyword_coverage}% estimated keyword coverage for this job description. '
        'These are text-based estimates and do not predict an employer’s ATS decision.'
    )
    requirements = []
    for skill in sorted(job_skills):
        requirements.append({'keyword': skill.title(), 'importance': 'Detected frequently' if contains_term(normalized_job, skill) else 'Detected'})
    if not requirements:
        requirements = [{'keyword': term.title(), 'importance': 'High relevance'} for term in top_job_terms[:8]]

    return {
        'overall_score': match_score,
        'match_score': match_score,
        'ats_score': ats_score,
        'semantic_similarity': round(semantic_similarity, 4),
        'scoring_method': SCORING_METHOD,
        'scoring_details': {
            'model': 'TF-IDF unigram/bigram vectorizer with cosine similarity',
            'match_formula': '60% job-description keyword coverage + 40% TF-IDF cosine similarity',
            'keyword_score_note': 'This analysis uses job-description keyword coverage as its ATS-related component; it is not the separate resume-only ATS readiness score.',
            'score_components': {
                'keyword_coverage': {'score': ats_score, 'weight_percent': 60, 'contribution': round(ats_score * 0.6, 1)},
                'tfidf_similarity': {'score': semantic_score, 'weight_percent': 40, 'contribution': round(semantic_score * 0.4, 1)},
            },
            'keyword_coverage_percent': keyword_coverage,
            'resume_quality_note': 'Section and text-length signals are transparent heuristics.',
        },
        'matching_skills': matched_skills[:8],
        'missing_skills': missing_skills[:8],
        'job_role_prediction': role_title,
        'recommendations': recommendations[:4],
        'summary': summary,
        'score_breakdown': score_breakdown,
        'skill_analysis': skill_analysis,
        'skill_evidence': skill_evidence,
        'predicted_roles': ranked_roles[:4],
        'resume_quality': {'score': resume_quality_score, 'label': quality_label},
        'job_requirements': requirements[:12],
        'keyword_coverage': {
            'percent': keyword_coverage,
            'matched': (matched_skills + matched_terms)[:12],
            'missing': (missing_skills + missing_terms)[:12],
            'partial': [],
        },
        'resume_sections': sections,
        'improvement_insights': build_improvement_insights(missing_skills or missing_terms, has_metrics),
        'explainability': {
            'strengths': strengths or ['No strong shared terms detected yet'],
            'weaknesses': weaknesses or ['Review whether the resume gives enough role-specific evidence'],
        },
        'resume_vs_job_comparison': {
            'resume': (matched_skills + matched_terms)[:12],
            'job': (sorted(job_skills) + top_job_terms)[:12],
        },
        'job_title': role_title,
        'top_skill': matched_skills[0] if matched_skills else (matched_terms[0] if matched_terms else ''),
        'categorized_skills': categorize_skills(matched_skills + missing_skills),
    }
