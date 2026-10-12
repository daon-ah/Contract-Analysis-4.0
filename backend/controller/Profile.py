from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.db import connect_db
from utils.ID import get
from service.Profile import *
from schemas.Schemas import UpdateProfile, ProfileResponse

router = APIRouter()
@router.get(
    "/",
    response_model=ProfileResponse
)
def profile_details(
    request: Request,
    db: Session = Depends(connect_db)
):
    user_id = get(request)

    return get_profile(db, user_id)


@router.put(
    "/",
    response_model=ProfileResponse
)
def edit_profile(
    profile: UpdateProfile,
    request: Request,
    db: Session = Depends(connect_db)
):
    user_id = get(request)

    return update_profile(db, user_id, profile)