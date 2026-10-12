import os

from fastapi import Request, HTTPException
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

def get(request: Request):
    token = request.cookies.get("jwtSession")

    if not token:
        raise HTTPException(status_code=401, detail="User is not authenticated")

    try:
        payload = jwt.decode(token, os.getenv("JWT_TOKEN"), algorithms=[os.getenv("ALGORITHM")])
        user_id = payload.get("id")

        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="User is not authenticated")