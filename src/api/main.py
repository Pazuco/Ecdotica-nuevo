"""
API Editorial Profesional para Editorial Nuevo Milenio
Sistema completo para gestión, evaluación y edición de manuscritos
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import re

# Configuración de la API
app = FastAPI(
    title="Ecdotica API - Editorial Nuevo Milenio",
    version="2.0.0",
    description="Sistema profesional de gestión editorial"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecdotica.com", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
# MODELOS DE DATOS
# ======================

class ManuscriptSubmission(BaseModel):
    """Modelo para envío de manuscritos"""
    title: str = Field(..., description="Título del manuscrito")
    author: str = Field(..., description="Nombre del autor")
    email: str = Field(..., description="Email del autor")
    content: str = Field(..., description="Contenido del manuscrito")
    genre: Optional[str] = Field(None, description="Género literario")
    summary: Optional[str] = Field(None, description="Resumen")

class ManuscriptAnalysis(BaseModel):
    """Solicitud de análisis de manuscrito"""
    manuscript_id: Optional[str] = None
    content: str = Field(..., description="Contenido a analizar")
    analysis_type: str = Field(default="complete", description="Tipo: complete, basic, critical")

class EditorialDecision(BaseModel):
    """Decisión editorial sobre manuscrito"""
    manuscript_id: str
    decision: str = Field(..., description="accepted, rejected, revision_needed")
    feedback: str
    editor_name: str

# ======================
# UTILIDADES DE ANÁLISIS
# ======================

def analyze_text_quality(text: str) -> Dict:
    """Análisis de calidad textual profesional"""
    
    # Estadísticas básicas
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    paragraphs = text.split('\n\n')
    
    word_count = len(words)
    sentence_count = len([s for s in sentences if s.strip()])
    paragraph_count = len([p for p in paragraphs if p.strip()])
    
    # Promedio de palabras por oración
    avg_words_per_sentence = word_count / max(sentence_count, 1)
    
    # Análisis de complejidad
    long_words = [w for w in words if len(w) > 8]
    complex_word_ratio = len(long_words) / max(word_count, 1)
    
    # Detección de problemas comunes
    issues = []
    if avg_words_per_sentence > 30:
        issues.append("Oraciones demasiado largas (promedio > 30 palabras)")
    if avg_words_per_sentence < 10:
        issues.append("Oraciones muy cortas (promedio < 10 palabras)")
    if complex_word_ratio > 0.3:
        issues.append("Alto uso de palabras complejas (>30%)")
    
    # Repeticiones
    word_freq = {}
    for word in words:
        word_lower = word.lower().strip('.,;:!?')
        if len(word_lower) > 4:  # Solo palabras significativas
            word_freq[word_lower] = word_freq.get(word_lower, 0) + 1
    
    repeated_words = {w: c for w, c in word_freq.items() if c > word_count * 0.02}
    
    # Puntuación de calidad (0-100)
    quality_score = 100
    if avg_words_per_sentence > 30 or avg_words_per_sentence < 10:
        quality_score -= 15
    if complex_word_ratio > 0.3:
        quality_score -= 10
    if len(repeated_words) > 5:
        quality_score -= 10
    
    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "paragraph_count": paragraph_count,
        "avg_words_per_sentence": round(avg_words_per_sentence, 2),
        "complex_word_ratio": round(complex_word_ratio, 3),
        "quality_score": quality_score,
        "issues": issues,
        "repeated_words": repeated_words,
        "estimated_reading_time_minutes": round(word_count / 250, 1)
    }

def detect_editorial_issues(text: str) -> Dict:
    """Detecta problemas editoriales comunes"""
    
    issues = []
    
    # Espacios duplicados
    if '  ' in text:
        issues.append({"type": "formatting", "message": "Espacios duplicados detectados"})
    
    # Falta de mayúscula después de punto
    wrong_caps = re.findall(r'\. [a-z]', text)
    if wrong_caps:
        issues.append({"type": "punctuation", "message": f"Posibles errores de mayúscula: {len(wrong_caps)} casos"})
    
    # Diálogos mal formateados
    if text.count('"') % 2 != 0:
        issues.append({"type": "dialogue", "message": "Comillas sin cerrar"})
    
    # Párrafos muy largos
    paragraphs = text.split('\n\n')
    long_paragraphs = [p for p in paragraphs if len(p.split()) > 200]
    if long_paragraphs:
        issues.append({"type": "structure", "message": f"{len(long_paragraphs)} párrafos excesivamente largos (>200 palabras)"})
    
    return {
        "total_issues": len(issues),
        "issues": issues
    }

# ======================
# ENDPOINTS PRINCIPALES
# ======================

@app.get("/")
async def root():
    """Información de la API"""
    return {
        "api": "Ecdotica - Editorial Nuevo Milenio",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": [
            "/manuscripts/submit",
            "/manuscripts/analyze",
            "/manuscripts/decision",
            "/manuscripts/quick-eval"
        ]
    }

@app.post("/api/v1/manuscripts/submit")
async def submit_manuscript(manuscript: ManuscriptSubmission):
    """Recibe un manuscrito nuevo para evaluación"""
    
    # Generar ID único
    import hashlib
    manuscript_id = hashlib.md5(f"{manuscript.title}{datetime.now()}".encode()).hexdigest()[:12]
    
    # Análisis automático inicial
    analysis = analyze_text_quality(manuscript.content)
    
    # Decisión automática preliminar
    auto_decision = "review_needed"
    if analysis["quality_score"] >= 75 and analysis["word_count"] >= 5000:
        auto_decision = "promising"
    elif analysis["quality_score"] < 50:
        auto_decision = "needs_improvement"
    
    return {
        "manuscript_id": manuscript_id,
        "status": "received",
        "submission_date": datetime.now().isoformat(),
        "author": manuscript.author,
        "title": manuscript.title,
        "preliminary_analysis": analysis,
        "auto_decision": auto_decision,
        "message": f"Manuscrito '{manuscript.title}' recibido. ID: {manuscript_id}"
    }

@app.post("/api/v1/manuscripts/analyze")
async def analyze_manuscript(request: ManuscriptAnalysis):
    """Análisis detallado de manuscrito"""
    
    if len(request.content) < 100:
        raise HTTPException(status_code=400, detail="El texto es demasiado corto para analizar")
    
    # Análisis completo
    quality_analysis = analyze_text_quality(request.content)
    editorial_issues = detect_editorial_issues(request.content)
    
    # Recomendaciones
    recommendations = []
    if quality_analysis["quality_score"] < 70:
        recommendations.append("Revisar estructura de oraciones y párrafos")
    if editorial_issues["total_issues"] > 5:
        recommendations.append("Corrección editorial necesaria antes de publicación")
    if quality_analysis["word_count"] < 5000:
        recommendations.append("Considerar ampliar el contenido")
    
    return {
        "analysis_type": request.analysis_type,
        "analyzed_at": datetime.now().isoformat(),
        "quality_analysis": quality_analysis,
        "editorial_issues": editorial_issues,
        "recommendations": recommendations,
        "publication_ready": quality_analysis["quality_score"] >= 80 and editorial_issues["total_issues"] <= 3
    }

@app.post("/api/v1/manuscripts/decision")
async def register_decision(decision: EditorialDecision):
    """Registra decisión editorial sobre un manuscrito"""
    
    if decision.decision not in ["accepted", "rejected", "revision_needed"]:
        raise HTTPException(status_code=400, detail="Decisión inválida")
    
    return {
        "manuscript_id": decision.manuscript_id,
        "decision": decision.decision,
        "decided_at": datetime.now().isoformat(),
        "editor": decision.editor_name,
        "feedback": decision.feedback,
        "status": "registered",
        "next_steps": {
            "accepted": "Enviar contrato y comenzar proceso de edición",
            "rejected": "Enviar carta de rechazo al autor",
            "revision_needed": "Enviar feedback detallado al autor para revisión"
        }.get(decision.decision)
    }

@app.get("/api/v1/manuscripts/quick-eval")
async def quick_evaluation(text: str):
    """Evaluación rápida de texto (para uso en formularios web)"""
    
    if len(text) < 50:
        return {"error": "Texto demasiado corto", "min_length": 50}
    
    analysis = analyze_text_quality(text)
    
    return {
        "words": analysis["word_count"],
        "quality_score": analysis["quality_score"],
        "reading_time": analysis["estimated_reading_time_minutes"],
        "evaluation": "Excelente" if analysis["quality_score"] >= 80 else "Bueno" if analysis["quality_score"] >= 60 else "Necesita mejoras"
    }

@app.get("/health")
async def health_check():
    """Verificación de salud del servicio"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}
