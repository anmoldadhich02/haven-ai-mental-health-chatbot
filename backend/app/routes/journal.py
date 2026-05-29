from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.db.database import (
    save_journal,
    get_journals,
    delete_journal
)

router = APIRouter()


class JournalRequest(BaseModel):
    content: str = Field(..., min_length=1)


@router.post("/")
def add_journal(request: JournalRequest):
    save_journal(request.content)

    return {
        "message": "Journal saved successfully"
    }


@router.get("/")
def view_journals():
    journals = get_journals()

    return {
        "journals": [
            {
                "id": row[0],
                "content": row[1],
                "created_at": row[2]
            }
            for row in journals
        ]
    }


@router.delete("/{journal_id}")
def remove_journal(journal_id: int):
    deleted = delete_journal(journal_id)

    if not deleted:
        return {
            "message": "Journal not found"
        }

    return {
        "message": "Journal deleted"
    }