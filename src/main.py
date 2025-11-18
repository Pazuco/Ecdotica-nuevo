main.py"""\nMain application entry point for Ecdotica Editorial Platform.\nFastAPI-based backend for digital editing, NLP analysis, and blockchain integration.\n"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from src.api import text_router, review_router, blockchain_router

# Initialize FastAPI app
app = FastAPI(
    title="Ecdotica Editorial API",
    description="Platform para edici\u00f3n digital, an\u00e1lisis textual y gesti\u00f3n de variantes",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(text_router.router, prefix="/api/v1/text", tags=["Text Analysis"])
app.include_router(review_router.router, prefix="/api/v1/review", tags=["Editorial Review"])
app.include_router(blockchain_router.router, prefix="/api/v1/blockchain", tags=["Blockchain"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Ecdotica Editorial Platform API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
