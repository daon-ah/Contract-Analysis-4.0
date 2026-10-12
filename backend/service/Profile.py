from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.User import User
from schemas.Schemas import UpdateProfile


def get_profile(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


def update_profile(db: Session, user_id: int, profile: UpdateProfile):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check email uniqueness
    if profile.email:
        existing = (
            db.query(User)
            .filter(
                User.email == profile.email,
                User.id != user_id
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

    update_data = profile.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user