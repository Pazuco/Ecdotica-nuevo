from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Ecdotica API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecdotica.com", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
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
        "message": "NLP analysis - to be enhanced with spaCy",
    }
