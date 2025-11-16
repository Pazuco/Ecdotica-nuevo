from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Ecdotica API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecdotica.com", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class TextAnalysisRequest(BaseModel):
    text: str
    options: dict = {}

@app.post("/api/v1/text/analyze")
async def analyze_text(request: TextAnalysisRequest):
    words = request.text.split()
    return {
        "word_count": len(words),
        "char_count": len(request.text),
        "message": "NLP analysis - to be enhanced with spaCy"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Ecdotica API - Editorial Digital Platform",
        "docs": "/docs",
        "health": "/health"
    }
