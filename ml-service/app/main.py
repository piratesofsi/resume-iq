from fastapi import FastAPI
from pydantic import BaseModel

from app.services.resume_analysis import analyze_resume

app = FastAPI(title='ResumeIQ ML Service', version='2.0.0')


class AnalysisRequest(BaseModel):
    resume_text: str
    job_description: str


@app.get('/health')
def health_check():
    return {
        'status': 'ok',
        'service': 'resumeiq-ml',
        'model': 'scikit-learn TF-IDF with cosine similarity',
        'scoring_method': 'tfidf_cosine_weighted_v1',
    }


@app.post('/analyze')
def analyze(payload: AnalysisRequest):
    return analyze_resume(payload.resume_text, payload.job_description)
