import os
import jwt
from passlib.context import CryptContext
from pydantic import EmailStr
from sqlalchemy.orm import Session
from models.OTP import OTP
from models.User import User
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import Response
import random
import smtplib
from schemas.Schemas import SignUp

load_dotenv();

pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

def signup(data: SignUp, db: Session):
    email_clean = data.email.lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()

    if (existing_user):
        raise ValueError("User already exists")

    hashed_password = pwd_context.hash(data.password)

    new_user = User(
        name = data.name,
        email = email_clean,
        password = hashed_password,
        phone = data.phone,
        law_firm = data.law_firm,
        role = data.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return "User created successfully"

def login(email: EmailStr, password: str, db: Session, response: Response):
    existing_user = db.query(User).filter(User.email == email).first()

    if (not existing_user):
        raise ValueError("User does not exist")

    if (not pwd_context.verify(password, existing_user.password)):
        raise ValueError("Password is incorrect")

    expiry = datetime.now(timezone.utc) + timedelta(hours=2)

    payload = {"id": existing_user.id, "exp": expiry}
    SECRET_KEY = os.getenv("JWT_TOKEN")
    ALGO = os.getenv("ALGORITHM")

    token = jwt.encode(payload, SECRET_KEY, ALGO)
    response.set_cookie(
        key = "jwtSession",
        value = token,
        httponly = True,
        samesite = "lax"
    )

    return "Logged in Successfully"

def sendOTP(email: EmailStr, db: Session):
    existing_user=db.query(User).filter(User.email==email).first()

    if (not existing_user):
        raise ValueError("User does not exist")

    otp = random.randint(100000, 999999)
    s = smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT")))
    s.starttls()
    s.login(os.getenv("EMAIL_USERNAME"), os.getenv("EMAIL_PASSWORD"))

    msg = "Your OTP to reset your password is " + str(otp);
    s.sendmail(os.getenv("EMAIL_USERNAME"), email, msg)
    s.quit()

    existing_otp=db.query(OTP).filter(OTP.email==email).first()

    if (existing_otp):
        db.delete(existing_otp)
        db.commit()

    new_otp=OTP(email=email, otp=otp)
    db.add(new_otp)
    db.commit()

    return "OTP generated successfully"

def change_password_otp(email: EmailStr, otp: int, password: str, db: Session):
    existing_user = db.query(User).filter(User.email == email).first()

    if (not existing_user):
        raise ValueError("User does not exist")

    existing_otp=db.query(OTP).filter(OTP.email==email).first()

    if (existing_otp == None):
        raise ValueError("OTP is not generated")

    if (existing_otp.otp != otp):
        raise ValueError("OTP is invalid")

    db.delete(existing_otp)

    existing_user.password = pwd_context.hash(password)
    db.commit()
    db.refresh(existing_user)

    return "Password changed successfully"