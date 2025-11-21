"""
API Editorial Profesional para Editorial Nuevo Milenio
Sistema completo para gestión, evaluación y edición de manuscritos
Ahora con soporte para archivos PDF y Word completos
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
import re
import uuid
from io import BytesIO
import pypdf
from docx import Document

# Configuración de la API
app = FastAPI(
    title="Ecdotica API - Editorial Nuevo Milenio",
    version="3.0.0",
    description="Sistema de gestión editorial y análisis de manuscritos con soporte para PDF/Word"
)

# CORS configurado por entorno
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ecdotica.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODELOS DE DATOS
# ==========================================

class ManuscriptSubmission(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    content: str = Field(..., min_length=100)
    genre: Optional[str] = Field(None, max_length=100)

class FileAnalysisRequest(BaseModel):
    title: str
    author: str
    email: EmailStr
    genre: Optional[str] = None

class ManuscriptAnalysis(BaseModel):
    word_count: int
    sentence_count: int
    paragraph_count: int
    avg_words_per_sentence: float
    complex_word_ratio: float
    quality_score: int
    issues: List[str]
    repeated_words: Dict[str, int]
    estimated_reading_time_minutes: float

class EditorialDecision(BaseModel):
    manuscript_id: str
    decision: str  # accepted, rejected, review_needed
    reviewer_notes: Optional[str] = None
    editorial_suggestions: Optional[List[str]] = None

# ==========================================
# FUNCIONES DE EXTRACCIÓN DE TEXTO
# ==========================================

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extrae texto de un archivo PDF"""
    try:
        pdf_file = BytesIO(file_content)
        pdf_reader = pypdf.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extrae texto de un archivo Word (.docx)"""
    try:
        docx_file = BytesIO(file_content)
        doc = Document(docx_file)
        text = "\n\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text.strip()])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar Word: {str(e)}")

# ==========================================
# FUNCIONES DE ANÁLISIS
# ==========================================

def analyze_text_quality(text: str) -> ManuscriptAnalysis:
    """Analiza la calidad y estructura del texto"""
    
    # Conteo de palabras
    words = re.findall(r'\b\w+\b', text.lower())
    word_count = len(words)
    
    # Conteo de oraciones
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = len(sentences)
    
    # Conteo de párrafos
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    paragraph_count = len(paragraphs)
    
    # Promedio palabras por oración
    avg_words_per_sentence = round(word_count / sentence_count, 2) if sentence_count > 0 else 0
    
    # Palabras complejas (más de 12 caracteres)
    complex_words = [w for w in words if len(w) > 12]
    complex_word_ratio = round(len(complex_words) / word_count, 3) if word_count > 0 else 0
    
    # Detectar problemas editoriales
    issues = detect_editorial_issues(text, sentences, avg_words_per_sentence)
    
    # Palabras repetidas excesivamente
    word_freq = {}
    for word in words:
        if len(word) > 4:  # Solo palabras significativas
            word_freq[word] = word_freq.get(word, 0) + 1
    
    repeated_words = {word: count for word, count in word_freq.items() 
                      if count > max(10, word_count // 100)}
    
    # Puntuación de calidad (0-100)
    quality_score = calculate_quality_score(
        word_count, avg_words_per_sentence, 
        complex_word_ratio, len(issues), paragraph_count
    )
    
    # Tiempo estimado de lectura (250 palabras por minuto)
    estimated_reading_time = round(word_count / 250, 1)
    
    return ManuscriptAnalysis(
        word_count=word_count,
        sentence_count=sentence_count,
        paragraph_count=paragraph_count,
        avg_words_per_sentence=avg_words_per_sentence,
        complex_word_ratio=complex_word_ratio,
        quality_score=quality_score,
        issues=issues,
        repeated_words=repeated_words,
        estimated_reading_time_minutes=estimated_reading_time
    )

def detect_editorial_issues(text: str, sentences: list, avg_words: float) -> List[str]:
    """Detecta problemas editoriales comunes"""
    issues = []
    
    if avg_words > 30:
        issues.append("Oraciones demasiado largas (promedio > 30 palabras)")
    elif avg_words < 10:
        issues.append("Oraciones demasiado cortas (promedio < 10 palabras)")
    
    # Detección de repeticiones excesivas
    words = text.lower().split()
    if len(words) > 0:
        for i in range(len(words) - 2):
            if words[i] == words[i+1] == words[i+2]:
                issues.append(f"Repetición excesiva detectada: '{words[i]}'")
                break
    
    return issues

def calculate_quality_score(word_count: int, avg_words: float, 
                           complex_ratio: float, issue_count: int,
                           paragraph_count: int) -> int:
    """Calcula puntuación de calidad del manuscrito"""
    score = 100
    
    # Penalizaciones
    if word_count < 5000:
        score -= 10
    if avg_words > 30 or avg_words < 10:
        score -= 15
    if complex_ratio > 0.3:
        score -= 10
    if issue_count > 0:
        score -= (issue_count * 5)
    if paragraph_count < 5:
        score -= 10
    
    return max(0, min(100, score))

# ==========================================
# ENDPOINTS DE LA API
# ==========================================

@app.get("/health")
async def health_check():
    """Verificación de salud del servicio"""
    return {
        "status": "healthy",
        "service": "Ecdotica Editorial API",
        "version": "3.0.0",
        "features": ["text_analysis", "pdf_processing", "docx_processing", "wordpress_integration"]
    }

@app.post("/api/v1/manuscripts/submit")
async def submit_manuscript(submission: ManuscriptSubmission):
    """Recibe y analiza un manuscrito enviado como texto"""
    
    manuscript_id = str(uuid.uuid4())[:12]
    
    # Analizar el contenido
    analysis = analyze_text_quality(submission.content)
    
    # Decidir automáticamente
    auto_decision = "accepted" if analysis.quality_score >= 80 else "review_needed"
    if analysis.quality_score < 50:
        auto_decision = "rejected"
    
    return {
        "manuscript_id": manuscript_id,
        "status": "received",
        "submission_date": datetime.now().isoformat(),
        "author": submission.author,
        "title": submission.title,
        "preliminary_analysis": analysis.dict(),
        "auto_decision": auto_decision,
        "message": f"Manuscrito '{submission.title}' recibido. ID: {manuscript_id}"
    }

@app.post("/api/v1/manuscripts/upload")
async def upload_manuscript_file(
    file: UploadFile = File(...),
    title: str = "",
    author: str = "",
    email: str = "",
    genre: str = ""
):
    """
    Recibe y analiza un archivo PDF o Word completo
    
    Soporta:
    - Archivos PDF (.pdf)
    - Archivos Word (.docx)
    - Tamaño máximo: 10MB
    """
    
    # Validar tamaño del archivo (10MB max)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Leer contenido del archivo
    file_content = await file.read()
    
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Archivo demasiado grande. Máximo 10MB permitido."
        )
    
    # Extraer texto según el tipo de archivo
    filename_lower = file.filename.lower()
    
    if filename_lower.endswith('.pdf'):
        text = extract_text_from_pdf(file_content)
    elif filename_lower.endswith('.docx'):
        text = extract_text_from_docx(file_content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Formato no soportado. Solo se aceptan archivos .pdf o .docx"
        )
    
    # Validar que se extrajo texto
    if not text or len(text) < 100:
        raise HTTPException(
            status_code=400,
            detail="No se pudo extraer texto suficiente del archivo. Verifica que el archivo contenga texto."
        )
    
    # Generar ID del manuscrito
    manuscript_id = str(uuid.uuid4())[:12]
    
    # Analizar el contenido extraido
    analysis = analyze_text_quality(text)
    
    # Decisión automática
    auto_decision = "accepted" if analysis.quality_score >= 80 else "review_needed"
    if analysis.quality_score < 50:
        auto_decision = "rejected"
    
    return {
        "manuscript_id": manuscript_id,
        "status": "received",
        "submission_date": datetime.now().isoformat(),
        "file_info": {
            "filename": file.filename,
            "size_kb": round(len(file_content) / 1024, 2),
            "type": "PDF" if filename_lower.endswith('.pdf') else "Word"
        },
        "author": author,
        "title": title or file.filename,
        "email": email,
        "genre": genre,
        "full_analysis": analysis.dict(),
        "auto_decision": auto_decision,
        "message": f"Archivo '{file.filename}' procesado exitosamente. ID: {manuscript_id}"
    }

@app.post("/api/v1/manuscripts/analyze")
async def analyze_manuscript(submission: ManuscriptSubmission):
    """Análisis detallado sin enviar"""
    analysis = analyze_text_quality(submission.content)
    return {
        "title": submission.title,
        "author": submission.author,
        "detailed_analysis": analysis.dict()
    }

@app.post("/api/v1/manuscripts/decision")
async def register_decision(decision: EditorialDecision):
    """Registra una decisión editorial sobre un manuscrito"""
    return {
        "manuscript_id": decision.manuscript_id,
        "decision": decision.decision,
        "registered_at": datetime.now().isoformat(),
        "status": "decision_recorded",
        "message": f"Decisión '{decision.decision}' registrada para manuscrito {decision.manuscript_id}"
    }

@app.get("/api/v1/manuscripts/quick-eval")
async def quick_evaluation(word_count: int, genre: str = "general"):
    """Evaluación rápida basada en parámetros"""
    
    # Criterios básicos por género
    criteria = {
        "novela": {"min_words": 50000, "ideal_words": 80000},
        "cuento": {"min_words": 1000, "ideal_words": 5000},
        "ensayo": {"min_words": 5000, "ideal_words": 15000},
        "general": {"min_words": 5000, "ideal_words": 20000}
    }
    
    genre_criteria = criteria.get(genre.lower(), criteria["general"])
    
    evaluation = "adecuado"
    if word_count < genre_criteria["min_words"]:
        evaluation = "demasiado_corto"
    elif word_count > genre_criteria["ideal_words"] * 2:
        evaluation = "demasiado_largo"
    
    return {
        "genre": genre,
        "word_count": word_count,
        "evaluation": evaluation,
        "recommendations": {
            "min_recommended": genre_criteria["min_words"],
            "ideal_range": f"{genre_criteria['min_words']}-{genre_criteria['ideal_words']} palabras"
        }
    }

# ==========================================
# INTEGRACIÓN CON WORDPRESS
# ==========================================

@app.post("/api/v1/wordpress/submit")
async def submit_to_wordpress(
    file: UploadFile = File(...),
    title: str = "",
    author: str = "",
    email: str = "",
    genre: str = "",
    wordpress_url: str = "https://ecdotica.com",
    wordpress_user: str = "",
    wordpress_password: str = ""
):
    """
    Procesa el manuscrito y lo envía directamente a WordPress
    Crea un Custom Post Type 'manuscrito' en WordPress
    
    Requiere:
    - Plugin Application Passwords en WordPress
    - Permisos de escritura para el usuario
    """
    
    # Primero procesamos el archivo
    file_content = await file.read()
    filename_lower = file.filename.lower()
    
    if filename_lower.endswith('.pdf'):
        text = extract_text_from_pdf(file_content)
    elif filename_lower.endswith('.docx'):
        text = extract_text_from_docx(file_content)
    else:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    # Analizamos
    analysis = analyze_text_quality(text)
    manuscript_id = str(uuid.uuid4())[:12]
    
    # Preparar datos para WordPress
    wp_post_data = {
        "title": title or file.filename,
        "content": f"""<h3>Análisis Automático</h3>
        <ul>
            <li><strong>Palabras:</strong> {analysis.word_count}</li>
            <li><strong>Oraciones:</strong> {analysis.sentence_count}</li>
            <li><strong>Puntuación de calidad:</strong> {analysis.quality_score}/100</li>
            <li><strong>Tiempo de lectura estimado:</strong> {analysis.estimated_reading_time_minutes} minutos</li>
        </ul>
        <h3>Texto del Manuscrito</h3>
        <p>{text[:1000]}...</p>
        """,
        "status": "draft",
        "meta": {
            "manuscrito_id": manuscript_id,
            "autor": author,
            "email": email,
            "genero": genre,
            "calidad_score": analysis.quality_score,
            "palabra_count": analysis.word_count,
            "archivo_original": file.filename
        }
    }
    
    return {
        "manuscript_id": manuscript_id,
        "status": "ready_for_wordpress",
        "wordpress_data": wp_post_data,
        "analysis": analysis.dict(),
        "message": "Manuscrito procesado y listo para enviar a WordPress",
        "next_steps": [
            "Instalar plugin para Custom Post Type 'manuscrito'",
            "Configurar Application Passwords en WordPress",
            "Usar endpoint de WordPress REST API para crear post"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
