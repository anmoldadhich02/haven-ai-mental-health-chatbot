from fastapi import FastAPI
from app.routes import mood
from app.routes import chat
from app.db.database import create_tables
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mental Health Chatbot API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_tables()

app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "Mental Health Chatbot Backend is live 🚀",
        "disclaimer": "This chatbot provides emotional support and is not a replacement for professional mental health care."
    }
@app.get("/health")
def health_check():
    return {"status": "healthy"}