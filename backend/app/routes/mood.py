from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.db.database import save_mood, get_moods

router = APIRouter()


class MoodRequest(BaseModel):
    mood: str = Field(..., min_length=1, max_length=50)


@router.post("/")
def add_mood(request: MoodRequest):
    mood = request.mood.strip()

    save_mood(mood)

    return {
        "message": "Mood saved successfully",
        "mood": mood
    }


@router.get("/")
def view_moods():
    moods = get_moods()

    return {
        "moods": [
            {
                "id": row[0],
                "mood": row[1],
                "created_at": row[2]
            }
            for row in moods
        ]
    }