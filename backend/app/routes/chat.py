from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.llm import generate_response
from app.services.risk_detection import detect_risk
from app.db.database import save_chat, get_chats, save_memory, get_memories
from app.services.memory_service import extract_memory

router = APIRouter()

chat_history = []


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class MemoryRequest(BaseModel):
    memory: str = Field(..., min_length=1, max_length=1000)


@router.post("/")
def chat(request: ChatRequest):
    user_message = request.message.strip()

    if not user_message:
        return {"error": "Message cannot be empty"}

    risk_level = detect_risk(user_message)

    memory = extract_memory(user_message)
    memory_status = "not_saved"

    if memory:
        saved = save_memory(memory)
        memory_status = "saved" if saved else "already_exists"

    if risk_level == "high":
        safety_reply = (
            "I'm really sorry you're feeling this way. You don't have to face this alone. "
            "Please contact someone you trust right now or reach emergency support immediately.\n\n"
            "India emergency number: 112\n"
            "AASRA mental health helpline: 9152987821"
        )

        save_chat(user_message, safety_reply, risk_level)

        chat_history.append({
            "user": user_message,
            "bot": safety_reply,
            "risk_level": risk_level
        })

        return {
            "user_message": user_message,
            "risk_level": risk_level,
            "bot_reply": safety_reply,
            "history_count": len(chat_history),
            "memory_status": memory_status
        }

    saved_memories = get_memories()
    memory_texts = [row[1] for row in saved_memories]

    bot_reply = generate_response(user_message, chat_history, memory_texts)

    save_chat(user_message, bot_reply, risk_level)

    chat_history.append({
        "user": user_message,
        "bot": bot_reply,
        "risk_level": risk_level
    })

    return {
        "user_message": user_message,
        "risk_level": risk_level,
        "bot_reply": bot_reply,
        "history_count": len(chat_history),
        "memory_status": memory_status
    }


@router.get("/history")
def get_history():
    chats = get_chats()

    return {
        "history": [
            {
                "id": row[0],
                "user_message": row[1],
                "bot_reply": row[2],
                "risk_level": row[3],
                "created_at": row[4]
            }
            for row in chats
        ]
    }


@router.delete("/history")
def clear_history():
    chat_history.clear()
    return {
        "message": "Temporary chat history cleared successfully"
    }


@router.post("/memory")
def add_memory(request: MemoryRequest):
    memory_text = request.memory.strip()
    saved = save_memory(memory_text)

    if not saved:
        return {"message": "Memory already exists"}

    return {"message": "Memory saved successfully"}


@router.get("/memory")
def view_memory():
    memories = get_memories()
    return {
        "memories": [
            {
                "id": row[0],
                "memory": row[1],
                "created_at": row[2]
            }
            for row in memories
        ]
    }


@router.get("/db-history")
def db_history():
    chats = get_chats()
    return {
        "history": [
            {
                "id": row[0],
                "user_message": row[1],
                "bot_reply": row[2],
                "risk_level": row[3],
                "created_at": row[4]
            }
            for row in chats
        ]
    }