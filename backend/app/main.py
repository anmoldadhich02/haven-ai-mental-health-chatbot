#Hello this is change for feature branch 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat
from app.routes import mood
from app.routes import journal
from app.db.database import create_tables

app = FastAPI(
    title="Mental Health Chatbot API",
    description="Backend API for Haven - an AI-powered mental wellness companion.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later replace with deployed frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(mood.router, prefix="/mood", tags=["Mood"])
app.include_router(journal.router, prefix="/journal", tags=["Journal"])


@app.get("/")
def home():
    return {
        "status": "running",
        "message": "Haven Backend is live 🚀",
        "features": [
            "AI Chat",
            "Memory System",
            "Mood Tracking",
            "Journal System",
            "Risk Detection",
            "Chat History"
        ],
        "docs": "http://127.0.0.1:8000/docs",
        "disclaimer": "This chatbot provides emotional support and is not a replacement for professional mental health care."
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Haven Mental Health Chatbot API"
    }


@app.get("/health/ai")
def ai_health_check():
    from app.services.llm import get_groq_api_key, get_groq_client
    key = get_groq_api_key()
    if not key:
        return {"status": "error", "message": "No GROQ_API_KEY configured"}
    try:
        c = get_groq_client()
        models = [m.id for m in c.models.list().data]
        return {
            "status": "connected",
            "key_configured": True,
            "models_available": models
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
