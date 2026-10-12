from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from config import db
from schemas.Schemas import (
    ChatRequest,
    ChatResponse
)
from utils import ID
import traceback
from service.chat_service import ChatService


router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: Request,
    body: ChatRequest,
    db: Session = Depends(db.connect_db)
):
    try:
        user_id = ID.get(request)

        answer = ChatService(db).chat(
            contract_id=body.contract_id,
            user_id=user_id,
            user_question=body.user_question
        )

        return ChatResponse(answer=answer)

    except HTTPException:
        raise

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/health")
async def health():
    return {
        "status": "running"
    }